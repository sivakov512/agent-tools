# New project

From a plan, estimate or email the user pastes or points to ("my last report in Sent", "the estimate in this PDF", "the Google Doc"), or from a platform contract — then `contracts.md` replaces steps 2–3 below; everything else is as here.

## 1. Get the source

Pasted → use it. Pointed to → fetch it with whatever tools the session has (mail, files, drive, web); if several candidates match, list them briefly (date, subject) and ask which. The **source date** is the date the source was written: an email's sent date, a document's date, or a date written in the text. Pasted text that carries no date was just written: its source date is today.

## 2. Extract

Only what the source says — no risks, milestones or tasks of your own. Follow the rules literally so the same source always gives the same rows.

- **Project** — name (the product or deliverable), client, `Origin`: `Upwork` for an Upwork contract, `Personal` with no client; a client the tracker already has projects for (plainly the same client) takes the `Origin` those projects have; else `Direct` — or the option the user names; `Claude project` as the user gives it (`chats.md` → Claude project).
- **Milestones and tasks** — by the source's structure:
  - **Section headings with items under them** → each heading is a milestone, named in sentence case without dates or durations ("SITE INSTALLATION — until June 5" → `Site installation`); each item under it is a task of that milestone, named as SKILL.md **Names** says — a short noun for the work ("Board designed, first boards ordered — December 4" → `Board design & first order`), the source's longer wording kept as its description when it says more.
  - **A heading with no items** → a milestone with no tasks.
  - **No headings, a flat list** → each item is a milestone; there are no tasks.
  - **Ongoing work with no stages** ("support the hub", "monthly maintenance") → a project without milestones; each listed item is a task.
