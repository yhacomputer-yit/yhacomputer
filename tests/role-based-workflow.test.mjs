import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("..", import.meta.url);
const file = (path) => new URL(path, `${root.href}/`);

async function source(path) {
  return readFile(file(path), "utf8");
}

test("canonical schema isolates teacher credentials and records accountable teaching actions", async () => {
  const schema = await source("database-schema.sql");
  assert.match(schema, /CREATE TABLE IF NOT EXISTS teacher_accounts/);
  assert.match(schema, /teacher_id INTEGER NOT NULL UNIQUE REFERENCES teachers\(id\) ON DELETE CASCADE/);
  assert.match(schema, /teacher_code TEXT NOT NULL UNIQUE/);
  assert.match(schema, /marked_by_teacher_id INTEGER REFERENCES teachers\(id\) ON DELETE SET NULL/);
  assert.match(schema, /created_by_teacher_id INTEGER REFERENCES teachers\(id\) ON DELETE SET NULL/);
  assert.match(schema, /graded_by_teacher_id INTEGER REFERENCES teachers\(id\) ON DELETE SET NULL/);
});

test("teacher API authorizes course operations through course teacher assignments", async () => {
  const api = await source("api/teacher.js");
  assert.match(api, /JOIN course_teachers ct ON ct\.course_id = c\.id/);
  assert.match(api, /await assignedCourse\(teacher\.teacher_id, courseId\)/);
  assert.match(api, /One or more learners do not belong to this assigned course\/session/);
  assert.match(api, /You are not allowed to grade this submission/);
});

test("admin API never exposes teacher password hashes in account list responses", async () => {
  const admin = await source("api/admin.js");
  assert.match(admin, /CASE WHEN a\.password_hash IS NULL OR a\.password_hash = '' THEN 0 ELSE 1 END AS password_set/);
  assert.doesNotMatch(admin, /SELECT a\.\*, t\.name AS teacher_name/);
  assert.match(admin, /Create the teacher account as pending, then generate a password to activate access safely/);
});
