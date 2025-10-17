function handleNotification(body) {
  console.log("------------------------------------------------");
  console.log("📬 Apple Notification Type:", body.notificationType || "(none)");
  console.log("Notification Version:", body.version || "2.0");
  console.log("------------------------------------------------");

  // Helper to decode any JWS/JWT
  const decodeJWS = (token) => {
    try {
      const [, payload] = token.split(".");
      return JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    } catch (err) {
      console.error("❌ Failed to decode:", err.message);
      return null;
    }
  };

  // ---- Case 1: signedPayload (outer envelope) ----
  const signedPayload = body.data?.signedPayload;
  if (signedPayload) {
    const payload = decodeJWS(signedPayload);
    if (payload) {
      console.log("🧩 Decoded signedPayload:");
      console.log(JSON.stringify(payload, null, 2));

      // If this payload itself contains another signedTransactionInfo, decode it
      const signedTx = payload.data?.signedTransactionInfo;
      if (signedTx) {
        const tx = decodeJWS(signedTx);
        console.log("✅ Transaction ID:", tx.transactionId);
        console.log("Original Transaction ID:", tx.originalTransactionId);
        console.log("Product ID:", tx.productId);
        console.log("Expires Date:", tx.expiresDate);
        return;
      }

      console.log("ℹ️ No signedTransactionInfo in this payload (likely TEST or renewal info only).");
      return;
    }
  }

  // ---- Case 2: direct signedTransactionInfo (plain V2) ----
  const signedTx = body.data?.signedTransactionInfo;
  if (signedTx) {
    const tx = decodeJWS(signedTx);
    console.log("✅ Transaction ID:", tx.transactionId);
    console.log("Original Transaction ID:", tx.originalTransactionId);
    console.log("Product ID:", tx.productId);
    console.log("Expires Date:", tx.expiresDate);
    return;
  }

  console.log("⚠️ No transaction fields found in payload (TEST or unsupported type)");
  console.log("Full body:", JSON.stringify(body, null, 2));
  console.log("------------------------------------------------");
}
