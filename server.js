// server.js
import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import axios from "axios";
import fs from "fs";

const app = express();
app.use(bodyParser.json());

// 🔹 Replace these with your actual App Store Connect credentials
const ISSUER_ID = "fa542857-e074-400a-b7ee-bc635ee85c4d";
const KEY_ID = "V6D4W794J2";
const BUNDLE_ID = "com.theindependentcoder.Warehouse";
const PRIVATE_KEY = fs.readFileSync("./AuthKey_V6D4W794J2.p8", "utf8");

// Generate JWT for Apple API
function generateToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: ISSUER_ID,
    iat: now,
    exp: now + 1800, // valid for 30 minutes
    aud: "appstoreconnect-v1",
    bid: BUNDLE_ID
  };
  const header = { alg: "ES256", kid: KEY_ID, typ: "JWT" };
  return jwt.sign(payload, PRIVATE_KEY, { algorithm: "ES256", header });
}

// POST /verify  body: { "transactionId": "XXXX" }
app.post("/verify", async (req, res) => {
  const { transactionId } = req.body;
  if (!transactionId) return res.status(400).json({ error: "Missing transactionId" });

  const token = generateToken();
  const url = `https://api.storekit.itunes.apple.com/inApps/v1/subscriptions/${transactionId}`;

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.response?.data });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
