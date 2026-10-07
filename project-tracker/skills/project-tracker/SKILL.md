---
name: project-tracker
description: Keeps client project plans in Notion up to date from plain conversation. Use whenever the user reports progress on a project or a task ("finished X", "calibration passes", "parts arrived", "Dana signed"), mentions a delay, blocker, risk or open question ("the supplier slipped a week", "no test rig", "need to decide...") or that one is resolved ("Dana set up the rig", "they answered"), asks how a project is going ("what's the status of X?", "how is X going?"), what is on them this week, what is due or whom to chase, wants a weekly report, wants to add a task, save a note, call summary, email or file to a project, says a project, a milestone or a task is paused, finished, resumed or should be removed, changes the plan (adds, drops, renames or splits a milestone, finished early), corrects or undoes something recorded, wants a project synced with its contract, wants a new project set up from a plan, estimate, email, file or a contract in a connected service (e.g. Upwork), or wants the tracker itself set up or upgraded. Trigger even when the user does not say "Notion", "plan" or "tracker" — any statement about the state of a project is an update to the tracker.
---

# Project tracker

The user runs projects for clients. The plan, its progress, slips and open problems live in Notion, but the user does not edit Notion — they tell you what happened and you keep it current. Each project page must answer three questions at a glance — where is the project, what is next, what is in the way — and be fit to show the client as is. Everything you write to Notion is in English (pasted material stays as pasted); you talk to the user in the conversation's language.

## The tracker

A root page — its name is the user's choice at setup, `Project tracker` by default — with four databases. A project is planned at whichever level fits the work: **milestones only** (a contract's paid stages), **milestones with tasks** (a long project whose stages break into steps of days or weeks), or **tasks only** (ongoing work with no promised stages, such as support).

