const STORAGE_KEY = "regik-kabinet-v1";
const PASS = typeof PASS_SCORE === "number" ? PASS_SCORE : 7;

const app = document.querySelector("#app");

function emptyState() {
  return {
    v: 4,
    student: null,
    pageMarks: [],
    quiz: {},
    progress: {},
    retake: {},
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = { ...emptyState(), ...JSON.parse(raw) };
    if (!parsed.student && parsed.studentName) {
      parsed.student = { name: parsed.studentName, email: "", group: "" };
    }
    if (!parsed.progress) parsed.progress = {};
    if (!parsed.retake) parsed.retake = {};
    return parsed;
  } catch (error) {
    return emptyState();
  }
}

function isRetaking(course, lesson) {
  return !!(state.retake && state.retake[quizKey(course, lesson)]);
}

let state = load();

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function isLoggedIn() {
  const s = state.student;
  return !!(s && s.name && s.email && s.group);
}

function coursesForGroup() {
  return COURSES;
}

function quizKey(course, lesson) {
  return course.id + ":" + lesson.id;
}

function isPassed(course, lesson) {
  const row = state.progress[quizKey(course, lesson)];
  return !!(row && row.passed);
}

function isLessonOpen(course, index) {
  if (index <= 0) return true;
  return isPassed(course, course.lessons[index - 1]);
}

async function sendToSheet(payload) {
  const url = typeof SHEETS_WEBAPP_URL === "string" ? SHEETS_WEBAPP_URL.trim() : "";
  if (!url) return { ok: false, skipped: true, reason: "немає адреси таблиці" };
  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error && error.message ? error.message : "помилка мережі",
    };
  }
}

function setQuizMessage(node, text, kind) {
  const tones = {
    ok: "mt-4 text-sm font-semibold text-emerald-900",
    warn: "mt-4 text-sm font-semibold text-amber-800",
    err: "mt-4 text-sm font-semibold text-rose-700",
  };
  node.className = tones[kind] || tones.err;
  node.textContent = text;
}

