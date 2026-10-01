---
name: project-tracker
description: Keeps client project plans in Notion up to date from plain conversation. Use whenever the user reports progress on a project ("finished X", "calibration passes", "parts arrived"), mentions a delay, blocker, risk or open question ("the supplier slipped a week", "no test rig", "need to decide...") or that one is resolved ("Dana set up the rig", "they answered"), asks how a project is going ("what's the status of X?", "how is X going?") or what is due / whom to chase, wants a weekly report, wants to save a note, call summary, email or file to a project, says a project or a stage is paused, finished, resumed or should be removed, changes the plan (adds, drops or renames a stage, finished early), corrects or undoes something recorded, wants a project synced with its contract, wants a new project set up from a plan, estimate, email, file or a contract in a connected service (e.g. Upwork), or wants the tracker itself set up. Trigger even when the user does not say "Notion", "plan" or "tracker" — any statement about the state of a project is an update to the tracker.
---

# Project tracker

The user runs projects for clients. The plan, its progress, slips and open problems live in Notion, but the user does not edit Notion — they tell you what happened and you keep it current. Each project page must answer three questions at a glance — where is the project, what is next, what is in the way — and be fit to show the client as is. Everything you write to Notion is in English (pasted material stays as pasted); you talk to the user in the conversation's language.

## The tracker

A root page — its name is the user's choice at setup, `Project tracker` by default — with three databases:

- **Projects** — `Name`, `Client`, `Status` (Active / Paused / Done / Removed), `Summary` (one sentence: where we are, what is next — never lateness or "on track", which would go stale), `Target end`, `Repository`, `Source` (link to where the project came from — a platform contract or a shared document; empty for pasted text, email, local files), `Late, days` (computed by Notion: the worst lateness among the project's open milestones), `Milestones` (the reverse of the milestones' `Project`; hidden on the page).
- **Milestones** — `Name`, `Project`, `Phase`, `Status` (Planned / In progress / Paused / Done / Dropped), `Dates` (the dates agreed with the client; they draw the Gantt), `Finished` (the day it was actually done), `Late, days` (computed). A milestone's page body is its **history**: dated lines `- **Mar 4** — …`, newest at the bottom. That is where the "why" lives. `Project status` and `Open late` are helper columns for the formulas; never write them.
- **Issues** (config key `open_items`) — `Name`, `Project`, `Type` (Blocker / Risk / Question / Task), `Status` (Open / Waiting / Resolved / Dropped), `Waiting on`, `Milestone`, `Note`, `Opened`, `Resolved on`.

**How lateness works.** `Dates` are a commitment, so lateness is measured only against them, and Notion computes it live — nothing you write about lateness can go stale. A Done milestone is late by `Finished` − end of `Dates` (negative = early). An open (Planned or In-progress) milestone whose end has passed is late by today − end, growing every day. A Paused milestone, or any milestone of a Paused project, is not late: the work is stopped, not overrun. `Late, days` on the project is the worst of its Planned and In-progress milestones. The API returns formula values as opaque references, so when you need a number, compute it from the dates by the same rule.

`Removed` and `Dropped` are for things the user threw away; views, counts, overviews and reports look only at the other ("live") statuses.

The root page starts with a collapsed gray config toggle (the three data source IDs), then tabs: `Projects` (view `Active` — Active and Paused), `All plans` (Milestones: `Next up`, `Timeline` — Planned, In progress, Paused), `Issues` (`Waiting on` — Open and Waiting; `Recently resolved`). A **project page is the project's row in Projects**: a status callout, then tabs `Plan` (Gantt), `Schedule` (dates, finished, lateness), `Open items`, `Notes`.

## Rules that protect the data

