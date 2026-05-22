const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const SLOTS = [
  { label: "9:00 AM - 10:00 AM", start: 9 * 60, end: 10 * 60 },
  { label: "10:00 AM - 11:00 AM", start: 10 * 60, end: 11 * 60 },
  { label: "11:15 AM - 12:15 PM", start: 11 * 60 + 15, end: 12 * 60 + 15 },
  { label: "12:15 PM - 1:15 PM", start: 12 * 60 + 15, end: 13 * 60 + 15 },
  { label: "2:00 PM - 3:00 PM", start: 14 * 60, end: 15 * 60 },
  { label: "3:00 PM - 4:00 PM", start: 15 * 60, end: 16 * 60 }
];

const SUBJECT_COLORS = {
  Mathematics: "#2563eb",
  Programming: "#7c3aed",
  Physics: "#16a34a",
  Electronics: "#f97316",
  "AI/ML": "#ec4899",
  Break: "#64748b"
};

const QUOTES = [
  "Small daily progress compounds into a semester you can be proud of.",
  "A clear routine turns pressure into momentum.",
  "Study like an engineer: measure, improve, repeat.",
  "Your next focused hour can change the whole week.",
  "Plan the day, protect the hour, trust the process."
];

const STORAGE_KEY = "iemSmartTimetable.v1";
const $ = (selector) => document.querySelector(selector);

let state = loadState();
let timerInterval = null;
let timerSeconds = state.timerSeconds || 25 * 60;
let timerRunning = false;

const elements = {
  welcomeText: $("#welcomeText"),
  studentMeta: $("#studentMeta"),
  profileForm: $("#profileForm"),
  timetableGrid: $("#timetableGrid"),
  mobileSchedule: $("#mobileSchedule"),
  todaySchedule: $("#todaySchedule"),
  currentClass: $("#currentClass"),
  classDialog: $("#classDialog"),
  classForm: $("#classForm"),
  dialogTitle: $("#dialogTitle"),
  deleteEntry: $("#deleteEntry"),
  toast: $("#toast"),
  clashBanner: $("#clashBanner"),
  attendanceList: $("#attendanceList"),
  examList: $("#examList"),
  assignmentList: $("#assignmentList"),
  miniCalendar: $("#miniCalendar"),
  analyticsChart: $("#analyticsChart"),
  timerDisplay: $("#timerDisplay")
};

function loadState() {
  // LocalStorage keeps the app backend-free and Vercel-ready.
  const fallback = createDefaultState();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const merged = { ...fallback, ...saved };
    if (merged.profile?.semester === "5th Semester") {
      merged.profile.semester = "3rd Semester";
    }
    return merged;
  } catch (error) {
    return fallback;
  }
}

function createDefaultState() {
  // Starter data makes the first screen feel useful before a student edits it.
  return {
    profile: {
      name: "IEM Student",
      department: "Computer Science Engineering",
      semester: "3rd Semester",
      section: "A",
      roll: "IEM/CSE/2026"
    },
    theme: "light",
    quoteIndex: 0,
    entries: [
      entry("Monday", 0, "Mathematics", "Room 301", "Prof. Sen"),
      entry("Monday", 1, "Programming", "Lab 2", "Prof. Das"),
      entry("Monday", 2, "Break", "Canteen", ""),
      entry("Monday", 4, "AI/ML", "Room 405", "Prof. Roy"),
      entry("Tuesday", 0, "Physics", "Room 204", "Prof. Saha"),
      entry("Tuesday", 2, "Electronics", "Room 210", "Prof. Dutta"),
      entry("Wednesday", 1, "Programming", "Lab 1", "Prof. Das"),
      entry("Wednesday", 3, "Mathematics", "Room 301", "Prof. Sen"),
      entry("Thursday", 0, "AI/ML", "Room 405", "Prof. Roy"),
      entry("Thursday", 2, "Physics", "Lab 3", "Prof. Saha"),
      entry("Friday", 1, "Electronics", "Room 210", "Prof. Dutta"),
      entry("Friday", 4, "Programming", "Lab 2", "Prof. Das")
    ],
    attendance: {
      Mathematics: { attended: 18, total: 20 },
      Programming: { attended: 20, total: 22 },
      Physics: { attended: 16, total: 19 },
      Electronics: { attended: 15, total: 18 },
      "AI/ML": { attended: 12, total: 14 }
    },
    exams: [
      { id: cryptoId(), title: "Mathematics Mid-Sem", date: nextDate(7) }
    ],
    assignments: [
      { id: cryptoId(), title: "Programming lab record", date: nextDate(3) }
    ],
    timerSeconds: 25 * 60
  };
}

