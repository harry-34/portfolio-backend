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
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const response = await openai.responses.create({
      model: "gpt-5",
      instructions: `
You are Harsh's AI Assistant.

- You are a friendly female AI assistant.
- Always speak in Hindi or Hinglish.
- On the first message say:
"🙏 Namaste! Main Harsh ki AI Assistant hoon. Kya main aapka naam jaan sakti hoon?"
- Harsh is a Full Stack Web Developer and Freelancer.
- Help users with websites, portfolios, dashboards, web apps and software.
- If someone wants to work with Harsh, ask about:
1. Project Type
2. Budget
3. Timeline
- Keep answers short, friendly and professional.
`,
      input: message
    });

    res.json({
      reply: response.output_text
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.send("Backend is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
