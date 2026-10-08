---
name: project-tracker
description: Keeps client project plans in Notion current from plain chat, in whatever language the user writes. Use whenever the user reports progress ("finished X", "закончил прошивку"), a delay, blocker, risk or open question or that one is resolved; asks how a project is going ("как дела с X?"), what is on them this week, what is due or whom to chase; wants a weekly report; wants a note, call, email or file saved to a project; pauses, finishes, resumes or removes a project, milestone or task; changes, reorders, corrects or undoes the plan or a record; wants a project synced with its contract; wants a new project from a plan, email, file or an Upwork contract; wants the tracker set up or upgraded, or a status page to share with a client; opens a chat from the tracker's dashboard (a first message "… (Project Tracker, https://…). Load it with the project-tracker skill.") or says where a project's chats open. Trigger even without the words Notion, plan or tracker.
---

# Project tracker

The user runs projects for clients. The plan, its progress, slips and open problems live in Notion, but the user does not edit Notion — they tell you what happened and you keep it current. Each project page must answer three questions at a glance — where is the project, what is next, what is in the way. The client sees the work through a client dashboard (structure only), never through what you write in Notion. Everything you write to Notion is in English (pasted material stays as pasted); you talk to the user in the conversation's language.

## The tracker

A root page, named as the user likes, with four databases. A project is planned at whichever level fits the work: **milestones only** (a contract's stages), **milestones with tasks** (a long project whose stages break into steps of days or weeks), or **tasks only** (ongoing work with no promised stages, such as support).

- **Projects** — `Name`, `Client`, `Origin` (Upwork / Direct / Personal, or an option the user adds), `Status` (Active / Paused / Done / Removed), `Summary` (one sentence: where we are, what is next — never lateness or "on track", which would go stale), `Target end`, `Repository`, `Source` (the contract or shared document it came from; empty for pasted text, email, local files), `Chat`, `Claude project` and `Client dashboard` (below), `Late, days` (computed). `Milestones`, `Tasks`, `Milestones late`, `Tasks late` are helpers; never write them.
- **Milestones** — the stages the client was promised: `Name`, `Project`, `Status` (Planned / In progress / Paused / Done / Dropped), `Dates` (the dates agreed with the client; they draw the Gantt), `Finished` (the day it was actually done), `Order` (its place in the plan, below), `Late, days` (computed), `Tasks` (its tasks; shown on the milestone page). A milestone's page holds its notes (paragraphs, if any), then its **history**: dated list lines `- **Mar 4** — …`, oldest first, newest at the bottom. That is where the "why" lives. A line says what happened to this row and why — never what comes next or which other row follows ("next: the bench setup", "sleep modes belong to the next milestone"): plans change, and such a line goes stale; the order of the plan is `Order`'s job. Context shared by all of a milestone's tasks ("added with the demo plan shown to the client") goes once, on the milestone, not on each task. `Project status` and `Open late` are helpers; never write them.
- **Tasks** — steps of days or weeks: `Name`, `Project` (always), `Milestone` (the stage it belongs to; empty for a project without milestones), `Status` (Planned / In progress / Waiting / Done / Dropped), `Dates` (agreed with the client, like a milestone's; empty for a step the user plans only for themselves), `Waiting on`, `Finished`, `Order` (its place within its milestone), `Late, days` (computed). Its page holds its notes and history, as for milestones. `Project status`, `Milestone status`, `Open late` are helpers; never write them.
- **Problems** (config key `problems`) — only what was not in the plan: `Name`, `Project`, `Type` (Blocker / Risk / Question), `Status` (Open / Waiting / Resolved / Dropped), `Waiting on`, `Milestone`, `Task`, `Note`, `Opened`, `Resolved on`.
- `Chat` (all four) and `Claude project` (Projects) — the row's Claude chat and the claude.ai project its chats open in: written only as `references/chats.md` says.
- `Client dashboard` (Projects) — the link of the client dashboard that shows the project: written only as `references/client-dashboards.md` says.

**Order.** The plan has a strict order even where it has no dates: `Order` 1, 2, … numbers a project's milestones, and each milestone's tasks (a project's tasks without a milestone among themselves). It is set when rows are created, in the source's or the user's order — for a contract, its milestone numbers; a new row goes last unless the user says where ("after the layout"; the rows after it shift by one) — and changed only when the user reorders ("bring-up comes after firmware"): renumber the rows that move, without a preview, with a history line on the row that moved (`- **Oct 9** — Moved after Firmware in the plan.`). `Dates` do not follow a reorder: if they now contradict the order, say so and offer the move, which happens only once agreed. Views and the dashboard sort by it, so order is never left to dates or to Notion. Only a tracker at `schema: 2` or above has the column; below it (an update that failed), rows are written without `Order`.

**A task or a problem.** One question: *would this be in the plan if everything went as intended?*

- **Yes → a task.** That includes handovers the plan expects: an RFQ the labs must answer, a sign-off, files from the client. Name a handover by what is awaited (`Lab quotes`, `Layout sign-off`); a task the user asks to add is named from the user's words as **Names** says ("add a task: bring up the boards" → `Boards bring-up`). A handover starts with the user's action, then waits — `Status` Waiting, `Waiting on` the party — and is Done when the result is in (`Waiting on` stays, as the record of whom it waited on).
- **No → a problem**: something that might go wrong and move dates (**Risk**), work that cannot proceed until someone acts on something nobody planned for — whether the work is under way or still ahead (**Blocker**), a decision someone has to make (**Question**).
- News about an item that exists ("Dana signed", "the boards are late", "they answered") changes that item. It becomes a new problem only when the user calls it a risk, a blocker or a decision, or when it is about nothing in the plan.

**Names.** Short — two to five words — and one style per level, the way a Gantt row is labelled; status, dates, the party waited on and "done when" live in the fields and the history, never in the name.
- A milestone is a phase or a deliverable: `Research`, `Demo prototype`, `Certification`. A contract's milestone keeps the contract's own title exactly (`references/contracts.md`) — the client knows it by that name.
- A task is a noun for the work or its result, never a sentence or an instruction: `Boards bring-up`, `Demo firmware`, `Schematic, PCB & enclosure development`. A handover is named by what is awaited — `Certification lab quotes`, `Final audio files`; whom, is `Waiting on`.
- A problem says what is wrong: `No CI runners in GitLab`, `Battery cell doesn't fit the pocket`, `Certification duration unknown`.
- A source's longer wording, when it says more than the name, becomes the row's first history line (`- **Oct 6** — From the demo plan: "Flashed and working in the US".`), so nothing of it is lost.

**How big a task is.** A task deserves its own line in a weekly report: days or weeks of work, or a handover worth chasing. Anything smaller — "flashed the dev board", "wrote the driver" — is progress: a history line on the task or milestone it belongs to, never a new row. A task row is created only when the user asks for one ("add a task…"), from an imported plan, or in a plan change the user approved.

**Dates are always agreed.** Every date in the tracker — a milestone's or a task's — is one the client was given. A step the user plans only for themselves is a task without `Dates`, placed by its milestone and `Order`. A date that is not agreed yet is not written into `Dates`: it goes into the history (`- **Oct 6** — Proposed to Fjord Labs: Oct 20 – Oct 31, not agreed yet.`) or, when someone has to confirm it, into a Question waiting on them. `Dates` move only when the user says the new dates are agreed with the client (or that the project runs on the user's own plan), and every move is written into the item's history as `old → new` — moving them silently would erase the lateness they exist to show. A task whose agreed dates would run past its milestone's end means the milestone's end moves too — shown as part of the same change and agreed with it, never done silently.

**How lateness works.** Lateness is measured against `Dates` — on milestones and on tasks alike — and Notion computes it live, so nothing you write about lateness can go stale. A Done item is late by `Finished` − end of `Dates` (negative = early). An open (Planned, In progress, Waiting) item whose end has passed is late by today − end, growing every day. Nothing Paused, or under something Paused, is late: the work is stopped, not overrun. `Late, days` on the project is the worst of its open milestones and open tasks. The API returns formula values as opaque references, so when you need a number, compute it from the dates by the same rule.

**How the levels move together.** When work starts on a task — it becomes In progress, or a work task becomes Done — its milestone, if Planned, becomes In progress at once, with a history line. A handover (a quote, a sign-off, files) waiting or done does not start the work by itself: when it is done, its milestone becomes In progress only if the milestone has no dates or its start has come; otherwise it stays Planned until then. A task stuck on a Blocker keeps its status; the linked Blocker is what shows it. When the last open task of a milestone that was already under way is Done, ask whether the milestone is done too — never close it on your own; when that same change only started the milestone (a sign-off that lets the work begin), there is nothing to ask. When a milestone is Done while it still has open tasks, ask what happens to them (Done or Dropped). A milestone's `Dates` never follow from its tasks: they are a promise of their own.

`Removed` and `Dropped` are for things the user threw away; views, counts, overviews and reports look only at the other ("live") statuses.

The root page holds the config toggle, then the views you read: Projects `Active` (Active, Paused) and `Closed`; Milestones `Next up` (open); Tasks `All` (open) and `Waiting on`; Problems `Open` (Open, Waiting) and `Recently resolved`. A **project page is the project's row in Projects**: the status callout, then tabs `Plan` (Gantt), `Tasks` (view `Tasks`: every live task, by milestone), `Schedule` (milestones), `Problems`, `Notes`. The full spec is `references/setup.md`.

## Rules that protect the data

- **Read through views and page fetches only; never Notion SQL or rows mode.** Those draw on a workspace-wide quota that runs out mid-session on most plans; views are unmetered and already filtered. `notion-query-data-sources` without `mode` defaults to SQL, so always pass `mode: "view"`.
- **Change pages piece by piece** — `insert_content` to add, `update_content` with the exact old text to change. `replace_content` rebuilds the whole body: on a milestone or task it erases the history, on a root or project page it sends the databases and views to the trash.
- **If a write returns an error, stop.** Re-fetch the page, see what actually happened, and tell the user what failed. Do not try another command, another markup form or escaping to force it through — that improvisation is how pages get destroyed.
- **`Dates` move only by agreement**, each move with an `old → new` history line (**Dates are always agreed**).
- **Never guess a date or a duration.** A date is stated by the user or the source, or follows from a fixed rule in these files. Anything else — "done last week", a delay with no size, a new milestone without a date — ask one short question covering everything missing. A task may have no dates at all; do not ask for one unless the user is planning dates with the client.
- **Write what was said, nothing more.** History, notes and reports carry the user's or the source's facts; no added causes, details or commitments on the user's behalf.
- **`Waiting on` is a concrete name** — a person, a vendor, or the client as written in the project's `Client` field; empty means it is on the user. The `Waiting on` views group by it across projects, so "client" would lump different clients together.
- **Recording a fact vs replanning.** A date or state the user states — an item finished, a task waiting on someone, a corrected date, a problem resolved, a pause, the one task the user asked to add or drop — is recorded directly. Changing the plan — moving dates the user did not name, adding or dropping milestones, adding or dropping more than the one task the user named, creating a project — is shown first and done on the user's yes, because it rewrites many rows on your reading of their words. Removing a project, or the one task or problem the user names, is not a replan: the user named exactly what should go (`references/plan-changes.md`). A Tracker update (`references/setup.md`) is neither: it is structural, changes no date or status, and runs without asking.

## Finding things

**The root page** is recognised by its config block, not by its title — the user may have named or renamed it anything. The block is a toggle at the top whose summary reads `⚙️ **Config** — read by the \`project-tracker\` skill…` and whose lines list `projects`, `milestones`, `tasks`, `problems` (data source IDs). If you already have the IDs from earlier in the conversation, use them. Otherwise:

- the user named or linked the page → fetch it;
- else `notion-search` for `read by the project-tracker skill` and keep the pages whose toggle summary *begins* with `⚙️ Config — read by the project-tracker skill` (other tools write similar config blocks, and a switched-off or backup tracker carries a changed summary; when the highlight is not conclusive, fetch the page and check). One → use it. Several → ask once which, by title and parent.
- None → the tracker is not set up (see **Other scenarios**).
- A config with `open_items` and no `tasks` is a tracker made by version 0.x: say so and offer the upgrade (`references/upgrade.md`) before anything else; do not write to it with the rules of this version.
- A current tracker plus an unretired 0.x one with the same title → the upgrade was interrupted: offer to finish it (`references/upgrade.md`).
- A current config (it has `tasks`) whose `schema` is below 3 (no line = 1) → `references/setup.md` → **Tracker update** first, without asking, then the request.

A project: query the `Active` view and match by meaning ("the rain gauge" → "Weather station", "the masts" → "Weather station" whose repository is `wx_mast`). A Done project: the `Closed` view. A Removed one only when the user names it or asks to bring it back. A milestone, task or open problem: the project's `Schedule` / `Tasks` / `Problems` views; a Resolved problem ("it came back, not fixed"): the root `Recently resolved` view, older ones by `notion-search`. All by meaning, and a task before a milestone when the words name a step ("the demo firmware" is the task *Demo firmware*, not the milestone *Demo prototype*). With one candidate there is nothing to ask; with several plausible ones, ask.

**Overdue check.** When you work on one project and one of its open milestones or tasks has an end before today (not Paused, its milestone and project not Paused), mention it and ask what happened — finished (on which day), a new date agreed with the client, or still going — unless its latest history line already explains it (a "not agreed yet" note) or the user answered earlier in this conversation. "Still going" with a reason gets a history line (`- **Mar 24** — Still going: waiting for the second batch.`); the item stays late, and a Planned one becomes In progress.

## Notion calls

Tool names are the Notion MCP tools (`notion-fetch`, `notion-query-data-sources`, `notion-update-page`, `notion-create-pages`, …); the prefix differs by surface.

**Reading a view.** Database views: fetch the database (its `<database url=…>` on the root page) → it lists `<view url="view://<id>">` → query `data: {mode: "view", view_url: "https://app.notion.com/p/<database id>?v=<view id without dashes>"}`. Project page views: fetch the project page → each tab holds `<database url="https://…/p/<block id>" data-source-url="collection://…">` → fetch that block → its view id → the same query with the block id. Rows come with `url` (page id) and dates as `date:<Prop>:start` / `:end`.

**New row** (milestone, task, problem): `notion-create-pages` with `parent: {data_source_id: <id from the config>}`, the properties below (`Order` included, for a milestone or task), and optionally `content` for the page body (a first history line).

**Properties** (`notion-update-page`, `command: "update_properties"`, or on create): date range `"date:Dates:start": "2026-03-02", "date:Dates:end": "2026-03-20"` — always both ends; single dates (`Finished`, `Target end`, `Opened`, `Resolved on`) start only; relation `["<page id>"]`; select as the option name; checkbox `"__YES__"` / `"__NO__"`; clearing a value `null` (both date ends).

**Bodies.** A history line: `insert_content`, `position: {"type": "end"}`. Changing one line or block: `update_content` with `old_str` exactly as fetched. Block tags (`<callout>`, `<details>`, `<tabs>`, `<tab>`, `<database>`, `<page>`) are sent as raw `<` `>` — in JSON only `"`, tabs and newlines are escaped (`\"`, `\t`, `\n`). Lines inside a callout, toggle or tab are indented with tabs; without them Notion turns the lines into separate blocks. After any write that contains markup, fetch the page and check: tags that show up as text (`&lt;callout`), blocks out of order, or an `icon=` that Notion added → fix with `update_content`. Pages, databases and tabs carry no icons; only the callouts have one.

**The status callout** holds only what changes when something happens — never lateness or "on track", which depend on today's date and would go stale in a text block (the live number is `Late, days` at the top of the page):

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
3. **Client dashboard.** If the change touched what a client dashboard shows — a row added, dropped or moved to another milestone; a name, status, `Dates`, `Finished`, `Order`, `Waiting on`, problem type or the project's `Target end`; or a `Client side:` note — and the project's `Client dashboard` holds a link (from its `Active` or `Closed` row, or a fetch of the project page; fetch it if this conversation has not read it), refresh that page once, after all the writes: `references/client-dashboards.md` → **Keeping it current**. History lines, notes, `Summary`, the callout, `Chat`, `Claude project` and storing the link itself show nowhere on it, so they refresh nothing.
4. Reply with one short line per change, **was → now**: `Demo firmware → Done, finished Oct 28 (due Oct 30) · Demo prototype: still In progress, 1 task left`. Never change something silently; the user should not have to open Notion to know what happened.

These steps hold for every write, whichever reference describes it.

**Undo** ("undo that", "revert", "put it back") takes back a change; it is not a new fact.

- Made in this conversation: you have the old values. Check that each field still holds what you wrote — if the user edited it since, show that and ask. Otherwise restore without asking: old property values back; history or note lines that recorded the change removed (`update_content` with the line as `old_str`, empty `new_str` — plain text lines only; a sub-page or file you added stays, and you tell the user they can delete it by hand); milestones, tasks and problems you created → Dropped, a project you created → Removed. Then steps 2–4.
- Made earlier: a reconstruction, shown and asked first — `references/plan-changes.md` → **Undo of an earlier change**.

## Frequent scenarios

### Progress — "finished the demo firmware", "calibration passes", "Dana signed"

Find the item: a task first when the words name a step or a handover, else the milestone. If what the user reports *is* its result, it is done; if it is a step towards it, it is progress; when unsure, record progress and ask whether to close it. Append a history line in the user's words, in English. If done: `Status` Done, `Finished` = the day it was done (today unless the user says otherwise); `Dates` stay — `Finished` against them is the record of how it went. Then the levels, as **How the levels move together** says. Whatever was done — a task or a milestone — if the next one by `Order` in the same milestone (or the next milestone) starts now (its start is today or earlier, or the user says they are on it), set it In progress, with a history line. A progress line about a milestone with an In-progress task goes on that task.

### Tasks — "add a task: order a debugger", "sent the RFQ, now waiting on the labs", "Kestrel replied"

- **New**: the user named it, so create it without a preview, named in the user's words — `Project`, `Milestone` (the stage it serves, by meaning; the In-progress one if the words fit it; none in a project without milestones), `Status` Planned, `Order` after the milestone's last task, `Dates` only if the user gave them as agreed with the client (otherwise none, and no question). First history line `- **Oct 6** — Added.` plus the reason if given. One plausible milestone → no question; several → ask.
- **Waiting**: the user did their part and someone else has to act → `Status` Waiting, `Waiting on` the party, history line with what was sent. Back to In progress when the user has work on it again; Done when the result is in. Every message about it ("they asked for the block diagram", "sent the full package") is a history line on the task — the task's page is its log; the material itself (the email text, a spec) is a note on that page.
- **Dates proposed, not agreed** ("I'll suggest Oct 20–31 for the enclosure"): no `Dates`; a history line with the proposal and, if the client has to confirm, a Question waiting on them. When they agree, the dates go in.

### Delay — "the boards are three days late", "the supplier slipped a week"

The delayed item is a task when the words name a step, else a milestone. When the user calls the delay a risk or a blocker ("the quote is late, a risk for certification"), it is a problem (**Problems**), not this scenario. An item without dates has nothing to move: the delay is a history line on it (`- **Oct 26** — Expected about a week later: boards late.`), and a problem only if the user calls it a risk or a blocker. Otherwise, if the size is not given, ask how long and write nothing until you know.

- Record first, then ask. Add `- **Oct 26** — Expected about 3 days late: boards late. Not agreed with the client yet.`; in the same reply show what would move if the client agrees — the item's end, the tasks of the same milestone starting on or after its old end, the milestone's end if its tasks now pass it, and — whenever a milestone's end moves, its own or through its tasks — the milestones starting on or after its old end (`Boards arrived and brought up: Nov 5 → Nov 8; Demo unit working at the client: Nov 6–9 → Nov 9–12; Demo prototype: Nov 9 → Nov 12`) — and ask whether the new dates are agreed. Parallel work that does not wait on it stays only if the user's words make that clear — otherwise move it too and say so. If the user already said it is agreed, skip the question.
- **Agreed** (now or later, or the user runs this project on their own plan): move the dates shown; the slipped item gets `- **Oct 26** — Moved with Fjord Labs: boards late. Nov 5 → Nov 8.`, each pushed item `- **Oct 26** — Pushed by the Boards arrived move, Nov 6 → Nov 9.` If only this one item moves, to the date the user gave, record it without the preview.
- **Not agreed**: the dates stay — the commitment has not changed. Tell the user that the item will show as late once its date passes, and that you will move it when they agree a date.

If an open Risk described exactly this, resolve it with `Note` "fired, +3 days".

### Pause — "the enclosure test is on hold until the parts arrive", "the project is on hold"

A milestone or project stopped for a reason outside the work gets `Status` Paused and a dated line with the reason and the previous status (`- **Mar 10** — Paused (was In progress): waiting on Kestrel for parts.`). A paused item, and everything under it, is never late. Read `references/state.md` before writing: whom to chase, later milestones, resuming, a project's other states.

### Problems — new, resolved, changed

New: pick the type by what it is — **Blocker** (work cannot proceed until someone acts, and the plan did not expect it), **Risk** (might happen and would move dates; consequence in `Note`), **Question** (a decision; `Waiting on` = who decides). Links: `Task` = the task the problem is about, if the words name one; `Milestone` = the milestone it threatens or blocks ("the lab quote is late, a risk for certification" → `Task` the lab quote task, `Milestone` Certification). `Status` Waiting if someone else has to act on the problem itself, else Open — a risk about a task that already waits on that party is Open with `Waiting on` empty, the task carries the wait; `Opened` today. If the problem is about a task ("the lab quote is late, a risk for certification"), add a history line on that task too. No milestone history line otherwise — problems show on the page.
Resolved: `Status` Resolved, `Resolved on` today, `Note` = the one-line resolution. If the answer changes the plan, continue as a delay or plan change.
Changed ("Dana isn't the one, the client decides", "this risk is now a blocker"): update in place — `Waiting on`, `Type`, `Status` (Waiting ↔ Open by whether someone else has to act), `Milestone`, `Task`; append to `Note` after ` · ` instead of overwriting. `Note` holds the consequence and how it was resolved; anything else the user wants kept about the problem is a note on its page. A "problem" that turns out to be planned work becomes a task: create the task with the problem's facts as its first history lines and drop the problem with ` · moved to a task`.

### Corrections — "no, that was yesterday", "wrong milestone", "it came back, not fixed"

The fact was different from what was recorded. Fix exactly that: `Finished`, the milestone or task a line belongs to, the milestone a task belongs to, an item reopened (a reopened milestone or task loses its `Finished`, a reopened problem its `Resolved on`). Edit the wrong history line in place rather than adding one, so the history stays true. `Dates` that were simply entered wrong (never agreed otherwise) are fixed directly with `- **Mar 24** — Corrected: Mar 20 → Mar 22 (entered wrong).`; a real change of an agreed date is a delay. Other items keep their dates — if they look like they should move too, say so and offer.

### Notes and files — "save the call notes", "attach the datasheet"

Anything about the project that is not plan, progress, a task or a problem goes into the project's `Notes` tab, oldest first below the tab's gray placeholder line. A short note: `update_content` with `old_str` = the tab's last line, `new_str` = that line plus `**Mon D** — text` at the same indentation. Long text (call notes, a spec, an email thread) and files: `references/notes.md`.

A note about one milestone, task or problem ("note on the RFQ task: …", the text of an RFQ's emails, a spec for one milestone) goes onto that row's page instead, as a paragraph `**Mon D** — text` above its history — never a dated list line, which is history: `references/notes.md` → **On a row's page**. Material that already lives somewhere (a doc, an email, a link) is never copied in: the note is its short summary and the link. Your summaries are in English; pasted material stays as pasted. If the note also reports progress or a problem, handle that as its own scenario — unless the user asked only to save it ("just note it"); then save only and mention what it seems to imply.

### Status — "how is X going?", "how are the masts?"

Query the project's `Schedule`, `Tasks` and `Problems` views. Answer in four parts: **Now** (the In-progress milestones and their due dates, each with its current tasks); **Late** (every open milestone and task past its end, by how many days, and those finished late in the last two weeks — computed from the dates as Notion does; "nothing late" if none); **Blocked / waiting / on hold** (blockers first, then whom the project waits on and since when, paused milestones with reason and since when, open risks and questions in one line); **Next** (the next one or two milestones or tasks by `Order`, with their dates if they have them). With no project named and several active, give the overview instead (`references/report.md` → **Overview**).

## Dashboard updates

In a conversation with the user (never a scheduled or unattended run), once per conversation and after answering what was asked: when the config has no `dashboard` line, or its `dashboard_version` is below N (a missing line or a whole number is older than any `x.y.z`) — N being the version on the first line of `assets/dashboard.html` (read only that line) — and `dashboard_skip` is not N, end with the one-line offer `references/dashboard.md` → **Versions** describes.

## Other scenarios — read the file first

| When | Read |
|---|---|
| A first message `<Project / Milestone / Task / Problem>: <name> … (Project Tracker, <url>). Load it with the project-tracker skill.`, or a request to change where a project's chats open | `references/chats.md`, before anything else |
| Set up the tracker, the root page is missing, or an existing tracker lacks something (views, tabs, columns); a config `schema` below 3 | `references/setup.md` |
| A milestone or project paused or resumed; a project finished, reopened, or its fields set (client, origin, repository, source) | `references/state.md` |
| Long text (call notes, a spec, an email thread) or a file to save to a project, milestone, task or problem; a note for a milestone, task or problem | `references/notes.md` |
| Undo of a change made in an earlier conversation | `references/plan-changes.md` → **Undo of an earlier change** |
| A tracker made by version 0.x (config has `open_items`), or the user asks to upgrade or migrate it | `references/upgrade.md` |
| New project from a plan, estimate, email, file or document | `references/new-project.md` |
| New project from a platform contract (Upwork) | `references/new-project.md` and `references/contracts.md` |
| Resync a project with its contract | `references/contracts.md` |
| Add, drop, rename, split or merge milestones; break a milestone into tasks; finish early and pull the plan in; remove or restore a project or item | `references/plan-changes.md` |
| What is on the user this week; across projects: what is late or burning, whom to chase, what got done; a status question with no project named and several active | `references/report.md` → **Reading the tracker** |
| Weekly report or client update | `references/report.md` |
| Publish, update or change the dashboard; the dashboard offer is due (**Dashboard updates**) | `references/dashboard.md` |
| Make, update, change or remove a client dashboard (a page for a client: a project, or several projects of one client) | `references/client-dashboards.md` |

If something does not fit the model (say, a second client on one project), ask once rather than inventing a field.