function entry(day, slotIndex, subject, room, faculty) {
  return {
    id: cryptoId(),
    day,
    slotIndex,
    subject,
    room,
    faculty,
    color: SUBJECT_COLORS[subject] || SUBJECT_COLORS.Programming
  };
}

function cryptoId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nextDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function saveState() {
  state.timerSeconds = timerSeconds;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function init() {
  document.documentElement.dataset.theme = state.theme;
  $("#themeToggle use").setAttribute("href", state.theme === "dark" ? "#icon-sun" : "#icon-moon");
  fillSelects();
  bindEvents();
  hydrateProfileForm();
  renderAll();
  registerServiceWorker();
}

function fillSelects() {
  $("#entryDay").innerHTML = DAYS.map((day) => `<option value="${day}">${day}</option>`).join("");
  $("#entrySlot").innerHTML = SLOTS.map((slot, index) => `<option value="${index}">${slot.label}</option>`).join("");
  $("#entrySubject").innerHTML = [...Object.keys(SUBJECT_COLORS), "Custom"]
    .map((subject) => `<option value="${subject}">${subject}</option>`)
    .join("");
}

function bindEvents() {
  $("#addClassTop").addEventListener("click", () => openClassDialog());
  $("#closeDialog").addEventListener("click", () => elements.classDialog.close());
  $("#themeToggle").addEventListener("click", toggleTheme);
  $("#newQuote").addEventListener("click", () => {
    state.quoteIndex = (state.quoteIndex + 1) % QUOTES.length;
    saveState();
    renderQuote();
  });

  elements.profileForm.addEventListener("input", updateProfile);
  elements.classForm.addEventListener("submit", saveEntryFromForm);
  elements.deleteEntry.addEventListener("click", deleteCurrentEntry);
  $("#entrySubject").addEventListener("change", syncSubjectColor);
  $("#downloadPng").addEventListener("click", downloadPng);
  $("#downloadPdf").addEventListener("click", downloadPdf);
  $("#printRoutine").addEventListener("click", () => window.print());
  $("#aiSuggest").addEventListener("click", showSuggestions);
  $("#examForm").addEventListener("submit", addExam);
  $("#assignmentForm").addEventListener("submit", addAssignment);
  $("#timerStart").addEventListener("click", toggleTimer);
  $("#timerReset").addEventListener("click", resetTimer);
}

function hydrateProfileForm() {
  $("#studentName").value = state.profile.name || "";
  $("#department").value = state.profile.department || "";
  $("#semester").value = state.profile.semester || "";
  $("#section").value = state.profile.section || "";
  $("#roll").value = state.profile.roll || "";
}

function updateProfile() {
  state.profile = {
    name: $("#studentName").value.trim(),
    department: $("#department").value.trim(),
    semester: $("#semester").value.trim(),
    section: $("#section").value.trim(),
    roll: $("#roll").value.trim()
  };
  saveState();
  renderProfile();
}

function renderAll() {
  // One render pass keeps every dashboard section in sync after a data change.
  renderProfile();
  renderQuote();
  renderTimetable();
  renderToday();
  renderAttendance();
  renderReminders();
  renderCalendar();
  renderAnalytics();
  renderTimer();
}

function renderProfile() {
  const name = state.profile.name || "future engineer";
  elements.welcomeText.textContent = `Welcome, ${name}`;
  elements.studentMeta.textContent = [
    state.profile.department,
    state.profile.semester,
    state.profile.section ? `Section ${state.profile.section}` : "",
    state.profile.roll
  ].filter(Boolean).join(" | ") || "Department, semester, section, and roll details appear here.";
}

function renderQuote() {
  elements.quoteText.textContent = QUOTES[state.quoteIndex % QUOTES.length];
}

function renderTimetable() {
  // Clashes are calculated from duplicate day and slot pairs.
  const clashes = getClashes();
  renderClashBanner(clashes);
  renderDesktopGrid(clashes);
  renderMobileSchedule(clashes);
}

function renderClashBanner(clashes) {
  const count = Object.keys(clashes).length;
  elements.clashBanner.hidden = count === 0;
  elements.clashBanner.textContent = count
    ? `${count} clash${count > 1 ? "es" : ""} detected. Overlapping classes are highlighted in red.`
    : "";
}

function renderDesktopGrid(clashes) {
  const cells = ['<div class="time-head">Time</div>'];
  DAYS.forEach((day) => cells.push(`<div class="grid-head">${day}</div>`));

  SLOTS.forEach((slot, slotIndex) => {
    cells.push(`<div class="time-cell">${slot.label}</div>`);
    DAYS.forEach((day) => {
      const key = keyFor(day, slotIndex);
      const entries = getEntries(day, slotIndex);
      cells.push(`
        <div class="day-cell" data-day="${day}" data-slot="${slotIndex}">
          ${entries.map((item) => classChip(item, Boolean(clashes[key]))).join("")}
          <button class="empty-add" type="button" data-add-day="${day}" data-add-slot="${slotIndex}">+</button>
        </div>
      `);
    });
  });

  elements.timetableGrid.innerHTML = cells.join("");
  bindTimetableActions(elements.timetableGrid);
}

function renderMobileSchedule(clashes) {
  elements.mobileSchedule.innerHTML = DAYS.map((day) => {
    const slots = SLOTS.map((slot, slotIndex) => {
      const key = keyFor(day, slotIndex);
      const entries = getEntries(day, slotIndex);
      return `
        <div class="mobile-slot" data-day="${day}" data-slot="${slotIndex}">
          <span class="slot-time">${slot.label}</span>
          ${entries.length ? entries.map((item) => classChip(item, Boolean(clashes[key]))).join("") : '<span class="muted">Free slot</span>'}
          <button class="empty-add" type="button" data-add-day="${day}" data-add-slot="${slotIndex}">+</button>
        </div>
      `;
    }).join("");
    return `<div class="mobile-day"><h3>${day}</h3>${slots}</div>`;
  }).join("");
  bindTimetableActions(elements.mobileSchedule);
}

function classChip(item, isClash) {
  const faculty = item.faculty ? item.faculty : "Faculty TBA";
  const room = item.room ? item.room : "Room TBA";
  return `
    <article class="class-chip ${isClash ? "clash" : ""}" draggable="true" data-entry-id="${item.id}" style="background:${chipGradient(item.color)}">
      <strong class="chip-subject">${escapeHtml(item.subject)}</strong>
      <span class="chip-meta">${escapeHtml(room)} | ${escapeHtml(faculty)}</span>
      <div class="chip-actions">
        <button type="button" data-edit="${item.id}" title="Edit class" aria-label="Edit class">
          <svg><use href="#icon-edit"></use></svg>
        </button>
        <button type="button" data-delete="${item.id}" title="Delete class" aria-label="Delete class">
          <svg><use href="#icon-trash"></use></svg>
        </button>
      </div>
    </article>
  `;
}

function chipGradient(color) {
  return `linear-gradient(135deg, ${color}, ${shade(color, -22)})`;
}

function shade(hex, percent) {
  const clean = hex.replace("#", "");
  const number = parseInt(clean, 16);
  const amount = Math.round(2.55 * percent);
  const red = Math.max(0, Math.min(255, (number >> 16) + amount));
  const green = Math.max(0, Math.min(255, ((number >> 8) & 255) + amount));
  const blue = Math.max(0, Math.min(255, (number & 255) + amount));
  return `#${(0x1000000 + red * 0x10000 + green * 0x100 + blue).toString(16).slice(1)}`;
}

function bindTimetableActions(root) {
  root.querySelectorAll("[data-add-day]").forEach((button) => {
    button.addEventListener("click", () => openClassDialog(null, button.dataset.addDay, Number(button.dataset.addSlot)));
  });

  root.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => openClassDialog(button.dataset.edit));
  });

  root.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      state.entries = state.entries.filter((item) => item.id !== button.dataset.delete);
      saveState();
      renderAll();
      showToast("Class deleted");
    });
  });

  root.querySelectorAll("[draggable='true']").forEach((chip) => {
    chip.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", chip.dataset.entryId);
    });
  });

  root.querySelectorAll("[data-day][data-slot]").forEach((cell) => {
    cell.addEventListener("dragover", (event) => {
      event.preventDefault();
      cell.classList.add("drag-over");
    });
    cell.addEventListener("dragleave", () => cell.classList.remove("drag-over"));
    cell.addEventListener("drop", (event) => {
      event.preventDefault();
      cell.classList.remove("drag-over");
      const id = event.dataTransfer.getData("text/plain");
      const item = state.entries.find((entryItem) => entryItem.id === id);
      if (!item) return;
      item.day = cell.dataset.day;
      item.slotIndex = Number(cell.dataset.slot);
      saveState();
      renderAll();
      showToast("Class moved");
    });
  });
}

