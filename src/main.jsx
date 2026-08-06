import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  Heart,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
  Minus,
  Plus,
  SlidersHorizontal,
  Package,
  LayoutDashboard,
  ShoppingCart,
  Users,
  Tag,
  TrendingUp,
  LogOut,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import "./styles.css";
import "./commerce.css";
import { api, API_URL } from "./api";

const products = [
  {
    id: 1,
    slug: "tenis-orbit-runner",
    name: "Tênis Orbit Runner",
    cat: "Tênis",
    brand: "NOVA",
    price: 429.9,
    old: 529.9,
    color: "Preto",
    badge: "Best-seller",
    rating: 4.9,
    stock: 18,
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 2,
    slug: "mochila-urban-core",
    name: "Mochila Urban Core",
    cat: "Acessórios",
    brand: "Atelier",
    price: 289.9,
    color: "Preto",
    badge: "Novo",
    rating: 4.8,
    stock: 9,
    img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 3,
    slug: "relogio-meridian",
    name: "Relógio Meridian",
    cat: "Acessórios",
    brand: "Meridian",
    price: 599.9,
    old: 699.9,
    color: "Prata",
    badge: "-14%",
    rating: 4.7,
    stock: 6,
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 4,
    slug: "headphone-studio-one",
    name: "Headphone Studio One",
    cat: "Tecnologia",
    brand: "Sonic",
    price: 749.9,
    color: "Bege",
    badge: "Exclusivo",
    rating: 4.9,
    stock: 12,
    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 5,
    slug: "oculos-horizon",
    name: "Óculos Horizon",
    cat: "Acessórios",
    brand: "Horizon",
    price: 239.9,
    color: "Marrom",
    badge: "Novo",
    rating: 4.6,
    stock: 22,
    img: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 6,
    slug: "camera-pocket-classic",
    name: "Câmera Pocket Classic",
    cat: "Tecnologia",
    brand: "RetroLab",
    price: 899.9,
    color: "Preto",
    badge: "Últimas unidades",
    rating: 4.8,
    stock: 3,
    img: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=85",
  },
];
const money = (v) => {
  const amount = Number(v);
  return Number.isFinite(amount)
    ? amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "R$ 0,00";
};

