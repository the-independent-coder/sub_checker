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
  console.log("📬 Apple Notification Type:", body.notificationType || "(none)");
  console.log("Notification Version:", body.version || "1.0 (legacy)");
  console.log("------------------------------------------------");

  // ---- New format (Version 2) ----
  const signedTx = body.data?.signedTransactionInfo;
  if (signedTx) {
    const parts = signedTx.split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
    console.log("✅ [V2] Transaction ID:", payload.transactionId);
    console.log("Original Transaction ID:", payload.originalTransactionId);
    console.log("Product ID:", payload.productId);
    console.log("Expires Date:", payload.expiresDate);
    return;
  }

  // ---- Legacy format (Version 1) ----
  // These notifications look just like verifyReceipt JSON
  const info = body.latest_receipt_info || body.unified_receipt?.latest_receipt_info;
  if (Array.isArray(info) && info.length > 0) {
    const item = info[0];
    console.log("✅ [V1] Transaction ID:", item.transaction_id);
    console.log("Original Transaction ID:", item.original_transaction_id);
    console.log("Product ID:", item.product_id);
    console.log("Expires Date:", item.expires_date_ms || item.expires_date);
    return;
  }

  console.log("⚠️ No transaction fields found in payload (TEST or unsupported type)");
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
