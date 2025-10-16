import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

// --- credentials will come from Render environment variables ---
const ISSUER_ID = process.env.ISSUER_ID;
const KEY_ID = process.env.KEY_ID;
const BUNDLE_ID = process.env.BUNDLE_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// create JWT for Apple API
function generateToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: ISSUER_ID,
    iat: now,
    exp: now + 1800,       // valid for 30 minutes
    aud: "appstoreconnect-v1",
    bid: BUNDLE_ID
  };
  const header = { alg: "ES256", kid: KEY_ID, typ: "JWT" };
  return jwt.sign(payload, PRIVATE_KEY, { algorithm: "ES256", header });
}

// verify endpoint
app.post("/verify", async (req, res) => {
  const { transactionId } = req.body;
  if (!transactionId)
    return res.status(400).json({ error: "Missing transactionId" });

  try {
    const token = generateToken();
    const url = `https://api.storekit.itunes.apple.com/inApps/v1/subscriptions/${transactionId}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.response?.data });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on port", port));