function openClassDialog(id = null, day = DAYS[0], slotIndex = 0) {
  const item = state.entries.find((entryItem) => entryItem.id === id);
  elements.dialogTitle.textContent = item ? "Edit Class" : "Add Class";
  $("#entryId").value = item ? item.id : "";
  $("#entryDay").value = item ? item.day : day;
  $("#entrySlot").value = item ? item.slotIndex : slotIndex;
  $("#entrySubject").value = item && SUBJECT_COLORS[item.subject] ? item.subject : "Custom";
  $("#customSubject").value = item && !SUBJECT_COLORS[item.subject] ? item.subject : "";
  $("#entryFaculty").value = item ? item.faculty : "";
  $("#entryRoom").value = item ? item.room : "";
  $("#entryColor").value = item ? item.color : SUBJECT_COLORS.Mathematics;
  elements.deleteEntry.style.visibility = item ? "visible" : "hidden";
  elements.classDialog.showModal();
}

function saveEntryFromForm(event) {
  event.preventDefault();
  const id = $("#entryId").value;
  const selectedSubject = $("#entrySubject").value;
  const customSubject = $("#customSubject").value.trim();
  const subject = selectedSubject === "Custom" ? customSubject || "Custom Subject" : selectedSubject;
  const payload = {
    id: id || cryptoId(),
    day: $("#entryDay").value,
    slotIndex: Number($("#entrySlot").value),
    subject,
    faculty: $("#entryFaculty").value.trim(),
    room: $("#entryRoom").value.trim(),
    color: $("#entryColor").value
  };

  if (id) {
    state.entries = state.entries.map((item) => item.id === id ? payload : item);
  } else {
    state.entries.push(payload);
  }

  ensureAttendanceSubject(subject);
  saveState();
  elements.classDialog.close();
  renderAll();
  showToast(id ? "Class updated" : "Class added");
}

