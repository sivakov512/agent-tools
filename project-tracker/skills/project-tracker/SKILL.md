---
name: project-tracker
description: Keeps client project plans in Notion current from plain chat, in whatever language the user writes. Use whenever the user reports progress ("finished X", "закончил прошивку"), a delay, blocker, risk or open question or that one is resolved; asks how a project is going ("как дела с X?"), what is on them this week, what is due or whom to chase; wants a weekly report; wants a note, call, email, file, receipt or invoice saved to a project; pauses, finishes, resumes or removes a project, milestone or task; changes, reorders, corrects or undoes the plan or a record; wants a project synced with its contract; wants a new project from a plan, email, file or an Upwork contract; wants the tracker set up or upgraded, or a status page to share with a client; opens a chat from the tracker's dashboard (a first message with "(Project Tracker, https://…)") or says where a project's chats open. Trigger even without the words Notion, plan or tracker.
---

# Project tracker

The user runs projects for clients and does not edit Notion: they tell you what happened, and you keep the tracker right — the right rows, the right place, only what is worth keeping. Each project page must answer at a glance where the project is, what is next and what is in the way. The client sees the work through a client dashboard, which shows everything on the pages except Private notes (**Who sees what**). You write to Notion in English — material the user pastes keeps its own language — and talk to the user in theirs.

## The tracker

A root page, named as the user likes, with four databases. A project is planned at whichever level fits the work: **milestones only** (a contract's stages), **milestones with tasks** (a long project whose stages break into steps of days or weeks), or **tasks only** (ongoing work with no promised stages, such as support).

- **Projects** — `Name`, `Client`, `Origin` (Upwork / Direct / Personal, or an option the user adds), `Status` (Active / Paused / Done / Removed), `Summary` (one sentence: where we are, what is next — never lateness or "on track", which would go stale), `Target end`, `Repository`, `Source` (the contract or shared document it came from; empty for pasted text, email, local files), `Late, days` (computed). `Milestones`, `Tasks`, `Milestones late`, `Tasks late` are helpers; never write them.
- **Milestones** — the stages the client was promised: `Name`, `Project`, `Status` (Planned / In progress / Paused / Done / Dropped), `Dates` (agreed with the client; they draw the Gantt), `Finished` (the day it was actually done), `Order`, `Late, days` (computed), `Tasks`. `Project status` and `Open late` are helpers.
- **Tasks** — steps of days or weeks: `Name`, `Project` (always), `Milestone` (empty in a project without milestones), `Status` (Planned / In progress / Waiting / Done / Dropped), `Dates` (agreed with the client; empty for a step the user plans only for themselves), `Waiting on`, `Finished`, `Order` (within its milestone), `Late, days` (computed). `Project status`, `Milestone status`, `Open late` are helpers.
- **Problems** (config key `problems`) — only what was not in the plan: `Name`, `Project`, `Type` (Blocker / Risk / Question), `Status` (Open / Waiting / Resolved / Dropped), `Waiting on`, `Milestone`, `Task`, `Summary` (one sentence: what is wrong and what it would cost — for a risk, its consequence; once resolved, how it ended; rewritten in place), `Opened`, `Resolved on`.
- On all four: `Ref` — the row's ID, numbered by Notion, never written (`PR-2`, `MS-12`, `TK-34`, `PB-5`, with the prefixes the config's `ref_prefixes` lists in the order projects, milestones, tasks, problems); `Chat` — the row's Claude chat, written only as `references/chats.md` says. On Projects also `Claude project` (`references/chats.md`) and `Client dashboard` (`references/client-dashboards.md`).

`Removed` and `Dropped` are for things the user threw away; views, counts, overviews and reports look only at the other ("live") statuses.

The root page holds the config toggle, then the views you read: Projects `Active` (Active, Paused) and `Closed`; Milestones `Next up` (open); Tasks `All` (open) and `Waiting on`; Problems `Open` (Open, Waiting) and `Recently resolved`. A **project page is the project's row in Projects**: the status callout, then tabs `Plan` (Gantt), `Tasks` (every live task, by milestone), `Schedule` (milestones), `Problems`, then the parts of **Pages**. The full spec is `references/setup.md`.

