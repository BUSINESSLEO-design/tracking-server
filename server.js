require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());

app.use(cors({
  origin: "*"
}));

app.post("/api/shopify-track", async (req, res) => {
  const { order, email } = req.body;

  if (!order || !email) {
    return res.json({ error: "Dati mancanti" });
  }

  try {
    // 1️⃣ Shopify – cerca ordine reale
    const shopifyRes = await axios.get(
      `https://${process.env.SHOPIFY_STORE}/admin/api/2024-01/orders.json?name=${order}`,
      {
        headers: {
          "X-Shopify-Access-Token": process.env.SHOPIFY_TOKEN
        }
      }
    );

    const ordine = shopifyRes.data.orders[0];
    if (!ordine || ordine.email !== email) {
      return res.json({ error: "Ordine non trovato" });
    }

    // 2️⃣ Recupera tracking
    const fulfillment = ordine.fulfillments[0];
    if (!fulfillment || !fulfillment.tracking_number) {
      return res.json({ error: "Ordine non ancora spedito" });
    }

    const trackingNumber = fulfillment.tracking_number;

    // 3️⃣ 17Track
    const trackRes = await axios.post(
      "https://api.17track.net/track/v2.2/gettrackinfo",
      [{ number: trackingNumber }],
      {
        headers: {
          "17token": process.env.TRACK17_TOKEN
        }
      }
    );

    const info = trackRes.data.data[0].track_info.latest_status;

    res.json({
      status: info.status,
      time: info.time,
      location: info.location
    });

  } catch (err) {
    res.json({ error: "Errore server" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
