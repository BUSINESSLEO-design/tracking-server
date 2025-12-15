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
    return res.json({ error: "Codice tracking mancante" });
  }

  try {
    const response = await axios.post(
      "https://api.17track.net/track/v2.2/gettrackinfo",
      [{ number: tracking }],
      {
        headers: {
          "17token": process.env.TRACK17_TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    const data = response.data.data[0];

    if (!data || !data.track_info || !data.track_info.latest_status) {
      return res.json({ error: "Tracking non trovato" });
    }

    const status = data.track_info.latest_status;

    res.json({
      status: status.status,
      location: status.location || "Non disponibile",
      time: status.time
    });

  } catch (err) {
    res.json({ error: "Errore durante il tracking" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server tracking attivo");
});



