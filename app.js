// Loads course, event and review data from the Turso database and renders it
// into the page. Configuration (database URL + auth token) comes from
// window.YHA_CONFIG, which is defined in config.js (see config.example.js).

(function () {
  "use strict";

  const config = window.YHA_CONFIG || {};

  function toHttpUrl(url) {
    if (!url) return "";
    // Turso accepts libsql:// URLs; the HTTP API lives on the https:// host.
    return url.replace(/^libsql:\/\//, "https://").replace(/\/+$/, "");
  }

  async function runQueries(statements) {
    const baseUrl = toHttpUrl(config.TURSO_DATABASE_URL);
    if (!baseUrl || !config.TURSO_AUTH_TOKEN) {
      throw new Error(
        "Missing Turso configuration. Copy config.example.js to config.js and fill in your credentials."
      );
    }

    const requests = statements.map((sql) => ({
      type: "execute",
      stmt: { sql },
    }));
    requests.push({ type: "close" });

    const res = await fetch(baseUrl + "/v2/pipeline", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + config.TURSO_AUTH_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
    });

    if (!res.ok) {
      throw new Error("Turso request failed with status " + res.status);
    }

    const data = await res.json();
    return data.results.map((result) => {
      if (result.type === "error") {
        throw new Error(result.error && result.error.message);
      }
      if (result.response && result.response.type === "execute") {
        return rowsToObjects(result.response.result);
      }
      return null;
    });
  }

  function rowsToObjects(result) {
    const cols = result.cols.map((c) => c.name);
    return result.rows.map((row) => {
      const obj = {};
      row.forEach((cell, i) => {
        obj[cols[i]] = cell == null ? null : cell.value;
      });
      return obj;
    });
  }

  function escapeHtml(value) {
    if (value == null) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setStatus(el, message) {
    if (!el) return;
    el.innerHTML = message
      ? '<p class="data-status">' + escapeHtml(message) + "</p>"
      : "";
  }

  function renderCourses(courses) {
    const grid = document.getElementById("courses-grid");
    if (!grid) return;
    if (!courses.length) {
      setStatus(grid, "No courses available yet.");
      return;
    }
    grid.innerHTML = courses
      .map(function (c) {
        const meta = [c.level, c.duration].filter(Boolean).join(" \u00b7 ");
        return (
          '<div class="card">' +
          (c.image
            ? '<img src="' +
              escapeHtml(c.image) +
              '" alt="' +
              escapeHtml(c.title) +
              '">'
            : "") +
          "<h3>" +
          escapeHtml(c.title) +
          "</h3>" +
          (meta ? '<p class="course-meta">' + escapeHtml(meta) + "</p>" : "") +
          "<p>" +
          escapeHtml(c.description) +
          "</p>" +
          (c.highlights
            ? '<p class="course-highlights">' +
              escapeHtml(c.highlights) +
              "</p>"
            : "") +
          (c.price
            ? '<div class="price">Fee: ' + escapeHtml(c.price) + "</div>"
            : "") +
          '<button class="btn-enroll">Enroll Now</button>' +
          "</div>"
        );
      })
      .join("");
  }

  function renderEvents(events) {
    const grid = document.getElementById("events-grid");
    if (!grid) return;
    if (!events.length) {
      setStatus(grid, "No upcoming events yet.");
      return;
    }
    grid.innerHTML = events
      .map(function (e) {
        const footer = [e.venue, e.duration].filter(Boolean).join(" \u00b7 ");
        return (
          '<article class="card event-card">' +
          (e.category
            ? '<div class="event-pill">' + escapeHtml(e.category) + "</div>"
            : "") +
          "<h3>" +
          escapeHtml(e.title) +
          "</h3>" +
          "<p>" +
          escapeHtml(e.description) +
          "</p>" +
          (e.date
            ? '<span class="event-date">' + escapeHtml(e.date) + "</span>"
            : "") +
          (footer
            ? '<span class="event-meta">' + escapeHtml(footer) + "</span>"
            : "") +
          "</article>"
        );
      })
      .join("");
  }

  function renderReviews(reviews) {
    const grid = document.getElementById("reviews-grid");
    if (!grid) return;
    if (!reviews.length) {
      setStatus(grid, "No reviews yet.");
      return;
    }
    grid.innerHTML = reviews
      .map(function (r) {
        const attribution = [r.name, r.course_name]
          .filter(Boolean)
          .join(" \u2014 ");
        return (
          '<div class="card review-card">' +
          "<p>&ldquo;" +
          escapeHtml(r.message) +
          "&rdquo;</p>" +
          (attribution ? "<h4>- " + escapeHtml(attribution) + "</h4>" : "") +
          "</div>"
        );
      })
      .join("");
  }

  async function init() {
    const grids = ["courses-grid", "events-grid", "reviews-grid"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    grids.forEach((g) => setStatus(g, "Loading\u2026"));

    try {
      const [courses, events, reviews] = await runQueries([
        "SELECT * FROM courses ORDER BY id",
        "SELECT * FROM events ORDER BY id",
        "SELECT * FROM reviews ORDER BY id DESC",
      ]);
      renderCourses(courses);
      renderEvents(events);
      renderReviews(reviews);
    } catch (err) {
      console.error("Failed to load data from Turso:", err);
      grids.forEach((g) =>
        setStatus(g, "Could not load data. " + (err.message || ""))
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
