const express = require("express");
const axios = require("axios");

const app = express();

// Accept JPEG + raw binary safely
app.use(express.raw({ type: "*/*", limit: "10mb" }));

// 🔥 YOUR YOLO API (must match Flask route)
const YOLO_URL = "https://beach-safety-ai-1.onrender.com/esp";

// ThingSpeak
const THINGSPEAK_KEY = "LE8HFPG3IL4MKSIQ";

app.get("/", (req, res) => {
  res.send("Node Bridge Server Running");
});

// ESP → Node → YOLO
app.post("/esp", async (req, res) => {
  try {

    // 🔍 DEBUG: check image size
    if (!req.body || req.body.length === 0) {
      console.log("EMPTY IMAGE RECEIVED");
      return res.json({ human: 0 });
    }

    console.log("Image size:", req.body.length);

    // Send to YOLO
    const response = await axios.post(YOLO_URL, req.body, {
      headers: {
        "Content-Type": "application/octet-stream"
      },
      timeout: 15000
    });

    const human = response.data?.human ?? 0;

    console.log("YOLO RESPONSE:", response.data);

    // ThingSpeak update (ONLY if valid response)
    try {
      await axios.get(
        `https://api.thingspeak.com/update?api_key=${THINGSPEAK_KEY}&field1=${human}`
      );
      console.log("ThingSpeak updated:", human);
    } catch (tsErr) {
      console.log("ThingSpeak error:", tsErr.message);
    }

    res.json({ human });

  } catch (err) {
    console.log("YOLO ERROR:", err.message);
    res.json({ human: 0 });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