function route() {
  const parts = (location.hash || "#/").replace(/^#/, "").split("/").filter(Boolean);
  return { page: parts[0] || "home", id: parts[1] || "", extra: parts[2] || "" };
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

const ICONS = {
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8M8 11h6"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  check: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  shrink: '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  back: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  mark: '<path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
};

function icon(name, className) {
  const wrap = el("span", "icon" + (className ? " " + className : ""));
  wrap.setAttribute("aria-hidden", "true");
  wrap.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
    (ICONS[name] || "") +
    "</svg>";
  return wrap;
}

function rowTitle(iconName, text) {
  const node = el("div", "flex items-center gap-2");
  node.append(icon(iconName, "icon-lg"), el("h2", "font-serif text-2xl font-semibold", text));
  return node;
}

const pdfCache = {};

function getPdf(src) {
  if (!pdfCache[src]) pdfCache[src] = pdfjsLib.getDocument({ url: src }).promise;
  return pdfCache[src];
}

async function paintThumb(host, src, pageNumber) {
  if (!window.pdfjsLib || location.protocol === "file:") {
    host.textContent = "PDF";
    return;
  }
  try {
    const pdf = await getPdf(src);
    const page = await pdf.getPage(Math.min(Math.max(pageNumber || 1, 1), pdf.numPages));
    const base = page.getViewport({ scale: 1 });
    const scale = 140 / base.width;
    const viewport = page.getViewport({ scale: scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    host.replaceChildren(canvas);
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: viewport }).promise;
  } catch (error) {
    host.textContent = "…";
  }
}

function link(href, className, text) {
  const node = el("a", className, text);
  node.href = href;
  return node;
}

function external(href, className, text) {
  const node = link(href, className, text);
  node.target = "_blank";
  node.rel = "noopener noreferrer";
  return node;
}

function shell(title, crumbs, body, wide) {
  app.replaceChildren();
  const width = wide ? "max-w-7xl" : "max-w-5xl";
  const header = el("header", "sticky top-0 z-20 border-b border-stone-300/80 bg-[#f3efe6]/95 backdrop-blur");
  const bar = el("div", "site-header-bar mx-auto " + width + " px-4 py-2.5 sm:px-6");
  const brand = link("#/", "min-w-0 shrink", "");
  brand.append(el("span", "block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-emerald-900 sm:text-xs", "РЕГІК"));
  brand.append(el("span", "block truncate text-sm font-semibold sm:text-base", "Кабінет Гудими"));
  bar.append(brand, el("div", "min-w-2 flex-1"));
  if (isLoggedIn()) {
    const who = el(
      "span",
      "max-w-[7.5rem] truncate text-xs text-stone-600 sm:max-w-[12rem] sm:text-sm",
      state.student.name + " · " + state.student.group
    );
    const out = el(
      "button",
      "shrink-0 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 hover:border-emerald-800 hover:text-emerald-900",
      "Вийти"
    );
    out.type = "button";
    out.setAttribute("aria-label", "Вийти");
    out.addEventListener("click", () => {
      state.student = null;
      save();
      location.hash = "#/login";
      render();
    });
    bar.append(who, out);
  }
  header.append(bar);
  app.append(header);

  const main = el("main", "mx-auto " + width + " px-4 py-6 sm:px-6 sm:py-8");
  if (crumbs) main.append(crumbs);
  if (title) main.append(el("h1", "mb-5 font-serif text-2xl font-semibold tracking-tight sm:mb-6 sm:text-4xl", title));
  main.append(body);
  app.append(main);
}

function backHome() {
  const node = link("#/", "mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-900", "");
  node.append(icon("back"), document.createTextNode("Предмети"));
  return node;
}

function courseById(id) {
  return COURSES.find((course) => course.id === id);
}

function quizScore(course, lesson) {
  const saved = state.progress[quizKey(course, lesson)] || state.quiz[quizKey(course, lesson)];
  if (!saved || !saved.passed) return null;
  return saved.score + " / " + saved.total;
}

function loginPage() {
  const body = el("div", "page-login space-y-5 sm:space-y-6");
  body.append(el("h1", "font-serif text-3xl font-semibold tracking-tight sm:text-4xl", "Вхід студента"));
  body.append(
    el(
      "p",
      "text-sm leading-6 text-stone-600 sm:text-[0.95rem]",
      "Вкажи групу, ім’я і email. Далі теми відкриваються по черзі: щоб іти далі, треба здати тест на " +
        PASS +
        " з 10."
    )
  );

  const form = el("form", "soft-card space-y-4 p-5 sm:p-6");
  form.setAttribute("novalidate", "true");

  const groupLabel = el("label", "block");
  groupLabel.append(el("span", "mb-2 block text-sm font-semibold text-stone-700", "Група"));
  const group = document.createElement("select");
  group.className = "field-control field-select";
  group.setAttribute("aria-label", "Група");
  group.required = true;
  const emptyOpt = document.createElement("option");
  emptyOpt.value = "";
  emptyOpt.textContent = "Обери групу";
  group.append(emptyOpt);
  (typeof GROUPS !== "undefined" ? GROUPS : ["11-П", "30-ФІЗ"]).forEach((g) => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    group.append(opt);
  });
  groupLabel.append(group);

  function field(labelText, type, placeholder) {
    const wrap = el("label", "block");
    wrap.append(el("span", "mb-2 block text-sm font-semibold text-stone-700", labelText));
    const input = document.createElement("input");
    input.type = type;
    input.required = true;
    input.placeholder = placeholder;
    input.setAttribute("aria-label", labelText);
    input.autocomplete = type === "email" ? "email" : "name";
    input.className = "field-control";
    wrap.append(input);
    return { wrap, input };
  }

  const nameField = field("Ім’я", "text", "Наприклад, Олена Коваль");
  const emailField = field("Email", "email", "name@gmail.com");
  const err = el("p", "min-h-[1.25rem] text-sm font-semibold text-rose-700", "");
  const submit = el(
    "button",
    "inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-900 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800",
    ""
  );
  submit.type = "submit";
  submit.append(icon("user", "icon-on-dark"), document.createTextNode("Увійти в кабінет"));

  form.append(groupLabel, nameField.wrap, emailField.wrap, err, submit);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const g = group.value.trim();
    const n = nameField.input.value.trim().slice(0, 80);
    const mail = emailField.input.value.trim().slice(0, 120);
    if (!g || !n || !mail || mail.indexOf("@") < 1) {
      err.textContent = "Заповни групу, ім’я і правильний email.";
      return;
    }
    state.student = { group: g, name: n, email: mail };
    save();
    location.hash = "#/";
    render();
  });

  body.append(form);
  shell("", null, body);
}