function App() {
  const [view, setView] = useState("home"),
    [cart, setCart] = useState([]),
    [query, setQuery] = useState(""),
    [cat, setCat] = useState("Todos"),
    [sort, setSort] = useState("featured"),
    [menu, setMenu] = useState(false),
    [toast, setToast] = useState(""),
    [selected, setSelected] = useState(null),
    [coupon, setCoupon] = useState(""),
    [token, setToken] = useState(
      () => localStorage.getItem("nova_token") || "",
    ),
    [user, setUser] = useState(null),
    [catalogProducts, setCatalogProducts] = useState(products);
  useEffect(() => {
    if (token)
      api("/auth/me", { token })
        .then((r) => setUser(r.user))
        .catch(() => {
          localStorage.removeItem("nova_token");
          setToken("");
        });
  }, [token]);
  useEffect(() => {
    api("/products")
      .then(({ products: items }) =>
        setCatalogProducts(
          items.map((p) => ({
            id: p._id,
            slug: p.slug,
            name: p.name,
            cat: p.category,
            brand: p.brand,
            price: p.price,
            old: p.compareAtPrice,
            color: p.color,
            badge: p.badge,
            rating: p.rating,
            stock: p.stock,
            img: p.images?.[0],
          })),
        ),
      )
      .catch(() => {});
  }, []);
  const onAuth = (nextToken, nextUser) => {
    localStorage.setItem("nova_token", nextToken);
    setCart([]);
    setToken(nextToken);
    setUser(nextUser);
    setToast("Acesso realizado com sucesso");
    setTimeout(() => setToast(""), 2200);
  };
  useEffect(() => {
    const params = new URLSearchParams(location.search),
      code = params.get("oauth_code");
    if (code) {
      history.replaceState({}, "", location.pathname);
      api("/auth/oauth/exchange", {
        method: "POST",
        body: JSON.stringify({ code }),
      })
        .then((r) => onAuth(r.token, r.user))
        .catch(() => setToast("Não foi possível concluir o acesso social."));
    } else if (params.get("oauth_error")) {
      history.replaceState({}, "", location.pathname);
      setToast("Provedor social ainda não configurado.");
    }
  }, []);
  const list = useMemo(
    () =>
      catalogProducts
        .filter(
          (p) =>
            (cat === "Todos" || p.cat === cat) &&
            p.name.toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "low"
            ? a.price - b.price
            : sort === "high"
              ? b.price - a.price
              : b.rating - a.rating,
        ),
    [catalogProducts, query, cat, sort],
  );
  const add = (p) => {
    setCart((c) => {
      let e = c.find((x) => x.id === p.id);
      return e
        ? c.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x))
        : [...c, { ...p, qty: 1 }];
    });
    setToast("Produto adicionado ao carrinho");
    setTimeout(() => setToast(""), 2200);
  };
  const total = cart.reduce((s, p) => s + p.price * p.qty, 0),
    count = cart.reduce((s, p) => s + p.qty, 0);
  const nav = (v) => {
    setView(v);
    setMenu(false);
    scrollTo(0, 0);
  };
  return (
    <div className="app">
      <div className="topbar">
        Frete grátis acima de R$ 299 <span>•</span> 10% OFF na primeira compra:{" "}
        <b>BEMVINDO10</b>
      </div>
      <header>
        <button
          className="icon mobile"
          onClick={() => setMenu(!menu)}
          aria-label="Menu"
        >
          <Menu />
        </button>
        <button className="brand" onClick={() => nav("home")}>
          NOVA<span>.</span>
        </button>
        <nav className={menu ? "open" : ""}>
          <button onClick={() => nav("home")}>Início</button>
          <button onClick={() => nav("catalog")}>Novidades</button>
          <button
            onClick={() => {
              setCat("Tênis");
              nav("catalog");
            }}
          >
            Tênis
          </button>
          <button
            onClick={() => {
              setCat("Acessórios");
              nav("catalog");
            }}
          >
            Acessórios
          </button>
          <button onClick={() => nav("catalog")} className="sale">
            Sale
          </button>
        </nav>
        <div className="actions">
          <button
            className="icon"
            onClick={() => nav("catalog")}
            aria-label="Buscar"
          >
            <Search />
          </button>
          <button
            className="icon"
            onClick={() => nav("account")}
            aria-label="Conta"
          >
            <User />
          </button>
          <button
            className="icon bag"
            onClick={() => nav("cart")}
            aria-label="Carrinho"
          >
            <ShoppingBag />
            <i>{count}</i>
          </button>
        </div>
      </header>
      {view === "home" && <Home nav={nav} add={add} />}{" "}
      {view === "catalog" && (
        <Catalog
          list={list}
          query={query}
          setQuery={setQuery}
          cat={cat}
          setCat={setCat}
          sort={sort}
          setSort={setSort}
          add={add}
          setSelected={setSelected}
        />
      )}{" "}
      {view === "cart" && (
        <Cart
          cart={cart}
          setCart={setCart}
          total={total}
          coupon={coupon}
          setCoupon={setCoupon}
          nav={nav}
          token={token}
          user={user}
        />
      )}{" "}
      {view === "account" && (
        <Account
          nav={nav}
          user={user}
          onAuth={onAuth}
          onLogout={() => {
            localStorage.removeItem("nova_token");
            setCart([]);
            setToken("");
            setUser(null);
          }}
        />
      )}{" "}
      {view === "admin" && <Admin token={token} user={user} nav={nav} />}
      <Footer nav={nav} />
      {toast && (
        <div className="toast">
          <CheckCircle2 /> {toast}
        </div>
      )}
      {selected && (
        <ProductModal p={selected} close={() => setSelected(null)} add={add} />
      )}
    </div>
  );
}
function Home({ nav, add }) {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <small>COLEÇÃO ESSENTIALS 2026</small>
          <h1>Design que acompanha o seu ritmo.</h1>
          <p>
            Peças essenciais, materiais premium e tecnologia para uma rotina em
            movimento.
          </p>
          <div>
            <button className="primary" onClick={() => nav("catalog")}>
              Explorar coleção <ArrowRight />
            </button>
            <button className="link" onClick={() => nav("catalog")}>
              Ver lançamentos
            </button>
          </div>
          <div className="hero-stats">
            <span>
              <b>30 dias</b> para trocar
            </span>
            <span>
              <b>4,9/5</b> por clientes
            </span>
            <span>
              <b>Compra</b> protegida
            </span>
          </div>
        </div>
        <div className="hero-image">
          <img src={products[0].img} alt="Tênis vermelho da coleção Orbit" />
          <span className="float-card">
            ORBIT RUNNER<small>Performance urbana</small>
          </span>
        </div>
      </section>
      <section className="benefits">
        <div>
          <Truck />
          <span>
            <b>Frete grátis</b>
            <small>Em compras acima de R$ 299</small>
          </span>
        </div>
        <div>
          <ShieldCheck />
          <span>
            <b>Pagamento seguro</b>
            <small>Seus dados sempre protegidos</small>
          </span>
        </div>
        <div>
          <RotateCcw />
          <span>
            <b>Troca simplificada</b>
            <small>Até 30 dias após a compra</small>
          </span>
        </div>
      </section>
      <section className="section">
        <div className="section-head">
          <div>
            <small>CURADORIA NOVA</small>
            <h2>Escolhas que fazem diferença.</h2>
          </div>
          <button className="link" onClick={() => nav("catalog")}>
            Ver todos <ArrowRight />
          </button>
        </div>
        <div className="product-grid">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} p={p} add={add} />
          ))}
        </div>
      </section>
      <section className="editorial">
        <div>
          <small>NOVA MEMBERS</small>
          <h2>
            Seu estilo.
            <br />
            Suas vantagens.
          </h2>
          <p>
            Entre para o clube e tenha acesso antecipado, benefícios exclusivos
            e recomendações personalizadas.
          </p>
          <button className="light" onClick={() => nav("account")}>
            Criar minha conta <ArrowRight />
          </button>
        </div>
        <div className="editorial-numbers">
          <span>
            <b>10%</b>OFF na primeira compra
          </span>
          <span>
            <b>2x</b>Pontos no mês de aniversário
          </span>
        </div>
      </section>
    </main>
  );
}
function ProductCard({ p, add, setSelected }) {
  return (
    <article className="product">
      <div className="photo" onClick={() => setSelected && setSelected(p)}>
        <img src={p.img} alt={p.name} />
        <em>{p.badge}</em>
        <button className="wish" aria-label="Favoritar">
          <Heart />
        </button>
        <button
          className="quick"
          onClick={(e) => {
            e.stopPropagation();
            add(p);
          }}
        >
          Adicionar
        </button>
      </div>
      <small>
        {p.brand} · {p.cat}
      </small>
      <h3>{p.name}</h3>
      <div className="price">
        <b>{money(p.price)}</b>
        {p.old && <del>{money(p.old)}</del>}
      </div>
      <div className="rating">
        <Star /> {p.rating} <span>({Math.round(p.rating * 23)})</span>
      </div>
    </article>
  );
}
function Catalog({
  list,
  query,
  setQuery,
  cat,
  setCat,
  sort,
  setSort,
  add,
  setSelected,
}) {
  return (
    <main className="catalog section">
      <div className="catalog-title">
        <small>COLEÇÃO COMPLETA</small>
        <h1>Encontre o seu próximo essencial.</h1>
        <p>{list.length} produtos selecionados</p>
      </div>
      <div className="catalog-tools">
        <label className="search">
          <Search />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar produtos..."
          />
        </label>
        <div className="chips">
          {["Todos", "Tênis", "Acessórios", "Tecnologia"].map((c) => (
            <button
              key={c}
              className={cat === c ? "active" : ""}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="select">
          <SlidersHorizontal />
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="featured">Mais relevantes</option>
            <option value="low">Menor preço</option>
            <option value="high">Maior preço</option>
          </select>
        </label>
      </div>
      <div className="product-grid">
        {list.map((p) => (
          <ProductCard key={p.id} p={p} add={add} setSelected={setSelected} />
        ))}
      </div>
      {!list.length && (
        <div className="empty">
          <Search />
          <h2>Nenhum produto encontrado</h2>
          <button
            onClick={() => {
              setQuery("");
              setCat("Todos");
            }}
          >
            Limpar filtros
          </button>
        </div>
      )}
    </main>
  );
}
function Cart({ cart, setCart, total, coupon, setCoupon, nav, token, user }) {
  const [checkout, setCheckout] = useState(false),
    [loading, setLoading] = useState(false),
    [pix, setPix] = useState(null),
    [error, setError] = useState("");
  const update = (id, d) =>
    setCart((c) =>
      c.map((p) => (p.id === id ? { ...p, qty: Math.max(1, p.qty + d) } : p)),
    );
  const pay = async (e) => {
    e.preventDefault();
    if (!token) {
      nav("account");
      return;
    }
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const data = await api("/checkout/pix", {
        method: "POST",
        token,
        headers: {
          "x-idempotency-key":
            globalThis.crypto?.randomUUID?.() ||
            `web-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        },
        body: JSON.stringify({
          items: cart.map((p) => ({ slug: p.slug, quantity: p.qty })),
          shippingAddress: Object.fromEntries(fd),
        }),
      });
      setPix(data.order);
      setCart([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="cart-page section">
      <div className="catalog-title">
        <small>SEU PEDIDO</small>
        <h1>Carrinho de compras</h1>
      </div>
      {pix ? (
        <div className="pix-result">
          <CheckCircle2 />
          <h2>Pix gerado para o pedido {pix.number}</h2>
          <p>
            Total: <b>{money(pix.total)}</b>
          </p>
          {pix.payment.qrCodeBase64 && (
            <img
              src={`data:image/png;base64,${pix.payment.qrCodeBase64}`}
              alt="QR Code Pix"
            />
          )}
          <textarea readOnly value={pix.payment.qrCode || ""} />
          <button
            onClick={() =>
              navigator.clipboard.writeText(pix.payment.qrCode || "")
            }
          >
            Copiar Pix
          </button>
          <small>
            O pedido será atualizado automaticamente após a confirmação do
            Mercado Pago.
          </small>
        </div>
      ) : !cart.length ? (
        <div className="empty">
          <ShoppingBag />
          <h2>Seu carrinho está vazio</h2>
          <p>Explore a coleção e encontre algo especial.</p>
          <button className="primary" onClick={() => nav("catalog")}>
            Ver produtos
          </button>
        </div>
      ) : checkout ? (
        <form className="checkout-form" onSubmit={pay}>
          <button
            type="button"
            className="link"
            onClick={() => setCheckout(false)}
          >
            ← Voltar ao carrinho
          </button>
          <h2>Entrega e pagamento Pix</h2>
          <div className="form-grid">
            <label>
              Destinatário
              <input
                name="recipient"
                defaultValue={user?.name || ""}
                required
              />
            </label>
            <label>
              CEP
              <input name="zip" placeholder="00000-000" required />
            </label>
            <label className="wide">
              Rua
              <input name="street" required />
            </label>
            <label>
              Número
              <input name="number" required />
            </label>
            <label>
              Complemento
              <input name="complement" />
            </label>
            <label>
              Bairro
              <input name="neighborhood" required />
            </label>
            <label>
              Cidade
              <input name="city" required />
            </label>
            <label>
              UF
              <input name="state" maxLength="2" required />
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="primary full" disabled={loading}>
            {loading
              ? "Gerando Pix..."
              : `Gerar Pix de ${money(total + (total >= 299 ? 0 : 24.9))}`}
          </button>
          <div className="secure">
            <ShieldCheck /> Processamento seguro pelo Mercado Pago
          </div>
        </form>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {cart.map((p) => (
              <article key={p.id}>
                <img src={p.img} alt="" />
                <div>
                  <small>{p.brand}</small>
                  <h3>{p.name}</h3>
                  <p>Cor: {p.color}</p>
                  <div className="qty">
                    <button onClick={() => update(p.id, -1)}>
                      <Minus />
                    </button>
                    <span>{p.qty}</span>
                    <button onClick={() => update(p.id, 1)}>
                      <Plus />
                    </button>
                  </div>
                </div>
                <div className="line-price">
                  <b>{money(p.price * p.qty)}</b>
                  <button
                    onClick={() =>
                      setCart((c) => c.filter((x) => x.id !== p.id))
                    }
                  >
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
          <aside className="summary">
            <h2>Resumo</h2>
            <p>
              <span>Subtotal</span>
              <b>{money(total)}</b>
            </p>
            <p>
              <span>Frete</span>
              <b className="green">{total >= 299 ? "Grátis" : money(24.9)}</b>
            </p>
            <label>
              Cupom de desconto
              <div>
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Digite seu cupom"
                />
                <button>Aplicar</button>
              </div>
            </label>
            <hr />
            <p className="grand">
              <span>Total</span>
              <b>{money(total + (total >= 299 ? 0 : 24.9))}</b>
            </p>
            <button
              className="primary full"
              onClick={() => (token ? setCheckout(true) : nav("account"))}
            >
              {token ? "Pagar com Pix" : "Entrar para finalizar"} <ArrowRight />
            </button>
            <div className="secure">
              <ShieldCheck /> Ambiente seguro e criptografado
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
function Account({ nav, user, onAuth, onLogout }) {
  const [mode, setMode] = useState("login"),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const data = await api(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      onAuth(data.token, data.user);
      nav("home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  if (user)
    return (
      <main className="account-page section">
        <div className="member-panel">
          <User />
          <h1>Olá, {user.name}</h1>
          <p>{user.email}</p>
          <button className="primary" onClick={() => nav("cart")}>
            Ir para o carrinho
          </button>
          {user.role === "admin" && (
            <button className="light-admin" onClick={() => nav("admin")}>
              Painel administrativo
            </button>
          )}
          <button className="link" onClick={onLogout}>
            Sair da conta
          </button>
        </div>
      </main>
    );
  return (
    <main className="account-page section">
      <div className="account-card">
        <div className="account-copy">
          <small>NOVA MEMBERS</small>
          <h1>Bem-vindo à sua melhor experiência de compra.</h1>
          <p>
            Acompanhe pedidos, salve favoritos e receba vantagens exclusivas.
          </p>
          <ul>
            <li>
              <CheckCircle2 /> 10% OFF na primeira compra
            </li>
            <li>
              <CheckCircle2 /> Histórico e rastreio de pedidos
            </li>
            <li>
              <CheckCircle2 /> Lista de desejos sincronizada
            </li>
          </ul>
        </div>
        <form onSubmit={submit}>
          <h2>{mode === "login" ? "Entrar" : "Criar conta"}</h2>
          <div className="social-login">
            <button
              type="button"
              onClick={() => (location.href = `${API_URL}/auth/google`)}
            >
              Continuar com Google
            </button>
            <button
              type="button"
              onClick={() => (location.href = `${API_URL}/auth/microsoft`)}
            >
              Continuar com Microsoft
            </button>
          </div>
          <div className="or">
            <span>ou use seu e-mail</span>
          </div>
          {mode === "register" && (
            <label>
              Nome completo
              <input name="name" required minLength="2" />
            </label>
          )}
          <label>
            E-mail
            <input
              name="email"
              type="email"
              placeholder="voce@email.com"
              required
            />
          </label>
          <label>
            Senha
            <input
              name="password"
              type="password"
              placeholder="Mínimo de 8 caracteres"
              minLength="8"
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary full" disabled={loading}>
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar"}
          </button>
          <p>
            {mode === "login" ? "Não tem conta?" : "Já possui conta?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Cadastre-se" : "Entrar"}
            </button>
          </p>
        </form>
      </div>
    </main>
  );
}
function Admin({ token, user, nav }) {
  const [tab, setTab] = useState("Visão geral"),
    [data, setData] = useState([]),
    [metrics, setMetrics] = useState(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [showProductForm, setShowProductForm] = useState(false);
  const load = async () => {
    if (!token || user?.role !== "admin") return;
    setLoading(true);
    setError("");
    try {
      if (tab === "Visão geral") setMetrics(await api("/admin/metrics", { token }));
      if (tab === "Produtos") setData((await api("/admin/products", { token })).products);
      if (tab === "Clientes") setData((await api("/admin/users", { token })).users);
      if (tab === "Pedidos") setData((await api("/admin/orders", { token })).orders);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [tab, token, user?.role]);
  const createProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const raw = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api("/products", { method: "POST", token, body: JSON.stringify({
        name: raw.name, slug: raw.slug, description: raw.description,
        category: raw.category, brand: raw.brand, price: Number(raw.price),
        compareAtPrice: raw.compareAtPrice ? Number(raw.compareAtPrice) : undefined,
        color: raw.color, stock: Number(raw.stock), active: true,
        sizes: raw.sizes ? raw.sizes.split(",").map(v => v.trim()).filter(Boolean) : [],
        images: [raw.image].filter(Boolean), badge: raw.badge || "Novo",
      }) });
      setShowProductForm(false);
      e.currentTarget.reset();
      await load();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const toggleUser = async (customer) => {
    try {
      await api(`/admin/users/${customer._id}/status`, { method: "PATCH", token, body: JSON.stringify({ active: !customer.active }) });
      await load();
    } catch (e) { setError(e.message); }
  };
  const updateOrder = async (order, status) => {
    try {
      await api(`/admin/orders/${order._id}/status`, { method: "PATCH", token, body: JSON.stringify({ status }) });
      await load();
    } catch (e) { setError(e.message); }
  };
  if (!token || user?.role !== "admin") return <main className="section empty"><ShieldCheck/><h2>Acesso restrito</h2><p>Entre com uma conta administrativa.</p><button className="primary" onClick={() => nav("account")}>Entrar</button></main>;
  return (
    <main className="admin">
      <aside>
        <button className="brand">
          NOVA<span>.</span>
          <small>ADMIN</small>
        </button>
        {[
          ["Visão geral", LayoutDashboard],
          ["Pedidos", ShoppingCart],
          ["Produtos", Package],
          ["Clientes", Users],
          ["Cupons", Tag],
        ].map(([n, I]) => (
          <button
            key={n}
            className={tab === n ? "active" : ""}
            onClick={() => {
              setData([]);
              setError("");
              setShowProductForm(false);
              setTab(n);
            }}
          >
            <I />
            {n}
          </button>
        ))}
        <button className="logout" onClick={() => nav("account")}>
          <LogOut />
          Sair
        </button>
      </aside>
      <section>
        <div className="admin-head">
          <div>
            <small>PAINEL ADMINISTRATIVO</small>
            <h1>{tab}</h1>
          </div>
          <div className="avatar">ES</div>
        </div>
        {error && <p className="form-error">{error}</p>}
        {loading && <p>Carregando dados...</p>}
        {tab === "Visão geral" && metrics ? (
          <>
            <div className="metrics">
              <Metric title="Receita confirmada" value={money(metrics.revenue)} change="Pedidos pagos" />
              <Metric title="Pedidos" value={String(metrics.orders)} change="Total registrado" />
              <Metric title="Produtos" value={String(metrics.products)} change="Ativos no catálogo" />
              <Metric title="Clientes" value={String(metrics.users)} change="Contas cadastradas" />
            </div>
          </>
        ) : tab === "Produtos" ? <div className="admin-module"><div className="module-title"><h2>Produtos cadastrados</h2><button className="primary" onClick={() => setShowProductForm(!showProductForm)}>{showProductForm ? "Cancelar" : "Adicionar produto"}</button></div>{showProductForm && <form className="admin-form" onSubmit={createProduct}><input name="name" placeholder="Nome" required/><input name="slug" placeholder="slug-do-produto" required/><input name="brand" placeholder="Marca" required/><input name="category" placeholder="Categoria" required/><input name="price" type="number" step="0.01" min="0" placeholder="Preço" required/><input name="compareAtPrice" type="number" step="0.01" min="0" placeholder="Preço anterior"/><input name="stock" type="number" min="0" placeholder="Estoque" required/><input name="color" placeholder="Cor"/><input name="sizes" placeholder="Tamanhos: 36, 38, 40"/><input name="badge" placeholder="Selo: Novo"/><input className="wide" name="image" type="url" placeholder="URL da imagem" required/><textarea className="wide" name="description" placeholder="Descrição" required/><button className="primary wide" disabled={loading}>Salvar produto</button></form>}<div className="admin-list">{data.map(p => <div key={p._id}><span><b>{p.name}</b><small>{p.brand} · {p.category}</small></span><span>{money(p.price)}</span><span>Estoque: {p.stock}</span><span className={p.active ? "status" : ""}>{p.active ? "Ativo" : "Inativo"}</span></div>)}</div></div>
        : tab === "Clientes" ? <div className="admin-module"><div className="module-title"><div><h2>Clientes cadastrados</h2><p>Contas são criadas pelo cadastro da loja ou login social.</p></div></div><div className="admin-list">{data.map(c => <div key={c._id}><span><b>{c.name}</b><small>{c.email}</small></span><span>{c.role === "admin" ? "Administrador" : "Cliente"}</span><span>{c.providers?.map(p => p.provider).join(", ") || "Email"}</span><button onClick={() => toggleUser(c)} disabled={c._id === user.id}>{c.active ? "Bloquear" : "Ativar"}</button></div>)}</div></div>
        : tab === "Pedidos" ? <div className="admin-module"><div className="module-title"><h2>Pedidos</h2></div><div className="admin-list">{data.map(o => <div key={o._id}><span><b>{o.number}</b><small>{o.user?.name} · {o.user?.email}</small></span><span>{money(o.total)}</span><span>{new Date(o.createdAt).toLocaleDateString("pt-BR")}</span><select value={o.status} onChange={e => updateOrder(o, e.target.value)}><option value="awaiting_payment" disabled>Aguardando pagamento</option><option value="paid">Pago</option><option value="preparing">Preparando</option><option value="shipped">Enviado</option><option value="delivered">Entregue</option><option value="cancelled">Cancelado</option><option value="refunded">Reembolsado</option></select></div>)}</div></div>
        : <div className="module"><Tag/><h2>Cupons</h2><p>O módulo de cupons será conectado após a validação do checkout Pix.</p></div>}
      </section>
    </main>
  );
}
function Metric({ title, value, change }) {
  return (
    <div>
      <span>{title}</span>
      <h2>{value}</h2>
      <small>
        <TrendingUp />
        {change} este mês
      </small>
    </div>
  );
}
function ProductModal({ p, close, add }) {
  return (
    <div className="modal" onClick={close}>
      <div onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={close}>
          <X />
        </button>
        <img src={p.img} />
        <section>
          <small>
            {p.brand} · {p.cat}
          </small>
          <h2>{p.name}</h2>
          <div className="rating">
            <Star /> {p.rating} · {p.stock} em estoque
          </div>
          <p>
            Design contemporâneo, materiais selecionados e conforto para
            acompanhar todos os momentos.
          </p>
          <h3>{money(p.price)}</h3>
          <label>
            Tamanho
            <div className="sizes">
              {["36", "38", "40", "42"].map((s) => (
                <button key={s}>{s}</button>
              ))}
            </div>
          </label>
          <button
            className="primary full"
            onClick={() => {
              add(p);
              close();
            }}
          >
            Adicionar ao carrinho
          </button>
        </section>
      </div>
    </div>
  );
}
function Footer({ nav }) {
  return (
    <footer>
      <div className="footer-main">
        <div>
          <button className="brand">
            NOVA<span>.</span>
          </button>
          <p>Design essencial para uma vida em movimento.</p>
        </div>
        <div>
          <b>Comprar</b>
          <button onClick={() => nav("catalog")}>Novidades</button>
          <button onClick={() => nav("catalog")}>Mais vendidos</button>
          <button onClick={() => nav("catalog")}>Ofertas</button>
        </div>
        <div>
          <b>Ajuda</b>
          <button>Trocas e devoluções</button>
          <button>Entregas</button>
          <button>Fale conosco</button>
        </div>
        <div>
          <b>Newsletter</b>
          <p>Novidades e benefícios no seu e-mail.</p>
          <label>
            <input placeholder="Seu melhor e-mail" />
            <button>
              <ArrowRight />
            </button>
          </label>
        </div>
      </div>
      <div className="copyright">
        © 2026 NOVA Commerce. Todos os direitos reservados.
        <span>Privacidade · Termos · LGPD</span>
      </div>
    </footer>
  );
}
createRoot(document.getElementById("root")).render(<App />);
