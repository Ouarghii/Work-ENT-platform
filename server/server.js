// server.js - Express + MongoDB (Mongoose) + Zoom SDK API
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zoom_dashboard";

// --- Middleware ---
app.use(
  cors({
    origin: ["http://localhost:3001", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());

// --- MongoDB Connection ---
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("🍃 MongoDB Connected Successfully"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// --- Database Schemas & Models ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  time: { type: String, required: true },
  date: { type: String, required: true },
  meetingId: { type: String, required: true },
  createdBy: { type: String, default: "system" },
  createdAt: { type: Date, default: Date.now },
});

const meetingMessageSchema = new mongoose.Schema({
  meetingId: { type: String, required: true },
  sender: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Message = mongoose.model("Message", messageSchema);
const Event = mongoose.model("Event", eventSchema);
const MeetingMessage = mongoose.model("MeetingMessage", meetingMessageSchema);

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  tags: { type: [String], default: [] },
});

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.Mixed, required: true },
      quantity: { type: Number, required: true, default: 1 },
    },
  ],
});

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
    },
  ],
  total: { type: Number, required: true },
  status: { type: String, default: "En préparation" },
  shippingInfo: {
    name: String,
    address: String,
  },
  paymentResult: mongoose.Schema.Types.Mixed,
  transactionId: String,
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model("Product", productSchema);
const Cart = mongoose.model("Cart", cartSchema);
const Order = mongoose.model("Order", orderSchema);

const sampleProducts = [
  {
    name: "Casque sans fil Axiom",
    category: "Électronique",
    description: "Son immersif, réduction de bruit active et design premium.",
    price: 139.99,
    image: "https://images.unsplash.com/photo-1511376777868-611b54f68947?auto=format&fit=crop&w=800&q=80",
    stock: 28,
    tags: ["audio", "wireless", "premium"],
  },
  {
    name: "Montre connectée Nova",
    category: "Mode",
    description: "Suivi fitness, notifications intelligentes et autonomie longue durée.",
    price: 89.5,
    image: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=800&q=80",
    stock: 36,
    tags: ["wearable", "fitness", "smart"],
  },
  {
    name: "Lampe d'ambiance Luna",
    category: "Maison",
    description: "Éclairage connecté avec modes couleur et minuteur.",
    price: 54.0,
    image: "https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=800&q=80",
    stock: 50,
    tags: ["décor", "smart home", "ambiance"],
  },
  {
    name: "Enceinte Bluetooth Pulse",
    category: "Électronique",
    description: "Petit format, gros son et résistance à l'eau.",
    price: 69.9,
    image: "https://images.unsplash.com/photo-1512446814277-a8f7a2d13e3c?auto=format&fit=crop&w=800&q=80",
    stock: 44,
    tags: ["audio", "portable", "powered"],
  },
  {
    name: "Sweat à capuche Urban",
    category: "Mode",
    description: "Coton doux, coupe oversize et look moderne.",
    price: 42.99,
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
    stock: 64,
    tags: ["confort", "streetwear", "style"],
  },
  {
    name: "Set de yoga Zen",
    category: "Bien-être",
    description: "Tapis antidérapant, blocs et sangle inclus.",
    price: 34.95,
    image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80",
    stock: 31,
    tags: ["yoga", "sport", "bien-être"],
  },
  {
    name: "Jeu de construction Astro",
    category: "Jouets",
    description: "Inspire la créativité avec 420 pièces modulables.",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1580672446361-cea19d61b159?auto=format&fit=crop&w=800&q=80",
    stock: 25,
    tags: ["jeu", "créatif", "enfants"],
  },
];

const seedProducts = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(sampleProducts);
      console.log("🌱 Produits de boutique initialisés.");
    }
  } catch (err) {
    console.error("Seed products failed", err);
  }
};

seedProducts();

// ----------------------------------------------------
// 1. AUTHENTICATION ROUTES (Register & Login)
// ----------------------------------------------------

