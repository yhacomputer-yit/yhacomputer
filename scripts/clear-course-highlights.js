import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

for (const fileName of [".env", ".env.local"]) {
  const envPath = path.join(projectRoot, fileName);
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const { execute, query } = await import("../api/_db.js");
await execute("UPDATE courses SET highlights = NULL WHERE highlights IS NOT NULL");
const rows = await query("SELECT COUNT(*) AS total_courses, SUM(CASE WHEN highlights IS NOT NULL AND TRIM(highlights) <> '' THEN 1 ELSE 0 END) AS courses_with_highlights FROM courses");
console.log(JSON.stringify({ ok: true, ...rows[0] }, null, 2));
