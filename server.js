import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json({ limit: "1mb" }));

// -------------------
// Helper: decode JWT payload
// -------------------
function decodeJWSPayload(jws) {
  try {
    const parts = jws.split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
    return payload;
  } catch (err) {
    console.error("❌ Failed to decode JWS:", err);
    return null;
  }
}

// -------------------
// Shared function to handle Apple notification bodies
// -------------------
function handleNotification(body) {
  console.log("------------------------------------------------");
  console.log("📬 Apple Notification Type:", body.notificationType);
  console.log("Notification Version:", body.version || "(unknown)");
  console.log("------------------------------------------------");

  // Version 2 (new) notifications include signedTransactionInfo
  const signedTx = body.data?.signedTransactionInfo;
  if (signedTx) {
    const payload = decodeJWSPayload(signedTx);
    if (payload) {
      console.log("✅ Transaction ID:", payload.transactionId);
      console.log("Original Transaction ID:", payload.originalTransactionId);
      console.log("Product ID:", payload.productId);
      console.log("Expires Date:", payload.expiresDate);
    } else {
      console.log("❌ Could not decode signedTransactionInfo");
    }
  } else if (body.data?.signedRenewalInfo) {
    console.log("ℹ️ Notification has signedRenewalInfo only (no transaction)");
  } else {
    console.log("⚠️ No signedTransactionInfo found (probably TEST or V1 type)");
  }

  console.log("Full body:", JSON.stringify(body, null, 2));
  console.log("------------------------------------------------");
}

// -------------------
// Sandbox endpoint
// -------------------
app.post("/appstore/sandbox", (req, res) => {
  handleNotification(req.body);
  res.sendStatus(200);
});

// -------------------
// Production endpoint
// -------------------
app.post("/appstore/notifications", (req, res) => {
  handleNotification(req.body);
  res.sendStatus(200);
});

// -------------------
// Start server
// -------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Apple Server running on port ${PORT}`));
