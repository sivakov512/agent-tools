/* Project Tracker: the core both pages share — dashboard.html (the user's, live from Notion) and client.html (a client's, from a data
   snapshot). Helpers, dates, the plan model with the lateness rule, the timeline and the pieces of a project page. It loads before
   either page's own script and puts everything on window.PT. */
(function () {
  "use strict";
  var DAY = 86400000;
  var OPEN_MS = { "Planned": 1, "In progress": 1 };
  var OPEN_TASK = { "Planned": 1, "In progress": 1, "Waiting": 1 };
  var SPANS = { "1": 31, "3": 91, "6": 182, "12": 365 }; // timeline zoom: days in view

  // ---------- helpers ----------
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function link(href, text, cls) { var a = el("a", cls || "", text); if (href && /^https?:\/\//i.test(href)) { a.href = href; a.target = "_blank"; a.rel = "noopener"; } return a; } // values from data: web links only
  function btn(cls, text, onClick) { var b = el("button", cls, text); b.type = "button"; if (onClick) b.addEventListener("click", onClick); return b; }
  function span(text, cls) { return el("span", cls || "", text); }
  function nodash(id) { return String(id || "").replace(/-/g, ""); }
  function cleanUrl(u) { return String(u || "").replace(/^\{\{|\}\}$/g, "").split("?")[0]; }
  function unesc(s) { return String(s).replace(/\\([$~*_`#\[\]()>|-])/g, "$1"); }
  function clean(s) { // Notion markdown → plain text, for one-line labels
    return unesc(String(s == null ? "" : s)
      .replace(/<mention-[a-z]+[^>]*>([^<]*)<\/mention-[a-z]+>/g, "$1")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\*\*|__|`/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\{color="[^"]*"\}/g, ""))
      .trim();
  }
  function rel(v) { if (Array.isArray(v)) return v.map(cleanUrl); try { var a = JSON.parse(v || "[]"); return Array.isArray(a) ? a.map(cleanUrl) : []; } catch (e) { return []; } }
  function key(u) { var m = /([0-9a-f]{32})/i.exec(nodash(u)); return m ? m[1].toLowerCase() : String(u); }
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : null; }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }
  function smooth() { return matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"; }
  function sel(v) { return window.CSS && CSS.escape ? CSS.escape(v) : String(v).replace(/["\\]/g, "\\$&"); } // values from data inside a selector
  function keep(host, fn) { var y = host.scrollTop; fn(); host.scrollTop = y; } // updates never jump a list back to the top

  // ---------- dates: whole days in the viewer's local calendar ----------
  function dnum(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || "")); return m ? Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY) : null; }
  function todayNum() { var d = new Date(); return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY); }
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function yr(n) { return new Date(n * DAY).getUTCFullYear(); }
  function fmt(n, withYear) { if (n == null) return "—"; var d = new Date(n * DAY), s = MON[d.getUTCMonth()] + " " + d.getUTCDate(); return (withYear || yr(n) !== yr(todayNum())) ? s + ", " + yr(n) : s; }
  function soon(n) { var t = todayNum(); if (n === t) return "today"; if (n === t + 1) return "tomorrow"; if (n > t && n - t < 7) return WD[new Date(n * DAY).getUTCDay()] + " " + fmt(n); return fmt(n); }
  function range(a, b) {
    if (a == null) return "no dates"; if (b == null || a === b) return fmt(a);
    var da = new Date(a * DAY), db = new Date(b * DAY);
    if (da.getUTCMonth() === db.getUTCMonth() && da.getUTCFullYear() === db.getUTCFullYear()) return MON[da.getUTCMonth()] + " " + da.getUTCDate() + "–" + db.getUTCDate() + (yr(b) !== yr(todayNum()) ? ", " + yr(b) : "");
    return fmt(a) + " – " + fmt(b);
  }
  function days(n) { return n + " d"; }
  function hhmm(ms) { var d = new Date(ms); return (d.getHours() < 10 ? "0" : "") + d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes(); }

  // ---------- the plan: rows as the Notion views return them → milestones and tasks; the lateness rule, same as the Notion formulas ----------
  // Every date in the tracker is agreed with the client, on milestones and tasks alike, so both count.
  function lateOf(it, pausedUp) {
    var t = todayNum();
    if (it.status === "Dropped" || it.end == null) return null;
    if (it.status === "Done") return it.finished == null ? null : it.finished - it.end;
    if (pausedUp) return null;
    return t > it.end ? t - it.end : 0;
  }
  function stateOfItem(it, pausedUp) {
    if (it.status === "Done") return it.late > 0 ? "doneLate" : "done";
    if (pausedUp) return "paused";
    if (it.late > 0) return "late";
    if (it.status === "Waiting") return "wait"; // waiting or under way shows so, dated or not
    if (it.status === "In progress") return "prog";
    return it.start == null ? "nodate" : "plan";
  }
  function msOf(row, project) {
    var start = dnum(row["date:Dates:start"]), end = dnum(row["date:Dates:end"]);
    if (end == null) end = start;
    var m = { kind: "ms", url: cleanUrl(row.url), name: clean(row.Name) || "Untitled", status: row.Status || "", start: start, end: end, finished: dnum(row["date:Finished:start"]), project: project, tasks: [], chat: row.Chat || "", order: num(row.Order) };
    var paused = m.status === "Paused" || project.status === "Paused";
    m.late = lateOf(m, paused); m.state = stateOfItem(m, paused); m.paused = paused && m.status !== "Done";
    return m;
  }
  function taskOf(row, project, msByKey) {
    var start = dnum(row["date:Dates:start"]), end = dnum(row["date:Dates:end"]);
    if (end == null) end = start;
    var mk = rel(row.Milestone).map(key)[0] || null, ms = mk ? msByKey[mk] : null;
    var k = { kind: "task", url: cleanUrl(row.url), name: clean(row.Name) || "Untitled", status: row.Status || "", waiting: clean(row["Waiting on"]), start: start, end: end, finished: dnum(row["date:Finished:start"]), project: project, mk: ms ? mk : null, ms: ms || null, chat: row.Chat || "", order: num(row.Order) };
    var paused = project.status === "Paused" || (ms && ms.status === "Paused");
    k.late = lateOf(k, paused); k.state = stateOfItem(k, paused); k.paused = paused && k.status !== "Done";
    return k;
  }
  function problemOf(r) {
    return { kind: "problem", url: cleanUrl(r.url), name: clean(r.Name) || "Untitled", type: r.Type || "", status: r.Status || "", waiting: clean(r["Waiting on"]), note: clean(r.Note), noteRaw: r.Note || "", opened: dnum(r["date:Opened:start"]), resolvedOn: dnum(r["date:Resolved on:start"]), pk: rel(r.Project).map(key)[0], mk: rel(r.Milestone).map(key)[0], tk: rel(r.Task).map(key)[0], chat: r.Chat || "" };
  }
  function buildPlan(p, msRows, taskRows) { // a project's Schedule and Tasks rows → its milestones, each with its tasks, and all its tasks
    var msList = msRows.map(function (row) { return msOf(row, p); }).filter(function (m) { return m.status !== "Dropped"; });
    var byKey = {}; msList.forEach(function (m) { byKey[key(m.url)] = m; });
    var tasks = taskRows.map(function (row) { return taskOf(row, p, byKey); }).filter(function (k) { return k.status !== "Dropped"; });
    tasks.forEach(function (k) { if (k.ms) k.ms.tasks.push(k); });
    msList.forEach(function (m) { m.tasks = sortItems(m.tasks); });
    return { ms: sortItems(msList), tasks: tasks };
  }
  function isOpen(x) { return x.kind === "ms" ? !!OPEN_MS[x.status] : !!OPEN_TASK[x.status]; }
  function ageOf(x) { var t = todayNum(); if (x.kind === "problem") return x.opened == null ? null : t - x.opened; return x.start != null && x.start <= t ? t - x.start : null; }
  function ageCls(a) { return a == null ? "" : a >= 14 ? "crit" : a >= 7 ? "warn" : ""; }
  function sortItems(list) { // the plan's own order (`Order`) when both have one — it holds even without dates — else by dates
    return list.slice().sort(function (a, b) {
      if (a.order != null && b.order != null && a.order !== b.order) return a.order - b.order;
      return (a.start == null ? 1e9 : a.start) - (b.start == null ? 1e9 : b.start) || (a.end || 0) - (b.end || 0) || (a.order == null ? 1e9 : a.order) - (b.order == null ? 1e9 : b.order);
    });
  }
  function worstLate(items) { return items.filter(function (x) { return isOpen(x) && x.late > 0; }).reduce(function (a, x) { return Math.max(a, x.late); }, 0); }
  function currentTask(list) { // the task that matters most right now among a milestone's (or a project's loose) tasks
    var open = sortItems(list.filter(function (k) { return isOpen(k); })), t = todayNum();
    return open.filter(function (k) { return k.late > 0; })[0] || open.filter(function (k) { return k.status === "In progress"; })[0]
      || open.filter(function (k) { return k.status === "Waiting"; })[0] || open.filter(function (k) { return k.start != null && k.start <= t; })[0] || open[0] || null;
  }
  function focusOf(msList, taskList) { // the milestone (or, without milestones, the task) that matters most right now, and what comes next
    var ms = sortItems(msList), t = todayNum(), loose = taskList.filter(function (k) { return !k.ms; });
    var base = ms.length ? ms : loose;
    var now = base.filter(function (m) { return m.status === "In progress" || m.status === "Paused" || m.status === "Waiting"; });
    var overdue = base.filter(function (m) { return m.status === "Planned" && m.late > 0; });
    var next = base.filter(function (m) { return m.status === "Planned" && !(m.late > 0) && (m.start == null || m.start >= t || !now.length); })[0];
    var head = overdue[0] || now.filter(function (m) { return m.late > 0; })[0] || now.filter(function (m) { return !m.paused; })[0] || now[0] || next;
    return { now: now, overdue: overdue, next: next, head: head, task: head && head.kind === "ms" ? currentTask(head.tasks) : null, byTasks: !ms.length };
  }
  function whenOf(m) {
    var t = todayNum();
    if (m.status === "Done") return [m.finished != null ? "done " + fmt(m.finished) + (m.late > 0 ? ", " + days(m.late) + " late" : m.late < 0 ? ", " + days(-m.late) + " early" : "") : "done", m.late > 0 ? "crit" : ""];
    if (m.paused) return [m.kind === "task" && m.ms && m.ms.status === "Paused" ? "its milestone is paused" : "paused", ""];
    if (m.start == null) return [m.kind === "task" ? (m.status === "Waiting" && m.waiting ? "waiting on " + m.waiting : "no dates") : "no dates yet", ""];
    if (m.late > 0) return [days(m.late) + " late · was due " + fmt(m.end), "crit"];
    var left = m.end - t, w = m.status === "Waiting" && m.waiting ? " · waiting on " + m.waiting : "";
    if (m.status === "In progress" || m.status === "Waiting" || m.start <= t) return ["due " + soon(m.end) + (left === 0 ? "" : " · " + days(left) + " left") + w, left <= 7 ? "warn" : ""];
    return ["starts " + soon(m.start) + " · due " + fmt(m.end), ""];
  }
  // a project's state, said the same way everywhere: d is its plan ({ms, tasks}), {err} when it failed to load, or nothing yet
  function projectState(p, d, blockers, problemsUnknown) {
    if (d && d.err) return { text: "Not loaded", cls: "crit", dot: "crit" };
    if (!d) return { text: "", cls: "", dot: "" };
    if (p.status === "Paused") return { text: "Paused", cls: "", dot: "paused" };
    var items = d.ms.concat(d.tasks), worst = worstLate(items), t = todayNum(), f = focusOf(d.ms, d.tasks);
    if (blockers) return { text: "Blocked", cls: "crit", dot: "crit" };
    if (worst) return { text: days(worst) + " late", cls: "crit", dot: "crit" };
    var near = items.filter(function (x) { return isOpen(x) && !x.paused && x.end != null; }).reduce(function (a, x) { return Math.min(a, x.end - t); }, 1e9); // as the due-soon list
    if (near <= 7) return { text: near === 0 ? "Due today" : "Due in " + days(near), cls: "warn", dot: "warn" };
    if (!f.head) return { text: items.length ? "All done" : "No plan yet", cls: "", dot: "good" };
    if (!items.some(function (x) { return isOpen(x) && x.end != null; })) return { text: "No dates", cls: "", dot: "ring" };
    if (problemsUnknown) return { text: "Problems unknown", cls: "", dot: "ring" }; // blockers may be there, unread
    return { text: "On track", cls: "good", dot: "cur" };
  }
  function planPhrase(m) {
    var t = todayNum();
    if (m.status === "Done") return [m.finished != null ? "done " + fmt(m.finished) + (m.late > 0 ? ", " + days(m.late) + " late" : m.late < 0 ? ", " + days(-m.late) + " early" : m.late === 0 ? ", on time" : "") : "done", m.late > 0 ? "crit" : "good"];
    if (m.paused) return ["paused", ""];
    if (m.status === "Waiting") { var w = m.waiting ? "waiting on " + m.waiting : "waiting"; if (m.late > 0) return [w + " · " + days(m.late) + " late", "crit"]; return [w, "warn"]; }
    if (m.start == null) return [m.kind === "task" ? (m.status === "In progress" ? "in progress" : "no dates") : "no dates yet", m.status === "In progress" ? "acc" : ""];
    if (m.late > 0) return [days(m.late) + " late", "crit"];
    if (m.status === "In progress" || m.start <= t) { var l = m.end - t; return [l === 0 ? "due today" : days(l) + " left", l <= 7 ? "warn" : "acc"]; }
    return ["starts in " + days(m.start - t), ""];
  }
  function itemDot(m) { return m.state === "done" || m.state === "doneLate" ? "good" : m.state === "late" ? "crit" : m.state === "prog" ? "cur" : m.state === "wait" ? "warn" : m.state === "paused" ? "paused" : m.state === "nodate" ? "ring" : ""; }
  function tipOf(x) { // the hover tip: state and dates (the name is on the bar already)
    var d = x.start == null ? (x.kind === "ms" ? "no dates yet" : "no dates") : range(x.start, x.end), ph = planPhrase(x)[0];
    if (x.status === "Done") return ph.charAt(0).toUpperCase() + ph.slice(1) + " · " + d;
    if (x.paused) return (x.kind === "task" && x.ms && x.ms.status === "Paused" ? "Paused with its milestone" : "Paused") + " · " + d;
    var st = x.status === "Waiting" ? (x.waiting ? "Waiting on " + x.waiting : "Waiting") : x.status || "Planned";
    return st + " · " + d + (x.late > 0 ? " · " + days(x.late) + " late" : x.start != null && !/^(waiting|no dates|in progress)/.test(ph) ? " · " + ph : "");
  }

  // ---------- the timeline ----------
  var CHEV = '<svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5"/></svg>';
  // sizes on the timeline, in px
  var TL = { pad: 8, head: 24, box: 34, seg: 6, gap: 8, lane: 21, flat: 30, row: 46, minBox: 8, narrowBox: 60, keepName: 64, chipMin: 64, ph: 30 }; // ph: days an undated milestone's placeholder card spans
  function pack(bars) { var lanes = []; bars.forEach(function (g) { var i = 0; while (lanes[i] != null && lanes[i] >= g.start) i++; lanes[i] = g.end; g.lane = i; }); return lanes.length; }
  function needsPlaceholder(m) { return OPEN_MS[m.status] || m.status === "Paused"; } // a Done or Dropped milestone without dates is not drawn
  function grow(e) { // under the cursor a bar or chip widens to show its whole name, above its neighbours
    var b = e.currentTarget, inner = b.classList.contains("tl-chip") ? b : b.querySelector(".tl-bn") || b;
    var need = inner.scrollWidth - inner.clientWidth;
    b.classList.add("hov");
    if (need <= 1 || b.dataset.w != null) return;
    b.dataset.w = b.style.width; b.dataset.l = b.style.left;
    var w = b.offsetWidth + need + 6, par = b.offsetParent, maxW = par ? par.scrollWidth : 0, left = b.offsetLeft;
    if (!b.classList.contains("tl-chip") && maxW && left + w > maxW) b.style.left = Math.max(0, maxW - w) + "px";
    b.style.width = w + "px";
  }
  function shrink(e) {
    var b = e.currentTarget; b.classList.remove("hov");
    if (b.dataset.w == null) return;
    b.style.width = b.dataset.w; b.style.left = b.dataset.l; delete b.dataset.w; delete b.dataset.l;
  }
  function hoverable(n, keys) { n.addEventListener("mouseenter", grow); n.addEventListener("mouseleave", shrink); if (keys) { n.addEventListener("focus", grow); n.addEventListener("blur", shrink); } return n; }
  function dragPan(host) { // a mouse drags the chart; touch and trackpads scroll natively
    var drag = null, moved = false;
    host.addEventListener("pointerdown", function (e) { moved = false; if (e.pointerType !== "mouse" || e.button !== 0 || e.target.closest(".tl-label")) return; drag = { x: e.clientX, l: host.scrollLeft }; });
    window.addEventListener("pointermove", function (e) { if (!drag) return; if (Math.abs(e.clientX - drag.x) > 4) { moved = true; host.classList.add("dragging"); } if (moved) host.scrollLeft = drag.l - (e.clientX - drag.x); });
    window.addEventListener("pointerup", function () { drag = null; host.classList.remove("dragging"); });
    host.addEventListener("click", function (e) { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  }
  function spanOf(m) { // where a milestone sits on the axis: its dates, else the span of its dated tasks, else nowhere
    if (m.start != null) return { start: m.start, end: m.end };
    var d = (m.tasks || []).filter(function (k) { return k.start != null; });
    if (!d.length) return null;
    return { start: Math.min.apply(null, d.map(function (k) { return k.start; })), end: Math.max.apply(null, d.map(function (k) { return k.end; })), nodate: true };
  }
  function kidsIn(m, sp) { return (m.tasks || []).filter(function (k) { return k.start != null && k.end >= sp.start && k.start <= sp.end; }); }
  function datedIn(m, sp) { return kidsIn(m, sp).map(function (k) { return { m: k, start: Math.max(k.start, sp.start), end: Math.min(k.end, sp.end) }; }); } // clipped to the card
  // Tasks without dates are normal — only the milestone is promised — so they sit in the card after the dated ones, in a grid:
  // as many per line as fit at TL.chipMin each (so each can be pointed at and shows its first word), the rest on more lines.
  function undatedOf(m) { return (m.tasks || []).filter(function (k) { return k.start == null; }); }
  function perLine(widthPx) { return Math.max(1, Math.floor((widthPx - 4) / (TL.chipMin + 4))); }

  // The timeline of a page. ctx: the elements (host: the scrolling box; seg, today, info: the range buttons, Today and the legend's place),
  // range() and setRange(r), projects() in the order drawn, plan(p) ({ms, tasks} or nothing yet), err(p) (its plan failed to load),
  // state(p) (its dot), opened (project key → 1 when its tasks show as chips) with saveOpen(), open(p, itemKey), empty() (the text with no projects).
  function timeline(ctx) {
    var view = null, stickQueued = false;
    function paintRange() { var bs = ctx.seg.querySelectorAll("button"); for (var i = 0; i < bs.length; i++) bs[i].setAttribute("aria-pressed", String(bs[i].dataset.r === ctx.range())); }
    function chrome() {
      [["1", "1 month"], ["3", "3 months"], ["6", "6 months"], ["12", "Year"], ["all", "All"]].forEach(function (r) { var b = btn("", r[1], function () { ctx.setRange(r[0]); paintRange(); render(true); }); b.dataset.r = r[0]; ctx.seg.appendChild(b); });
      paintRange();
      ctx.today.addEventListener("click", function () { render(true); });
      var ib = btn("icon-btn", null), pop = el("div", "pop"); ib.innerHTML = '<svg class="ico" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M8 7.2v3.6M8 5.2v.1"/></svg>';
      ib.setAttribute("aria-label", "What the colours mean"); ib.setAttribute("aria-expanded", "false"); pop.hidden = true;
      var lg = el("div", "lg");
      [["tl-b box prog", "Milestone in progress"], ["tl-b box", "Milestone planned"], ["tl-b box late", "Past its end date"], ["tl-b box done", "Done"], ["tl-b box paused", "Paused (❚❚), never counted as late"], ["tl-b box nodate", "No dates yet (?): drawn from today"], ["tl-chip wait", "A task waiting on someone"]].forEach(function (x) { var sw = el("span", "sw"); sw.appendChild(el("span", x[0])); lg.appendChild(sw); lg.appendChild(span(x[1])); });
      pop.appendChild(lg); pop.appendChild(el("div", "", "A milestone is a striped card over its dates in its state's colour: ◆ and its name, its tasks below — a line when closed, named chips when ▸ opens the project. A grey card with ? has no dates yet: it is drawn over its tasks, or from today if it has none. Drag or scroll sideways to move in time. Click anything to read the details."));
      ib.addEventListener("click", function (e) { e.stopPropagation(); pop.hidden = !pop.hidden; ib.setAttribute("aria-expanded", String(!pop.hidden)); });
      ctx.info.appendChild(ib); ctx.info.appendChild(pop);
      dragPan(ctx.host);
      ctx.host.addEventListener("scroll", stickSoon, { passive: true });
    }

    // the axis: month lines and labels always; weeks (dashed, Mondays numbered) at 1 and 3 months; days (dotted) at 1 month.
    // A month is labelled by its short name, January by its year instead; a finer line never sits on or just beside a month line,
    // where it would read as that line drawn twice; labels that would collide, or sit under the Today tag, are left out.
    function drawAxis(tl, ax) {
      var a = ax.a, b = ax.b, t = ax.t, px = ax.px, X = ax.X, LW = ax.LW, rg = ctx.range();
      var months = el("div", "tl-months"); months.appendChild(el("div", "tl-label tl-corner"));
      function line(n, cls) { var g = el("div", "tl-grid" + (cls ? " " + cls : "")); g.style.left = (LW + X(n)) + "px"; tl.appendChild(g); }
      function underToday(n, w) { return X(t) - X(n) > -8 && X(t) - X(n) < w; }
      var mstarts = [];
      for (var d0 = new Date(a * DAY), mc = Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth(), 1) / DAY; mc < b; d0 = new Date(mc * DAY), mc = Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + 1, 1) / DAY) if (mc >= a) mstarts.push(mc);
      var byMonth = function (n) { return mstarts.some(function (m) { return Math.abs(X(n) - X(m)) < Math.min(30, Math.max(14, 2.5 * px)); }); };
      if (rg === "1") for (var dy = a; dy < b; dy++) if (mstarts.indexOf(dy) < 0 && new Date(dy * DAY).getUTCDay() !== 1) line(dy, "day");
      if (rg === "1" || rg === "3") {
        for (var wk = a + ((8 - new Date(a * DAY).getUTCDay()) % 7); wk < b; wk += 7) {
          if (byMonth(wk)) continue;
          line(wk, "wk");
          var wd = new Date(wk * DAY), md = wd.getUTCDate(), dim = new Date(Date.UTC(wd.getUTCFullYear(), wd.getUTCMonth() + 1, 0)).getUTCDate();
          if (underToday(wk, 30) || (md - 1) * px < 34 || (dim - md + 1) * px < 20) continue;
          var wl = el("div", "tl-wk", String(md)); wl.style.left = (LW + X(wk)) + "px"; months.appendChild(wl);
        }
      }
      var freeX = -1e9;
      mstarts.forEach(function (cur) {
        var dd = new Date(cur * DAY), nxt = Date.UTC(dd.getUTCFullYear(), dd.getUTCMonth() + 1, 1) / DAY, jan = dd.getUTCMonth() === 0;
        var lab = jan ? String(dd.getUTCFullYear()) : MON[dd.getUTCMonth()], fits = X(cur) >= freeX && (nxt - cur) * px > 18 && !underToday(cur, 48);
        if (fits) freeX = X(cur) + lab.length * 7 + 12; // the next label starts after this one ends
        var mk = el("div", "tl-month" + (jan ? " yr" : ""), fits ? lab : ""); mk.style.left = (LW + X(cur)) + "px"; months.appendChild(mk);
        line(cur, jan ? "yr" : "");
      });
      var tlab = el("div", "tl-today-l", "Today"); tlab.style.left = (LW + X(t) + 1) + "px"; months.appendChild(tlab);
      tl.appendChild(months);
    }

    // one project's row: its tasks as bars (no milestones), its milestones as cards with a strip of tasks (closed),
    // or each milestone on its own line with named task chips (opened up with ▸)
    function drawRow(r, lab, p, ax) {
      var X = ax.X, LW = ax.LW, t = ax.t, d = ctx.plan(p) || {}, ms = d.ms || [], tasks = d.tasks || [];
      var PH = Math.max(TL.ph, Math.ceil((TL.chipMin + 11) / ax.px)); // an undated milestone's placeholder: a month, never narrower than one task chip
      // dated tasks drawn as bars of their own: those without a milestone, and those wholly outside their milestone's span
      var spans = {}; ms.forEach(function (m) { spans[key(m.url)] = spanOf(m); });
      var bars = tasks.filter(function (k) { if (k.start == null) return false; if (!k.ms) return true; var sp = spans[key(k.ms.url)]; return !sp || k.end < sp.start || k.start > sp.end; })
        .map(function (k) { return { m: k, start: k.start, end: k.end }; });
      var drawn = function (m) { return spans[key(m.url)] || needsPlaceholder(m); }; // a milestone that gets a card
      var hasTasks = ms.some(function (m) { return drawn(m) && (m.tasks || []).some(function (k) { return k.start == null || spans[key(m.url)] && kidsIn(m, spans[key(m.url)]).indexOf(k) >= 0; }); }), open = !!ctx.opened[p.key] && hasTasks;
      function bar(g, top, cls) {
        var m = g.m, x0 = X(g.start), x1 = X(g.end + 1);
        var b = btn("tl-b " + (cls || "") + " " + (m.state === "plan" ? "" : m.state), null, function () { ctx.open(p, key(m.url)); });
        b.appendChild(el("span", "tl-bn", m.name)); b.title = tipOf(m);
        b.style.left = (LW + x0) + "px"; b.style.width = Math.max(x1 - x0 - 3, 6) + "px"; b.style.top = top + "px";
        r.appendChild(hoverable(b, true)); return b;
      }
      function box(m, sp, top, hgt) { // a milestone as a card: its state's stripes, ◆ and its name, its tasks inside
        var x0 = X(sp.start), x1 = X(sp.end + 1), undated = m.start == null;
        var b = btn("tl-b box" + (undated ? " nodate" : "") + (m.state === "plan" || m.state === "nodate" ? "" : " " + m.state), null, function () { ctx.open(p, key(m.url)); });
        var hd = el("span", "tl-bh"); hd.appendChild(el("span", "tl-ms")); hd.appendChild(el("span", "tl-bn", m.name));
        if (undated) { var q = el("span", "tl-q", "?"); q.title = "No dates yet"; hd.appendChild(q); }
        b.appendChild(hd);
        b.style.left = (LW + x0) + "px"; b.style.width = Math.max(x1 - x0 - 3, TL.minBox) + "px"; b.style.top = top + "px"; b.style.height = hgt + "px";
        if (x1 - x0 < TL.narrowBox) b.classList.add("narrow"); // too small for ◆, name and ?: the ? stays, the rest shows under the cursor
        b.title = tipOf(m);
        r.appendChild(hoverable(b, true)); return { bar: b, x0: x0, sp: sp };
      }
      function stripLanes(m, sp) { var dd = datedIn(m, sp), n = pack(dd); return n + (undatedOf(m).length ? 1 : 0); }
      function strip(b, m) { // closed: the milestone's tasks as segmented lines inside its card — dated ones by date (overlaps on lines above), undated ones sharing a line evenly
        var dated = datedIn(m, b.sp), und = undatedOf(m); if (!dated.length && !und.length) return false;
        var nd = pack(dated), lines = nd + (und.length ? 1 : 0), tr = el("span", "tl-strip"); tr.style.height = (lines * TL.seg - 2) + "px";
        function seg(k, bottom) {
          var sg = el("span", "tl-seg " + (k.state === "plan" || k.state === "nodate" ? "" : k.state)); sg.style.bottom = bottom + "px";
          sg.title = k.name + " — " + tipOf(k); /* a segment shows no name, so its tip does */
          sg.addEventListener("click", function (e) { e.stopPropagation(); ctx.open(p, key(k.url)); });
          tr.appendChild(sg); return sg;
        }
        dated.forEach(function (g) { var x0 = X(g.start) - b.x0, x1 = X(g.end + 1) - b.x0, sg = seg(g.m, (lines - 1 - g.lane) * TL.seg); sg.style.left = Math.max(x0 - TL.pad, 0) + "px"; sg.style.width = Math.max(x1 - x0 - 3, 3) + "px"; });
        und.forEach(function (k, i) { var sg = seg(k, 0); sg.style.left = (i / und.length * 100) + "%"; sg.style.width = "calc(" + (100 / und.length) + "% - 3px)"; }); /* shares: they follow the card when it widens */
        b.bar.appendChild(tr); return true;
      }
      function chipLines(m, sp) { var dd = pack(datedIn(m, sp)), u = undatedOf(m).length, w = X(sp.end + 1) - X(sp.start) - 3; return dd + (u ? Math.ceil(u / perLine(w)) : 0); }
      function chips(b, m) { // opened up: the milestone's tasks as named chips inside its card (reachable by mouse; the card itself takes focus)
        function chip(k, top) {
          var c = el("span", "tl-chip " + (k.state === "plan" || k.state === "nodate" ? "" : k.state), k.name); c.style.top = top + "px";
          c.title = tipOf(k); c.addEventListener("click", function (e) { e.stopPropagation(); ctx.open(p, key(k.url)); });
          b.bar.appendChild(hoverable(c)); return c;
        }
        var dated = datedIn(m, b.sp), nd = pack(dated);
        dated.forEach(function (g) { var x0 = X(g.start) - b.x0, x1 = X(g.end + 1) - b.x0, c = chip(g.m, TL.head + g.lane * TL.lane); c.style.left = Math.max(x0 + 3, 4) + "px"; c.style.width = Math.max(x1 - x0 - 7, 6) + "px"; });
        var und = undatedOf(m), per = Math.min(und.length, perLine(X(b.sp.end + 1) - X(b.sp.start) - 3)); /* as chipLines counted */
        und.forEach(function (k, i) { /* the grid, in shares of the card: each line shares the card among its chips (a short last line too), and stretches when the card widens under the cursor */
          var line = Math.floor(i / per), inLine = Math.min(per, und.length - line * per), col = i % per;
          var c = chip(k, TL.head + (nd + line) * TL.lane);
          c.style.left = "calc(" + (col * 100 / inLine) + "% + 3px)"; c.style.width = "calc(" + (100 / inLine) + "% - 7px)";
        });
      }
      function glab(text, y, go) { var g = btn("tl-glab", text, go); g.title = text; g.style.top = (y + 1) + "px"; lab.appendChild(g); }
      var h;
      if (!ms.length) { // tasks only: the dated ones are the row; a task without dates is not drawn
        var nl = pack(bars); bars.forEach(function (g) { bar(g, TL.pad + g.lane * TL.flat); }); h = Math.max(nl, 1) * TL.flat + 16;
      } else if (!open) { // one card per milestone, its tasks as a strip
        var segLanes = Math.max.apply(null, [1].concat(ms.filter(drawn).map(function (m) { return stripLanes(m, spans[key(m.url)] || { start: 0, end: PH - 1 }); })));
        var BH = hasTasks ? TL.box + (segLanes - 1) * TL.seg : TL.head, HL = BH + TL.gap, ph = t;
        var items = ms.map(function (m) { var sp = spans[key(m.url)]; return sp ? { m: m, start: sp.start, end: sp.end, sp: sp } : null; }).filter(Boolean); // dated cards
        ms.filter(function (m) { return !spans[key(m.url)] && needsPlaceholder(m); }).forEach(function (m) { items.push({ m: m, start: ph, end: ph + PH - 1, sp: { start: ph, end: ph + PH - 1, nodate: true, placeholder: true } }); ph += PH; });
        var n = pack(items);
        items.forEach(function (g) {
          var top = TL.pad + g.lane * HL, mid = top + (BH - TL.head) / 2;
          var b = box(g.m, g.sp, top, BH);
          if (!strip(b, g.m)) { b.bar.style.height = TL.head + "px"; b.bar.style.top = mid + "px"; }
        });
        var nl0 = pack(bars); bars.forEach(function (g) { bar(g, TL.pad + n * HL + g.lane * TL.lane, "task"); });
        h = Math.max(n, 1) * HL + TL.pad + nl0 * TL.lane;
      } else { // opened up: each milestone on its own line, its name also in the left column
        var y = 36, ph2 = t;
        sortItems(ms).forEach(function (m) {
          var sp = spans[key(m.url)];
          if (!sp && !needsPlaceholder(m)) return;
          glab(m.name, y, function () { ctx.open(p, key(m.url)); });
          if (!sp) { sp = { start: ph2, end: ph2 + PH - 1, nodate: true, placeholder: true }; ph2 += PH; }
          var lanes = chipLines(m, sp);
          var bh = TL.head + lanes * TL.lane + (lanes ? 4 : 0), b = box(m, sp, y, bh); chips(b, m);
          y += bh + TL.gap;
        });
        if (bars.length) {
          glab("Other tasks", y, function () { ctx.open(p); });
          var nl3 = pack(bars); bars.forEach(function (g) { bar(g, y + g.lane * TL.lane, "task"); }); y += nl3 * TL.lane + TL.gap;
        }
        h = y + 2;
      }
      return { h: h, hasTasks: hasTasks, open: open };
    }
    function render(toToday) {
      var host = ctx.host, t = todayNum(), ps = ctx.projects();
      if (!ps.length) { clear(host); host.appendChild(el("div", "empty tl-empty", ctx.empty())); view = null; return; }
      var a = t - 30, b = t + 120;
      ps.forEach(function (p) { var d = ctx.plan(p); (d ? d.ms.concat(d.tasks) : []).forEach(function (m) { if (m.start != null && m.start - 7 < a) a = m.start - 7; if (m.end != null && m.end + 14 > b) b = m.end + 14; }); });
      var narrow = window.innerWidth <= 640, LW = narrow ? 130 : 220, vw = host.clientWidth || 700;
      var spanD = SPANS[ctx.range()] || (b - a), px = Math.max((Math.max(vw, 320) - LW - 2) / spanD, narrow ? 4.5 : 0), W = Math.round((b - a) * px);
      var ax = { a: a, b: b, t: t, px: px, LW: LW, X: function (n) { return Math.round((n - a) * px); } };
      var keepDay = view ? view.a + host.scrollLeft / view.px : null;
      var tl = el("div", "tl"); tl.style.width = Math.max(LW + W, vw) + "px"; tl.style.setProperty("--lw", LW + "px");
      drawAxis(tl, ax);
      ps.forEach(function (p) {
        var st = ctx.state(p), r = el("div", "tl-row"), lab = el("div", "tl-label");
        var car = btn("car", null, function (e) { e.stopPropagation(); if (ctx.opened[p.key]) delete ctx.opened[p.key]; else ctx.opened[p.key] = 1; ctx.saveOpen(); render(false); });
        car.addEventListener("mousedown", function (e) { e.preventDefault(); }); // focusing it would scroll the chart back to its start
        car.innerHTML = CHEV; lab.appendChild(car); lab.appendChild(el("span", "dot " + st.dot));
        var nb = btn("", p.name, function () { ctx.open(p); }); nb.title = p.name; lab.appendChild(nb); r.appendChild(lab);
        if (ctx.err(p)) { var fn = el("div", "tl-fail", "Plan didn't load. Refresh to retry."); fn.style.left = (LW + Math.max(0, ax.X(t - 14)) + TL.pad) + "px"; r.appendChild(fn); }
        var res = drawRow(r, lab, p, ax);
        if (!res.hasTasks) { car.classList.add("none"); car.disabled = true; car.setAttribute("aria-hidden", "true"); car.tabIndex = -1; }
        car.setAttribute("aria-expanded", String(res.open)); car.setAttribute("aria-label", res.open ? "Hide tasks" : "Show tasks"); car.title = res.open ? "Hide tasks" : "Show tasks";
        r.style.height = Math.max(res.h, TL.row) + "px";
        tl.appendChild(r);
      });
      var td = el("div", "tl-today"); td.style.left = (LW + ax.X(t)) + "px"; tl.appendChild(td);
      clear(host); host.appendChild(tl);
      host.scrollLeft = toToday || keepDay == null ? Math.max(0, ax.X(t - (ctx.range() === "1" ? 5 : 14))) : Math.max(0, Math.round((keepDay - a) * px));
      view = { a: a, px: px, lw: LW };
      stickNames();
    }
    function stickNames() { // a card that starts left of the visible part keeps its name in view; all reads first, then all writes
      var host = ctx.host, v = view; if (!v) return;
      var edge = host.scrollLeft + v.lw, bs = host.querySelectorAll(".tl-b.box"), pads = [];
      for (var i = 0; i < bs.length; i++) pads.push(Math.max(0, Math.min(edge - bs[i].offsetLeft, bs[i].offsetWidth - TL.keepName)));
      for (var j = 0; j < bs.length; j++) bs[j].firstChild.style.paddingLeft = pads[j] > 0 ? (TL.pad + pads[j]) + "px" : "";
    }
    function stickSoon() { if (stickQueued) return; stickQueued = true; requestAnimationFrame(function () { stickQueued = false; stickNames(); }); }
    chrome();
    return { render: render, reset: function () { view = null; } };
  }

  // ---------- the pieces of a project page ----------
  function facts(host, pairs) {
    var dl = el("dl", "facts");
    pairs.forEach(function (x) { if (x[1] == null || x[1] === "") return; dl.appendChild(el("dt", "", x[0])); var dd = el("dd"); if (typeof x[1] === "string") dd.textContent = x[1]; else dd.appendChild(x[1]); dl.appendChild(dd); });
    if (dl.childNodes.length) host.appendChild(dl);
  }
  function actions(host, items) { var a = el("div", "actions"); items.forEach(function (x) { if (x) a.appendChild(x); }); if (a.childNodes.length) host.appendChild(a); }
  function typeTag(t) { return el("span", "tt " + (t || ""), t || "Item"); }
  function phraseEl(parts) { var s = el("span", "s"); parts.forEach(function (p) { if (!p || !p[0]) return; if (s.childNodes.length) s.appendChild(document.createTextNode(" · ")); s.appendChild(span(p[0], p[1] || "")); }); return s; }
  function problemLines(x, list, title, onUs) { // onUs: how a problem waiting on no one reads (on the user's page, "on you")
    if (!list.length) return;
    var bx = el("div"); bx.appendChild(el("div", "xh", title));
    list.forEach(function (i) { var l = el("div", "pline"); l.appendChild(span(i.type + ": ", "muted")); l.appendChild(document.createTextNode(i.name)); l.appendChild(span(" · " + (i.status === "Resolved" ? "resolved" : i.waiting ? "waiting on " + i.waiting : onUs || "on you"), "muted")); bx.appendChild(l); });
    x.appendChild(bx);
  }
  function msFacts(x, m) {
    var w = whenOf(m); // the group's header already says the timing and how many tasks are done
    facts(x, [["Dates", m.start == null ? "none yet, so it can't show as due or late" : range(m.start, m.end) + ", " + plural(m.end - m.start + 1, "day")], ["Status", m.status + (m.project.status === "Paused" && m.status !== "Done" ? " (project paused)" : "")], m.status === "Done" ? ["Result", span(w[0], w[1])] : ["", ""]]);
  }
  function taskFacts(x, k) {
    var w = whenOf(k);
    facts(x, [["Dates", k.start == null ? "none" : range(k.start, k.end)], ["Status", k.status + (k.status === "Waiting" && k.waiting ? " on " + k.waiting : "")], ["Milestone", k.ms ? k.ms.name : "none"], [k.status === "Done" ? "Result" : "Timing", span(w[0], w[1])]]);
  }
  // the project at a glance, under its summary: when it ends and when it started, then what extra(pair) adds
  function projectSummary(p, plan, extra) {
    var dl = el("dl", "dr-sum");
    function pair(k, v, none) { var d = el("div"); d.appendChild(el("dt", "", k)); var dd = el("dd", none ? "none" : ""); if (typeof v === "string") dd.textContent = v; else dd.appendChild(v); d.appendChild(dd); dl.appendChild(d); return d; }
    var starts = plan.map(function (x) { return x.start; }).filter(function (x) { return x != null; }), t = todayNum();
    if (p.target != null) { var e = span(fmt(p.target, true)); if (p.target >= t) e.appendChild(span(" · in " + plural(p.target - t, "day"), "w")); pair("Ends", e); } else pair("Ends", "not set", true);
    if (starts.length) { var s0 = Math.min.apply(null, starts); pair(s0 > t ? "Starts" : "Started", fmt(s0, true)); }
    if (extra) extra(pair);
    return dl;
  }
  var DICO = {
    items: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="M8 5.5v3M8 10.5v.1"/></svg>',
    resolved: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="M5.6 8.2 7.3 9.9 10.5 6.4"/></svg>',
    plan: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h6M5 8h8.5M3.5 12h5"/></svg>',
    notes: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h5.5L12 5v8.5H4z"/><path d="M6 8h4M6 10.5h4"/></svg>'
  };

  // The project page's pieces. ctx: ui (open: rows opened, grp: milestone groups opened or closed, col: sections folded — kept across repaints),
  // host() (the box the page is in), msBody(x, m) and taskBody(x, k) (what an opened milestone or task shows), onUs (how a blocker
  // waiting on no one reads; "on you" by default).
  function page(ctx) {
    var ui = ctx.ui, onUs = ctx.onUs || "on you";
    function acc(o) { // a row that opens below itself
      var k = "d:" + o.k, on0 = !!ui.open[k], r = el("div", "arow" + (o.tsk ? " tsk" : "") + (on0 ? " open" : "")); r.dataset.k = o.k;
      var h = btn("acc-h", null); h.setAttribute("aria-expanded", String(on0));
      h.appendChild(el("span", "dot " + (o.dot || "")));
      var mid = el("span", "mid"); mid.appendChild(el("span", "t", o.title));
      if (o.line) mid.appendChild(o.line);
      h.appendChild(mid); h.appendChild(el("span", "r", o.right || "")); h.insertAdjacentHTML("beforeend", CHEV);
      var x = el("div", "acc-x"); x.hidden = !on0; if (on0) o.expand(x);
      h.addEventListener("click", function () { var on = !ui.open[k]; if (on) ui.open[k] = 1; else delete ui.open[k]; r.classList.toggle("open", on); h.setAttribute("aria-expanded", String(on)); if (on && !x.firstChild) o.expand(x); x.hidden = !on; });
      r.appendChild(h); r.appendChild(x); return r;
    }
    function dsec(host, ico, title, n, right) { // a big section of the page; its header folds it, open by default
      var s = el("section", "dsec" + (ui.col[ico] ? " folded" : "")); s.dataset.sec = ico;
      var hh = btn("dsec-h", null); hh.setAttribute("aria-expanded", String(!ui.col[ico])); hh.innerHTML = DICO[ico]; hh.appendChild(el("h3", "", title));
      if (n != null) hh.appendChild(el("span", "cnt", String(n))); if (right) { right.classList.add("r"); hh.appendChild(right); }
      hh.insertAdjacentHTML("beforeend", CHEV);
      var b = el("div", "dsec-b"); b.hidden = !!ui.col[ico];
      hh.addEventListener("click", function () { setFold(s, !s.classList.contains("folded")); });
      s.appendChild(hh); s.appendChild(b); host.appendChild(s); return b;
    }
    function setFold(s, fold) {
      var k = s.dataset.sec; if (fold) ui.col[k] = 1; else delete ui.col[k];
      s.classList.toggle("folded", fold); s.querySelector(".dsec-h").setAttribute("aria-expanded", String(!fold)); s.querySelector(".dsec-b").hidden = fold;
    }
    function taskRow(k) { return acc({ k: key(k.url), tsk: true, dot: itemDot(k), title: k.name, line: phraseEl([planPhrase(k)]), right: k.start == null ? "" : range(k.start, k.end), expand: function (x) { ctx.taskBody(x, k); } }); }
    function msGroup(m, openByDefault) { // a milestone and everything in it: opening it shows its details, then its tasks
      var k = key(m.url), on = ui.grp[k] != null ? ui.grp[k] : openByDefault, g = el("div", "mgrp" + (on ? " open" : "")), tdn = m.tasks.filter(function (x) { return x.status === "Done"; }).length;
      var h = btn("acc-h mh", null); h.setAttribute("aria-expanded", String(on));
      h.appendChild(el("span", "dot " + itemDot(m)));
      var mid = el("span", "mid"); mid.appendChild(el("span", "t", m.name));
      mid.appendChild(phraseEl([planPhrase(m), m.tasks.length ? [tdn + " of " + plural(m.tasks.length, "task") + " done", ""] : null]));
      h.appendChild(mid); h.appendChild(el("span", "r", m.start == null ? "" : range(m.start, m.end))); h.insertAdjacentHTML("beforeend", CHEV);
      var b = el("div", "mgrp-b"); b.hidden = !on;
      var det = el("div", "mdet"); b.appendChild(det);
      function fill() { if (!det.firstChild) ctx.msBody(det, m); }
      if (on) fill();
      if (m.tasks.length) { var tl = el("div", "mtl"); tl.appendChild(span("Tasks")); tl.appendChild(span(String(m.tasks.length), "n")); b.appendChild(tl); }
      m.tasks.forEach(function (x) { b.appendChild(taskRow(x)); });
      g._fill = fill;
      h.addEventListener("click", function () { setGroup(g, k, !g.classList.contains("open")); });
      g.dataset.g = k; g.appendChild(h); g.appendChild(b); return g;
    }
    function setGroup(g, k, on) { ui.grp[k] = on; if (on && g._fill) g._fill(); g.classList.toggle("open", on); g.querySelector(".mh").setAttribute("aria-expanded", String(on)); g.querySelector(".mgrp-b").hidden = !on; }
    function projectHead(host, p, st, plan, extra) { // who, the name with its state, the summary, the project at a glance
      var hd = el("header", "dr-head");
      hd.appendChild(el("div", "dr-who", [p.client, p.origin].filter(Boolean).join(" · ")));
      var h = el("div", "dr-h1"); h.appendChild(el("h1", "", p.name)); if (st.text) h.appendChild(el("span", "pill " + st.cls, st.text)); hd.appendChild(h);
      if (p.summary) hd.appendChild(el("p", "dr-lede", p.summary));
      hd.appendChild(projectSummary(p, plan, extra));
      host.appendChild(hd); return hd;
    }
    function focusBlock(f, blockers) { // where it stands: the milestone under way with its current task, what is late, what is paused, the next milestone, blockers
      var fc = el("div", "focus");
      var line = function (label, cls, name, when, wcls, k) { var r = el("div", "fr"); r.appendChild(el("span", "fl " + cls, label)); var c = el("div"); c.appendChild(btn("go", name, function () { reveal(k); })); if (when) c.appendChild(el("div", "w " + (wcls || ""), when)); r.appendChild(c); fc.appendChild(r); return c; };
      f.overdue.forEach(function (m) { line("Overdue", "crit", m.name, whenOf(m)[0], "crit", key(m.url)); });
      f.now.forEach(function (m) {
        var w = whenOf(m), c = line(m.paused ? "Paused" : m.status === "Waiting" ? "Waiting" : "Now", m.paused ? "" : m.late > 0 ? "crit" : "now", m.name, w[0], w[1], key(m.url));
        var ct = m.kind === "ms" && !m.paused ? currentTask(m.tasks) : null;
        if (ct) { var tw = whenOf(ct), sub = el("div", "ct"); sub.appendChild(span("Current task: ", "muted")); sub.appendChild(btn("go2", ct.name, function () { reveal(key(ct.url)); })); sub.appendChild(el("div", "w " + (tw[1] || ""), tw[0])); c.appendChild(sub); }
      });
      if (f.next) line("Next", "", f.next.name, (f.byTasks ? "next task · " : "next milestone · ") + whenOf(f.next)[0], "", key(f.next.url));
      blockers.forEach(function (i) { line("Blocked", "crit", i.name, i.waiting ? "waiting on " + i.waiting : onUs, "crit", key(i.url)); });
      return fc.childNodes.length ? fc : null;
    }
    function planSec(body, ms0, tk0, head, o) { // the plan: milestones with their tasks under them; tasks without a milestone at the end. o: err (why it didn't load), empty (the text with no plan)
      var tdone = (tk0 || []).filter(function (k) { return k.status === "Done"; }).length, done = (ms0 || []).filter(function (m) { return m.status === "Done"; }).length;
      var b2 = dsec(body, "plan", "Plan", null, ms0 && ms0.length ? span(done + " of " + ms0.length + " milestones done", "muted") : tk0 && tk0.length ? span(tdone + " of " + tk0.length + " tasks done", "muted") : null);
      if (!ms0) b2.appendChild(el("div", o.err ? "err" : "empty", o.err ? "The plan didn't load. " + o.err : "Loading…"));
      else if (!ms0.length && !tk0.length) b2.appendChild(el("div", "empty", o.empty));
      else {
        sortItems(ms0).forEach(function (m) { b2.appendChild(msGroup(m, m.status === "In progress" || (m.late > 0 && OPEN_MS[m.status]) || m === head)); });
        var loose = sortItems(tk0.filter(function (k) { return !k.ms; }));
        if (loose.length) {
          if (ms0.length) { var gt2 = el("div", "grp-t"); gt2.appendChild(span("Other tasks")); gt2.appendChild(span(String(loose.length), "n")); b2.appendChild(gt2); }
          loose.forEach(function (k) { var r = taskRow(k); if (!ms0.length) r.classList.remove("tsk"); b2.appendChild(r); });
        }
      }
      return b2;
    }
    function reveal(k) { // open an item on the page and bring it into view
      var host = ctx.host(), mg = host.querySelector('.mgrp[data-g="' + sel(k) + '"]');
      if (mg) { if (!mg.classList.contains("open")) setGroup(mg, k, true); var sec0 = mg.closest(".dsec"); if (sec0 && sec0.classList.contains("folded")) setFold(sec0, false); mg.scrollIntoView({ block: "start", behavior: smooth() }); mg.classList.remove("flash"); void mg.offsetWidth; mg.classList.add("flash"); return; }
      var r = host.querySelector('.arow[data-k="' + sel(k) + '"]') || host.querySelector('.arow[data-k="' + sel("w:" + k) + '"]') || host.querySelector('.arow[data-k="' + sel("r:" + k) + '"]');
      var sec = r && r.closest(".dsec"); if (sec && sec.classList.contains("folded")) setFold(sec, false); // a folded section opens for the item asked for
      var grp = r && r.closest(".mgrp"); if (grp && !grp.classList.contains("open")) setGroup(grp, grp.dataset.g, true); // and so does a folded milestone
      if (r && !r.classList.contains("open")) r.querySelector(".acc-h").click();
      if (r) { r.scrollIntoView({ block: "start", behavior: smooth() }); r.classList.remove("flash"); void r.offsetWidth; r.classList.add("flash"); }
    }
    return { acc: acc, dsec: dsec, setFold: setFold, taskRow: taskRow, msGroup: msGroup, setGroup: setGroup, projectHead: projectHead, focusBlock: focusBlock, planSec: planSec, reveal: reveal };
  }

  window.PT = {
    DAY: DAY, OPEN_MS: OPEN_MS, OPEN_TASK: OPEN_TASK, SPANS: SPANS, CHEV: CHEV, MON: MON,
    el: el, clear: clear, link: link, btn: btn, span: span, nodash: nodash, cleanUrl: cleanUrl, unesc: unesc, clean: clean, rel: rel, key: key, num: num, plural: plural, smooth: smooth, sel: sel, keep: keep,
    dnum: dnum, todayNum: todayNum, fmt: fmt, soon: soon, range: range, days: days, hhmm: hhmm,
    msOf: msOf, taskOf: taskOf, problemOf: problemOf, buildPlan: buildPlan, isOpen: isOpen, ageOf: ageOf, ageCls: ageCls, sortItems: sortItems, worstLate: worstLate,
    currentTask: currentTask, focusOf: focusOf, whenOf: whenOf, projectState: projectState, planPhrase: planPhrase, itemDot: itemDot, tipOf: tipOf,
    timeline: timeline,
    facts: facts, actions: actions, typeTag: typeTag, phraseEl: phraseEl, problemLines: problemLines, msFacts: msFacts, taskFacts: taskFacts, page: page
  };
})();
