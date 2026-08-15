const defaultOrigins = new Set([
  "https://www.yha-edu.tech",
  "https://yha-edu.tech",
]);

function configuredOrigins() {
  return String(process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin)) return true;
  return defaultOrigins.has(origin) || configuredOrigins().includes(origin);
}

function appendVary(res, value) {
  const existing = res.getHeader?.("Vary");
  const values = String(existing || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!values.includes(value)) values.push(value);
  res.setHeader("Vary", values.join(", "));
}

export function applyCors(req, res, methods) {
  // Always vary the response, including same-origin requests without an Origin
  // header. This prevents a CDN cache entry without CORS headers from being
  // reused for a Flutter web request that does include an Origin header.
  appendVary(res, "Origin");

  const origin = req.headers?.origin;
  if (!isAllowedOrigin(origin)) return false;

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", methods.join(", "));
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Password");
  res.setHeader("Access-Control-Max-Age", "86400");
  return true;
}

export function handleCorsPreflight(req, res, methods) {
  applyCors(req, res, methods);
  if (req.method !== "OPTIONS") return false;
  res.status(204).end();
  return true;
}