**Pages.** Every page — a project's, milestone's, task's or problem's — holds up to four parts, in this order (on a project page, below its tabs), each there only once it has something in it:

1. **Description** — under no heading: what the item is now — its scope, "done when", a checklist (`- [ ] …`), where its material lives. Edited in place; a checklist item is ticked when done. The test against a note: the description is what the item *is*, kept current; a note is dated material, kept as it was.
2. **`## Notes`** — dated material, oldest first: `**Oct 2** — …` paragraphs, long text as sub-pages, files. Added to, never rewritten.
3. **`## Private notes`** — the same, for what only the user may see (**Who sees what**).
4. **`## History`** — what happened to the item and why: dated list lines `- **Mar 4** — …`, oldest first. Only appended. A line never says what comes next or which row follows: plans change and such a line goes stale; the order of the plan is `Order`'s job.

The headings are exactly `## Notes`, `## Private notes` and `## History` and mark nothing else; a section's heading comes with its first entry, so a page never shows an empty one. The dashboard reads the parts by these headings. A step done gets both its checklist tick (the current state) and a history line (the dated record).

**Who sees what.** A client dashboard shows the projects it covers as they are — fields, descriptions, Notes and History — never Private notes, the callout, links into Notion, chats or the repository. So everything outside Private notes is written as if the client reads it: facts about the work, in neutral words. Private notes take:

- money the client was not given — supplier prices and quotes, the user's own costs and margins. The terms agreed with the client are no secret to them, nor is an expense the client pays back or is billed for, with its invoice;
- contact details of others — the user's own name, address and business details on a document are no secret, the client has them;
- the user's view of people and of how the relationship goes, other clients;
- anything the user marks as private ("for myself", "don't show the client").

A history line keeps the event; an internal reason behind it is a private note beside it. When unsure, it is private, and the reply says so in a few words — a private note is made public in a moment, a published one cannot be taken back. A `Client sees:` private note on the project page opens more to that client, and then those things go in the public parts there (`references/client-dashboards.md` → **What a client may see**). The rule holds on every project, with a client dashboard or not.

