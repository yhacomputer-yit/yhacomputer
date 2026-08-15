import assert from "node:assert/strict";
import test from "node:test";
import { applyCors, handleCorsPreflight } from "../api/_cors.js";

class MockResponse {
  constructor() {
    this.headers = new Map();
    this.statusCode = null;
    this.ended = false;
  }

  setHeader(name, value) {
    this.headers.set(name.toLowerCase(), value);
  }

  getHeader(name) {
    return this.headers.get(name.toLowerCase());
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  end() {
    this.ended = true;
  }
}

test("allows a Flutter web localhost origin", () => {
  const res = new MockResponse();
  const allowed = applyCors(
    { headers: { origin: "http://localhost:60981" } },
    res,
    ["GET", "OPTIONS"]
  );

  assert.equal(allowed, true);
  assert.equal(res.getHeader("access-control-allow-origin"), "http://localhost:60981");
  assert.equal(res.getHeader("access-control-allow-methods"), "GET, OPTIONS");
  assert.match(res.getHeader("access-control-allow-headers"), /X-Admin-Password/);
  assert.equal(res.getHeader("vary"), "Origin");
});

test("handles an allowed localhost OPTIONS preflight without invoking endpoint logic", () => {
  const res = new MockResponse();
  const handled = handleCorsPreflight(
    { method: "OPTIONS", headers: { origin: "http://127.0.0.1:64613" } },
    res,
    ["POST", "OPTIONS"]
  );

  assert.equal(handled, true);
  assert.equal(res.statusCode, 204);
  assert.equal(res.ended, true);
  assert.equal(res.getHeader("access-control-allow-origin"), "http://127.0.0.1:64613");
});

test("does not grant CORS access to an untrusted origin", () => {
  const res = new MockResponse();
  const allowed = applyCors(
    { headers: { origin: "https://untrusted.example" } },
    res,
    ["GET", "OPTIONS"]
  );

  assert.equal(allowed, false);
  assert.equal(res.getHeader("access-control-allow-origin"), undefined);
});
