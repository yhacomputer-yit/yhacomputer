import assert from "node:assert/strict";
import test from "node:test";
import { __testables } from "../api/data.js";

const { filterCourses, filterNotifications, paginate } = __testables;

test("public course filters exclude unpublished records and prioritize featured order", () => {
  const rows = filterCourses([
    { id: "1", title: "Visible later", subject: "ICT", featured: "0", sort_order: "5", is_published: "1" },
    { id: "2", title: "Hidden draft", subject: "ICT", featured: "1", sort_order: "0", is_published: "0" },
    { id: "3", title: "Featured first", subject: "Programming", featured: "1", sort_order: "9", is_published: "1" },
    { id: "4", title: "Featured ordered", subject: "ICT", featured: "1", sort_order: "2", is_published: "1" },
  ], {});

  assert.deepEqual(rows.map((row) => row.id), ["4", "3", "1"]);
  assert.deepEqual(
    filterCourses(rows, { subject: "ict", q: "visible" }).map((row) => row.id),
    ["1"]
  );
});

test("notification feed excludes future and expired records while keeping priority order", () => {
  const now = Date.now();
  const notifications = filterNotifications([
    { id: "1", title: "Normal", priority: "normal", created_at: new Date(now - 1000).toISOString() },
    { id: "2", title: "High", priority: "high", created_at: new Date(now - 2000).toISOString() },
    { id: "3", title: "Future", priority: "urgent", publish_at: new Date(now + 60000).toISOString() },
    { id: "4", title: "Expired", priority: "urgent", expires_at: new Date(now - 1).toISOString() },
    { id: "5", title: "Urgent", priority: "urgent", created_at: new Date(now - 3000).toISOString() },
  ], {});

  assert.deepEqual(notifications.map((row) => row.id), ["5", "2", "1"]);
  assert.equal(notifications.every((row) => row.is_read === 0), true);
  assert.deepEqual(
    filterNotifications(notifications, { since_id: "2" }).map((row) => row.id),
    ["5"]
  );
});

test("collection pagination reports stable metadata", () => {
  const page = paginate([{ id: 1 }, { id: 2 }, { id: 3 }], { limit: "2", offset: "1" });
  assert.deepEqual(page.data, [{ id: 2 }, { id: 3 }]);
  assert.deepEqual(page.meta, { total: 3, limit: 2, offset: 1, has_more: false });
});
