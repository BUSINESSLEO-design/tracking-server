require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

/**
 * TEST SERVER
 */
app.get("/", (req, res) => {
  res.send("Tracking server online ✅");
});

/**
 * TRACKING ENDPOINT
 */
app.post("/api/track", async (req, res) => {
  const { tracking } = req.body;

  console.log("📦 Tracking ricevuto:", tracking);

  if (!tracking) {
    return res.status(400).json({ error: "Tracking mancante" });
  }

  try {
    // 1️⃣ REGISTRA TRACKING
    const registerRes = await axios.post(
      "https://api.17track.net/track/v2.2/register",
      [{ number: tracking }],
      {
        headers: {
          "17token": process.env.TRACK17_TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Register response:", JSON.stringify(registerRes.data));

    // 2️⃣ RECUPERA INFO
    const infoRes = await axios.post(
      "https://api.17track.net/track/v2.2/gettrackinfo",
      [{ number: tracking }],
      {
        headers: {
          "17token": process.env.TRACK17_TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("📡 GetTrackInfo raw:", JSON.stringify(infoRes.data));

    const item = infoRes.data?.data?.[0];

    if (!item || !item.track_info) {
      return res.json({
        error: "Tracking non ancora disponibile",
        raw: item
      });
    }

    const latest = item.track_info.latest_status;

    res.json({
      success: true,
      carrier: item.carrier?.name || "N/D",
      status: latest?.status || "N/D",
      time: latest?.time || "N/D",
      location: latest?.location || "N/D"
    });

  } catch (err) {
    console.error("❌ ERRORE 17TRACK:", err.response?.data || err.message);

    res.status(500).json({
      error: "Errore comunicazione 17TRACK",
      details: err.response?.data || err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server avviato sulla porta", PORT);
});




