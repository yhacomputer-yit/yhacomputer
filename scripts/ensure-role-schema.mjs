import { ensureSchema, query } from "../api/_db.js";

await ensureSchema();
const checks = await Promise.all([
  query("SELECT COUNT(*) AS count FROM teacher_accounts"),
  query("SELECT COUNT(*) AS count FROM attendance_records"),
  query("SELECT COUNT(*) AS count FROM assignments"),
  query("SELECT COUNT(*) AS count FROM enrollments"),
]);
console.log(JSON.stringify({
  teacher_accounts: Number(checks[0][0]?.count || 0),
  attendance_records: Number(checks[1][0]?.count || 0),
  assignments: Number(checks[2][0]?.count || 0),
  enrollments: Number(checks[3][0]?.count || 0),
}, null, 2));
