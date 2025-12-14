require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors({ origin: "*" }));

app.post("/api/shopify-track", async (req, res) => {
  const { order, email } = req.body;

  if (!order || !email) {
    return res.status(400).json({ error: "Dati mancanti" });
  }

  try {
    // 🔹 normalizziamo numero ordine
    const orderClean = order.replace("#", "").trim();

    // 🔹 1. prendiamo ultimi ordini (max 50)
    const shopifyRes = await axios.get(
      `https://${process.env.SHOPIFY_STORE}/admin/api/2024-01/orders.json?status=any&limit=50`,
      {
        headers: {
          "X-Shopify-Access-Token": process.env.SHOPIFY_TOKEN,
        },
      }
    );

    const orders = shopifyRes.data.orders;

    // 🔹 2. cerchiamo l'ordine giusto
    const ordine = orders.find(
      (o) =>
        String(o.order_number) === orderClean &&
        o.email?.toLowerCase() === email.toLowerCase()
    );

    if (!ordine) {
      return res.json({ error: "Ordine non trovato" });
    }

    // 🔹 3. controllo spedizione
    if (!ordine.fulfillments || ordine.fulfillments.length === 0) {
      return res.json({ error: "Ordine non ancora spedito" });
    }

    const fulfillment = ordine.fulfillments[0];
    const trackingNumber = fulfillment.tracking_number;

    if (!trackingNumber) {
      return res.json({ error: "Tracking non disponibile" });
    }

    // 🔹 4. 17TRACK
    const trackRes = await axios.post(
      "https://api.17track.net/track/v2.2/gettrackinfo",
      [{ number: trackingNumber }],
      {
        headers: {
          "17token": process.env.TRACK17_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    const trackData = trackRes.data?.data?.[0]?.track_info;

    if (!trackData || !trackData.latest_status) {
      return res.json({ error: "Tracking non trovato su 17Track" });
    }

    const latest = trackData.latest_status;

    return res.json({
      order: ordine.name,
      carrier: fulfillment.tracking_company,
      trackingNumber,
      status: latest.status,
      location: latest.location,
      time: latest.time,
    });

  } catch (err) {
    console.error("ERRORE:", err.response?.data || err.message);
    return res.status(500).json({ error: "Errore server" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server avviato su porta", PORT);
});