function home() {
  const body = el("div", "space-y-8");

  const hero = el("section", "teacher-hero");
  const photo = document.createElement("img");
  photo.src = "img/roman.png";
  photo.alt = "Роман Гудима";
  photo.className = "teacher-photo";
  photo.width = 176;
  photo.height = 176;
  const about = el("div", "min-w-0 text-center md:text-left");
  about.append(el("p", "text-xs font-semibold uppercase tracking-[0.16em] text-emerald-900", "Викладач"));
  about.append(el("h1", "mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl", "Роман Гудима"));
  about.append(
    el(
      "p",
      "mt-3 max-w-xl text-base leading-7 text-stone-700",
      "Крутий викладач РЕГІК: пояснює просто, тримає темп пари і допомагає студентам реально розібратися в матеріалі — від книжки до тесту."
    )
  );
  about.append(
    el(
      "p",
      "mt-2 text-sm font-semibold text-emerald-900",
      "Ти зайшов як " + state.student.name + " · " + state.student.group
    )
  );
  hero.append(photo, about);
  body.append(hero);

  const intro = el("div", "space-y-2");
  intro.append(el("h2", "font-serif text-3xl font-semibold tracking-tight sm:text-4xl", "Предмети"));
  intro.append(
    el(
      "p",
      "max-w-2xl text-base leading-7 text-stone-700",
      "Теми відкриваються по черзі. Щоб іти далі — здай тест на " + PASS + " з 10 або більше."
    )
  );
  body.append(intro);

  const grid = el("div", "grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3");
  const blurb = {
    zahyst: "Теми з посібника. Читаєш розділ — здаєш тест.",
    lfk: "Теми з книжки ЛФК. Спершу сторінки, потім перевірка.",
    anatomia: "Теми з підручника. Читаєш — відповідаєш на тест.",
  };
  const list = coursesForGroup();
  list.forEach((course, index) => {
    grid.append(
      card(
        "#/" + course.id,
        course.title,
        blurb[course.id] || "Спершу читаєш, потім тест.",
        course.lessons.length + " тем",
        String(index + 1).padStart(2, "0")
      )
    );
  });
  body.append(grid);
  body.append(
    el(
      "p",
      "max-w-2xl text-sm leading-6 text-stone-500",
      "Відвідування на цей сайт не винесене. Список «був» і «н» лишається в таблиці викладача."
    )
  );
  shell("", null, body);
}

function card(href, title, text, meta, num) {
  const node = link(
    href,
    "subject-card flex h-full flex-col rounded-2xl border border-stone-300 bg-white p-5 pl-6 sm:p-6 sm:pl-7 hover:border-emerald-800",
    ""
  );
  const head = el("div", "flex items-start justify-between gap-3");
  const metaRow = el("span", "inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900", "");
  metaRow.append(icon("book"), document.createTextNode(meta || ""));
  head.append(metaRow);
  head.append(el("span", "font-serif text-2xl font-semibold text-stone-300 sm:text-3xl", num || ""));
  node.append(head);
  node.append(el("span", "mt-3 font-serif text-xl font-semibold leading-tight sm:text-2xl", title));
  node.append(el("span", "mt-3 flex-1 text-sm leading-6 text-stone-600", text));
  const open = el("span", "mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-900 sm:mt-6", "");
  open.append(document.createTextNode("Відкрити"), icon("arrow"));
  node.append(open);
  return node;
}

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js";
}

function bookFrame(src, title, fromPage, toPage) {
  const wrap = el("div", "book-frame overflow-hidden rounded-2xl border border-stone-300 bg-white");
  const bar = el("div", "flex flex-wrap items-center justify-between gap-3 border-b border-stone-300 px-4 py-3");
  const status = el("p", "text-sm text-stone-600", "Відкриваю книжку…");
  status.setAttribute("aria-live", "polite");
  bar.append(status, external(src, "text-sm font-semibold text-emerald-900", "Відкрити файл"));
  const scroller = el("div", "book-scroll");
  scroller.tabIndex = 0;
  scroller.setAttribute("aria-label", title);
  wrap.append(bar, scroller);
  setTimeout(() => mountBook(scroller, src, status, fromPage || 1, toPage), 30);
  return wrap;
}

