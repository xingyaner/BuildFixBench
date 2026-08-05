const DATA_URL = "data/projects.json";

const CATEGORY_LABELS = {
  RC1: "Compiler issues",
  RC2: "Coverage file and directory issues",
  RC3: "Project environment issues",
  RC4: "Network issues",
  RC5: "Hardware issues",
  RC6: "Permission issues",
  RC7: "Corpus-related issues",
  RC8: "Issues downloading external resources",
  RC9: "Project dependency issues",
  RC10: "Project configuration and build file issues",
  RC11: "Coverage build configuration and file issues",
  RC12: "Fuzzer build script issues",
  RC13: "Source code-related project compilation errors",
  RC14: "Missing source code files",
  RC15: "Command- and argument-related issues",
  RC16: "Runtime issues while fuzzing",
  RC17: "Not enough information",
  RC18: "Sanitizer errors",
  RC19: "Broken fuzz target",
  RC20: "Missing fuzz target",
  RC21: "Input causes unusual fuzz crashes or behaviors",
  RC22: "Failing test cases",
  RC23: "Missing OSS-Fuzz scripts",
  RC24: "Unusual crash from the target binary",
  RC25: "Regression in the fuzz causes build crash",
};

const SCHEMA = [
  ["project", "Project name."],
  ["language", "Primary programming language."],
  ["error_time", "Date of the observed build failure."],
  ["oss-fuzz_sha", "OSS-Fuzz commit SHA at failure time."],
  ["fuzzing_build_error_log", "URL of the archived OSS-Fuzz build log."],
  ["software_repo_url", "URL of the upstream open-source repository."],
  ["software_sha", "Upstream project commit SHA at failure time."],
  ["engine", "Fuzzing engine, such as libFuzzer, AFL, Honggfuzz, or Centipede."],
  ["sanitizer", "Sanitizer configuration, such as address, memory, or undefined."],
  ["architecture", "Target CPU architecture."],
  ["base_image_digest", "Digest of the OSS-Fuzz base Docker image."],
  ["error_category", "Fine-grained failure category from RC1 to RC25."],
  ["root_cause_commit", "Commit identified as the root cause of the build failure."],
  ["root_cause_workspace", "Workspace where the root cause is located."],
];

const state = {
  records: [],
  filtered: [],
};

const els = {
  caseCount: document.querySelector("#caseCount"),
  projectCount: document.querySelector("#projectCount"),
  version: document.querySelector("#version"),
  languageChart: document.querySelector("#languageChart"),
  categoryChart: document.querySelector("#categoryChart"),
  searchInput: document.querySelector("#searchInput"),
  languageFilter: document.querySelector("#languageFilter"),
  engineFilter: document.querySelector("#engineFilter"),
  sanitizerFilter: document.querySelector("#sanitizerFilter"),
  architectureFilter: document.querySelector("#architectureFilter"),
  categoryFilter: document.querySelector("#categoryFilter"),
  resultCount: document.querySelector("#resultCount"),
  resetFilters: document.querySelector("#resetFilters"),
  casesBody: document.querySelector("#casesBody"),
  schemaGrid: document.querySelector("#schemaGrid"),
  detailsDialog: document.querySelector("#detailsDialog"),
  detailsTitle: document.querySelector("#detailsTitle"),
  detailsList: document.querySelector("#detailsList"),
  closeDialog: document.querySelector("#closeDialog"),
};

function normalizeCategory(value) {
  return String(value || "").split(":")[0].trim().toUpperCase();
}

function categoryText(value) {
  const code = normalizeCategory(value);
  return CATEGORY_LABELS[code] ? `${code}: ${CATEGORY_LABELS[code]}` : code || "unknown";
}

function shortHash(value, length = 6) {
  const text = String(value || "");
  return text ? text.slice(0, length) : "n/a";
}

function shortLog(value) {
  const text = String(value || "");
  const match = text.match(/log-[^/.]+/);
  return match ? match[0] : shortUrl(text);
}

function shortUrl(value) {
  if (!value) return "n/a";
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    const tail = parts.at(-1) || url.hostname;
    return `${url.hostname.replace(/^www\./, "")}/${tail.slice(0, 22)}`;
  } catch {
    return String(value).replace(/^https?:\/\//, "").slice(0, 34);
  }
}