**Order.** The plan has a strict order even where it has no dates: `Order` 1, 2, … numbers a project's milestones, and each milestone's tasks (a project's tasks without a milestone among themselves). It is set when rows are created, in the source's or the user's order — a contract's milestone numbers; a new row goes last unless the user says where ("after the layout"; the rows after it shift by one) — and changed only when the user reorders ("bring-up comes after firmware"): renumber the rows that move, without a preview, with a history line on the row that moved (`- **Oct 9** — Moved after Firmware in the plan.`). `Dates` do not follow a reorder: if they now contradict the order, say so and offer the move, which happens only once agreed.

**A task or a problem.** One question: *would this be in the plan if everything went as intended?*

- **Yes → a task**, handovers the plan expects included: an RFQ the labs must answer, a sign-off, files from the client. A handover starts with the user's action, then waits — `Status` Waiting, `Waiting on` the party — and is Done when the result is in (`Waiting on` stays, as the record of whom it waited on).
- **No → a problem**: something that might go wrong and move dates (**Risk**), work that cannot proceed until someone acts on something nobody planned for — under way or still ahead (**Blocker**), a decision someone has to make (**Question**).
- News about an item that exists ("Dana signed", "the boards are late", "they answered") changes that item. It becomes a new problem only when the user calls it a risk, a blocker or a decision, or when it is about nothing in the plan.

**Names.** Two to five words, one style per level, the way a Gantt row is labelled; status, dates, the party waited on and "done when" live in the fields and the history.

- A milestone is a phase or a deliverable: `Research`, `Demo prototype`, `Certification`. A contract's milestone keeps the contract's own title exactly (`references/contracts.md`) — the client knows it by that name.
- A task is a noun for the work or its result, never a sentence: `Boards bring-up`, `Demo firmware`. A handover is named by what is awaited — `Certification lab quotes`, `Final audio files`; whom, is `Waiting on`. A task the user asks to add is named from their words ("add a task: bring up the boards" → `Boards bring-up`).
- A problem says what is wrong: `No CI runners in GitLab`, `Battery cell doesn't fit the pocket`.
- A source's longer wording, when it says more than the name, becomes the row's description (`From the demo plan: "Flashed and working in the US".`), so nothing of it is lost.

**How big a task is.** A task deserves its own line in a weekly report: days or weeks of work, or a handover worth chasing. Anything smaller — "flashed the dev board", "wrote the driver" — is progress: a history line on the task or milestone it belongs to, never a new row. A task row is created only when the user asks for one, from an imported plan, or in a plan change the user approved.

**Dates are always agreed.** Every date in the tracker is one the client was given; a step the user plans only for themselves has no `Dates`, placed by its milestone and `Order`. A date not agreed yet goes into the history (`- **Oct 6** — Proposed to Fjord Labs: Oct 20 – Oct 31, not agreed yet.`) or, when someone has to confirm it, into a Question waiting on them. `Dates` move only when the user says the new dates are agreed with the client (or that the project runs on the user's own plan), each move a history line `old → new` — moving them silently would erase the lateness they exist to show. A task whose agreed dates would run past its milestone's end moves the milestone's end too — shown as part of the same change and agreed with it.

**How lateness works.** Lateness is measured against `Dates`, on milestones and tasks alike, and Notion computes it live, so nothing you write about it can go stale. A Done item is late by `Finished` − end of `Dates` (negative = early). An open item (Planned, In progress, Waiting) whose end has passed is late by today − end. Nothing Paused, or under something Paused, is late: the work is stopped, not overrun. The project's `Late, days` is the worst of its open milestones and tasks. The API returns formula values as opaque references, so when you need a number, compute it from the dates by the same rule.

**How the levels move together.**

- Work starting on a task — it becomes In progress, or a work task becomes Done — starts its milestone at once if Planned, with a history line.
- A handover (a quote, a sign-off, files) waiting or done does not start the work by itself: once done, its milestone becomes In progress only if it has no dates or its start has come.
- A task stuck on a Blocker keeps its status; the linked Blocker shows it.
- The last open task of a milestone already under way done → ask whether the milestone is done too; never close it on your own. When that same change only started the milestone, there is nothing to ask.
- A milestone Done while it still has open tasks → ask what happens to them (Done or Dropped).
- A milestone's `Dates` never follow from its tasks: they are a promise of their own.

## Rules that protect the data

- **Read through views and page fetches only; never Notion SQL or rows mode.** Those draw on a workspace-wide quota that runs out mid-session on most plans; views are unmetered and already filtered. `notion-query-data-sources` without `mode` defaults to SQL, so always pass `mode: "view"`.
- **Change pages piece by piece** — `insert_content` to add, `update_content` with the exact old text to change. `replace_content` rebuilds the whole body: on a milestone or task it erases the history, on a root or project page it sends the databases and views to the trash.
- **If a write returns an error, stop.** Re-fetch the page, see what actually happened, and tell the user what failed. Do not try another command, another markup form or escaping to force it through — that improvisation is how pages get destroyed.
- **Never guess a date or a duration.** A date is stated by the user or the source, or follows from a fixed rule in these files. Anything else — "done last week", a delay with no size, a new milestone without a date — gets one short question covering everything missing. A task may have no dates at all; do not ask for one unless the user is planning dates with the client.
- **Recording a fact vs replanning.** A date or state the user states — an item finished, a task waiting on someone, a corrected date, a problem resolved, a pause, the one task the user asked to add or drop — is recorded directly. Changing the plan — moving dates the user did not name, adding or dropping milestones or more than the one task named, creating a project — is shown first and done on the user's yes, because it rewrites many rows on your reading of their words. Removing a project, or the one task or problem the user names, is not a replan (`references/plan-changes.md`). A Tracker update (`references/setup.md`) is structural and runs without asking.
- **`Waiting on` is a concrete name** — a person, a vendor, or the client as written in the project's `Client`; empty means it is on the user. The views group by it across projects, so "client" would lump different clients together.
- **Read a row again before asking about it or stating it.** Another chat or the user in Notion may have changed it: before asking what happened to a row, or telling its state, fetch it fresh unless it was read in this same reply.

### What is worth writing

Pages are read by the user and the client; a page that grows by everything said stops being read. So:

- **Only the user's or the source's facts** — no added causes, details or commitments on the user's behalf.
- **Only what someone will need later**: facts, decisions, agreements, numbers, dates, who did what and why. Leave out how the user got there, thinking aloud, moods, asides, and what the page already says. A message may need no write at all — then nothing is written, and the reply says so if the user seemed to expect it.
- **A history line is one sentence** on what happened and why, in your words from the user's facts — not a quote of the message.
- **A note is a short summary**, never a transcript. Material that already lives somewhere (a doc, an email in the user's mailbox, a link) is summarised with the link, never copied. A sub-page keeps text as given only when it has no other home — call notes, a spec or an email thread the user pasted — so its source is not lost (`references/notes.md`).

### Every record goes where it belongs

A note, a file, a history line, a problem's links — each goes where it will be looked for, so the tracker stays in order without moving things later.

- **Start from where the conversation is** — the row a dashboard chat was opened from, or the item the talk has been about — and keep it there when the record is about that row.
- **Then check what it is really about:**
  - one row's own work (its spec, its emails, its sign-off) → that row;
  - another task, milestone or problem → that one;
  - what adds up across several tasks of a stage — money spent and its documents, decisions, agreements, contacts, context shared by all its tasks ("added with the demo plan shown to the client") → their milestone, once, not on each task;
  - what spans milestones, or the project as a whole (paused, finished, removed, its target end changed) → the project;
  - progress on a milestone with an In-progress task → that task.
- **An expense** — a receipt, an invoice, a payment for the client — is one dated note on the milestone it was spent for (else the project): the amount, the document's number, its file. Public or private by **Who sees what**.
- **Not where the conversation is** → write it where it belongs and say so in the reply's line for it, with why (`Noted on MS-6 Demo prototype, not the task: the demo's expenses are kept there`); the user can still move it.
- **The user named the place** and you see a clearly better one → ask first, in one line: their word is what was asked for.
- **A file** goes where a rule above puts it, said in the reply. When its place is a judgment call, ask first: once uploaded it cannot be moved by these tools.

## Finding things

**The root page** is recognised by its config block, not by its title. The block is a toggle at the top whose summary reads `⚙️ **Config** — read by the \`project-tracker\` skill…` and whose lines list `projects`, `milestones`, `tasks`, `problems` (data source IDs). If you already have the IDs from earlier in the conversation, use them. Otherwise:

- the user named or linked the page → fetch it;
- else `notion-search` for `read by the project-tracker skill` and keep the pages whose toggle summary *begins* with `⚙️ Config — read by the project-tracker skill` (other tools write similar blocks, and a backup tracker carries a changed summary; when the highlight is not conclusive, fetch and check). One → use it. Several → ask once which, by title and parent;
- none → the tracker is not set up (**Other scenarios**);
- a config with `open_items` and no `tasks`, or a current tracker next to an unretired 0.x one → `references/upgrade.md` before anything else; never write to a 0.x tracker with these rules;
- a current config whose `schema` is below 5 (no line = 1) → `references/setup.md` → **Tracker update** first, without asking, then the request, whatever it is. The first time the config is read in a conversation its `schema` is checked before anything else: every rule here assumes the current structure.

**An ID** the user writes — `TK-34`, `tk34`, `PB 5` — names exactly one row, never a guess: the prefix says the database (`ref_prefixes`) and the number is its `Ref`. Views give `Ref` as the bare number, so match it in that database's rows: the root views first, then the views of each project in `Active` and `Closed`. A number found nowhere, or one without a prefix, is asked about. Several IDs in one message name exactly those rows.

A project: query the `Active` view and match by meaning ("the rain gauge" → "Weather station", "the masts" → "Weather station" whose repository is `wx_mast`). A Done project: `Closed`. A Removed one only when the user names it or asks to bring it back. A milestone, task or open problem: the project's `Schedule` / `Tasks` / `Problems` views; a Resolved problem ("it came back, not fixed"): the root `Recently resolved` view, older ones by `notion-search`. All by meaning, a task before a milestone when the words name a step ("the demo firmware" is the task *Demo firmware*, not the milestone *Demo prototype*). One candidate → no question; several plausible ones → ask.

**Overdue check.** When you work on one project and one of its open milestones or tasks has an end before today (not Paused, nor its milestone or project), mention it and ask what happened — finished (on which day), a new date agreed with the client, or still going — unless its latest history line already explains it or the user answered earlier in this conversation. "Still going" with a reason gets a history line (`- **Mar 24** — Still going: waiting for the second batch.`); the item stays late, and a Planned one becomes In progress.

## Notion calls

Tool names are the Notion MCP tools (`notion-fetch`, `notion-query-data-sources`, `notion-update-page`, `notion-create-pages`, …); the prefix differs by surface.

**Reading a view.** Database views: fetch the database (its `<database url=…>` on the root page) → it lists `<view url="view://<id>">` → query `data: {mode: "view", view_url: "https://app.notion.com/p/<database id>?v=<view id without dashes>"}`. Project page views: fetch the project page → each tab holds `<database url="https://…/p/<block id>" data-source-url="collection://…">` → fetch that block → its view id → the same query with the block id. Rows come with `url` (page id) and dates as `date:<Prop>:start` / `:end`.

**New row** (milestone, task, problem): `notion-create-pages` with `parent: {data_source_id: <id from the config>}`, the properties below (`Order` included, for a milestone or task), and optionally `content` for the page body (a description; a first history line with its `## History` heading).

**Properties** (`notion-update-page`, `command: "update_properties"`, or on create): date range `"date:Dates:start": "2026-03-02", "date:Dates:end": "2026-03-20"` — always both ends; single dates (`Finished`, `Target end`, `Opened`, `Resolved on`) start only; relation `["<page id>"]`; select as the option name; checkbox `"__YES__"` / `"__NO__"`; clearing a value `null` (both date ends).

**Bodies**, by part (**Pages**). An entry goes in front of the first heading that comes after its section and is already on the page, else at the end of the page; the first entry of a section brings its heading, in the same call.

- **History line**: `insert_content`, `position: {"type": "end"}` (`## History` is always last).
- **Note**: `update_content` with `old_str` the next heading present — `## Private notes`, else `## History` — and `new_str` the note, a blank line, that heading; neither on the page → `insert_content` at the end. A **private note** the same, before `## History`.
- **Description**: new — on a milestone, task or problem `insert_content`, `position: {"type": "start"}`; on a project page `update_content` with `old_str` `</tabs>`, `new_str` `</tabs>`, a newline, the description. Changed — `update_content` on its lines as fetched; a checklist item done — `- [ ] Pinout fixed` → `- [x] Pinout fixed`.
- **Moving an entry** ("make that note private", "the client can see this one"): one `update_content` with two `content_updates` — the entry → empty, and the target's heading → the entry, a blank line, that heading (or the heading created, as for a first entry); a section left empty loses its heading.

Changing one line or block: `update_content` with `old_str` exactly as fetched. Block tags (`<callout>`, `<details>`, `<tabs>`, `<tab>`, `<database>`, `<page>`) are sent as raw `<` `>` — in JSON only `"`, tabs and newlines are escaped (`\"`, `\t`, `\n`). Lines inside a callout, toggle or tab are indented with tabs; without them Notion turns the lines into separate blocks. After any write that contains markup, fetch the page and check: tags that show up as text (`&lt;callout`), blocks out of order, or an `icon=` that Notion added → fix with `update_content`. Pages, databases and tabs carry no icons; only the callouts have one.

**The status callout** holds only what changes when something happens — never lateness or "on track", which depend on today and would go stale in a text block (the live number is `Late, days` at the top of the page):

```
<callout icon="🔴" color="red_bg">
	**Now:** Demo prototype — due Nov 9 → Board and enclosure designed, ordered, due Oct 16
	**Blocked on:** Test rig (Dana)
	**Waiting on:** Lab quotes (Kestrel Labs, Halden Test) · Layout sign-off (Dana)
	**Open:** 2 risks · 1 question
	**On hold:** Firmware on the dev board — set aside for the demo prototype, since Oct 6
</callout>
```

- `**Now:**` the In-progress milestones with their due dates (`— no date yet` if none), each followed by its In-progress tasks as ` → <task>, due <date>` (no date → just the name); in a project without milestones, the In-progress tasks as `<task> — due <date>`. Joined by ` · `; `**Now:** nothing in progress` if empty.
- `**Blocked on:**` every Blocker among the Open/Waiting problems — except those linked to a Paused milestone, which show under On hold — as `<name> (<Waiting on>)`, or just `<name>` when it is on the user. Left out when there is none.
- `**Waiting on:**` every Waiting task and every Waiting problem that is not a Blocker, as `<name> (<Waiting on>)`, in the order of the project's `Tasks` view, problems after. Left out when there is none.
- `**Open:**` the Open/Waiting risks and questions not listed above, as counts (`2 risks · 1 question`). Left out when zero.
- `**On hold:**` each Paused milestone, why and since when (`— no reason given` if none); left out when nothing is paused.
- Icon and colour: 🔴 `red_bg` if any Blocker is Open or Waiting; else 🟡 `yellow_bg` if a milestone is on hold; else 🔵 `blue_bg`. A project that is not Active gets one first line instead of `Now`: `**Paused** since Mar 3 — <reason>` ⏸️ `gray_bg`, `**Done** Mar 20` ✅ `gray_bg`, `**Removed**` 🗑️ `gray_bg`.
- To update it: fetch the page, `update_content` with `old_str` = the whole current callout as fetched, `new_str` = the new one.

## Every change: read, write, check, report

1. Before writing, note the current values of everything you are about to change — you have them from the read.
2. Write the rows first. Only after they succeeded, bring `Summary`, `Target end` and the status callout in line with what changed — never in parallel with the row writes, so a failed write never leaves the page describing a change that did not happen.
3. **Client dashboard.** If the project's `Client dashboard` holds a link (from its `Active` or `Closed` row, or a fetch of the project page), refresh that page once, after all the writes: `references/client-dashboards.md` → **Keeping it current**. A change that touched nothing but Private notes (a `Client side:` note aside), the callout, `Chat`, `Claude project` or the link itself refreshes nothing — none of them shows there.
4. Reply with one short line per change, **was → now**, each item led by its ID: `TK-34 Demo firmware → Done, finished Oct 28 (due Oct 30) · MS-12 Demo prototype: still In progress, 1 task left`. Never change something silently; the user should not have to open Notion to know what happened.

These steps hold for every write, whichever reference describes it. **Undo** ("undo that", "revert", "put it back") takes a change back, it is not a new fact: `references/plan-changes.md` → **Undo**.

## Frequent scenarios

### Progress — "finished the demo firmware", "calibration passes", "Dana signed"

Find the item: a task first when the words name a step or a handover, else the milestone. If what the user reports *is* its result, it is done; if it is a step towards it, it is progress; when unsure, record progress and ask whether to close it. A history line says what happened (**What is worth writing**); if the description has a checklist item for it, tick it too. If done: `Status` Done, `Finished` = the day it was done (today unless the user says otherwise); `Dates` stay — `Finished` against them is the record of how it went. Then the levels (**How the levels move together**). Whatever was done, if the next item by `Order` in the same milestone (or the next milestone) starts now — its start is today or earlier, or the user says they are on it — set it In progress, with a history line.

### Tasks — "add a task: order a debugger", "sent the RFQ, now waiting on the labs", "Kestrel replied"

- **New**: the user named it, so create it without a preview — `Project`, `Milestone` (the stage it serves, by meaning; the In-progress one if the words fit it; none in a project without milestones), `Status` Planned, `Order` after the milestone's last task, `Dates` only if the user gave them as agreed with the client. First history line `- **Oct 6** — Added.` plus the reason if given. One plausible milestone → no question; several → ask.
- **Waiting**: the user did their part and someone else has to act → `Status` Waiting, `Waiting on` the party, a history line with what was sent. Back to In progress when the user has work on it again; Done when the result is in. A later message about it gets a history line when it changes what is awaited or from whom ("they asked for the block diagram too"); material worth keeping from it (a spec, the terms of a reply) is a note on the task.
- **Dates proposed, not agreed** ("I'll suggest Oct 20–31 for the enclosure"): no `Dates`; a history line with the proposal and, if the client has to confirm, a Question waiting on them. When they agree, the dates go in.

### Delay — "the boards are three days late", "the supplier slipped a week"

The delayed item is a task when the words name a step, else a milestone. When the user calls the delay a risk or a blocker ("the quote is late, a risk for certification"), it is a problem (**Problems**). An item without dates has nothing to move: the delay is a history line on it (`- **Oct 26** — Expected about a week later: boards late.`). Otherwise, if the size is not given, ask how long and write nothing until you know.

- **Record first, then ask.** Add `- **Oct 26** — Expected about 3 days late: boards late. Not agreed with the client yet.` and in the same reply show what would move if the client agrees: the item's end; the tasks of the same milestone starting on or after its old end; the milestone's end if its tasks now pass it; and, whenever a milestone's end moves, the milestones starting on or after its old end (`Boards arrived and brought up: Nov 5 → Nov 8; Demo prototype: Nov 9 → Nov 12`). Ask whether the new dates are agreed. Parallel work that does not wait on it stays only if the user's words make that clear — otherwise move it too and say so. If the user already said it is agreed, skip the question.
- **Agreed** (now or later, or the user runs this project on their own plan): move the dates shown; the slipped item gets `- **Oct 26** — Moved with Fjord Labs: boards late. Nov 5 → Nov 8.`, each pushed item `- **Oct 26** — Pushed by the Boards arrived move, Nov 6 → Nov 9.` If only this one item moves, to the date the user gave, record it without the preview.
- **Not agreed**: the dates stay — the commitment has not changed. Tell the user the item will show as late once its date passes, and that you will move it when they agree a date.

If an open Risk described exactly this, resolve it: `Summary` "Fired: +3 days", with a history line.

### Pause — "the enclosure test is on hold until the parts arrive", "the project is on hold"

A milestone or project stopped for a reason outside the work gets `Status` Paused and a dated line with the reason and the previous status (`- **Mar 10** — Paused (was In progress): waiting on Kestrel for parts.`). A paused item, and everything under it, is never late. Read `references/state.md` before writing: whom to chase, later milestones, resuming, a project's other states.

### Problems — new, resolved, changed

- **New**: the type by what it is — **Blocker** (work cannot proceed until someone acts, and the plan did not expect it), **Risk** (might happen and would move dates; the consequence in `Summary`), **Question** (a decision; `Waiting on` = who decides). Links: `Task` = the task it is about, if the words name one; `Milestone` = the milestone it threatens or blocks ("the lab quote is late, a risk for certification" → `Task` the lab quote task, `Milestone` Certification). `Status` Waiting if someone else has to act on the problem itself, else Open — a risk about a task that already waits on that party is Open with `Waiting on` empty, the task carries the wait. `Opened` today; `Summary` the one sentence; the user's longer account, if any, its description. A new problem about a task gets a history line on that task too; no milestone history line — problems show on the page. Linking an existing problem to a task later is a change to the problem alone (**Changed**).
- **Resolved**: `Status` Resolved, `Resolved on` today, `Summary` = how it ended, and a history line (`- **Oct 9** — Resolved: Halden quoted 6 weeks.`). If the answer changes the plan, continue as a delay or plan change.
- **Changed** ("Dana isn't the one, the client decides", "this risk is now a blocker"): update in place — `Waiting on`, `Type`, `Status` (Waiting ↔ Open by whether someone else has to act), `Milestone`, `Task`; `Summary` rewritten if what it says changed; a history line with what changed and why (`- **Oct 9** — Now a blocker: the lab won't quote without the full BOM.`). A "problem" that turns out to be planned work becomes a task: create it with the problem's description and `Summary` as its description and a first history line `Was the problem "<name>"`, then drop the problem with `Moved to the task <name>.`

### Corrections — "no, that was yesterday", "wrong milestone", "it came back, not fixed"

The fact was different from what was recorded. Fix exactly that: `Finished`, the milestone or task a line belongs to, the milestone a task belongs to, an item reopened (a reopened milestone or task loses its `Finished`, a reopened problem its `Resolved on`). Edit the wrong history line in place rather than adding one, so the history stays true. `Dates` that were simply entered wrong (never agreed otherwise) are fixed directly with `- **Mar 24** — Corrected: Mar 20 → Mar 22 (entered wrong).`; a real change of an agreed date is a delay. Other items keep their dates — if they look like they should move too, say so and offer.

### Notes and files — "save the call notes", "attach the datasheet", "for myself: …"

A note goes where **Every record goes where it belongs** puts it, under `## Notes`, or `## Private notes` by **Who sees what**, written as **What is worth writing** says; a short one as `**Mon D** — text` (**Bodies**), long text and files by `references/notes.md`. A description or a checklist the user gives for an item ("the task is …", "checklist for the layout: …") is its description, not a note. If the note also reports progress or a problem, handle that as its own scenario — unless the user asked only to save it ("just note it"); then save only and mention what it seems to imply.

### Status — "how is X going?", "how are the masts?"

Query the project's `Schedule`, `Tasks` and `Problems` views. Answer in four parts: **Now** (the In-progress milestones and their due dates, each with its current tasks); **Late** (every open milestone and task past its end, by how many days, and those finished late in the last two weeks; "nothing late" if none); **Blocked / waiting / on hold** (blockers first, then whom the project waits on and since when, paused milestones with reason and since when, open risks and questions in one line); **Next** (the next one or two milestones or tasks by `Order`, with their dates if they have them). With no project named and several active, give the overview instead (`references/report.md` → **Overview**).

## Dashboard updates

In a conversation with the user (never a scheduled or unattended run), once per conversation and after answering what was asked — when the config has no `dashboard` line, or its `dashboard_version` is below N (a missing line or a whole number is older than any `x.y.z`), N being the version on the first line of `assets/dashboard.html` (read only that line), and `dashboard_skip` is not N — end with one short line in the user's language: with no dashboard, what it is in a few words and whether to publish it; with an older one, that it has an update to N, what is new in a few words (the dashboard entries between the two versions in the plugin's `CHANGELOG.md`, next to `skills/`), and whether to update it. Yes → `references/dashboard.md`. No → add `dashboard_skip: N` to the config, so it is not offered again until a newer version.

## Other scenarios — read the file first

| When | Read |
|---|---|
| A first message naming a row "(Project Tracker, <url>)", or a request to change where a project's chats open | `references/chats.md`, before anything else |
| Set up the tracker, the root page is missing, or an existing tracker lacks something (views, tabs, columns); a config `schema` below 5 | `references/setup.md` |
| A milestone or project paused or resumed; a project finished, reopened, or its fields set (client, origin, repository, source) | `references/state.md` |
| Long text (call notes, a spec, an email thread) or a file to save | `references/notes.md` |
| Undo, in this conversation or of an earlier change | `references/plan-changes.md` → **Undo** |
| A tracker made by version 0.x (config has `open_items`), or the user asks to upgrade or migrate it | `references/upgrade.md` |
| New project from a plan, estimate, email, file or document | `references/new-project.md` |
| New project from a platform contract (Upwork) | `references/new-project.md` and `references/contracts.md` |
| Resync a project with its contract | `references/contracts.md` |
| Add, drop, rename, split or merge milestones; break a milestone into tasks; finish early and pull the plan in; remove or restore a project or item | `references/plan-changes.md` |
| What is on the user this week; across projects: what is late or burning, whom to chase, what got done; a status question with no project named and several active | `references/report.md` → **Reading the tracker** |
| Weekly report or client update | `references/report.md` |
| Publish or update the dashboard | `references/dashboard.md` |
| Make, update, change or remove a client dashboard; the user opens more to a client ("ArcLive can see the supplier prices") or says who is on the client's side | `references/client-dashboards.md` |

If something does not fit the model (say, a second client on one project), ask once rather than inventing a field.