// Register Endpoint
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis." });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Ce nom d'utilisateur est déjà pris." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, password: hashedPassword });

    return res.status(201).json({
      success: true,
      user: { id: newUser._id, username: newUser.username },
    });
  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({ error: "Erreur lors de la création du compte." });
  }
});

// Login Endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis." });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Mot de passe incorrect." });
    }

    return res.json({
      success: true,
      user: { id: user._id, username: user.username },
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ error: "Erreur lors de la connexion." });
  }
});

// ----------------------------------------------------
// 2. CHAT MESSAGES ROUTES
// ----------------------------------------------------

app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 }).limit(100);
    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ error: "Erreur de chargement des messages" });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const { sender, text } = req.body;
    if (!sender || !text) return res.status(400).json({ error: "Données manquantes" });

    const newMessage = await Message.create({ sender, text });
    return res.json(newMessage);
  } catch (err) {
    return res.status(500).json({ error: "Erreur d'envoi du message" });
  }
});

// ----------------------------------------------------
// 3. CALENDAR / MEETING BACKEND ROUTES
// ----------------------------------------------------

app.get("/api/events", async (req, res) => {
  try {
    const { date } = req.query;
    const filter = {};
    if (date) {
      filter.date = date;
    }
    const events = await Event.find(filter).sort({ date: 1, time: 1 });
    return res.json(events);
  } catch (err) {
    console.error("Events Load Error:", err);
    return res.status(500).json({ error: "Erreur de chargement du calendrier" });
  }
});

app.post("/api/events", async (req, res) => {
  try {
    const { title, time, date, meetingId, createdBy } = req.body;
    if (!title || !time || !date) {
      return res.status(400).json({ error: "Titre, heure et date requis." });
    }

    const newEvent = await Event.create({
      title,
      time,
      date,
      meetingId: meetingId || Math.floor(100000000 + Math.random() * 900000000).toString(),
      createdBy: createdBy || "system",
    });

    return res.status(201).json(newEvent);
  } catch (err) {
    console.error("Create Event Error:", err);
    return res.status(500).json({ error: "Erreur lors de la création de l'événement." });
  }
});

app.get("/api/meetings/:meetingId/messages", async (req, res) => {
  try {
    const { meetingId } = req.params;
    const messages = await MeetingMessage.find({ meetingId }).sort({ timestamp: 1 });
    return res.json(messages);
  } catch (err) {
    console.error("Meeting Messages Load Error:", err);
    return res.status(500).json({ error: "Erreur de chargement des messages de réunion" });
  }
});

app.post("/api/meetings/:meetingId/messages", async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { sender, text } = req.body;
    if (!sender || !text) {
      return res.status(400).json({ error: "Données manquantes" });
    }

    const newMeetingMessage = await MeetingMessage.create({ meetingId, sender, text });
    return res.status(201).json(newMeetingMessage);
  } catch (err) {
    console.error("Create Meeting Message Error:", err);
    return res.status(500).json({ error: "Erreur lors de l'envoi du message de réunion." });
  }
});

// ----------------------------------------------------
// 5. SHOP & ECOMMERCE API ROUTES
// ----------------------------------------------------

app.get("/api/products", async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, tag } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ];
    }
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };

    const products = await Product.find(filter).sort({ name: 1 });
    return res.json(products);
  } catch (err) {
    console.error("Product Load Error:", err);
    return res.status(500).json({ error: "Erreur de chargement des produits" });
  }
});

app.get("/api/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }
    return res.json(cart);
  } catch (err) {
    console.error("Cart Load Error:", err);
    return res.status(500).json({ error: "Erreur de chargement du panier" });
  }
});

app.post("/api/cart/:userId/add", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "Produit invalide" });
    }

    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ error: "Produit introuvable" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    const itemIndex = cart.items.findIndex((item) => item.product._id.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += Number(quantity);
      cart.items[itemIndex].quantity = Math.min(cart.items[itemIndex].quantity, existingProduct.stock);
    } else {
      cart.items.push({ product: existingProduct.toObject(), quantity: Math.min(Number(quantity), existingProduct.stock) });
    }

    await cart.save();
    return res.json(cart);
  } catch (err) {
    console.error("Cart Add Error:", err);
    return res.status(500).json({ error: "Erreur lors de l'ajout au panier" });
  }
});

