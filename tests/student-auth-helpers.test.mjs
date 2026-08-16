import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import { hashPassword, passwordNeedsUpgrade, verifyPassword } from "../api/_db.js";

test("new student passwords use a unique scrypt hash and verify correctly", () => {
  const first = hashPassword("YHA-Student-Password-2026");
  const second = hashPassword("YHA-Student-Password-2026");

  assert.match(first, /^scrypt\$[^$]+\$[^$]+$/);
  assert.notEqual(first, second);
  assert.equal(verifyPassword("YHA-Student-Password-2026", first), true);
  assert.equal(verifyPassword("wrong-password", first), false);
  assert.equal(passwordNeedsUpgrade(first), false);
});

test("legacy SHA-256 passwords are accepted once so successful login can upgrade them", () => {
  const legacy = crypto.createHash("sha256").update("LegacyPass123").digest("hex");

  assert.equal(verifyPassword("LegacyPass123", legacy), true);
  assert.equal(verifyPassword("not-the-password", legacy), false);
  assert.equal(passwordNeedsUpgrade(legacy), true);
});
