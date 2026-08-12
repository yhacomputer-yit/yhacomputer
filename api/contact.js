import { ensureSchema, execute } from "./_db.js";

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 20_000) reject(new Error("Request body is too large."));
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    await ensureSchema();
    const body = await readBody(req);
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const message = String(body.message || "").trim();

    if (!name || !email || !message) {
      res.status(400).json({ error: "Name, email, and message are required." });
      return;
    }
    if (name.length > 120 || email.length > 254 || message.length > 3000) {
      res.status(400).json({ error: "One or more fields are too long." });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ error: "Enter a valid email address." });
      return;
    }

    await execute("INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)", [name, email, message]);
    res.status(201).json({ ok: true, message: "Thanks — your message has been sent." });
  } catch (error) {
    res.status(502).json({ error: String(error?.message || error) });
  }
}
