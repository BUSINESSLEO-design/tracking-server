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
    // 🔹 Normalizziamo numero ordine
    const cleanOrder = order.replace("#", "").trim();

    // 🔹 Prendiamo gli ultimi 50 ordini
    const shopifyRes = await axios.get(
      `https://${process.env.SHOPIFY_STORE}/admin/api/2024-01/orders.json?status=any&limit=50`,
      {
        headers: {
          "X-Shopify-Access-Token": process.env.SHOPIFY_TOKEN,
        },
      }
    );

    // 🔹 Cerchiamo ordine giusto
    const ordine = shopifyRes.data.orders.find(
      (o) =>
        String(o.order_number) === cleanOrder &&
        o.email?.toLowerCase() === email.toLowerCase()
    );

    if (!ordine) {
      return res.json({ error: "Ordine non trovato" });
    }

    // 🔹 Fulfillment
    const fulfillment = ordine.fulfillments?.[0];
    if (!fulfillment || !fulfillment.tracking_number) {
      return res.json({ error: "Ordine non ancora spedito" });
    }

    const trackingNumber = fulfillment.tracking_number;

    // 🔹 17Track
    const trackRes = await axios.post(
      "https://api.17track.net/track/v2.2/gettrackinfo",
      [{ number: trackingNumber }],
      {
        headers: {
          "17token": process.env.TRACK17_TOKEN,
        },
      }
    );

    const latest = trackRes.data.data?.[0]?.track_info?.latest_status;

    return res.json({
      order: ordine.name,
      status: latest?.status || "Sconosciuto",
      location: latest?.location || "",
      time: latest?.time || "",
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).json({ error: "Errore server" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server avviato"));


