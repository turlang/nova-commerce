import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { User, Product, Order, WebhookEvent } from "./models.js";
import { signToken, requireAuth, requireAdmin } from "./auth.js";
import {
  assertMercadoPagoConfigured,
  createPixPayment,
  getPayment,
  validWebhook,
} from "./mercadopago.js";
import { initialProducts } from "./seed-data.js";
import { startOAuth, finishOAuth, exchangeOAuthCode } from "./oauth.js";

const app = express(),
  port = Number(process.env.PORT || 3333),
  __dirname = path.dirname(fileURLToPath(import.meta.url));
const configuredOrigins = (process.env.WEB_URL || "http://localhost:5173")
  .split(",")
  .map((v) => v.trim().replace(/\/$/, ""))
  .filter(Boolean);
const isPrivateDevOrigin = (origin) => {
  if (process.env.NODE_ENV === "production") return false;
  try {
    const { protocol, hostname, port } = new URL(origin);
    if (!["http:", "https:"].includes(protocol) || port !== "5173")
      return false;
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    );
  } catch {
    return false;
  }
};
const corsOrigin = (origin, callback) => {
  if (
    !origin ||
    configuredOrigins.includes(origin.replace(/\/$/, "")) ||
    isPrivateDevOrigin(origin)
  )
    return callback(null, true);
  callback(new Error(`Origem não autorizada: ${origin}`));
};
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(compression());
app.use(
  cors({
    origin: corsOrigin,
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Idempotency-Key"],
  }),
);
app.use(express.json({ limit: "250kb" }));
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
  }),
);
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 25 }));
const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
const cleanUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  addresses: u.addresses,
});
const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().toLowerCase(),
  password: z.string().min(8).max(72),
});
app.get("/api/health", (req, res) =>
  res.json({
    status: "ok",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  }),
);
app.post(
  "/api/auth/register",
  asyncRoute(async (req, res) => {
    const data = registerSchema.parse(req.body);
    if (await User.exists({ email: data.email }))
      return res
        .status(409)
        .json({ message: "Este e-mail já está cadastrado." });
    const user = await User.create({
      ...data,
      passwordHash: await bcrypt.hash(data.password, 12),
    });
    res.status(201).json({ token: signToken(user), user: cleanUser(user) });
  }),
);
app.post(
  "/api/auth/login",
  asyncRoute(async (req, res) => {
    const { email, password } = z
      .object({ email: z.email(), password: z.string().min(1) })
      .parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordHash",
    );
    if (
      !user?.passwordHash ||
      !(await bcrypt.compare(password, user.passwordHash))
    )
      return res.status(401).json({ message: "E-mail ou senha incorretos." });
    res.json({ token: signToken(user), user: cleanUser(user) });
  }),
);
app.get("/api/auth/google", startOAuth("google"));
app.get("/api/auth/google/callback", finishOAuth("google"));
app.get("/api/auth/microsoft", startOAuth("microsoft"));
app.get("/api/auth/microsoft/callback", finishOAuth("microsoft"));
app.post(
  "/api/auth/oauth/exchange",
  asyncRoute(async (req, res) => {
    const { code } = z.object({ code: z.string().min(20) }).parse(req.body),
      user = await exchangeOAuthCode(code);
    res.json({ token: signToken(user), user: cleanUser(user) });
  }),
);
app.get("/api/auth/me", requireAuth, (req, res) =>
  res.json({ user: cleanUser(req.user) }),
);
app.get(
  "/api/products",
  asyncRoute(async (req, res) => {
    const filter = { active: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.q) filter.$text = { $search: String(req.query.q) };
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ products });
  }),
);
app.get(
  "/api/products/:slug",
  asyncRoute(async (req, res) => {
    const product = await Product.findOne({
      slug: req.params.slug,
      active: true,
    });
    if (!product)
      return res.status(404).json({ message: "Produto não encontrado." });
    res.json({ product });
  }),
);
app.post(
  "/api/products",
  requireAuth,
  requireAdmin,
  asyncRoute(async (req, res) =>
    res.status(201).json({ product: await Product.create(req.body) }),
  ),
);
app.put(
  "/api/products/:id",
  requireAuth,
  requireAdmin,
  asyncRoute(async (req, res) =>
    res.json({
      product: await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }),
    }),
  ),
);
app.get(
  "/api/orders/my",
  requireAuth,
  asyncRoute(async (req, res) =>
    res.json({
      orders: await Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .lean(),
    }),
  ),
);
const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
  shippingAddress: z.object({
    recipient: z.string().min(2),
    zip: z.string().min(8),
    street: z.string().min(2),
    number: z.string().min(1),
    complement: z.string().optional().default(""),
    neighborhood: z.string().min(2),
    city: z.string().min(2),
    state: z.string().length(2),
  }),
});
app.post(
  "/api/checkout/pix",
  requireAuth,
  asyncRoute(async (req, res) => {
    assertMercadoPagoConfigured();
    const data = checkoutSchema.parse(req.body),
      slugs = data.items.map((i) => i.slug),
      products = await Product.find({ slug: { $in: slugs }, active: true });
    if (products.length !== slugs.length)
      return res
        .status(400)
        .json({ message: "Um ou mais produtos não estão disponíveis." });
    let subtotal = 0;
    const items = data.items.map((input) => {
      const p = products.find((x) => x.slug === input.slug);
      if (p.stock < input.quantity)
        throw Object.assign(new Error(`Estoque insuficiente para ${p.name}.`), {
          status: 409,
        });
      const total = p.price * input.quantity;
      subtotal += total;
      return {
        product: p._id,
        name: p.name,
        sku: p.slug,
        quantity: input.quantity,
        unitPrice: p.price,
        total,
      };
    });
    const shipping = subtotal >= 299 ? 0 : 24.9,
      number = `NV${Date.now().toString().slice(-9)}`;
    const order = await Order.create({
      number,
      user: req.user._id,
      items,
      shippingAddress: data.shippingAddress,
      subtotal,
      shipping,
      total: subtotal + shipping,
    });
    const idempotencyKey = req.get("x-idempotency-key") || crypto.randomUUID();
    try {
      const payment = await createPixPayment({
        order,
        user: req.user,
        idempotencyKey,
      });
      const tx = payment.point_of_interaction?.transaction_data || {};
      order.payment = {
        provider: "mercadopago",
        method: "pix",
        providerPaymentId: String(payment.id),
        status: payment.status,
        qrCode: tx.qr_code,
        qrCodeBase64: tx.qr_code_base64,
        ticketUrl: tx.ticket_url,
        expiresAt: payment.date_of_expiration,
      };
      await order.save();
      res
        .status(201)
        .json({
          order: {
            id: order._id,
            number: order.number,
            total: order.total,
            status: order.status,
            payment: order.payment,
          },
        });
    } catch (error) {
      order.status = "cancelled";
      await order.save();
      throw error;
    }
  }),
);
app.post(
  "/api/webhooks/mercadopago",
  asyncRoute(async (req, res) => {
    if (!validWebhook(req))
      return res.status(401).json({ message: "Assinatura inválida." });
    res.sendStatus(200);
    const paymentId = req.body?.data?.id || req.query["data.id"];
    if (!paymentId) return;
    const eventId = `payment:${paymentId}:${req.body?.action || "updated"}`;
    if (await WebhookEvent.exists({ eventId })) return;
    const event = await WebhookEvent.create({
      provider: "mercadopago",
      eventId,
      type: req.body?.type,
      payload: req.body,
    });
    try {
      const payment = await getPayment(paymentId),
        order = await Order.findById(payment.external_reference);
      if (order) {
        order.payment.status = payment.status;
        if (payment.status === "approved") {
          order.status = "paid";
          order.paidAt = new Date();
          for (const item of order.items)
            await Product.updateOne(
              { _id: item.product, stock: { $gte: item.quantity } },
              { $inc: { stock: -item.quantity } },
            );
        } else if (["cancelled", "rejected"].includes(payment.status))
          order.status = "cancelled";
        else if (payment.status === "refunded") order.status = "refunded";
        await order.save();
      }
      event.processedAt = new Date();
      await event.save();
    } catch (error) {
      console.error("webhook_processing_error", error.message);
    }
  }),
);
app.get(
  "/api/admin/metrics",
  requireAuth,
  requireAdmin,
  asyncRoute(async (req, res) => {
    const [orders, products, users, revenue] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments({ active: true }),
      User.countDocuments({ role: "customer" }),
      Order.aggregate([
        {
          $match: {
            status: { $in: ["paid", "preparing", "shipped", "delivered"] },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);
    res.json({ orders, products, users, revenue: revenue[0]?.total || 0 });
  }),
);
app.get(
  "/api/admin/products",
  requireAuth,
  requireAdmin,
  asyncRoute(async (req, res) =>
    res.json({ products: await Product.find().sort({ createdAt: -1 }).lean() }),
  ),
);
app.get(
  "/api/admin/users",
  requireAuth,
  requireAdmin,
  asyncRoute(async (req, res) =>
    res.json({
      users: await User.find()
        .select("name email role active createdAt providers")
        .sort({ createdAt: -1 })
        .lean(),
    }),
  ),
);
app.get(
  "/api/admin/orders",
  requireAuth,
  requireAdmin,
  asyncRoute(async (req, res) =>
    res.json({
      orders: await Order.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(200)
        .lean(),
    }),
  ),
);
app.patch(
  "/api/admin/orders/:id/status",
  requireAuth,
  requireAdmin,
  asyncRoute(async (req, res) => {
    const { status } = z
        .object({
          status: z.enum([
            "paid",
            "preparing",
            "shipped",
            "delivered",
            "cancelled",
            "expired",
            "refunded",
          ]),
        })
        .parse(req.body),
      order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true },
      );
    if (!order)
      return res.status(404).json({ message: "Pedido não encontrado." });
    res.json({ order });
  }),
);
app.patch(
  "/api/admin/users/:id/status",
  requireAuth,
  requireAdmin,
  asyncRoute(async (req, res) => {
    if (req.params.id === req.user._id.toString())
      return res
        .status(400)
        .json({
          message: "O administrador não pode bloquear a própria conta.",
        });
    const { active } = z.object({ active: z.boolean() }).parse(req.body),
      user = await User.findByIdAndUpdate(
        req.params.id,
        { active },
        { new: true },
      ).select("name email role active createdAt");
    if (!user)
      return res.status(404).json({ message: "Cliente não encontrado." });
    res.json({ user });
  }),
);
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));
  app.get("/{*splat}", (req, res) =>
    res.sendFile(path.join(__dirname, "../dist/index.html")),
  );
}
app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof z.ZodError)
    return res
      .status(400)
      .json({ message: "Dados inválidos.", issues: err.issues });
  res
    .status(err.status || 500)
    .json({
      message:
        process.env.NODE_ENV === "production"
          ? "Não foi possível concluir a operação."
          : err.message,
    });
});
async function bootstrap() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET)
    throw new Error("Configure MONGODB_URI e JWT_SECRET no arquivo .env");
  await mongoose.connect(process.env.MONGODB_URI);
  await Product.collection
    .createIndex({ name: "text", description: "text" })
    .catch(() => {});
  if (!(await Product.exists({}))) await Product.insertMany(initialProducts);
  if (
    process.env.ADMIN_EMAIL &&
    process.env.ADMIN_PASSWORD &&
    !(await User.exists({ email: process.env.ADMIN_EMAIL.toLowerCase() }))
  )
    await User.create({
      name: "Administrador",
      email: process.env.ADMIN_EMAIL.toLowerCase(),
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
      role: "admin",
    });
  app.listen(port, () => console.log(`NOVA API pronta na porta ${port}`));
}
bootstrap().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
