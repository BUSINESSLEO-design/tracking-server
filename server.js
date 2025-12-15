require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

app.post("/api/track", async (req, res) => {
  const { tracking } = req.body;

  console.log("📦 Tracking ricevuto:", tracking);

  if (!tracking) {
    return res.status(400).json({ error: "Tracking mancante" });
  }

  try {
    // 1️⃣ Register (se già registrato non è un errore)
    const registerRes = await axios.post(
      "https://api.17track.net/track/v2.2/register",
      [{ number: tracking }],
      { headers: { "17token": process.env.TRACK17_TOKEN } }
    );

    console.log("✅ Register response:", JSON.stringify(registerRes.data));

    // 2️⃣ Get tracking info
    const trackRes = await axios.post(
      "https://api.17track.net/track/v2.2/gettrackinfo",
      [{ number: tracking }],
      { headers: { "17token": process.env.TRACK17_TOKEN } }
    );

    console.log("📡 GetTrackInfo raw:", JSON.stringify(trackRes.data));

    const accepted = trackRes.data?.data?.accepted;

    if (!accepted || !accepted.length) {
      return res.json({ error: "Tracking non trovato" });
    }

    const info = accepted[0].track_info;
    const latest = info.latest_event;

    res.json({
      carrier: accepted[0].tracking.providers[0].provider.name,
      status: info.latest_status.status,
      description: latest.description,
      location: latest.location || "—",
      time: latest.time_raw.date + " " + latest.time_raw.time
    });

  } catch (err) {
    console.error("❌ ERRORE:", err.response?.data || err.message);
    res.status(500).json({ error: "Errore server" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Server avviato"));