function deleteCurrentEntry() {
  const id = $("#entryId").value;
  if (!id) return;
  state.entries = state.entries.filter((item) => item.id !== id);
  saveState();
  elements.classDialog.close();
  renderAll();
  showToast("Class deleted");
}

function syncSubjectColor() {
  const subject = $("#entrySubject").value;
  if (SUBJECT_COLORS[subject]) {
    $("#entryColor").value = SUBJECT_COLORS[subject];
  }
}

function getEntries(day, slotIndex) {
  return state.entries.filter((item) => item.day === day && Number(item.slotIndex) === Number(slotIndex));
}

function getClashes() {
  const counts = state.entries.reduce((map, item) => {
    const key = keyFor(item.day, item.slotIndex);
    map[key] = (map[key] || 0) + 1;
    return map;
  }, {});
  return Object.fromEntries(Object.entries(counts).filter(([, count]) => count > 1));
}

function keyFor(day, slotIndex) {
  return `${day}-${slotIndex}`;
}

function renderToday() {
  const dayIndex = new Date().getDay() - 1;
  const day = DAYS[dayIndex];
  if (!day) {
    elements.currentClass.innerHTML = "<strong>Weekend mode</strong><span class='muted'>No weekday classes scheduled.</span>";
    elements.todaySchedule.innerHTML = "";
    return;
  }

  const todaysEntries = state.entries
    .filter((item) => item.day === day)
    .sort((a, b) => a.slotIndex - b.slotIndex);
  const current = currentEntriesForDay(day);

  elements.currentClass.innerHTML = current.length
    ? current.map((item) => `<strong>${escapeHtml(item.subject)}</strong><span class="muted">${SLOTS[item.slotIndex].label} | ${escapeHtml(item.room || "Room TBA")}</span>`).join("")
    : "<strong>No live class right now</strong><span class='muted'>Use the next free slot wisely.</span>";

  elements.todaySchedule.innerHTML = todaysEntries.length
    ? todaysEntries.map((item) => compactItem(item.subject, `${SLOTS[item.slotIndex].label} | ${item.room || "Room TBA"}`)).join("")
    : "<span class='muted'>No classes found for today.</span>";
}

