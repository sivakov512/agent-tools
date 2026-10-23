/* Project Tracker: the dashboard itself, shared by both pages. dashboard.html runs it live from Notion through the viewer's connector
   (window.PT_ROOT, the tracker's root page); client.html runs it on a snapshot (window.PT_DATA, from data.js) for a client — the same
   page without what is internal: no Private notes, Notion links or chats, and the open items by whose side they are on. */
(function () {
  "use strict";
  var ROOT_PAGE = window.PT_ROOT || "", SNAP = window.PT_DATA || null; // live from Notion, or a client's snapshot
  var CLIENT = !ROOT_PAGE; // client.html sets no root page: it runs on its snapshot alone, or on nothing if data.js did not load
  var NOTION = window.PT_NOTION && !/^__/.test(window.PT_NOTION) ? window.PT_NOTION : "Notion"; // the Notion connector's name in claude.ai (dashboard.html sets it)
  var STRUCT = { staleTime: 300000, gcTime: 86400000 }; // pages, databases, view ids: change rarely
  var DATA = { staleTime: 60000, gcTime: 86400000 };    // rows and page bodies
  var POLL = 600000;
  var ORIGINS = ["Upwork", "Direct", "Personal"];

  // What the page knows. From Notion: the config's views (cfg), the projects, each one's plan (plan: {ms, tasks}, {err}, or with stale: the
  // error of a later read) and page parts (pageInfo), the open and the resolved problems, each with the error of its last read; page texts
  // fetched (body). The viewer's: origins and timeline range and lines (kept in localStorage), items and sub-pages opened (open) and
  // sections folded (col) on the project page in this visit, the project open there (dr: { pid }). shown: the first full set is drawn.
  var S = { cfg: null, rootUrl: "", projects: null, projErr: null, plan: {}, pageInfo: {}, problems: null, problemsErr: null, resolved: null, resolvedErr: null,
    side: {}, snapPages: {}, body: {}, lastUpdate: 0, refreshing: false, range: "3", origins: [], tlOpen: {}, open: {}, col: {}, dr: null, shown: false };
  try { var r0 = localStorage.getItem("pt.range"); if (PT.SPANS[r0] || r0 === "all") S.range = r0; } catch (e) {}
  try { // pt.origin: the one origin an older version kept
    var o0 = JSON.parse(localStorage.getItem("pt.origins") || "null");
    if (Array.isArray(o0)) S.origins = o0.filter(function (k) { return typeof k === "string"; });
    else { o0 = localStorage.getItem("pt.origin"); if (o0 && o0 !== "All") S.origins = [o0]; }
  } catch (e) {}
  try { var t0 = JSON.parse(localStorage.getItem("pt.tlOpen") || "{}"); if (t0 && typeof t0 === "object") S.tlOpen = t0; } catch (e) {}

  var $ = function (id) { return document.getElementById(id); };
  var el = PT.el, clear = PT.clear, link = PT.link, btn = PT.btn, span = PT.span, nodash = PT.nodash, cleanUrl = PT.cleanUrl, unesc = PT.unesc, clean = PT.clean;
  var key = PT.key, plural = PT.plural, smooth = PT.smooth, sel = PT.sel, keep = PT.keep, slide = PT.slide, foldDetails = PT.foldDetails;
  var dnum = PT.dnum, todayNum = PT.todayNum, fmt = PT.fmt, soon = PT.soon, range = PT.range, days = PT.days, hhmm = PT.hhmm;
  var OPEN_MS = PT.OPEN_MS, CHEV = PT.CHEV, ICO = PT.ICO, problemOf = PT.problemOf, isOpen = PT.isOpen, ageOf = PT.ageOf, ageCls = PT.ageCls, sortItems = PT.sortItems, onWhom = PT.onWhom;
  var typeTag = PT.typeTag, problemLines = PT.problemLines;
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
      case "timeout": return "Notion didn't answer in time. Refresh in a minute.";
      case "tool_error": return "Notion reported an error: " + (err.message || "unknown");
      case "not_granted": case "capability_disabled": case "capability_removed": return "Live data isn't available in this view — open the page in claude.ai.";
      case "config": return err.message;
      default: return "Notion failed: " + ((err && err.message) || "unknown error");
    }
  }
  var DENIALS = /^(needs_reauth|server_not_connected|selection_required|blocked_by_policy|approval_required|not_in_manifest|consent_required|not_granted|capability_disabled|capability_removed)$/;
  function isDenial(err) { return err && DENIALS.test(err.code); } // no longer allowed to read: what was read before goes

  // ---------- Notion access ----------
  var MCP = null, CALL_TIMEOUT = 45000;
  function call(tool, args, cache) { // every Notion call: one that never settles fails after CALL_TIMEOUT, so the page never stays on Loading
    return new Promise(function (ok, fail) {
      var t = setTimeout(function () { fail({ code: "timeout" }); }, CALL_TIMEOUT);
      MCP.callTool(NOTION, tool, args, { cache: cache }).then(
        function (r) { clearTimeout(t); ok(r); },
        function (e) { clearTimeout(t); fail(e); });
    });
  }
  function note(run, res, cache) { // a load's oldest row or page read: what "updated hh:mm" may claim once the load ends
    if (run && cache === DATA) run.at = Math.min(run.at, res && res.cache && res.cache.storedAt ? res.cache.storedAt : Date.now());
  }
  function payload(res) { var p = res ? res.payload : null; if (typeof p === "string") { try { p = JSON.parse(p); } catch (e) {} } return p; }
  // During a Refresh's load, the first read of each page or view goes to Notion past the cache: invalidate() is not there on every host,
  // and without it a read inside its staleTime would come back from the cache unchanged; null again when that load ends
  var fresh = null;
  function cacheFor(key, cache) {
    if (!fresh || fresh[key]) return cache;
    fresh[key] = true;
    var c = {}; for (var k in cache) c[k] = cache[k]; c.refresh = true; return c;
  }
  function fetchText(id, cache, run) { // run: the load it is part of, if any
    return call("notion-fetch", { id: id }, cacheFor("f:" + id, cache)).then(function (res) {
      note(run, res, cache);
      var p = payload(res), t = PT.notionText(p && typeof p === "object" ? String(p.text || "") : String(p || ""));
      var re = /notion-file-block:\/\/[^\s)"'<>]+/g, m;
      while ((m = re.exec(t))) fileRefPage[m[0].replace(/&amp;/g, "&")] = id; // where each file lives, for its link (fileLink)
      return t;
    });
  }
  function queryView(viewUrl, max, run) {
    var rows = [];
    function page(cursor, n) {
      var data = { mode: "view", view_url: viewUrl, page_size: 100 };
      if (cursor) data.start_cursor = cursor;
      return call("notion-query-data-sources", { data: data }, cacheFor("q:" + viewUrl + "|" + (cursor || ""), DATA)).then(function (res) {
        note(run, res, DATA); var p = payload(res) || {};
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

  function configErr(message, chat) { return { code: "config", message: message, chat: chat }; } // chat: the request a chat can fix it with
  function loadConfig() { // root page → config IDs → databases → views by name
    return fetchText(ROOT_PAGE, STRUCT).then(function (txt) {
      var ids = {}, cf = unesc(txt); // the config's lines as plain text: `ref\_prefixes` is ref_prefixes
      ["projects", "milestones", "tasks", "problems", "open_items"].forEach(function (k) {
        var m = new RegExp("\\b" + k + ":\\s*`?([0-9a-f-]{32,36})").exec(cf); if (m) ids[k] = m[1];
      });
      var rp = /\bref_prefixes:\s*`?([A-Za-z0-9 ,-]+)/.exec(cf); if (rp) PT.setRefPrefixes(rp[1]); // the Ref prefixes in use; without the line, the usual four
      if (ids.open_items && !ids.tasks) throw configErr("This tracker was made by version 0.x of the skill. Ask Claude in chat to upgrade it.", "Upgrade my project tracker to the new version.");
      if (!ids.projects || !ids.problems) throw configErr("The tracker's config toggle is missing database IDs. Run setup in chat to fix it.", "Set up the project tracker: its config is missing database IDs.");
      var dbs = {}, re = /<database url="([^"]+)"[^>]*data-source-url="\{*collection:\/\/([0-9a-f-]+)\}*"/g, m;
      while ((m = re.exec(txt))) dbs[m[2]] = cleanUrl(m[1]);
      var pdb = dbs[ids.projects], qdb = dbs[ids.problems];
      if (!pdb || !qdb) throw configErr("The Projects or Problems database is not on the tracker page. Run setup in chat to fix it.", "Set up the project tracker: a database is missing from its page.");
      S.rootUrl = "https://app.notion.com/p/" + nodash(ROOT_PAGE); paintLive();
      return Promise.all([fetchText(pdb, STRUCT), fetchText(qdb, STRUCT)]).then(function (t) {
        var pv = viewsOf(t[0]), qv = viewsOf(t[1]);
        if (!pv["Active"] || !qv["Open"]) throw configErr("The tracker's views are missing (Active, Open). Run setup in chat to fix them.", "Set up the project tracker: its views are missing.");
        S.cfg = { active: viewUrl(pdb, pv["Active"]), open: viewUrl(qdb, qv["Open"]), resolved: qv["Recently resolved"] ? viewUrl(qdb, qv["Recently resolved"]) : null };
        return S.cfg;
      });
    });
  }

  function parseProjectPage(txt, p) { // the page's own parts, below its tabs (SKILL.md → Pages); a paused project's note says why and since when
    var body = contentOf(txt), t = body.lastIndexOf("</tabs>");
    var info = { notes: [], parts: partsOf(t < 0 ? "" : body.slice(t + 7)) };
    if (p && p.status === "Paused") info.notes.push("Paused " + PT.pauseText(PT.pauseOf(info.parts.hist), true));
    return info;
  }
  var PART = /^#{1,3}\s+(Notes|Private notes|History)\s*$/; // the headings that split a page into its parts — by these alone, never by how a line looks
  function partsOf(tx) { // a page's text → { desc, notes, priv, hist }, each the text of its part
    var out = { desc: [], notes: [], priv: [], hist: [] }, cur = "desc", name = { "Notes": "notes", "Private notes": "priv", "History": "hist" };
    String(tx || "").split("\n").forEach(function (l) {
      var h = PART.exec(l.replace(/^\t+/, "").trim());
      if (h) cur = name[h[1]]; else out[cur].push(l);
    });
    for (var k in out) out[k] = out[k].join("\n").trim();
    return out;
  }
  // A part's entries, for counts: its top-level lines, not a closing tag, a toggle's title or an empty block; a sub-page, database or file
  // spread over lines (<page url="…">, its title, </page>) is one
  function entriesIn(t) {
    var n = 0, inTag = null;
    String(t || "").split("\n").forEach(function (l) {
      if (!l.trim() || /^\t/.test(l)) return;
      if (inTag) { if (new RegExp("^<\\/" + inTag + ">").test(l)) inTag = null; return; }
      var m = /^<(page|database|folder|pdf|file|image|video|audio|embed)\b[^>]*>/.exec(l);
      if (m && !/\/>$/.test(m[0]) && l.indexOf("</" + m[1] + ">") < 0) inTag = m[1];
      if (!/^<\/|^<empty-block|^<summary>/.test(l)) n++;
    });
    return n;
  }
  function partHead(t, priv) {
    var h = el("div", "xh" + (priv ? " priv-h" : ""));
    if (priv) { h.insertAdjacentHTML("beforeend", ICO.private); h.title = "Only you see this — never on a client dashboard"; }
    h.appendChild(span(t)); return h;
  }
  function renderParts(box, pt, opts) { // a page's parts in their order, each under its label: Description, Notes, Private notes (never on a client's page), History
    var any = false, ex = opts.extra ? opts.extra() : null; // the problems on a milestone or task, right after what it is
    function part(label, text, md) {
      if (!text) return;
      var priv = label === "Private notes", b = el("div", "part" + (priv ? " priv-b" : "")), m = renderMd(text, md);
      b.appendChild(partHead(label, priv)); m.classList.add("after-xh"); b.appendChild(m); box.appendChild(b); any = true;
    }
    part("Description", pt.desc, {});
    if (ex) { box.appendChild(ex); any = true; }
    part("Notes", pt.notes, {}); part("Private notes", SNAP ? "" : pt.priv, {}); part("History", pt.hist, { history: true });
    box.classList.add("parts");
    if (!any && opts.empty) box.appendChild(el("div", "muted", opts.empty));
    return any;
  }
  var viewIds = {}; // a project tab's view block → its view's id: found once for the session, so polls read only the rows; a Refresh finds them again
  function tabView(txt, tab, want, run) { // a project page tab → its linked view block → the view's rows
    var m = new RegExp("<tab>\\s*" + tab + "\\s*<database url=\"([^\"]+)\"").exec(txt);
    if (!m) return Promise.reject(configErr("No " + tab + " tab on this project page. Ask Claude in chat to fix the page."));
    var block = cleanUrl(m[1]);
    return (viewIds[block] ? Promise.resolve(viewIds[block]) : fetchText(block, STRUCT).then(function (bt) {
      var v = viewsOf(bt), id = v[want] || v[Object.keys(v)[0]];
      if (!id) throw configErr("The project's " + tab + " view was not found.");
      return (viewIds[block] = id);
    })).then(function (id) { return queryView(viewUrl(block, id), 3, run); });
  }
  function loadProject(p, run) { // project page → callout, its own parts, Schedule (milestones) and Tasks (tasks) views, Done included
    return fetchText(p.url, DATA, run).then(function (txt) {
      S.pageInfo[p.key] = parseProjectPage(txt, p);
      return Promise.all([tabView(txt, "Schedule", "Schedule", run), tabView(txt, "Tasks", "Tasks", run)]);
    }).then(function (r) {
      var plan = PT.buildPlan(p, r[0], r[1]), old = S.plan[p.key] && S.plan[p.key].ms || [];
      plan.ms.forEach(function (m) { // keep what is known while it is read again
        old.forEach(function (o) { if (o.url === m.url && o.pause) m.pause = o.pause; });
      });
      S.plan[p.key] = plan;
      // a paused milestone's reason and date live in its history: one read per paused milestone, so the page shows why it waits
      return Promise.all(plan.ms.filter(function (m) { return m.status === "Paused"; }).map(function (m) {
        return fetchText(m.url, DATA, run).then(function (t) { m.pause = PT.pauseOf(partsOf(contentOf(t)).hist); }, function () {});
      }));
    }, function (err) { // read before: shown as it was, marked not updated; never read, or no longer allowed: failed
      if (!(S.plan[p.key] && S.plan[p.key].ms) || isDenial(err)) S.plan[p.key] = { err: err }; else S.plan[p.key].stale = err;
    });
  }

  // One load at a time. A Refresh or a poll that comes during a load is queued, never dropped: one more load starts when it ends —
  // past the cache if a Refresh asked for it — and every caller's promise settles when the load that answers it ends.
  var loading = null, again = null; // the load under way (a promise for its end); the one asked for meanwhile: { past, p, ok }
  function loadAll(past) {
    if (!MCP) return Promise.resolve();
    if (!loading) return startLoad(!!past);
    if (!again) { again = { past: false }; again.p = new Promise(function (ok) { again.ok = ok; }); }
    if (past) again.past = true;
    return again.p;
  }
  function startLoad(past) {
    var run = { at: Infinity };
    if (past) { fresh = {}; S.cfg = null; viewIds = {}; }
    loading = loadRun(run).then(function () {
      if (past) fresh = null;
      if (run.at < Infinity) S.lastUpdate = run.at; // the oldest data this load read, so the time never claims more than was read
      var q = again; again = null; loading = null;
      if (q) startLoad(q.past).then(q.ok); // the queued load starts before anything else can, so two never run at once
      paintLive(); render();
    });
    return loading;
  }
  function loadRun(run) { // never rejects: what fails is kept in S and said on the page
    var cfgP = S.cfg ? Promise.resolve(S.cfg) : loadConfig();
    function plans() { return Promise.all((S.projects || []).map(function (p) { return loadProject(p, run).then(render); })); }
    return cfgP.then(function (cfg) {
      var pP = queryView(cfg.active, 3, run).then(function (rows) {
        var old = {}; (S.projects || []).forEach(function (p) { old[p.key] = p; });
        S.projects = rows.map(function (r) { // the same object for a project read again, so what points at it stays right
          var p = projectOf(r, old[key(r.url)] || { kind: "project" });
          p.repo = r.Repository || ""; p.source = r.Source || ""; p.chat = r.Chat || ""; p.code = r["Code session"] || "";
          p.cfolder = PT.plain(r["Code folder"]); p.cproj = claudeProject(r["Claude project"]); p.origin = originOf(r);
          return p;
        }).filter(function (p) { return p.status === "Active" || p.status === "Paused"; });
        S.projErr = null; render();
        return plans();
      }, function (err) { S.projErr = err; if (isDenial(err)) S.projects = null; render(); return plans(); }); // the list as it was: its projects are still read again
      var qP = queryView(cfg.open, 3, run).then(
        function (rows) { S.problems = rows; S.problemsErr = null; render(); },
        function (err) { S.problemsErr = err; if (isDenial(err)) S.problems = null; render(); });
      var rP = !cfg.resolved ? Promise.resolve() : queryView(cfg.resolved, 1, run).then(
        function (rows) { S.resolved = rows; S.resolvedErr = null; render(); },
        function (err) { S.resolvedErr = err; render(); });
      return Promise.all([pP, qP, rP]);
    }, function (err) { // the config did not load: nothing was read again, so whatever was read before is marked not updated
      S.projErr = S.problemsErr = err; if (S.resolved) S.resolvedErr = err;
      (S.projects || []).forEach(function (p) { var d = S.plan[p.key]; if (d && d.ms) d.stale = err; });
      render();
    }).catch(function (e) { if (window.console) console.error(e); });
  }
  function projectOf(r, p) { // a Projects row → the project's fields both pages use, on p
    p.url = cleanUrl(r.url); p.key = key(r.url); p.name = clean(r.Name) || "Untitled"; p.client = clean(r.Client); p.status = r.Status || "";
    p.summary = clean(r.Summary); p.target = dnum(r["date:Target end:start"]); p.ref = PT.refOf("project", r.Ref);
    return p;
  }
  function staleParts() { // what the last load could not read again and still shows as it was before
    var out = [];
    if (S.projErr && S.projects) out.push("the project list");
    (S.projects || []).forEach(function (p) { if (S.plan[p.key] && S.plan[p.key].stale) out.push(p.name); });
    if (S.problemsErr && S.problems) out.push("problems");
    if (S.resolvedErr && S.resolved) out.push("resolved problems");
    return out;
  }
  function failBox(what, err, had) { return errBox(had ? what + " not updated: " : what + " didn't load. ", err); } // had: its data from before is still shown

  // ---------- derived data, filtered by origin ----------
  function shown(p) { return !S.origins.length || S.origins.indexOf(p.origin) >= 0; } // no origin picked: all of them
  function projs() { return (S.projects || []).filter(shown); }
  function allProjByKey() { var o = {}; (S.projects || []).forEach(function (p) { o[p.key] = p; }); return o; }
  function projByKey() { var o = {}; projs().forEach(function (p) { o[p.key] = p; }); return o; }
  function loadedAll() { return !!S.projects && projs().every(function (p) { return S.plan[p.key]; }); }
  function planOf(p) { var d = S.plan[p.key]; return d && d.ms ? d : null; }
  function msList(p) { var d = planOf(p); return d ? d.ms : null; }
  function taskList(p) { var d = planOf(p); return d ? d.tasks : null; }
  function itemsOf(p) { var d = planOf(p); return d ? d.ms.concat(d.tasks) : []; }
  function allItems() { var out = []; projs().forEach(function (p) { out = out.concat(itemsOf(p)); }); return out; }
  function mentioned(u) { // the item of the tracker a mention points to, if any
    var k = key(u);
    return itemIndex()[k] || allProblems().filter(function (i) { return key(i.url) === k; })[0] || null;
  }
  function itemIndex() { var o = {}; (S.projects || []).forEach(function (p) { itemsOf(p).forEach(function (x) { o[key(x.url)] = x; }); }); return o; }
  function liveProblems() { // the open problems of the projects shown
    var pk = projByKey();
    return (S.problems || []).map(problemOf).filter(function (i) { return pk[i.pk] && (i.status === "Open" || i.status === "Waiting"); });
  }
  function allProblems() { return (S.problems || []).map(problemOf).concat((S.resolved || []).map(problemOf)); }
  function openItems() { return allItems().filter(function (x) { return isOpen(x) && !x.paused; }); }
  function lateItems() { return openItems().filter(function (x) { return x.late > 0; }).sort(function (a, b) { return b.late - a.late; }); }
  function dueItems() {
    var t = todayNum();
    return openItems().filter(function (x) { return !(x.late > 0) && x.end != null && x.end - t <= 7; })
      .sort(function (a, b) { return a.end - b.end || (a.kind === "ms" ? -1 : 1); });
  }
  function worstLate(p) { return PT.worstLate(itemsOf(p)); }
  function nextEnd(p) { // its nearest open end; an undated item counts as a month away
    return itemsOf(p).filter(function (x) { return isOpen(x) && !x.paused; }).reduce(function (a, x) { return Math.min(a, x.end == null ? todayNum() + 30 : x.end); }, 1e9);
  }
  function blockersOf(p) { return liveProblems().filter(function (i) { return i.pk === p.key && i.type === "Blocker"; }); }
  function waitingTasks(list) { return (list || []).filter(function (k) { return k.status === "Waiting" && !k.paused; }); }
  function waitingOf(p) { // tasks waiting on someone and problems (not risks) with a name in Waiting on
    return waitingTasks(taskList(p)).concat(liveProblems().filter(function (i) { return i.pk === p.key && i.waiting && i.type !== "Risk"; }));
  }
  function failed(p) { return S.plan[p.key] && S.plan[p.key].err ? 1 : 0; }
  function sortedProjects() { // paused last; failed, blocked, the latest, the nearest due first
    var blocked = {}; liveProblems().forEach(function (i) { if (i.type === "Blocker") blocked[i.pk] = 1; });
    return projs().slice().sort(function (a, b) {
      return (a.status === "Paused") - (b.status === "Paused") || failed(b) - failed(a) || (blocked[b.key] || 0) - (blocked[a.key] || 0)
        || worstLate(b) - worstLate(a) || nextEnd(a) - nextEnd(b) || a.name.localeCompare(b.name);
    });
  }
  function stateOfProject(p) { return PT.projectState(p, S.plan[p.key], blockersOf(p).length, !!(S.problemsErr && !S.problems)); }
  function failures() { return projs().filter(failed); }

  // ---------- the header ----------
  function renderHeader() {
    if (SNAP) return; // a client's page: one client, no origin filter
    var kinds = {}; (S.projects || []).forEach(function (p) { kinds[p.origin] = (kinds[p.origin] || 0) + 1; });
    var ks = ORIGINS.filter(function (k) { return kinds[k]; }).concat(Object.keys(kinds).filter(function (k) { return ORIGINS.indexOf(k) < 0; }));
    if (S.projects) { // an origin with no project left drops out
      S.origins = S.origins.filter(function (k) { return kinds[k]; });
      if (S.origins.length >= ks.length) S.origins = [];
    }
    var tb = $("origin"); clear(tb); if (ks.length < 2) return;
    var total = (S.projects || []).length;
    function on(k) { return k === "All" ? !S.origins.length : S.origins.indexOf(k) >= 0; }
    function cnt(k) { return k === "All" ? total : kinds[k]; }
    function lab() { return !S.origins.length ? "All projects" : ks.filter(on).join(", "); }
    function sum() { return S.origins.reduce(function (a, k) { return a + kinds[k]; }, 0) || total; }
    function pick(k) { // several origins at once: All clears the choice, an origin goes in or out of it, and all of them picked is All again
      var i = S.origins.indexOf(k);
      if (k === "All") S.origins = []; else if (i < 0) S.origins = S.origins.concat([k]); else S.origins = S.origins.slice(0, i).concat(S.origins.slice(i + 1));
      if (S.origins.length >= ks.length) S.origins = [];
      try { localStorage.setItem("pt.origins", JSON.stringify(S.origins)); localStorage.removeItem("pt.origin"); } catch (e) {}
      TLN.reset();
    }
    if (ks.length <= 3) { // a few origins: all in view as a segmented control, one click each; more than three take the menu below
      var seg = el("div", "seg"); seg.setAttribute("role", "group"); seg.setAttribute("aria-label", "Which projects to show, by Origin: one or several");
      ["All"].concat(ks).forEach(function (k) {
        var o = btn("", null, function () { pick(k); paint(); });
        o.setAttribute("aria-pressed", String(on(k))); o.appendChild(span(k)); o.appendChild(span(String(cnt(k)), "n")); seg.appendChild(o);
      });
      tb.appendChild(seg); return;
    }
    var b = btn("", null), menu = el("div", "dd-m"); menu.hidden = true; menu.setAttribute("role", "menu");
    var bl = span(lab()), bn = span(String(sum()), "n");
    b.appendChild(bl); b.appendChild(bn); b.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.8 5 6.8 8 3.8"/></svg>');
    b.setAttribute("aria-haspopup", "menu"); b.setAttribute("aria-expanded", "false"); b.title = "Which projects to show, by Origin: one or several";
    b.addEventListener("click", function (e) { e.stopPropagation(); var op = menu.hidden; menu.hidden = !op; b.setAttribute("aria-expanded", String(op)); });
    var items = ["All"].concat(ks).map(function (k) {
      var o = btn("", null, function () { // the menu stays open for the next pick; the page behind follows each one
        pick(k);
        items.forEach(function (it) { it.o.setAttribute("aria-checked", String(on(it.k))); });
        bl.textContent = lab(); bn.textContent = String(sum()); paint(true);
      });
      o.setAttribute("role", "menuitemcheckbox"); o.setAttribute("aria-checked", String(on(k)));
      o.appendChild(span(k === "All" ? "All projects" : k)); o.appendChild(span(String(cnt(k)), "n")); menu.appendChild(o);
      return { k: k, o: o };
    });
    tb.appendChild(b); tb.appendChild(menu);
  }
  function goTo(id) { var t = $(id); if (!t) return; if (t.tagName === "DETAILS") t.open = true; t.scrollIntoView({ behavior: smooth(), block: "start" }); }
  function renderPills() {
    var host = $("pills"); clear(host);
    if (S.projErr && !S.projects) { host.appendChild(el("span", "pl crit", "Couldn't read the tracker")); return; }
    var probs = S.problems ? liveProblems() : [], noIss = S.problemsErr && !S.problems, noPlan = S.shown && failures().length > 0; // never a confident 0 for data that was not read
    [[probs.filter(function (i) { return i.type === "Blocker"; }).length, "blocked", "crit", noIss, "Problems marked Blocker"],
     [lateItems().length, "overdue", "crit", noPlan, "Milestones and tasks past their end date"],
     [dueItems().length, "due soon", "warn", noPlan, "Milestones and tasks that end within the next 7 days"]].forEach(function (c) { // count, word, colour, unsure, tip
      var b = el("button", "pl" + (c[0] && c[2] ? " " + c[2] : "")); b.type = "button";
      b.appendChild(el("b", "", !S.shown ? "–" : c[3] ? (c[0] ? c[0] + "+" : "?") : String(c[0])));
      b.appendChild(document.createTextNode(c[1]));
      b.title = c[3] ? "Part of the data did not load, so this count may be incomplete." : c[4];
      b.addEventListener("click", function () { goTo(SNAP ? "sideP" : "moveP"); });
      host.appendChild(b);
    });
  }

  // ---------- project cards ----------
  function renderCards() {
    var host = $("cards"), ps = sortedProjects(); clear(host);
    if (trackerErr()) { $("projCount").textContent = ""; host.appendChild(errBox("Couldn't read the tracker. ", trackerErr())); return; }
    if (S.projErr) host.appendChild(failBox("The project list", S.projErr, true)); // read before, so shown as it was
    if (!ps.length) host.appendChild(el("div", "empty", (S.projects || []).length ? "No projects of this kind." : "No active projects."));
    var onYou = {}; // per project, as many as its lines in Your move
    moveGroups().all.forEach(function (x) { var k = x.pk || (x.project && x.project.key); onYou[k] = (onYou[k] || 0) + 1; });
    var act = ps.filter(function (p) { return p.status !== "Paused"; }).length;
    $("projCount").textContent = ps.length ? act + " active" + (ps.length - act ? ", " + (ps.length - act) + " paused" : "") : "";
    ps.forEach(function (p) { host.appendChild(card(p, onYou[p.key] || 0)); });
  }
  function card(p, on) { // on: how many lines of Your move are its
    var st = stateOfProject(p), c = btn("pc" + (st.trouble ? " bad" : ""), null, function () { openProject(p); }), d = S.plan[p.key];
    var top = el("div", "pc-top"), nm = el("div", "mid");
    nm.appendChild(PT.titled("pc-name", p, p.name)); nm.appendChild(el("div", "pc-who", PT.whoOf(p)));
    top.appendChild(nm); if (st.text) top.appendChild(el("span", "pill " + st.cls, st.text)); c.appendChild(top);
    var ms0 = msList(p) || [], tk0 = taskList(p) || [], strip = ms0.length ? ms0 : tk0;
    if (d && d.stale) c.appendChild(el("div", "warn", "Not updated: " + errText(d.stale))); // shown as it was before
    if (d && d.err) c.appendChild(el("div", "crit", "Its plan didn't load. " + errText(d.err)));
    else if (d) { // where it stands: the page's own lines, fewer — what is late or blocked first, then what is under way
      var lines = PT.standing(ms0, tk0, blockersOf(p));
      c.appendChild(!lines.length ? el("div", "muted", strip.length ? "Everything is done." : "No plan yet.")
        : PT.standRows(lines, { max: 3, subs: 2, name: function (x, cls) { return span(x.name, cls); } }));
    }
    var foot = el("div", "pc-foot");
    if (strip.length) foot.appendChild(markStrip(strip, "mstrip"));
    var capn = el("div", "pc-cap");
    if (strip.length) capn.appendChild(span(PT.doneCount(strip) + " of " + strip.length + (ms0.length ? " milestones" : " tasks") + " done"));
    if (p.target != null) capn.appendChild(span("ends " + fmt(p.target)));
    var rk = liveProblems().filter(function (i) { return i.pk === p.key && i.type === "Risk"; }).length, sd = SNAP ? sidesOf(p) : null, wt = SNAP ? 0 : waitingOf(p).length;
    var cnt = (SNAP ? [sd.you.length ? sd.you.length + " on your side" : "", sd.third.length ? sd.third.length + " with others" : ""] : [on ? on + " on you" : "", wt ? wt + " waiting" : ""])
      .concat([rk ? plural(rk, "risk") : ""]).filter(Boolean).join(" · ");
    if (cnt) capn.appendChild(span(cnt, "r"));
    foot.appendChild(capn); c.appendChild(foot);
    return c;
  }

  function markStrip(list, cls) { // a mark per milestone (or task), in its state
    var pr = el("div", cls); sortItems(list).forEach(function (m) { pr.appendChild(el("i", m.state === "plan" ? "" : m.state)); }); return pr;
  }

  // ---------- right column ----------
  // One grammar for every list line: its kind's tag and its name; where it sits, a word only where the group does not say it, and its ID;
  // on the right the one number that matters. Every line says what it is — Task, Milestone, or a problem's type, coloured as on a project page.
  function kindTag(x) {
    if (x.kind === "problem") return el("span", "tt " + (x.type || ""), x.type || "Problem");
    return el("span", "tt " + (x.kind === "ms" ? "Ms" : "Tk"), x.kind === "ms" ? "Milestone" : "Task");
  }
  function whereOf(x) { // its full path, so it is plain which milestone it is in: project › milestone › task
    var p = x.kind === "problem" ? allProjByKey()[x.pk] : x.project, idx = itemIndex(), ms = null, tk = null;
    if (x.kind === "problem") { tk = idx[x.tk] || null; ms = idx[x.mk] || (tk && tk.ms) || null; } else if (x.kind === "task") ms = x.ms;
    return [p ? p.name : "", ms ? ms.name : "", tk ? tk.name : ""].filter(Boolean) // it wraps only between steps, never inside a name
      .map(function (n) { return n.replace(/ /g, "\u00a0"); }).join(" › ");
  }
  // One line in a list; opens its project with the item in view. o: mark, tag (false: the group says it), say (a word the group does not say)
  // and sayCls, meta (the number on the right) and cls
  function item(x, o) {
    var b = btn("it", null, function () { goItem(x); });
    b.appendChild(el("span", "mk " + (o.mark || "")));
    var mid = el("span", "mid"), t = el("span", "t");
    if (o.tag !== false) t.appendChild(kindTag(x));
    t.appendChild(span(x.name)); mid.appendChild(t);
    var s = el("span", "s"), w = whereOf(x), cut = w.lastIndexOf(" "), r = PT.refTag(x), who = onWhom(x);
    if (who) s.appendChild(span(who, "say")); // on whom, on every open task and problem, whatever the group says
    if (o.say) s.appendChild(span(o.say, "say " + (o.sayCls || "")));
    if (!r) s.appendChild(span(w));
    else { // the ID never wraps away from the path's last step
      s.appendChild(span(w.slice(0, cut + 1)));
      var tail = el("span", "nw", w.slice(cut + 1)); tail.appendChild(r); s.appendChild(tail);
    }
    mid.appendChild(s); b.appendChild(mid);
    b.appendChild(el("span", "m " + (o.cls || ""), o.meta || ""));
    return b;
  }
  function moveGroups() { // what asks for an action now, each thing once
    var t = todayNum(), probs = S.problems ? liveProblems() : [], seen = {};
    function once(x) { var k = key(x.url); if (seen[k]) return false; seen[k] = 1; return true; }
    var blocked = probs.filter(function (i) { return i.type === "Blocker"; }).sort(byAge).filter(once);
    var overdue = lateItems().filter(once), due = dueItems().filter(once);
    var tasksOnMe = allItems().filter(function (k) {
      if (k.kind !== "task" || !isOpen(k) || k.paused || k.status === "Waiting" || k.waiting) return false;
      if (k.status === "In progress") return true;
      if (k.start != null) return k.start <= t + 7;
      return !k.ms || k.ms.status === "In progress"; // an undated step of the work under way
    }).sort(function (a, b) { // started first, then by start
      return (a.status === "In progress" ? 0 : 1) - (b.status === "In progress" ? 0 : 1) || (a.start == null ? 1e9 : a.start) - (b.start == null ? 1e9 : b.start);
    });
    var questions = probs.filter(function (i) { return !i.waiting && i.type === "Question"; }).sort(function (a, b) { return (a.opened || 1e9) - (b.opened || 1e9); });
    var mine = tasksOnMe.filter(once), decide = questions.filter(once);
    // started, and what starts within the week or is an undated step of the work under way
    var doing = mine.filter(function (k) { return k.status === "In progress"; }), next = mine.filter(function (k) { return k.status !== "In progress"; });
    var needs = allItems().filter(function (m) { return m.kind === "ms" && OPEN_MS[m.status] && m.start == null && !m.paused; }).filter(once);
    return { blocked: blocked, overdue: overdue, due: due, doing: doing, next: next, decide: decide, all: blocked.concat(overdue, due, doing, decide), needs: needs };
  }
  function byAge(a, b) { return (ageOf(b) || 0) - (ageOf(a) || 0); } // the oldest first
  function ageLabel(x) { // a risk waits on no one, so its age says nothing
    var a = ageOf(x);
    return x.kind === "problem" && x.type === "Risk" || a == null ? "" : a === 0 ? "today" : days(a);
  }
  function context(x) { // where an item sits in its project: a problem's milestone › task, a task's milestone
    if (x.kind !== "problem") return x.ms ? x.ms.name : "";
    var idx = itemIndex(), ms = idx[x.mk], tk = idx[x.tk];
    return [ms ? ms.name : "", tk ? tk.name : ""].filter(Boolean).join(" › ");
  }
  function notLoaded(host) { host.appendChild(el("div", "empty", "Nothing to show until the tracker loads.")); } // a side panel while the tracker did not load
  var gFold = {}; try { gFold = JSON.parse(localStorage.getItem("pt.gfold") || "{}") || {}; } catch (e) {} // a group folds from its head; each viewer's choice is remembered, per panel
  function groupList(host, panel, groups, allBtn) { // groups: {name, cls, list, row, folded (at first)}; allBtn in the panel's head opens or folds them all
    var shown = groups.filter(function (g) { return g.list.length; }), parts = [];
    function isFolded(g) { var k = panel + ":" + g.name; return k in gFold ? gFold[k] : !!g.folded; }
    function anyFolded() { return parts.some(function (p) { return p.folded; }); }
    function paintAll() { if (!allBtn) return; allBtn.hidden = shown.length < 2; allBtn.textContent = anyFolded() ? "Expand all" : "Collapse all"; }
    function set(p, folded) { // in place, so the rest of the panel stays as it is
      if (p.folded === folded) return; p.folded = folded; gFold[panel + ":" + p.g.name] = folded;
      p.h.classList.toggle("open", !folded); p.h.setAttribute("aria-expanded", String(!folded));
      if (folded) { slide(p.b, false, function () { if (p.folded) p.b.hidden = true; }); return; }
      if (!p.b.firstChild) p.g.list.forEach(function (x) { p.b.appendChild(p.g.row(x)); });
      p.b.hidden = false; slide(p.b, true);
    }
    function save() { try { localStorage.setItem("pt.gfold", JSON.stringify(gFold)); } catch (e) {} paintAll(); }
    shown.forEach(function (g) {
      var p = { g: g, folded: isFolded(g) };
      p.h = btn("gh gf" + (g.cls ? " " + g.cls : "") + (p.folded ? "" : " open"), null, function () { set(p, !p.folded); save(); });
      p.h.setAttribute("aria-expanded", String(!p.folded));
      p.h.appendChild(span(g.name)); p.h.appendChild(span(String(g.list.length), "n")); p.h.insertAdjacentHTML("beforeend", CHEV);
      p.b = el("div", "gb"); p.b.hidden = p.folded;
      if (!p.folded) g.list.forEach(function (x) { p.b.appendChild(g.row(x)); });
      host.appendChild(p.h); host.appendChild(p.b); parts.push(p);
    });
    paintAll();
    if (allBtn) allBtn.onclick = function (e) { // inside the panel's head: it must not fold the panel
      e.preventDefault(); e.stopPropagation();
      var any = anyFolded(); parts.forEach(function (p) { set(p, !any); }); save();
    };
  }
  function renderMove() {
    var host = $("moveList"), mg = moveGroups();
    function due(x) { return x.start == null ? "no date" : x.openEnd ? "no end date" : "due " + soon(x.end); }
    var groups = [ // by what the user does, the most urgent first; Up next and Milestones without dates are not today's work: folded at first and not counted
      { name: "Blocked", cls: "crit", list: mg.blocked, row: function (i) { return item(i, { mark: "crit", meta: ageLabel(i), cls: "crit" }); } },
      { name: "Overdue", cls: "crit", list: mg.overdue, row: function (m) { return item(m, { mark: "crit", meta: days(m.late) + " late", cls: "crit" }); } },
      { name: "Due soon", cls: "warn", list: mg.due, row: function (m) { return item(m, { mark: "warn", say: m.status === "Planned" ? "not started" : "", meta: soon(m.end), cls: "warn" }); } },
      { name: "Doing", list: mg.doing, row: function (x) { return item(x, { meta: due(x) }); } },
      { name: "Up next", list: mg.next, folded: true, row: function (x) { // the timeline shows them better
        return item(x, { meta: x.start != null && x.start > todayNum() ? "starts " + soon(x.start) : due(x) });
      } },
      { name: "To decide", list: mg.decide, row: function (x) { return item(x, { meta: ageLabel(x), cls: ageCls(ageOf(x)) }); } },
      { name: "Milestones without dates", list: mg.needs, folded: true, row: function (m) { // planning; the head says they are milestones
        return item(m, { tag: false, say: m.status === "In progress" ? "in progress" : "planned" });
      } }
    ];
    keep(host, function () {
      clear(host);
      if (trackerErr()) { notLoaded(host); $("moveCount").textContent = ""; $("moveAll").hidden = true; return; }
      if (S.problemsErr) host.appendChild(failBox("Problems", S.problemsErr, !!S.problems));
      var n = groups.reduce(function (a, g) { return g.folded ? a : a + g.list.length; }, 0);
      if (!n) host.appendChild(el("div", "empty", "Nothing needs you right now."));
      groupList(host, "move", groups, $("moveAll"));
      $("moveCount").textContent = n ? String(n) : "";
    });
  }
  function renderWaiting() {
    var host = $("waitList");
    keep(host, function () {
      clear(host);
      $("waitAll").hidden = true;
      if (trackerErr()) { notLoaded(host); $("waitCount").textContent = ""; return; }
      if (S.problemsErr) host.appendChild(failBox("Problems", S.problemsErr, !!S.problems));
      var w = []; projs().forEach(function (p) { w = w.concat(waitingOf(p)); });
      var groups = {}; w.forEach(function (x) { (groups[x.waiting || "Someone"] = groups[x.waiting || "Someone"] || []).push(x); });
      function since(x) { var a = ageOf(x); return a == null ? -1 : a; }
      var parties = Object.keys(groups).map(function (k) { // each party's oldest first, the party waited on longest first
        var g = groups[k].sort(function (a, b) { return since(b) - since(a); });
        return { k: k, g: g, oldest: since(g[0]) };
      }).sort(function (a, b) { return b.oldest - a.oldest || a.k.localeCompare(b.k); });
      $("waitCount").textContent = w.length ? String(w.length) : "";
      if (!parties.length) { if (!(S.problemsErr && !S.problems)) host.appendChild(el("div", "empty", "No one to chase.")); return; }
      function row(x) {
        var a = ageOf(x), late = x.kind === "task" && x.late > 0;
        return item(x, { mark: late ? "crit" : ageCls(a), say: dueSay(x), sayCls: late ? "crit" : "", meta: a != null ? days(a) : "", cls: late ? "crit" : ageCls(a) });
      }
      groupList(host, "wait", parties.map(function (pt) { return { name: pt.k, list: pt.g, row: row }; }), $("waitAll"));
    });
  }
  function dueSay(x) { return x.kind !== "task" ? "" : x.late > 0 ? days(x.late) + " late" : x.end != null ? "due " + fmt(x.end) : ""; } // a waiting task's own time
  function riskBy(i) { // the date it matters by: its task's, else its milestone's end
    var idx = itemIndex(), on = idx[i.tk] || idx[i.mk];
    return on && isOpen(on) && on.end != null && !on.openEnd ? on.end : null;
  }
  function renderRisks() { // risks need no action now, only keeping in mind: each with what it threatens and by when
    var host = $("riskList"), rs = liveProblems().filter(function (i) { return i.type === "Risk"; });
    rs.sort(function (a, b) { var x = riskBy(a), y = riskBy(b); return (x == null ? 1e9 : x) - (y == null ? 1e9 : y) || (a.opened || 0) - (b.opened || 0); });
    keep(host, function () {
      clear(host); $("riskCount").textContent = rs.length ? String(rs.length) : "";
      if (trackerErr()) { notLoaded(host); $("riskCount").textContent = ""; return; }
      if (S.problemsErr) { host.appendChild(failBox("Problems", S.problemsErr, !!S.problems)); if (!S.problems) return; }
      if (!rs.length) { host.appendChild(el("div", "empty", "No open risks.")); return; }
      rs.forEach(function (i) { var by = riskBy(i); host.appendChild(item(i, { meta: by != null ? "by " + fmt(by) : "" })); });
    });
  }
  function renderDone() {
    var t = todayNum(), pk = projByKey(), out = [];
    allItems().forEach(function (m) { if (m.status === "Done" && m.finished != null && t - m.finished <= 7) out.push({ x: m, when: m.finished }); });
    (S.resolved || []).map(problemOf).forEach(function (i) {
      if (pk[i.pk] && i.status === "Resolved" && i.resolvedOn != null && t - i.resolvedOn <= 7) out.push({ x: i, when: i.resolvedOn });
    });
    out.sort(function (a, b) { return b.when - a.when; });
    $("doneCount").textContent = out.length ? String(out.length) : "";
    var host = $("doneList"); clear(host);
    if (trackerErr()) { $("doneCount").textContent = ""; notLoaded(host); return; }
    if (S.resolvedErr) host.appendChild(failBox("Resolved problems", S.resolvedErr, !!S.resolved));
    if (!out.length) { if (!(S.resolvedErr && !S.resolved)) host.appendChild(el("div", "empty", "Nothing finished in the last 7 days.")); return; }
    out.forEach(function (o) { host.appendChild(item(o.x, { meta: fmt(o.when), cls: "good" })); });
  }

  // ---------- a client's page: the snapshot, and the open items by whose side they are on ----------
  function loadSnapshot(D) { // data.js: per project its row, milestones, tasks and problems, rows as the views return them (references/client-dashboards.md)
    S.projects = []; S.problems = []; S.resolved = []; S.cfg = {};
    function pub(t) { // Private notes never reach a client's page, even if the data has them
      var pt = partsOf(PT.notionText(t)), o = [];
      if (pt.desc) o.push(pt.desc);
      if (pt.notes) o.push("## Notes\n" + pt.notes);
      if (pt.hist) o.push("## History\n" + pt.hist);
      return o.join("\n\n");
    }
    for (var sp in D.subpages || {}) S.snapPages[key(sp)] = PT.notionText(D.subpages[sp]);
    (D.projects || []).forEach(function (x) {
      var r = x.project || {}, p = projectOf(r, { kind: "project", origin: "" }); // one client: no origin
      S.plan[p.key] = PT.buildPlan(p, x.milestones || [], x.tasks || []); S.pageInfo[p.key] = { notes: [], parts: partsOf(pub(r.page)) }; S.projects.push(p);
      (x.milestones || []).concat(x.tasks || [], x.problems || []).forEach(function (row) { if (row.page) S.snapPages[key(row.url)] = pub(row.page); });
      (x.tasks || []).concat(x.problems || []).forEach(function (row) { if (row.Side) S.side[key(row.url)] = row.Side; });
      (x.problems || []).forEach(function (row) {
        var q = {}; for (var k in row) if (k !== "page") q[k] = row[k]; q.Project = JSON.stringify([p.url]);
        (q.Status === "Resolved" ? S.resolved : S.problems).push(q);
      });
    });
    PT.setSides(S.side);
    var t = D.title || (S.projects.length === 1 ? S.projects[0].name : S.projects[0] ? S.projects[0].client : "Project status");
    $("ttl").textContent = t; if (/^__TITLE/.test(document.title)) document.title = t;
    var up = Date.parse(D.updated || ""); S.lastUpdate = isNaN(up) ? 0 : up; paintLive();
  }
  // Its open items (p: one project, or null: all shown) by whose side they are on: the client's, ours (nobody else to act), a third
  // party's; risks apart. Blockers first, then the oldest.
  function sidesOf(p) {
    var out = { you: [], us: [], third: [], risk: [] };
    var tasks = (p ? [p] : projs()).reduce(function (a, q) { return a.concat(waitingTasks(taskList(q))); }, []);
    liveProblems().filter(function (i) { return !p || i.pk === p.key; }).concat(tasks).forEach(function (x) {
      out[x.kind === "problem" && x.type === "Risk" ? "risk" : !x.waiting ? "us" : S.side[key(x.url)] === "client" ? "you" : "third"].push(x);
    });
    function blocker(x) { return x.type === "Blocker" ? 0 : 1; }
    ["you", "us", "third", "risk"].forEach(function (k) { out[k].sort(function (a, b) { return blocker(a) - blocker(b) || byAge(a, b); }); });
    return out;
  }
  function sideGroups(sd) { return [["On your side", sd.you], ["On our side", sd.us], ["With third parties", sd.third], ["Risks to keep in mind", sd.risk]]; }
  function renderSides() { // the right column of a client's page: one list of what is open, by side
    var host = $("sideList"), sd = sidesOf(null), n = sd.you.length + sd.us.length + sd.third.length + sd.risk.length;
    keep(host, function () {
      clear(host); $("sideCount").textContent = n ? String(n) : "";
      if (!n) { host.appendChild(el("div", "empty", "Nothing open right now.")); $("sideAll").hidden = true; return; }
      groupList(host, "side", sideGroups(sd).map(function (g) {
        return { name: g[0], list: g[1], row: function (x) {
          var a = ageOf(x), late = x.kind === "task" && x.late > 0, blk = x.kind === "problem" && x.type === "Blocker";
          return item(x, { mark: late || blk ? "crit" : g[1] === sd.risk ? "" : ageCls(a), say: dueSay(x), sayCls: late ? "crit" : "", meta: ageLabel(x), cls: late ? "crit" : ageCls(a) });
        } };
      }), $("sideAll"));
    });
  }

  // ---------- the project page ----------
  var bodyWaiters = {}; // url → repaint functions of the boxes showing it
  // A page's text in host: fetched when it opens, kept so later paints never flash. opts: split (a row's page, in its parts), empty (what an
  // empty page says), extra() (the problems on it, shown while it loads and if it fails)
  function pageBody(host, url, opts) {
    var box = el("div"); host.appendChild(box);
    function extra() { var e = opts.extra && opts.extra(); if (e) { e.classList.add("part-x"); box.appendChild(e); } }
    function paint() {
      clear(box); var c = S.body[url];
      if (!c || (c.txt == null && !c.err)) {
        ["70%", "45%"].forEach(function (w) { var k = el("div", "skel"); k.style.width = w; box.appendChild(k); });
        extra(); return;
      }
      if (c.err && c.txt == null) { box.appendChild(el("div", "crit", errText(c.err))); extra(); return; }
      var tx = contentOf(c.txt).trim();
      if (opts.split) { box.hidden = !renderParts(box, partsOf(tx), opts) && !opts.empty; return; }
      box.hidden = !tx && !opts.empty;
      if (tx) box.appendChild(renderMd(tx, opts)); else if (opts.empty) box.appendChild(el("div", "muted", opts.empty));
    }
    if (SNAP) { // a client's page: the text came with the snapshot
      S.body[url] = { txt: "<content>\n" + (S.snapPages[key(url)] || "") + "\n</content>", at: Infinity };
      paint(); return;
    }
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
  // Notion's rich text (its "enhanced Markdown"): **bold**, *italic*, ~~strike~~, `code`, $`math`$, [links](url), [^citations], <br>, <span underline / color>,
  // mentions of pages (a tracker item opens here), users, dates and the rest. Nested freely: a token's inside is rich text again.
  var COLORS = /^(gray|brown|orange|yellow|green|blue|purple|pink|red)(_bg)?$/;
  function colorCls(c) { var m = COLORS.exec(String(c || "")); return m ? "nc-" + m[1] + (m[2] ? "-bg" : "") : ""; }
  function attr(tag, name) { var m = new RegExp("\\b" + name + '="([^"]*)"').exec(tag); return m ? m[1] : null; }
  function mentionDate(tag) {
    var a = dnum(attr(tag, "start")), b = dnum(attr(tag, "end")), t1 = attr(tag, "startTime"), t2 = attr(tag, "endTime");
    var x = a != null ? fmt(a, true) + (t1 ? " " + t1 : "") : "";
    return b != null && b !== a ? x + " – " + fmt(b, true) + (t2 ? " " + t2 : "") : x + (t2 && !b ? "–" + t2 : "");
  }
  // The tokens of rich text, in the order they are tried; each group's number is what inline() reads
  var INLINE = new RegExp([
    /\*\*([\s\S]+?)\*\*/, /~~([\s\S]+?)~~/, /\$`([^`]+)`\$/, /`([^`]+)`/, // 1 bold, 2 strike, 3 math, 4 code
    /\[\^([^\]]+)\]/, /\[([^\]]+)\]\(([^)\s]+)\)/, /<br\s*\/?>/, /<span\b([^>]*)>([\s\S]*?)<\/span>/, // 5 citation, 6–7 link, a line break, 8–9 span
    /<mention-page\b([^>]*?)(?:\/>|>([^<]*)<\/mention-page>)/, /<mention-date\b([^>]*?)(?:\/>|><\/mention-date>)/, // 10–11 page, 12 date
    /<mention-[a-z-]+\b[^>]*?(?:\/>|>([^<]*)<\/mention-[a-z-]+>)/, /\*([^*\s][^*]*?)\*/ // 13 any other mention, 14 italic
  ].map(function (r) { return r.source; }).join("|"), "g");
  function inline(host, s) {
    s = String(s == null ? "" : s).replace(/\s*\{(?:color|toggle)="[^"]*"(?:\s+(?:color|toggle)="[^"]*")*\}\s*$/, "");
    var re = new RegExp(INLINE.source, "g"), last = 0, m; // its own: inline() runs inside itself
    while ((m = re.exec(s))) {
      if (m.index > last) host.appendChild(document.createTextNode(unesc(s.slice(last, m.index))));
      var e;
      if (m[1] != null) { e = el("b"); inline(e, m[1]); }
      else if (m[2] != null) { e = el("s"); inline(e, m[2]); }
      else if (m[3] != null) e = el("code", "math", m[3]);
      else if (m[4] != null) {
        e = el("code");
        m[4].split(/<br\s*\/?>/).forEach(function (part, k) { if (k) e.appendChild(el("br")); e.appendChild(document.createTextNode(part)); });
      }
      else if (m[5] != null) { // a citation: a link, or a domain-like one
        var cu = /^https?:/.test(m[5]) ? m[5] : /^[\w.-]+\.[a-z]{2,}/i.test(m[5]) ? "https://" + m[5] : "";
        e = cu ? link(cu, "[↗]", "cite") : null;
      }
      else if (m[6] != null) { if (/^https?:/.test(m[7])) { e = link(m[7], ""); inline(e, m[6]); } else { e = el("span"); inline(e, m[6]); } }
      else if (m[0].charAt(0) === "<" && /^<br/.test(m[0])) e = el("br");
      else if (m[8] != null) { e = el("span", [attr(m[8], "underline") === "true" ? "u" : "", colorCls(attr(m[8], "color"))].filter(Boolean).join(" ")); inline(e, m[9]); }
      else if (m[10] != null) { // a page mention: an item of the tracker opens here; anything else opens in Notion (a client's page links nowhere into Notion)
        var mu = attr(m[10], "url") || "", it = mentioned(mu), nm = clean(m[11] || "") || (it ? it.name : "page");
        e = it ? itemLink(it, nm) : SNAP || !/^https?:/.test(mu) ? document.createTextNode(nm) : link(cleanUrl(mu), nm);
      }
      else if (m[12] != null) e = document.createTextNode(mentionDate(m[12]));
      else if (m[13] != null) e = document.createTextNode(clean(m[13]));
      else if (m[14] != null) { e = el("i"); inline(e, m[14]); }
      if (e) host.appendChild(e);
      last = re.lastIndex;
    }
    if (last < s.length) host.appendChild(document.createTextNode(unesc(s.slice(last))));
  }

  // A file on a page: a chip with its name. Notion keeps a file behind a reference whose download link lives a few minutes. The page can
  // neither show it inline (the artifact frame loads images only from its own files) nor open a tab after a call returns (window.open
  // works for few viewers), so the chip asks for a link as soon as it is drawn, again when it is pointed at once that link is old, and
  // stays a plain link that a click opens at once; a link from outside opens as it is; a client's page has the name only (its data keeps no source).
  function decoded(s, raw) { try { return decodeURIComponent(s); } catch (e) { return raw; } }
  function fileName(src, caption, kind) { // its caption, else the name in its link, else what it is
    var c = clean(String(caption || "").replace(/<[^>]+>/g, "")); if (c) return c;
    var m = /[?&]name=([^&#]+)/.exec(src || ""); if (m) return decoded(m[1].replace(/\+/g, " "), m[1]);
    var last = String(src || "").split(/[?#]/)[0].split("/").pop(); if (last) return decoded(last, last);
    return kind === "image" ? "Image" : "File";
  }
  // The link comes from the page the file is on, read again with its file links (notion-fetch, which the page always has): one read per page
  // gives every file on it a link for the next few minutes, and no tool beyond what the dashboard reads with is needed.
  var FILE_FRESH = 3 * 60000, fileLinks = {}, fileRefPage = {}, pageLinks = {}; // reference → { url, at }; reference → page id; page id → pending read
  function fileLink(src) {
    var c = fileLinks[src];
    if (c && Date.now() - c.at < FILE_FRESH) return Promise.resolve(c.url);
    var id = fileRefPage[src];
    if (!id) return Promise.reject({ code: "no_page" });
    if (!pageLinks[id]) pageLinks[id] = call("notion-fetch", { id: id, include_file_urls: true }, false).then(function (res) {
      var refs = (payload(res) || {}).references || {}, now = Date.now();
      Object.keys(refs).forEach(function (k) { fileLinks[k.replace(/&amp;/g, "&")] = { url: refs[k], at: now }; });
      delete pageLinks[id];
    }, function (err) { delete pageLinks[id]; throw err; });
    return pageLinks[id].then(function () { var f = fileLinks[src]; if (!f) throw { code: "no_link" }; return f.url; });
  }
  function fileFresh(src) { var c = fileLinks[src]; return !!(c && Date.now() - c.at < FILE_FRESH); }
  var FICO = {
    image: '<svg class="fico" viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="10" rx="1.5"/><circle cx="6" cy="6.8" r="1.2"/><path d="m2.5 12 3.8-3.6 2.7 2.4 2-1.8 2.5 2.4"/></svg>',
    file: '<svg class="fico" viewBox="0 0 16 16" aria-hidden="true"><path d="M9 1.8H4.5a1 1 0 0 0-1 1v10.4a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5.3L9 1.8zM9 1.8v3.5h3.5"/></svg>' };
  function fileChip(src, caption, kind) {
    var name = fileName(src, caption, kind), ico = FICO[kind === "image" ? "image" : "file"];
    if (!/^(notion-file-block:|https?:)/.test(src || "")) { // a client's page: the name only
      var s = el("span", "fchip off"); s.innerHTML = ico; s.appendChild(span(name, "fn")); s.title = "The file is in Notion"; return s;
    }
    var a = el("a", "fchip"); a.innerHTML = ico; a.appendChild(span(name, "fn")); a.appendChild(el("span", "arr", " ↗"));
    a.target = "_blank"; a.rel = "noopener"; a.title = "Open " + name;
    if (/^https?:/.test(src)) { a.href = src; return a; }
    src = src.replace(/&amp;/g, "&"); a.href = "#";
    function get() {
      if (!MCP) return;
      a.classList.add("busy"); a.classList.remove("failed");
      fileLink(src).then(function (u) { a.href = u; a.classList.remove("busy"); a.title = "Open " + name; }, function () {
        a.classList.remove("busy"); a.classList.add("failed"); a.href = "#";
        a.title = "Couldn't get the file from Notion: click to try again";
      });
    }
    get();
    function refresh() { if (!fileFresh(src) && !a.classList.contains("busy")) get(); }
    a.addEventListener("mouseenter", refresh); a.addEventListener("focus", refresh);
    a.addEventListener("click", function (e) { // a fresh link opens as a plain link; an old one is fetched again and the next click opens it
      e.stopPropagation();
      if (!fileFresh(src) || a.getAttribute("href") === "#") { e.preventDefault(); get(); }
    });
    return a;
  }
  // A page's text in Notion's enhanced Markdown, as blocks: nesting is by tabs — a block's children are the lines after it indented one deeper,
  // an XML block (<callout>, <details>, <table>, <columns>, <tabs>, a synced block, meeting notes) runs to its closing tag at its own depth.
  // Read from the spec (notion://docs/enhanced-markdown-spec), so every block type has its place, not only those seen so far.
  function renderMd(text, opts) {
    opts = opts || {};
    var rows = String(text || "").split("\n").map(function (l) { var d = /^\t*/.exec(l)[0].length; return { d: d, t: l.slice(d), raw: l }; });
    var root = el("div", "md"); blocks(rows, 0, rows.length, root, opts, true); return root;
  }
  var XML = /^<(callout|details|table|columns|column|tabs|tab|synced_block|synced_block_reference|meeting-notes|notes|summary|transcript)\b[^>]*>/;
  function closeOf(rows, i, tag) { // the line that closes the XML block opened at rows[i]: the same tag, closing, at the same depth or the first one after it
    var depth = 0, open = new RegExp("^<" + tag + "\\b(?![^>]*\\/>)"), close = new RegExp("^<\\/" + tag + ">");
    for (var k = i; k < rows.length; k++) {
      var t = rows[k].t;
      if (k > i && open.test(t) && !close.test(t)) depth++;
      if (close.test(t) || (k === i && new RegExp("<\\/" + tag + ">\\s*$").test(t))) { if (!depth) return k; depth--; }
    }
    return rows.length;
  }
  function childEnd(rows, i) { // the end of rows[i]'s children: the lines indented deeper, blank lines between them included
    var k = i + 1;
    while (k < rows.length && (rows[k].d > rows[i].d || !rows[k].t.trim() && k + 1 < rows.length && rows[k + 1].d > rows[i].d)) k++;
    return k;
  }
  function inlineIn(tag, text, cls) { var e = el(tag, cls); inline(e, text); return e; }
  // An XML block opened at rows[i] (m: its opening tag's match), drawn into host; returns the line after its closing tag
  function xmlBlock(rows, i, m, host, opts) {
    var t = rows[i].t, tg = m[1], close = closeOf(rows, i, tg), inner = t.slice(m[0].length).replace(new RegExp("<\\/" + tg + ">\\s*$"), "");
    function kids(from, box) { blocks(rows, from, close, box, opts, false); return box; }
    if (tg === "table") host.appendChild(table(rows, i, close));
    else if (tg === "details") { // a toggle: its first line in <summary>, closed
      var k = i + 1, sr = k < close ? /^<summary>([\s\S]*?)<\/summary>/.exec(rows[k].t) : null, sm = el("span");
      if (sr) { inline(sm, sr[1]); k++; }
      var dt = toggle(sm); dt.appendChild(kids(k, el("div", "kids"))); host.appendChild(dt);
    }
    else if (tg === "columns") host.appendChild(kids(i + 1, el("div", "cols")));
    else if (tg === "tabs") host.appendChild(kids(i + 1, el("div", "ntabs")));
    else if (tg === "tab") { // its first line is its title
      var tb = el("div", "ntab"), k4 = i + 1;
      if (k4 < close) { tb.appendChild(inlineIn("h5", rows[k4].t)); k4++; }
      host.appendChild(kids(k4, tb));
    }
    else if (tg === "summary" || tg === "transcript") { /* meeting notes: the AI summary and the raw transcript stay in Notion; the user's notes show */ }
    else { // callout, a column, a synced block, meeting notes or their notes: a box (callout) or just its children
      var bx = el("div", tg === "callout" ? "co " + colorCls(attr(t, "color")) : tg === "column" ? "col" : "grp"), bin = bx, ic = tg === "callout" ? attr(t, "icon") : null;
      if (ic && !/[\/:]/.test(ic)) { bx.classList.add("ic"); bx.appendChild(el("span", "co-i", ic)); bin = el("div"); bx.appendChild(bin); } // an emoji icon; a custom image icon stays in Notion
      if (inner.trim()) bin.appendChild(inlineIn(tg !== "meeting-notes" ? "p" : "h5", inner));
      kids(i + 1, bin); host.appendChild(bx);
    }
    return close + 1;
  }
  // Since Oct 20 a sub-page, database or file spreads over lines — <page url="…">, its title, </page>: read as one line. Returns the
  // line and how many lines more it took.
  function oneLine(rows, i, end) {
    var t = rows[i].t, ml = /^<(page|database|folder|pdf|file|image|video|audio|embed)\b[^>]*>/.exec(t);
    if (!ml || /\/>$/.test(ml[0]) || t.indexOf("</" + ml[1] + ">") >= 0) return { t: t, wide: 0 };
    var k = i + 1, inner = [], cl = new RegExp("^<\\/" + ml[1] + ">\\s*$");
    while (k < end && !cl.test(rows[k].t)) { if (rows[k].t.trim()) inner.push(rows[k].t.trim()); k++; }
    return k < end ? { t: ml[0] + inner.join(" ") + "</" + ml[1] + ">", wide: k - i } : { t: t, wide: 0 };
  }
  function embedded(t) { // a sub-page, an embedded database or folder, or a file (a block with its caption inside, or a Markdown image) as its node, or null
    var pg = /^<page url="([^"]+)"[^>]*>([^<]*)<\/page>/.exec(t), m;
    if (pg) return subPage(cleanUrl(pg[1]), clean(pg[2]) || "Untitled");
    if (/^<(database|folder)\b/.test(t)) return el("div", "muted", /^<folder/.test(t) ? "A folder — open the page in Notion to see it." : "An embedded database — open the page in Notion to see it.");
    var fb = /^<(pdf|file|image|video|audio|embed)\b([^>]*?)\/?>(?:([\s\S]*?)<\/\1>)?\s*$/.exec(t) || (m = /^!\[([^\]]*)\]\(([^)\s]+)\)/.exec(t)) && [t, "image", 'src="' + m[2] + '"', m[1]];
    if (!fb) return null;
    var src = /\bsrc="([^"]*)"/.exec(fb[2]), fp = el("p", "fline"); // its src a Notion reference, a link, or none (a client's page)
    fp.appendChild(fileChip(src ? src[1] : "", fb[3], fb[1])); return fp;
  }
  function blocks(rows, i, end, host, opts, top) {
    var list = null, listTag = null;
    while (i < end) {
      var r = rows[i], t = r.t, m, next;
      if (!t.trim() || /^<(empty-block\s*\/?>|table_of_contents\b|custom-block\b|unknown\b)/.test(t)) { // nothing to draw; an empty block keeps a list going
        if (!/^<empty/.test(t)) list = null;
        i++; continue;
      }
      var li = /^([-*+]|\d+\.)\s+(.*)$/.exec(t);
      if (li && !/^---+\s*$/.test(t)) {
        var tag = /\d/.test(li[1]) ? "ol" : "ul";
        if (!list || listTag !== tag) { list = el(tag, opts.history && top && tag === "ul" ? "hist" : ""); listTag = tag; host.appendChild(list); }
        var td = /^\[([ xX])\]\s*/.exec(li[2]), itm = el("li", td ? "todo" + (td[1] !== " " ? " done" : "") : ""); // a checklist item: its box, ticked or not, read-only
        if (td) itm.appendChild(el("span", "cb"));
        itm.appendChild(inlineIn("span", td ? li[2].slice(td[0].length) : li[2], "lt"));
        next = childEnd(rows, i);
        if (next > i + 1) { var kid = el("div", "kids"); blocks(rows, i + 1, next, kid, opts, false); itm.appendChild(kid); }
        list.appendChild(itm); i = next; continue;
      }
      list = null;
      if (/^```/.test(t)) { // code: literal, to the closing fence
        var lang = t.slice(3).trim(), k = i + 1, lines = [];
        while (k < end && !/^```\s*$/.test(rows[k].t)) { lines.push(rows[k].raw.slice(Math.min(r.d, /^\t*/.exec(rows[k].raw)[0].length))); k++; }
        var pre = el("pre"); pre.textContent = lines.join("\n"); if (lang) pre.dataset.lang = lang;
        host.appendChild(pre); i = k + 1; continue;
      }
      if (/^\$\$\s*$/.test(t)) { // an equation, to its closing $$
        var k2 = i + 1, eq = []; while (k2 < end && !/^\$\$\s*$/.test(rows[k2].t)) eq.push(rows[k2++].t);
        var ep = el("pre", "math"); ep.textContent = eq.join("\n"); host.appendChild(ep); i = k2 + 1; continue;
      }
      if ((m = XML.exec(t))) { i = xmlBlock(rows, i, m, host, opts); continue; }
      if (/^<\/[a-z-_]+>\s*$/.test(t)) { i++; continue; } // a stray closing tag
      var one = oneLine(rows, i, end); t = one.t; // read on as one line from here
      var em = embedded(t);
      if (em) { host.appendChild(em); i += 1 + one.wide; continue; }
      if (/^---+\s*$/.test(t)) { host.appendChild(el("hr")); i++; continue; }
      next = childEnd(rows, i); var blk;
      var h = /^(#{1,6})\s+(.*)$/.exec(t);
      if (h) { // a toggle heading folds its children
        blk = inlineIn(h[1].length <= 2 ? "h3" : "h4", h[2]);
        if (/\{[^{}]*\btoggle="true"/.test(t) && next > i + 1) blk = toggle(blk);
      }
      else blk = /^>\s?/.test(t) ? inlineIn("blockquote", t.replace(/^>\s?/, "")) : inlineIn("p", t);
      var ba = /\{[^{}]*\bcolor="([^"]+)"[^{}]*\}\s*$/.exec(t), bc = ba ? colorCls(ba[1]) : ""; if (bc) blk.classList.add(bc);
      host.appendChild(blk);
      if (next > i + 1) { var kd = el("div", "kids"); blocks(rows, i + 1, next, kd, opts, false); (blk.tagName === "DETAILS" ? blk : host).appendChild(kd); }
      i = next;
    }
  }
  function toggle(head) { // Notion's toggle: closed, our chevron for a marker
    var d = el("details", "tgl"), sm = el("summary");
    sm.insertAdjacentHTML("beforeend", CHEV); sm.appendChild(head); d.appendChild(sm); return d;
  }
  function table(rows, i, close) { // <table header-row header-column> of <tr>s of <td>s (rich text each), scrolled sideways when wider than the page
    var tag = rows[i].t, hr = attr(tag, "header-row") === "true", hc = attr(tag, "header-column") === "true";
    var wrap = el("div", "tbl"), tb = el("table"), cur = null, ri = -1, colColors = [];
    if (attr(tag, "fit-page-width") === "true") tb.classList.add("fit");
    for (var k = i + 1; k < close; k++) {
      var t = rows[k].t;
      if (/^<col\b/.test(t)) { colColors.push(colorCls(attr(t, "color"))); continue; }
      if (/^<tr\b/.test(t)) { // a row, its cells on the lines after it or on its own line
        cur = el("tr", colorCls(attr(t, "color"))); ri++; tb.appendChild(cur);
        var one = /^<tr\b[^>]*>([\s\S]*)<\/tr>\s*$/.exec(t); if (one) { cells(one[1]); cur = null; }
        continue;
      }
      if (/^<\/tr>/.test(t)) { cur = null; continue; }
      if (cur && /^<td\b/.test(t)) cells(t);
    }
    function cells(src) { // a cell's column is its place in the row: cells come one per line or all on one
      var re = /<td\b([^>]*)>([\s\S]*?)<\/td>/g, m2;
      while ((m2 = re.exec(src))) {
        var ci = cur.children.length, c = inlineIn(hr && ri === 0 || hc && ci === 0 ? "th" : "td", m2[2], colorCls(attr(m2[1], "color")) || colColors[ci] || "");
        if (c.textContent.length > 40) c.classList.add("long");
        cur.appendChild(c);
      }
    }
    wrap.appendChild(tb);
    var box = el("div", "tblw"); box.appendChild(wrap); // marks the edges with more to scroll to, for the fade
    function edge() { box.classList.toggle("more-l", wrap.scrollLeft > 2); box.classList.toggle("more-r", wrap.scrollLeft + wrap.clientWidth < wrap.scrollWidth - 2); }
    wrap.addEventListener("scroll", edge, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(edge).observe(wrap);
    return box;
  }

  // ---------- Claude: one chat and one Code session per project, milestone, task or problem, their links kept in the row's `Chat` and `Code session` ----------
  // Desktop: the Claude app's own links (artifacts let claude:// out there). Phone: the web, since iOS keeps claude.ai links in the browser; a Code session lives on the Mac only.
  var MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "") || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent || ""));
  var KIND = { project: "project", ms: "milestone", task: "task", problem: "problem" };
  function chatSid(u) { var m = /session_([A-Za-z0-9]+)/.exec(String(u || "")); return m ? m[1] : null; }
  // `Code session` holds the session's own link, claude://claude.ai/epitaxy/local_<id>
  function codeSid(u) { var m = /\blocal_([A-Za-z0-9-]{1,64})/.exec(String(u || "")); return m ? m[1] : null; }
  // The Projects field `Claude project`: its link, https://claude.ai/project/<id> (an older tracker's `<name> — <id>` too); only the id is read
  function claudeProject(v) {
    var m = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i.exec(String(v || ""));
    return m ? { id: m[1].toLowerCase() } : null;
  }
  function newChatUrl(q, cp) { // the web takes the tracker project's claude.ai project; the app's own link has no way to name one
    var web = "https://claude.ai/new?mode=cowork&surface=cowork" + (cp ? "&project=" + cp.id : "") + "&q=" + encodeURIComponent(q);
    return MOBILE ? web : "claude://cowork/new?q=" + encodeURIComponent(q);
  }
  function newCodeUrl(q, folder) { // the app asks to confirm the folder, or for one when there is none
    return "claude://code/new?" + (folder ? "folder=" + encodeURIComponent(folder) + "&" : "") + "q=" + encodeURIComponent(q);
  }
  function homePath(f) { return String(f).replace(/^\/Users\/[^/]+/, "~"); }
  function projectOfItem(x, kind) { return kind === "project" ? x : x.project || allProjByKey()[x.pk]; }
  // A thread's first message: "<ID> <name> — <project>" first, then its page; for a Code session the words that say which column it claims;
  // then the session's name, which it sets itself (the app's own title is a guess): the same name for the row's chat and Code session, the
  // app already marks which is which. Only what to load: what to do next is the user's to say. again: the old thread is gone.
  function chatQ(x, kind, again, code) {
    var pr = projectOfItem(x, kind), what = code ? "Code session" : "chat";
    var name = (x.ref ? x.ref + " " : "") + x.name + (kind !== "project" && pr ? " — " + pr.name : "");
    return name + " (Project Tracker, " + x.url + "). " + (again ? "Its old " + what + " is gone: this is its " + what + " from now on. " : "")
      + (code ? "Code session" + (pr && pr.repo ? ", repository " + pr.repo : "") + ". " : "") + "Chat title: \"" + name + "\". Load it with the project-tracker skill.";
  }
  function stopClick(a) { a.addEventListener("click", function (e) { e.stopPropagation(); }); return a; } // a link inside a header that opens and folds
  function chatLink(href, text, title) {
    var a = el("a"); a.appendChild(span(text, "lbl"));
    a.href = href; a.target = "_blank"; a.rel = "noopener"; a.appendChild(el("span", "arr", " ↗"));
    if (title) a.title = title;
    return stopClick(a);
  }
  var ICON = { // the Claude app's own marks for its two modes (outlines in the shape of Tabler's messages and code), drawn in the text's colour
    chat: '<svg class="cico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 14l-3-3h-7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v10"/><path d="M14 15v2a1 1 0 0 1-1 1H6l-3 3V11a1 1 0 0 1 1-1h2"/></svg>',
    code: '<svg class="cico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8l-4 4 4 4M17 8l4 4-4 4M14 4l-4 16"/></svg>' };
  function folderLine(folder) { // a long path wraps, never cut; its full form in the tooltip
    var d = el("div", "cfolder", folder ? "Folder: " + homePath(folder) : "Folder: not set — the app asks for it"); if (folder) d.title = folder; return d;
  }
  function grpLabel(kind, text) { var d = el("div", "grp-l"); d.innerHTML = ICON[kind]; d.appendChild(document.createTextNode(text)); return d; }
  function menuItem(href, text, desc) { // a line of the Claude menu: a link, or with no href a greyed line whose desc says why
    var a = href ? chatLink(href, text) : el("span", "off", text);
    if (desc) a.appendChild(span(desc, "d"));
    return a;
  }
  function placeMenu(menu, w) { // the project page clips what passes its bottom edge: near it the menu opens upwards, when it fits there
    menu.classList.remove("up"); var box = $("drBody").getBoundingClientRect(), r = w.getBoundingClientRect(), h = menu.offsetHeight + 6;
    if (r.bottom + h > box.bottom && r.top - h >= box.top) menu.classList.add("up");
  }
  // A row's Claude: its chat, its Code session on the Mac (not on a phone) — each started when there is none yet, and it writes its own link
  // back to the row — and the rare actions by domain (items): a new thread in place of one that is gone; never empty.
  function claudeOf(x, kind) {
    var pr = projectOfItem(x, kind), cp = pr ? pr.cproj : null, folder = pr ? pr.cfolder : "", what = KIND[kind], sid = chatSid(x.chat), csid = codeSid(x.code), c = {};
    c.chatUrl = sid ? (MOBILE ? "https://claude.ai/cowork/cse_" + sid : "claude://claude.ai/code/session_" + sid) : newChatUrl(chatQ(x, kind, false), cp);
    c.chatTitle = sid ? "Opens this " + what + "'s chat" : "Start a chat about this " + what + "; every later click opens the same chat";
    if (!MOBILE) { // a phone cannot reach a Code session on the Mac
      c.codeUrl = csid ? "claude://claude.ai/epitaxy/local_" + csid : newCodeUrl(chatQ(x, kind, false, true), folder);
      c.codeTitle = csid ? "Opens this " + what + "'s Code session on this Mac"
        : "Start a Code session on this Mac, " + (folder ? "in " + homePath(folder) : "the app asks for the folder") + "; every later click opens the same session";
    }
    c.items = [grpLabel("chat", "Chat"), !sid ? menuItem(c.chatUrl, "Start a chat")
      : menuItem(newChatUrl(chatQ(x, kind, true), cp), "New chat", "For when the old one is deleted or too long: the new chat becomes this " + what + "'s chat.")];
    c.items.push(el("div", "sep"), grpLabel("code", "Code"));
    if (MOBILE) c.items.push(menuItem(null, csid ? "New Code session" : "Start a Code session", "On the Mac"));
    else c.items.push(!csid ? menuItem(c.codeUrl, "Start a Code session", "On this Mac")
      : menuItem(newCodeUrl(chatQ(x, kind, true, true), folder), "New Code session", "For when the old one is archived or too long: the new session becomes this " + what + "'s Code session."),
      folderLine(folder));
    return c;
  }
  function menuBtn(w, b, items) { // b opens the menu of items under it, inside w
    var menu = el("div", "chat-m"); menu.hidden = true; b.setAttribute("aria-expanded", "false");
    function shut() { menu.hidden = true; b.setAttribute("aria-expanded", "false"); }
    items.forEach(function (it) { if (it.tagName === "A") it.addEventListener("click", shut); menu.appendChild(it); });
    b.addEventListener("click", function (e) { // one menu open at a time
      e.stopPropagation(); var on = menu.hidden;
      document.querySelectorAll(".chat-m").forEach(function (m) { m.hidden = true; });
      menu.hidden = !on; b.setAttribute("aria-expanded", String(on)); if (on) placeMenu(menu, w);
    });
    w.appendChild(b); w.appendChild(menu); return w;
  }
  function chatBtn(x, kind) { // a row's Claude, one split button: its chat, </> its Code session, ▾ the rest
    var c = claudeOf(x, kind), w = el("span", "chat split"), main = chatLink(c.chatUrl, "Claude", c.chatTitle);
    main.insertAdjacentHTML("afterbegin", ICON.chat); w.appendChild(main);
    if (c.codeUrl) {
      var cb = el("a", "cpart"); cb.innerHTML = ICON.code;
      cb.href = c.codeUrl; cb.target = "_blank"; cb.rel = "noopener"; cb.title = c.codeTitle; cb.setAttribute("aria-label", c.codeTitle);
      w.appendChild(stopClick(cb));
    }
    var mb = btn("more", null); mb.innerHTML = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.8 5 6.8 8 3.8"/></svg>'; mb.setAttribute("aria-label", "More: new chat, new Code session");
    return menuBtn(w, mb, c.items);
  }
  document.addEventListener("click", function (e) { if (!e.target.closest(".dd-m, .chat-m, .info")) closeMenus(); });
  document.addEventListener("click", function (e) { // a Notion toggle in a page's text opens and folds smoothly, as the rest of the page does
    var sm = e.target.closest(".md details.tgl > summary"); if (!sm || e.target.closest("a, button")) return;
    var body = sm.nextElementSibling; if (!body) return; e.preventDefault();
    foldDetails(sm.parentNode, body);
  });
  function fixChat(err) { return err && err.chat ? chatLink(newChatUrl(err.chat), "Fix it in a chat with Claude") : null; }
  function trackerErr() { return S.projErr && !S.projects ? S.projErr : null; }
  function errBox(text, err) { // a config error names itself
    var d = el("div", "err", (err && err.code === "config" ? "" : text) + errText(err)), c = fixChat(err);
    if (c) { c.classList.add("fix"); d.appendChild(c); }
    return d;
  }
  function subPage(u, title) { // a sub-page: a row that opens its text in place, with Open in Notion
    var k = "sub:" + key(u), d = el("div", "sub" + (S.open[k] ? " open" : ""));
    var b = btn("", null); b.insertAdjacentHTML("beforeend", CHEV); b.appendChild(span(title)); b.setAttribute("aria-expanded", String(!!S.open[k]));
    var body = el("div", "sub-b"); body.hidden = !S.open[k];
    function fill() {
      pageBody(body, u, { empty: "This page is empty." });
      if (SNAP) return;
      var a = el("div", "actions sub-acts"); a.appendChild(link(u, "Open in Notion ↗", "ext")); body.appendChild(a);
    }
    if (S.open[k]) fill();
    b.addEventListener("click", function () {
      var on = !S.open[k], mark = function () { d.classList.toggle("open", on); b.setAttribute("aria-expanded", String(on)); };
      if (on) S.open[k] = 1; else delete S.open[k];
      if (on) { if (!body.firstChild) fill(); mark(); PG.unfold(body); } else PG.fold(b, d, body, mark, function () { return !d.classList.contains("open"); });
      PG.changed(d, on);
    });
    d.appendChild(b); d.appendChild(body); return d;
  }
  function goItem(x) { // another item of the tracker: its project's page, scrolled to it and opened
    var p = x.project && x.project.key ? x.project : projByKey()[x.pk];
    if (p) openProject(p, key(x.url));
  }
  function itemLink(x, text) {
    var b = btn("ilink", text, function (e) { e.stopPropagation(); goItem(x); });
    b.title = "Go to " + (x.kind === "problem" ? "the problem" : x.kind === "ms" ? "the milestone" : x.kind === "task" ? "the task" : "it");
    return b;
  }
  function problemsOn(k, field) { return allProblems().filter(function (i) { return i[field] === k && i.status !== "Dropped"; }); }
  function msBody(x, m) {
    PT.msFacts(x, m);
    pageBody(x, m.url, { split: true, empty: "Nothing written yet.", extra: function () { return problemLines(problemsOn(key(m.url), "mk"), itemLink); } });
  }
  function taskBody(x, k, inPlan) {
    PT.taskFacts(x, k, itemLink, inPlan);
    pageBody(x, k.url, { split: true, empty: "Nothing written yet.", extra: function () { return problemLines(problemsOn(key(k.url), "tk"), itemLink); } });
  }
  function problemBody(x, i) {
    var idx = itemIndex(), ms = idx[i.mk], tk = idx[i.tk], a = ageOf(i), where = null;
    if (i.summary) x.appendChild(el("p", "x-lede", i.summary)); // what is wrong, first
    if (ms || tk) { // what it is about, each a link to it
      where = span(ms ? "in " : "on ");
      if (ms) where.appendChild(itemLink(ms, ms.name));
      if (ms && tk) where.appendChild(document.createTextNode(" › "));
      if (tk) where.appendChild(itemLink(tk, tk.name));
    }
    PT.meta(x, [onWhom(i), where, i.opened != null ? "opened " + fmt(i.opened) + (i.status !== "Resolved" && a != null ? ", " + days(a) + " ago" : "") : "",
      i.resolvedOn != null ? "resolved " + fmt(i.resolvedOn) : ""]);
    pageBody(x, i.url, { split: true });
  }
  // What the user's project page adds to the project's facts: where it came from, its repository, Claude project and Code folder (last: a
  // path takes room) — the last two always there or said to be missing
  function projectLinks(p) {
    return function (pair) {
      if (p.source) pair(p.origin === "Upwork" ? "Upwork" : "Source", link(p.source, (p.origin === "Upwork" ? "contract" : "link") + " ↗", "ext"));
      if (p.repo) {
        var rp = link(p.repo, String(p.repo).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").split("/").slice(-2).join("/") + " ↗", "ext");
        rp.title = p.repo; pair("Repository", rp);
      }
      if (p.cproj) { // no name: a rename in claude.ai never reaches the tracker, and nothing here can read the current one
        var cpl = link("https://claude.ai/project/" + p.cproj.id, "open ↗", "ext");
        cpl.title = "The claude.ai project this project's chats open in (on the phone and the web)"; pair("Claude project", cpl);
      }
      else pair("Claude project", "none", true).title = "Its chats open outside claude.ai projects. To set one, tell Claude in a chat: “open its chats in <project link>”";
      if (p.cfolder) { // a path wraps, never cut
        var cf = pair("Code folder", homePath(p.cfolder)); cf.classList.add("long"); cf.title = p.cfolder + " — new Code sessions of this project open here";
      }
      else pair("Code folder", "not set — the first Code session fills it", true).title = "Its first Code session writes its repository's folder here; or tell Claude in a chat: “its code is in <folder>”";
    };
  }
  function notionBtn(x) { // an item's Notion: its mark and its word (a phone shows the mark alone)
    var a = el("a", "ib"), title = "Opens this " + KIND[x.kind] + " in Notion";
    a.innerHTML = ICO.out; a.appendChild(span("Notion", "lbl")); a.title = title; a.setAttribute("aria-label", title);
    a.href = x.url; a.target = "_blank"; a.rel = "noopener";
    return stopClick(a);
  }
  // An item's own buttons, in its header, the project's in its head: its Claude — one control: the chat, </> its Code session (not on a
  // phone), ▾ a new chat or session — then Notion; none on a client's page
  function itemActions(x) {
    if (SNAP) return null;
    var w = el("span"); w.appendChild(chatBtn(x, x.kind)); w.appendChild(notionBtn(x));
    return w;
  }
  var PG = PT.page({ ui: S, host: function () { return $("drBody"); }, msBody: msBody, taskBody: taskBody, itemActions: itemActions });
  var dsec = PG.dsec, setFold = PG.setFold, reveal = PG.reveal;
  function mdIn(box, text, opts) { var md = renderMd(text, opts || {}); md.classList.add("pad"); box.appendChild(md); } // a section's text, padded
  function lineOf(tag, parts) { // an open item's line: its type, then the parts there are
    var s = el("span", "s"); s.appendChild(typeTag(tag)); parts = parts.filter(Boolean);
    if (parts.length) s.appendChild(document.createTextNode(" " + parts.join(" · ")));
    return s;
  }

  // the project page, block by block; c carries what several blocks share
  function drHead(host, p, c) { drAbout(PG.projectHead(host, p, c.st, c.ms0 && c.ms0.length ? c.ms0 : c.tk0 || [], SNAP ? null : projectLinks(p)), c); }
  function drAbout(head, c) { // what the project is, its page's description: the head's last part, under its facts, folded until opened
    if (c.info.parts.desc) mdIn(dsec(head, "about", "About the project", null, null, true), c.info.parts.desc);
  }
  function drStatus(body, c) { // a paused project's note: why and since when
    if (!c.info.notes.length) return;
    var q = el("div", "dr-note"), nh = el("div", "nh");
    nh.innerHTML = ICO.info; nh.appendChild(span("Status")); q.appendChild(nh);
    c.info.notes.forEach(function (x) { q.appendChild(el("div", "", x)); });
    body.appendChild(q);
  }
  function drFocus(body, p, c) { // where it stands: the card's lines in full, and next
    var fc = PG.focusBlock(c.ms0 ? PT.standing(c.ms0, c.tk0 || [], blockersOf(p)) : [], p.summary); if (fc) body.appendChild(fc);
  }
  function drNumbers(body, c) { // three tiles, each opening its section
    var ms0 = c.ms0, parts = c.info.parts, strip = ms0 && ms0.length ? ms0 : c.tk0 || [], stats = el("div", "stats");
    function goSection(sec) {
      var s = $("drBody").querySelector('.dsec[data-sec="' + sec + '"]'); if (!s) return;
      if (s.classList.contains("folded")) setFold(s, false);
      s.scrollIntoView({ block: "start", behavior: smooth() });
    }
    function stat(k, v, sub, sec) { // a tile with a section behind it is a button that opens and scrolls to it
      var t = sec ? btn("stat go", null, function () { goSection(sec); }) : el("div", "stat"), kk = el("div", "k", k);
      if (sec) kk.appendChild(span("↓", "arr"));
      t.appendChild(kk); t.appendChild(el("div", "v", v)); if (sub) t.appendChild(sub); stats.appendChild(t);
    }
    stat(ms0 && ms0.length ? "Milestones" : "Tasks", ms0 ? PT.doneCount(strip) + " / " + strip.length : "—", strip.length ? markStrip(strip, "mstrip tile-strip") : null, ms0 ? "plan" : null);
    var unread = S.problemsErr && !S.problems, nOpen = c.openProbs.length + c.waitTasks.length, nNotes = entriesIn(parts.notes), nPriv = SNAP ? 0 : entriesIn(parts.priv);
    stat("Open items", unread ? "?" : String(nOpen), null, nOpen || unread ? "items" : null); // a tile with nothing behind it is not a button
    stat("Notes", String(nNotes) + (nPriv ? " · " + nPriv + " private" : ""), null, nNotes || nPriv ? (nNotes ? "notes" : "private") : null); // private ones counted apart: the Notes section shows only the others
    body.appendChild(stats);
  }
  function drItems(body, p, c) { // open items: problems by what they ask of the user, plus the tasks waiting on someone
    var probs = c.openProbs, n = probs.length + c.waitTasks.length;
    if (!n && !(S.problemsErr && !S.problems)) return;
    var b1 = dsec(body, "items", "Open items", n);
    if (S.problemsErr) b1.appendChild(failBox("Problems", S.problemsErr, !!S.problems));
    function asks(i) { return i.type !== "Blocker" && i.type !== "Risk"; } // a question or another problem: on the user, or waiting on someone
    var groups = SNAP ? sideGroups(sidesOf(p)) : [
      ["Blocking", probs.filter(function (i) { return i.type === "Blocker"; })],
      ["On you", probs.filter(function (i) { return asks(i) && !i.waiting; })],
      ["Waiting on others", c.waitTasks.concat(probs.filter(function (i) { return asks(i) && i.waiting; }))],
      ["Risks to keep in mind", probs.filter(function (i) { return i.type === "Risk"; })]
    ];
    groups.forEach(function (g) {
      if (!g[1].length) return;
      b1.appendChild(PT.groupTitle(g[0], g[1].length));
      g[1].sort(byAge).forEach(function (i) { // on whom, then where in the plan it sits
        if (i.kind === "task") {
          b1.appendChild(PG.block({ k: "w:" + key(i.url), item: i, cls: "row", dot: i.late > 0 ? "crit" : "warn", title: i.name, right: ageLabel(i),
            line: lineOf("Task", [onWhom(i), context(i), i.end != null ? "due " + fmt(i.end) : ""]), fill: function (x) { taskBody(x, i); } }));
          return;
        }
        b1.appendChild(PG.block({ k: key(i.url), item: i, cls: "row", dot: i.type === "Blocker" ? "crit" : i.type === "Risk" ? "warn" : i.waiting ? "ring" : "cur", title: i.name, right: ageLabel(i),
          line: lineOf(i.type, [onWhom(i), context(i)]), fill: function (x) { problemBody(x, i); } }));
      });
    });
  }
  function drResolved(body, p) { // problems resolved lately: where Recently completed opens them
    var resolvedP = (S.resolved || []).map(problemOf).filter(function (i) { return i.pk === p.key && i.status === "Resolved"; });
    if (!resolvedP.length) return;
    var b4 = dsec(body, "resolved", "Resolved lately", resolvedP.length);
    resolvedP.forEach(function (i) {
      b4.appendChild(PG.block({ k: "r:" + key(i.url), item: i, cls: "row", dot: "good", title: i.name, right: "",
        line: lineOf(i.type, [context(i), i.resolvedOn != null ? "resolved " + fmt(i.resolvedOn) : "resolved"]), fill: function (x) { problemBody(x, i); } }));
    });
  }
  function drPlan(body, p, c) {
    var d = S.plan[p.key] || {};
    var b = PG.planSec(body, c.ms0, c.tk0, c.focus, { err: d.err ? errText(d.err) : "", empty: SNAP ? "No plan yet." : "No plan yet. Send Claude the plan in chat." });
    if (d.stale) b.insertBefore(failBox("The plan", d.stale, true), b.firstChild);
  }
  function drNotes(body, p, c) { // the project page's own sections: Notes, Private notes (not on a client's page), History
    var pt = c.info.parts, b3 = dsec(body, "notes", "Notes", entriesIn(pt.notes) || null);
    if (pt.notes) mdIn(b3, pt.notes);
    else b3.appendChild(el("div", "empty", SNAP ? "No notes yet." : "No notes yet. Tell Claude “save to the " + p.name + " notes: …”."));
    if (!SNAP && pt.priv) { var b5 = dsec(body, "private", "Private notes", entriesIn(pt.priv)); b5.closest(".dsec").classList.add("priv-s"); mdIn(b5, pt.priv); }
    if (pt.hist) mdIn(dsec(body, "history", "History", entriesIn(pt.hist)), pt.hist, { history: true });
  }
  function renderDrawer() {
    if (!S.dr) return;
    var host = $("drBody"), p = allProjByKey()[S.dr.pid];
    keep(host, function () {
      clear(host);
      if (!p) { host.appendChild(el("div", "dr-in muted", "This project is no longer in the active list.")); return; }
      var ms0 = msList(p), tk0 = taskList(p), body = el("div", "dr-in");
      var c = { ms0: ms0, tk0: tk0, info: S.pageInfo[p.key] || { notes: [], parts: partsOf("") }, st: stateOfProject(p), focus: PT.focusItem(ms0 || [], tk0 || []),
        openProbs: allProblems().filter(function (i) { return i.pk === p.key && (i.status === "Open" || i.status === "Waiting"); }), waitTasks: waitingTasks(tk0) };
      drHead(host, p, c); host.appendChild(body);
      drStatus(body, c); drFocus(body, p, c); drNumbers(body, c); drItems(body, p, c); drResolved(body, p); drPlan(body, p, c); drNotes(body, p, c);
    });
    paintNav(); PG.stick();
  }

  var stickRaf = 0;
  $("drBody").addEventListener("scroll", function () {
    PG.trim(); $("drTop").classList.toggle("on", $("drBody").scrollTop > 360);
    if (!stickRaf) stickRaf = requestAnimationFrame(function () { stickRaf = 0; if (S.dr) PG.stick(); });
  }, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(function () { if (S.dr) PG.stick(); }).observe($("drBody")); // a header that wraps anew changes where its item's end begins
  var lastFocus = null;
  function openProject(p, k) {
    var same = S.dr && S.dr.pid === p.key && $("drawer").classList.contains("on");
    if (!same) { // another project: drawn from its top
      lastFocus = document.activeElement; S.dr = { pid: p.key };
      $("drBody").scrollTop = 0; $("drBody").style.paddingBottom = ""; renderDrawer(); $("drTop").classList.remove("on");
    }
    $("drawer").classList.add("on"); $("drawer").setAttribute("aria-hidden", "false"); $("scrim").classList.add("on");
    if (k) setTimeout(function () { reveal(k); }, same ? 0 : 240); else $("drClose").focus({ preventScroll: true });
  }
  function navPos() { // the projects in the cards' order, and where the open one is among them
    var ps = sortedProjects(), i = -1;
    ps.forEach(function (x, n) { if (S.dr && x.key === S.dr.pid) i = n; });
    return { ps: ps, i: i };
  }
  function paintNav() { // the bar names the project, and steps to the one before and after it
    var n = navPos(), p = n.ps[n.i];
    $("drPrev").disabled = n.i <= 0; $("drNext").disabled = n.i < 0 || n.i >= n.ps.length - 1;
    $("drTitle").textContent = p ? p.name + (n.ps.length > 1 ? " · " + (n.i + 1) + " of " + n.ps.length : "") : "";
  }
  function stepProject(d) { var n = navPos(), p = n.ps[n.i + d]; if (p) openProject(p); }
  $("drPrev").addEventListener("click", function () { stepProject(-1); });
  $("drNext").addEventListener("click", function () { stepProject(1); });
  function setWide(on) { // the page as wide as the main page, remembered
    var b = $("drWide"); $("drawer").classList.toggle("wide", on);
    b.setAttribute("aria-pressed", String(on)); b.setAttribute("aria-label", on ? "Narrow" : "Widen"); b.title = on ? "Back to the narrow panel" : "Widen to the page width";
    try { localStorage.setItem("pt.wide", on ? "1" : ""); } catch (e) {}
  }
  $("drWide").addEventListener("click", function () { setWide(!$("drawer").classList.contains("wide")); });
  try { if (localStorage.getItem("pt.wide")) setWide(true); } catch (e) {}
  function closeDrawer() { // S.dr goes with it, so later paints leave the closed page alone and read none of its pages again
    S.dr = null;
    $("drawer").classList.remove("on"); $("drawer").setAttribute("aria-hidden", "true"); $("scrim").classList.remove("on");
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
  }
  $("drTop").addEventListener("click", function () { $("drBody").scrollTo({ top: 0, behavior: smooth() }); });
  $("drClose").addEventListener("click", closeDrawer); $("scrim").addEventListener("click", closeDrawer);
  function closeMenus() { // every open menu and the legend; a paint held back meanwhile is done. Returns how many were open
    var n = 0;
    document.querySelectorAll(".dd-m, .chat-m, .info .pop").forEach(function (m) {
      if (m.hidden) return;
      m.hidden = true; n++;
      var b = m.parentNode.querySelector("[aria-expanded]"); if (b) b.setAttribute("aria-expanded", "false");
    });
    if (n && pending) { pending = false; paint(); }
    return n;
  }
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
    ["moveList", "waitList"].forEach(function (id) {
      var h = $(id); clear(h);
      for (var j = 0; j < 3; j++) { var r = el("div", "skel-row"); bars(r, ["75%", "45%"]); h.appendChild(r); }
    });
  }
  var pending = false; // a paint held back while a menu is open, done when it closes
  function focusKey() { // where keyboard focus is in the project page, by what it shows rather than by node
    var a = document.activeElement; if (!a || !$("drawer").contains(a)) return null;
    if (a.id) return "#" + a.id;
    var b = a.closest(".blk"); if (b && a.classList.contains("acc-h")) return '.blk[data-k="' + sel(b.dataset.k) + '"] > .acc-h';
    return null;
  }
  function paint(keepHeader) { // keepHeader: the origin menu is open and has updated itself; the rest follows it
    if (!keepHeader && document.querySelector(".dd-m:not([hidden]), .chat-m:not([hidden])")) { pending = true; return; }
    var fk = focusKey();
    if (!keepHeader) renderHeader();
    if (!S.shown) return;
    var side = SNAP ? [renderSides] : [renderMove, renderWaiting, renderRisks]; // a client's page has one list of open items
    [renderPills, renderCards, function () { TLN.render(false); }].concat(side, [renderDone, renderDrawer]).forEach(function (f) { // one that fails leaves the rest drawn
      try { f(); } catch (e) { if (window.console) console.error(e); }
    });
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
    if (SNAP) { // when the snapshot was made
      if (S.lastUpdate > 0) { var d = new Date(S.lastUpdate); $("liveText").textContent = "Updated " + fmt(Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / PT.DAY)) + ", " + hhmm(S.lastUpdate); }
      return;
    }
    var st = staleParts();
    if (S.refreshing) $("liveText").textContent = "Refreshing…";
    else if (S.lastUpdate > 0) { // the time of the oldest data read; what could not be read again is counted here and marked where it shows
      $("liveDot").className = "ldot " + (st.length ? "warn" : "on");
      $("liveText").textContent = "Live · updated " + hhmm(S.lastUpdate) + (st.length ? " · " + st.length + " not updated" : "");
      $("liveWrap").title = (st.length ? "Not updated, shown as before: " + st.join(", ") + ". Refresh to try again.\n" : "") + "Live from Notion. Read-only: change things by telling Claude in chat.";
    }
    else if (!loading) $("liveText").textContent = "Not loaded"; // nothing was read: the cards say why
    if (S.rootUrl) { $("notionLink").href = S.rootUrl; $("notionLink").hidden = false; }
  }

  // ---------- wiring ----------
  (function () { // every side panel folds; each viewer's choice is remembered
    var fold = {}; try { fold = JSON.parse(localStorage.getItem("pt.fold") || "{}") || {}; } catch (e) {}
    ["moveP", "waitP", "riskP", "sideP", "doneP"].forEach(function (id) {
      var d = $(id); if (!d) return;
      if (fold[id] != null) d.open = !!fold[id];
      d.addEventListener("toggle", function () { fold[id] = d.open; try { localStorage.setItem("pt.fold", JSON.stringify(fold)); } catch (e) {} });
      d.querySelector("summary").addEventListener("click", function (e) { // opens and folds smoothly; the chevron and the head's button turn at once (.shut)
        if (e.target.closest(".gall")) return; e.preventDefault();
        foldDetails(d, d.querySelector("summary").nextElementSibling);
      });
    });
  })();
  var TLN = PT.timeline({
    host: $("tlScroll"), seg: $("range"), today: $("todayBtn"), info: $("info"),
    range: function () { return S.range; }, setRange: function (r) { S.range = r; try { localStorage.setItem("pt.range", r); } catch (e) {} },
    projects: sortedProjects, plan: planOf, err: function (p) { return S.plan[p.key] && S.plan[p.key].err; }, state: stateOfProject,
    opened: S.tlOpen, saveOpen: saveOpen, open: openProject,
    empty: function () { return trackerErr() ? "The tracker didn't load: nothing to draw." : (S.projects || []).length ? "No projects of this kind." : "Nothing scheduled yet."; }
  });
  var resizeT = null;
  window.addEventListener("resize", function () { clearTimeout(resizeT); resizeT = setTimeout(function () { if (S.shown) TLN.render(false); }, 150); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden && MCP && Date.now() - S.lastUpdate > POLL) loadAll(); }); // back after a while: fresh data at once
  function refreshNow() { // everything read again from Notion, past the cache; resolves when the load that does it ends, however long it takes
    if (!MCP) return Promise.resolve();
    S.refreshing = true; paintLive();
    var p = MCP.invalidate ? MCP.invalidate(NOTION) : Promise.resolve();
    Object.keys(S.body).forEach(function (u) { if (S.body[u]) S.body[u].at = 0; }); // read again, but shown as they were meanwhile: the page keeps its height, so the scroll stays where the user was
    return p.catch(function () {}).then(function () { return loadAll(true); }).then(function () { S.refreshing = false; paintLive(); });
  }
  function refreshBy(b) { // the header's Refresh and the project page's: the same button, its arrow turning until the load ends; the open project page reads again in place
    if (b.classList.contains("spin")) return;
    var bs = [$("refreshBtn"), $("drRefresh")]; bs.forEach(function (x) { x.classList.add("spin"); x.setAttribute("aria-busy", "true"); });
    refreshNow().then(function () { bs.forEach(function (x) { x.classList.remove("spin"); x.removeAttribute("aria-busy"); }); });
  }
  if (!CLIENT) ["refreshBtn", "drRefresh"].forEach(function (id) { $(id).addEventListener("click", function () { refreshBy(this); }); });
  setInterval(function () { if (MCP && !document.hidden) loadAll(); }, POLL);
  setInterval(function () { if (!document.hidden && S.shown) paint(); }, 3600000);
  function noLive(msg) {
    $("liveText").textContent = msg; $("refreshBtn").hidden = true;
    clear($("pills")); $("pills").appendChild(el("span", "pl", msg));
    ["cards", "tlScroll", "moveList", "waitList"].forEach(function (id) { clear($(id)); });
  }
  function noData() { // a client's page without its data.js: said on the page, never a blank one
    $("ttl").textContent = document.title = "Project status"; $("liveText").textContent = "No data";
    clear($("pills")); $("pills").appendChild(el("span", "pl", "No data"));
    $("cards").appendChild(el("div", "empty", "This status page has no data yet. Ask for it to be published again."));
  }
  if (CLIENT) { if (SNAP) { loadSnapshot(SNAP); render(); } else noData(); return; }
  renderHeader(); skeleton();
  if (!window.claude || typeof window.claude.use !== "function") { noLive("Open this page in claude.ai to see live data."); return; }
  if (/^__ROOT/.test(ROOT_PAGE)) { noLive("This copy has no tracker page set. Ask Claude to publish the dashboard from setup."); return; }
  window.claude.use("mcp").then(function (mcp) {
    if (!mcp) { noLive("Live data isn't available in this view. Open the page in claude.ai."); return; }
    MCP = mcp; $("liveText").textContent = "Loading…"; loadAll();
  }, function () { noLive("Live data isn't available in this view."); });

})();
