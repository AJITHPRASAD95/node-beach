const express = require("express");
const axios = require("axios");

const app = express();

// ESP sends raw image bytes
app.use(express.raw({ type: "application/octet-stream", limit: "10mb" }));

// 🔥 YOLO API (Render URL)
const YOLO_URL = "https://beach-safety-ai-1.onrender.com/predict";

// Optional ThingSpeak
const THINGSPEAK_KEY = "LE8HFPG3IL4MKSIQ";

app.get("/", (req, res) => {
  res.send("Node Bridge Server Running");
});

// ESP32 → Node → YOLO
app.post("/esp", async (req, res) => {
  try {
    const response = await axios.post(YOLO_URL, req.body, {
      headers: { "Content-Type": "application/octet-stream" }
    });

    const human = response.data.human;

    console.log("Human:", human);

    // Send to ThingSpeak
    await axios.get(
      `https://api.thingspeak.com/update?api_key=${THINGSPEAK_KEY}&field1=${human}`
    );

    res.json({ human });

  } catch (err) {
    console.log("ERROR:", err.message);
    res.json({ human: 0 });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));