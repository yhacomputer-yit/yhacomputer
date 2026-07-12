function toHttpUrl(url) {
  return url.replace(/^libsql:\/\//, "https://").replace(/\/+$/, "");
}

function toArg(value) {
  return { type: "text", value };
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 20_000) {
        reject(new Error("Request body is too large."));
      }
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

  const url = process.env.TURSO_DATABASE_URL;
  const token =
    process.env.TURSO_WRITE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) {
    res.status(500).json({ error: "Contact service is not configured." });
    return;
  }

  try {
    const body = await readBody(req);
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();

    if (!name || !email || !message) {
      res.status(400).json({ error: "Name, email, and message are required." });
      return;
    }
    if (name.length > 120 || email.length > 254 || message.length > 3000) {
      res.status(400).json({ error: "One or more fields are too long." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Enter a valid email address." });
      return;
    }

    const response = await fetch(toHttpUrl(url) + "/v2/pipeline", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            type: "execute",
            stmt: {
              sql: "INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)",
              args: [name, email, message].map(toArg),
            },
          },
          { type: "close" },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Turso request failed with status " + response.status);
    }
    const data = await response.json();
    const result = data.results[0];
    if (result.type === "error") {
      throw new Error(result.error && result.error.message);
    }

    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(502).json({ error: String(error.message || error) });
  }
}
