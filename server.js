const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

let bookingsCollection;

// ---------------- MongoDB ----------------

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("portfolio");
    bookingsCollection = db.collection("bookings");
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}

connectDB();

// ---------------- Booking API ----------------

app.post("/book", async (req, res) => {
  try {
    const { name, contact, duration, message } = req.body;

    if (!name || !contact || !duration) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const booking = {
      name,
      contact,
      duration,
      message: message || "",
      createdAt: new Date(),
    };

    await bookingsCollection.insertOne(booking);

    res.json({
      success: true,
      message: "Booking saved!",
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ---------------- Get Bookings ----------------

app.get("/bookings", async (req, res) => {
  try {

    const bookings = await bookingsCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.json(bookings);

  } catch (err) {

    res.status(500).json({
      error: err.message,
    });

  }
});

// ---------------- AI Chat ----------------

app.post("/chat", async (req, res) => {

  try {

    const { message } = req.body;

    if (!message) {

      return res.status(400).json({
        error: "Message is required",
      });

    }

    const prompt = `
You are Harsh's AI Assistant.

Rules:

- You are a friendly female AI assistant.
- Always speak in Hindi or Hinglish.
- Harsh is a Full Stack Web Developer and Freelancer.
- Help users regarding websites, web apps, dashboards, AI projects and portfolios.
- If someone wants to work with Harsh ask:
1. Project Type
2. Budget
3. Timeline

Keep replies short, friendly and natural.

User: ${message}
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({
      reply: result.text,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message,
    });

  }

});

// ---------------- Home ----------------

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// ---------------- Start ----------------

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
