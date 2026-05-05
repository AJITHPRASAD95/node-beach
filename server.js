const express = require("express");
const axios = require("axios");

const app = express();

// IMPORTANT: raw image buffer
app.use(express.raw({ type: "*/*", limit: "10mb" }));

const YOLO_URL = "https://beach-safety-ai-1.onrender.com/esp";

const THINGSPEAK_KEY = "LE8HFPG3IL4MKSIQ";

app.get("/", (req, res) => {
  res.send("Node Bridge Running");
});

app.post("/esp", async (req, res) => {
  try {
    if (!req.body || req.body.length === 0) {
      return res.json({ human: 0 });
    }

    console.log("Image size:", req.body.length);

    const response = await axios.post(YOLO_URL, req.body, {
      headers: { "Content-Type": "application/octet-stream" },
      timeout: 15000
    }).catch(() => {
      return { data: { human: 0 } };
    });

    const human = response.data?.human ?? 0;

    console.log("YOLO:", response.data);

    // ThingSpeak update
    await axios.get(
      `https://api.thingspeak.com/update?api_key=${THINGSPEAK_KEY}&field1=${human}`
    );

    console.log("ThingSpeak:", human);

    res.json({ human });

  } catch (err) {
    console.log("ERROR:", err.message);
    res.json({ human: 0 });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
