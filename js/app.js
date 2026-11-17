import { recordService } from "./data.js";

const STATUSES = ["Pending", "In progress", "Completed"];
const LIMITS = {
  title: { label: "Title", min: 3, max: 80 },
  category: { label: "Category", min: 2, max: 40 },
  description: { label: "Description", min: 5, max: 300 }
};

const $ = (id) => document.getElementById(id);

const els = {
  form: $("record-form"),
  formHeading: $("form-heading"),
  title: $("title"),
  category: $("category"),
  description: $("description"),
  status: $("status"),
  submitBtn: $("submit-btn"),
  cancelBtn: $("cancel-btn"),
  message: $("message"),
  search: $("search"),
  filter: $("filter"),
  count: $("result-count"),
  list: $("record-list"),
  details: $("details"),
  detailsBody: $("details-body"),
  closeDetails: $("close-details")
};

let records = [];
let editingId = null;
let detailsId = null;

function showMessage(text, type = "info") {
  els.message.textContent = text;
  els.message.className = `message ${type}`;
  els.message.hidden = false;
}

function hideMessage() {
  els.message.hidden = true;
  els.message.textContent = "";
}

function readForm() {
  return {
    title: els.title.value.trim(),
    category: els.category.value.trim(),
    description: els.description.value.trim(),
    status: els.status.value
  };
}

function validate(values) {
  for (const key of Object.keys(LIMITS)) {
    const { label, min, max } = LIMITS[key];
    const length = values[key].length;
    if (length === 0) {
      return `Please enter a ${label.toLowerCase()}. The request was not saved.`;
    }
    if (length < min || length > max) {
      return `${label} must be between ${min} and ${max} characters. Your text has ${length}. The request was not saved.`;
    }
  }
  if (!STATUSES.includes(values.status)) {
    return "Please choose one of the three statuses. The request was not saved.";
  }
  return null;
}

function setFormMode(record) {
  if (record) {
    editingId = record.id;
    els.formHeading.textContent = `Edit request ${record.id}`;
    els.submitBtn.textContent = "Save changes";
    els.cancelBtn.hidden = false;
  } else {
    editingId = null;
    els.formHeading.textContent = "Add a request";
    els.submitBtn.textContent = "Add record";
    els.cancelBtn.hidden = true;
  }
}

function resetForm() {
  els.form.reset();
  els.status.value = "Pending";
  setFormMode(null);
}

function fillForm(record) {
  els.title.value = record.title;
  els.category.value = record.category;
  els.description.value = record.description;
  els.status.value = record.status;
  setFormMode(record);
  els.title.focus();
  els.form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeDetails() {
  detailsId = null;
  els.details.hidden = true;
  els.detailsBody.replaceChildren();
}

function showDetails(record) {
  detailsId = record.id;
  const rows = [
    ["ID", record.id],
    ["Title", record.title],
    ["Category", record.category],
    ["Status", record.status],
    ["Description", record.description]
  ];
  els.detailsBody.replaceChildren();
  for (const [term, value] of rows) {
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = String(value);
    els.detailsBody.append(dt, dd);
  }
  els.details.hidden = false;
  els.details.scrollIntoView({ behavior: "smooth", block: "nearest" });
  els.closeDetails.focus();
}

function createItem(record) {
  const li = document.createElement("li");
  li.className = "record-item";
  li.dataset.status = record.status;

  const heading = document.createElement("h4");
  heading.textContent = record.title;

  const meta = document.createElement("p");
  meta.className = "meta";
  meta.textContent = `ID ${record.id} · ${record.category} · ${record.status}`;

  const actions = document.createElement("div");
  actions.className = "actions";

  const viewBtn = makeButton("View", "btn btn-quiet", `View ${record.title}`, () => openDetails(record.id));
  const editBtn = makeButton("Edit", "btn btn-quiet", `Edit ${record.title}`, () => fillForm(record));
  const deleteBtn = makeButton("Delete", "btn btn-danger", `Delete ${record.title}`, () => confirmDelete(record));

  actions.append(viewBtn, editBtn, deleteBtn);
  li.append(heading, meta, actions);
  return li;
}

function makeButton(text, className, label, handler) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = className;
  btn.textContent = text;
  btn.setAttribute("aria-label", label);
  btn.addEventListener("click", handler);
  return btn;
}

function render() {
  const term = els.search.value.trim().toLowerCase();
  const status = els.filter.value;

  const shown = records.filter((record) =>
    record.title.toLowerCase().includes(term) &&
    (status === "" || record.status === status)
  );

  els.list.replaceChildren();

  if (records.length === 0) {
    els.count.textContent = "Showing 0 requests.";
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No requests yet. Use the form to add the first one.";
    els.list.append(empty);
    return;
  }

  els.count.textContent = `Showing ${shown.length} of ${records.length} request${records.length === 1 ? "" : "s"}.`;

  if (shown.length === 0) {
    const none = document.createElement("li");
    none.className = "empty";
    none.textContent = "No requests match your search or status filter. Clear the search or choose All statuses.";
    els.list.append(none);
    return;
  }

  for (const record of shown) {
    els.list.append(createItem(record));
  }
}

async function refresh() {
  records = await recordService.list();
  render();
}

async function openDetails(id) {
  try {
    const record = await recordService.get(id);
    showDetails(record);
  } catch (error) {
    showMessage(error.message, "error");
  }
}

async function onSubmit(event) {
  event.preventDefault();
  hideMessage();

  const values = readForm();
  const problem = validate(values);
  if (problem) {
    showMessage(problem, "error");
    return;
  }

  try {
    if (editingId === null) {
      await recordService.create(values);
      showMessage("Request added. It is saved in this browser.", "success");
      resetForm();
    } else {
      const id = editingId;
      await recordService.update(id, values);
      showMessage(`Request ${id} updated.`, "success");
      resetForm();
      closeDetails();
    }
    await refresh();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

function onCancelEdit() {
  resetForm();
  hideMessage();
  showMessage("Edit cancelled. No changes were saved.", "info");
}

async function confirmDelete(record) {
  hideMessage();
  const confirmed = window.confirm(`Delete "${record.title}"? This cannot be undone.`);
  if (!confirmed) {
    showMessage("Deletion cancelled. The request was kept.", "info");
    return;
  }

  try {
    const result = await recordService.remove(record.id);
    if (editingId === record.id) resetForm();
    if (detailsId === record.id) closeDetails();
    showMessage(`${result.message} "${record.title}" was removed.`, "success");
    await refresh();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

// Event wiring
els.form.addEventListener("submit", onSubmit);
els.cancelBtn.addEventListener("click", onCancelEdit);
els.search.addEventListener("input", render);
els.filter.addEventListener("change", render);
els.closeDetails.addEventListener("click", closeDetails);

// Start
(async function init() {
  try {
    resetForm();
    await refresh();
  } catch (error) {
    showMessage(error.message, "error");
  }
})();
