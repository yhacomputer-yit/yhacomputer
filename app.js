// Loads course, event and review data from the /api/data serverless endpoint
// (which reads them from Turso server-side) and renders it into the page.

(function () {
  "use strict";

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

  let coursesCache = [];

  function renderCourses(courses) {
    const grid = document.getElementById("courses-grid");
    if (!grid) return;
    coursesCache = courses || [];
    if (!courses || !courses.length) {
      setStatus(grid, "No courses available yet.");
      return;
    }
    grid.innerHTML = courses
      .map(function (c, i) {
        return (
          '<div class="card course-card-home">' +
          (c.image
            ? '<img src="' +
              escapeHtml(c.image) +
              '" alt="' +
              escapeHtml(c.title) +
              '">'
            : "") +
          (c.level
            ? '<span class="level-badge">' + escapeHtml(c.level) + "</span>"
            : "") +
          "<h3>" +
          escapeHtml(c.title) +
          "</h3>" +
          '<div class="course-info">' +
          (c.duration
            ? '<span class="course-info-item">\u23f1 ' +
              escapeHtml(c.duration) +
              "</span>"
            : "") +
          (c.price
            ? '<span class="course-info-item price">' +
              escapeHtml(c.price) +
              "</span>"
            : "") +
          "</div>" +
          '<button class="btn-enroll" data-course="' +
          i +
          '">View Details</button>' +
          "</div>"
        );
      })
      .join("");
    grid.querySelectorAll("[data-course]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openCourseModal(coursesCache[Number(btn.dataset.course)]);
      });
    });
  }

  function openCourseModal(c) {
    if (!c) return;
    const modal = document.getElementById("course-modal");
    if (!modal) return;
    const img = document.getElementById("modal-image");
    const media = img ? img.parentElement : null;
    if (c.image) {
      img.src = c.image;
      img.alt = c.title || "";
      if (media) media.hidden = false;
    } else if (media) {
      media.hidden = true;
    }
    document.getElementById("modal-title").textContent = c.title || "";
    document.getElementById("modal-badges").innerHTML = [
      c.subject,
      c.level,
      c.duration,
    ]
      .filter(Boolean)
      .map((b) => '<span class="modal-badge">' + escapeHtml(b) + "</span>")
      .join("");
    document.getElementById("modal-price").textContent = c.price
      ? "Fee: " + c.price
      : "";
    document.getElementById("modal-desc").textContent = c.description || "";
    const highlights = document.getElementById("modal-highlights");
    if (c.highlights) {
      highlights.innerHTML =
        "<h4>What you'll learn</h4><ul>" +
        c.highlights
          .split(",")
          .map((h) => "<li>" + escapeHtml(h.trim()) + "</li>")
          .join("") +
        "</ul>";
    } else {
      highlights.innerHTML = "";
    }
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeCourseModal() {
    const modal = document.getElementById("course-modal");
    if (modal) modal.hidden = true;
    document.body.style.overflow = "";
  }

  function setupModal() {
    const modal = document.getElementById("course-modal");
    if (!modal) return;
    const close = document.getElementById("modal-close");
    if (close) close.addEventListener("click", closeCourseModal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeCourseModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeCourseModal();
    });
  }

  function renderEvents(events) {
    const grid = document.getElementById("events-grid");
    if (!grid) return;
    if (!events || !events.length) {
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
    if (!reviews || !reviews.length) {
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
    setupModal();
    const grids = ["courses-grid", "events-grid", "reviews-grid"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    grids.forEach((g) => setStatus(g, "Loading\u2026"));

    try {
      const res = await fetch("/api/data");
      if (!res.ok) {
        throw new Error("Request failed with status " + res.status);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      renderCourses(data.courses);
      renderEvents(data.events);
      renderReviews(data.reviews);
    } catch (err) {
      console.error("Failed to load data:", err);
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