function topicBook(course, lesson) {
  const wrap = el("div", "space-y-2");

  function makeCompact() {
    const openBtn = el("button", "book-thumb-card", "");
    openBtn.type = "button";
    openBtn.setAttribute("aria-label", "Відкрити сторінки для читання");

    const screen = el("div", "book-screen", "");
    const glow = el("div", "book-screen-glow");
    screen.append(el("div", "flex h-full items-center justify-center text-xs text-stone-300", "…"));
    openBtn.append(screen);

    const info = el("div", "min-w-0 flex-1");
    const label = el("div", "flex items-center gap-2 text-emerald-900");
    label.append(icon("book"), el("span", "text-xs font-semibold uppercase tracking-[0.14em]", "Книжка теми"));
    info.append(label);
    info.append(el("p", "mt-1 font-serif text-lg font-semibold sm:text-xl", "Сторінки " + lesson.from + "–" + lesson.to));
    info.append(el("p", "mt-1 text-sm leading-6 text-stone-600", "Маленький екран сторінки. Натисни — збільшиться для читання."));
    const tip = el("span", "mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-900", "");
    tip.append(icon("expand"), document.createTextNode("Збільшити"));
    info.append(tip);
    openBtn.append(info);

    openBtn.addEventListener("click", showOpen);
    wrap.replaceChildren(openBtn);
    paintThumb(screen, course.book, lesson.from).then(() => screen.append(glow));
  }

  function showOpen() {
    const box = el("div", "space-y-3");
    const top = el("div", "flex flex-wrap items-center justify-between gap-2");
    const reading = el("p", "inline-flex items-center gap-2 text-sm font-semibold text-stone-700", "");
    reading.append(icon("book"), document.createTextNode("Читаєш сторінки " + lesson.from + "–" + lesson.to));
    const close = el("button", "inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-3 py-1.5 text-sm font-semibold text-stone-700", "");
    close.type = "button";
    close.setAttribute("aria-label", "Згорнути книжку");
    close.append(icon("shrink"), document.createTextNode("Згорнути"));
    close.addEventListener("click", makeCompact);
    top.append(reading, close);
    box.append(top, bookFrame(course.book, lesson.title, lesson.from, lesson.to));
    wrap.replaceChildren(box);
  }

  makeCompact();
  return wrap;
}

