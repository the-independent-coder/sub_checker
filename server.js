// server.js
import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json({ limit: "2mb" }));

// --- Helper to decode any JWS/JWT token ---
function decodeJWS(jws) {
  if (!jws) return null;
  try {
    const [headerB64, payloadB64, signatureB64] = jws.split(".");
    const header = JSON.parse(Buffer.from(headerB64, "base64").toString("utf8"));
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf8"));
    return { header, payload, signature: signatureB64 };
  } catch (err) {
    console.error("❌ Failed to decode JWS:", err.message);
    return null;
  }
}

// --- Main handler ---
function handleNotification(body) {
  console.log("=====================================================");
  console.log("📬 Apple Notification Received");
  console.log("-----------------------------------------------------");

  const signedPayload = body.data?.signedPayload;
  if (!signedPayload) {
    console.log("⚠️ No signedPayload field found in body.");
    console.log("Full body:", JSON.stringify(body, null, 2));
    console.log("=====================================================");
    return;
  }

  // Decode the outer signedPayload
  const outer = decodeJWS(signedPayload);
  if (!outer) {
    console.log("❌ Could not decode outer signedPayload.");
    return;
  }

  console.log("🧩 Outer Header:", JSON.stringify(outer.header, null, 2));
  console.log("🧩 Outer Payload:", JSON.stringify(outer.payload, null, 2));

  const notificationType = outer.payload.notificationType || "(none)";
  console.log("🔔 Notification Type:", notificationType);
  console.log("🔧 Environment:", outer.payload.environment);
  console.log("📅 Signed Date:", new Date(outer.payload.signedDate || 0).toISOString());

  // If Apple included an inner transaction JWS, decode that too
  const innerSignedTx = outer.payload.data?.signedTransactionInfo;
  if (innerSignedTx) {
    const tx = decodeJWS(innerSignedTx);
    if (tx) {
      console.log("✅ Inner Transaction Payload:", JSON.stringify(tx.payload, null, 2));
      console.log("➡️ Transaction ID:", tx.payload.transactionId);
      console.log("➡️ Original Transaction ID:", tx.payload.originalTransactionId);
      console.log("➡️ Product ID:", tx.payload.productId);
      console.log("➡️ Purchase Date:", new Date(tx.payload.purchaseDate || 0).toISOString());
      console.log("➡️ Expires Date:", new Date(tx.payload.expiresDate || 0).toISOString());
    } else {
      console.log("⚠️ Could not decode signedTransactionInfo");
    }
  } else {
    console.log("ℹ️ No signedTransactionInfo found in this payload (probably TEST or non-purchase event).");
  }

  console.log("=====================================================");
}

// --- Sandbox endpoint ---
app.post("/appstore/sandbox", (req, res) => {
  handleNotification(req.body);
  res.sendStatus(200);
});

// --- Production endpoint ---
app.post("/appstore/notifications", (req, res) => {
  handleNotification(req.body);
  res.sendStatus(200);
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Apple server listening on port ${PORT}`));