function currentEntriesForDay(day) {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return state.entries.filter((item) => {
    const slot = SLOTS[item.slotIndex];
    return item.day === day && slot && minutes >= slot.start && minutes < slot.end;
  });
}

function renderAttendance() {
  const subjects = uniqueSubjects().filter((subject) => subject !== "Break");
  elements.attendanceList.innerHTML = subjects.map((subject) => {
    ensureAttendanceSubject(subject);
    const record = state.attendance[subject];
    const percent = record.total ? Math.round((record.attended / record.total) * 100) : 0;
    return `
      <div class="attendance-row">
        <div class="attendance-row__top">
          <strong>${escapeHtml(subject)}</strong>
          <span class="muted">${percent}%</span>
        </div>
        <div class="progress"><span style="width:${Math.min(percent, 100)}%"></span></div>
        <div class="attendance-inputs">
          <label>Attended<input type="number" min="0" data-attended="${escapeHtml(subject)}" value="${record.attended}"></label>
          <label>Total<input type="number" min="0" data-total="${escapeHtml(subject)}" value="${record.total}"></label>
        </div>
      </div>
    `;
  }).join("");

  elements.attendanceList.querySelectorAll("[data-attended], [data-total]").forEach((input) => {
    input.addEventListener("change", () => {
      const subject = input.dataset.attended || input.dataset.total;
      ensureAttendanceSubject(subject);
      if (input.dataset.attended) state.attendance[subject].attended = Number(input.value || 0);
      if (input.dataset.total) state.attendance[subject].total = Number(input.value || 0);
      saveState();
      renderAttendance();
    });
  });
}

function ensureAttendanceSubject(subject) {
  if (!state.attendance[subject]) {
    state.attendance[subject] = { attended: 0, total: 0 };
  }
}

function uniqueSubjects() {
  return [...new Set([...Object.keys(SUBJECT_COLORS), ...state.entries.map((item) => item.subject)])];
}

function addExam(event) {
  event.preventDefault();
  state.exams.push({ id: cryptoId(), title: $("#examTitleInput").value.trim(), date: $("#examDateInput").value });
  $("#examTitleInput").value = "";
  $("#examDateInput").value = "";
  saveState();
  renderReminders();
}

