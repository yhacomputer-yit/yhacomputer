// Admin panel logic: authenticates against /api/admin with a password stored in
// sessionStorage, then lists / creates / updates / deletes rows per table.

(function () {
  "use strict";

  // Field definitions per table. `create: false` marks read-only tables.
  const SCHEMA = {
    courses: {
      label: "Course",
      plural: "Courses",
      description: "Manage the courses displayed across the public catalog.",
      create: true,
      fields: [
        { name: "title", label: "Title", type: "text", required: true },
        { name: "subject", label: "Subject", type: "select", required: true, options: ["Ict", "Programming", "Graphic design"] },
        { name: "level", label: "Level", type: "text" },
        { name: "duration", label: "Duration", type: "text" },
        { name: "price", label: "Price", type: "text" },
        { name: "image", label: "Course image", type: "image" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "highlights", label: "Highlights", type: "textarea" },
      ],
    },
    events: {
      label: "Event",
      plural: "Events",
      description: "Publish workshops, activities, and upcoming learning events.",
      create: true,
      fields: [
        { name: "title", label: "Title", type: "text", required: true },
        { name: "category", label: "Category (pill)", type: "text" },
        { name: "event_type", label: "Type", type: "text" },
        { name: "date", label: "Date", type: "text" },
        { name: "venue", label: "Venue", type: "text" },
        { name: "duration", label: "Duration", type: "text" },
        { name: "image", label: "Event images (up to 5)", type: "images" },
        { name: "description", label: "Description", type: "textarea" },
      ],
    },
    reviews: {
      label: "Review",
      plural: "Reviews",
      description: "Manage student feedback displayed on the reviews page.",
      create: true,
      fields: [
        { name: "name", label: "Student name", type: "text", required: true },
        { name: "course_name", label: "Course", type: "text" },
        { name: "message", label: "Message", type: "textarea", required: true },
      ],
    },
    contacts: {
      label: "Contact submission",
      plural: "Contact submissions",
      description: "Read and manage messages submitted from the public contact form.",
      create: false,
      fields: [
        { name: "name", label: "Name", type: "text" },
        { name: "email", label: "Email", type: "email" },
        { name: "message", label: "Message", type: "textarea" },
      ],
    },
  };

  const PW_KEY = "yha_admin_pw";
  let currentTable = "courses";
  let editingId = null;

  const $ = (id) => document.getElementById(id);

  function getPassword() {
    return sessionStorage.getItem(PW_KEY) || "";
  }

  async function api(method, options) {
    const opts = {
      method,
      headers: { "x-admin-password": getPassword() },
    };
    let url = "/api/admin";
    if (method === "GET") {
      url += "?table=" + encodeURIComponent(options.table);
    } else {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(options);
    }
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || "Request failed (" + res.status + ")");
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function showManage() {
    $("login-view").hidden = true;
    $("manage-view").hidden = false;
    $("logout-link").hidden = false;
    renderForm();
    loadList();
  }

  function showLogin(message) {
    $("manage-view").hidden = true;
    $("logout-link").hidden = true;
    $("login-view").hidden = false;
    const err = $("login-error");
    if (message) {
      err.textContent = message;
      err.hidden = false;
    } else {
      err.hidden = true;
    }
  }

  function renderForm() {
    const schema = SCHEMA[currentTable];
    const form = $("record-form");
    const wrap = $("form-wrap");
    document
      .querySelector(".admin-panel")
      .classList.toggle("is-list-only", !schema.create);
    $("table-description").textContent = schema.description;
    $("list-title").textContent = schema.plural;
    if (!schema.create) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    $("form-title").textContent =
      (editingId ? "Edit " : "Add ") + schema.label;
    form.innerHTML =
      schema.fields
        .map(function (f) {
          const input =
            f.type === "textarea"
              ? '<textarea rows="3" name="' + f.name + '"' +
                (f.required ? " required" : "") +
                "></textarea>"
              : f.type === "select"
                ? "<select name=\"" + f.name + "\"" +
                  (f.required ? " required" : "") +
                  ">" +
                  (f.options || [])
                    .map(
                      (option) =>
                        '<option value="' + escapeHtml(option) + '">' + escapeHtml(option) + "</option>"
                    )
                    .join("") +
                  "</select>"
                : f.type === "image"
                  ? '<input type="file" accept="image/*" class="admin-file-input" />' +
                    '<input type="text" name="' + f.name + '" placeholder="Upload a file or paste a URL/path (e.g. images/flutter.jpg)"' +
                    (f.required ? " required" : "") +
                    " />" +
                    '<img class="admin-image-preview" alt="Image preview" hidden />'
                  : f.type === "images"
                    ? '<input type="file" accept="image/*" multiple class="admin-file-input" />' +
                      '<input type="text" name="' + f.name + '" placeholder="Upload up to 5 images, or paste URLs/paths separated by |"' +
                      (f.required ? " required" : "") +
                      " />" +
                      '<div class="admin-image-thumbs" hidden></div>'
                    : '<input type="' +
                      f.type +
                      '" name="' +
                      f.name +
                      '"' +
                      (f.required ? " required" : "") +
                      " />";
          const labelClass =
            f.type === "image" || f.type === "images" ? "admin-field-image" : "";
          return '<label class="' + labelClass + '">' + f.label + input + "</label>";
        })
        .join("") +
      '<div class="admin-form-actions">' +
      '<button type="submit" class="admin-button admin-button-primary">' +
      (editingId ? "Save changes" : "Add") +
      "</button>" +
      (editingId
        ? '<button type="button" class="btn-secondary" id="cancel-edit">Cancel</button>'
        : "") +
      "</div>" +
      '<p class="admin-error" id="form-error" hidden></p>';

    form.querySelectorAll(".admin-file-input").forEach(function (fileInput) {
      fileInput.addEventListener("change", function (e) {
        const isMultiple =
          fileInput.getAttribute("multiple") !== null;
        if (isMultiple) {
          onImagesSelected(e);
        } else {
          onImageSelected(e);
        }
      });
    });
    form
      .querySelectorAll('label.admin-field-image input[type="text"]')
      .forEach(function (textInput) {
        textInput.addEventListener("input", function () {
          if (textInput.closest(".admin-field-image").querySelector(".admin-image-thumbs")) {
            updateImagesPreview(textInput);
          } else {
            updateImagePreview(textInput);
          }
        });
      });

    if (editingId) {
      const cancel = $("cancel-edit");
      if (cancel) cancel.addEventListener("click", resetForm);
    }
  }

  function resetForm() {
    editingId = null;
    renderForm();
  }

  function fillForm(row) {
    editingId = row.id;
    renderForm();
    const form = $("record-form");
    SCHEMA[currentTable].fields.forEach(function (f) {
      const el = form.elements[f.name];
      if (el) el.value = row[f.name] == null ? "" : row[f.name];
      if (f.type === "image" && el) updateImagePreview(el);
      if (f.type === "images" && el) updateImagesPreview(el);
    });
    $("form-wrap").scrollIntoView({ behavior: "smooth", block: "nearest" });
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

  function compressImage(file, maxDim, quality) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        const img = new Image();
        img.onload = function () {
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas
            .getContext("2d")
            .drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = function () {
          reject(new Error("Could not read the selected image."));
        };
        img.src = reader.result;
      };
      reader.onerror = function () {
        reject(new Error("Could not read the selected file."));
      };
      reader.readAsDataURL(file);
    });
  }

  async function onImageSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const textInput = e.target.parentNode.querySelector('input[type="text"]');
    if (!textInput) return;
    try {
      const dataUrl = await compressImage(file, 1280, 0.82);
      textInput.value = dataUrl;
      updateImagePreview(textInput);
    } catch (err) {
      const errEl = $("form-error");
      errEl.textContent = err.message;
      errEl.hidden = false;
    }
  }

  function updateImagePreview(textInput) {
    const preview = textInput.parentNode.querySelector(".admin-image-preview");
    if (!preview) return;
    const value = textInput.value.trim();
    if (value) {
      preview.src = value;
      preview.hidden = false;
    } else {
      preview.hidden = true;
      preview.removeAttribute("src");
    }
  }

  async function onImagesSelected(e) {
    const files = e.target.files ? Array.from(e.target.files).slice(0, 5) : [];
    if (!files.length) return;
    const textInput = e.target.parentNode.querySelector('input[type="text"]');
    if (!textInput) return;
    const errEl = $("form-error");
    errEl.hidden = true;
    try {
      const dataUrls = await Promise.all(
        files.map((file) => compressImage(file, 1280, 0.82))
      );
      const existing = textInput.value
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      const next = existing.concat(dataUrls).slice(-5);
      textInput.value = next.join("|");
      updateImagesPreview(textInput);
    } catch (err) {
      errEl.textContent = err.message;
      errEl.hidden = false;
    }
  }

  function updateImagesPreview(textInput) {
    const wrap = textInput.parentNode.querySelector(".admin-image-thumbs");
    if (!wrap) return;
    const items = textInput.value
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!items.length) {
      wrap.innerHTML = "";
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    wrap.innerHTML = items
      .map(function (src, i) {
        return (
          '<div class="admin-thumb" data-index="' +
          i +
          '">' +
          '<img src="' +
          escapeHtml(src) +
          '" alt="Event image ' +
          (i + 1) +
          '" />' +
          '<button type="button" class="admin-thumb-remove" data-remove="' +
          i +
          '" aria-label="Remove image">&times;</button>' +
          "</div>"
        );
      })
      .join("");
    wrap.querySelectorAll("[data-remove]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const idx = Number(btn.dataset.remove);
        const current = textInput.value
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);
        current.splice(idx, 1);
        textInput.value = current.join("|");
        updateImagesPreview(textInput);
      });
    });
  }

  async function loadList() {
    const schema = SCHEMA[currentTable];
    $("list-title").textContent = schema.plural;
    $("record-count").textContent = "—";
    const status = $("list-status");
    status.textContent = "Loading\u2026";
    const listEl = $("record-list");
    listEl.innerHTML = "";
    try {
      const data = await api("GET", { table: currentTable });
      const rows = data.rows || [];
      $("record-count").textContent = rows.length;
      status.textContent = rows.length ? "" : "No records yet.";
      listEl.innerHTML = rows.map(renderRow).join("");
      listEl.querySelectorAll("[data-edit]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const row = rows.find((r) => String(r.id) === btn.dataset.edit);
          if (row) fillForm(row);
        });
      });
      listEl.querySelectorAll("[data-delete]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          onDelete(btn.dataset.delete);
        });
      });
    } catch (err) {
      if (err.status === 401) {
        sessionStorage.removeItem(PW_KEY);
        showLogin("Session expired. Please log in again.");
        return;
      }
      $("record-count").textContent = "—";
      status.textContent = "Error: " + err.message;
    }
  }

  function renderRow(row) {
    const schema = SCHEMA[currentTable];
    const primary = schema.fields[0].name;
    const secondary = schema.fields[1] ? schema.fields[1].name : null;
    const bodyField = schema.fields.find((f) => f.type === "textarea");
    return (
      '<div class="admin-item">' +
      '<div class="admin-item-body">' +
      "<strong>" +
      escapeHtml(row[primary]) +
      "</strong>" +
      (secondary && row[secondary]
        ? '<span class="admin-item-sub">' + escapeHtml(row[secondary]) + "</span>"
        : "") +
      (bodyField && row[bodyField.name]
        ? "<p>" + escapeHtml(row[bodyField.name]) + "</p>"
        : "") +
      (row.created_at
        ? '<span class="admin-item-date">' + escapeHtml(row.created_at) + "</span>"
        : "") +
      "</div>" +
      '<div class="admin-item-actions">' +
      (schema.create
        ? '<button class="btn-mini" data-edit="' + row.id + '">Edit</button>'
        : "") +
      '<button class="btn-mini btn-danger" data-delete="' +
      row.id +
      '">Delete</button>' +
      "</div>" +
      "</div>"
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    const schema = SCHEMA[currentTable];
    const form = $("record-form");
    const values = {};
    schema.fields.forEach(function (f) {
      values[f.name] = form.elements[f.name].value.trim();
    });
    const missing = schema.fields.find(
      (f) => f.required && !values[f.name]
    );
    const errEl = $("form-error");
    if (missing) {
      errEl.textContent = missing.label + " is required.";
      errEl.hidden = false;
      return;
    }
    errEl.hidden = true;
    try {
      if (editingId) {
        await api("POST", {
          action: "update",
          table: currentTable,
          id: editingId,
          values,
        });
      } else {
        await api("POST", {
          action: "create",
          table: currentTable,
          values,
        });
      }
      resetForm();
      loadList();
    } catch (err) {
      errEl.textContent = "Error: " + err.message;
      errEl.hidden = false;
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this record?")) return;
    try {
      await api("POST", { action: "delete", table: currentTable, id });
      if (String(editingId) === String(id)) resetForm();
      loadList();
    } catch (err) {
      window.alert("Delete failed: " + err.message);
    }
  }

  function selectTable(table) {
    currentTable = table;
    editingId = null;
    document.querySelectorAll(".admin-tab").forEach(function (t) {
      t.classList.toggle("is-active", t.dataset.table === table);
    });
    renderForm();
    loadList();
  }

  async function onLogin(e) {
    e.preventDefault();
    const pw = $("password-input").value;
    sessionStorage.setItem(PW_KEY, pw);
    try {
      await api("GET", { table: "courses" });
      showManage();
    } catch (err) {
      sessionStorage.removeItem(PW_KEY);
      showLogin(
        err.status === 401 ? "Invalid password." : "Error: " + err.message
      );
    }
  }

  function init() {
    $("login-form").addEventListener("submit", onLogin);
    $("record-form").addEventListener("submit", onSubmit);
    $("logout-link").addEventListener("click", function (e) {
      e.preventDefault();
      sessionStorage.removeItem(PW_KEY);
      showLogin();
    });
    document.querySelectorAll(".admin-tab").forEach(function (t) {
      t.addEventListener("click", function () {
        selectTable(t.dataset.table);
      });
    });

    if (getPassword()) {
      showManage();
    } else {
      showLogin();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
