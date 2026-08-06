import crypto from "node:crypto";
import { MercadoPagoConfig, Payment } from "mercadopago";

export function assertMercadoPagoConfigured() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!token || token.includes("seu-access-token") || token.length < 30)
    throw Object.assign(
      new Error(
        "Configure uma credencial válida de teste do Mercado Pago em MERCADO_PAGO_ACCESS_TOKEN.",
      ),
      { status: 503 },
    );
  return token;
}

function client() {
  const accessToken = assertMercadoPagoConfigured();
  return new Payment(
    new MercadoPagoConfig({
      accessToken,
      options: { timeout: 10000 },
    }),
  );
}
export async function createPixPayment({ order, user, idempotencyKey }) {
  const body = {
    transaction_amount: Number(order.total.toFixed(2)),
    description: `Pedido ${order.number} - NOVA Commerce`,
    payment_method_id: "pix",
    external_reference: order._id.toString(),
    notification_url: process.env.MERCADO_PAGO_NOTIFICATION_URL,
    payer: { email: user.email, first_name: user.name.split(" ")[0] },
  };
  return client().create({ body, requestOptions: { idempotencyKey } });
}
export async function getPayment(id) {
  return client().get({ id });
}
export function validWebhook(req) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const signature = req.get("x-signature") || "",
    requestId = req.get("x-request-id") || "",
    dataId = String(
      req.query["data.id"] || req.query.data_id || req.body?.data?.id || "",
    );
  const parts = Object.fromEntries(
    signature.split(",").map((p) => p.split("=")),
  );
  if (!parts.ts || !parts.v1 || !dataId) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const digest = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(parts.v1));
  } catch {
    return false;
  }
}