function linkCell(url, label) {
  if (!url) return "n/a";
  return `<a href="${escapeAttr(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function uniqueValues(records, key) {
  return [...new Set(records.map((record) => record[key]).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)));
}

function fillSelect(select, values, label = "All") {
  select.innerHTML = `<option value="">${label}</option>${values
    .map((value) => `<option value="${escapeAttr(value)}">${escapeHtml(value)}</option>`)
    .join("")}`;
}

function countBy(records, key) {
  return records.reduce((counts, record) => {
    const value = key === "error_category"
      ? normalizeCategory(record[key])
      : String(record[key] || "unknown");
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function topEntries(counts, limit = 12) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

function drawBarChart(canvas, entries, options = {}) {
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = Number(canvas.getAttribute("height")) || 260;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, width, height);

  const max = Math.max(...entries.map((entry) => entry[1]), 1);
  const top = 14;
  const left = options.left || 96;
  const right = 42;
  const rowHeight = Math.min(24, (height - top - 20) / Math.max(entries.length, 1));
  const barHeight = Math.max(10, rowHeight - 8);
  const colors = ["#17695d", "#c4862d", "#436f9f", "#b4575d", "#627a46", "#6f625b"];

  ctx.font = "12px Inter, system-ui, sans-serif";
  ctx.textBaseline = "middle";

  entries.forEach(([label, count], index) => {
    const y = top + index * rowHeight + rowHeight / 2;
    const barWidth = ((width - left - right) * count) / max;
    ctx.fillStyle = "#4f5c55";
    ctx.textAlign = "right";
    ctx.fillText(label, left - 12, y);
    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(left, y - barHeight / 2, barWidth, barHeight);
    ctx.fillStyle = "#17201b";
    ctx.textAlign = "left";
    ctx.fillText(String(count), left + barWidth + 8, y);
  });
}

function renderCharts() {
  drawBarChart(els.languageChart, topEntries(countBy(state.records, "language"), 10), {
    left: 98,
  });
  drawBarChart(
    els.categoryChart,
    topEntries(countBy(state.records, "error_category"), 12),
    { left: 66 },
  );
}

function renderSchema() {
  els.schemaGrid.innerHTML = SCHEMA.map(([field, description]) => `
    <article class="schema-item">
      <code>${escapeHtml(field)}</code>
      <p>${escapeHtml(description)}</p>
    </article>
  `).join("");
}

function recordMatches(record) {
  const query = els.searchInput.value.trim().toLowerCase();
  const filters = [
    ["language", els.languageFilter.value],
    ["engine", els.engineFilter.value],
    ["sanitizer", els.sanitizerFilter.value],
    ["architecture", els.architectureFilter.value],
  ];
  const category = els.categoryFilter.value;
  const text = Object.values(record).join(" ").toLowerCase();

  if (query && !text.includes(query)) return false;
  if (category && normalizeCategory(record.error_category) !== category) return false;
  return filters.every(([key, value]) => !value || String(record[key]) === value);
}

function applyFilters() {
  state.filtered = state.records.filter(recordMatches);
  renderTable();
}

function renderTable() {
  els.resultCount.textContent = `${state.filtered.length} of ${state.records.length} cases`;
  els.casesBody.innerHTML = state.filtered.map((record, index) => `
    <tr>
      <td><strong>${escapeHtml(record.project || "n/a")}</strong></td>
      <td>${escapeHtml(record.language || "n/a")}</td>
      <td>${escapeHtml(record.error_time || "n/a")}</td>
      <td>${shortHash(record["oss-fuzz_sha"])}</td>
      <td>${linkCell(record.fuzzing_build_error_log, shortLog(record.fuzzing_build_error_log))}</td>
      <td>${linkCell(record.software_repo_url, shortUrl(record.software_repo_url))}</td>
      <td><span class="pill engine">${escapeHtml(record.engine || "n/a")}</span></td>
      <td>${escapeHtml(record.sanitizer || "n/a")}</td>
      <td>${escapeHtml(record.architecture || "n/a")}</td>
      <td><span class="pill category">${escapeHtml(normalizeCategory(record.error_category))}</span></td>
      <td><button class="details-button" type="button" data-index="${index}">Details</button></td>
    </tr>
  `).join("");
}

function openDetails(record) {
  els.detailsTitle.textContent = `${record.project || "Unknown project"} · ${record.error_time || "unknown date"}`;
  els.detailsList.innerHTML = SCHEMA.map(([key]) => {
    const rawValue = record[key] || "";
    const value = key === "error_category" ? categoryText(rawValue) : rawValue;
    const urlField = key.endsWith("_url") || key === "fuzzing_build_error_log";
    const body = urlField && rawValue
      ? `<a href="${escapeAttr(rawValue)}" target="_blank" rel="noreferrer">${escapeHtml(rawValue)}</a>`
      : escapeHtml(value || "n/a");
    return `<dt>${escapeHtml(key)}</dt><dd>${body}</dd>`;
  }).join("");
  els.detailsDialog.showModal();
}

function bindEvents() {
  [
    els.searchInput,
    els.languageFilter,
    els.engineFilter,
    els.sanitizerFilter,
    els.architectureFilter,
    els.categoryFilter,
  ].forEach((element) => element.addEventListener("input", applyFilters));

  els.resetFilters.addEventListener("click", () => {
    els.searchInput.value = "";
    [
      els.languageFilter,
      els.engineFilter,
      els.sanitizerFilter,
      els.architectureFilter,
      els.categoryFilter,
    ].forEach((select) => {
      select.value = "";
    });
    applyFilters();
  });

  els.casesBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-index]");
    if (!button) return;
    openDetails(state.filtered[Number(button.dataset.index)]);
  });

  els.closeDialog.addEventListener("click", () => els.detailsDialog.close());
  window.addEventListener("resize", renderCharts);
}

async function init() {
  renderSchema();
  bindEvents();
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`Failed to load ${DATA_URL}`);
  const payload = await response.json();
  state.records = payload.records.map((record) => ({
    ...record,
    error_category: normalizeCategory(record.error_category),
  }));
  state.filtered = state.records;

  els.caseCount.textContent = String(payload.summary?.total_cases ?? state.records.length);
  els.projectCount.textContent = String(payload.summary?.projects ?? uniqueValues(state.records, "project").length);
  els.version.textContent = payload.version || "v0.1";

  fillSelect(els.languageFilter, uniqueValues(state.records, "language"));
  fillSelect(els.engineFilter, uniqueValues(state.records, "engine"));
  fillSelect(els.sanitizerFilter, uniqueValues(state.records, "sanitizer"));
  fillSelect(els.architectureFilter, uniqueValues(state.records, "architecture"));
  fillSelect(
    els.categoryFilter,
    uniqueValues(state.records, "error_category").map(normalizeCategory),
  );

  renderCharts();
  renderTable();
}

init().catch((error) => {
  els.resultCount.textContent = "Failed to load dataset.";
  console.error(error);
});