app.post("/api/cart/:userId/update", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity } = req.body;
    if (!productId || quantity == null) {
      return res.status(400).json({ error: "Données de mise à jour manquantes" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Panier introuvable" });

    const item = cart.items.find((item) => item.product._id.toString() === productId);
    if (!item) return res.status(404).json({ error: "Produit non trouvé dans le panier" });

    item.quantity = Math.max(1, Number(quantity));
    await cart.save();
    return res.json(cart);
  } catch (err) {
    console.error("Cart Update Error:", err);
    return res.status(500).json({ error: "Erreur lors de la mise à jour du panier" });
  }
});

app.post("/api/cart/:userId/remove", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "Produit invalide" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Panier introuvable" });

    cart.items = cart.items.filter((item) => item.product._id.toString() !== productId);
    await cart.save();
    return res.json(cart);
  } catch (err) {
    console.error("Cart Remove Error:", err);
    return res.status(500).json({ error: "Erreur lors de la suppression du produit du panier" });
  }
});

app.post("/api/payments/charge", async (req, res) => {
  try {
    const { amount, cardNumber, expiry, cvv, cardholderName } = req.body;
    if (!amount || !cardNumber || !expiry || !cvv || !cardholderName) {
      return res.status(400).json({ error: "Données de paiement incomplètes." });
    }

    return res.status(200).json({
      status: "success",
      transactionId: crypto.randomUUID(),
      chargedAmount: amount,
      cardholderName,
      processedAt: new Date(),
    });
  } catch (err) {
    console.error("Payment Error:", err);
    return res.status(500).json({ error: "Erreur lors du traitement du paiement." });
  }
});

app.post("/api/cart/:userId/checkout", async (req, res) => {
  try {
    const { userId } = req.params;
    const { shippingInfo, paymentInfo } = req.body;
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Panier vide" });
    }

    const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const order = await Order.create({
      userId,
      items: cart.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
      })),
      total,
      shippingInfo: shippingInfo || {},
      paymentResult: paymentInfo || { status: "Paiement simulé" },
      transactionId: crypto.randomUUID(),
    });

    cart.items = [];
    await cart.save();

    return res.status(201).json({ order, message: "Paiement réussi et commande créée." });
  } catch (err) {
    console.error("Checkout Error:", err);
    return res.status(500).json({ error: "Erreur lors du paiement et du traitement de la commande" });
  }
});

app.get("/api/orders/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    console.error("Orders Load Error:", err);
    return res.status(500).json({ error: "Erreur de chargement des commandes" });
  }
});

// ----------------------------------------------------
// 6. ZOOM SDK TOKEN GENERATOR
// ----------------------------------------------------

app.post("/api/zoom/token", (req, res) => {
  try {
    const { meetingNumber, role } = req.body;
    const sdkKey = process.env.ZOOM_SDK_KEY;
    const sdkSecret = process.env.ZOOM_SDK_SECRET;

    if (!sdkKey || !sdkSecret) {
      return res.status(500).json({ error: "Clés SDK Zoom non configurées sur le serveur" });
    }

    const iat = Math.floor(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;

    const header = { alg: "HS256", typ: "JWT" };
    const payload = {
      sdkKey,
      mn: meetingNumber,
      role: role ?? 0,
      iat,
      exp,
      tokenExp: exp,
    };

    const base64UrlEncode = (str) =>
      Buffer.from(str)
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));

    const signature = crypto
      .createHmac("sha256", sdkSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const token = `${encodedHeader}.${encodedPayload}.${signature}`;

    return res.json({ signature: token, sdkKey });
  } catch (err) {
    return res.status(500).json({ error: "Échec de la génération du token Zoom" });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});