- Work the source reports as already done: a listed item marked done is Done with `Finished` = the date the source gives for it, else the source date. Done work the source mentions without listing it becomes one Done item at the start — a task of the first milestone if there are headings, else a milestone — named with the source's phrase for the result. A Done item with no dates of its own gets `Dates` from a week before `Finished` to `Finished` (the source rarely says when it started, and a week keeps it visible on the Gantt), marked as rule-derived in the confirmation.
- Statuses: the first item not done whose start is on or before today (or that has no start) is In progress, and its milestone with it; everything else not done is Planned — a waiting handover keeps its milestone Planned. Problems from a source get `Opened` = the source date.
- **Tasks and problems**, by what the source says:
  - someone is asked to do something the plan expects (a quote, a sign-off, files) → a task, Waiting, `Waiting on` = that party (the project's `Client` value if none is named), under the milestone it serves — the source wrote it into the plan;
  - "I will do X once Y" → a task, Planned, under the milestone it serves;
  - something missing that stops work and nobody planned for ("the bench has no power analyzer — Ivan, please order one") → Blocker, Waiting, `Waiting on` = the person asked to act (none named → Open, `Waiting on` empty);
  - an undecided either/or → Question; `Waiting on` = who decides, by default the `Client` value;
  - "missing X would cost N", "N is an assumption until Y" → Risk, Open; consequence in `Summary`; linked to the milestone (and task) it threatens.

  Names as SKILL.md **Names** says; a waiting task is named by what is awaited ("Lab quotes"). Commercial terms, IP clauses, billing rules and background are neither tasks nor problems.

## 3. Dates

Every date in the source is one the client was given (the source is a plan, estimate or report the client has, or the user is about to send), so they go into `Dates` on milestones and tasks alike. A source the user says is only their own draft has no agreed dates yet: create the rows without `Dates` and keep the proposed dates in each row's first history line.

Exact dates as given. Fixed readings of vague ones: "mid-<month>" = the 15th; a bare month as an end = its last day, as a start = the 1st; a range plus a duration ("February to March, about a month") = starts at the range start, ends start + duration.

Starts: a task starts where the previous task of its milestone ends; the first task of the first milestone starts on the source date; the first task of a later milestone starts where the previous milestone ends. Work described as running alongside something starts with it. A milestone that "starts once X is done" starts at X's end, even if its heading gives a vaguer start. A milestone with tasks spans its tasks — from the first task's start to the last task's end; a heading that gives only an end ("until November 20") sets the end, the start still comes from the first task. A flat-list milestone follows the same rules as a task.

A milestone with no date in the source and none following from these rules is asked about in step 4, never invented. A task with no date stays without one — no question. Dates that came from a rule rather than the literal text are marked in the list ("Mar 15 — from 'mid-March'") so the user can correct them.

## 4. Confirm

Show: which source you used (email subject and date, or document name), the project and client, the milestones with their dates and, under each, its tasks with dates, then the problems. Ask for missing milestone dates in the same message. If the config has a `dashboard` line, also ask which claude.ai project the project's chats from the dashboard should open in — this conversation's project as the default when it is in one ("its chats will open in **<name>** — or another project's link, or none?"), else "a project's link, or none?". Wait for OK — this creates many rows, and a wrong assumption means a cleanup.

## 5. Create

First check `Active` for a project of this name. If one exists, an earlier attempt was interrupted: do not create a second. Fetch it; whatever of the page exists, finish it (below); then compare its `Schedule`, `Tasks` and `Problems` views with the confirmed list — in a new conversation, extract from the source again and confirm first — and create only what is missing.

Otherwise, in this order — the page comes before the rows, so an interrupted attempt can always be resumed through the project's own views:

1. The Projects row: `Status` Active, `Target end` = the end of the last milestone, empty if that one has no dates yet (without milestones: the end the source gives for the work, else empty — ongoing work has no end), `Source` = the source's URL if it is a shared web document, else empty; `Repository` only if the user gave one; `Claude project` as confirmed (`<name> — <project id>`), empty for none or when not asked.
2. The project page's views and tabs (below).
3. Milestones (new rows, `Project` = the row) with their `Dates` and `Order` 1, 2, … in the source's order.
4. Tasks (`Project` = the row, `Milestone` = its milestone, `Order` 1, 2, … within their milestone in the source's order).
5. Problems, `Opened` = the source date.
6. The status callout at the start of the page (`insert_content`, `position: {"type": "start"}`), now that the counts are known.
7. The project's description (SKILL.md → **Pages**): the source's own statement of what the project is or delivers, if it has one — a paragraph, never the plan itself.
8. A source without a URL (pasted text, an email, a local file) goes onto the project page as a sub-page `Mon D — Source: <subject or short description>` (Mon D = the source date), under `## Notes` or `## Private notes` by **Who sees what** (a source with prices the client was not given is private), as for long notes (`notes.md`), so the original plan stays with the project.

Reply with what was created, and remind the user to switch the `Plan` timeline and the Tasks tab's `Timeline` view to **Quarter** or **Month** once — the API cannot set the zoom; Notion remembers it. On the first project, also the helper-property hiding from `setup.md` step 8, now that there are pages to click it on.

## Project page

The project page **is the Projects row** — build into the row's body (`page_id` = row id). A separate page made with `notion-create-pages` would appear under the root and in the sidebar, while the Projects table opened an empty row.

Views — `notion-create-view` with `parent_page_id` = the project page, in this order (they are appended to the page as `<database …>` lines, in creation order; a `GROUP BY` view comes back with empty groups hidden, which is fine):

```
Plan       timeline  data source <milestones>  FILTER "Project" = "<page id>"; FILTER "Status" IN ("Planned", "In progress", "Paused", "Done"); TIMELINE BY "Dates"; SORT BY "Dates" ASC; SHOW "Name", "Status", "Late, days"
Tasks      table     data source <tasks>       FILTER "Project" = "<page id>"; FILTER "Status" IN ("Planned", "In progress", "Waiting", "Done"); GROUP BY "Milestone"; SORT BY "Order" ASC, "Dates" ASC; SHOW "Name", "Status", "Dates", "Waiting on", "Late, days"
Schedule   table     data source <milestones>  FILTER "Project" = "<page id>"; FILTER "Status" IN ("Planned", "In progress", "Paused", "Done"); SORT BY "Order" ASC, "Dates" ASC; SHOW "Name", "Status", "Dates", "Finished", "Late, days"
Problems   table     data source <problems>    FILTER "Project" = "<page id>"; FILTER "Status" IN ("Open", "Waiting"); SORT BY "Type" ASC; SHOW "Name", "Type", "Status", "Waiting on", "Milestone", "Task"
```

Then the Gantt as a second view of the `Tasks` block — `notion-create-view` with `database_id` = that block:

```
Timeline   timeline  data source <tasks>       FILTER "Project" = "<page id>"; FILTER "Status" IN ("Planned", "In progress", "Waiting", "Done"); TIMELINE BY "Dates"; GROUP BY "Milestone"; SORT BY "Dates" ASC; SHOW "Name", "Status", "Waiting on", "Late, days"
```

The table comes first because a timeline hides tasks without dates; the dashboard reads the view named `Tasks`. Notion orders the milestone groups itself; the rows inside follow `Order`. Create the block with the table (`notion-create-view`, `parent_page_id` = the project page), then add the timeline to the same block: `notion-create-view` with `database_id` = that block's id (from the page fetch, `<database url=…>`) — it becomes the block's second view.

Tabs — fetch the page, then `update_content` with `old_str` = the four `<database …>` lines, `new_str` = the same lines, unchanged, wrapped like this (an existing view's url moves it; it does not copy):

```
<tabs>
	<tab>
		Plan
		<database url="<plan block url>" inline="true" data-source-url="collection://<milestones>"></database>
	</tab>
	<tab>
		Tasks
		<database url="<tasks block url>" inline="true" data-source-url="collection://<tasks>"></database>
	</tab>
	<tab>
		Schedule
		<database url="<schedule block url>" inline="true" data-source-url="collection://<milestones>"></database>
	</tab>
	<tab>
		Problems
		<database url="<problems block url>" inline="true" data-source-url="collection://<problems>"></database>
	</tab>
</tabs>
```

Verify by fetch: the page's ancestor path goes through the Projects database; the body is the callout (once it is added), then one `<tabs>` block with the four tabs — Plan, Tasks, Schedule, Problems — no `icon=`, and after it only the parts of SKILL.md **Pages** (none yet on a new page, or the description and the source's sub-page). If a block came out in the wrong order, one `update_content` over both blocks puts them back. If the page already had some of this, keep it and add only what is missing — never a second callout, view or tabs block.

Filters on formula columns are dropped by the API, so `Schedule` lists every live milestone; `Late, days` is the column to scan. A project without milestones keeps the same tabs: its `Plan` is simply empty.