async function mountBook(scroller, src, status, fromPage, toPage) {
  if (scroller.dataset.ready) return;
  const width = scroller.clientWidth - 32;
  if (width < 200) {
    setTimeout(() => {
      delete scroller.dataset.ready;
      mountBook(scroller, src, status, fromPage, toPage);
    }, 50);
    return;
  }
  scroller.dataset.ready = "1";
  if (location.protocol === "file:") {
    status.textContent = "Двічі клацни файл «Відкрити кабінет» у папці сайту. Тоді книжка відкриється тут.";
    return;
  }
  if (!window.pdfjsLib) {
    status.textContent = "Переглядач книжки не завантажився. Онови сторінку.";
    return;
  }
  let pdf;
  try {
    pdf = await getPdf(src);
  } catch (error) {
    status.textContent = "Книжка не відкрилась. Відкрий кабінет файлом «Відкрити кабінет».";
    return;
  }
  const total = pdf.numPages;
  const first = Math.min(Math.max(fromPage || 1, 1), total);
  const last = Math.min(Math.max(toPage || total, first), total);
  const sample = await pdf.getPage(first);
  const base = sample.getViewport({ scale: 1 });
  const scale = width / base.width;
  const pageHeight = Math.round(base.height * scale);
  status.textContent = "Сторінка " + first + " · тема " + first + "–" + last;

  for (let number = first; number <= last; number += 1) {
    const holder = el("div", "book-page");
    holder.dataset.page = String(number);
    holder.style.width = Math.round(width) + "px";
    holder.style.height = pageHeight + "px";
    holder.setAttribute("aria-label", "Сторінка " + number);
    scroller.append(holder);
  }

  async function draw(holder) {
    if (holder.dataset.drawn === "1" || holder.dataset.busy === "1") return;
    holder.dataset.busy = "1";
    try {
      const page = await pdf.getPage(Number(holder.dataset.page));
      const viewport = page.getViewport({ scale: scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      holder.replaceChildren(canvas);
      const context = canvas.getContext("2d");
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      holder.dataset.drawn = "1";
    } catch (error) {
      holder.dataset.drawn = "0";
      holder.textContent = "Сторінка не відкрилась";
    }
    holder.dataset.busy = "0";
  }

  function showVisible() {
    const box = scroller.getBoundingClientRect();
    let current = first;
    scroller.querySelectorAll(".book-page").forEach((holder) => {
      const pageBox = holder.getBoundingClientRect();
      if (pageBox.bottom >= box.top - 500 && pageBox.top <= box.bottom + 500) draw(holder);
      else if (holder.dataset.drawn === "1") {
        holder.replaceChildren();
        holder.dataset.drawn = "0";
      }
      if (pageBox.top <= box.top + 48) current = Number(holder.dataset.page);
    });
    status.textContent = "Сторінка " + current + " · тема " + first + "–" + last;
  }

  scroller.scrollTop = 0;
  showVisible();
  scroller.addEventListener("scroll", showVisible);
}

function lessonCard(course, lesson, index) {
  const open = isLessonOpen(course, index);
  const passed = isPassed(course, lesson);
  const node = open
    ? link("#/" + course.id + "/u/" + lesson.id, "topic-row block rounded-2xl border border-stone-300 bg-white p-4 sm:p-5", "")
    : el("div", "block rounded-2xl border border-stone-200 bg-stone-50 p-4 opacity-80 sm:p-5", "");

  const top = el("div", "flex flex-wrap items-center justify-between gap-2");
  const badge = el("p", "inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900", "");
  badge.append(icon(open ? "list" : "lock"), document.createTextNode("Тема " + (index + 1)));
  top.append(badge);
  const score = quizScore(course, lesson);
  if (score) {
    const scoreNode = el("p", "inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900", "");
    scoreNode.append(icon("check"), document.createTextNode(score));
    top.append(scoreNode);
  }
  node.append(top);
  node.append(el("h2", "mt-2 font-serif text-xl font-semibold sm:text-2xl", lesson.title));
  const pages = el("p", "mt-2 inline-flex items-center gap-1.5 text-sm text-stone-600", "");
  pages.append(icon("book"), document.createTextNode("Сторінки " + lesson.from + "–" + lesson.to));
  node.append(pages);
  const go = el("p", "mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-900", "");
  if (!open) go.append(icon("lock"), document.createTextNode("Спочатку здай попередню тему"));
  else if (passed) go.append(document.createTextNode("Пройдено · відкрити знову"), icon("arrow"));
  else go.append(document.createTextNode("Читати і здати тест"), icon("arrow"));
  node.append(go);
  return node;
}

function coursePage(course) {
  const body = el("div", "max-w-3xl space-y-4");
  body.append(
    el(
      "p",
      "text-base leading-7 text-stone-700",
      "Теми йдуть по черзі. Наступна відкриється після тесту на " + PASS + " з 10 або більше."
    )
  );
  course.lessons.forEach((lesson, index) => body.append(lessonCard(course, lesson, index)));
  shell(course.title, backHome(), body);
}

function congratsBlock(course, lesson, index) {
  const wrap = el("section", "soft-card border-emerald-900/20 bg-emerald-50/70 p-6");
  wrap.append(rowTitle("check", "Тему пройдено"));
  wrap.append(
    el(
      "p",
      "mt-3 text-base leading-7 text-stone-800",
      "Ви пройшли тему. Молодець, так тримати! Можете переходити далі по темах."
    )
  );
  const score = state.progress[quizKey(course, lesson)];
  if (score) {
    wrap.append(el("p", "mt-2 text-sm font-semibold text-emerald-900", "Результат: " + score.score + " з " + score.total + "."));
  }
  const key = quizKey(course, lesson);
  const next = course.lessons[index + 1];
  const actions = el("div", "btn-row mt-5");
  if (next) {
    const go = link(
      "#/" + course.id + "/u/" + next.id,
      "inline-flex items-center gap-1.5 rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white",
      ""
    );
    go.append(document.createTextNode("Наступна тема"), icon("arrow", "icon-on-dark"));
    actions.append(go);
  }
  const retakeBtn = el(
    "button",
    "inline-flex items-center gap-1.5 rounded-full border border-emerald-900/30 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50",
    ""
  );
  retakeBtn.type = "button";
  retakeBtn.setAttribute("aria-label", "Повторити тему");
  retakeBtn.append(icon("pen"), document.createTextNode("Повторити тему"));
  retakeBtn.addEventListener("click", () => {
    state.retake[key] = true;
    save();
    render();
  });
  actions.append(retakeBtn);
  const back = link(
    "#/" + course.id,
    "inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:border-stone-400",
    ""
  );
  back.append(document.createTextNode("До списку тем"));
  actions.append(back);
  wrap.append(actions);
  return wrap;
}

function quizBlock(course, lesson, index) {
  const key = quizKey(course, lesson);
  const retaking = isRetaking(course, lesson);
  if (isPassed(course, lesson) && !retaking) return congratsBlock(course, lesson, index);

  const wrap = el("section", "soft-card p-5");
  wrap.append(rowTitle("check", retaking ? "Повторний тест" : "Тест"));
  if (retaking) {
    wrap.append(
      el(
        "p",
        "mt-2 text-sm leading-6 text-amber-800",
        "Повтор теми. Якщо набереш менше " +
          PASS +
          " — попередній результат лишається, наступні теми не закриються. Якщо здаси — оновимо бал."
      )
    );
    const cancel = el(
      "button",
      "mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900",
      "Скасувати повтор"
    );
    cancel.type = "button";
    cancel.setAttribute("aria-label", "Скасувати повтор");
    cancel.addEventListener("click", () => {
      delete state.retake[key];
      save();
      render();
    });
    wrap.append(cancel);
  } else {
    wrap.append(
      el(
        "p",
        "mt-2 text-sm leading-6 text-stone-600",
        "10 питань з варіантами (обовʼязково) і одне письмове (за бажанням). Щоб відкрити наступну тему, треба мінімум " +
          PASS +
          " з 10. Якщо менше — тест анулюється, і здаєш знову."
      )
    );
  }

  const questions = lesson.quiz || [];
  if (!questions.length) {
    wrap.append(el("p", "mt-4 text-sm text-stone-500", "Тест до цієї теми ще додамо."));
    return wrap;
  }

  const answers = {};
  let writeText = "";
  const form = el("div", "mt-4 space-y-6");
  const result = el("p", "mt-4 text-sm font-semibold text-emerald-900", "");
  result.setAttribute("role", "status");
  result.setAttribute("aria-live", "polite");
  const fieldBoxes = [];

  questions.forEach((item, qi) => {
    const box = el("fieldset", "rounded-xl border border-stone-200 p-4");
    box.append(el("legend", "text-sm font-semibold text-stone-800", qi + 1 + ". " + item.q));
    const list = el("div", "mt-3 space-y-2");
    item.options.forEach((option, oi) => {
      const label = el("label", "flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-stone-50");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "q" + qi;
      input.value = String(oi);
      input.className = "mt-1";
      input.setAttribute("aria-label", option);
      input.addEventListener("change", () => {
        answers[qi] = oi;
        box.classList.remove("border-rose-400", "bg-rose-50/40");
        if (result.dataset.kind === "incomplete") {
          result.textContent = "";
          result.dataset.kind = "";
        }
      });
      label.append(input, el("span", "text-sm leading-6 text-stone-700", option));
      list.append(label);
    });
    box.append(list);
    form.append(box);
    fieldBoxes.push(box);
  });

  const writeBox = el("div", "rounded-xl border border-stone-200 p-4");
  const writeTitle = el("p", "inline-flex items-center gap-2 text-sm font-semibold leading-5 text-stone-800", "");
  writeTitle.append(
    icon("pen"),
    document.createTextNode(
      questions.length +
        1 +
        ". (необовʼязково) " +
        (lesson.write || "Напиши коротко головне з теми своїми словами.")
    )
  );
  writeBox.append(writeTitle);
  writeBox.append(
    el("p", "mt-1 text-xs leading-5 text-stone-500", "Можна здати тест без тексту — це не блокує оцінку.")
  );
  const writeInput = document.createElement("textarea");
  writeInput.rows = 6;
  writeInput.value = writeText;
  writeInput.placeholder = "Пиши тут за бажанням…";
  writeInput.setAttribute("aria-label", "Письмова відповідь (необовʼязково)");
  writeInput.className = "field-control mt-3";
  writeInput.addEventListener("input", () => {
    writeText = writeInput.value;
  });
  writeBox.append(writeInput);
  form.append(writeBox);

  const check = el(
    "button",
    "mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800",
    ""
  );
  check.append(icon("check", "icon-on-dark"), document.createTextNode("Здати тест"));
  check.type = "button";
  check.setAttribute("aria-label", "Здати тест");
  check.addEventListener("click", async () => {
    let score = 0;
    const picked = [];
    const missing = [];
    questions.forEach((item, qi) => {
      const value = answers[qi];
      picked[qi] = value;
      if (value == null) missing.push(qi + 1);
      else if (value === item.a) score += 1;
      fieldBoxes[qi].classList.toggle("border-rose-400", value == null);
      fieldBoxes[qi].classList.toggle("bg-rose-50/40", value == null);
    });

    if (missing.length) {
      result.dataset.kind = "incomplete";
      const list =
        missing.length === 1
          ? "питання " + missing[0]
          : "питання " + missing.join(", ");
      setQuizMessage(
        result,
        "Не вибрано відповіді на " +
          list +
          ". Відміть варіант у кожному питанні (червоним підсвічено порожні) і натисни «Здати тест» знову.",
        "err"
      );
      fieldBoxes[missing[0] - 1].scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    fieldBoxes.forEach((field, qi) => {
      field.classList.remove("border-rose-400", "bg-rose-50/40");
      field.querySelectorAll("label").forEach((label, oi) => {
        label.classList.remove("bg-emerald-50", "bg-rose-50");
        if (oi === questions[qi].a) label.classList.add("bg-emerald-50");
        else if (picked[qi] === oi) label.classList.add("bg-rose-50");
      });
    });

    if (score < PASS) {
      check.disabled = true;
      check.setAttribute("aria-disabled", "true");
      check.classList.add("opacity-50", "cursor-not-allowed");
      if (retaking) {
        delete state.retake[key];
        save();
        setQuizMessage(
          result,
          "Правильно " +
            score +
            " з " +
            questions.length +
            ". Повтор не зараховано (треба мінімум " +
            PASS +
            "). Попередній результат лишається, наступні теми відкриті.",
          "warn"
        );
        setTimeout(() => {
          render();
          location.hash = "#/" + course.id + "/u/" + lesson.id;
        }, 2400);
        return;
      }
      delete state.quiz[key];
      delete state.progress[key];
      save();
      setQuizMessage(
        result,
        "Правильно " +
          score +
          " з " +
          questions.length +
          ". Треба мінімум " +
          PASS +
          ". Тест анульовано — здай знову з початку.",
        "err"
      );
      setTimeout(() => {
        render();
        location.hash = "#/" + course.id + "/u/" + lesson.id;
      }, 2200);
      return;
    }

    const writeValue = writeText.trim();
    const statusLabel = retaking ? "перездано" : "здано";
    delete state.retake[key];
    state.quiz[key] = {
      done: true,
      passed: true,
      score: score,
      total: questions.length,
      answers: picked,
      write: writeValue,
    };
    state.progress[key] = {
      passed: true,
      score: score,
      total: questions.length,
      write: writeValue,
      at: new Date().toISOString(),
    };
    save();

    setQuizMessage(
      result,
      "Правильно " + score + " з " + questions.length + ". Зберігаю результат і надсилаю викладачу…",
      "ok"
    );
    check.disabled = true;
    check.setAttribute("aria-disabled", "true");
    check.classList.add("opacity-50", "cursor-not-allowed");

    const sent = await sendToSheet({
      group: state.student.group,
      name: state.student.name,
      email: state.student.email,
      course: course.title,
      topicNum: index + 1,
      topicTitle: lesson.title,
      score: score,
      total: questions.length,
      write: writeValue,
      status: statusLabel,
    });

    if (sent.skipped) {
      state.progress[key].sheetNote = "локально (таблицю не налаштовано)";
      save();
      setQuizMessage(
        result,
        "Тест зараховано (" +
          score +
          " з " +
          questions.length +
          "), але в Google Таблицю не надіслано: " +
          (sent.reason || "немає адреси") +
          ". Скажи викладачу.",
        "warn"
      );
      setTimeout(() => render(), 1800);
      return;
    }
    if (!sent.ok) {
      state.progress[key].sheetNote = "помилка надсилання";
      save();
      setQuizMessage(
        result,
        "Тест зараховано у тебе на пристрої (" +
          score +
          " з " +
          questions.length +
          "), але надсилання викладачу не вдалось (" +
          (sent.reason || "невідома причина") +
          "). Перевір інтернет і скажи викладачу.",
        "warn"
      );
      setTimeout(() => render(), 2200);
      return;
    }

    render();
  });

  wrap.append(form, check, result);
  return wrap;
}

function lessonPage(course, lessonId) {
  const lesson = course.lessons.find((item) => item.id === lessonId);
  const back = link("#/" + course.id, "mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-900", "");
  back.append(icon("back"), document.createTextNode(course.title));
  if (!lesson) {
    shell(course.title, back, el("p", "text-stone-600", "Такої теми немає."));
    return;
  }
  const index = course.lessons.findIndex((item) => item.id === lessonId);
  if (!isLessonOpen(course, index)) {
    const locked = el("section", "soft-card p-5");
    locked.append(rowTitle("lock", "Тема ще закрита"));
    locked.append(
      el(
        "p",
        "mt-3 text-sm leading-6 text-stone-700",
        "Спочатку здай попередню тему (мінімум " + PASS + " з 10). Тоді ця відкриється."
      )
    );
    locked.append(link("#/" + course.id, "mt-4 inline-flex text-sm font-semibold text-emerald-900", "← До списку тем"));
    shell(lesson.title, back, locked);
    return;
  }

  const body = el("div", "space-y-4");
  const top = el("div", "max-w-3xl space-y-4");

  if (isPassed(course, lesson) && !isRetaking(course, lesson)) {
    top.append(congratsBlock(course, lesson, index));
    body.append(top);
    shell(lesson.title, back, body, true);
    return;
  }

  const task = el("section", "soft-card border-emerald-900/15 bg-emerald-50/60 p-5");
  task.append(rowTitle("list", isRetaking(course, lesson) ? "Повтор теми" : "Завдання"));
  const list = el("ol", "mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-stone-800");
  list.append(el("li", "", "Прочитай сторінки " + lesson.from + "–" + lesson.to + " у книжці (натисни на маленький екран нижче)."));
  list.append(
    el(
      "li",
      "",
      isRetaking(course, lesson)
        ? "Здай тест знову на " + PASS + " з 10 або більше. Письмове — за бажанням."
        : "Здай тест на " + PASS + " з 10 або більше. Письмове питання — за бажанням."
    )
  );
  task.append(list);
  task.append(el("p", "mt-3 text-sm text-stone-600", "Тема " + (index + 1) + " з " + course.lessons.length + "."));

  top.append(task);
  body.append(top);
  const bookWrap = el("div", "max-w-3xl");
  bookWrap.append(topicBook(course, lesson));
  body.append(bookWrap);
  const bottom = el("div", "max-w-3xl");
  bottom.append(quizBlock(course, lesson, index));
  body.append(bottom);
  shell(lesson.title, back, body, true);
}

function marksPage() {
  const body = el("div", "max-w-3xl space-y-6");
  body.append(el("p", "text-sm leading-6 text-stone-600", "Пройдені теми цього студента на цьому пристрої."));

  const rows = [];
  COURSES.forEach((course) => {
    course.lessons.forEach((lesson, index) => {
      const saved = state.progress[quizKey(course, lesson)];
      if (saved && saved.passed) {
        rows.push({
          course: course.title,
          title: "Тема " + (index + 1) + ". " + lesson.title,
          score: saved.score + " / " + saved.total,
          write: saved.write || "",
        });
      }
    });
  });

  if (!rows.length) {
    body.append(el("p", "text-sm text-stone-500", "Ще немає зданих тем."));
  } else {
    const list = el("div", "space-y-3");
    rows.forEach((row) => {
      const cardNode = el("article", "soft-card p-4");
      cardNode.append(el("p", "text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900", row.course));
      cardNode.append(el("h3", "mt-1 text-sm font-semibold", row.title));
      cardNode.append(el("p", "mt-2 text-sm text-stone-700", "Тест: " + row.score));
      if (row.write) cardNode.append(el("p", "mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-600", row.write));
      list.append(cardNode);
    });
    body.append(list);
  }

  shell("Позначки", backHome(), body);
}

function render() {
  const current = route();
  if (!isLoggedIn() || current.page === "login") {
    loginPage();
    return;
  }
  const allowed = coursesForGroup();
  const course = courseById(current.page);
  if (!course) home();
  else if (!allowed.some((item) => item.id === course.id)) home();
  else if (current.id === "u") lessonPage(course, current.extra);
  else coursePage(course);
}

window.addEventListener("hashchange", render);
render();