- **Projects** — `Name`, `Client`, `Origin` (where the work comes from: Upwork / Direct / Personal by default — the user may add their own options, and the dashboard groups by them), `Status` (Active / Paused / Done / Removed), `Summary` (one sentence: where we are, what is next — never lateness or "on track", which would go stale), `Target end`, `Repository`, `Source` (link to where the project came from — a platform contract or a shared document; empty for pasted text, email, local files), `Late, days` (computed by Notion: the worst lateness among the project's open milestones and tasks). `Milestones`, `Tasks`, `Milestones late`, `Tasks late` are helpers; never write them.
- **Milestones** — the stages the client was promised: `Name`, `Project`, `Status` (Planned / In progress / Paused / Done / Dropped), `Dates` (the dates agreed with the client; they draw the Gantt), `Finished` (the day it was actually done), `Late, days` (computed), `Tasks` (its tasks; shown on the milestone page). A milestone's page body is its **history**: dated lines `- **Mar 4** — …`, newest at the bottom. That is where the "why" lives. `Project status` and `Open late` are helpers; never write them.
- **Tasks** — steps of days or weeks: `Name`, `Project` (always), `Milestone` (the stage it belongs to; empty for a project without milestones), `Status` (Planned / In progress / Waiting / Done / Dropped), `Dates` (agreed with the client, like a milestone's; empty for a step the user plans only for themselves), `Waiting on`, `Finished`, `Late, days` (computed). The page body is the task's history, as for milestones. `Project status`, `Milestone status`, `Open late` are helpers; never write them.
- **Problems** (config key `problems`) — only what was not in the plan: `Name`, `Project`, `Type` (Blocker / Risk / Question), `Status` (Open / Waiting / Resolved / Dropped), `Waiting on`, `Milestone`, `Task`, `Note`, `Opened`, `Resolved on`.

**A task or a problem.** One question: *would this be in the plan if everything went as intended?*

- **Yes → a task.** That includes handovers the plan expects: an RFQ the labs must answer, a sign-off, files from the client. Name a handover by its result (`Lab quotes received`, `Layout signed off by Dana`); a task the user asks to add keeps the user's words ("add a task: order a debugger" → `Order a debugger`). A handover starts with the user's action, then waits — `Status` Waiting, `Waiting on` the party — and is Done when the result is in (`Waiting on` stays, as the record of whom it waited on).
- **No → a problem**: something that might go wrong and move dates (**Risk**), work that cannot proceed until someone acts on something nobody planned for — whether the work is under way or still ahead (**Blocker**), a decision someone has to make (**Question**).
- News about an item that exists ("Dana signed", "the boards are late", "they answered") changes that item. It becomes a new problem only when the user calls it a risk, a blocker or a decision, or when it is about nothing in the plan.

**How big a task is.** A task deserves its own line in a weekly report: days or weeks of work, or a handover worth chasing. Anything smaller — "flashed the dev board", "wrote the driver" — is progress: a history line on the task or milestone it belongs to, never a new row. A task row is created only when the user asks for one ("add a task…"), from an imported plan, or in a plan change the user approved.

**Dates are always agreed.** Every date in the tracker — a milestone's or a task's — is one the client was given. A step the user plans only for themselves gets no dates: it is a task without `Dates`, placed by its milestone and its history. A date that is not agreed yet is not written into `Dates`: it goes into the history (`- **Oct 6** — Proposed to Fjord Labs: Oct 20 – Oct 31, not agreed yet.`) or, when someone has to confirm it, into a Question waiting on them. A task whose agreed dates would run past its milestone's end means the milestone's end moves too — that is shown as part of the same change and agreed with it, never done silently.

**How lateness works.** Lateness is measured against `Dates` — on milestones and on tasks alike — and Notion computes it live, so nothing you write about lateness can go stale. A Done item is late by `Finished` − end of `Dates` (negative = early). An open (Planned, In progress, Waiting) item whose end has passed is late by today − end, growing every day. A Paused milestone, a task of a Paused milestone, or anything in a Paused project is not late: the work is stopped, not overrun. `Late, days` on the project is the worst of its open milestones and open tasks. The API returns formula values as opaque references, so when you need a number, compute it from the dates by the same rule.

**How the levels move together.** When work starts on a task — it becomes In progress, or a work task becomes Done — its milestone, if Planned, becomes In progress at once, with a history line. A handover (a quote, a sign-off, funding) waiting or done does not start the work by itself: when it is done, its milestone becomes In progress only if the milestone has no dates or its start has come; otherwise it stays Planned until then. A task stuck on a Blocker keeps its status; the linked Blocker is what shows it. When the last open task of a milestone that was already under way is Done, ask whether the milestone is done too — never close it on your own; when that same change only started the milestone (a sign-off that lets the work begin), there is nothing to ask. When a milestone is Done while it still has open tasks, ask what happens to them (Done or Dropped). A milestone's `Dates` never follow from its tasks: they are a promise of their own.

`Removed` and `Dropped` are for things the user threw away; views, counts, overviews and reports look only at the other ("live") statuses.

The root page starts with a collapsed gray config toggle (the four data source IDs), then tabs: `Projects` (view `Active` — Active and Paused), `Milestones` (`Next up`, `Timeline` — Planned, In progress, Paused), `Tasks` (`All` — every live task by project; `Waiting on` — Waiting, by party; `Timeline` — open tasks), `Problems` (`Open` — Open and Waiting; `Recently resolved`). A **project page is the project's row in Projects**: a status callout, then tabs `Plan` (Gantt of milestones), `Tasks` (Gantt of tasks by milestone), `Schedule` (milestones: dates, finished, lateness), `Problems`, `Notes`. A milestone page shows its tasks above its history.

## Rules that protect the data

- **Read through views and page fetches only; never Notion SQL or rows mode.** Those draw on a workspace-wide quota that runs out mid-session on most plans; views are unmetered and already filtered. `notion-query-data-sources` without `mode` defaults to SQL, so always pass `mode: "view"`.
- **Change pages piece by piece** — `insert_content` to add, `update_content` with the exact old text to change. `replace_content` rebuilds the whole body: on a milestone or task it erases the history, on a root or project page it sends the databases and views to the trash.
- **If a write returns an error, stop.** Re-fetch the page, see what actually happened, and tell the user what failed. Do not try another command, another markup form or escaping to force it through — that improvisation is how pages get destroyed.
- **`Dates` move only by agreement.** They are what the client was told, on milestones and tasks alike; moving them silently would erase the lateness they exist to show. They move when the user says the new dates are agreed with the client (or that the project runs on the user's own plan), and every move is written into the item's history as `old → new`.
- **Never guess a date or a duration.** A date is stated by the user or the source, or follows from a fixed rule in these files. Anything else — "done last week", a delay with no size, a new milestone without a date — ask one short question covering everything missing. A task may have no dates at all; do not ask for one unless the user is planning dates with the client.
- **Write what was said, nothing more.** History, notes and reports carry the user's or the source's facts; no added causes, details or commitments on the user's behalf.
- **`Waiting on` is a concrete name** — a person, a vendor, or the client as written in the project's `Client` field; empty means it is on the user. The `Waiting on` views group by it across projects, so "client" would lump different clients together.
- **Recording a fact vs replanning.** A date or state the user states — an item finished, a task waiting on someone, a corrected date, a problem resolved, a pause, a task the user asked to add — is recorded directly. Changing the plan — moving dates the user did not name, adding or dropping milestones, adding several tasks at once from your own reading, creating a project — is shown first and done on the user's yes, because it rewrites many rows on your reading of their words. Removing a project, a task or a problem is not a replan: the user named exactly what should go (`references/plan-changes.md`).

## Finding things

**The root page** is recognised by its config block, not by its title — the user may have named or renamed it anything. The block is a toggle at the top whose summary reads `⚙️ **Config** — read by the \`project-tracker\` skill…` and whose lines list `projects`, `milestones`, `tasks`, `problems` (data source IDs). If you already have the IDs from earlier in the conversation, use them. Otherwise:

- the user named or linked the page → fetch it;
- else `notion-search` for `read by the project-tracker skill` and keep the pages whose toggle summary *begins* with `⚙️ Config — read by the project-tracker skill` (other tools write similar config blocks, and a switched-off or backup tracker carries a changed summary; when the highlight is not conclusive, fetch the page and check). One → use it. Several → ask once which, by title and parent.
- None → the tracker is not set up (see **Other scenarios**).
- A config with `open_items` and no `tasks` is a tracker made by version 0.x: say so and offer the upgrade (`references/upgrade.md`) before anything else; do not write to it with the rules of this version.

A project: query the `Active` view and match by meaning ("the rain gauge" → "Weather station", "the masts" → "Weather station" whose repository is `wx_mast`). A Done project: `notion-search` by name. A Removed one only when the user names it or asks to bring it back. A milestone, task or problem: the project's `Schedule` / `Tasks` / `Problems` views, again by meaning — and a task before a milestone when the words name a step ("the demo firmware" is the task *Demo firmware*, not the milestone *Demo prototype*). With one candidate there is nothing to ask; with several plausible ones, ask.

**Overdue check.** When you work on one project and one of its open milestones or tasks has an end before today (not Paused, its milestone and project not Paused), mention it and ask what happened — finished (on which day), a new date agreed with the client, or still going — unless its latest history line already explains it (a "not agreed yet" note) or the user answered earlier in this conversation. "Still going" with a reason gets a history line (`- **Mar 24** — Still going: waiting for the second batch.`); the item stays late, and a Planned one becomes In progress.

## Notion calls

Tool names are the Notion MCP tools (`notion-fetch`, `notion-query-data-sources`, `notion-update-page`, `notion-create-pages`, …); the prefix differs by surface.

**Reading a view.** Database views: fetch the database (its `<database url=…>` on the root page) → it lists `<view url="view://<id>">` → query `data: {mode: "view", view_url: "https://app.notion.com/p/<database id>?v=<view id without dashes>"}`. Project page views: fetch the project page → each tab holds `<database url="https://…/p/<block id>" data-source-url="collection://…">` → fetch that block → its view id → the same query with the block id. Rows come with `url` (page id) and dates as `date:<Prop>:start` / `:end`.

**New row** (milestone, task, problem): `notion-create-pages` with `parent: {data_source_id: <id from the config>}`, the properties below, and optionally `content` for the page body (a first history line).

**Properties** (`notion-update-page`, `command: "update_properties"`, or on create): date range `"date:Dates:start": "2026-03-02", "date:Dates:end": "2026-03-20"` — always both ends; single dates (`Finished`, `Target end`, `Opened`, `Resolved on`) start only; relation `["<page id>"]`; select as the option name; checkbox `"__YES__"` / `"__NO__"`; clearing a value `null` (both date ends).

**Bodies.** A history line: `insert_content`, `position: {"type": "end"}`. Changing one line or block: `update_content` with `old_str` exactly as fetched. Block tags (`<callout>`, `<details>`, `<tabs>`, `<tab>`, `<database>`, `<page>`) are sent as raw `<` `>` — in JSON only `"`, tabs and newlines are escaped (`\"`, `\t`, `\n`). Lines inside a callout, toggle or tab are indented with tabs; without them Notion turns the lines into separate blocks. After any write that contains markup, fetch the page and check: tags that show up as text (`&lt;callout`), blocks out of order, or an `icon=` that Notion added → fix with `update_content`. Pages, databases and tabs carry no icons; only the callouts have one.

**The status callout** holds only what changes when something happens — never lateness or "on track", which depend on today's date and would go stale in a text block (the live number is `Late, days` at the top of the page):

```
<callout icon="🔴" color="red_bg">
	**Now:** Demo prototype — due Nov 9 → Board and enclosure designed, ordered, due Oct 16
	**Blocked on:** Test rig (Dana)
	**Waiting on:** Lab quotes received (Kestrel Labs, Halden Test) · Layout signed off by Dana (Dana)
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
3. Reply with one short line per change, **was → now**: `Demo firmware → Done, finished Oct 28 (due Oct 30) · Demo prototype: still In progress, 1 task left`. Never change something silently; the user should not have to open Notion to know what happened.

**Undo** ("undo that", "revert", "put it back") takes back a change; it is not a new fact.

- Made in this conversation: you have the old values. Check that each field still holds what you wrote — if the user edited it since, show that and ask. Otherwise restore without asking: old property values back; history or note lines that recorded the change removed (`update_content` with the line as `old_str`, empty `new_str` — plain text lines only; a sub-page or file you added stays, and you tell the user they can delete it by hand); milestones, tasks and problems you created → Dropped, a project you created → Removed. Then step 2 and a was → now reply.
- Made earlier: first make sure which change is meant (ask unless the user named it). Rebuild the old values from what Notion shows — history lines record date moves as `Mar 6 → Mar 13`, pause and removal lines record the previous status — then show what you would restore and ask, since this is a reconstruction. A value recorded nowhere is asked for, not guessed.
- Notion's version history (••• → Version history) is the user's last resort; the API cannot restore versions.

## Frequent scenarios

### Progress — "finished the demo firmware", "calibration passes", "Dana signed"

Find the item: a task first when the words name a step or a handover, else the milestone. If what the user reports *is* its result, it is done; if it is a step towards it, it is progress; when unsure, record progress and ask whether to close it. Append a history line in the user's words, in English. If done: `Status` Done, `Finished` = the day it was done (today unless the user says otherwise); `Dates` stay — `Finished` against them is the record of how it went. Then the levels (**How the levels move together**): a task done under a Planned milestone moves the milestone to In progress; the last open task done → ask whether the milestone is done. Whatever was done — a task or a milestone — if the next one in the same chain starts now (its start is today or earlier, or the user says they are on it), set it In progress, with a history line. A progress line about a milestone with an In-progress task goes on that task.

### Tasks — "add a task: order a debugger", "sent the RFQ, now waiting on the labs", "Kestrel replied"

- **New**: the user named it, so create it without a preview, named in the user's words — `Project`, `Milestone` (the stage it serves, by meaning; the In-progress one if the words fit it; none in a project without milestones), `Status` Planned, `Dates` only if the user gave them as agreed with the client (otherwise none, and no question). First history line `- **Oct 6** — Added.` plus the reason if given. One plausible milestone → no question; several → ask.
- **Waiting**: the user did their part and someone else has to act → `Status` Waiting, `Waiting on` the party, history line with what was sent. Back to In progress when the user has work on it again; Done when the result is in. Every message about it ("they asked for the block diagram", "sent the full package") is a history line on the task — the task's page is its log.
- **Dates proposed, not agreed** ("I'll suggest Oct 20–31 for the enclosure"): no `Dates`; a history line with the proposal and, if the client has to confirm, a Question waiting on them. When they agree, the dates go in.

### Delay — "the boards are three days late", "the supplier slipped a week"

The delayed item is a task when the words name a step, else a milestone. When the user calls the delay a risk or a blocker ("the quote is late, a risk for certification"), it is a problem (**Problems**), not this scenario; so is a delay of an item without dates — there is nothing to move. If the size is not given, ask how long and write nothing until you know.

- Record first, then ask. Add `- **Oct 26** — Expected about 3 days late: boards late. Not agreed with the client yet.`; in the same reply show what would move if the client agrees — the item's end, the tasks of the same milestone starting on or after its old end, the milestone's end if its tasks now pass it, and — whenever a milestone's end moves, its own or through its tasks — the milestones starting on or after its old end (`Boards arrived and brought up: Nov 5 → Nov 8; Demo unit working at the client: Nov 6–9 → Nov 9–12; Demo prototype: Nov 9 → Nov 12`) — and ask whether the new dates are agreed. Parallel work that does not wait on it stays only if the user's words make that clear — otherwise move it too and say so. If the user already said it is agreed, skip the question.
- **Agreed** (now or later, or the user runs this project on their own plan): move the dates shown; the slipped item gets `- **Oct 26** — Moved with Fjord Labs: boards late. Nov 5 → Nov 8.`, each pushed item `- **Oct 26** — Pushed by the Boards arrived move, Nov 6 → Nov 9.` If only this one item moves, to the date the user gave, record it without the preview.
- **Not agreed**: the dates stay — the commitment has not changed. Tell the user that the item will show as late once its date passes, and that you will move it when they agree a date.

If an open Risk described exactly this, resolve it with `Note` "fired, +3 days".

### Pause — "the enclosure test is on hold until Kestrel sends the parts", "resume the enclosure test"

A milestone stops for a reason outside the work — it is not late while it waits, and neither are its tasks. Set `Status` Paused and add `- **Mar 10** — Paused (was In progress): waiting on Kestrel for parts.` If someone else has to act, link or open a task or problem for it (`Waiting on` Kestrel) so it shows up in "who to chase". A pause without a reason is allowed: write `no reason given` and ask for it in your reply. The pause is a fact the user reported, so record it first; then, in the same reply, ask whether later milestones wait on this one — those that do are paused the same way, the rest carry on (several milestones can be In progress).

Tasks are not paused on their own: a task that cannot move because someone else has to act is Waiting; one the user set aside stays Planned with a history line saying why.

Resume: the status recorded in the pause line comes back, for this milestone and those paused with it. Ask how much work is left and whether the new dates are agreed with the client. Agreed → move `Dates` from today as an agreed delay, and push the milestones that waited on it only where the new end runs past their start (pulling them earlier is a separate plan change): `- **Mar 24** — Resumed after 14 days; moved with Fjord Labs. Mar 20 → Apr 1.` Not agreed → `Dates` stay, the history says `Resumed after 14 days; new dates not agreed yet`, and tell the user the milestone counts as late from its old date. Offer to resolve the problem or finish the task it was waiting on.

### Problems — new, resolved, changed

New: pick the type by what it is — **Blocker** (work cannot proceed until someone acts, and the plan did not expect it), **Risk** (might happen and would move dates; consequence in `Note`), **Question** (a decision; `Waiting on` = who decides). Links: `Task` = the task the problem is about, if the words name one; `Milestone` = the milestone it threatens or blocks ("the lab quote is late, a risk for certification" → `Task` the lab quote task, `Milestone` Certification). `Status` Waiting if someone else has to act on the problem itself, else Open — a risk about a task that already waits on that party is Open with `Waiting on` empty, the task carries the wait; `Opened` today. If the problem is about a task ("the lab quote is late, a risk for certification"), add a history line on that task too. No milestone history line otherwise — problems show on the page.
Resolved: `Status` Resolved, `Resolved on` today, `Note` = the one-line resolution. If the answer changes the plan, continue as a delay or plan change.
Changed ("Dana isn't the one, the client decides", "this risk is now a blocker"): update in place — `Waiting on`, `Type`, `Status` (Waiting ↔ Open by whether someone else has to act), `Milestone`, `Task`; append to `Note` after ` · ` instead of overwriting. A "problem" that turns out to be planned work becomes a task: create the task with the problem's facts as its first history lines and drop the problem with ` · moved to a task`.

### Corrections — "no, that was yesterday", "wrong milestone", "it came back, not fixed"

The fact was different from what was recorded. Fix exactly that: `Finished`, the milestone or task a line belongs to, the milestone a task belongs to, an item reopened (a reopened milestone or task loses its `Finished`, a reopened problem its `Resolved on`). Edit the wrong history line in place rather than adding one, so the history stays true. `Dates` that were simply entered wrong (never agreed otherwise) are fixed directly with `- **Mar 24** — Corrected: Mar 20 → Mar 22 (entered wrong).`; a real change of an agreed date is a delay. Other items keep their dates — if they look like they should move too, say so and offer.

### Project state and fields — "put the project on hold", "that one is finished", "the repo is …"

Paused / Done / Active → project `Status`, a dated line in `Notes` with the reason if given and the previous status (`**Mar 3** — Paused (was Active): client budget review.`), and the callout. While a project is Paused nothing in it counts as late. Resuming it: ask whether its dates move; agreed → move them as for an agreed delay; not agreed → they stay, and items past their dates count as late again. Done with milestones or tasks still open: ask whether to close them — they stay in the views until closed. Other fields (client, origin, repository, source): set them; a new `Origin` value becomes a new option of the select. Removing a project: `references/plan-changes.md`.

### Notes and files — "save the call notes", "attach the datasheet"

Anything about the project that is not plan, progress, a task or a problem goes into the project's `Notes` tab, oldest first below the tab's gray placeholder line:

- Short note: `update_content` with `old_str` = the tab's last line, `new_str` = that line plus `**Mon D** — text` at the same indentation.
- Long text (call notes, a spec, an email thread): `notion-create-pages` with the project page as parent, title `Mon D — <subject>`; it lands as a `<page …>` line at the end of the project page, so move it into the tab with one `update_content` holding two `content_updates`: that `<page …>` line → empty, and the tab's last line → that line plus the same `<page url="…">…</page>` line. Notion rejects the page line appearing twice, so both edits go in the same call.
- File: upload with the file-upload tool and add its `suggested_markdown` like a short note, with one line saying what it is.

Correspondence that belongs to one task (the emails of an RFQ) goes into that task's history instead. Your summaries are in English; pasted material stays as pasted. If the note also reports progress or a problem, handle that as its own scenario — unless the user asked only to save it ("just note it"); then save only and mention what it seems to imply.

### Status — "how is X going?", "how are the masts?"

Query the project's `Schedule`, `Tasks` and `Problems` views. Answer in four parts: **Now** (the In-progress milestones and their due dates, each with its current tasks); **Late** (every open milestone and task past its end, by how many days, and those finished late in the last two weeks — computed from the dates as Notion does; "nothing late" if none); **Blocked / waiting / on hold** (blockers first, then whom the project waits on and since when, paused milestones with reason and since when, open risks and questions in one line); **Next** (one or two milestones or tasks with dates). With no project named and several active, give the overview instead.

### My week — "what's on me this week?", "what do I have to do?"

Across the active projects, from today through Sunday (on Friday to Sunday, through the next Sunday): the tasks and milestones the user has to move — not Waiting, `Waiting on` empty — grouped by project:

- **Overdue**: items past their end.
- **Due this week**: items whose end falls in the window.
- **In progress**: what is underway without a date in the window.
- **Starting**: Planned items whose start falls in the window.
- **Decide**: Questions and Blockers that are on the user.

Then one short line of whom to chase (Waiting items, oldest first). Undated Planned tasks are listed only under an In-progress milestone, as "no date".

### Overview — "what's burning?", "who do I chase?", "what got done this week?"

From the root views `Next up`, `Open` (problems), `Recently resolved`, the `Waiting on` task view, and the `Tasks` views of active projects for tasks finished this week. Only projects in `Active` count — skip rows of other projects.

- Late and due soon: open milestones and tasks past their end (with days late), then those ending in the next 14 days, by project — nothing paused is late.
- On hold: paused milestones, with reason and how long.
- Chase: Waiting tasks and problems waiting on someone, grouped by who, oldest first (a problem's age counts from `Opened`; a task's from the start of its `Dates`, or, without dates, from the history line that set it Waiting).
- On you: tasks in progress and problems with empty `Waiting on`.
- Closed this week: milestones and tasks done and problems resolved in the last 7 days, today included — when there are any.

If the config has a `dashboard` line, end with its link: the same picture, live.

## Dashboard updates

The first line of `assets/dashboard.html` is `<!-- dashboard-version: N -->`, where N is the plugin's version (`x.y.z`) — the release stamps it on every release, so N is never edited by hand. The config's `dashboard_version` is the version the user's dashboard was last published from (no line = 1; a whole number, from before versions followed the plugin, is older than any `x.y.z`). In a conversation with the user — never in a scheduled or unattended run — answer what was asked first; then, once per conversation and only if `dashboard_skip` is not N, end with one short line in the user's language:

- **The config has no `dashboard` line** (set up before the dashboard existed, or the user removed it): what the dashboard is, in a few words, and whether to publish it now. Yes → publish it as `references/dashboard.md` → Publish says.
- **Its `dashboard_version` is below N**: the dashboard has an update to N — what is new, in a few words, from the plugin's `CHANGELOG.md` (at the plugin root, next to `skills/`) between the two versions, the entries about the dashboard; no such entries or no file → just the version — and whether to update it now. Yes → update it as `references/dashboard.md` → Publish says (same link, `dashboard_version` set to N).

No to either → add `dashboard_skip: N` to the config, so it is not offered again until a newer version. For the check read only the asset's first line, not the whole file.

## Other scenarios — read the file first

| When | Read |
|---|---|
| Set up the tracker, the root page is missing, or an existing tracker lacks something (views, tabs, columns) | `references/setup.md` |
| A tracker made by version 0.x (config has `open_items`), or the user asks to upgrade or migrate it | `references/upgrade.md` |
| New project from a plan, estimate, email, file or document | `references/new-project.md` |
| New project from a platform contract (Upwork) | `references/new-project.md` and `references/contracts.md` |
| Resync a project with its contract | `references/contracts.md` |
| Add, drop, rename, split or merge milestones; break a milestone into tasks; finish early and pull the plan in; remove or restore a project or item | `references/plan-changes.md` |
| Weekly report or client update | `references/report.md` |
| Publish, update or change the dashboard | `references/dashboard.md` |

If something does not fit the model (say, a second client on one project), ask once rather than inventing a field.
