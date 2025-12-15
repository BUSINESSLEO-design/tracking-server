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
    // 1️⃣ Registra tracking su 17TRACK
    await axios.post(
      "https://api.17track.net/track/v2.2/register",
      [{ number: tracking }],
      {
        headers: {
          "17token": process.env.TRACK17_TOKEN
        }
      }
    );

    // 2️⃣ Recupera info tracking
    const response = await axios.post(
      "https://api.17track.net/track/v2.2/gettrackinfo",
      [{ number: tracking }],
      {
        headers: {
          "17token": process.env.TRACK17_TOKEN
        }
      }
    );

    const data = response.data?.data?.[0];
    if (!data || !data.track_info) {
      return res.json({ error: "Tracking non trovato" });
    }

    const latest = data.track_info.latest_status;

    res.json({
      status: latest.status,
      time: latest.time,
      location: latest.location
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Errore server" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server avviato"));



