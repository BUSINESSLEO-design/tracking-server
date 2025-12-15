require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

app.post("/api/track", async (req, res) => {
  const { tracking } = req.body;

  if (!tracking) {
    return res.status(400).json({ error: "Tracking mancante" });
  }

  try {
    console.log("📦 Tracking ricevuto:", tracking);

    // 1️⃣ Registra tracking (se già registrato non è un errore)
    const registerRes = await axios.post(
      "https://api.17track.net/track/v2.2/register",
      [{ number: tracking }],
      {
        headers: {
          "17token": process.env.TRACK17_TOKEN
        }
      }
    );

    console.log("✅ Register response:", JSON.stringify(registerRes.data));

    // 2️⃣ Recupera info tracking
    const infoRes = await axios.post(
      "https://api.17track.net/track/v2.2/gettrackinfo",
      [{ number: tracking }],
      {
        headers: {
          "17token": process.env.TRACK17_TOKEN
        }
      }
    );

    console.log("📡 GetTrackInfo raw:", JSON.stringify(infoRes.data));

    const accepted = infoRes.data?.data?.accepted;
    if (!accepted || accepted.length === 0) {
      return res.json({ error: "Tracking non trovato" });
    }

    const trackInfo = accepted[0].track_info;
    if (!trackInfo) {
      return res.json({ error: "Tracking non disponibile" });
    }

    const latestStatus = trackInfo.latest_status;
    const latestEvent = trackInfo.latest_event;

    res.json({
      status: latestStatus?.status || "Sconosciuto",
      description: latestEvent?.description || null,
      time: latestEvent?.time_utc || null,
      location: latestEvent?.location || null
    });

  } catch (err) {
    console.error("❌ ERRORE:", err.response?.data || err.message);
    res.status(500).json({ error: "Errore server" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Server avviato sulla porta", PORT));