function addAssignment(event) {
  event.preventDefault();
  state.assignments.push({ id: cryptoId(), title: $("#assignmentTitleInput").value.trim(), date: $("#assignmentDateInput").value });
  $("#assignmentTitleInput").value = "";
  $("#assignmentDateInput").value = "";
  saveState();
  renderReminders();
}

function renderReminders() {
  elements.examList.innerHTML = reminderMarkup(state.exams, "exams");
  elements.assignmentList.innerHTML = reminderMarkup(state.assignments, "assignments");
  document.querySelectorAll("[data-remove-reminder]").forEach((button) => {
    button.addEventListener("click", () => {
      const listName = button.dataset.list;
      state[listName] = state[listName].filter((item) => item.id !== button.dataset.removeReminder);
      saveState();
      renderReminders();
    });
  });
}

function reminderMarkup(list, listName) {
  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) return "<span class='muted'>No reminders yet.</span>";
  return sorted.map((item) => `
    <div class="compact-item reminder-row">
      <span><strong>${escapeHtml(item.title)}</strong><br><span>${formatDate(item.date)}</span></span>
      <button class="icon-button" type="button" data-list="${listName}" data-remove-reminder="${item.id}" title="Remove reminder" aria-label="Remove reminder">
        <svg><use href="#icon-trash"></use></svg>
      </button>
    </div>
  `).join("");
}

function renderCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const total = new Date(year, month + 1, 0).getDate();
  const offset = first.getDay();
  const title = now.toLocaleString(undefined, { month: "long", year: "numeric" });
  const cells = [`<div class="calendar-title">${title}</div>`];
  ["S", "M", "T", "W", "T", "F", "S"].forEach((label) => cells.push(`<div class="calendar-cell muted">${label}</div>`));
  for (let i = 0; i < offset; i += 1) cells.push("<div></div>");
  for (let day = 1; day <= total; day += 1) {
    cells.push(`<div class="calendar-cell ${day === now.getDate() ? "today" : ""}">${day}</div>`);
  }
  elements.miniCalendar.innerHTML = cells.join("");
}

function renderAnalytics() {
  const counts = {};
  state.entries.forEach((item) => {
    if (item.subject === "Break") return;
    counts[item.subject] = (counts[item.subject] || 0) + 1;
  });
  const max = Math.max(1, ...Object.values(counts));
  elements.analyticsChart.innerHTML = Object.entries(counts).map(([subject, count]) => {
    const color = colorForSubject(subject);
    return `
      <div class="bar-row">
        <strong>${escapeHtml(subject)}</strong>
        <div class="bar-track"><span class="bar-fill" style="width:${(count / max) * 100}%; background:${color}"></span></div>
        <span class="muted">${count}h</span>
      </div>
    `;
  }).join("") || "<span class='muted'>Add classes to see study hours.</span>";
}

