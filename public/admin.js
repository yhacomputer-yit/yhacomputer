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
        { name: "level", label: "Level", type: "text" },
        { name: "duration", label: "Duration", type: "text" },
        { name: "price", label: "Price", type: "text" },
        { name: "image", label: "Course image", type: "image" },
        { name: "subject", label: "Catalog category", type: "text" },
        { name: "is_published", label: "Visible to learners", type: "select", options: ["1", "0"] },
        { name: "featured", label: "Show first in catalog", type: "select", options: ["0", "1"] },
        { name: "sort_order", label: "Catalog order (lower first)", type: "number" },
        { name: "enrollment_open", label: "Enrollment open", type: "select", options: ["1", "0"] },
        { name: "description", label: "Description", type: "textarea" },
      ],
    },
    subjects: {
      label: "Subject",
      plural: "Subjects",
      description: "Manage subjects for courses.",
      create: true,
      fields: [
        { name: "course_id", label: "Course", type: "select-dynamic", required: true, optionsTable: "courses", optionsLabel: "title", optionsValue: "id" },
        { name: "name", label: "Subject Name", type: "text", required: true },
        { name: "description", label: "Description", type: "textarea" },
      ],
    },
    resources: {
      label: "Course Resource",
      plural: "Course Resources",
      description: "Add files, PDFs, ZIP archives, YouTube videos, and notes for enrolled students.",
      create: true,
      fields: [
        { name: "course_id", label: "Course", type: "select-dynamic", required: true, optionsTable: "courses", optionsLabel: "title", optionsValue: "id" },
        { name: "title", label: "Resource title", type: "text", required: true },
        { name: "resource_type", label: "Resource type", type: "select", options: ["file", "pdf", "zip", "youtube", "note"] },
        { name: "url", label: "File URL or upload", type: "resource-url" },
        { name: "note", label: "Note / description", type: "textarea" },
        { name: "sort_order", label: "Display order", type: "number" },
        { name: "is_published", label: "Visible to students", type: "select", options: ["1", "0"] },
      ],
    },
    sessions: {
      label: "Session",
      plural: "Sessions",
      description: "Manage class sessions and time slots for courses.",
      create: true,
      fields: [
        { name: "course_id", label: "Course", type: "select-dynamic", required: true, optionsTable: "courses", optionsLabel: "title", optionsValue: "id" },
        { name: "name", label: "Session Name", type: "text", required: true },
        { name: "start_time", label: "Start Time", type: "text", placeholder: "e.g. 10:30" },
        { name: "end_time", label: "End Time", type: "text", placeholder: "e.g. 12:00" },
      ],
    },
    teachers: {
      label: "Teacher",
      plural: "Teachers",
      description: "Manage teachers.",
      create: true,
      fields: [
        { name: "name", label: "Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone", type: "text" },
        { name: "specialization", label: "Specialization", type: "text" },
        { name: "image", label: "Image", type: "image" },
        { name: "bio", label: "Bio", type: "textarea" },
      ],
    },
    course_teachers: {
      label: "Course Teacher",
      plural: "Course Teachers",
      description: "Assign teachers to courses.",
      create: true,
      fields: [
        { name: "course_id", label: "Course", type: "select-dynamic", required: true, optionsTable: "courses", optionsLabel: "title", optionsValue: "id" },
        { name: "teacher_id", label: "Teacher", type: "select-dynamic", required: true, optionsTable: "teachers", optionsLabel: "name", optionsValue: "id" },
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
        { name: "course_id", label: "Course", type: "select-dynamic", required: false, optionsTable: "courses", optionsLabel: "title", optionsValue: "id" },
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
    notifications: {
      label: "Notification",
      plural: "Notifications",
      description: "Send and manage push notifications to app users.",
      create: true,
      fields: [
        { name: "title", label: "Title", type: "text", required: true },
        { name: "message", label: "Message", type: "textarea", required: true },
        { name: "student_id", label: "Target student (optional)", type: "select-dynamic", optionsTable: "students", optionsLabel: "name", optionsValue: "id" },
        { name: "course_id", label: "Linked course", type: "select-dynamic", optionsTable: "courses", optionsLabel: "title", optionsValue: "id" },
        { name: "priority", label: "Priority", type: "select", options: ["normal", "high", "urgent"] },
        { name: "action_url", label: "Action URL", type: "url" },
        { name: "publish_at", label: "Publish at (optional)", type: "datetime-local" },
        { name: "expires_at", label: "Expires at (optional)", type: "datetime-local" },
      ],
    },
    students: {
      label: "Student",
      plural: "Students",
      description: "Manage registered students and their credentials.",
      create: true,
      fields: [
        { name: "student_id", label: "Student ID", type: "text", readonly: true },
        { name: "name", label: "Full Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone", type: "text" },
        { name: "father_name", label: "Father Name", type: "text" },
        { name: "mother_name", label: "Mother Name", type: "text" },
        { name: "nrc_number", label: "NRC Number", type: "text" },
        { name: "register_date", label: "Register Date", type: "text" },
        { name: "enroll_date", label: "Enroll Date", type: "text" },
        { name: "viber_phone", label: "Viber Phone", type: "text" },
        { name: "city", label: "City", type: "text" },
        { name: "township", label: "Township", type: "text" },
        { name: "birthday", label: "Birthday", type: "text" },
        { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
        { name: "image", label: "Image", type: "image" },
        { name: "education", label: "Education", type: "text" },
        { name: "status", label: "Status", type: "select", options: ["pending", "active", "inactive", "completed"] },
        { name: "course_id", label: "Course", type: "select-dynamic", optionsTable: "courses", optionsLabel: "title", optionsValue: "id" },
        { name: "session_id", label: "Session", type: "select-dynamic", optionsTable: "sessions", optionsLabel: "name", optionsValue: "id" },
       ],
     },
    enrollments: {
      label: "Enrollment request",
      plural: "Enrollment requests",
      description: "Review student course requests. Approving a request makes it appear in the learner's My Learning area.",
      create: false,
      fields: [
        { name: "status", label: "Status", type: "select", options: ["pending", "approved", "rejected", "cancelled", "completed"] },
        { name: "admin_note", label: "Admin note", type: "textarea" },
      ],
    },
    student_password_resets: {
      label: "Password-help request",
      plural: "Password-help requests",
      description: "Generate a replacement password after confirming the student identity through your normal support process.",
      create: false,
      fields: [],
    },
   };

  const PW_KEY = "yha_admin_pw";
  let currentTable = "courses";
  let currentView = "list";
  let editingId = null;
  let listRows = [];
  let listPage = 1;
  const LIST_PAGE_SIZE = 8;
  let pendingSelectValues = {};
  let catalogData = { courses: [], subjects: [], sessions: [], teachers: [], course_teachers: [] };

  const TABLE_HELP = {
    courses: "Create the public course first. Add its subjects, sessions, and teacher assignments afterward.",
    subjects: "Select the saved course, then add each topic learners will study as a separate subject.",
    sessions: "Select the saved course and enter a clear session name, start time, and end time.",
    teachers: "Add an instructor profile before assigning that teacher to a course.",
    course_teachers: "Connect one saved course with one saved teacher.",
    events: "Publish workshops, activities, and upcoming learning events.",
    reviews: "Add verified learner feedback and optionally link it to a course.",
    notifications: "Create a live app notification and optionally link it to a course.",
    students: "Activate verified student accounts, manage profile records, and issue replacement passwords.",
    enrollments: "Approve, reject, complete, or cancel incoming student course requests.",
    student_password_resets: "Verify the learner identity, then generate a replacement password to resolve a request.",
    contacts: "Review messages submitted through the public contact form.",
  };

  const $ = (id) => document.getElementById(id);

  function syncWorkspaceCopy() {
    const schema = SCHEMA[currentTable];
    const title = $("workspace-title");
    const description = $("workspace-description");
    const formHelp = $("form-help");
    const listKicker = $("list-kicker");
    if (title) title.textContent = schema.plural;
    if (description) description.textContent = TABLE_HELP[currentTable] || schema.description;
    if (formHelp) formHelp.textContent = TABLE_HELP[currentTable] || schema.description;
    if (listKicker) listKicker.textContent = "Live Turso " + schema.plural.toLowerCase();
    const newRecord = $("new-record");
    if (newRecord) {
      newRecord.hidden = !schema.create;
      newRecord.textContent = schema.create ? "+ Add " + schema.label : "";
    }
    const exportStudents = $("export-students");
    if (exportStudents) exportStudents.hidden = currentTable !== "students";
  }

  async function refreshCatalogData() {
    const tables = ["courses", "subjects", "sessions", "teachers", "course_teachers", "students"];
    const results = await Promise.all(tables.map((table) => api("GET", { table: table }).catch(() => ({ rows: [] }))));
    tables.forEach((table, index) => {
      catalogData[table] = results[index].rows || [];
    });
    const summary = {
      courses: catalogData.courses.length,
      subjects: catalogData.subjects.length,
      sessions: catalogData.sessions.length,
      teachers: catalogData.teachers.length,
    };
    Object.keys(summary).forEach((key) => {
      const el = $("summary-" + key);
      if (el) el.textContent = summary[key];
    });
  }

  function lookupLabel(table, id, field) {
    const row = (catalogData[table] || []).find((item) => String(item.id) === String(id));
    return row ? String(row[field] || id) : String(id || "");
  }

  function courseMetrics(courseId) {
    return {
      subjects: catalogData.subjects.filter((item) => String(item.course_id) === String(courseId)).length,
      sessions: catalogData.sessions.filter((item) => String(item.course_id) === String(courseId)).length,
      teachers: catalogData.course_teachers.filter((item) => String(item.course_id) === String(courseId)).length,
    };
  }

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

  function switchView(view) {
    currentView = view;
    const listSection = $("list-view");
    const formSection = $("form-view");
    const viewTabs = document.querySelectorAll(".admin-view-tab");

    viewTabs.forEach(function (tab) {
      tab.classList.toggle("is-active", tab.dataset.view === view);
    });

    if (view === "list") {
      listSection.hidden = false;
      listSection.classList.add("is-active");
      formSection.hidden = true;
      formSection.classList.remove("is-active");
    } else {
      formSection.hidden = false;
      formSection.classList.add("is-active");
      listSection.hidden = true;
      listSection.classList.remove("is-active");
    }
  }

  document.querySelectorAll("[data-close-student-detail]").forEach(function (element) {
    element.addEventListener("click", closeStudentDetail);
  });

  function showManage() {
    $("login-view").hidden = true;
    $("manage-view").hidden = false;
    $("logout-link").hidden = false;
    switchView("list");
    syncWorkspaceCopy();
    renderForm();
    refreshCatalogData().then(loadList);
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
    syncWorkspaceCopy();
    $("list-title").textContent = schema.plural;
    $("form-title").textContent =
      (editingId ? "Edit " : "Add ") + schema.label;
    form.innerHTML =
      '<div class="admin-form-grid">' +
      schema.fields
        .map(function (f) {
          const input =
            f.type === "textarea"
              ? '<textarea rows="3" name="' + f.name + '"' +
                (f.required ? " required" : "") +
                (f.readonly ? " readonly" : "") +
                "></textarea>"
              : f.type === "select"
                ? "<select name=\"" + f.name + "\"" +
                  (f.required ? " required" : "") +
                  (f.readonly ? " disabled" : "") +
                  ">" +
                  (f.options || [])
                    .map(
                      (option) =>
                        '<option value="' + escapeHtml(option) + '">' + escapeHtml(option) + "</option>"
                    )
                    .join("") +
                  "</select>"
                : f.type === "select-dynamic"
                  ? '<select name="' + f.name + '" data-options-table="' + escapeHtml(f.optionsTable) + '" data-options-label="' + escapeHtml(f.optionsLabel) + '" data-options-value="' + escapeHtml(f.optionsValue) + '"' +
                    (f.required ? " required" : "") +
                    (f.readonly ? " disabled" : "") +
                    "><option value=\"\">Loading...</option></select>"
                  : f.type === "image"
                    ? '<input type="file" accept="image/*" class="admin-file-input" />' +
                      '<input type="text" name="' + f.name + '" placeholder="Upload a file or paste a URL/path (e.g. images/flutter.jpg)"' +
                      (f.required ? " required" : "") +
                      (f.readonly ? " readonly" : "") +
                      " />" +
                      '<img class="admin-image-preview" alt="Image preview" hidden />'
                    : f.type === "images"
                      ? '<input type="file" accept="image/*" multiple class="admin-file-input" />' +
                        '<input type="text" name="' + f.name + '" placeholder="Upload up to 5 images, or paste URLs/paths separated by |"' +
                        (f.required ? " required" : "") +
                        " />" +
                        '<div class="admin-image-thumbs" hidden></div>'
                      : f.type === "resource-url"
                        ? '<input type="file" class="admin-resource-file-input" accept="application/pdf,application/zip,.pdf,.zip,.txt,.doc,.docx,.ppt,.pptx" />' +
                          '<input type="url" name="' + f.name + '" placeholder="Paste a public URL or choose a file (max 1.5 MB)" />'
                        : '<input type="' +
                          f.type +
                          '" name="' +
                          f.name +
                          '"' +
                          (f.required ? " required" : "") +
                          (f.readonly ? " readonly" : "") +
                          " />";
          const labelClass =
            f.type === "image" || f.type === "images" ? "admin-field-image" : "";
          return '<label class="' + labelClass + '">' + f.label + input + "</label>";
        })
        .join("") +
      "</div>" +
      '<div class="admin-form-actions">' +
      '<button type="submit" class="admin-button admin-button-primary">' +
      (editingId ? "Save changes" : "Add") +
      "</button>" +
      (editingId
        ? '<button type="button" class="btn-secondary" id="cancel-edit">Cancel</button>'
        : "") +
      "</div>" +
      '<p class="admin-error" id="form-error" hidden></p>';

    form.querySelectorAll("select[data-options-table]").forEach(function (selectEl) {
      const table = selectEl.getAttribute("data-options-table");
      const labelField = selectEl.getAttribute("data-options-label");
      const valueField = selectEl.getAttribute("data-options-value");
      api("GET", { table: table })
        .then(function (data) {
          const rows = data.rows || [];
          const fieldName = selectEl.getAttribute("name");
          selectEl.innerHTML =
            '<option value="">Select...</option>' +
            rows
              .map(function (row) {
                return (
                  '<option value="' +
                  escapeHtml(String(row[valueField] || "")) +
                  '">' +
                  escapeHtml(String(row[labelField] || "")) +
                  "</option>"
                );
              })
              .join("");
          if (pendingSelectValues[fieldName] !== undefined) {
            selectEl.value = pendingSelectValues[fieldName];
            delete pendingSelectValues[fieldName];
          }
        })
        .catch(function () {
          selectEl.innerHTML = '<option value="">Error loading options</option>';
        });
    });

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
    switchView("list");
    renderForm();
  }

  function startNewRecord() {
    if (!SCHEMA[currentTable].create) return;
    editingId = null;
    pendingSelectValues = {};
    renderForm();
    switchView("form");
    const firstField = $("record-form").querySelector("input, textarea, select");
    if (firstField) firstField.focus();
  }

  function toDateTimeLocal(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  function fillForm(row) {
    editingId = row.id;
    pendingSelectValues = {};
    SCHEMA[currentTable].fields.forEach(function (f) {
      if (f.type === "select-dynamic" && row[f.name] != null) {
        pendingSelectValues[f.name] = String(row[f.name]);
      }
    });
    renderForm();
    switchView("form");
    const form = $("record-form");
    SCHEMA[currentTable].fields.forEach(function (f) {
      const el = form.elements[f.name];
      if (!el) return;
      if (f.type === "select-dynamic") {
        if (pendingSelectValues[f.name] !== undefined) {
          el.value = pendingSelectValues[f.name];
        }
      } else {
        const value = row[f.name] == null ? "" : row[f.name];
        el.value = f.type === "datetime-local" ? toDateTimeLocal(value) : value;
      }
      if (f.type === "image" && el) updateImagePreview(el);
      if (f.type === "images" && el) updateImagesPreview(el);
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
        reject(new Error("Could not read the file."));
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

  function csvCell(value) {
    const text = value == null ? "" : String(value);
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function exportStudentsCsv() {
    if (currentTable !== "students") return;
    const columns = [
      ["Student ID", "student_id"], ["Full Name", "name"], ["Email", "email"], ["Phone", "phone"],
      ["Father Name", "father_name"], ["Mother Name", "mother_name"], ["NRC Number", "nrc_number"],
      ["Viber Phone", "viber_phone"], ["City", "city"], ["Township", "township"], ["Birthday", "birthday"],
      ["Gender", "gender"], ["Education", "education"], ["Register Date", "register_date"],
      ["Enroll Date", "enroll_date"], ["Status", "status"], ["Password Set", "password_set"],
      ["Course", "course_id"], ["Session", "session_id"], ["Created At", "created_at"], ["Updated At", "updated_at"],
    ];
    const header = columns.map((column) => csvCell(column[0])).join(",");
    const rows = listRows.map(function (row) {
      return columns.map(function (column) {
        let value = row[column[1]];
        if (column[1] === "password_set") value = row.password_set ? "Yes" : "No";
        if (column[1] === "course_id") value = row.course_id ? lookupLabel("courses", row.course_id, "title") : "Not assigned";
        if (column[1] === "session_id") value = row.session_id ? lookupLabel("sessions", row.session_id, "name") : "Not assigned";
        return csvCell(value);
      }).join(",");
    });
    const lineBreak = String.fromCharCode(13, 10);
    const csv = String.fromCharCode(0xFEFF) + [header].concat(rows).join(lineBreak) + lineBreak;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "yha-students-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
      listRows = data.rows || [];
      listPage = 1;
      $("record-count").textContent = listRows.length;
      status.textContent = listRows.length ? "" : "No records yet.";
      renderListPage();
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

  function rowActions(row, isStudent) {
    const schema = SCHEMA[currentTable];
    return (
      '<div class="admin-item-actions">' +
      (isStudent ? '<button class="btn-mini btn-view-student" data-view-student="' + row.id + '">View details</button>' : "") +
      (schema.create ? '<button class="btn-mini" data-edit="' + row.id + '">Edit</button>' : "") +
      (isStudent ? '<button class="btn-mini btn-password" data-generate="' + row.id + '">Generate Password</button>' : "") +
      '<button class="btn-mini btn-danger" data-delete="' + row.id + '">Delete</button>' +
      "</div>"
    );
  }

  function showStudentDetail(row) {
    const modal = $("student-detail-modal");
    const content = $("student-detail-content");
    if (!modal || !content) return;
    const value = (field) => row[field] == null || row[field] === "" ? "Not provided" : String(row[field]);
    const fields = [
      ["Student ID", "student_id"], ["Full Name", "name"], ["Email", "email"], ["Phone", "phone"],
      ["Father Name", "father_name"], ["Mother Name", "mother_name"], ["NRC Number", "nrc_number"],
      ["Viber Phone", "viber_phone"], ["City", "city"], ["Township", "township"], ["Birthday", "birthday"],
      ["Gender", "gender"], ["Education", "education"], ["Register Date", "register_date"],
      ["Enroll Date", "enroll_date"], ["Status", "status"], ["Password", "password_set"], ["Created At", "created_at"],
    ];
    const course = row.course_id ? lookupLabel("courses", row.course_id, "title") : "Not assigned";
    const session = row.session_id ? lookupLabel("sessions", row.session_id, "name") : "Not assigned";
    $("student-detail-title").textContent = value("name");
    content.innerHTML =
      (row.image ? '<div class="student-detail-photo-wrap"><img class="student-detail-photo" src="' + escapeHtml(row.image) + '" alt="' + escapeHtml(value("name")) + '" /></div>' : "") +
      '<div class="student-detail-grid">' +
      fields.map(function (field) {
        const displayValue = field[1] === "password_set" ? (row.password_set ? "Password is set" : "Password not set") : value(field[1]);
        return '<div class="student-detail-field"><span>' + escapeHtml(field[0]) + '</span><strong>' + escapeHtml(displayValue) + '</strong></div>';
      }).join("") +
      '<div class="student-detail-field"><span>Course</span><strong>' + escapeHtml(course) + '</strong></div>' +
      '<div class="student-detail-field"><span>Session</span><strong>' + escapeHtml(session) + '</strong></div>' +
      '</div>';
    modal.hidden = false;
    document.body.classList.add("student-detail-open");
  }

  function closeStudentDetail() {
    const modal = $("student-detail-modal");
    if (modal) modal.hidden = true;
    document.body.classList.remove("student-detail-open");
  }

  function enrollmentActions(row) {
    const status = String(row.status || "").toLowerCase();
    const buttons = [];
    const availableSessions = (catalogData.sessions || []).filter(function (session) {
      return String(session.course_id) === String(row.course_id);
    });
    if (availableSessions.length) {
      buttons.push('<button class="btn-mini" data-assign-session="' + row.id + '">Assign session</button>');
    }
    if (status === "pending") {
      buttons.push('<button class="btn-mini btn-approve" data-enrollment-status="approved" data-id="' + row.id + '">Approve</button>');
      buttons.push('<button class="btn-mini btn-danger" data-enrollment-status="rejected" data-id="' + row.id + '">Reject</button>');
      buttons.push('<button class="btn-mini" data-enrollment-status="cancelled" data-id="' + row.id + '">Cancel</button>');
    } else if (status === "approved") {
      buttons.push('<button class="btn-mini btn-approve" data-enrollment-status="completed" data-id="' + row.id + '">Complete</button>');
      buttons.push('<button class="btn-mini btn-danger" data-enrollment-status="cancelled" data-id="' + row.id + '">Cancel</button>');
    }
    return '<div class="admin-item-actions">' + buttons.join("") + '</div>';
  }

  function renderEnrollmentRow(row) {
    const status = String(row.status || "pending").toLowerCase();
    const course = row.course_title || lookupLabel("courses", row.course_id, "title");
    const session = row.session_name ? " · " + row.session_name : "";
    const note = row.admin_note || row.student_note || "No note added.";
    return (
      '<article class="admin-item admin-enrollment-item">' +
      '<div class="admin-item-body">' +
      '<div class="admin-enrollment-title"><strong>' + escapeHtml(row.student_name || row.student_code || "Student") + '</strong>' +
      '<span class="admin-status-chip is-' + escapeHtml(status) + '">' + escapeHtml(status) + '</span></div>' +
      '<span class="admin-item-sub">' + escapeHtml(String(row.student_code || "")) + " · " + escapeHtml(course) + escapeHtml(session) + '</span>' +
      '<p>' + escapeHtml(note) + '</p>' +
      '<span class="admin-item-date">Requested ' + escapeHtml(row.requested_at || row.created_at || "") + '</span>' +
      '</div>' + enrollmentActions(row) + '</article>'
    );
  }

  function renderPasswordHelpRow(row) {
    const status = String(row.status || "pending").toLowerCase();
    const action = status === "pending"
      ? '<button class="btn-mini btn-password" data-generate="' + row.student_id + '">Generate & resolve</button>'
      : "";
    return (
      '<article class="admin-item admin-enrollment-item">' +
      '<div class="admin-item-body">' +
      '<div class="admin-enrollment-title"><strong>' + escapeHtml(row.student_name || row.student_code || "Student") + '</strong>' +
      '<span class="admin-status-chip is-' + escapeHtml(status) + '">' + escapeHtml(status) + '</span></div>' +
      '<span class="admin-item-sub">' + escapeHtml(String(row.student_code || "")) + " · " + escapeHtml(row.student_email || "") + '</span>' +
      '<span class="admin-item-date">Requested ' + escapeHtml(row.requested_at || row.created_at || "") + '</span>' +
      '</div><div class="admin-item-actions">' + action + '</div></article>'
    );
  }

  function renderCourseRow(row) {
    const metrics = courseMetrics(row.id);
    const price = Number(String(row.price || "").replace(/[^0-9.]/g, ""));
    const fee = Number.isFinite(price) && price > 0 ? "MMK " + new Intl.NumberFormat("en-US").format(price) : "Fee pending";
    const checks = [
      [metrics.subjects, "subjects"],
      [metrics.sessions, "sessions"],
      [metrics.teachers, "teachers"],
    ].map(function (item) {
      return '<span class="admin-metric' + (item[0] ? " is-ready" : "") + '">' + item[0] + " " + item[1] + "</span>";
    }).join("");
    return (
      '<article class="admin-item admin-course-item">' +
      '<div class="admin-course-avatar">' + escapeHtml(String(row.title || "Y").charAt(0).toUpperCase()) + "</div>" +
      '<div class="admin-item-body">' +
      "<strong>" + escapeHtml(row.title) + "</strong>" +
      '<span class="admin-item-sub">' + escapeHtml(row.subject || "Uncategorized") + " · " + escapeHtml(row.level || "Level pending") + "</span>" +
      '<p>' + escapeHtml(row.description || "Add a description so visitors understand this course.") + "</p>" +
      '<div class="admin-course-metrics">' + checks + "</div>" +
      "</div>" +
      '<div class="admin-course-side"><strong>' + escapeHtml(fee) + "</strong>" +
      '<span>' + escapeHtml(row.duration || "Schedule pending") + "</span>" +
      rowActions(row, false) + "</div>" +
      "</article>"
    );
  }

  function renderRow(row) {
    if (currentTable === "courses") return renderCourseRow(row);
    if (currentTable === "enrollments") return renderEnrollmentRow(row);
    if (currentTable === "student_password_resets") return renderPasswordHelpRow(row);
    const schema = SCHEMA[currentTable];
    const primary = schema.fields[0].name;
    const bodyField = schema.fields.find((field) => field.type === "textarea");
    const isStudent = currentTable === "students";
    let relation = "";
    if (row.course_id) relation += "Course: " + lookupLabel("courses", row.course_id, "title");
    if (row.teacher_id) relation += (relation ? " · " : "") + "Teacher: " + lookupLabel("teachers", row.teacher_id, "name");
    if (isStudent && row.session_id) relation += (relation ? " · " : "") + "Session: " + lookupLabel("sessions", row.session_id, "name");
    return (
      '<article class="admin-item">' +
      '<div class="admin-item-body">' +
      "<strong>" + escapeHtml(row[primary]) + "</strong>" +
      (relation ? '<span class="admin-item-sub">' + escapeHtml(relation) + "</span>" : "") +
      (bodyField && row[bodyField.name] ? "<p>" + escapeHtml(row[bodyField.name]) + "</p>" : "") +
      (row.created_at ? '<span class="admin-item-date">' + escapeHtml(row.created_at) + "</span>" : "") +
      "</div>" +
      rowActions(row, isStudent) +
      "</article>"
    );
  }

  function renderListPage() {
    const totalPages = Math.max(
      1,
      Math.ceil(listRows.length / LIST_PAGE_SIZE)
    );
    if (listPage > totalPages) listPage = totalPages;
    if (listPage < 1) listPage = 1;
    const start = (listPage - 1) * LIST_PAGE_SIZE;
    const pageRows = listRows.slice(start, start + LIST_PAGE_SIZE);
    const listEl = $("record-list");
    listEl.innerHTML = pageRows.map(renderRow).join("");
    listEl.querySelectorAll("[data-view-student]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const row = listRows.find((r) => String(r.id) === btn.dataset.viewStudent);
        if (row) showStudentDetail(row);
      });
    });
    listEl.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const row = listRows.find((r) => String(r.id) === btn.dataset.edit);
        if (row) fillForm(row);
      });
    });
    listEl.querySelectorAll("[data-delete]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        onDelete(btn.dataset.delete);
      });
    });
    listEl.querySelectorAll("[data-generate]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        onGeneratePassword(btn.dataset.generate);
      });
    });
    listEl.querySelectorAll("[data-enrollment-status]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        onEnrollmentStatus(btn.dataset.id, btn.dataset.enrollmentStatus);
      });
    });
    listEl.querySelectorAll("[data-assign-session]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const row = listRows.find((item) => String(item.id) === String(btn.dataset.assignSession));
        if (row) onAssignEnrollmentSession(row);
      });
    });
    renderPager(totalPages);
  }

  function renderPager(totalPages) {
    const pager = $("list-pager");
    if (!pager) return;
    if (totalPages <= 1) {
      pager.hidden = true;
      pager.innerHTML = "";
      return;
    }
    pager.hidden = false;
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    pager.innerHTML =
      '<button type="button" class="admin-page-btn" data-page="' +
      (listPage - 1) +
      '"' +
      (listPage === 1 ? " disabled" : "") +
      ">Prev</button>" +
      pages
        .map(function (p) {
          return (
            '<button type="button" class="admin-page-btn' +
            (p === listPage ? " is-active" : "") +
            '" data-page="' +
            p +
            '">' +
            p +
            "</button>"
          );
        })
        .join("") +
      '<button type="button" class="admin-page-btn" data-page="' +
      (listPage + 1) +
      '"' +
      (listPage === totalPages ? " disabled" : "") +
      ">Next</button>";
    pager.querySelectorAll("[data-page]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const target = Number(btn.dataset.page);
        if (target >= 1 && target <= totalPages) {
          listPage = target;
          renderListPage();
        }
      });
    });
  }

  async function onAssignEnrollmentSession(row) {
    const options = (catalogData.sessions || []).filter(function (session) {
      return String(session.course_id) === String(row.course_id);
    });
    if (!options.length) {
      window.alert("No class sessions are available for this course yet.");
      return;
    }
    const promptText = "Choose a session number:\n" + options.map(function (session, index) {
      const time = session.start_time || session.end_time
        ? " · " + [session.start_time, session.end_time].filter(Boolean).join("–")
        : "";
      return (index + 1) + ". " + session.name + time;
    }).join("\n");
    const answer = window.prompt(promptText, "1");
    if (answer === null) return;
    const selected = options[Number(answer) - 1];
    if (!selected) {
      window.alert("Enter a session number from the displayed list.");
      return;
    }
    try {
      await api("POST", {
        action: "update",
        table: "enrollments",
        id: Number(row.id),
        values: { course_id: Number(row.course_id), session_id: Number(selected.id) },
      });
      loadList();
    } catch (err) {
      window.alert("Could not assign session: " + err.message);
    }
  }

  async function onEnrollmentStatus(id, status) {
    const note = window.prompt(
      status === "rejected" ? "Optional reason or next step for the learner:" : "Optional admin note for the learner:",
      ""
    );
    if (note === null) return;
    try {
      await api("POST", {
        action: "update",
        table: "enrollments",
        id: Number(id),
        values: { status: status, admin_note: note.trim() },
      });
      loadList();
    } catch (err) {
      window.alert("Could not update enrollment: " + err.message);
    }
  }

  async function onGeneratePassword(id) {
    if (!window.confirm("Generate a new password for this student?")) return;
    try {
      const data = await api("POST", {
        action: "generate_password",
        table: "students",
        id: id,
      });
      window.alert("New password: " + data.password + "\nPlease share it with the student.");
      loadList();
    } catch (err) {
      window.alert("Failed to generate password: " + err.message);
    }
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || "")); };
      reader.onerror = function () { reject(new Error("Could not read the selected resource file.")); };
      reader.readAsDataURL(file);
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    const schema = SCHEMA[currentTable];
    const form = $("record-form");
    const values = {};
    for (const f of schema.fields) {
      const field = form.elements[f.name];
      const rawValue = field ? String(field.value || "").trim() : "";
      if (f.type === "resource-url") {
        const fileInput = form.querySelector(".admin-resource-file-input");
        const file = fileInput && fileInput.files && fileInput.files[0];
        if (file) {
          if (file.size > 1.5 * 1024 * 1024) {
            const errEl = $("form-error");
            errEl.textContent = "Resource files must be 1.5 MB or smaller. For larger files, paste a public URL instead.";
            errEl.hidden = false;
            return;
          }
          values[f.name] = await readFileAsDataUrl(file);
        } else {
          values[f.name] = rawValue;
        }
      } else {
        values[f.name] = f.type === "datetime-local" && rawValue
          ? new Date(rawValue).toISOString()
          : rawValue;
      }
    }
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
      await refreshCatalogData();
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
      await refreshCatalogData();
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
    switchView("list");
    syncWorkspaceCopy();
    renderForm();
    loadList();
    const sidebar = $("admin-sidebar");
    const overlay = $("sidebar-overlay");
    const menuToggle = $("menu-toggle");
    if (sidebar) sidebar.classList.remove("is-open");
    if (overlay) overlay.style.display = "none";
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
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
    $("new-record").addEventListener("click", startNewRecord);
    $("export-students").addEventListener("click", exportStudentsCsv);
    document.querySelectorAll(".admin-tab").forEach(function (t) {
      t.addEventListener("click", function () {
        selectTable(t.dataset.table);
      });
    });

    document.querySelectorAll(".admin-view-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        const view = tab.dataset.view;
        if (view === "form" && !SCHEMA[currentTable].create) {
          return;
        }
        switchView(view);
      });
    });

    const sidebar = $("admin-sidebar");
    const overlay = $("sidebar-overlay");
    const menuToggle = $("menu-toggle");
    const sidebarClose = $("sidebar-close");

    function openSidebar() {
      sidebar.classList.add("is-open");
      overlay.style.display = "block";
      menuToggle.setAttribute("aria-expanded", "true");
    }

    function closeSidebar() {
      sidebar.classList.remove("is-open");
      overlay.style.display = "none";
      menuToggle.setAttribute("aria-expanded", "false");
    }

    if (menuToggle) {
      menuToggle.addEventListener("click", openSidebar);
    }
    if (sidebarClose) {
      sidebarClose.addEventListener("click", closeSidebar);
    }
    if (overlay) {
      overlay.addEventListener("click", closeSidebar);
    }
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && sidebar.classList.contains("is-open")) closeSidebar();
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