- **Read through views and page fetches only; never Notion SQL or rows mode.** Those draw on a workspace-wide quota that runs out mid-session on most plans; views are unmetered and already filtered. `notion-query-data-sources` without `mode` defaults to SQL, so always pass `mode: "view"`.
- **Change pages piece by piece** — `insert_content` to add, `update_content` with the exact old text to change. `replace_content` rebuilds the whole body: on a milestone it erases the history, on a root or project page it sends the databases and views to the trash.
- **If a write returns an error, stop.** Re-fetch the page, see what actually happened, and tell the user what failed. Do not try another command, another markup form or escaping to force it through — that improvisation is how pages get destroyed.
- **`Dates` move only by agreement.** They are what the client was told; moving them silently would erase the lateness they exist to show. They move when the user says the new dates are agreed with the client (or that the project runs on the user's own plan), and every move is written into the milestone's history as `old → new`.
- **Never guess a date or a duration.** A date is stated by the user or the source, or follows from a fixed rule in these files. Anything else — "done last week", a delay with no size, a new milestone without a date — ask one short question covering everything missing.
- **Write what was said, nothing more.** History, notes and reports carry the user's or the source's facts; no added causes, details or commitments on the user's behalf.
- **`Waiting on` is a concrete name** — a person, a vendor, or the client as written in the project's `Client` field; empty means it is on the user. The root `Waiting on` view groups by it across projects, so "client" would lump different clients together.
- **Recording a fact vs replanning.** A date or state the user states — a milestone finished, a corrected date, an issue resolved, a pause — is recorded directly. Changing the plan — moving milestones the user did not name, adding or dropping milestones, creating a project — is shown first and done on the user's yes, because it rewrites many rows on your reading of their words. Removing a project or an issue is not a replan: the user named exactly what should go (`references/plan-changes.md`).

## Finding things

**The root page** is recognised by its config block, not by its title — the user may have named or renamed it anything. The block is a toggle at the top whose summary reads `⚙️ **Config** — read by the \`project-tracker\` skill…` and whose lines list `projects`, `milestones`, `open_items` (data source IDs). If you already have the IDs from earlier in the conversation, use them. Otherwise:

- the user named or linked the page → fetch it;
- else `notion-search` for `read by the project-tracker skill` and keep the pages whose highlight or content shows that line (other tools write similar config blocks; check the skill name). One → use it. Several → ask once which, by title and parent.
- None → the tracker is not set up (see **Other scenarios**).

A project: query the `Active` view and match by meaning ("the rain gauge" → "Weather station"). A Done project: `notion-search` by name. A Removed one only when the user names it or asks to bring it back. A milestone or issue: the project's `Plan` / `Open items` view, again by meaning. With one candidate there is nothing to ask; with several plausible ones, ask.

**Overdue check.** When you work on one project and one of its open milestones has a `Dates` end before today (not Paused, project not Paused), mention it and ask what happened — finished (on which day), a new date agreed with the client, or still going — unless its latest history line already explains it (a "not agreed yet" note) or the user answered earlier in this conversation. "Still going" with a reason gets a history line (`- **Mar 24** — Still going: waiting for the second batch.`); the milestone stays late.

## Notion calls

Tool names are the Notion MCP tools (`notion-fetch`, `notion-query-data-sources`, `notion-update-page`, `notion-create-pages`, …); the prefix differs by surface.

**Reading a view.** Database views: fetch the database (its `<database url=…>` on the root page) → it lists `<view url="view://<id>">` → query `data: {mode: "view", view_url: "https://app.notion.com/p/<database id>?v=<view id without dashes>"}`. Project page views: fetch the project page → each tab holds `<database url="https://…/p/<block id>" data-source-url="collection://…">` → fetch that block → its view id → the same query with the block id. Rows come with `url` (page id) and dates as `date:<Prop>:start` / `:end`.

**New row** (milestone, issue): `notion-create-pages` with `parent: {data_source_id: <id from the config>}`, the properties below, and optionally `content` for the page body (a first history line).

**Properties** (`notion-update-page`, `command: "update_properties"`, or on create): date range `"date:Dates:start": "2026-03-02", "date:Dates:end": "2026-03-20"` — always both ends; single dates (`Finished`, `Target end`, `Opened`, `Resolved on`) start only; relation `["<page id>"]`; select as the option name.

**Bodies.** A history line: `insert_content`, `position: {"type": "end"}`. Changing one line or block: `update_content` with `old_str` exactly as fetched. Block tags (`<callout>`, `<details>`, `<tabs>`, `<tab>`, `<database>`, `<page>`) are sent as raw `<` `>` — in JSON only `"`, tabs and newlines are escaped (`\"`, `\t`, `\n`). Lines inside a callout, toggle or tab are indented with tabs; without them Notion turns the lines into separate blocks. After any write that contains markup, fetch the page and check: tags that show up as text (`&lt;callout`), blocks out of order, or an `icon=` that Notion added → fix with `update_content`. Pages, databases and tabs carry no icons; only the callouts have one.

**The status callout** holds only what changes when something happens — never lateness or "on track", which depend on today's date and would go stale in a text block (the live number is `Late, days` at the top of the page):

```
<callout icon="🔴" color="red_bg">
	**Now:** Enclosure test — due Mar 25
	**Blocked on:** Test rig (Dana) · Spec sign-off (Fjord Labs)
	**On hold:** Radio certification — waiting on Kestrel, since Mar 10
</callout>
```

- `**Now:**` the In-progress milestones with their due dates, joined by ` · ` (`— no date yet` if none).
- `**Blocked on:**` every Blocker and every Waiting item among the Open/Waiting issues — except those linked to a Paused milestone, which show under On hold — as `<name> (<Waiting on>)` joined by ` · `; if there are none, `**Open:** N questions · M risks · K tasks` (omit zeros; `**Open:** nothing`).
- `**On hold:**` each Paused milestone, why and since when (`— no reason given` if none); the line is left out when nothing is paused.
- Icon and colour: 🔴 `red_bg` if any Blocker is Open or Waiting; else 🟡 `yellow_bg` if a milestone is on hold; else 🔵 `blue_bg`. A project that is not Active gets one first line instead of `Now`: `**Paused** since Mar 3 — <reason>` ⏸️ `gray_bg`, `**Done** Mar 20` ✅ `gray_bg`, `**Removed**` 🗑️ `gray_bg`.
- To update it: fetch the page, `update_content` with `old_str` = the whole current callout as fetched, `new_str` = the new one.

## Every change: read, write, check, report

1. Before writing, note the current values of everything you are about to change — you have them from the read.
2. Write. Then bring `Summary`, `Target end` and the status callout in line with what changed.
3. Reply with one short line per change, **was → now**: `Enclosure test → Done, finished Mar 27 (due Mar 25) · Radio certification → In progress`. Never change something silently; the user should not have to open Notion to know what happened.

**Undo** ("undo that", "revert", "put it back") takes back a change; it is not a new fact.

- Made in this conversation: you have the old values. Check that each field still holds what you wrote — if the user edited it since, show that and ask. Otherwise restore without asking: old property values back; history or note lines that recorded the change removed (`update_content` with the line as `old_str`, empty `new_str` — plain text lines only; a sub-page or file you added stays, and you tell the user they can delete it by hand); milestones and issues you created → Dropped, a project you created → Removed. Then step 2 and a was → now reply.
- Made earlier: first make sure which change is meant (ask unless the user named it). Rebuild the old values from what Notion shows — history lines record date moves as `Mar 6 → Mar 13`, pause and removal lines record the previous status — then show what you would restore and ask, since this is a reconstruction. A value recorded nowhere is asked for, not guessed.
- Notion's version history (••• → Version history) is the user's last resort; the API cannot restore versions.

## Frequent scenarios

### Progress — "calibration passes", "the firmware boots on the new board"

Find the milestone in the `Plan` view. If what the user reports *is* the milestone's deliverable, it is done; if it is a step towards it, it is progress; when unsure, record progress and ask whether to close it. Append a history line in the user's words, in English. If done: `Status` Done, `Finished` = the day it was done (today unless the user says otherwise); `Dates` stay — they are what was promised, and `Finished` against them is the record of how it went. If the next milestone obviously starts now, set it In progress, with a history line.

### Delay — "the supplier slipped a week", "parts arrive late"

If the size is not given, ask how long. Then ask whether the new date is agreed with the client, unless the user already said.

- **Agreed** (or the user runs this project on their own plan): if only this milestone moves, to the date the user gave, record it directly. Otherwise it is a replan: the slipped milestone moves its end; every milestone starting on or after its old end moves by the same amount; parallel work that does not wait on it stays only if the user's words make that clear — otherwise move it too and say so. Show the moves (`Enclosure test: Mar 20 → Mar 27; Radio certification: Mar 27 → Apr 3`) and ask. On yes: move `Dates`; the slipped milestone gets `- **Mar 12** — Moved with Fjord Labs: parts late. Mar 20 → Mar 27.`, each pushed one `- **Mar 12** — Pushed by the Enclosure test move, Mar 27 → Apr 3.`
- **Not agreed yet**: `Dates` stay — the commitment has not changed. Add `- **Mar 12** — Expected about a week late: parts late. Not agreed with the client yet.` and tell the user that the milestone will show as late once Mar 20 passes, and that you will move it when they agree a date.

If an open Risk described exactly this, resolve it with `Note` "fired, +1 week".

### Pause — "the enclosure test is on hold until Kestrel sends the parts", "resume the enclosure test"

A milestone stops for a reason outside the work — it is not late while it waits. Set `Status` Paused and add `- **Mar 10** — Paused (was In progress): waiting on Kestrel for parts.` If someone else has to act, link or open an issue for it (`Waiting on` Kestrel, `Milestone` = this one) so it shows up in "who to chase". A pause without a reason is allowed: write `no reason given` and ask for it in your reply. The pause is a fact the user reported, so record it first; then, in the same reply, ask whether later milestones wait on this one — those that do are paused the same way, the rest carry on (several milestones can be In progress).

Resume: the status recorded in the pause line comes back, for this milestone and those paused with it. Ask how much work is left and whether the new dates are agreed with the client. Agreed → move `Dates` from today as an agreed delay, and push the milestones that waited on it only where the new end runs past their start (pulling them earlier is a separate plan change): `- **Mar 24** — Resumed after 14 days; moved with Fjord Labs. Mar 20 → Apr 1.` Not agreed → `Dates` stay, the history says `Resumed after 14 days; new dates not agreed yet`, and tell the user the milestone counts as late from its old date. Offer to resolve the issue it was waiting on.

### Issues — new, resolved, changed

New: pick the type by what it is — **Blocker** (cannot proceed until someone acts), **Risk** (might happen and would move dates; consequence in `Note`, link the threatened `Milestone`), **Question** (a decision; `Waiting on` = who decides), **Task** (a to-do outside the plan). `Status` Waiting if someone else has to act, else Open; `Opened` today. No milestone history line — issues show on the page.
Resolved: `Status` Resolved, `Resolved on` today, `Note` = the one-line resolution. If the answer changes the plan, continue as a delay or plan change.
Changed ("Dana isn't the one, the client decides", "this risk is now a blocker"): update in place — `Waiting on`, `Type`, `Status` (Waiting ↔ Open by whether someone else has to act), `Milestone`; append to `Note` after ` · ` instead of overwriting.

### Corrections — "no, that was yesterday", "wrong milestone", "it came back, not fixed"

The fact was different from what was recorded. Fix exactly that: `Finished`, the milestone a line belongs to, a milestone or issue reopened (a reopened milestone loses its `Finished`). Edit the wrong history line in place rather than adding one, so the history stays true. `Dates` that were simply entered wrong (never agreed otherwise) are fixed directly with `- **Mar 24** — Corrected: Mar 20 → Mar 22 (entered wrong).`; a real change of an agreed date is a delay. Other milestones keep their dates — if they look like they should move too, say so and offer.

### Project state and fields — "put the project on hold", "that one is finished", "the repo is …"

Paused / Done / Active → project `Status`, a dated line in `Notes` with the reason if given and the previous status (`**Mar 3** — Paused (was Active): client budget review.`), and the callout. While a project is Paused none of its milestones count as late. Resuming it: ask whether its dates move; agreed → move them as for an agreed delay; not agreed → they stay, and milestones past their dates count as late again. Done with milestones still open: ask whether to close them — they stay in `Next up` until closed. Other fields (client, repository, source): set them. Removing a project: `references/plan-changes.md`.

### Notes and files — "save the call notes", "attach the datasheet"

Anything about the project that is not plan, progress or an issue goes into the project's `Notes` tab, oldest first below the tab's gray placeholder line:

- Short note: `update_content` with `old_str` = the tab's last line, `new_str` = that line plus `**Mon D** — text` at the same indentation.
- Long text (call notes, a spec, an email thread): `notion-create-pages` with the project page as parent, title `Mon D — <subject>`; it lands as a `<page …>` line at the end of the project page, so move it into the tab with one `update_content` holding two `content_updates`: that `<page …>` line → empty, and the tab's last line → that line plus the same `<page url="…">…</page>` line. Notion rejects the page line appearing twice, so both edits go in the same call.
- File: upload with the file-upload tool and add its `suggested_markdown` like a short note, with one line saying what it is.

Your summaries are in English; pasted material stays as pasted. If the note also reports progress or a problem, handle that as its own scenario — unless the user asked only to save it ("just note it"); then save only and mention what it seems to imply.

### Status — "how is X going?"

Query the project's `Plan` and `Open items` views. Answer in four parts: **Now** (the In-progress milestones and their due dates); **Late** (every open milestone past its end, by how many days, and milestones finished late in the last two weeks — computed from the dates as Notion does; "nothing late" if none); **Blocked / on hold** (open issues, blockers and waiting first; paused milestones with reason and since when); **Next** (one or two milestones with dates). With no project named and several active, give the overview instead.

### Overview — "what's burning?", "who do I chase?", "what got done this week?"

From the root views `Next up`, `Waiting on`, `Recently resolved`, and the `Plan` views of active projects for milestones finished this week. Only projects in `Active` count — skip rows of other projects.

- Late and due soon: open milestones past their end (with days late), then those ending in the next 14 days, by project — Paused milestones and Paused projects are not late.
- On hold: paused milestones, with reason and how long.
- Chase: issues waiting on someone, grouped by who, oldest first.
- On you: open issues with empty `Waiting on`.
- Closed this week: issues resolved and milestones done in the last 7 days, today included — when there are any.

If the config has a `dashboard` line, end with its link: the same picture, live.

## Dashboard updates

The first line of `assets/dashboard.html` is `<!-- dashboard-version: N -->`. The config's `dashboard_version` is the version the user's dashboard was last published from (no line = 1). In a conversation with the user — never in a scheduled or unattended run — when the config has a `dashboard` link and its version is below N and `dashboard_skip` is not N: answer what was asked first, then end with one short line in the user's language — the dashboard has an update, what is new (the line for each newer version in `references/dashboard.md` → Versions, in a few words), and whether to update it now. Offer once per conversation. Yes → update it as `references/dashboard.md` → Publish says (same link, `dashboard_version` set to N). No → add `dashboard_skip: N` to the config, so this version is not offered again; a later one is. For the check read only the asset's first line, not the whole file.

## Other scenarios — read the file first

| When | Read |
|---|---|
| Set up the tracker, the root page is missing, or an existing tracker lacks something (views, tabs, columns) | `references/setup.md` |
| New project from a plan, estimate, email, file or document | `references/new-project.md` |
| New project from a platform contract (Upwork) | `references/new-project.md` and `references/contracts.md` |
| Resync a project with its contract | `references/contracts.md` |
| Add, drop, rename, split or merge milestones; finish early and pull the plan in; remove or restore a project or item | `references/plan-changes.md` |
| Weekly report or client update | `references/report.md` |
| Publish, update or change the dashboard | `references/dashboard.md` |

If something does not fit the model (say, a second client on one project), ask once rather than inventing a field.