function toggleTimer() {
  timerRunning = !timerRunning;
  $("#timerStart").textContent = timerRunning ? "Pause" : "Start";
  if (timerRunning) {
    timerInterval = setInterval(() => {
      timerSeconds -= 1;
      if (timerSeconds <= 0) {
        timerSeconds = 0;
        toggleTimer();
        showToast("Study session complete");
      }
      saveState();
      renderTimer();
    }, 1000);
  } else {
    clearInterval(timerInterval);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = 25 * 60;
  $("#timerStart").textContent = "Start";
  saveState();
  renderTimer();
}

function renderTimer() {
  const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
  const seconds = String(timerSeconds % 60).padStart(2, "0");
  elements.timerDisplay.textContent = `${minutes}:${seconds}`;
}

function showSuggestions() {
  const clashes = Object.keys(getClashes()).filter((key) => getClashes()[key] > 1);
  const freeSlots = [];
  DAYS.forEach((day) => {
    SLOTS.forEach((slot, index) => {
      if (!getEntries(day, index).length) freeSlots.push(`${day} ${slot.label}`);
    });
  });

  const lowAttendance = Object.entries(state.attendance)
    .filter(([, record]) => record.total && record.attended / record.total < 0.75)
    .map(([subject]) => subject);

  const lines = [];
  lines.push(clashes.length ? `Resolve ${clashes.length} clash slot before the week starts.` : "No timetable clashes found.");
  lines.push(freeSlots.length ? `Best open slot: ${freeSlots[0]}.` : "No open slots left this week.");
  if (lowAttendance.length) lines.push(`Prioritize attendance for ${lowAttendance.join(", ")}.`);
  showToast(lines.join(" "));
}

function downloadPng() {
  // The PNG export is drawn directly to canvas so it works offline.
  const canvas = document.createElement("canvas");
  canvas.width = 1500;
  canvas.height = 980;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f4f7fb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawRounded(ctx, 40, 40, 1420, 900, 24, "#ffffff");
  ctx.fillStyle = "#172033";
  ctx.font = "bold 42px Arial";
  ctx.fillText("Time Genius", 80, 105);
  ctx.font = "22px Arial";
  ctx.fillStyle = "#667085";
  ctx.fillText(elements.studentMeta.textContent, 80, 145);

  const startX = 80;
  const startY = 190;
  const colW = 235;
  const rowH = 105;
  ctx.font = "bold 18px Arial";
  ctx.fillStyle = "#172033";
  DAYS.forEach((day, index) => ctx.fillText(day, startX + 130 + index * colW, startY));
  SLOTS.forEach((slot, row) => {
    const y = startY + 35 + row * rowH;
    ctx.fillStyle = "#667085";
    ctx.font = "bold 15px Arial";
    ctx.fillText(slot.label, startX, y + 38);
    DAYS.forEach((day, col) => {
      const entries = getEntries(day, row);
      const x = startX + 115 + col * colW;
      drawRounded(ctx, x, y, colW - 14, rowH - 12, 12, "#edf2f7");
      entries.slice(0, 2).forEach((item, entryIndex) => {
        drawRounded(ctx, x + 8, y + 8 + entryIndex * 42, colW - 30, 34, 8, item.color);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.fillText(item.subject.slice(0, 20), x + 18, y + 30 + entryIndex * 42);
      });
    });
  });

  downloadBlob(dataUrlToBlob(canvas.toDataURL("image/png")), "iem-smart-timetable.png");
}

function downloadPdf() {
  const lines = ["Time Genius", elements.studentMeta.textContent, ""];
  DAYS.forEach((day) => {
    lines.push(day);
    SLOTS.forEach((slot, index) => {
      const entries = getEntries(day, index);
      lines.push(`${slot.label}: ${entries.map((item) => `${item.subject} (${item.room || "Room TBA"})`).join(", ") || "Free"}`);
    });
    lines.push("");
  });
  const blob = new Blob([createPdf(lines)], { type: "application/pdf" });
  downloadBlob(blob, "iem-smart-timetable.pdf");
}

function createPdf(lines) {
  // This small PDF writer avoids external libraries for a simple text export.
  const content = lines.slice(0, 46).map((line, index) => {
    const y = 790 - index * 16;
    const size = index === 0 ? 18 : 10;
    return `BT /F1 ${size} Tf 42 ${y} Td (${pdfEscape(line.slice(0, 95))}) Tj ET`;
  }).join("\n");
  const contentStream = `${content}\n`;
  const stream = `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`;
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n",
    stream,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += object;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

function pdfEscape(text) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = state.theme;
  $("#themeToggle use").setAttribute("href", state.theme === "dark" ? "#icon-sun" : "#icon-moon");
  saveState();
}

function compactItem(title, detail) {
  return `<div class="compact-item"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span></div>`;
}

function colorForSubject(subject) {
  const entryItem = state.entries.find((item) => item.subject === subject);
  return SUBJECT_COLORS[subject] || (entryItem && entryItem.color) || SUBJECT_COLORS.Programming;
}

function formatDate(value) {
  if (!value) return "No date";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function drawRounded(ctx, x, y, width, height, radius, color) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => elements.toast.classList.remove("show"), 3600);
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      showToast("Offline cache will activate after deployment.");
    });
  }
}

init();
