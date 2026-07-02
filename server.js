const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const OpenAI = require("openai").default;
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let bookingsCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("portfolio");
    bookingsCollection = db.collection("bookings");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}
connectDB();

// Save a new booking
app.post('/book', async (req, res) => {
  try {
    const { name, contact, duration, message } = req.body;

    if (!name || !contact || !duration) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const booking = {
      name,
      contact,
      duration,
      message: message || "",
      createdAt: new Date()
    };

    await bookingsCollection.insertOne(booking);
    res.json({ success: true, message: "Booking saved!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all bookings (for you to check)
app.get('/bookings', async (req, res) => {
  try {
    const bookings = await bookingsCollection.find().sort({ createdAt: -1 }).toArray();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send("Backend is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
