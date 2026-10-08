/* Project Tracker: the dashboard itself, shared by both pages. dashboard.html runs it live from Notion through the viewer's connector
   (window.PT_ROOT, the tracker's root page); client.html runs it on a snapshot (window.PT_DATA, from data.js) for a client — the same
   page without what is internal: no Private notes, Notion links or chats, and the open items by whose side they are on. */
(function () {
  "use strict";
  var ROOT_PAGE = window.PT_ROOT || "", SNAP = window.PT_DATA || null; // live from Notion, or a client's snapshot
  var NOTION = "Notion";
  var STRUCT = { staleTime: 300000, gcTime: 86400000 }; // pages, databases, view ids: change rarely
  var DATA = { staleTime: 60000, gcTime: 86400000 };    // rows and page bodies
  var POLL = 600000;
  var ORIGINS = ["Upwork", "Direct", "Personal"];

  var S = { cfg: null, projects: null, projErr: null, plan: {}, pageInfo: {}, problems: null, problemsErr: null, resolved: null, resolvedErr: null, lastUpdate: 0, range: "3", origin: "All", tlView: null, tlOpen: {}, shown: false };
  try { var r0 = localStorage.getItem("pt.range"); if (SPANS[r0] || r0 === "all") S.range = r0; } catch (e) {}
  try { var o0 = localStorage.getItem("pt.origin"); if (o0) S.origin = o0; } catch (e) {}
  try { var t0 = JSON.parse(localStorage.getItem("pt.tlOpen") || "{}"); if (t0 && typeof t0 === "object") S.tlOpen = t0; } catch (e) {}

  var $ = function (id) { return document.getElementById(id); };
  var ON_US = SNAP ? "on our side" : "on you"; // a problem nobody else has to act on, as the user's page and a client's page say it
  var el = PT.el, clear = PT.clear, link = PT.link, btn = PT.btn, span = PT.span, nodash = PT.nodash, cleanUrl = PT.cleanUrl, unesc = PT.unesc, clean = PT.clean, rel = PT.rel, key = PT.key, plural = PT.plural, smooth = PT.smooth, sel = PT.sel, keep = PT.keep;
  var dnum = PT.dnum, todayNum = PT.todayNum, fmt = PT.fmt, soon = PT.soon, range = PT.range, days = PT.days, hhmm = PT.hhmm;
  var OPEN_MS = PT.OPEN_MS, SPANS = PT.SPANS, CHEV = PT.CHEV, problemOf = PT.problemOf, isOpen = PT.isOpen, ageOf = PT.ageOf, ageCls = PT.ageCls, sortItems = PT.sortItems, currentTask = PT.currentTask, whenOf = PT.whenOf, planPhrase = PT.planPhrase, itemDot = PT.itemDot;
  var facts = PT.facts, actions = PT.actions, typeTag = PT.typeTag, phraseEl = PT.phraseEl, problemLines = PT.problemLines;
  function saveOpen() { try { localStorage.setItem("pt.tlOpen", JSON.stringify(S.tlOpen)); } catch (e) {} }

  // where a project comes from: an Origin property if the tracker has one, else from Source and Client
  function originOf(r) {
    var o = clean(r.Origin || ""); // the Projects select, with whatever options the user added
    if (o) return o;
    if (/upwork\.com/i.test(r.Source || "")) return "Upwork";
    if (!clean(r.Client)) return "Personal";
    return "Direct";
  }

  // ---------- connector errors ----------
  function errText(err) {
    switch (err && err.code) {
      case "needs_reauth": return "Reconnect Notion in claude.ai Settings → Connectors.";
      case "server_not_connected": case "selection_required": return "Add the Notion connector in claude.ai Settings → Connectors, then reload.";
      case "not_in_manifest": case "consent_required": return "Notion isn't allowed for this page. Allow it from the page's connector prompt and reload.";
      case "blocked_by_policy": case "approval_required": return "Your organization's policy blocks this Notion call.";
      case "server_unavailable": case "rate_limited": return "Notion didn't answer. Refresh in a minute.";
      case "tool_error": return "Notion reported an error: " + (err.message || "unknown");
      case "not_granted": case "capability_disabled": case "capability_removed": return "Live data isn't available in this view — open the page in claude.ai.";
      case "config": return err.message;
      default: return "Notion failed: " + ((err && err.message) || "unknown error");
    }
  }
  function isDenial(err) { return err && /^(needs_reauth|server_not_connected|selection_required|blocked_by_policy|approval_required|not_in_manifest|consent_required|not_granted|capability_disabled|capability_removed)$/.test(err.code); }

  // ---------- Notion access ----------
  var MCP = null;
  function touch(res) {
    var t = res && res.cache && res.cache.storedAt ? res.cache.storedAt : Date.now();
    if (t > S.lastUpdate) S.lastUpdate = t;
    paintLive();
  }
  function payload(res) { var p = res ? res.payload : null; if (typeof p === "string") { try { p = JSON.parse(p); } catch (e) {} } return p; }
  function fetchText(id, cache) {
    return MCP.callTool(NOTION, "notion-fetch", { id: id }, { cache: cache }).then(function (res) {
      touch(res); var p = payload(res); return p && typeof p === "object" ? String(p.text || "") : String(p || "");
    });
  }
  function queryView(viewUrl, max) {
    var rows = [];
    function page(cursor, n) {
      var data = { mode: "view", view_url: viewUrl, page_size: 100 };
      if (cursor) data.start_cursor = cursor;
      return MCP.callTool(NOTION, "notion-query-data-sources", { data: data }, { cache: DATA }).then(function (res) {
        touch(res); var p = payload(res) || {};
        rows = rows.concat(p.results || []);
        return p.has_more && p.next_cursor && n < (max || 5) ? page(p.next_cursor, n + 1) : rows;
      });
    }
    return page(null, 1);
  }
  function viewsOf(text) {
    var out = {}, re = /<view url="\{*view:\/\/([0-9a-f-]+)\}*">\s*(\{[\s\S]*?\})\s*<\/view>/g, m;
    while ((m = re.exec(text))) { try { var j = JSON.parse(m[2]); if (j && j.name) out[j.name] = m[1]; } catch (e) {} }
    return out;
  }
  function viewUrl(dbUrl, viewId) { return "https://app.notion.com/p/" + key(dbUrl) + "?v=" + nodash(viewId); }
  function contentOf(text) { var m = /<content>\n?([\s\S]*?)\n?<\/content>/.exec(text); return m ? m[1] : ""; }

  function loadConfig() { // root page → config IDs → databases → views by name
    return fetchText(ROOT_PAGE, STRUCT).then(function (txt) {
      var ids = {};
      ["projects", "milestones", "tasks", "problems", "open_items"].forEach(function (k) { var m = new RegExp("\\b" + k + ":\\s*`?([0-9a-f-]{32,36})").exec(txt); if (m) ids[k] = m[1]; });
      if (ids.open_items && !ids.tasks) throw { code: "config", message: "This tracker was made by version 0.x of the skill. Ask Claude in chat to upgrade it.", chat: "Upgrade my project tracker to the new version." };
      if (!ids.projects || !ids.problems) throw { code: "config", message: "The tracker's config toggle is missing database IDs. Run setup in chat to fix it.", chat: "Set up the project tracker: its config is missing database IDs." };
      var dbs = {}, re = /<database url="([^"]+)"[^>]*data-source-url="\{*collection:\/\/([0-9a-f-]+)\}*"/g, m;
      while ((m = re.exec(txt))) dbs[m[2]] = cleanUrl(m[1]);
      var pdb = dbs[ids.projects], qdb = dbs[ids.problems];
      if (!pdb || !qdb) throw { code: "config", message: "The Projects or Problems database is not on the tracker page. Run setup in chat to fix it.", chat: "Set up the project tracker: a database is missing from its page." };
      S.rootUrl = "https://app.notion.com/p/" + nodash(ROOT_PAGE); paintLive();
      return Promise.all([fetchText(pdb, STRUCT), fetchText(qdb, STRUCT)]).then(function (t) {
        var pv = viewsOf(t[0]), qv = viewsOf(t[1]);
        if (!pv["Active"] || !qv["Open"]) throw { code: "config", message: "The tracker's views are missing (Active, Open). Run setup in chat to fix them.", chat: "Set up the project tracker: its views are missing." };
        S.cfg = { active: viewUrl(pdb, pv["Active"]), open: viewUrl(qdb, qv["Open"]), resolved: qv["Recently resolved"] ? viewUrl(qdb, qv["Recently resolved"]) : null };
        return S.cfg;
      });
    });
  }

  function parseProjectPage(txt) { // status callout notes + the page's own parts, below its tabs (SKILL.md → Pages)
    var info = { notes: [], parts: partsOf("") };
    var c = /<callout[^>]*>([\s\S]*?)<\/callout>/.exec(txt);
    if (c) c[1].split("\n").forEach(function (line) { var l = clean(line); if (l && !/^(Now|Blocked on|Waiting on|Open):/i.test(l)) info.notes.push(l); });
    var body = contentOf(txt), t = body.lastIndexOf("</tabs>");
    info.parts = partsOf(t < 0 ? "" : body.slice(t + 7));
    return info;
  }
  var PART = /^#{1,3}\s+(Notes|Private notes|History)\s*$/; // the headings that split a page into its parts — by these alone, never by how a line looks
  function partsOf(tx) { // a page's text → { desc, notes, priv, hist }, each the text of its part
    var out = { desc: [], notes: [], priv: [], hist: [] }, cur = "desc", name = { "Notes": "notes", "Private notes": "priv", "History": "hist" };
    String(tx || "").split("\n").forEach(function (l) { var h = PART.exec(l.replace(/^\t+/, "").trim()); if (h) { cur = name[h[1]]; return; } out[cur].push(l); });
    for (var k in out) out[k] = out[k].join("\n").trim();
    return out;
  }
  function entriesIn(t) { return t ? t.split("\n").filter(function (l) { return l.trim() && !/^\t/.test(l); }).length : 0; } // a part's entries, for counts: its top-level lines
  var LOCK = '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>';
  function partHead(t, priv) { var h = el("div", "xh" + (priv ? " priv-h" : "")); if (priv) h.insertAdjacentHTML("beforeend", LOCK); h.appendChild(span(t)); if (priv) h.title = "Only you see this — never on a client dashboard"; return h; }
  function renderParts(box, pt, opts) { // a page's parts in their order, each under its label: Description, Notes, Private notes (never on a client's page), History
    var any = false;
    var ex = opts.extra ? opts.extra() : null; // the problems on a milestone or task, right after what it is
    [["Description", pt.desc, {}], ["", ex], ["Notes", pt.notes, {}], ["Private notes", SNAP ? "" : pt.priv, {}], ["History", pt.hist, { history: true }]].forEach(function (s) {
      if (!s[1]) return;
      if (!s[0]) { box.appendChild(s[1]); any = true; return; }
      var b = el("div", "part" + (s[0] === "Private notes" ? " priv-b" : "")); b.appendChild(partHead(s[0], s[0] === "Private notes"));
      var md = renderMd(s[1], s[2]); md.classList.add("after-xh"); b.appendChild(md); box.appendChild(b); any = true;
    });
    box.classList.add("parts");
    if (!any && opts.empty) box.appendChild(el("div", "muted", opts.empty));
    return any;
  }
  function tabView(txt, tab, want) { // a project page tab → its linked view block → the view's rows
    var m = new RegExp("<tab>\\s*" + tab + "\\s*<database url=\"([^\"]+)\"").exec(txt);
    if (!m) return Promise.reject({ code: "config", message: "No " + tab + " tab on this project page. Ask Claude in chat to fix the page." });
    var block = cleanUrl(m[1]);
    return fetchText(block, STRUCT).then(function (bt) {
      var v = viewsOf(bt), id = v[want] || v[Object.keys(v)[0]];
      if (!id) throw { code: "config", message: "The project's " + tab + " view was not found." };
      return queryView(viewUrl(block, id), 3);
    });
  }
  function loadProject(p) { // project page → callout, its own parts, Schedule (milestones) and Tasks (tasks) views, Done included
    return fetchText(p.url, DATA).then(function (txt) {
      S.pageInfo[p.key] = parseProjectPage(txt);
      return Promise.all([tabView(txt, "Schedule", "Schedule"), tabView(txt, "Tasks", "Tasks")]);
    }).then(function (r) {
      S.plan[p.key] = PT.buildPlan(p, r[0], r[1]);
    }, function (err) { if (!(S.plan[p.key] && S.plan[p.key].ms) || isDenial(err)) S.plan[p.key] = { err: err }; });
  }

  var loading = false;
  function loadAll() {
    if (loading || !MCP) return; loading = true;
    var cfgP = S.cfg ? Promise.resolve(S.cfg) : loadConfig();
    cfgP.then(function (cfg) {
      var pP = queryView(cfg.active, 3).then(function (rows) {
        var old = {}; (S.projects || []).forEach(function (p) { old[p.key] = p; });
        S.projects = rows.map(function (r) {
          var p = old[key(r.url)] || { kind: "project" };
          p.url = cleanUrl(r.url); p.key = key(r.url); p.name = clean(r.Name) || "Untitled"; p.client = clean(r.Client); p.status = r.Status || "";
          p.summary = clean(r.Summary); p.target = dnum(r["date:Target end:start"]); p.repo = r.Repository || ""; p.source = r.Source || ""; p.chat = r.Chat || ""; p.cproj = claudeProject(r["Claude project"]); p.origin = originOf(r);
          return p;
        }).filter(function (p) { return p.status === "Active" || p.status === "Paused"; });
        S.projErr = null; render();
        return Promise.all(S.projects.map(function (p) { return loadProject(p).then(render); }));
      }, function (err) { S.projErr = err; if (isDenial(err)) S.projects = null; render(); });
      var qP = queryView(cfg.open, 3).then(function (rows) { S.problems = rows; S.problemsErr = null; render(); }, function (err) { S.problemsErr = err; if (isDenial(err)) S.problems = null; render(); });
      var rP = cfg.resolved ? queryView(cfg.resolved, 1).then(function (rows) { S.resolved = rows; S.resolvedErr = null; render(); }, function (err) { S.resolvedErr = err; render(); }) : Promise.resolve();
      return Promise.all([pP, qP, rP]);
    }, function (err) {
      S.projErr = S.problemsErr = err; render();
    }).then(function () { loading = false; render(); }, function () { loading = false; render(); });
  }

  // ---------- derived data, filtered by origin ----------
  function shown(p) { return S.origin === "All" || p.origin === S.origin; }
  function projs() { return (S.projects || []).filter(shown); }
  function allProjByKey() { var o = {}; (S.projects || []).forEach(function (p) { o[p.key] = p; }); return o; }
  function projByKey() { var o = {}; projs().forEach(function (p) { o[p.key] = p; }); return o; }
  function loadedAll() { return !!S.projects && projs().every(function (p) { return S.plan[p.key]; }); }
  function planOf(p) { var d = S.plan[p.key]; return d && d.ms ? d : null; }
  function msList(p) { var d = planOf(p); return d ? d.ms : null; }
  function taskList(p) { var d = planOf(p); return d ? d.tasks : null; }
  function itemsOf(p) { var d = planOf(p); return d ? d.ms.concat(d.tasks) : []; }
  function allItems() { var out = []; projs().forEach(function (p) { out = out.concat(itemsOf(p)); }); return out; }
  function itemIndex() { var o = {}; (S.projects || []).forEach(function (p) { itemsOf(p).forEach(function (x) { o[key(x.url)] = x; }); }); return o; }
  function liveProblems() { var pk = projByKey(); return (S.problems || []).map(problemOf).filter(function (i) { return pk[i.pk] && (i.status === "Open" || i.status === "Waiting"); }); }
  function allProblems() { return (S.problems || []).map(problemOf).concat((S.resolved || []).map(problemOf)); }
  function openItems() { return allItems().filter(function (x) { return isOpen(x) && !x.paused; }); }
  function lateItems() { return openItems().filter(function (x) { return x.late > 0; }).sort(function (a, b) { return b.late - a.late; }); }
  function dueItems() { var t = todayNum(); return openItems().filter(function (x) { return !(x.late > 0) && x.end != null && x.end - t <= 7; }).sort(function (a, b) { return a.end - b.end || (a.kind === "ms" ? -1 : 1); }); }
  function worstLate(p) { return PT.worstLate(itemsOf(p)); }
  function nextEnd(p) { return itemsOf(p).filter(function (x) { return isOpen(x) && !x.paused; }).reduce(function (a, x) { return Math.min(a, x.end == null ? todayNum() + 30 : x.end); }, 1e9); }
  function blockersOf(p) { return liveProblems().filter(function (i) { return i.pk === p.key && i.type === "Blocker"; }); }
  function waitingOf(p) { // tasks waiting on someone and problems (not risks) with a name in Waiting on
    var tk = (taskList(p) || []).filter(function (k) { return k.status === "Waiting" && !k.paused; });
    var pr = liveProblems().filter(function (i) { return i.pk === p.key && i.waiting && i.type !== "Risk"; });
    return tk.concat(pr);
  }
  function sortedProjects() {
    var blocked = {}; liveProblems().forEach(function (i) { if (i.type === "Blocker") blocked[i.pk] = 1; });
    return projs().slice().sort(function (a, b) {
      var fa = S.plan[a.key] && S.plan[a.key].err ? 1 : 0, fb = S.plan[b.key] && S.plan[b.key].err ? 1 : 0;
      return (a.status === "Paused") - (b.status === "Paused") || fb - fa || (blocked[b.key] || 0) - (blocked[a.key] || 0) || worstLate(b) - worstLate(a) || nextEnd(a) - nextEnd(b) || a.name.localeCompare(b.name);
    });
  }
  function focusOf(p) { return PT.focusOf(msList(p) || [], taskList(p) || []); }
  function stateOfProject(p) { return PT.projectState(p, S.plan[p.key], blockersOf(p).length, !!(S.problemsErr && !S.problems)); }
  function failures() { return projs().filter(function (p) { return S.plan[p.key] && S.plan[p.key].err; }); }

  // ---------- the header ----------
  function renderHeader() {
    if (SNAP) return; // a client's page: one client, no origin filter
    var kinds = {}; (S.projects || []).forEach(function (p) { kinds[p.origin] = (kinds[p.origin] || 0) + 1; });
    var ks = ORIGINS.filter(function (k) { return kinds[k]; }).concat(Object.keys(kinds).filter(function (k) { return ORIGINS.indexOf(k) < 0; }));
    if (S.origin !== "All" && !kinds[S.origin] && S.projects) S.origin = "All";
    var tb = $("origin"); clear(tb); if (ks.length < 2) return;
    var total = (S.projects || []).length, lab = function (k) { return k === "All" ? "All projects" : k; }, cnt = function (k) { return k === "All" ? total : kinds[k]; };
    var b = btn("", null), menu = el("div", "dd-m"); menu.hidden = true; menu.setAttribute("role", "menu");
    b.appendChild(span(lab(S.origin))); b.appendChild(span(String(cnt(S.origin)), "n")); b.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.8 5 6.8 8 3.8"/></svg>');
    b.setAttribute("aria-haspopup", "menu"); b.setAttribute("aria-expanded", "false"); b.title = "Which projects to show, by Origin";
    b.addEventListener("click", function (e) { e.stopPropagation(); var on = menu.hidden; menu.hidden = !on; b.setAttribute("aria-expanded", String(on)); });
    ["All"].concat(ks).forEach(function (k) {
      var o = btn("", null, function () { S.origin = k; try { localStorage.setItem("pt.origin", k); } catch (e) {} TLN.reset(); paint(); });
      o.setAttribute("role", "menuitemradio"); o.setAttribute("aria-checked", String(S.origin === k)); o.appendChild(span(lab(k))); o.appendChild(span(String(cnt(k)), "n")); menu.appendChild(o);
    });
    tb.appendChild(b); tb.appendChild(menu);
  }
  function goTo(id) { var t = $(id); if (t) t.scrollIntoView({ behavior: smooth(), block: "start" }); }
  function renderPills() {
    var host = $("pills"); clear(host);
    if (S.projErr && !S.projects) { host.appendChild(el("span", "pl crit", "Couldn't read the tracker")); return; }
    var probs = S.problems ? liveProblems() : [], noIss = S.problemsErr && !S.problems, noPlan = S.shown && failures().length > 0; // never a confident 0 for data that was not read
    [[probs.filter(function (i) { return i.type === "Blocker"; }).length, "blocked", "crit", noIss, "Problems marked Blocker"],
     [lateItems().length, "overdue", "crit", noPlan, "Milestones and tasks past their end date"],
     [dueItems().length, "due soon", "warn", noPlan, "Milestones and tasks that end within the next 7 days"]].forEach(function (c) {
      var b = el("button", "pl" + (c[0] && c[2] ? " " + c[2] : "")); b.type = "button";
      b.appendChild(el("b", "", !S.shown ? "–" : c[3] ? (c[0] ? c[0] + "+" : "?") : String(c[0]))); b.appendChild(document.createTextNode(c[1]));
      b.title = c[3] ? "Part of the data did not load, so this count may be incomplete." : c[4];
      b.addEventListener("click", function () { goTo(SNAP ? "sideP" : "moveP"); });
      host.appendChild(b);
    });
  }

  // ---------- project cards ----------
  function renderCards() {
    var host = $("cards"), ps = sortedProjects(); clear(host);
    if (trackerErr()) { $("projCount").textContent = ""; host.appendChild(errBox("Couldn't read the tracker. ", trackerErr())); return; }
    if (!ps.length) host.appendChild(el("div", "empty", (S.projects || []).length ? "No projects of this kind." : "No active projects."));
    var mg = moveGroups(); onYouCache = {}; mg.onYou.forEach(function (x) { var k = x.pk || (x.project && x.project.key); onYouCache[k] = (onYouCache[k] || 0) + 1; });
    var act = ps.filter(function (p) { return p.status !== "Paused"; }).length;
    $("projCount").textContent = ps.length ? act + " active" + (ps.length - act ? ", " + (ps.length - act) + " paused" : "") : "";
    ps.forEach(function (p) { host.appendChild(card(p)); });
  }
  var onYouCache = {}; // filled once per paint by renderCards
  function onYouOf(p) { return onYouCache[p.key] || 0; }
  function card(p) {
    var c = btn("pc", null, function () { openProject(p); }), st = stateOfProject(p), f = focusOf(p), d = S.plan[p.key];
    var top = el("div", "pc-top"), nm = el("div", "mid");
    nm.appendChild(el("div", "pc-name", p.name)); nm.appendChild(el("div", "pc-who", [p.client, p.origin].filter(Boolean).join(" · ")));
    top.appendChild(nm); if (st.text) top.appendChild(el("span", "pill " + st.cls, st.text)); c.appendChild(top);
    var ms0 = msList(p) || [], tk0 = taskList(p) || [], strip = ms0.length ? ms0 : tk0;
    if (d && d.err) c.appendChild(el("div", "crit", "Its plan didn't load. " + errText(d.err)));
    else if (f.head) {
      var now = el("div", "pc-now"), w = whenOf(f.head);
      var label = f.head === f.next ? "Next" : f.head.late > 0 && f.head.status === "Planned" ? "Overdue" : f.head.paused ? "Paused" : f.head.status === "Waiting" ? "Waiting" : "Now";
      now.appendChild(el("span", "lab" + (label === "Overdue" ? " crit" : ""), label)); now.appendChild(el("span", "t", f.head.name));
      now.appendChild(el("span", "w " + (w[1] || ""), w[0]));
      if (f.task) { var sb = el("span", "pc-task"), tw = whenOf(f.task); sb.appendChild(span(f.task.name)); sb.appendChild(el("span", "w " + (tw[1] || ""), tw[0])); now.appendChild(sb); }
      c.appendChild(now);
      var blk = blockersOf(p)[0];
      if (blk) { var b2 = el("div", "pc-now"); b2.appendChild(el("span", "lab crit", "Blocked")); b2.appendChild(el("span", "t", blk.name)); b2.appendChild(el("span", "w crit", blk.waiting ? "waiting on " + blk.waiting : ON_US)); c.appendChild(b2); }
    } else if (d) c.appendChild(el("div", "muted", strip.length ? "Everything is done." : "No plan yet."));
    var foot = el("div", "pc-foot");
    if (strip.length) { var pr = el("div", "mstrip"); sortItems(strip).forEach(function (m) { pr.appendChild(el("i", m.state === "plan" ? "" : m.state)); }); foot.appendChild(pr); }
    var capn = el("div", "pc-cap"), done = strip.filter(function (m) { return m.status === "Done"; }).length;
    if (strip.length) capn.appendChild(span(done + " of " + strip.length + (ms0.length ? " milestones" : " tasks") + " done"));
    if (p.target != null) capn.appendChild(span("ends " + fmt(p.target)));
    var rk = liveProblems().filter(function (i) { return i.pk === p.key && i.type === "Risk"; }).length, wt = waitingOf(p).length, on = onYouOf(p);
    var cnt = [on ? on + " on you" : "", wt ? wt + " waiting" : "", rk ? plural(rk, "risk") : ""].filter(Boolean).join(" · ");
    if (SNAP) { var sd = sidesOf(p); cnt = [sd.you.length ? sd.you.length + " on your side" : "", sd.third.length ? sd.third.length + " with others" : "", rk ? plural(rk, "risk") : ""].filter(Boolean).join(" · "); }
    if (cnt) capn.appendChild(span(cnt, "r"));
    foot.appendChild(capn); c.appendChild(foot);
    return c;
  }

  // ---------- timeline ----------
  function renderGantt(toToday) { TLN.render(toToday); }

  // ---------- right column ----------
  function item(o) { // one line in a list; opens its project with the item in view
    var b = btn("it", null, o.go);
    b.appendChild(el("span", "mk " + (o.mark || "")));
    var mid = el("span", "mid"); mid.appendChild(el("span", "t", o.title)); mid.appendChild(el("span", "s", o.sub)); b.appendChild(mid);
    b.appendChild(el("span", "m " + (o.cls || ""), o.meta || ""));
    return b;
  }
  function problemItem(i, o) {
    var p = allProjByKey()[i.pk];
    return item({ mark: o.mark, title: i.name, sub: [p ? p.name : "", o.sub].filter(Boolean).join(" · "), meta: o.meta, cls: o.cls, go: function () { if (p) openProject(p, key(i.url)); } });
  }
  function planItem(m, o) {
    var where = m.kind === "task" && m.ms ? m.project.name + " · " + m.ms.name : m.project.name;
    return item({ mark: o.mark, title: m.name, sub: [where, o.sub].filter(Boolean).join(" · "), meta: o.meta, cls: o.cls, go: function () { openProject(m.project, key(m.url)); } });
  }
  function anyItem(x, o) { return x.kind === "problem" ? problemItem(x, o) : planItem(x, o); }
  function gh(host, title, n, cls) { var h = el("div", "gh" + (cls ? " " + cls : "")); h.appendChild(span(title)); if (n != null) h.appendChild(span(String(n), "n")); host.appendChild(h); }
  function moveGroups() { // what asks for an action now, each thing once
    var t = todayNum(), probs = S.problems ? liveProblems() : [], seen = {};
    function once(x) { var k = key(x.url); if (seen[k]) return false; seen[k] = 1; return true; }
    var blocked = probs.filter(function (i) { return i.type === "Blocker"; }).sort(function (a, b) { return (ageOf(b) || 0) - (ageOf(a) || 0); }).filter(once);
    var overdue = lateItems().filter(once), due = dueItems().filter(once);
    var tasksOnMe = allItems().filter(function (k) {
      if (k.kind !== "task" || !isOpen(k) || k.paused || k.status === "Waiting" || k.waiting) return false;
      if (k.status === "In progress") return true;
      if (k.start != null) return k.start <= t + 7;
      return !k.ms || k.ms.status === "In progress"; // an undated step of the work under way
    }).sort(function (a, b) { return (a.status === "In progress" ? 0 : 1) - (b.status === "In progress" ? 0 : 1) || (a.start == null ? 1e9 : a.start) - (b.start == null ? 1e9 : b.start); });
    var questions = probs.filter(function (i) { return !i.waiting && i.type === "Question"; }).sort(function (a, b) { return (a.opened || 1e9) - (b.opened || 1e9); });
    var onYou = tasksOnMe.concat(questions).filter(once);
    var needs = allItems().filter(function (m) { return m.kind === "ms" && OPEN_MS[m.status] && m.start == null && !m.paused; }).filter(once);
    return { blocked: blocked, overdue: overdue, due: due, onYou: onYou, needs: needs };
  }
  function renderMove() {
    var host = $("moveList"), mg = moveGroups();
    var groups = [
      ["Blocked", "crit", mg.blocked, function (i) { return problemItem(i, { mark: "crit", sub: i.waiting ? "waiting on " + i.waiting : "on you", meta: ageOf(i) != null ? days(ageOf(i)) : "", cls: "crit" }); }],
      ["Overdue", "crit", mg.overdue, function (m) { return planItem(m, { mark: "crit", sub: (m.kind === "task" && m.status === "Waiting" && m.waiting ? "waiting on " + m.waiting + " · " : "") + "was due " + fmt(m.end), meta: days(m.late) + " late", cls: "crit" }); }],
      ["Due soon", "warn", mg.due, function (m) { return planItem(m, { mark: "warn", sub: m.status === "Planned" ? "not started" : m.status === "Waiting" && m.waiting ? "waiting on " + m.waiting : "", meta: soon(m.end), cls: "warn" }); }],
      ["On you", "", mg.onYou, function (x) {
        if (x.kind === "problem") { var a = ageOf(x); return problemItem(x, { sub: "decide", meta: a != null ? days(a) : "", cls: ageCls(a) }); }
        return planItem(x, { sub: x.status === "In progress" ? "in progress" : "", meta: x.start == null ? "no date" : x.start > todayNum() ? "starts " + soon(x.start) : "due " + soon(x.end) });
      }],
      ["Needs dates", "", mg.needs, function (m) { return planItem(m, { sub: m.status === "In progress" ? "in progress" : "planned", meta: "" }); }]
    ];
    keep(host, function () {
      clear(host); var n = 0;
      if (trackerErr()) { host.appendChild(el("div", "empty", "Nothing to show until the tracker loads.")); $("moveCount").textContent = ""; return; }
      if (S.problemsErr && !S.problems) host.appendChild(errBox("Problems didn't load. ", S.problemsErr));
      groups.forEach(function (g) { if (!g[2].length) return; n += g[2].length; gh(host, g[0], g[2].length, g[1]); g[2].forEach(function (x) { host.appendChild(g[3](x)); }); });
      if (!n) host.appendChild(el("div", "empty", "Nothing needs you right now."));
      $("moveCount").textContent = n ? String(n) : "";
    });
  }
  function renderWaiting() {
    var host = $("waitList");
    keep(host, function () {
      clear(host);
      if (trackerErr()) { host.appendChild(el("div", "empty", "Nothing to show until the tracker loads.")); $("waitCount").textContent = ""; return; }
      if (S.problemsErr && !S.problems) host.appendChild(errBox("Problems didn't load. ", S.problemsErr));
      var w = []; projs().forEach(function (p) { w = w.concat(waitingOf(p)); });
      var groups = {}; w.forEach(function (x) { (groups[x.waiting || "Someone"] = groups[x.waiting || "Someone"] || []).push(x); });
      function since(x) { var a = ageOf(x); return a == null ? -1 : a; }
      var parties = Object.keys(groups).map(function (k) { var g = groups[k].sort(function (a, b) { return since(b) - since(a); }); return { k: k, g: g, oldest: since(g[0]) }; })
        .sort(function (a, b) { return b.oldest - a.oldest || a.k.localeCompare(b.k); });
      $("waitCount").textContent = w.length ? String(w.length) : "";
      if (!parties.length) { if (!(S.problemsErr && !S.problems)) host.appendChild(el("div", "empty", "No one to chase.")); return; }
      parties.forEach(function (pt) {
        gh(host, pt.k, pt.g.length > 1 ? pt.g.length : null, "");
        pt.g.forEach(function (x) {
          var a = ageOf(x), late = x.kind === "task" && x.late > 0;
          host.appendChild(anyItem(x, { mark: late ? "crit" : ageCls(a), sub: x.kind === "problem" ? (x.type === "Blocker" ? "blocks you" : x.type.toLowerCase()) : late ? days(x.late) + " late" : x.end != null ? "due " + fmt(x.end) : "", meta: a != null ? days(a) : "", cls: late ? "crit" : ageCls(a) }));
        });
      });
    });
  }
  function renderDone() {
    var t = todayNum(), pk = projByKey(), out = [];
    allItems().forEach(function (m) { if (m.status === "Done" && m.finished != null && t - m.finished <= 7) out.push({ x: m, when: m.finished }); });
    (S.resolved || []).map(problemOf).forEach(function (i) { if (pk[i.pk] && i.status === "Resolved" && i.resolvedOn != null && t - i.resolvedOn <= 7) out.push({ x: i, when: i.resolvedOn }); });
    out.sort(function (a, b) { return b.when - a.when; });
    $("doneCount").textContent = out.length ? String(out.length) : "";
    var host = $("doneList"); clear(host);
    if (trackerErr()) { $("doneCount").textContent = ""; host.appendChild(el("div", "empty", "Nothing to show until the tracker loads.")); return; }
    if (S.resolvedErr && !S.resolved) host.appendChild(errBox("Resolved problems didn't load. ", S.resolvedErr));
    if (!out.length) { if (!(S.resolvedErr && !S.resolved)) host.appendChild(el("div", "empty", "Nothing finished in the last 7 days.")); return; }
    out.forEach(function (o) { var x = o.x; host.appendChild(anyItem(x, { sub: x.kind === "problem" ? "resolved" : x.kind === "ms" ? "milestone" : "task", meta: fmt(o.when), cls: "good" })); });
  }

  // ---------- a client's page: the snapshot, and the open items by whose side they are on ----------
  function loadSnapshot(D) { // data.js: per project its row, milestones, tasks and problems, rows as the views return them (references/client-dashboards.md)
    S.side = {}; S.projects = []; S.problems = []; S.resolved = []; S.cfg = {}; S.snapPages = {};
    var pub = function (t) { var pt = partsOf(t), o = []; if (pt.desc) o.push(pt.desc); if (pt.notes) o.push("## Notes\n" + pt.notes); if (pt.hist) o.push("## History\n" + pt.hist); return o.join("\n\n"); }; // Private notes never reach a client's page, even if the data has them
    for (var sp in D.subpages || {}) S.snapPages[key(sp)] = D.subpages[sp];
    (D.projects || []).forEach(function (x) {
      var r = x.project || {}, p = { kind: "project", url: cleanUrl(r.url), key: key(r.url), name: clean(r.Name) || "Untitled", client: clean(r.Client), status: r.Status || "", summary: clean(r.Summary), target: dnum(r["date:Target end:start"]), origin: "" };
      var plan = PT.buildPlan(p, x.milestones || [], x.tasks || []);
      S.plan[p.key] = plan; S.pageInfo[p.key] = { notes: [], parts: partsOf(pub(r.page)) }; S.projects.push(p);
      (x.milestones || []).concat(x.tasks || [], x.problems || []).forEach(function (row) { if (row.page) S.snapPages[key(row.url)] = pub(row.page); });
      (x.tasks || []).concat(x.problems || []).forEach(function (row) { if (row.Side) S.side[key(row.url)] = row.Side; });
      (x.problems || []).forEach(function (row) {
        var q = {}; for (var k in row) if (k !== "page") q[k] = row[k]; q.Project = JSON.stringify([p.url]);
        (q.Status === "Resolved" ? S.resolved : S.problems).push(q);
      });
    });
    var t = D.title || (S.projects.length === 1 ? S.projects[0].name : S.projects[0] ? S.projects[0].client : "Project status");
    $("ttl").textContent = t; if (/^__TITLE/.test(document.title)) document.title = t;
    var up = Date.parse(D.updated || ""); S.lastUpdate = isNaN(up) ? 0 : up; paintLive();
  }
  function sidesOf(p) { // its open items by whose side they are on: the client's, ours (nobody else to act), a third party's; risks apart
    var out = { you: [], us: [], third: [], risk: [] };
    liveProblems().filter(function (i) { return !p || i.pk === p.key; }).concat((p ? [p] : projs()).reduce(function (a, q) { return a.concat((taskList(q) || []).filter(function (k) { return k.status === "Waiting" && !k.paused; })); }, []))
      .forEach(function (x) { out[x.kind === "problem" && x.type === "Risk" ? "risk" : !x.waiting ? "us" : S.side[key(x.url)] === "client" ? "you" : "third"].push(x); });
    ["you", "us", "third", "risk"].forEach(function (k) { out[k].sort(function (a, b) { return (a.type === "Blocker" ? 0 : 1) - (b.type === "Blocker" ? 0 : 1) || (ageOf(b) || 0) - (ageOf(a) || 0); }); });
    return out;
  }
  function renderSides() { // the right column of a client's page: one list of what is open, by side
    var host = $("sideList"), sd = sidesOf(null), n = sd.you.length + sd.us.length + sd.third.length + sd.risk.length;
    keep(host, function () {
      clear(host); $("sideCount").textContent = n ? String(n) : "";
      if (!n) { host.appendChild(el("div", "empty", "Nothing open right now.")); return; }
      [["On your side", sd.you], ["On our side", sd.us], ["With third parties", sd.third], ["Risks to keep in mind", sd.risk]].forEach(function (g) {
        if (!g[1].length) return; gh(host, g[0], g[1].length, "");
        g[1].forEach(function (x) {
          var a = ageOf(x), late = x.kind === "task" && x.late > 0, blk = x.kind === "problem" && x.type === "Blocker";
          var sub = [x.kind === "problem" ? (blk ? "blocker" : x.type.toLowerCase()) : "task", x.waiting && g[1] !== sd.us ? x.waiting : "", late ? days(x.late) + " late" : x.kind === "task" && x.end != null ? "due " + fmt(x.end) : ""].filter(Boolean).join(" · ");
          host.appendChild(anyItem(x, { mark: late || blk ? "crit" : ageCls(a), sub: sub, meta: a != null ? days(a) : "", cls: late ? "crit" : ageCls(a) }));
        });
      });
    });
  }

  // ---------- the project page ----------
  S.open = {}; S.body = {}; S.dr = null;
  var bodyWaiters = {}; // url → repaint functions of the boxes showing it
  function pageBody(host, url, opts) { // fetched when it opens, kept so later paints never flash
    opts = opts || {};
    var box = el("div"); host.appendChild(box);
    function paint() {
      clear(box); var c = S.body[url];
      var ex = function () { var e = opts.extra && opts.extra(); if (e) { e.classList.add("part-x"); box.appendChild(e); } }; // the problems show while the page loads, and if it fails
      if (!c || (c.txt == null && !c.err)) { box.appendChild(el("div", "skel")); box.lastChild.style.width = "70%"; box.appendChild(el("div", "skel")); box.lastChild.style.width = "45%"; ex(); return; }
      if (c.err && c.txt == null) { box.appendChild(el("div", "crit", errText(c.err))); ex(); return; }
      var tx = contentOf(c.txt).trim();
      if (opts.split) { box.hidden = !renderParts(box, partsOf(tx), opts) && !opts.empty; return; } // a row's page, in its parts
      if (!tx) { box.hidden = !opts.empty; if (opts.empty) { if (opts.title) box.appendChild(el("div", "xh", opts.title)); box.appendChild(el("div", "muted", opts.empty)); } return; }
      box.hidden = false;
      if (opts.title) box.appendChild(el("div", "xh", opts.title));
      var md = renderMd(tx, opts); if (opts.title) md.classList.add("after-xh"); box.appendChild(md);
    }
    if (SNAP) { S.body[url] = { txt: "<content>\n" + (S.snapPages[key(url)] || "") + "\n</content>", at: Infinity }; paint(); return; } // a client's page: the text came with the snapshot
    paint();
    (bodyWaiters[url] = bodyWaiters[url] || []).push(function () { if (box.isConnected) paint(); });
    var c = S.body[url];
    if (!c || (!c.busy && Date.now() - (c.at || 0) > 60000)) {
      S.body[url] = c = c || {}; c.busy = true;
      var done = function () { var ws = bodyWaiters[url] || []; delete bodyWaiters[url]; ws.forEach(function (f) { f(); }); };
      fetchText(url, DATA).then(function (txt) { S.body[url] = { txt: txt, at: Date.now() }; done(); },
        function (err) { S.body[url] = { txt: c.txt, err: err, at: Date.now() }; done(); });
    }
  }
  function inline(host, s) { // **bold**, *italic*, `code`, [text](url), page mentions, dates
    s = String(s).replace(/\{color="[^"]*"\}/g, "").replace(/<\/?(span|u|br)[^>]*>/g, "");
    var re = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|<mention-page url="([^"]+)"[^>]*>([^<]*)<\/mention-page>|<mention-page url="([^"]+)"[^>]*\/>|<mention-date start="([^"]+)"[^>]*\/?>(?:<\/mention-date>)?|<mention-[a-z]+[^>]*>([^<]*)<\/mention-[a-z]+>|\*([^*\s][^*]*)\*/g, last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) host.appendChild(document.createTextNode(unesc(s.slice(last, m.index))));
      if (m[1] != null) host.appendChild(el("b", "", unesc(m[1])));
      else if (m[2] != null) host.appendChild(el("code", "", m[2]));
      else if (m[3] != null) { if (/^https?:/.test(m[4])) host.appendChild(link(m[4], unesc(m[3]))); else host.appendChild(document.createTextNode(unesc(m[3]))); }
      else if (m[5] != null) host.appendChild(SNAP ? document.createTextNode(clean(m[6]) || "page") : link(cleanUrl(m[5]), clean(m[6]) || "page")); // a client's page links nowhere into Notion
      else if (m[7] != null) { var it = itemIndex()[key(m[7])]; host.appendChild(SNAP ? document.createTextNode(it ? it.name : "page") : link(cleanUrl(m[7]), it ? it.name : "page")); }
      else if (m[8] != null) host.appendChild(document.createTextNode(fmt(dnum(m[8]), true)));
      else if (m[9] != null) host.appendChild(document.createTextNode(m[9]));
      else if (m[10] != null) host.appendChild(el("i", "", unesc(m[10])));
      last = re.lastIndex;
    }
    if (last < s.length) host.appendChild(document.createTextNode(unesc(s.slice(last))));
  }
  function renderMd(text, opts) {
    var root = el("div", "md"), lines = String(text || "").split("\n"), list = null, listTag = null, code = null, box = root;
    opts = opts || {};
    function endList() { list = null; listTag = null; }
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i].replace(/^\t+/, "");
      if (code) { if (/^```/.test(l)) { code = null; continue; } code.textContent += (code.textContent ? "\n" : "") + lines[i]; continue; }
      if (/^```/.test(l)) { endList(); code = el("pre"); box.appendChild(code); continue; }
      var c1 = /^<callout[^>]*>(.*?)(<\/callout>)?$/.exec(l);
      if (c1) { endList(); var co = el("div", "co"); box.appendChild(co); if (c1[1].trim()) { var cp = el("p"); inline(cp, c1[1]); co.appendChild(cp); } if (!c1[2]) box = co; continue; }
      if (/^<\/callout>/.test(l) || /^<\/details>/.test(l)) { endList(); box = root; continue; }
      if (/^<details/.test(l)) { endList(); continue; }
      var sm = /^<summary>([\s\S]*)<\/summary>/.exec(l); if (sm) { var sh = el("h5"); inline(sh, sm[1]); box.appendChild(sh); continue; }
      var pg = /^<page url="([^"]+)"[^>]*>([^<]*)<\/page>/.exec(l);
      if (pg) { endList(); box.appendChild(subPage(cleanUrl(pg[1]), clean(pg[2]) || "Untitled")); continue; }
      if (/^<database/.test(l)) { endList(); box.appendChild(el("div", "muted", "An embedded database — open the page in Notion to see it.")); continue; }
      if (/^<\/?(tabs|tab|columns|column|empty-block|table|tr|td|thead|tbody|colgroup|col)\b/.test(l) || /^---+$/.test(l)) { endList(); continue; }
      if (!l.trim()) { endList(); continue; }
      var h = /^(#{1,4})\s+(.*)$/.exec(l);
      if (h) { endList(); var hn = el(h[1].length <= 2 ? "h3" : "h4"); inline(hn, h[2]); box.appendChild(hn); continue; }
      var li = /^([-*+]|\d+\.)\s+(.*)$/.exec(l);
      if (li) {
        var tag = /\d/.test(li[1]) ? "ol" : "ul";
        if (!list || listTag !== tag) { list = el(tag, opts.history && tag === "ul" ? "hist" : ""); listTag = tag; box.appendChild(list); }
        var td = /^\[([ xX])\]\s*/.exec(li[2]), itm = el("li", td ? "todo" + (td[1] !== " " ? " done" : "") : ""); // a checklist item: its box, ticked or not, read-only
        if (td) itm.appendChild(el("span", "cb")); inline(itm, td ? li[2].slice(td[0].length) : li[2]); list.appendChild(itm); continue;
      }
      if (/^>\s?/.test(l)) { endList(); var q = el("blockquote"); inline(q, l.replace(/^>\s?/, "")); box.appendChild(q); continue; }
      endList(); var p = el("p"); inline(p, l); box.appendChild(p);
    }
    return root;
  }
  // ---------- Claude chats: one per project, milestone, task or problem, its link kept in the row's `Chat` ----------
  // Desktop: the Claude app's own link (artifacts let claude:// out there). Phone: the web, since iOS keeps claude.ai links in the browser.
  var MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "") || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent || ""));
  var KIND = { project: "project", ms: "milestone", task: "task", problem: "problem" }, TITLE = { project: "Project", ms: "Milestone", task: "Task", problem: "Problem" };
  function chatSid(u) { var m = /session_([A-Za-z0-9]+)/.exec(String(u || "")); return m ? m[1] : null; }
  function claudeProject(v) { // the Projects field `Claude project`: "<name> — <project id>"
    var m = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i.exec(String(v || ""));
    return m ? { id: m[1].toLowerCase(), name: clean(String(v).replace(m[0], "").replace(/[\s—–·:-]+$/, "")) || "Claude project" } : null;
  }
  function newChatUrl(q, cp) { // the web takes the tracker project's claude.ai project; the app's own link has no way to name one
    return MOBILE ? "https://claude.ai/new?mode=cowork&surface=cowork" + (cp ? "&project=" + cp.id : "") + "&q=" + encodeURIComponent(q) : "claude://cowork/new?q=" + encodeURIComponent(q);
  }
  function chatQ(x, kind, again) { // "Task: <name>" first, since the app titles a chat from its first message; then its page — only what to load, what to do next is the user's to say
    var pr = kind === "project" ? null : x.project || allProjByKey()[x.pk];
    return TITLE[kind] + ": " + x.name + (pr ? " — " + pr.name : "") + " (Project Tracker, " + x.url + "). " + (again ? "Its old chat is gone: this is its chat from now on. " : "") + "Load it with the project-tracker skill.";
  }
  function chatLink(href, text, title) { var a = el("a", "", text); a.href = href; a.target = "_blank"; a.rel = "noopener"; a.appendChild(el("span", "arr", " ↗")); if (title) a.title = title; a.addEventListener("click", function (e) { e.stopPropagation(); }); return a; }
  function chatBtn(x, kind) { // open the row's chat; with no chat yet, start it — that chat writes its own link back to the row
    var sid = chatSid(x.chat), w = el("span", "chat" + (sid ? " split" : "")), pr = kind === "project" ? x : x.project || allProjByKey()[x.pk], cp = pr ? pr.cproj : null;
    if (!sid) { w.appendChild(chatLink(newChatUrl(chatQ(x, kind, false), cp), "Claude chat", "Start a chat with Claude about this " + KIND[kind] + "; every later click opens the same chat")); return w; }
    w.appendChild(chatLink(MOBILE ? "https://claude.ai/cowork/cse_" + sid : "claude://claude.ai/code/session_" + sid, "Claude chat", "This " + KIND[kind] + "'s chat with Claude"));
    var mb = btn("more", null); mb.innerHTML = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.8 5 6.8 8 3.8"/></svg>';
    mb.setAttribute("aria-label", "More chat options"); mb.setAttribute("aria-expanded", "false");
    var menu = el("div", "chat-m"); menu.hidden = true;
    var nw = chatLink(newChatUrl(chatQ(x, kind, true), cp), "New chat"); nw.appendChild(span("For when the old one is deleted or too long: the new chat becomes this " + KIND[kind] + "'s chat.", "d"));
    nw.addEventListener("click", function () { menu.hidden = true; mb.setAttribute("aria-expanded", "false"); });
    menu.appendChild(nw);
    mb.addEventListener("click", function (e) { e.stopPropagation(); var on = menu.hidden; document.querySelectorAll(".chat-m").forEach(function (m) { m.hidden = true; }); menu.hidden = !on; mb.setAttribute("aria-expanded", String(on)); });
    w.appendChild(mb); w.appendChild(menu); return w;
  }
  document.addEventListener("click", function (e) { if (!e.target.closest(".dd-m, .chat-m, .info")) closeMenus(); });
  function fixChat(err) { return err && err.chat ? chatLink(newChatUrl(err.chat), "Fix it in a chat with Claude") : null; }
  function trackerErr() { return S.projErr && !S.projects ? S.projErr : null; }
  function errBox(text, err) { var d = el("div", "err", (err && err.code === "config" ? "" : text) + errText(err)); /* a config error names itself */ var c = fixChat(err); if (c) { c.classList.add("fix"); d.appendChild(c); } return d; }
  function subPage(u, title) {
    var k = "sub:" + key(u), d = el("div", "sub" + (S.open[k] ? " open" : ""));
    var b = btn("", null); b.insertAdjacentHTML("beforeend", CHEV); b.appendChild(span(title)); b.setAttribute("aria-expanded", String(!!S.open[k]));
    var body = el("div", "sub-b"); body.hidden = !S.open[k];
    function fill() { pageBody(body, u, { empty: "This page is empty." }); if (SNAP) return; var a = el("div", "actions sub-acts"); a.appendChild(link(u, "Open in Notion ↗", "ext")); body.appendChild(a); }
    if (S.open[k]) fill();
    b.addEventListener("click", function () { var on = !S.open[k]; if (on) S.open[k] = 1; else delete S.open[k]; d.classList.toggle("open", on); b.setAttribute("aria-expanded", String(on)); if (on && !body.firstChild) fill(); body.hidden = !on; });
    d.appendChild(b); d.appendChild(body); return d;
  }
  S.col = {}; // sections folded in this visit; every new visit starts with all of them open
  function problemsOn(k, field) { return allProblems().filter(function (i) { return i[field] === k && i.status !== "Dropped"; }); }
  function msBody(x, m) {
    PT.msFacts(x, m);
    pageBody(x, m.url, { split: true, empty: "Nothing written yet.", extra: function () { return problemLines(problemsOn(key(m.url), "mk"), ON_US); } });
    if (!SNAP) actions(x, [chatBtn(m, "ms"), link(m.url, "Open in Notion ↗", "ext")]);
  }
  function taskBody(x, k) {
    PT.taskFacts(x, k);
    pageBody(x, k.url, { split: true, empty: "Nothing written yet.", extra: function () { return problemLines(problemsOn(key(k.url), "tk"), ON_US); } });
    if (!SNAP) actions(x, [chatBtn(k, "task"), link(k.url, "Open in Notion ↗", "ext")]);
  }
  function problemBody(x, i) {
    var idx = itemIndex(), ms = idx[i.mk], tk = idx[i.tk], a = ageOf(i);
    if (i.summary) x.appendChild(el("p", "x-lede", i.summary)); // what is wrong, first
    PT.meta(x, [i.status === "Resolved" ? "" : i.waiting ? "waiting on " + i.waiting : SNAP ? "on our side" : "on you", ms ? "in " + ms.name + (tk ? " › " + tk.name : "") : tk ? "on " + tk.name : "", i.opened != null ? "opened " + fmt(i.opened) + (i.status !== "Resolved" && a != null ? ", " + days(a) + " ago" : "") : "", i.resolvedOn != null ? "resolved " + fmt(i.resolvedOn) : ""]);
    pageBody(x, i.url, { split: true });
    if (!SNAP) actions(x, [chatBtn(i, "problem"), link(i.url, "Open in Notion ↗", "ext")]);
  }
  function projectLinks(p) { // what the user's project page adds to the project at a glance: Claude project, repository, source — each always there or said to be missing
    return function (pair) {
      if (p.cproj) { var cpl = link("https://claude.ai/project/" + p.cproj.id, p.cproj.name + " ↗", "ext"); cpl.title = "The claude.ai project this project's chats open in (on the phone and the web)"; pair("Claude project", cpl); }
      else pair("Claude project", "none", true).title = "Its chats open outside claude.ai projects. To set one, tell Claude in a chat: \u201copen its chats in <project link>\u201d";
      if (p.repo) { var rp = link(p.repo, String(p.repo).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").split("/").slice(-2).join("/") + " ↗", "ext"); rp.title = p.repo; pair("Repository", rp); }
      if (p.source) pair(p.origin === "Upwork" ? "Upwork" : "Source", link(p.source, (p.origin === "Upwork" ? "contract" : "link") + " ↗", "ext"));
    };
  }
  S.grp = {}; // milestone groups the viewer opened or closed in this visit
  var PG = PT.page({ ui: S, host: function () { return $("drBody"); }, msBody: msBody, taskBody: taskBody, onUs: ON_US });
  var acc = PG.acc, dsec = PG.dsec, setFold = PG.setFold, taskRow = PG.taskRow, reveal = PG.reveal;
  // the project page, block by block; ctx carries what several blocks share
  function drHead(host, p, c) { PG.projectHead(host, p, c.st, c.ms0 && c.ms0.length ? c.ms0 : c.tk0 || [], SNAP ? null : projectLinks(p), c.info.parts.desc ? renderMd(c.info.parts.desc, {}) : null); }
  function drStatus(body, c) {
    var ms0 = c.ms0, tk0 = c.tk0, info = c.info, st = c.st, f = c.f, openProbs = c.openProbs, waitTasks = c.waitTasks;
    if (info.notes.length) { var q = el("div", "dr-note"), nh = el("div", "nh"); nh.innerHTML = '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 7.2v3.6M8 5.2v.1"/></svg>'; nh.appendChild(span("Status")); q.appendChild(nh); info.notes.forEach(function (x) { q.appendChild(el("div", "", x)); }); body.appendChild(q); }
  }
  function drFocus(body, p, c) { // where it stands: the milestone under way with its current task, what is late, what is paused, the next milestone, blockers
    var fc = c.ms0 ? PG.focusBlock(c.f, blockersOf(p), p.summary) : PG.focusBlock({ overdue: [], now: [], next: null }, [], p.summary); if (fc) body.appendChild(fc);
  }
  function drNumbers(body, p, c) { // three tiles, each opening its section
    var ms0 = c.ms0, tk0 = c.tk0, info = c.info, st = c.st, f = c.f, openProbs = c.openProbs, waitTasks = c.waitTasks;
    var strip = ms0 && ms0.length ? ms0 : tk0 || [], stats = el("div", "stats"), done = strip.filter(function (m) { return m.status === "Done"; }).length;
    function stat(k, v, sub, sec) { // a tile with a section behind it is a button that opens and scrolls to it
      var c = sec ? btn("stat go", null, function () { var s = $("drBody").querySelector('.dsec[data-sec="' + sec + '"]'); if (!s) return; if (s.classList.contains("folded")) setFold(s, false); s.scrollIntoView({ block: "start", behavior: smooth() }); }) : el("div", "stat");
      var kk = el("div", "k", k); if (sec) kk.appendChild(span("↓", "arr")); c.appendChild(kk); c.appendChild(el("div", "v", v)); if (sub) c.appendChild(sub); stats.appendChild(c);
    }
    var pr = null; if (strip.length) { pr = el("div", "mstrip tile-strip"); sortItems(strip).forEach(function (m) { pr.appendChild(el("i", m.state === "plan" ? "" : m.state)); }); }
    stat(ms0 && ms0.length ? "Milestones" : "Tasks", ms0 ? done + " / " + strip.length : "—", pr, ms0 ? "plan" : null);
    var nOpen = openProbs.length + waitTasks.length, nNotes = entriesIn(info.parts.notes) + (SNAP ? 0 : entriesIn(info.parts.priv));
    stat("Open items", S.problemsErr && !S.problems ? "?" : String(nOpen), null, nOpen || (S.problemsErr && !S.problems) ? "items" : null); // a tile with nothing behind it is not a button
    stat("Notes", String(nNotes), null, nNotes ? "notes" : null);
    body.appendChild(stats);

  }
  function drItems(body, p, c) { // open items: problems by what they ask of the user, plus the tasks waiting on someone
    var ms0 = c.ms0, tk0 = c.tk0, info = c.info, st = c.st, f = c.f, openProbs = c.openProbs, waitTasks = c.waitTasks;
    if (openProbs.length || waitTasks.length || (S.problemsErr && !S.problems)) {
      var b1 = dsec(body, "items", "Open items", openProbs.length + waitTasks.length);
      if (S.problemsErr && !S.problems) b1.appendChild(errBox("Problems didn't load. ", S.problemsErr));
      var sd = SNAP ? sidesOf(p) : null;
      var groups = SNAP ? [["On your side", sd.you], ["On our side", sd.us], ["With third parties", sd.third], ["Risks to keep in mind", sd.risk]] : [
        ["Blocking", openProbs.filter(function (i) { return i.type === "Blocker"; })],
        ["On you", openProbs.filter(function (i) { return i.type !== "Blocker" && i.type !== "Risk" && !i.waiting; })],
        ["Waiting on others", waitTasks.concat(openProbs.filter(function (i) { return i.type !== "Blocker" && i.type !== "Risk" && i.waiting; }))],
        ["Risks to keep in mind", openProbs.filter(function (i) { return i.type === "Risk"; })]
      ];
      groups.forEach(function (g) {
        if (!g[1].length) return;
        var gt = el("div", "grp-t"); gt.appendChild(span(g[0])); gt.appendChild(span(String(g[1].length), "n")); b1.appendChild(gt);
        g[1].sort(function (x, y) { return (ageOf(y) || 0) - (ageOf(x) || 0); }).forEach(function (i) {
          var a = ageOf(i), sub = el("span", "s");
          if (i.kind === "task") { sub.appendChild(typeTag("Task")); sub.appendChild(document.createTextNode(" " + (i.waiting || "") + (i.end != null ? " · due " + fmt(i.end) : ""))); b1.appendChild(acc({ k: "w:" + key(i.url), dot: i.late > 0 ? "crit" : "warn", title: i.name, line: sub, right: a != null ? days(a) : "", expand: function (x) { taskBody(x, i); } })); return; }
          sub.appendChild(typeTag(i.type)); if (i.waiting) sub.appendChild(document.createTextNode(" " + i.waiting));
          b1.appendChild(acc({ k: key(i.url), dot: i.type === "Blocker" ? "crit" : i.type === "Risk" ? "warn" : i.waiting ? "ring" : "cur", title: i.name, line: sub, right: a != null ? days(a) : "", expand: function (x) { problemBody(x, i); } }));
        });
      });
    }

  }
  function drResolved(body, p) { // problems resolved lately: where Recently completed opens them
    var resolvedP = (S.resolved || []).map(problemOf).filter(function (i) { return i.pk === p.key && i.status === "Resolved"; });
    if (resolvedP.length) {
      var b4 = dsec(body, "resolved", "Resolved lately", resolvedP.length);
      resolvedP.forEach(function (i) { var sub = el("span", "s"); sub.appendChild(typeTag(i.type)); sub.appendChild(document.createTextNode(i.resolvedOn != null ? " resolved " + fmt(i.resolvedOn) : " resolved")); b4.appendChild(acc({ k: "r:" + key(i.url), dot: "good", title: i.name, line: sub, right: "", expand: function (x) { problemBody(x, i); } })); });
    }

  }
  function drPlan(body, p, c) {
    var dErr = S.plan[p.key] && S.plan[p.key].err;
    PG.planSec(body, c.ms0, c.tk0, c.f.head, { err: dErr ? errText(dErr) : "", empty: SNAP ? "No plan yet." : "No plan yet. Send Claude the plan in chat." });
  }
  function drNotes(body, p, c) { // the project page's own sections: Notes, Private notes (not on a client's page), History
    var pt = c.info.parts;
    var b3 = dsec(body, "notes", "Notes", entriesIn(pt.notes) || null);
    if (pt.notes) { var nl = renderMd(pt.notes, {}); nl.classList.add("pad"); b3.appendChild(nl); }
    else b3.appendChild(el("div", "empty", SNAP ? "No notes yet." : "No notes yet. Tell Claude “save to the " + p.name + " notes: …”."));
    if (!SNAP && pt.priv) { var b5 = dsec(body, "private", "Private notes", entriesIn(pt.priv)); b5.closest(".dsec").classList.add("priv-s"); var pl = renderMd(pt.priv, {}); pl.classList.add("pad"); b5.appendChild(pl); }
    if (pt.hist) { var b6 = dsec(body, "history", "History", entriesIn(pt.hist)); var hl = renderMd(pt.hist, { history: true }); hl.classList.add("pad"); b6.appendChild(hl); }
  }
  function renderDrawer() {
    var host = $("drBody"), p = S.dr ? allProjByKey()[S.dr.pid] : null; if (!S.dr) return;
    keep(host, function () {
      clear(host);
      if (!p) { $("drTitle").textContent = ""; if (!SNAP) { clear($("drChat")); $("drNotion").removeAttribute("href"); } host.appendChild(el("div", "dr-in muted", "This project is no longer in the active list.")); return; }
      $("drTitle").textContent = p.name; if (!SNAP) { $("drNotion").href = p.url; clear($("drChat")); $("drChat").appendChild(chatBtn(p, "project")); } paintNav();
      var ms0 = msList(p), tk0 = taskList(p);
      var c = { ms0: ms0, tk0: tk0, info: S.pageInfo[p.key] || { notes: [], parts: partsOf("") }, st: stateOfProject(p), f: focusOf(p),
        openProbs: allProblems().filter(function (i) { return i.pk === p.key && (i.status === "Open" || i.status === "Waiting"); }),
        waitTasks: (tk0 || []).filter(function (k) { return k.status === "Waiting" && !k.paused; }) };
      drHead(host, p, c);
      var body = el("div", "dr-in"); host.appendChild(body);
      drStatus(body, c); drFocus(body, p, c); drNumbers(body, p, c); drItems(body, p, c); drResolved(body, p); drPlan(body, p, c); drNotes(body, p, c);
    });
  }
  var lastFocus = null;
  function openProject(p, k) {
    var same = S.dr && S.dr.pid === p.key && $("drawer").classList.contains("on");
    if (!same) { lastFocus = document.activeElement; S.dr = { pid: p.key }; renderDrawer(); $("drBody").scrollTop = 0; $("drTop").classList.remove("on"); }
    $("drawer").classList.add("on"); $("drawer").setAttribute("aria-hidden", "false"); $("scrim").classList.add("on");
    if (k) setTimeout(function () { reveal(k); }, same ? 0 : 240); else $("drClose").focus({ preventScroll: true });
  }
  function navPos() { var ps = sortedProjects(), i = -1; ps.forEach(function (x, n) { if (S.dr && x.key === S.dr.pid) i = n; }); return { ps: ps, i: i }; }
  function paintNav() {
    var n = navPos(); $("drPrev").disabled = n.i <= 0; $("drNext").disabled = n.i < 0 || n.i >= n.ps.length - 1;
    var p = n.ps[n.i]; if (p) $("drTitle").textContent = p.name + (n.ps.length > 1 ? " · " + (n.i + 1) + " of " + n.ps.length : "");
  }
  function stepProject(d) { var n = navPos(), p = n.ps[n.i + d]; if (p) openProject(p); }
  $("drPrev").addEventListener("click", function () { stepProject(-1); });
  $("drNext").addEventListener("click", function () { stepProject(1); });
  function setWide(on) { var d = $("drawer"), b = $("drWide"); d.classList.toggle("wide", on); b.setAttribute("aria-pressed", String(on)); b.setAttribute("aria-label", on ? "Narrow" : "Widen"); b.title = on ? "Back to the narrow panel" : "Widen to the page width"; try { localStorage.setItem("pt.wide", on ? "1" : ""); } catch (e) {} }
  $("drWide").addEventListener("click", function () { setWide(!$("drawer").classList.contains("wide")); });
  try { if (localStorage.getItem("pt.wide")) setWide(true); } catch (e) {}
  function closeDrawer() {
    $("drawer").classList.remove("on"); $("drawer").setAttribute("aria-hidden", "true"); $("scrim").classList.remove("on");
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
  }
  $("drTop").addEventListener("click", function () { $("drBody").scrollTo({ top: 0, behavior: smooth() }); });
  $("drBody").addEventListener("scroll", function () { $("drTop").classList.toggle("on", $("drBody").scrollTop > 360); }, { passive: true });
  $("drClose").addEventListener("click", closeDrawer); $("scrim").addEventListener("click", closeDrawer);
  function closeMenus() { var n = 0; document.querySelectorAll(".dd-m, .chat-m, .info .pop").forEach(function (m) { if (!m.hidden) { m.hidden = true; n++; var b = m.parentNode.querySelector("[aria-expanded]"); if (b) b.setAttribute("aria-expanded", "false"); } }); if (n && pending) { pending = false; paint(); } return n; }
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Escape" && closeMenus()) { e.preventDefault(); return; }
    if (!$("drawer").classList.contains("on")) return;
    if (e.key === "Escape") closeDrawer();
    else if (/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || "")) return;
    else if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); stepProject(1); }
    else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); stepProject(-1); }
  });

  // ---------- painting: placeholders until the first full set, then in place ----------
  function skeleton() {
    renderPills(); var c = $("cards"); clear(c);
    function bars(host, widths) { widths.forEach(function (w) { var k = el("div", "skel"); k.style.width = w; host.appendChild(k); }); }
    for (var i = 0; i < 2; i++) { var s = el("div", "pc skel-card"); bars(s, ["55%", "30%", "80%", "40%"]); c.appendChild(s); }
    var tlh = $("tlScroll"); clear(tlh); var sk = el("div", "skel-tl"); bars(sk, ["50%"]); tlh.appendChild(sk);
    ["moveList", "waitList"].forEach(function (id) { var h = $(id); clear(h); for (var j = 0; j < 3; j++) { var r = el("div", "skel-row"); bars(r, ["75%", "45%"]); h.appendChild(r); } });
  }
  var pending = false; // a paint held back while a menu is open, done when it closes
  function focusKey() { // where keyboard focus is in the project page, by what it shows rather than by node
    var a = document.activeElement; if (!a || !$("drawer").contains(a)) return null;
    if (a.id) return "#" + a.id;
    var r = a.closest(".arow"); if (r && a.classList.contains("acc-h")) return '.arow[data-k="' + sel(r.dataset.k) + '"] > .acc-h';
    var g = a.closest(".mgrp"); if (g && a.classList.contains("mh")) return '.mgrp[data-g="' + sel(g.dataset.g) + '"] > .mh';
    return null;
  }
  function paint() {
    if (document.querySelector(".dd-m:not([hidden]), .chat-m:not([hidden])")) { pending = true; return; }
    var fk = focusKey();
    renderHeader();
    if (!S.shown) return;
    (SNAP ? [renderPills, renderCards, function () { renderGantt(false); }, renderSides, renderDone, renderDrawer] : [renderPills, renderCards, function () { renderGantt(false); }, renderMove, renderWaiting, renderDone, renderDrawer]).forEach(function (f) { try { f(); } catch (e) { if (window.console) console.error(e); } });
    if (fk) { var n = document.querySelector(fk); if (n) n.focus({ preventScroll: true }); }
  }
  function ready() {
    if (S.projErr && !S.projects) return true;
    return loadedAll() && (S.problems || S.problemsErr) && (!S.cfg || !S.cfg.resolved || S.resolved || S.resolvedErr);
  }
  var queued = false;
  function render() {
    if (queued) return; queued = true;
    requestAnimationFrame(function () { queued = false; if (!S.shown && !ready()) return; S.shown = true; paint(); });
  }
  function paintLive() {
    if (SNAP) { if (S.lastUpdate > 0) { var d = new Date(S.lastUpdate); $("liveText").textContent = "Updated " + fmt(Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / PT.DAY)) + ", " + hhmm(S.lastUpdate); } return; }
    if (S.lastUpdate > 0) { $("liveDot").className = "ldot on"; $("liveText").textContent = "Live · updated " + hhmm(S.lastUpdate); $("liveWrap").title = "Live from Notion. Read-only: change things by telling Claude in chat."; }
    if (S.rootUrl) { $("notionLink").href = S.rootUrl; $("notionLink").hidden = false; }
  }

  // ---------- wiring ----------
  var TLN = PT.timeline({
    host: $("tlScroll"), seg: $("range"), today: $("todayBtn"), info: $("info"),
    range: function () { return S.range; }, setRange: function (r) { S.range = r; try { localStorage.setItem("pt.range", r); } catch (e) {} },
    projects: sortedProjects, plan: planOf, err: function (p) { return S.plan[p.key] && S.plan[p.key].err; }, state: stateOfProject,
    opened: S.tlOpen, saveOpen: saveOpen, open: openProject,
    empty: function () { return trackerErr() ? "The tracker didn't load: nothing to draw." : (S.projects || []).length ? "No projects of this kind." : "Nothing scheduled yet."; }
  });
  var resizeT = null;
  window.addEventListener("resize", function () { clearTimeout(resizeT); resizeT = setTimeout(function () { if (S.shown) renderGantt(false); }, 150); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden && MCP && Date.now() - S.lastUpdate > POLL) loadAll(); }); // back after a while: fresh data at once
  if (!SNAP) $("refreshBtn").addEventListener("click", function () {
    if (!MCP) return;
    $("liveText").textContent = "Refreshing…";
    var p = MCP.invalidate ? MCP.invalidate(NOTION) : Promise.resolve();
    S.body = {};
    p.catch(function () {}).then(function () { S.cfg = null; loadAll(); });
  });
  setInterval(function () { if (MCP && !document.hidden) loadAll(); }, POLL);
  setInterval(function () { if (!document.hidden && S.shown) paint(); }, 3600000);
  function noLive(msg) {
    $("liveText").textContent = msg; $("refreshBtn").hidden = true;
    clear($("pills")); $("pills").appendChild(el("span", "pl", msg));
    ["cards", "tlScroll", "moveList", "waitList"].forEach(function (id) { clear($(id)); });
  }
  if (SNAP) { loadSnapshot(SNAP); render(); return; }
  renderHeader(); skeleton();
  if (!window.claude || typeof window.claude.use !== "function") { noLive("Open this page in claude.ai to see live data."); return; }
  if (/^__ROOT/.test(ROOT_PAGE)) { noLive("This copy has no tracker page set. Ask Claude to publish the dashboard from setup."); return; }
  window.claude.use("mcp").then(function (mcp) {
    if (!mcp) { noLive("Live data isn't available in this view. Open the page in claude.ai."); return; }
    MCP = mcp; $("liveText").textContent = "Loading…"; loadAll();
  }, function () { noLive("Live data isn't available in this view."); });

})();
