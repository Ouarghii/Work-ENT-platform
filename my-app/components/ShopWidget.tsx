"use client";

import { useEffect, useMemo, useState } from "react";

interface ShopUser {
  id: string;
  username: string;
}

interface ShopProduct {
  _id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  tags: string[];
}

interface CartItem {
  product: ShopProduct;
  quantity: number;
}

interface CheckoutInfo {
  shippingName: string;
  shippingAddress: string;
  paymentCard: string;
  paymentExpiry: string;
  paymentCvv: string;
}

interface Order {
  _id: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  transactionId: string;
}

export function ShopWidget() {
  const [shopUser, setShopUser] = useState<ShopUser | null>(null);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(9999);
  const [sortOption, setSortOption] = useState<"latest" | "priceAsc" | "priceDesc">("latest");

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo>({
    shippingName: "",
    shippingAddress: "",
    paymentCard: "",
    paymentExpiry: "",
    paymentCvv: "",
  });
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutSuccess, setCheckoutSuccess] = useState("");
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "auth" | "catalogue" | "cart" | "checkout" | "orders"
  >("auth");

  const categories = ["Tous", "Électronique", "Mode", "Maison", "Jouets", "Bien-être"];

  const buildProductsQuery = () => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "Tous") {
      params.set("category", selectedCategory);
    }
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    }
    if (minPrice > 0) {
      params.set("minPrice", String(minPrice));
    }
    if (maxPrice < 9999) {
      params.set("maxPrice", String(maxPrice));
    }
    if (sortOption) {
      params.set("sort", sortOption);
    }
    return params.toString() ? `?${params.toString()}` : "";
  };

  const loadProducts = async () => {
    setIsProductsLoading(true);
    try {
      const query = buildProductsQuery();
      const res = await fetch(`http://localhost:5000/api/products${query}`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Shop products load failed", err);
    } finally {
      setIsProductsLoading(false);
    }
  };

  const loadCart = async () => {
    if (!shopUser) return;
    setIsCartLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/cart/${shopUser.id}`);
      if (!res.ok) throw new Error("Impossible de charger le panier");
      const data = await res.json();
      setCartItems(
        data.items.map((item: any) => ({
          product: item.product,
          quantity: item.quantity,
        }))
      );
    } catch (err) {
      console.error("Shop cart load failed", err);
    } finally {
      setIsCartLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!shopUser) return;
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${shopUser.id}`);
      if (!res.ok) throw new Error("Impossible de charger les commandes");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Shop orders load failed", err);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchQuery, selectedCategory, minPrice, maxPrice, sortOption]);

  useEffect(() => {
    if (shopUser) {
      loadCart();
      loadOrders();
      if (activeSection === "auth") {
        setActiveSection("catalogue");
      }
    } else {
      setActiveSection("auth");
    }
  }, [shopUser]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError("Veuillez remplir tous les champs.");
      return;
    }

    setIsAuthLoading(true);
    const endpoint = isRegisterMode ? "/api/auth/register" : "/api/auth/login";
    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: authUsername.trim(), password: authPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec de l'authentification.");
      }
      setShopUser(data.user);
      setAuthUsername("");
      setAuthPassword("");
      setAuthError("");
    } catch (err: any) {
      setAuthError(err.message || "Échec de l'authentification.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const addToCart = async (product: ShopProduct) => {
    if (!shopUser) {
      setAuthError("Connectez-vous pour ajouter au panier.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/cart/${shopUser.id}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id, quantity: 1 }),
      });
      if (!res.ok) throw new Error("Erreur ajout panier");
      await loadCart();
    } catch (err) {
      console.error(err);
    }
  };

  const updateCartQuantity = async (productId: string, quantity: number) => {
    if (!shopUser) return;
    try {
      const res = await fetch(`http://localhost:5000/api/cart/${shopUser.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      if (!res.ok) throw new Error("Impossible de mettre à jour le panier");
      await loadCart();
    } catch (err) {
      console.error(err);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!shopUser) return;
    try {
      const res = await fetch(`http://localhost:5000/api/cart/${shopUser.id}/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error("Impossible de supprimer du panier");
      await loadCart();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckout = async () => {
    if (!shopUser) {
      setCheckoutError("Connectez-vous pour finaliser la commande.");
      return;
    }

    if (
      !checkoutInfo.shippingName.trim() ||
      !checkoutInfo.shippingAddress.trim() ||
      !checkoutInfo.paymentCard.trim() ||
      !checkoutInfo.paymentExpiry.trim() ||
      !checkoutInfo.paymentCvv.trim()
    ) {
      setCheckoutError("Veuillez renseigner toutes les informations de livraison et de paiement.");
      return;
    }

    setIsCheckoutLoading(true);
    setCheckoutError("");
    setCheckoutSuccess("");

    try {
      const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const paymentRes = await fetch("http://localhost:5000/api/payments/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          cardNumber: checkoutInfo.paymentCard,
          expiry: checkoutInfo.paymentExpiry,
          cvv: checkoutInfo.paymentCvv,
          cardholderName: checkoutInfo.shippingName,
        }),
      });
      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) throw new Error(paymentData.error || "Erreur de paiement");

      const checkoutRes = await fetch(`http://localhost:5000/api/cart/${shopUser.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingName: checkoutInfo.shippingName,
          shippingAddress: checkoutInfo.shippingAddress,
          paymentInfo: paymentData,
        }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) throw new Error(checkoutData.error || "Échec de la validation");

      setCheckoutSuccess(`Paiement accepté • Commande #${checkoutData.order._id.slice(-6)}`);
      setCheckoutInfo({
        shippingName: "",
        shippingAddress: "",
        paymentCard: "",
        paymentExpiry: "",
        paymentCvv: "",
      });
      await loadCart();
      await loadOrders();
    } catch (err: any) {
      setCheckoutError(err.message || "Erreur lors du paiement.");
      console.error(err);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      if (sortOption === "priceAsc") return a.price - b.price;
      if (sortOption === "priceDesc") return b.price - a.price;
      return 0;
    });
  }, [products, sortOption]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cartItems]);

  const sections = [
    { id: "auth", label: "Authentification" },
    { id: "catalogue", label: "Catalogue" },
    { id: "cart", label: "Panier" },
    { id: "checkout", label: "Paiement" },
    { id: "orders", label: "Commandes" },
  ] as const;

  const renderSectionNav = (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => setActiveSection(section.id)}
          className={`rounded-3xl px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] transition ${
            activeSection === section.id
              ? "bg-[#5F5CD9] text-white shadow-lg"
              : "bg-[#111926] text-slate-300 hover:bg-[#1E2241]"
          }`}
        >
          {section.label}
        </button>
      ))}
    </div>
  );

  const renderAuthSection = (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[#1F2D4D] bg-[#091224] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Mode authentification</p>
            <p className="text-xs text-slate-500">Connectez-vous ou créez un compte pour commencer.</p>
          </div>
          <span className="rounded-3xl bg-[#111926] px-4 py-2 text-sm font-medium text-slate-200">
            {shopUser ? `Connecté : ${shopUser.username}` : "Visiteur"}
          </span>
        </div>
      </div>

      {!shopUser ? (
        <div className="rounded-[28px] border border-[#1F2D4D] bg-[#081124] p-5">
          {authError && (
            <div className="rounded-3xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-200">
              {authError}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            <input
              value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
              placeholder="Nom d'utilisateur"
              className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
            />
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
            />
          </div>
          <button
            onClick={handleAuthSubmit}
            className="w-full rounded-3xl bg-gradient-to-r from-[#5F5CD9] to-[#3F65D9] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
            disabled={isAuthLoading}
          >
            {isAuthLoading
              ? "Chargement..."
              : isRegisterMode
              ? "Créer un compte"
              : "Se connecter"}
          </button>
          <button
            onClick={() => setIsRegisterMode((prev) => !prev)}
            className="mt-3 w-full rounded-3xl border border-[#22335A] bg-[#111926] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-[#1E2141]"
          >
            {isRegisterMode ? "Retour au login" : "Passer à l'inscription"}
          </button>
        </div>
      ) : (
        <div className="rounded-[28px] border border-[#1F2D4D] bg-[#081124] p-5">
          <p className="text-sm font-semibold text-white">Bienvenue {shopUser.username}</p>
          <p className="mt-2 text-sm text-slate-400">Vous êtes connecté. Passez à l'écran Catalogue pour voir les produits.</p>
        </div>
      )}
    </div>
  );

  const renderCatalogueSection = (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-[#1F2D4D] bg-[#091224] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Recherche de produits</p>
            <p className="text-xs text-slate-500">Filtrez par catégorie, prix et popularité.</p>
          </div>
          <span className="rounded-3xl bg-[#111926] px-4 py-2 text-xs text-slate-300">
            {filteredProducts.length} produits disponibles
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un produit"
            className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
          >
            <option value="latest">Trier par nouveauté</option>
            <option value="priceAsc">Prix ascendant</option>
            <option value="priceDesc">Prix descendant</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {isProductsLoading ? (
          <div className="rounded-3xl bg-[#07131F] p-6 text-center text-slate-400">Chargement des produits...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl bg-[#07131F] p-6 text-center text-slate-400">Aucun produit trouvé.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredProducts.map((product) => (
              <div key={product._id} className="group overflow-hidden rounded-[28px] border border-[#162043] bg-[#081022] transition hover:border-[#5F5CD9]">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{product.category}</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{product.name}</h3>
                    </div>
                    <div className="rounded-3xl bg-[#1B2753] px-3 py-2 text-sm text-[#A6B3FF]">{product.price.toFixed(2)}€</div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{product.description}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#151D39] px-3 py-2 text-xs text-slate-400">Stock : {product.stock}</span>
                    {product.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-full bg-[#111B33] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="mt-4 w-full rounded-3xl bg-gradient-to-r from-[#5F5CD9] to-[#3F65D9] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    Ajouter au panier
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCartSection = (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-[#1F2D4D] bg-[#081124] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Panier</p>
            <p className="text-xs text-slate-500">Vérifiez vos articles avant de payer.</p>
          </div>
          <span className="rounded-3xl bg-[#111B33] px-4 py-2 text-sm text-slate-300">{cartItems.length} articles</span>
        </div>

        <div className="mt-5 space-y-3">
          {cartItems.length === 0 ? (
            <div className="rounded-3xl bg-[#07131F] p-6 text-center text-slate-400">Votre panier est vide.</div>
          ) : (
            cartItems.map((item) => (
              <div key={item.product._id} className="rounded-3xl border border-[#122145] bg-[#0B1322] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 overflow-hidden rounded-3xl bg-[#111728]">
                      <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{item.product.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.product.category}</p>
                      <p className="mt-2 text-sm text-slate-400">{item.product.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-[#A6B3FF]">{(item.quantity * item.product.price).toFixed(2)}€</p>
                    <p className="text-xs text-slate-500">{item.product.price.toFixed(2)}€ / unité</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => updateCartQuantity(item.product._id, Math.max(1, item.quantity - 1))}
                    className="rounded-full bg-[#12214B] px-3 py-2 text-white"
                  >
                    -
                  </button>
                  <span className="min-w-[2rem] text-center text-sm font-semibold text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.product._id, item.quantity + 1)}
                    className="rounded-full bg-[#12214B] px-3 py-2 text-white"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product._id)}
                    className="ml-auto rounded-3xl bg-[#2D1C3A] px-3 py-2 text-xs text-slate-300"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderCheckoutSection = (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-[#1F2D4D] bg-[#091123] p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-white">Paiement & livraison</p>
          <span className="rounded-full bg-[#111B33] px-3 py-2 text-xs text-slate-400">{cartTotal.toFixed(2)}€</span>
        </div>

        <div className="mt-5 space-y-4">
          <input
            value={checkoutInfo.shippingName}
            onChange={(e) => setCheckoutInfo({ ...checkoutInfo, shippingName: e.target.value })}
            placeholder="Nom complet"
            className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
          />
          <input
            value={checkoutInfo.shippingAddress}
            onChange={(e) => setCheckoutInfo({ ...checkoutInfo, shippingAddress: e.target.value })}
            placeholder="Adresse de livraison"
            className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
          />
          <input
            value={checkoutInfo.paymentCard}
            onChange={(e) => setCheckoutInfo({ ...checkoutInfo, paymentCard: e.target.value })}
            placeholder="Numéro de carte"
            className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={checkoutInfo.paymentExpiry}
              onChange={(e) => setCheckoutInfo({ ...checkoutInfo, paymentExpiry: e.target.value })}
              placeholder="MM/AA"
              className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
            />
            <input
              value={checkoutInfo.paymentCvv}
              onChange={(e) => setCheckoutInfo({ ...checkoutInfo, paymentCvv: e.target.value })}
              placeholder="CVV"
              className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
            />
          </div>
          {checkoutError && (
            <div className="rounded-3xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-200">
              {checkoutError}
            </div>
          )}
          {checkoutSuccess && (
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {checkoutSuccess}
            </div>
          )}
          <button
            onClick={handleCheckout}
            className="w-full rounded-3xl bg-gradient-to-r from-[#5F5CD9] to-[#3F65D9] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
            disabled={isCheckoutLoading || cartItems.length === 0}
          >
            {isCheckoutLoading ? "Traitement..." : "Payer maintenant"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderOrdersSection = (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-[#1F2D4D] bg-[#081124] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Historique des commandes</p>
            <p className="text-xs text-slate-500">Suivez vos dernières transactions et statuts.</p>
          </div>
          <span className="rounded-3xl bg-[#111B33] px-4 py-2 text-sm text-slate-300">{orders.length} commandes</span>
        </div>

        <div className="mt-5 space-y-3">
          {orders.length === 0 ? (
            <p className="text-slate-500">Aucune commande pour le moment.</p>
          ) : (
            orders.map((order) => (
              <div key={order._id} className="rounded-3xl border border-[#122144] bg-[#071025] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-white">Commande #{order._id.slice(-6)}</p>
                  <span className="text-xs text-slate-500">{order.status}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                <p className="mt-2 text-sm text-[#A6B3FF]">Total : {order.total.toFixed(2)}€</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const fullscreenContent = (
    <div className="flex h-full flex-col overflow-hidden">
      {renderSectionNav}
      <div className="flex-1 overflow-y-auto rounded-[28px] border border-[#1E2A4A] bg-[#0C1322] p-5">
        {activeSection === "auth" && renderAuthSection}
        {activeSection === "catalogue" && renderCatalogueSection}
        {activeSection === "cart" && renderCartSection}
        {activeSection === "checkout" && renderCheckoutSection}
        {activeSection === "orders" && renderOrdersSection}
      </div>
    </div>
  );

  return (
    <div
      className={`h-full rounded-[30px] border border-[#2D3140] bg-[#0B1222] p-5 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.85)] text-slate-200 overflow-hidden flex flex-col transition-all duration-300 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-0 p-8" : "relative"
      }`}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-slate-500">Boutique</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Espace e-commerce</h2>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            Catalogue complet, filtres produits, panier sécurisé et paiement en direct.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="inline-flex items-center gap-2 rounded-3xl bg-[#111926] px-4 py-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.32em] text-slate-500">Statut</span>
            <span>{shopUser ? "Authentifié" : "Identifiez-vous"}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-3xl bg-[#111926] px-4 py-2 text-sm font-medium text-slate-200 shadow-inner">
              {shopUser ? `Connecté : ${shopUser.username}` : "Visiteur"}
            </span>
            <button
              onClick={() => setIsFullscreen((prev) => !prev)}
              title={isFullscreen ? "Réduire" : "Plein écran"}
              className="inline-flex items-center gap-2 rounded-full bg-[#25242C] border border-[#3B3A41] px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-[#2F2D39]"
            >
              {isFullscreen ? "Quitter" : "Plein écran"}
              <span>{isFullscreen ? "✕" : "⛶"}</span>
            </button>
          </div>
        </div>
      </div>

      {isFullscreen ? fullscreenContent : (
        <>
          <div className="block sm:hidden rounded-[40px] border border-[#1E2A4A] bg-[#091223] p-4 shadow-[0_25px_80px_-30px_rgba(0,0,0,0.8)]">
            <div className="mb-4 flex items-center justify-between gap-3 rounded-3xl bg-[#0B1426] p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Boutique</p>
                <h2 className="text-xl font-semibold text-white">Shop mobile</h2>
              </div>
              <button
                onClick={() => setIsFullscreen(true)}
                title="Plein écran"
                className="inline-flex items-center gap-2 rounded-full bg-[#1C2D55] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-[#374c8d]"
              >
                <span>⛶</span>
                <span>Plein écran</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-[32px] border border-[#122248] bg-[#081323] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Statut</p>
                    <p className="text-sm font-semibold text-white">{shopUser ? shopUser.username : "Visiteur"}</p>
                  </div>
                  <span className="rounded-full bg-[#111B33] px-3 py-2 text-xs text-slate-300">
                    {shopUser ? "Authentifié" : "Invité"}
                  </span>
                </div>
              </div>

              <div className="rounded-[32px] border border-[#122248] bg-[#081323] p-4">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher"
                  className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
                />
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
                  >
                    <option value="latest">Nouveauté</option>
                    <option value="priceAsc">Prix ↑</option>
                    <option value="priceDesc">Prix ↓</option>
                  </select>
                </div>
              </div>

              <div className="rounded-[32px] border border-[#122248] bg-[#081323] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Panier</p>
                    <p className="text-lg font-semibold text-white">{cartItems.length} articles</p>
                  </div>
                  <span className="rounded-full bg-[#111B33] px-3 py-2 text-xs text-slate-300">{cartTotal.toFixed(2)}€</span>
                </div>
              </div>

              <div className="rounded-[32px] border border-[#122248] bg-[#081323] p-4">
                {isProductsLoading ? (
                  <p className="text-sm text-slate-400">Chargement des produits...</p>
                ) : filteredProducts.length === 0 ? (
                  <div className="rounded-3xl bg-[#07131F] p-6 text-center text-slate-400">Aucun produit trouvé.</div>
                ) : (
                  <div className="space-y-3">
                    {filteredProducts.slice(0, 4).map((product) => (
                      <div key={product._id} className="overflow-hidden rounded-[28px] border border-[#162043] bg-[#081022]">
                        <div className="relative h-40 overflow-hidden">
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{product.category}</p>
                              <h3 className="mt-2 text-base font-semibold text-white">{product.name}</h3>
                            </div>
                            <span className="rounded-3xl bg-[#1B2753] px-3 py-2 text-sm text-[#A6B3FF]">{product.price.toFixed(2)}€</span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-slate-400">{product.description}</p>
                          <button
                            onClick={() => addToCart(product)}
                            className="mt-4 w-full rounded-3xl bg-gradient-to-r from-[#5F5CD9] to-[#3F65D9] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                          >
                            Ajouter
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden sm:block grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-5 flex-1 overflow-hidden">
            <div className="space-y-5 overflow-hidden rounded-[28px] border border-[#1E2A4A] bg-[#0C1322] p-5">
              <div className="grid gap-3 md:grid-cols-[1.5fr_0.8fr]">
                <div className="rounded-3xl border border-[#1F2D4D] bg-[#091224] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Recherche de produits</p>
                      <p className="text-xs text-slate-500">
                        Filtrez par catégorie, prix et popularité.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setIsRegisterMode(!isRegisterMode)}
                        className="rounded-3xl bg-[#223077] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-[#2E4BB6]"
                      >
                        {isRegisterMode ? "Mode connexion" : "Mode inscription"}
                      </button>
                    </div>
                  </div>

                  {!shopUser && (
                    <form onSubmit={handleAuthSubmit} className="mt-4 space-y-3">
                      {authError && (
                        <div className="rounded-3xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-200">
                          {authError}
                        </div>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          value={authUsername}
                          onChange={(e) => setAuthUsername(e.target.value)}
                          placeholder="Nom d'utilisateur"
                          className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
                        />
                        <input
                          type="password"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="Mot de passe"
                          className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full rounded-3xl bg-gradient-to-r from-[#5F5CD9] to-[#3F65D9] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
                        disabled={isAuthLoading}
                      >
                        {isAuthLoading
                          ? "Chargement..."
                          : isRegisterMode
                          ? "Créer un compte"
                          : "Se connecter"}
                      </button>
                    </form>
                  )}
                </div>

                <div className="rounded-3xl border border-[#1F2D4D] bg-[#091224] p-4">
                  <div className="flex flex-col gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher un produit"
                        className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
                      />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        type="number"
                        min={0}
                        value={minPrice}
                        onChange={(e) => setMinPrice(Number(e.target.value))}
                        className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
                        placeholder="Min €"
                      />
                      <input
                        type="number"
                        min={0}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
                        placeholder="Max €"
                      />
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as any)}
                        className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
                      >
                        <option value="latest">Trier par nouveauté</option>
                        <option value="priceAsc">Prix ascendant</option>
                        <option value="priceDesc">Prix descendant</option>
                      </select>
                    </div>

                    <div className="rounded-3xl border border-[#22335A] bg-[#081124] p-4 text-sm text-slate-300">
                      <p className="font-medium text-white">Filtres actifs</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Catégorie : {selectedCategory}, Prix entre {minPrice}€ et {maxPrice}€.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 overflow-hidden rounded-[28px] border border-[#1F2D4D] bg-[#081124] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Etat de la boutique</p>
                    <p className="text-lg font-semibold text-white">{filteredProducts.length} produits</p>
                  </div>
                  <div className="rounded-3xl bg-[#111A34] px-4 py-2 text-sm text-slate-300">
                    {shopUser ? "Compte actif" : "Visiteur"}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-[#22325A] bg-[#0B1121] p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Panier</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{cartItems.length} articles</p>
                  </div>
                  <div className="rounded-3xl border border-[#22325A] bg-[#0B1121] p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Total estimé</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{cartTotal.toFixed(2)}€</p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-[#1F2D4D] bg-[#081124] p-4">
                <p className="text-sm font-semibold text-white">Produits populaires</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {filteredProducts.slice(0, 2).map((product) => (
                    <div key={product._id} className="overflow-hidden rounded-3xl bg-[#0D1628] p-0 shadow-inner">
                      <div className="h-36 overflow-hidden bg-[#081123]">
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="p-4">
                        <p className="font-semibold text-white">{product.name}</p>
                        <p className="mt-2 text-xs text-slate-500">{product.category}</p>
                        <p className="mt-3 text-xl font-semibold text-[#A6B3FF]">{product.price.toFixed(2)}€</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5 overflow-hidden rounded-[28px] border border-[#1E2A4A] bg-[#091123] p-5">
              <div className="rounded-3xl border border-[#122144] bg-[#0A1322] p-4 shadow-inner">
                <p className="text-sm font-semibold text-white">Catalogue de produits</p>
                <p className="mt-2 text-xs text-slate-500">Ajoutez un produit au panier pour le valider.</p>
              </div>

              <div className="grid gap-4 overflow-y-auto custom-scrollbar" style={{ maxHeight: "44rem" }}>
                {isProductsLoading ? (
                  <div className="rounded-3xl bg-[#07131F] p-6 text-center text-slate-400">Chargement des produits...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="rounded-3xl bg-[#07131F] p-6 text-center text-slate-400">Aucun produit trouvé.</div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredProducts.map((product) => (
                      <div key={product._id} className="group overflow-hidden rounded-[28px] border border-[#162043] bg-[#081022] transition hover:border-[#5F5CD9]">
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{product.category}</p>
                              <h3 className="mt-2 text-lg font-semibold text-white">{product.name}</h3>
                            </div>
                            <div className="rounded-3xl bg-[#1B2753] px-3 py-2 text-sm text-[#A6B3FF]">{product.price.toFixed(2)}€</div>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-slate-400">{product.description}</p>
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#151D39] px-3 py-2 text-xs text-slate-400">Stock : {product.stock}</span>
                            {product.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="rounded-full bg-[#111B33] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() => addToCart(product)}
                            className="mt-4 w-full rounded-3xl bg-gradient-to-r from-[#5F5CD9] to-[#3F65D9] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                          >
                            Ajouter au panier
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="rounded-[28px] border border-[#1E2A4A] bg-[#091123] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Panier</p>
                  <p className="mt-1 text-xs text-slate-500">Contrôlez votre commande avant paiement.</p>
                </div>
                <span className="rounded-full bg-[#111B33] px-3 py-2 text-xs text-slate-400">{cartItems.length} articles</span>
              </div>

              <div className="mt-5 space-y-3">
                {cartItems.length === 0 ? (
                  <div className="rounded-3xl bg-[#07131F] p-6 text-center text-slate-400">Votre panier est vide.</div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.product._id} className="rounded-3xl border border-[#122145] bg-[#0B1322] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-4">
                          <div className="h-20 w-20 overflow-hidden rounded-3xl bg-[#111728]">
                            <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{item.product.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{item.product.category}</p>
                            <p className="mt-2 text-sm text-slate-400">{item.product.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-[#A6B3FF]">{(item.quantity * item.product.price).toFixed(2)}€</p>
                          <p className="text-xs text-slate-500">{item.product.price.toFixed(2)}€ / unité</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.product._id, Math.max(1, item.quantity - 1))}
                          className="rounded-full bg-[#12214B] px-3 py-2 text-white"
                        >
                          -
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-semibold text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.product._id, item.quantity + 1)}
                          className="rounded-full bg-[#12214B] px-3 py-2 text-white"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product._id)}
                          className="ml-auto rounded-3xl bg-[#2D1C3A] px-3 py-2 text-xs text-slate-300"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#1E2A4A] bg-[#091123] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Paiement & livraison</p>
                <span className="rounded-full bg-[#111B33] px-3 py-2 text-xs text-slate-400">{cartTotal.toFixed(2)}€</span>
              </div>

              <div className="mt-5 space-y-4">
                <input
                  value={checkoutInfo.shippingName}
                  onChange={(e) => setCheckoutInfo({ ...checkoutInfo, shippingName: e.target.value })}
                  placeholder="Nom complet"
                  className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
                />
                <input
                  value={checkoutInfo.shippingAddress}
                  onChange={(e) => setCheckoutInfo({ ...checkoutInfo, shippingAddress: e.target.value })}
                  placeholder="Adresse de livraison"
                  className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
                />
                <input
                  value={checkoutInfo.paymentCard}
                  onChange={(e) => setCheckoutInfo({ ...checkoutInfo, paymentCard: e.target.value })}
                  placeholder="Numéro de carte"
                  className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={checkoutInfo.paymentExpiry}
                    onChange={(e) => setCheckoutInfo({ ...checkoutInfo, paymentExpiry: e.target.value })}
                    placeholder="MM/AA"
                    className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
                  />
                  <input
                    value={checkoutInfo.paymentCvv}
                    onChange={(e) => setCheckoutInfo({ ...checkoutInfo, paymentCvv: e.target.value })}
                    placeholder="CVV"
                    className="w-full rounded-3xl border border-[#22335A] bg-[#071125] px-4 py-3 text-sm text-white outline-none focus:border-[#5F5CD9]"
                  />
                </div>
                {checkoutError && (
                  <div className="rounded-3xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-200">
                    {checkoutError}
                  </div>
                )}
                {checkoutSuccess && (
                  <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    {checkoutSuccess}
                  </div>
                )}
                <button
                  onClick={handleCheckout}
                  className="w-full rounded-3xl bg-gradient-to-r from-[#5F5CD9] to-[#3F65D9] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
                  disabled={isCheckoutLoading || cartItems.length === 0}
                >
                  {isCheckoutLoading ? "Traitement..." : "Payer maintenant"}
                </button>
              </div>

              <div className="mt-6 rounded-3xl border border-[#122144] bg-[#0B1322] p-4 text-sm text-slate-400">
                <p className="font-semibold text-white">Historique des commandes</p>
                <div className="mt-3 space-y-3">
                  {orders.length === 0 ? (
                    <p className="text-slate-500">Aucune commande pour le moment.</p>
                  ) : (
                    orders.slice(0, 3).map((order) => (
                      <div key={order._id} className="rounded-3xl border border-[#122144] bg-[#071025] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-white">Commande #{order._id.slice(-6)}</p>
                          <span className="text-xs text-slate-500">{order.status}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                        <p className="mt-2 text-sm text-[#A6B3FF]">Total : {order.total.toFixed(2)}€</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}