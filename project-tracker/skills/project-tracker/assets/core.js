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
  function link(href, text, cls) { // values from data: web links only
    var a = el("a", cls || "", text);
    if (href && /^https?:\/\//i.test(href)) { a.href = href; a.target = "_blank"; a.rel = "noopener"; }
    return a;
  }
  function btn(cls, text, onClick) { var b = el("button", cls, text); b.type = "button"; if (onClick) b.addEventListener("click", onClick); return b; }
  function span(text, cls) { return el("span", cls || "", text); }
  function nodash(id) { return String(id || "").replace(/-/g, ""); }
  function cleanUrl(u) { return String(u || "").replace(/^\{\{|\}\}$/g, "").split("?")[0]; }
  function unesc(s) { return String(s).replace(/\\([!-\/:-@\[-`{-~])/g, "$1"); } // a Markdown escape: a backslash before any ASCII punctuation
  // A text field holding a literal value (a folder path) as it was meant: Notion turns a domain-like part into a link,
  // [sivakov.tech/x](http://sivakov.tech/x), and returns inline code as <code>…</code> or backticks; nothing else counts as markup, so a
  // path's __ and * stay
  function plain(s) {
    return unesc(String(s == null ? "" : s).replace(/(^|[^\\])\[((?:\\.|[^\]\\])*)\]\([^)]*\)/g, "$1$2").replace(/<\/?code>|`/g, "")).trim();
  }
  // A page's text as notion-fetch returns it → the dialect everything here reads (the one it returned before Oct 20, 2026): nesting by tabs,
  // a toggle as <details> with its first line in <summary>, **bold**, *italic*, ~~strike~~, `code`, tables as <table>, <empty-block/>.
  // Since Oct 20 it nests by two spaces, writes <toggle>, <b>, <i>, <s>, <code>, pipe tables and <p />. Text already in the old dialect
  // passes unchanged, so it runs once on every page, whichever a workspace returns. Backslash escapes stay: unesc() undoes them for display.
  function notionText(text) {
    var out = [], fence = false, depth = 0, sumAt = -1, tbl = null; // depth: the toggles we are in, whose children the old dialect indents
    function tabs(n) { return new Array(n + 1).join("\t"); }
    function inl(s) {
      return s.replace(/<(b|strong)>([\s\S]*?)<\/\1>/g, "**$2**").replace(/<(i|em)>([\s\S]*?)<\/\1>/g, "*$2*")
        .replace(/<(s|del|strike)>([\s\S]*?)<\/\1>/g, "~~$2~~").replace(/<code>([\s\S]*?)<\/code>/g, "`$1`")
        .replace(/<u>([\s\S]*?)<\/u>/g, '<span underline="true">$1</span>').replace(/<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, "[$2]($1)");
    }
    function cells(t) { // an escaped \| stays in its cell
      return t.replace(/^\s*\|/, "").replace(/\|\s*$/, "").replace(/\\\|/g, "\u0000").split("|").map(function (c) { return c.trim().replace(/\u0000/g, "\\|"); });
    }
    function flush() { // a pipe table → <table> with its rows and cells indented under it, as the old dialect wrote them
      if (!tbl) return; var i = tbl.ind;
      out.push(i + '<table header-row="true">');
      tbl.rows.forEach(function (r) { out.push(i + "\t<tr>"); r.forEach(function (c) { out.push(i + "\t\t<td>" + inl(c) + "</td>"); }); out.push(i + "\t</tr>"); });
      out.push(i + "</table>"); tbl = null;
    }
    String(text == null ? "" : text).split("\n").forEach(function (l) {
      var sp = /^( {2})+/.exec(l), body = sp ? l.slice(sp[0].length) : l, ind = tabs(depth) + tabs(sp ? sp[0].length / 2 : 0), m;
      if (/^\t*```/.test(body)) fence = !fence; else if (fence) { out.push(l); return; } // code stays as written
      if (/^\t*\|.*\|\s*$/.test(body)) { // a pipe table: a header row, the --- row, then rows
        if (!tbl) tbl = { ind: ind + /^\t*/.exec(body)[0], rows: [] };
        if (!/^\t*\|(\s*:?-{3,}:?\s*\|)+\s*$/.test(body)) tbl.rows.push(cells(body));
        return;
      }
      flush();
      if ((m = /^(\t*)<toggle\b([^>]*)>\s*$/.exec(body))) { out.push(ind + m[1] + "<details" + m[2] + ">"); depth++; sumAt = out.length; return; }
      if (depth && /^\t*<\/toggle>\s*$/.test(body)) {
        depth--; sumAt = -1;
        out.push(tabs(depth) + body.replace("</toggle>", "</details>").replace(/^\t*/, function (d) { return (sp ? tabs(sp[0].length / 2) : "") + d; }));
        return;
      }
      if (sumAt === out.length && body.trim()) { // a toggle's first line is its summary
        out.push(ind.slice(1) + body.replace(/^(\t*)(.*)$/, function (x, d, s) { return d + "<summary>" + inl(s) + "</summary>"; }));
        sumAt = -1; return;
      }
      if (!body.trim()) { out.push(""); return; }
      if (/^\t*<p\s*\/>\s*$/.test(body)) { out.push(ind + body.replace(/<p\s*\/>/, "<empty-block/>")); return; }
      out.push(ind + inl(body.replace(/^(\t*)<p>([\s\S]*)<\/p>\s*$/, "$1$2")));
    });
    flush();
    return out.join("\n");
  }
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
  var MOTION = !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  function slide(box, show, done) { // a part opens or folds smoothly — its height, the gap above it and its opacity; done runs at the end
    if (!MOTION || !box.animate) { if (done) done(); return; }
    box.getAnimations().forEach(function (a) { a.cancel(); }); // a click while it moves starts from where it stands, at its full size
    var cs = getComputedStyle(box), full = { height: box.getBoundingClientRect().height + "px", opacity: 1 }, none = { height: "0px", opacity: 0 };
    ["marginTop", "paddingTop", "paddingBottom", "borderTopWidth", "borderBottomWidth"].forEach(function (k) { // all of it goes to zero, or the padding stays and jumps at the end
      full[k] = cs[k]; none[k] = "0px";
    });
    box.style.overflow = "clip"; // clip, not hidden: hidden would make it a scroll box and unstick the timeline's names
    var an = box._an = box.animate(show ? [none, full] : [full, none], { duration: 200, easing: "cubic-bezier(.2, 0, 0, 1)", fill: show ? "none" : "forwards" });
    function end() { if (end.ran) return; end.ran = 1; if (done) done(); if (box._an !== an) return; an.cancel(); box.style.overflow = ""; }
    an.onfinish = end; setTimeout(end, 260); // also where frames are not drawn (a hidden tab), so it never stays half-way
  }
  function foldDetails(d, body) { // a <details> opens or folds smoothly; its chevron turns at once (.shut while it folds)
    if (!d.open || d.classList.contains("shut")) { d.classList.remove("shut"); d.open = true; slide(body, true); }
    else { d.classList.add("shut"); slide(body, false, function () { if (d.classList.contains("shut")) { d.open = false; d.classList.remove("shut"); } }); }
  }
  function growTo(box, from) { // a box redrawn at a new height grows or shrinks to it from the old one
    if (!MOTION || !box.animate || from == null) return; var to = box.offsetHeight; if (Math.abs(to - from) < 2) return;
    box.style.overflow = "clip"; var an = box.animate([{ height: from + "px" }, { height: to + "px" }], { duration: 200, easing: "cubic-bezier(.2, 0, 0, 1)" });
    function end() { if (end.ran) return; end.ran = 1; an.cancel(); box.style.overflow = ""; } an.onfinish = end; setTimeout(end, 260);
  }
  function smooth() { return MOTION ? "smooth" : "auto"; }
  function sel(v) { return window.CSS && CSS.escape ? CSS.escape(v) : String(v).replace(/["\\]/g, "\\$&"); } // values from data inside a selector
  function keep(host, fn) { var y = host.scrollTop; fn(); host.scrollTop = y; } // updates never jump a list back to the top

  // ---------- dates: whole days in the viewer's local calendar ----------
  function dnum(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || "")); return m ? Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY) : null; }
  function todayNum() { var d = new Date(); return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY); }
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function yr(n) { return new Date(n * DAY).getUTCFullYear(); }
  function fmt(n, withYear) {
    if (n == null) return "—";
    var d = new Date(n * DAY), s = MON[d.getUTCMonth()] + " " + d.getUTCDate();
    return (withYear || yr(n) !== yr(todayNum())) ? s + ", " + yr(n) : s;
  }
  function soon(n) {
    var t = todayNum();
    if (n === t) return "today";
    if (n === t + 1) return "tomorrow";
    return n > t && n - t < 7 ? WD[new Date(n * DAY).getUTCDay()] + " " + fmt(n) : fmt(n);
  }
  function range(a, b) {
    if (a == null) return "no dates"; if (b == null) return "from " + fmt(a); if (a === b) return fmt(a);
    var da = new Date(a * DAY), db = new Date(b * DAY);
    if (da.getUTCMonth() === db.getUTCMonth() && da.getUTCFullYear() === db.getUTCFullYear()) // one month: Oct 5–9
      return MON[da.getUTCMonth()] + " " + da.getUTCDate() + "–" + db.getUTCDate() + (yr(b) !== yr(todayNum()) ? ", " + yr(b) : "");
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
  function stateOfItem(it, pausedUp) { // a Done item is done, late or not: it is finished, not burning (its late days show on the timeline)
    if (it.status === "Done") return "done";
    if (pausedUp) return "paused";
    if (it.late > 0) return "late";
    if (it.status === "Waiting") return "wait"; // waiting or under way shows so, dated or not
    if (it.status === "In progress") return "prog";
    return it.start == null ? "nodate" : "plan";
  }
  // A Schedule or Tasks row → a milestone or task. A date with no end is a start whose end is not agreed (openEnd): never late; open, it is
  // drawn on the timeline for a set span, done, up to its finish. It is paused with its project, a task also with its milestone.
  function itemOf(kind, row, project, own) {
    var x = { kind: kind, url: cleanUrl(row.url), name: clean(row.Name) || "Untitled", status: row.Status || "", project: project,
      start: dnum(row["date:Dates:start"]), end: dnum(row["date:Dates:end"]), finished: dnum(row["date:Finished:start"]),
      chat: row.Chat || "", code: row["Code session"] || "", order: num(row.Order), ref: refOf(kind, row.Ref) };
    for (var k in own) x[k] = own[k];
    x.openEnd = x.start != null && x.end == null;
    x.at = x.start != null ? x.start : x.status === "Done" ? x.finished : null; // where it sits on the timeline: its planned start, else, done, the day it was finished
    var paused = project.status === "Paused" || (kind === "ms" ? x.status === "Paused" : !!x.ms && x.ms.status === "Paused");
    x.late = lateOf(x, paused); x.state = stateOfItem(x, paused); x.paused = paused && x.status !== "Done";
    return x;
  }
  function msOf(row, project) { return itemOf("ms", row, project, { tasks: [] }); }
  function taskOf(row, project, msByKey) {
    var mk = rel(row.Milestone).map(key)[0] || null, ms = mk ? msByKey[mk] || null : null;
    return itemOf("task", row, project, { waiting: clean(row["Waiting on"]), mk: ms ? mk : null, ms: ms });
  }
  // The `Ref` field's prefix per database, as the config's ref_prefixes line sets them (setup.md); a view gives only the number
  var REF = { project: "PRJ", ms: "MLS", task: "TSK", problem: "PRB" };
  function setRefPrefixes(line) {
    var p = String(line || "").split(/[,\s]+/).filter(Boolean);
    if (p.length === 4) { REF.project = p[0]; REF.ms = p[1]; REF.task = p[2]; REF.problem = p[3]; }
  }
  function refOf(kind, v) { v = String(v == null ? "" : v).trim(); return !v ? "" : /^\d+$/.test(v) ? REF[kind] + "-" + v : v; }
  function copyText(t) { // the clipboard, or the old way where a page may not use it
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).catch(function () { legacy(); });
    legacy(); return Promise.resolve();
    function legacy() {
      var ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
    }
  }
  function refTag(x) { // an item's ID next to its name, to use in a chat ("link PRB-5 to TSK-34"); a click copies it
    if (!x || !x.ref) return null;
    var t = el("span", "ref", x.ref); t.title = "Copy " + x.ref;
    t.addEventListener("click", function (e) {
      e.stopPropagation(); e.preventDefault(); copyText(x.ref);
      t.classList.add("copied"); setTimeout(function () { t.classList.remove("copied"); }, 1200);
    });
    return t;
  }
  function titled(cls, x, name) { var s = el("span", cls, name); var r = refTag(x); if (r) s.appendChild(r); return s; } // a name with its ID after it
  function problemOf(r) {
    return { kind: "problem", url: cleanUrl(r.url), name: clean(r.Name) || "Untitled", type: r.Type || "", status: r.Status || "",
      waiting: clean(r["Waiting on"]), ref: refOf("problem", r.Ref), summary: clean(r.Summary),
      opened: dnum(r["date:Opened:start"]), resolvedOn: dnum(r["date:Resolved on:start"]),
      pk: rel(r.Project).map(key)[0], mk: rel(r.Milestone).map(key)[0], tk: rel(r.Task).map(key)[0], chat: r.Chat || "", code: r["Code session"] || "" };
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
  // The milestone that matters most right now, else (none open, or no milestones) the task outside any milestone, or null: a planned one
  // past its end, else one under way (late first, then not paused), else the next planned one. Open work is never "all done".
  function focusItem(msList, taskList) {
    var t = todayNum();
    function late(m) { return m.late > 0; }
    function head(base) {
      var now = base.filter(function (m) { return m.status === "In progress" || m.status === "Paused" || m.status === "Waiting"; });
      return base.filter(function (m) { return m.status === "Planned" && late(m); })[0]
        || now.filter(late)[0] || now.filter(function (m) { return !m.paused; })[0] || now[0]
        || base.filter(function (m) { return m.status === "Planned" && !late(m) && (m.start == null || m.start >= t || !now.length); })[0] || null;
    }
    return head(sortItems(msList)) || head(taskList.filter(function (k) { return !k.ms; }));
  }
  // Where a project stands, one set of rules for its card and its page: every milestone that is late, under way, paused or holds a late task
  // (with its late tasks, then its current one), a task outside any milestone that is late or under way, every blocker, then what comes
  // next — the next milestone, else the next task outside any. Without milestones its tasks take their place. A milestone not late itself
  // but holding a late task is `Behind` when it has not started, so the label says what is wrong there. Lines with something late come
  // first, then blockers, then the rest in the plan's order; next is last.
  // A line: { kind: "late" | "blocked" | "now" | "next", label, cls, item, subs: [tasks] }.
  function standing(msList, taskList, blockers) {
    var byTasks = !msList.length, late = [], now = [], shown = {};
    function put(x, subs) {
      var bad = x.late > 0 || subs.some(function (k) { return k.late > 0; });
      var label = x.late > 0 ? "Late" : x.paused ? "Paused" : x.status === "Waiting" ? "Waiting" : x.status === "Planned" ? "Behind" : "Now"; // planned: only with a late task
      (bad ? late : now).push({ kind: bad ? "late" : "now", label: label, cls: x.late > 0 || label === "Behind" ? "crit" : "", item: x, subs: subs }); shown[x.url] = 1;
    }
    if (byTasks) sortItems(taskList).forEach(function (k) { if (isOpen(k) && (k.late > 0 || k.status !== "Planned")) put(k, []); });
    else {
      sortItems(msList).forEach(function (m) {
        if (!isOpen(m) && m.status !== "Paused") return;
        var lt = sortItems(m.tasks.filter(function (k) { return isOpen(k) && k.late > 0; })), cur = m.paused ? null : currentTask(m.tasks);
        if (!(m.late > 0) && !lt.length && m.status === "Planned") return; // not started, nothing late in it: the next one at most
        put(m, cur && lt.indexOf(cur) < 0 ? lt.concat([cur]) : lt);
      });
      sortItems(taskList.filter(function (k) { return !k.ms && isOpen(k) && (k.late > 0 || k.status !== "Planned"); })).forEach(function (k) { put(k, []); }); // outside any milestone
    }
    function nextOf(list) { return sortItems(list).filter(function (x) { return x.status === "Planned" && !(x.late > 0) && !shown[x.url] && !x.paused; })[0]; }
    var lines = late.concat((blockers || []).map(function (i) { return { kind: "blocked", label: "Blocked", cls: "crit", item: i, subs: [] }; }), now);
    var next = byTasks ? nextOf(taskList) : nextOf(msList) || nextOf(taskList.filter(function (k) { return !k.ms; }));
    if (next) lines.push({ kind: "next", label: "Next", cls: "", item: next, subs: [] });
    return lines;
  }
  // standing's lines drawn the same on the card and the page: a label, the item, its timing (a blocker: on whom); under a milestone its late
  // tasks, each marked, then its current one. o.name(x, cls): the item's name as a node; o.long: a paused item says for how long; o.max,
  // o.subs: how many lines and tasks a card shows, the rest counted on one line ("+2 more, 1 late"); o.next: show next even when something
  // else is shown (the page).
  function standRows(lines, o) {
    var box = el("div", "stand"), list = o.next ? lines : lines.filter(function (l) { return l.kind !== "next"; });
    if (!list.length && !o.next) list = lines; // nothing under way: what comes next is the line
    var shown = o.max ? list.slice(0, o.max) : list, rest = list.slice(shown.length);
    function when(w, lead) { return el("span", "w " + (w[1] || ""), (lead || "") + w[0]); } // its timing, in its colour
    shown.forEach(function (ln) {
      var r = el("div", "st-row " + ln.kind), w = ln.kind === "blocked" ? [onWhom(ln.item), "crit"] : whenOf(ln.item, o.long);
      r.appendChild(el("span", "lab" + (ln.cls ? " " + ln.cls : ""), ln.label)); r.appendChild(o.name(ln.item, "t"));
      if (w[0]) r.appendChild(when(w, ln.kind !== "next" ? "" : ln.item.kind === "ms" ? "next milestone · " : "next task · "));
      var subs = o.subs ? ln.subs.slice(0, o.subs) : ln.subs, hid = ln.subs.slice(subs.length).filter(function (k) { return k.late > 0; }).length;
      subs.forEach(function (k) {
        var sb = el("div", "st-sub" + (k.late > 0 ? " bad" : ""));
        sb.appendChild(o.name(k, "n")); sb.appendChild(when(whenOf(k))); r.appendChild(sb);
      });
      if (hid) r.appendChild(el("div", "st-sub bad more", "+ " + plural(hid, "more late task")));
      box.appendChild(r);
    });
    if (rest.length) {
      var bad = rest.filter(function (l) { return l.kind === "late" || l.kind === "blocked"; }).length;
      box.appendChild(el("div", "st-more" + (bad ? " crit" : ""), "+ " + rest.length + " more" + (bad ? ", " + bad + " late or blocked" : "")));
    }
    return box;
  }
  // Why and since when an item is paused: its newest history line `- **Oct 6** — Paused (was In progress): <reason>` (SKILL.md → Pause)
  function pauseOf(hist) {
    var last = null;
    String(hist || "").split("\n").forEach(function (l) {
      var m = /^\s*-\s*\*\*([A-Z][a-z]{2}) (\d{1,2})(?:, (\d{4}))?\*\*\s*[—-]+\s*Paused\b[^:]*(?::\s*(.*))?$/.exec(l);
      if (!m || MON.indexOf(m[1]) < 0) return;
      var t = todayNum(), y = m[3] ? +m[3] : new Date().getFullYear(), n = Math.round(Date.UTC(y, MON.indexOf(m[1]), +m[2]) / DAY);
      if (!m[3] && n > t) n = Math.round(Date.UTC(y - 1, MON.indexOf(m[1]), +m[2]) / DAY);
      last = { since: n, reason: clean(String(m[4] || "").replace(/<[^>]+>/g, "")).replace(/\.$/, "") };
    });
    return last;
  }
  function pauseText(pz, long) { // "since Oct 6 · waiting on Kestrel for parts"; long adds how long
    if (!pz) return "paused";
    var d = todayNum() - pz.since;
    return "since " + fmt(pz.since) + (long && d > 0 ? " (" + days(d) + ")" : "") + " · " + (pz.reason || "no reason given");
  }
  // On whom an open task or problem is, said the same way wherever it shows: `Waiting on` empty is the user's move, a name is the party
  // we wait on (an agent too). A client's page says it by side (setSides). Nothing for a milestone (it has no `Waiting on`), a risk
  // (it waits on no one), anything paused, done, resolved or dropped.
  var SIDES = null; // a client's page: page id → "client" or "third", from its snapshot
  function setSides(m) { SIDES = m; }
  function onWhom(x) {
    if (x.kind === "problem" ? x.type === "Risk" || !(x.status === "Open" || x.status === "Waiting") : x.kind !== "task" || !OPEN_TASK[x.status] || x.paused) return "";
    if (!x.waiting) return SIDES ? "on our side" : "on you";
    return !SIDES ? "waiting on " + x.waiting : SIDES[key(x.url)] === "client" ? "on your side" : "with " + x.waiting;
  }
  function whenOf(m, long) { // on whom (a task), then its timing
    var who = onWhom(m), w = timing(m, long);
    return who ? [who + " · " + w[0], w[1]] : w;
  }
  function doneText(m, onTime) { // "done Oct 5, 4 d early"; onTime: say ", on time" too
    if (m.finished == null) return "done";
    return "done " + fmt(m.finished) + (m.late > 0 ? ", " + days(m.late) + " late" : m.late < 0 ? ", " + days(-m.late) + " early" : onTime && m.late === 0 ? ", on time" : "");
  }
  function timing(m, long) {
    var t = todayNum();
    if (m.status === "Done") return [doneText(m), ""];
    if (m.paused) return [m.kind === "task" && m.ms && m.ms.status === "Paused" ? "its milestone is paused" : pauseText(m.pause, long), ""];
    if (m.start == null) return [m.kind === "task" ? "no dates" : "no dates yet", ""];
    if (m.late > 0) return [days(m.late) + " late · was due " + fmt(m.end), "crit"];
    if (m.openEnd) return [(m.start > t ? "starts " + soon(m.start) : "since " + fmt(m.start)) + " · no end date", ""];
    var left = m.end - t;
    if (m.status === "In progress" || m.status === "Waiting" || m.start <= t) return ["due " + soon(m.end) + (left === 0 ? "" : " · " + days(left) + " left"), left <= 7 ? "warn" : ""];
    return ["starts " + soon(m.start) + " · due " + fmt(m.end), ""];
  }
  // A project's state, said the same way everywhere: d is its plan ({ms, tasks}), {err} when it failed to load, or nothing yet. trouble: the
  // project itself is in trouble (blocked, late, behind schedule) — its card's red edge; a plan that did not load is not that.
  function projectState(p, d, blockers, problemsUnknown) {
    if (d && d.err) return { text: "Not loaded", cls: "crit", dot: "crit" };
    if (!d) return { text: "", cls: "", dot: "" };
    if (p.status === "Paused") return { text: "Paused", cls: "", dot: "paused" };
    var items = d.ms.concat(d.tasks), t = todayNum(), going = !items.length || items.some(isOpen);
    if (blockers) return { text: "Blocked", cls: "crit", dot: "crit", trouble: true };
    // only the project's own: late and due against its `Target end`; an item inside late makes it behind schedule, an item due soon
    // says nothing here — its own line does
    if (p.target != null && p.target < t && going) return { text: days(t - p.target) + " late", cls: "crit", dot: "crit", trouble: true };
    if (items.some(function (x) { return isOpen(x) && x.late > 0; })) return { text: "Behind schedule", cls: "crit", dot: "crit", trouble: true };
    if (p.target != null && p.target - t <= 7 && going) return { text: p.target === t ? "Due today" : "Due in " + days(p.target - t), cls: "warn", dot: "warn" };
    if (!focusItem(d.ms, d.tasks)) return { text: items.length ? "All done" : "No plan yet", cls: "", dot: "good" };
    if (!items.some(function (x) { return isOpen(x) && x.end != null; })) return { text: "No dates", cls: "", dot: "ring" };
    if (problemsUnknown) return { text: "Problems unknown", cls: "", dot: "ring" }; // blockers may be there, unread
    return { text: "On track", cls: "good", dot: "cur" };
  }
  function planPhrase(m) {
    var t = todayNum();
    if (m.status === "Done") return [doneText(m, true), "good"];
    if (m.paused) return ["paused", ""];
    if (m.start == null) return [m.kind === "task" ? (m.status === "In progress" ? "in progress" : "no dates") : "no dates yet", m.status === "In progress" ? "acc" : ""];
    if (m.late > 0) return [days(m.late) + " late", "crit"];
    if (m.openEnd) return [m.start > t ? "starts in " + days(m.start - t) + " · no end date" : "started " + fmt(m.start) + " · no end date", m.start > t ? "" : "acc"];
    if (m.status === "In progress" || m.status === "Waiting" || m.start <= t) {
      var l = m.end - t;
      return [l === 0 ? "due today" : days(l) + " left", l <= 7 ? "warn" : m.status === "Waiting" ? "" : "acc"]; // waiting: its colour is on whom
    }
    return ["starts in " + days(m.start - t), ""];
  }
  var DOT = { done: "good", late: "crit", prog: "cur", wait: "warn", paused: "paused", nodate: "ring" }; // an item's state → its dot
  function itemDot(m) { return DOT[m.state] || ""; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function tipOf(x) { // the hover tip: state and dates (the name is on the bar already)
    var d = x.start == null ? (x.kind === "ms" ? "no dates yet" : "no dates") : range(x.start, x.end), ph = planPhrase(x)[0];
    if (x.status === "Done") return x.start == null ? cap(ph) : cap(ph) + " · " + d;
    if (x.paused) return (x.kind === "task" && x.ms && x.ms.status === "Paused" ? "Paused with its milestone" : "Paused " + pauseText(x.pause)) + " · " + d;
    var who = onWhom(x), st = x.status === "Waiting" && x.waiting ? cap(who) : [x.status || "Planned", who].filter(Boolean).join(" · "); // "Waiting on Gilad", "In progress · on you"
    return st + " · " + d + (x.late > 0 ? " · " + days(x.late) + " late" : x.start != null && !/^(no dates|in progress)/.test(ph) ? " · " + ph : "");
  }

  // ---------- the project page: which opened item's header is stuck, and where a fold leaves the page (pure: tests/check_drawer.py runs them) ----------
  // An opened item's header sticks to the top of the page while its item is read; one at a time: the innermost item being read. blocks:
  // the page's items that open in place, in document order, each { parent (the index of the block it is drawn in, or -1), open, top,
  // bottom (its box, from the view's top: one not drawn has no height), head (its header's height) }. Returns { at, under, top }:
  //  - at: the block whose header is stuck — the deepest that starts at or above the top and still has a header's height of itself below
  //    it, or -1; under: the blocks it is drawn in, whose headers give way to it;
  //  - top: where at's header sits (0, the top) while an opened item drawn right in it hands over: one arriving, its header rising into
  //    the top, pushes at's header up ahead of it; one leaving, its header pushed out by its own end, has at's header right under it,
  //    rising with it. Two headers never overlap.
  function stickPlan(blocks) {
    function drawn(i) { var b = blocks[i]; return b.bottom > b.top && (b.parent < 0 || blocks[b.parent].open && drawn(b.parent)); }
    var at = -1, under = [], top = 0;
    blocks.forEach(function (b, i) { if (b.open && b.top <= 0 && b.bottom - b.head >= 0 && drawn(i)) at = i; }); // later in the page and stuck too: drawn inside
    for (var i = at >= 0 ? blocks[at].parent : -1; i >= 0; i = blocks[i].parent) under.push(i);
    if (at >= 0) blocks.forEach(function (c, j) {
      if (c.parent !== at || !c.open) return; // an opened item drawn right in it; a closed row just scrolls under it
      if (c.top > 0 && c.top < blocks[at].head) top = c.top - blocks[at].head; // arriving
      else if (c.top <= 0 && c.bottom > 0 && c.bottom < c.head) top = c.bottom; // leaving
    });
    return { at: at, under: under, top: top };
  }
  // Where the page stands after a fold, so the folded item's header stays where the reader sees it: in its place, it stays put; stuck at
  // the top while its item was read (or scrolled away above), the item is moved up to where the header shows — at once, as a slide would
  // move the page under the reader — but never under the header of the item it is drawn in, which sticks again once it is folded.
  // s: { top (scrollTop), view (clientHeight), height (scrollHeight), pad (the room added below the page by an earlier fold), head (where
  // the header shows, from the view's top), from (where the item starts, the same way), under (the height of its parent's header, or 0),
  // shrink (how much shorter the fold makes the page) }. Returns { top, pad, now }: the scrollTop, the room below the page that keeps the
  // browser from pulling the page back where it ends, and whether to fold at once.
  function foldScroll(s) {
    var at = Math.max(s.under, s.head), now = s.from < at, top = Math.max(0, s.top + s.from - at);
    return { top: top, pad: Math.max(0, Math.ceil(top + s.view - (s.height - s.pad - s.shrink))), now: now };
  }

  // ---------- the timeline ----------
  var CHEV = '<svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5"/></svg>';
  // sizes on the timeline, in px
  var TL = { pad: 8, head: 24, box: 34, gap: 8, lane: 21, flat: 30, row: 46, row2: 58, nameH: 30, nameIn: 74, minBox: 8, narrowBox: 60, keepName: 64, chipMin: 64, segMin: 6,
    ph: 30 }; // ph: days an undated milestone's placeholder card spans
  function pack(bars) { var lanes = []; bars.forEach(function (g) { var i = 0; while (lanes[i] != null && lanes[i] >= g.start) i++; lanes[i] = g.end; g.lane = i; }); return lanes.length; }
  var measurer = null;
  function textW(s, font) { // how wide a text draws, in px, in the page's own font
    if (!measurer) { measurer = document.createElement("canvas").getContext("2d"); measurer.fam = getComputedStyle(document.body).fontFamily; }
    measurer.font = font + " " + measurer.fam; return Math.ceil(measurer.measureText(s).width);
  }
  function tint(x) { return x.state === "plan" || x.state === "nodate" ? "" : x.state; } // an item's state class: none when planned
  // On the timeline a late item keeps its own state's colour, and only the days past its end are red (lateTail)
  function tlTint(x) { return x.state !== "late" ? tint(x) : x.status === "In progress" ? "prog" : x.status === "Waiting" ? "wait" : ""; }
  function fades(x) { return x.openEnd && x.status !== "Done"; } // a start with no end, still open: drawn for the set span, fading where the end would be
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
  function hoverable(n, keys) {
    n.addEventListener("mouseenter", grow); n.addEventListener("mouseleave", shrink);
    if (keys) { n.addEventListener("focus", grow); n.addEventListener("blur", shrink); }
    return n;
  }
  function dragPan(host) { // a mouse drags the chart; touch and trackpads scroll natively
    var drag = null, moved = false;
    host.addEventListener("pointerdown", function (e) {
      moved = false;
      if (e.pointerType !== "mouse" || e.button !== 0 || e.target.closest(".tl-label")) return;
      drag = { x: e.clientX, l: host.scrollLeft };
    });
    window.addEventListener("pointermove", function (e) {
      if (!drag) return;
      if (Math.abs(e.clientX - drag.x) > 4) { moved = true; host.classList.add("dragging"); }
      if (moved) host.scrollLeft = drag.l - (e.clientX - drag.x);
    });
    window.addEventListener("pointerup", function () { drag = null; host.classList.remove("dragging"); });
    host.addEventListener("click", function (e) { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  }
  // Where a bar ends on the timeline: a done item at its finish (before its end date when early, after it when late); an open one at its
  // end date, or today once past it; a start with no end, still open, after the set span
  function dEnd(x) {
    if (x.status === "Done" && x.finished != null) return Math.max(x.finished, x.at);
    if (x.end == null) return x.at + TL.ph - 1;
    return x.late > 0 ? Math.max(x.end, todayNum()) : x.end;
  }
  function lateFrom(x) { return x.late > 0 && x.end != null ? x.end + 1 : null; } // the first day past its end, from which its bar is red
  // Where a milestone's card sits: over its own bar and every task's, so no task falls outside it (own: its own part, when it has dates
  // or is done); nowhere when neither it nor any task is placed
  function spanOf(m) {
    var d = (m.tasks || []).filter(function (k) { return k.at != null; }), s = d.map(function (k) { return k.at; }), e = d.map(dEnd);
    var own = m.at != null ? { start: m.at, end: dEnd(m) } : null;
    if (own) { s.push(own.start); e.push(own.end); }
    if (!s.length) return null;
    return { start: Math.min.apply(null, s), end: Math.max.apply(null, e), own: own, open: !!own && fades(m) };
  }
  // Where each open milestone without dates is drawn: in the plan's order, after the milestone before it ends (a dated one, or the placeholder
  // before it) — today at the earliest, so one following the milestone in progress starts when that one ends. ph: the days a placeholder spans.
  function placeholders(ms, t, ph) {
    var out = {}, at = t;
    sortItems(ms).forEach(function (m) {
      var sp = spanOf(m);
      if (sp) { at = Math.max(at, sp.end + 1); return; }
      if (!needsPlaceholder(m)) return;
      out[key(m.url)] = { start: at, end: at + ph - 1, placeholder: true }; at += ph;
    });
    return out;
  }
  function kidsIn(m, sp) { return (m.tasks || []).filter(function (k) { return k.at != null && dEnd(k) >= sp.start && k.at <= sp.end; }); }
  function datedIn(m, sp) { return kidsIn(m, sp).map(function (k) { return { m: k, start: Math.max(k.at, sp.start), end: Math.min(dEnd(k), sp.end) }; }); } // clipped to the card
  // Tasks without dates are normal — only the milestone is promised — so they sit in the card after the dated ones
  function undatedOf(m) { return (m.tasks || []).filter(function (k) { return k.at == null; }); }

  // The timeline of a page. ctx: the elements (host: the scrolling box; seg, today, info: the range buttons, Today and the legend's place),
  // range() and setRange(r), projects() in the order drawn, plan(p) ({ms, tasks} or nothing yet), err(p) (its plan failed to load),
  // state(p) (its dot), opened (project key → 1 when its tasks show as chips) with saveOpen(), open(p, itemKey), empty() (the text with no projects).
  function timeline(ctx) {
    var view = null, stickQueued = false;
    function paintRange() { var bs = ctx.seg.querySelectorAll("button"); for (var i = 0; i < bs.length; i++) bs[i].setAttribute("aria-pressed", String(bs[i].dataset.r === ctx.range())); }
    function chrome() {
      [["1", "1 month"], ["3", "3 months"], ["6", "6 months"], ["12", "Year"], ["all", "All"]].forEach(function (r) {
        var b = btn("", r[1], function () { ctx.setRange(r[0]); paintRange(); render(true); }); b.dataset.r = r[0]; ctx.seg.appendChild(b);
      });
      paintRange();
      ctx.today.addEventListener("click", function () { render(true); });
      var ib = btn("icon-btn", null), pop = el("div", "pop"); ib.innerHTML = ICO.info;
      ib.setAttribute("aria-label", "What the colours mean"); ib.setAttribute("aria-expanded", "false"); pop.hidden = true;
      var lg = el("div", "lg");
      [["tl-b box prog", "Milestone in progress"], ["tl-b box", "Milestone planned"], ["tl-b box prog", "Late: the days past its end date, to today or to when it was done", true],
       ["tl-b box done", "Done"], ["tl-b box paused", "Paused (❚❚), never counted as late"], ["tl-b box nodate", "No dates yet (?): drawn from today"],
       ["tl-chip wait", "A task waiting on someone"]
      ].forEach(function (x) {
        var sw = el("span", "sw"), b = el("span", x[0]); if (x[2]) { var t = el("span", "tl-late"); t.style.left = "45%"; b.appendChild(t); }
        sw.appendChild(b); lg.appendChild(sw); lg.appendChild(span(x[1]));
      });
      pop.appendChild(lg);
      pop.appendChild(el("div", "", "A milestone is a striped card over its dates in its state's colour: ◆ and its name, its tasks below — a line when closed, " +
        "named chips when ▸ opens the project. A done one ends where it was finished; a start with no end date runs a month and fades. " +
        "Days past an end date are red: to today while it is open, to its finish once done. A grey card with ? has no dates yet: it is drawn over its tasks, or else after the milestone before it in the " +
        "plan — from today at the earliest. Drag or scroll sideways to move in time. Click anything to read the details."));
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
      function underToday(n, w) { var d = X(n) - X(t); return d > -w && d < 28; } // a date label w wide would touch the Today tag, centred on today
      function firstOf(n, k) { var d = new Date(n * DAY); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + k, 1) / DAY; } // the 1st of n's month, k months on
      function wday(n) { return new Date(n * DAY).getUTCDay(); }
      var mstarts = [];
      for (var mc = firstOf(a, 0); mc < b; mc = firstOf(mc, 1)) if (mc >= a) mstarts.push(mc);
      var byMonth = function (n) { return mstarts.some(function (m) { return Math.abs(X(n) - X(m)) < Math.min(30, Math.max(14, 2.5 * px)); }); };
      if (rg === "1") for (var we = a; we < b; we++) if (wday(we) === 6 || (we === a && wday(we) === 0)) { // weekends, a band each, under the bars
        var wend = Math.min(wday(we) === 6 ? we + 2 : we + 1, b), band = el("div", "tl-we");
        band.style.left = (LW + X(we)) + "px"; band.style.width = (X(wend) - X(we)) + "px"; tl.appendChild(band);
      }
      if (rg === "1") for (var dy = a; dy < b; dy++) if (mstarts.indexOf(dy) < 0 && wday(dy) !== 1) line(dy, "day");
      if (rg === "1" || rg === "3") {
        for (var wk = a + ((8 - wday(a)) % 7); wk < b; wk += 7) {
          if (byMonth(wk)) continue;
          line(wk, "wk");
          var wd = new Date(wk * DAY), md = wd.getUTCDate(), dim = new Date(Date.UTC(wd.getUTCFullYear(), wd.getUTCMonth() + 1, 0)).getUTCDate();
          if (underToday(wk, 30) || (md - 1) * px < 34 || (dim - md + 1) * px < 20) continue;
          var wl = el("div", "tl-wk", String(md)); wl.style.left = (LW + X(wk)) + "px"; months.appendChild(wl);
        }
      }
      var freeX = -1e9;
      mstarts.forEach(function (cur) {
        var dd = new Date(cur * DAY), nxt = firstOf(cur, 1), jan = dd.getUTCMonth() === 0;
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
      // placed tasks drawn as bars of their own: those without a milestone (one with a milestone sits inside its card, which covers it)
      var spans = {}; ms.forEach(function (m) { spans[key(m.url)] = spanOf(m); });
      var bars = tasks.filter(function (k) { return k.at != null && !(k.ms && spans[key(k.ms.url)]); })
        .map(function (k) { return { m: k, start: k.at, end: dEnd(k) }; });
      var drawn = function (m) { return spans[key(m.url)] || needsPlaceholder(m); }; // a milestone that gets a card
      var hasTasks = ms.some(function (m) { // a card with tasks to show: undated ones, or dated ones within its span
        var sp = spans[key(m.url)];
        return drawn(m) && (m.tasks || []).some(function (k) { return k.at == null || sp && kidsIn(m, sp).indexOf(k) >= 0; });
      }), open = !!ctx.opened[p.key] && hasTasks;
      function lateTail(n, m, from) { // the days past its end, in red, inside its bar: from its end date to today, or to when it was done; from: the day the bar starts
        var lf = lateFrom(m); if (lf == null) return;
        var t = el("span", "tl-late"); t.style.left = Math.max(X(lf) - X(from), 0) + "px"; n.appendChild(t);
      }
      function bar(g, top, cls) {
        var m = g.m, x0 = X(g.start), x1 = X(g.end + 1);
        var b = btn("tl-b " + (cls || "") + " " + tlTint(m) + (fades(m) ? " open" : ""), null, function () { ctx.open(p, key(m.url)); });
        b.appendChild(el("span", "tl-bn", m.name)); b.title = tipOf(m); lateTail(b, m, g.start);
        b.style.left = (LW + x0) + "px"; b.style.width = Math.max(x1 - x0 - 3, 6) + "px"; b.style.top = top + "px";
        r.appendChild(hoverable(b, true)); return b;
      }
      function box(m, sp, top, hgt) { // a milestone as a card: its state's stripes, ◆ and its name, its tasks inside
        var x0 = X(sp.start), x1 = X(sp.end + 1), undated = m.start == null && m.status !== "Done"; // a done one sits at its finish without a plan
        var cls = "tl-b box" + (undated ? " nodate" : "") + (sp.placeholder ? " ph" : "") + (fades(m) ? " open" : "") + (tlTint(m) ? " " + tlTint(m) : "");
        var b = btn(cls, null, function () { ctx.open(p, key(m.url)); });
        var hd = el("span", "tl-bh"); hd.appendChild(el("span", "tl-ms")); hd.appendChild(el("span", "tl-bn", m.name));
        if (undated) { var q = el("span", "tl-q", "?"); q.title = "No dates yet"; hd.appendChild(q); }
        lateTail(b, m, sp.start); b.appendChild(hd);
        if (sp.own) [[sp.start, sp.own.start - 1, "l"], [sp.own.end + 1, sp.end, "r"]].forEach(function (x) { // beyond its own dates, over its tasks: paler
          if (x[1] < x[0]) return;
          var e = el("span", "tl-ext " + x[2]); e.style.left = (X(x[0]) - x0) + "px"; e.style.width = (X(x[1] + 1) - X(x[0])) + "px"; b.appendChild(e);
        });
        b.style.left = (LW + x0) + "px"; b.style.width = Math.max(x1 - x0 - 3, TL.minBox) + "px"; b.style.top = top + "px"; b.style.height = hgt + "px";
        if (x1 - x0 < TL.narrowBox) b.classList.add("narrow"); // too small for ◆, name and ?: the ? stays, the rest shows under the cursor
        b.title = tipOf(m);
        r.appendChild(hoverable(b, true)); return { bar: b, x0: x0, sp: sp };
      }
      // Closed: the milestone's tasks as one line inside its card, in plan order — a share each where the card has room (TL.segMin px a task),
      // else one share per state, as wide as its count; either way the card's height never grows with its tasks. A late open task is red.
      var STATES = [["done", "done"], ["late", "late"], ["prog", "in progress"], ["wait", "waiting"], ["paused", "paused"], ["", "planned"]];
      function stripState(k) { return k.state === "plan" || k.state === "nodate" ? "" : k.state; }
      function strip(b, m) {
        var ks = sortItems(kidsIn(m, b.sp).concat(undatedOf(m))); if (!ks.length) return false;
        var w = Math.max(X(b.sp.end + 1) - X(b.sp.start) - 3, TL.minBox), inset = Math.min(TL.pad, Math.floor(w / 4)), tr = el("span", "tl-strip");
        tr.style.left = tr.style.right = inset + "px";
        function share(cls, from, n, of) {
          var sg = el("span", "tl-seg " + cls); sg.style.left = (from / of * 100) + "%"; sg.style.width = "calc(" + (n / of * 100) + "% - 2px)";
          tr.appendChild(sg); return sg;
        }
        if ((w - 2 * inset) / ks.length >= TL.segMin) ks.forEach(function (k, i) {
          var sg = share(stripState(k), i, 1, ks.length); sg.title = k.name + " — " + tipOf(k); /* a share shows no name, so its tip does */
          sg.addEventListener("click", function (e) { e.stopPropagation(); ctx.open(p, key(k.url)); });
        });
        else {
          var at = 0, said = [];
          STATES.forEach(function (st) {
            var n = ks.filter(function (k) { return stripState(k) === st[0]; }).length; if (!n) return;
            share(st[0], at, n, ks.length); at += n; said.push(n + " " + st[1]);
          });
          tr.title = plural(ks.length, "task") + " · " + said.join(", "); // a click opens the milestone, where each task is listed
        }
        b.bar.appendChild(tr); return true;
      }
      // A dated chip spans its dates. A name that does not fit in it is written after it instead, on a faint plaque joined to it that starts with a short leader —
      // always after, so the names read down the card in date order; near the card's end it runs past the card, into its line's empty space (an opened milestone has the line to itself).
      // Lines are packed by what is drawn, name included, so no name is cut or runs into another chip.
      function chipPlan(m, sp) {
        var items = datedIn(m, sp).map(function (g) {
          var l = Math.max(X(g.start) - X(sp.start) + 3, 4), w = Math.max(X(g.end + 1) - X(g.start) - 7, 8), tw = textW(g.m.name, "500 11.5px"), it = { m: g.m, from: g.start, l: l, w: w, tw: tw };
          it.out = tw + 14 > w; it.start = l; it.end = it.out ? l + w + 15 + tw + 7 + 10 : l + w + 4; // a written name keeps clear of the next chip, so it is not read as that chip's
          return it;
        }).sort(function (a, b) { return a.start - b.start; });
        return { items: items, n: pack(items) };
      }
      // Tasks without dates follow on lines of their own, each chip as wide as its name and as many to a line as fit, so none is cut short
      // (a name wider than the whole card is the only one cut, and shows whole under the cursor).
      function undatedPlan(m, sp) {
        var cw = X(sp.end + 1) - X(sp.start) - 3, x = 4, line = 0;
        var items = undatedOf(m).map(function (k) {
          var w = Math.min(textW(k.name, "500 11.5px") + 15, Math.max(cw - 8, TL.chipMin));
          if (x > 4 && x + w > cw - 4) { line++; x = 4; }
          var it = { m: k, l: x, w: w, line: line }; x += w + 4; return it;
        });
        return { items: items, n: items.length ? line + 1 : 0 };
      }
      function chipLines(m, sp) { return chipPlan(m, sp).n + undatedPlan(m, sp).n; }
      function chips(b, m) { // opened up: the milestone's tasks as named chips inside its card (reachable by mouse; the card itself takes focus)
        function go(k) { return function (e) { e.stopPropagation(); ctx.open(p, key(k.url)); }; }
        function chip(k, top, name) {
          var c = el("span", "tl-chip " + tlTint(k) + (fades(k) ? " open" : "")); c.style.top = top + "px";
          if (name) c.appendChild(el("span", "tl-cn", k.name)); // its own span, so the red of its late days stays under it
          c.title = tipOf(k); c.addEventListener("click", go(k));
          b.bar.appendChild(hoverable(c)); return c;
        }
        var plan = chipPlan(m, b.sp), nd = plan.n;
        plan.items.forEach(function (g) {
          var top = TL.head + g.lane * TL.lane, c = chip(g.m, top, !g.out); c.style.left = g.l + "px"; c.style.width = g.w + "px"; lateTail(c, g.m, g.from);
          if (!g.out) return;
          c.classList.add("tailed"); var o = el("span", "tl-cout " + tlTint(g.m), g.m.name); o.style.top = top + "px"; o.style.left = (g.l + g.w) + "px";
          o.title = c.title; o.addEventListener("click", go(g.m)); b.bar.appendChild(o);
          [c, o].forEach(function (n) { // one thing under the cursor
            n.addEventListener("mouseenter", function () { c.classList.add("lit"); o.classList.add("lit"); });
            n.addEventListener("mouseleave", function () { c.classList.remove("lit"); o.classList.remove("lit"); });
          });
        });
        undatedPlan(m, b.sp).items.forEach(function (g) { var c = chip(g.m, TL.head + (nd + g.line) * TL.lane, true); c.style.left = g.l + "px"; c.style.width = g.w + "px"; });
      }
      function glab(text, y, go) { if (ax.top) return; var g = btn("tl-glab", text, go); g.title = text; g.style.top = (y + 1) + "px"; lab.appendChild(g); }
      var h;
      if (!ms.length) { // tasks only: the dated ones are the row; a task without dates is not drawn
        var nl = pack(bars); bars.forEach(function (g) { bar(g, TL.pad + g.lane * TL.flat); }); h = Math.max(nl, 1) * TL.flat + 16;
      } else if (!open) { // one card per milestone, its tasks as a strip
        var BH = hasTasks ? TL.box : TL.head, HL = BH + TL.gap, places = placeholders(ms, t, PH);
        var items = ms.map(function (m) { var sp = spans[key(m.url)]; return sp ? { m: m, start: sp.start, end: sp.end, sp: sp } : null; }).filter(Boolean); // dated cards
        ms.forEach(function (m) { var sp = places[key(m.url)]; if (sp) items.push({ m: m, start: sp.start, end: sp.end, sp: sp }); });
        var n = pack(items);
        items.forEach(function (g) {
          var top = TL.pad + g.lane * HL, mid = top + (BH - TL.head) / 2;
          var b = box(g.m, g.sp, top, BH);
          if (!strip(b, g.m)) { b.bar.style.height = TL.head + "px"; b.bar.style.top = mid + "px"; }
        });
        var nl0 = pack(bars); bars.forEach(function (g) { bar(g, TL.pad + n * HL + g.lane * TL.lane, "task"); });
        h = Math.max(n, 1) * HL + TL.pad + nl0 * TL.lane;
      } else { // opened up: each milestone on its own line, its name also in the left column (on a phone, on its card only)
        var y = ax.top ? TL.pad : ax.two ? 54 : 36, places2 = placeholders(ms, t, PH);
        sortItems(ms).forEach(function (m) {
          var sp = spans[key(m.url)];
          if (!sp && !needsPlaceholder(m)) return;
          glab(m.name, y, function () { ctx.open(p, key(m.url)); });
          if (!sp) sp = places2[key(m.url)];
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
      ps.forEach(function (p) { // every dated item in range, and a placeholder after a long milestone too
        var d = ctx.plan(p); if (!d) return;
        var pl = placeholders(d.ms || [], t, TL.ph);
        Object.keys(pl).forEach(function (k) { b = Math.max(b, pl[k].end + 14); });
        d.ms.concat(d.tasks).forEach(function (m) { if (m.at != null) { a = Math.min(a, m.at - 7); b = Math.max(b, dEnd(m) + 14); } });
      });
      // a phone has no left column: each project's name is a line of its own above its bars, and the bars get the whole width
      var narrow = window.innerWidth <= 640, LW = narrow ? 0 : 220, vw = host.clientWidth || 700;
      var spanD = SPANS[ctx.range()] || (b - a), px = Math.max((Math.max(vw, 320) - LW - 2) / spanD, narrow ? 4.5 : 0), W = Math.round((b - a) * px);
      var ax = { a: a, b: b, t: t, px: px, LW: LW, top: narrow ? TL.nameH : 0, X: function (n) { return Math.round((n - a) * px); } };
      var keepDay = view ? view.a + host.scrollLeft / view.px : null;
      var tl = el("div", "tl" + (narrow ? " phone" : "")); tl.style.width = Math.max(LW + W, vw) + "px"; tl.style.setProperty("--lw", LW + "px"); tl.style.setProperty("--vw", vw + "px");
      drawAxis(tl, ax);
      ps.forEach(function (p) {
        var st = ctx.state(p), r = el("div", "tl-row" + (narrow ? " top" : "")), lab = el("div", "tl-label"), area = narrow ? el("div", "tl-area") : r;
        var car = btn("car", null, function (e) { // ▸ opens the project's tasks as chips, or folds them; the row grows to its new height
          e.stopPropagation(); var h0 = r.offsetHeight;
          if (ctx.opened[p.key]) delete ctx.opened[p.key]; else ctx.opened[p.key] = 1;
          ctx.saveOpen(); render(false);
          var r2 = ctx.host.querySelector('.tl-row[data-k="' + sel(p.key) + '"]'); if (r2) growTo(r2, h0);
        });
        r.dataset.k = p.key;
        car.addEventListener("mousedown", function (e) { e.preventDefault(); }); // focusing it would scroll the chart back to its start
        car.innerHTML = CHEV; lab.appendChild(car); lab.appendChild(el("span", "dot " + st.dot));
        var nb = btn("nm", p.name, function () { ctx.open(p); }); nb.title = p.name; lab.appendChild(nb); r.appendChild(lab); if (narrow) r.appendChild(area);
        ax.two = !narrow && textW(p.name, "500 13.5px") > LW - TL.nameIn; // the name takes two lines in the left column
        if (ctx.err(p)) { var fn = el("div", "tl-fail", "Plan didn't load. Refresh to retry."); fn.style.left = (LW + Math.max(0, ax.X(t - 14)) + TL.pad) + "px"; area.appendChild(fn); }
        var res = drawRow(area, lab, p, ax);
        if (!res.hasTasks) { car.classList.add("none"); car.disabled = true; car.setAttribute("aria-hidden", "true"); car.tabIndex = -1; }
        car.setAttribute("aria-expanded", String(res.open)); car.setAttribute("aria-label", res.open ? "Hide tasks" : "Show tasks"); car.title = res.open ? "Hide tasks" : "Show tasks";
        if (narrow) { area.style.height = Math.max(res.h, TL.row - 12) + "px"; r.style.height = (TL.nameH + Math.max(res.h, TL.row - 12)) + "px"; }
        else r.style.height = Math.max(res.h, ax.two ? TL.row2 : TL.row) + "px";
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
  function typeTag(t) { return el("span", "tt " + (t || ""), t || "Item"); }
  function groupTitle(text, n) { var g = el("div", "grp-t"); g.appendChild(span(text)); g.appendChild(span(String(n), "n")); return g; } // a group's label and count
  function doneCount(list) { return list.filter(function (x) { return x.status === "Done"; }).length; }
  function phraseEl(parts) { // [text, cls] parts on one line, a dot between
    var s = el("span", "s");
    parts.forEach(function (p) {
      if (!p || !p[0]) return;
      if (s.childNodes.length) s.appendChild(document.createTextNode(" · "));
      s.appendChild(span(p[0], p[1] || ""));
    });
    return s;
  }
  function originApart(p) { return !!p.origin && (!p.client || p.client.toLowerCase() !== p.origin.toLowerCase()); } // its origin is said after its client, unless it is the client
  function whoOf(p) { return [p.client || "", originApart(p) ? p.origin : ""].filter(Boolean).join(" · "); } // client · origin, once when they are the same
  function rowPhrase(m) { // a plan row's line: its status where the timing alone does not say it, on whom (a task), then the timing
    var ph = planPhrase(m), st = null, who = onWhom(m);
    if (!m.paused && m.status === "In progress" && !/in progress/.test(ph[0])) st = ["in progress", ""];
    else if (!m.paused && m.status === "Planned" && !/^starts in/.test(ph[0])) st = ["planned", ""];
    else if (!m.paused && m.status === "Waiting" && !m.waiting) st = ["waiting", "warn"];
    return [st, who ? [who, m.status === "Waiting" && m.waiting && !ph[1] ? "warn" : ""] : null, ph]; // one colour per row: waiting's, unless the timing has one
  }
  function problemLines(list, go) { // the problems on a milestone or task, as one of its page's parts; go(i, name): a problem's name as a link to it
    if (!list.length) return null;
    var bx = el("div", "part"); bx.appendChild(el("div", "xh", "Problems"));
    var ls = el("div", "plines after-xh");
    list.forEach(function (i) {
      var l = el("div", "pline"), stt = i.status === "Resolved" ? "resolved" : onWhom(i); // a risk says nothing
      l.appendChild(typeTag(i.type)); l.appendChild(go(i, i.name)); if (stt) l.appendChild(span(stt, "muted"));
      ls.appendChild(l);
    });
    bx.appendChild(ls); return bx;
  }
  function meta(x, bits) { // the few facts the row's own header does not already say, on one quiet line
    var d = el("div", "meta");
    bits.filter(function (b) { return b != null && b !== ""; }).forEach(function (b, n) { if (n) d.appendChild(span(" · ", "sep")); d.appendChild(typeof b === "string" ? span(b) : b); });
    if (d.childNodes.length) x.appendChild(d);
  }
  function msFacts(x, m) { // the group's header already says the status, the dates, the timing and how many tasks are done
    meta(x, [m.project.status === "Paused" && m.status !== "Done" ? "the project is paused" : ""]);
  }
  // The row's header already says its status, on whom, dates and timing; outside the plan, which milestone it is in. go(item, text): a link
  // to another item.
  function taskFacts(x, k, go, inPlan) {
    var inMs = null; if (k.ms && !inPlan) { inMs = span("in "); inMs.appendChild(go(k.ms, k.ms.name)); }
    meta(x, [inMs]);
  }
  // the project's facts, under its name and time: whose it is, then what extra(pair) adds (where its work lives)
  function projectSummary(p, extra) {
    var dl = el("dl", "dr-sum");
    function pair(k, v, none) {
      var d = el("div"), dd = el("dd", none ? "none" : "");
      if (typeof v === "string") dd.textContent = v; else dd.appendChild(v);
      d.appendChild(el("dt", "", k)); d.appendChild(dd); dl.appendChild(d); return d;
    }
    var o = originApart(p) ? span(" · " + p.origin, "w") : null;
    if (p.client || o) { var c = span(p.client || "none"); if (o) c.appendChild(o); pair("Client", c, !p.client); }
    if (extra) extra(pair);
    return dl.childNodes.length ? dl : null;
  }
  // The plan's earliest start to the project's own end: { text, bad } — bad: its Target end is before that start, said as it is, in red
  function projectDates(p, plan) {
    var starts = plan.map(function (x) { return x.start; }).filter(function (x) { return x != null; }), s0 = starts.length ? Math.min.apply(null, starts) : null;
    if (s0 == null) return { text: p.target != null ? "until " + fmt(p.target) : "no dates" };
    if (p.target == null) return { text: "from " + fmt(s0) };
    return p.target >= s0 ? { text: range(s0, p.target) } : { text: fmt(s0) + " – " + fmt(p.target), bad: true };
  }
  // the project's own time, nothing from inside it (Where it stands says that): left, due, late or no end date; paused or all done instead
  function projectLine(p, st) {
    var t = todayNum(), x = p.status === "Paused" ? ["Paused", ""] : st.text === "All done" ? ["All done", "good"]
      : p.target == null ? ["no end date", "muted"] : p.target < t ? [days(t - p.target) + " late", "crit"]
      : p.target === t ? ["Due today", "warn"] : [days(p.target - t) + " left", p.target - t <= 7 ? "warn" : ""];
    var s = el("div", "dr-st"); s.appendChild(span(x[0], x[1])); return s;
  }
  // The marks drawn in the text's colour: the project page's sections (by their key) and a few more both pages use
  var ICO = {
    info: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 7.2v3.6M8 5.2v.1"/></svg>',
    items: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="M8 5.5v3M8 10.5v.1"/></svg>',
    resolved: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="M5.6 8.2 7.3 9.9 10.5 6.4"/></svg>',
    plan: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h6M5 8h8.5M3.5 12h5"/></svg>',
    about: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3.5h10M3 6.5h10M3 9.5h10M3 12.5h6"/></svg>',
    notes: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h5.5L12 5v8.5H4z"/><path d="M6 8h4M6 10.5h4"/></svg>',
    private: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>',
    history: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3.2l2 1.3"/></svg>',
    out: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 2.5h4v4M13.5 2.5 8 8M11.5 9.5v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3"/></svg>'
  };

  // The project page's pieces. ctx: ui (open: items and sub-pages opened or closed, col: sections folded — kept across repaints),
  // host() (the box the page scrolls in), msBody(x, m) and taskBody(x, k) (what an opened milestone or task shows), itemActions(item) (an
  // item's own buttons, or nothing on a client's page). Every item that opens in place — a milestone, a task, a problem — is one kind of
  // block: .blk, its header strip (.blk-h: the .acc-h that opens and folds it, and once open its buttons), its body (.blk-b), the item in
  // ._item, its key on the page in data-k. An opened item's header sticks while its item is read, one at a time (stick).
  function page(ctx) {
    var ui = ctx.ui;
    // A header that opens and folds what is under it: a role="button", not a <button>, since buttons sit in it (an item's own, Expand
    // all), whose clicks never toggle (skip: the selector they match)
    function pressable(h, on, toggle, skip) {
      h.setAttribute("role", "button"); h.tabIndex = 0; h.setAttribute("aria-expanded", String(on));
      h.addEventListener("click", function (e) { if (!e.target.closest(skip)) toggle(); });
      h.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target === h) { e.preventDefault(); toggle(); } });
    }
    function changed(n, open) { n.dispatchEvent(new CustomEvent("fold", { bubbles: true, detail: { open: open } })); } // "fold": the page's layout changed
    // o: k, item, cls (ms, row, row tsk), open (until the viewer chooses), dot, title, line, right, fill(x) (the body, made when it first opens).
    // Its header is one grid, the same folded, opened and stuck: a meta line — its ID, its dates (right), the item's buttons (.acts) and the
    // chevron — then its name, then its line. The buttons are there when folded too, unseen, so opening only fades them in and nothing in
    // the row moves.
    function block(o) {
      var on = ui.open["d:" + o.k] != null ? !!ui.open["d:" + o.k] : !!o.open, b = el("div", "blk " + o.cls + (on ? " open" : ""));
      b.dataset.k = o.k; b._item = o.item;
      var h = el("div", "blk-h acc-h"), tl = el("span", "tl"), l2 = el("span", "l2"), acts = ctx.itemActions(o.item), rt = refTag(o.item);
      pressable(h, on, function () { setOpen(b, !b.classList.contains("open")); }, ".acts");
      tl.appendChild(el("span", "t", o.title)); if (rt) tl.appendChild(rt); // its name, its ID after it
      if (o.line) l2.appendChild(o.line);
      if (o.right) l2.appendChild(el("span", "r", o.right));
      h.appendChild(el("span", "dot " + (o.dot || ""))); h.appendChild(tl); h.appendChild(l2);
      if (acts) { acts.classList.add("acts"); h.appendChild(acts); }
      h.insertAdjacentHTML("beforeend", CHEV);
      var x = el("div", "blk-b"); x.hidden = !on;
      b._fill = function () { if (!b._filled) { b._filled = true; o.fill(x); } };
      b.appendChild(h); b.appendChild(x); if (on) b._fill(); return b;
    }
    function setOpen(b, on) { // opens or folds a block
      var h = b.firstChild, x = b.lastChild;
      if (b.classList.contains("open") === on) return;
      ui.open["d:" + b.dataset.k] = on;
      var mark = function () { b.classList.toggle("open", on); h.setAttribute("aria-expanded", String(on)); };
      if (on) { b._fill(); mark(); unfold(x); } else fold(h, b, x, mark, function () { return !b.classList.contains("open"); });
      stick(); changed(b, on);
    }
    // One header stuck at a time (stickPlan): the innermost opened item being read; the headers of the items it is drawn in give way
    // (.under), and while an inner item's header arrives at the top or leaves it, the stuck one keeps right above or below it. Run on every
    // scroll, fold and repaint.
    function stick() {
      var sc = ctx.host(), v = sc.getBoundingClientRect().top, els = [].slice.call(sc.querySelectorAll(".blk"));
      var plan = stickPlan(els.map(function (e) {
        var r = e.getBoundingClientRect();
        return { parent: els.indexOf(e.parentNode.closest(".blk")), open: e.classList.contains("open"), top: r.top - v, bottom: r.bottom - v, head: e.firstChild.offsetHeight };
      }));
      els.forEach(function (e, j) {
        var h = e.firstChild;
        h.classList.toggle("under", plan.under.indexOf(j) >= 0); h.style.top = j === plan.at && plan.top ? plan.top + "px" : "";
      });
    }
    function unfold(body) { body.hidden = false; slide(body, true); }
    // Folds body (under head, inside box) so head stays where the reader sees it, stuck or not (foldScroll): mark() turns the head at once,
    // shut() says at the end whether it is still folded. The room a fold adds below the page goes once the reader scrolls it out of view (trim).
    function fold(head, box, body, mark, shut) {
      var sc = ctx.host(), v = sc.getBoundingClientRect().top, hb = head.getBoundingClientRect(), bb = box.getBoundingClientRect(), up = box.parentNode.closest(".blk.open");
      var r = foldScroll({ top: sc.scrollTop, view: sc.clientHeight, height: sc.scrollHeight, pad: padOf(sc),
        head: hb.top - v, from: bb.top - v, under: up ? up.firstChild.offsetHeight : 0, shrink: bb.height - hb.height });
      sc.style.paddingBottom = r.pad ? r.pad + "px" : "";
      mark();
      if (!r.now) { slide(body, false, function () { if (shut()) body.hidden = true; }); return; }
      body.getAnimations().forEach(function (a) { a.cancel(); }); body.hidden = true; sc.scrollTop = r.top;
    }
    function padOf(sc) { return parseFloat(sc.style.paddingBottom) || 0; }
    function trim() { var sc = ctx.host(), p = padOf(sc); if (p && sc.scrollTop + sc.clientHeight <= sc.scrollHeight - p) sc.style.paddingBottom = ""; }
    // A big section of the page, its icon and fold kept by its key; its header folds it, open by default — shut: folded until the reader
    // opens it (About the project)
    function dsec(host, ico, title, n, right, shut) {
      var off = ico in ui.col ? !!ui.col[ico] : !!shut;
      var s = el("section", "dsec" + (off ? " folded" : "")), hh = el("div", "dsec-h"), b = el("div", "dsec-b"); s.dataset.sec = ico;
      pressable(hh, !off, function () { setFold(s, !s.classList.contains("folded")); }, ".gall");
      hh.innerHTML = ICO[ico]; hh.appendChild(el("h3", "", title));
      if (n != null) hh.appendChild(el("span", "cnt", String(n)));
      if (right) { right.classList.add("r"); hh.appendChild(right); }
      hh.insertAdjacentHTML("beforeend", CHEV);
      b.hidden = off;
      s.appendChild(hh); s.appendChild(b); host.appendChild(s); return b;
    }
    function setFold(s, shut) {
      if (s.classList.contains("folded") === shut) return;
      var hh = s.firstChild, b = s.lastChild; ui.col[s.dataset.sec] = shut ? 1 : 0; // kept either way: a section folded by default stays open once opened
      var mark = function () { s.classList.toggle("folded", shut); hh.setAttribute("aria-expanded", String(!shut)); };
      if (shut) fold(hh, s, b, mark, function () { return s.classList.contains("folded"); }); else { mark(); unfold(b); }
      changed(s, !shut);
    }
    function dates(x) { return x.start == null ? "" : range(x.start, x.end); }
    function taskRow(k, inPlan) {
      return block({ k: key(k.url), item: k, cls: "row" + (inPlan ? " tsk" : ""), dot: itemDot(k), title: k.name, line: phraseEl(rowPhrase(k)), right: dates(k),
        fill: function (x) { ctx.taskBody(x, k, true); } });
    }
    function msGroup(m, open) { // a milestone and everything in it: opening it shows its details, then its tasks
      var det = el("div", "mdet"), done = m.tasks.length ? [doneCount(m.tasks) + " of " + plural(m.tasks.length, "task") + " done", ""] : null;
      var g = block({ k: key(m.url), item: m, cls: "ms", open: open, dot: itemDot(m), title: m.name, line: phraseEl(rowPhrase(m).concat([done])), right: dates(m),
        fill: function () { ctx.msBody(det, m); } });
      g.lastChild.appendChild(det); if (m.tasks.length) g.lastChild.appendChild(taskList(m.tasks)); // its tasks are there from the start, so one asked for is found
      return g;
    }
    function allBtn(rows, what) { // "Expand all" / "Collapse all" for a list of blocks; it follows their state
      var b = btn("gall", ""); b.title = "Open or fold all the " + what;
      function open(r) { return r.classList.contains("open"); }
      function paint() { var closed = !rows().every(open); b.textContent = closed ? "Expand all" : "Collapse all"; b.dataset.open = closed ? "1" : ""; }
      b.addEventListener("click", function (e) {
        e.stopPropagation(); var on = !!b.dataset.open;
        rows().forEach(function (r) { setOpen(r, on); }); paint();
      });
      b.paint = paint; return b;
    }
    function taskList(tasks) { // "Tasks N" and the tasks; with several, one button opens or folds them all
      var w = el("div", "mtw"), tl = el("div", "mtl"); tl.appendChild(span("Tasks")); tl.appendChild(span(String(tasks.length), "n")); w.appendChild(tl);
      tasks.forEach(function (x) { w.appendChild(taskRow(x, true)); });
      if (tasks.length > 1) {
        var all = allBtn(function () { return [].slice.call(w.querySelectorAll(":scope > .blk")); }, "tasks");
        tl.appendChild(all); w.addEventListener("fold", all.paint); all.paint();
      }
      return w;
    }
    // As an item's header: a meta line (ID, dates, its buttons), the name, its own time; then its facts (and, from the page, its description
    // folded under them)
    function projectHead(host, p, st, plan, extra) {
      var hd = el("header", "dr-head"), mt = el("div", "dr-meta"), acts = ctx.itemActions(p), rt = refTag(p);
      if (rt) mt.appendChild(rt);
      var pd = projectDates(p, plan), ds = mt.appendChild(span(pd.text, "r" + (pd.bad ? " crit" : "")));
      if (pd.bad) ds.title = "Its Target end is before the first start in its plan";
      if (acts) { acts.classList.add("acts"); mt.appendChild(acts); }
      hd.appendChild(mt);
      hd.appendChild(el("h1", "", p.name)); hd.appendChild(projectLine(p, st));
      var sum = projectSummary(p, extra); if (sum) hd.appendChild(sum);
      host.appendChild(hd); return hd;
    }
    function focusBlock(lines, summary) { // where it stands: the summary, then the card's lines (standing) in full, next included; a name goes to its item
      var fc = el("div", "focus");
      if (summary) fc.appendChild(el("p", "fsum", summary));
      function go(x, cls) { var b = btn("go " + cls, x.name, function () { reveal(key(x.url)); }); b.title = "Go to it"; return b; }
      if (lines.length) fc.appendChild(standRows(lines, { next: true, long: true, name: go }));
      return fc.childNodes.length ? fc : null;
    }
    // The plan: milestones with their tasks under them; tasks without a milestone at the end. ms0, tk0: nothing while loading; head: the
    // item in focus (focusItem); o: err (why it didn't load), empty (the text with no plan)
    function planSec(body, ms0, tk0, head, o) {
      var done = ms0 && ms0.length ? doneCount(ms0) + " of " + ms0.length + " milestones done" : tk0 && tk0.length ? doneCount(tk0) + " of " + tk0.length + " tasks done" : "";
      var b2 = dsec(body, "plan", "Plan", null, done ? span(done, "muted") : null);
      if (!ms0) b2.appendChild(el("div", o.err ? "err" : "empty", o.err ? "The plan didn't load. " + o.err : "Loading…"));
      else if (!ms0.length && !tk0.length) b2.appendChild(el("div", "empty", o.empty));
      else {
        sortItems(ms0).forEach(function (m) { // the milestone under way, late or in focus starts open
          b2.appendChild(msGroup(m, m.status === "In progress" || (m.late > 0 && OPEN_MS[m.status]) || m === head));
        });
        if (ms0.length > 1) { // as a panel on the overview: its head opens or folds every milestone
          var ma = allBtn(function () { return [].slice.call(b2.querySelectorAll(":scope > .blk.ms")); }, "milestones"), hd = b2.parentNode.querySelector(".dsec-h");
          hd.insertBefore(ma, hd.querySelector(".chev"));
          b2.addEventListener("fold", function (e) { if (e.target.parentNode === b2) ma.paint(); }); ma.paint();
        }
        var loose = sortItems(tk0.filter(function (k) { return !k.ms; }));
        if (loose.length) {
          if (ms0.length) b2.appendChild(groupTitle("Other tasks", loose.length));
          loose.forEach(function (k) { b2.appendChild(taskRow(k, ms0.length > 0)); });
        }
      }
      return b2;
    }
    function reveal(k) { // open an item on the page — and the section and blocks it is drawn in — and bring it into view
      var host = ctx.host(), b = ["", "w:", "r:"].map(function (p) { // the plan's row first, else the open items' or resolved one's
        return host.querySelector('.blk[data-k="' + sel(p + k) + '"]');
      }).filter(Boolean)[0];
      if (!b) return;
      var sec = b.closest(".dsec"); if (sec) setFold(sec, false);
      for (var g = b.parentNode.closest(".blk"); g; g = g.parentNode.closest(".blk")) setOpen(g, true);
      setOpen(b, true);
      b.scrollIntoView({ block: "start", behavior: smooth() }); // at the top its own header is the one stuck
      b.classList.remove("flash"); void b.offsetWidth; b.classList.add("flash");
    }
    return { block: block, stick: stick, fold: fold, unfold: unfold, changed: changed, trim: trim, dsec: dsec, setFold: setFold,
      projectHead: projectHead, focusBlock: focusBlock, planSec: planSec, reveal: reveal };
  }

  window.PT = {
    DAY: DAY, OPEN_MS: OPEN_MS, SPANS: SPANS, CHEV: CHEV, ICO: ICO,
    el: el, clear: clear, link: link, btn: btn, span: span, nodash: nodash, cleanUrl: cleanUrl, unesc: unesc, plain: plain, notionText: notionText, clean: clean,
    key: key, plural: plural, smooth: smooth, sel: sel, keep: keep, slide: slide, foldDetails: foldDetails,
    dnum: dnum, todayNum: todayNum, fmt: fmt, soon: soon, range: range, days: days, hhmm: hhmm,
    refOf: refOf, setRefPrefixes: setRefPrefixes, refTag: refTag, titled: titled, whoOf: whoOf,
    problemOf: problemOf, buildPlan: buildPlan, isOpen: isOpen, ageOf: ageOf, ageCls: ageCls, sortItems: sortItems, worstLate: worstLate, focusItem: focusItem,
    standing: standing, standRows: standRows, onWhom: onWhom, setSides: setSides, pauseOf: pauseOf, pauseText: pauseText, projectState: projectState,
    planPhrase: planPhrase, dEnd: dEnd, lateFrom: lateFrom, fades: fades, tlTint: tlTint, spanOf: spanOf, projectDates: projectDates, doneCount: doneCount, stickPlan: stickPlan, foldScroll: foldScroll,
    timeline: timeline, typeTag: typeTag, groupTitle: groupTitle, problemLines: problemLines, meta: meta, msFacts: msFacts, taskFacts: taskFacts, page: page
  };
})();
