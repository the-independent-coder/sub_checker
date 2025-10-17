import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";

const app = express();
app.use(bodyParser.json({ limit: "1mb" }));

// Endpoint for sandbox notifications
app.post("/appstore/sandbox", async (req, res) => {
  console.log("📩 Notification received (sandbox)");
  handleNotification(req.body);
  res.sendStatus(200);
});

// Endpoint for production notifications
app.post("/appstore/notifications", async (req, res) => {
  console.log("📩 Notification received (production)");
  handleNotification(req.body);
  res.sendStatus(200);
});

function handleNotification(body) {
  console.log("NotificationType:", body.notificationType);

  const signedTx = body.data?.signedTransactionInfo;
  if (!signedTx) {
    console.log("No signedTransactionInfo");
    return;
  }

  // Decode JWS without verification (Apple’s payload is signed by Apple)
  const parts = signedTx.split(".");
  const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));

  console.log("Transaction ID:", payload.transactionId);
  console.log("Original Transaction ID:", payload.originalTransactionId);
  console.log("Product ID:", payload.productId);
  console.log("Expires Date:", payload.expiresDate);
  console.log("Environment:", payload.environment);

  // Here you’d store it in your database, e.g.:
  // db.saveSubscription(payload.originalTransactionId, payload.expiresDate, payload.productId);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));
