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
app.use(cors({ origin: "http://localhost:3001", credentials: true }));
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

const User = mongoose.model("User", userSchema);
const Message = mongoose.model("Message", messageSchema);

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
// 3. ZOOM SDK TOKEN GENERATOR
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