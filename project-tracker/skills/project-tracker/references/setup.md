# Setup — create or finish the tracker

One procedure for two cases: no tracker yet, and a setup that was interrupted halfway. Each step checks first and only adds what is missing, so running it again is always safe — and a second root page or a duplicate database is never created.

## 1. Root page

Find it as in SKILL.md (**Finding things**) — by the config toggle, whatever the page is called.

- Found, made by this version (config lines `tasks` and `problems`) → fetch it and each `<database>` on it; reuse what exists.
- Found, made by version 0.x (config line `open_items`, no `tasks`) → this setup does not convert it: `upgrade.md` does — it creates its own new root page and runs steps 2–6 of this file on it. If the user only asked for setup, say that the old tracker exists and offer the upgrade.
- Found, but its databases match neither (for example an old tracker with `Current dates` / `Promised dates`) → do not try to convert it: tell the user it was made by an older version and should be deleted or renamed, then set up anew.
- Not found → the page needs a name and a place. Take what the user already said; propose the rest in one short question — "I'll create **Project tracker** at the top level of the workspace — OK, or another name or place?" — and wait. Then `notion-create-pages` with that title (top level of the workspace = no `parent`, which makes a private top-level page; under a page = `parent: {page_id}`; a teamspace's top level cannot be reached through the API — create it under a page there), no icon, and as its only content the config toggle — collapsed, because the IDs are for the skill, not for reading:

  ```
  <details color="gray_bg">
  <summary>⚙️ **Config** — read by the `project-tracker` skill; edit if the databases move</summary>
  </details>
  ```

  Its summary line is how every later conversation finds the page, so it goes in with the page itself: an interrupted setup is found and finished instead of started over, and the user can rename or move the page at any time.

## 2. Databases

Create only the ones missing, titled exactly `Projects`, `Milestones`, `Tasks`, `Problems`, with `notion-create-database`, `parent: {page_id: <root>}`, in this order — each references the ones before it. The `CREATE TABLE` / `ADD COLUMN` text is the schema definition these tools take, not a query; `<projects>` and the like stand for the bare data source UUID returned by the create call (no `collection://`).

```sql
-- Projects
CREATE TABLE ("Name" TITLE, "Client" RICH_TEXT,
  "Origin" SELECT('Upwork':green, 'Direct':blue, 'Personal':gray) COMMENT 'Where the work comes from; add options freely',
  "Status" SELECT('Active':blue, 'Paused':yellow, 'Done':green, 'Removed':gray),
  "Summary" RICH_TEXT COMMENT 'One sentence: where we are, what is next',
  "Target end" DATE, "Repository" URL,
  "Source" URL COMMENT 'Where the project came from; empty for pasted text, email or a local file',
  "Chat" URL COMMENT 'Its Claude chat, opened from the dashboard; set by Claude',
  "Claude project" RICH_TEXT COMMENT 'The claude.ai project its dashboard chats open in: <name> — <project id>; empty = none')

-- Milestones
CREATE TABLE ("Name" TITLE,
  "Project" RELATION('<projects>', DUAL 'Milestones'),
  "Status" SELECT('Planned':gray, 'In progress':blue, 'Paused':yellow, 'Done':green, 'Dropped':brown),
  "Dates" DATE COMMENT 'Agreed with the client; drives the Gantt',
  "Finished" DATE COMMENT 'The day it was actually done',
  "Order" NUMBER COMMENT 'Position in the plan (1, 2, …), so the order holds without dates; set by Claude',
  "Chat" URL COMMENT 'Its Claude chat, opened from the dashboard; set by Claude')

-- Tasks
CREATE TABLE ("Name" TITLE,
  "Project" RELATION('<projects>', DUAL 'Tasks'),
  "Milestone" RELATION('<milestones>', DUAL 'Tasks'),
  "Status" SELECT('Planned':gray, 'In progress':blue, 'Waiting':yellow, 'Done':green, 'Dropped':brown),
  "Dates" DATE COMMENT 'Agreed with the client, like milestone dates; empty for steps planned only for myself',
  "Waiting on" RICH_TEXT COMMENT 'Who has to act; empty = on me',
  "Finished" DATE COMMENT 'The day it was actually done',
  "Order" NUMBER COMMENT 'Position in the plan (1, 2, …), so the order holds without dates; set by Claude',
  "Chat" URL COMMENT 'Its Claude chat, opened from the dashboard; set by Claude')

-- Problems
CREATE TABLE ("Name" TITLE, "Project" RELATION('<projects>'),
  "Type" SELECT('Blocker':red, 'Risk':orange, 'Question':blue),
  "Status" SELECT('Open':red, 'Waiting':yellow, 'Resolved':green, 'Dropped':brown),
  "Waiting on" RICH_TEXT,
  "Milestone" RELATION('<milestones>') COMMENT 'Which milestone this affects, if any',
  "Task" RELATION('<tasks>') COMMENT 'Which task this affects, if any',
  "Note" RICH_TEXT, "Opened" DATE, "Resolved on" DATE,
  "Chat" URL COMMENT 'Its Claude chat, opened from the dashboard; set by Claude')
```

Then the computed columns, with `notion-update-data-source` `statements`, one `ADD COLUMN` per call (without the trailing `;`), in this order (formulas that reach into another database are rejected by the API, so statuses from other databases come in through rollups):

```sql
-- on <milestones>
ADD COLUMN "Project status" ROLLUP('Project', 'Status', 'show_original');
ADD COLUMN "Late, days" FORMULA('if(prop("Status") == "Dropped" or empty(prop("Dates")), toNumber(""), if(prop("Status") == "Done", if(empty(prop("Finished")), toNumber(""), dateBetween(prop("Finished"), dateEnd(prop("Dates")), "days")), if(prop("Status") == "Paused" or format(prop("Project status")).contains("Paused"), toNumber(""), if(today() > dateEnd(prop("Dates")), dateBetween(today(), dateEnd(prop("Dates")), "days"), 0))))');
ADD COLUMN "Open late" FORMULA('if(prop("Status") == "Planned" or prop("Status") == "In progress", prop("Late, days"), toNumber(""))')

-- on <tasks>
ADD COLUMN "Project status" ROLLUP('Project', 'Status', 'show_original');
ADD COLUMN "Milestone status" ROLLUP('Milestone', 'Status', 'show_original');
ADD COLUMN "Late, days" FORMULA('if(prop("Status") == "Dropped" or empty(prop("Dates")), toNumber(""), if(prop("Status") == "Done", if(empty(prop("Finished")), toNumber(""), dateBetween(prop("Finished"), dateEnd(prop("Dates")), "days")), if(format(prop("Milestone status")).contains("Paused") or format(prop("Project status")).contains("Paused"), toNumber(""), if(today() > dateEnd(prop("Dates")), dateBetween(today(), dateEnd(prop("Dates")), "days"), 0))))');
ADD COLUMN "Open late" FORMULA('if(prop("Status") == "Planned" or prop("Status") == "In progress" or prop("Status") == "Waiting", prop("Late, days"), toNumber(""))')

-- on <projects>
ADD COLUMN "Milestones late" ROLLUP('Milestones', 'Open late', 'max');
ADD COLUMN "Tasks late" ROLLUP('Tasks', 'Open late', 'max');
ADD COLUMN "Late, days" FORMULA('if(empty(prop("Milestones late")) and empty(prop("Tasks late")), toNumber(""), max(if(empty(prop("Milestones late")), 0, prop("Milestones late")), if(empty(prop("Tasks late")), 0, prop("Tasks late"))))')
```

Projects ↔ Milestones, Projects ↔ Tasks and Milestones ↔ Tasks are two-way because the project's `Late, days` and the milestone page's task list need the reverse side; Problems point at projects, milestones and tasks one way only, so pages do not grow another backlink list.

Existing databases (an interrupted setup, or a pre-release 1.0 tracker): fetch each data source and add what is missing — the computed columns as above, and these plain columns: `Origin`, `Chat` and `Claude project`, which only pre-release 1.0 trackers lack, and `Order`, which schema 1 lacks (one call per data source, statements joined by `;`):

```sql
-- on <projects>
ADD COLUMN "Origin" SELECT('Upwork':green, 'Direct':blue, 'Personal':gray) COMMENT 'Where the work comes from; add options freely';
ADD COLUMN "Chat" URL COMMENT 'Its Claude chat, opened from the dashboard; set by Claude';
ADD COLUMN "Claude project" RICH_TEXT COMMENT 'The claude.ai project its dashboard chats open in: <name> — <project id>; empty = none'

-- on <milestones>, <tasks>, <problems>, each
ADD COLUMN "Chat" URL COMMENT 'Its Claude chat, opened from the dashboard; set by Claude'

-- on <milestones>, <tasks>, each
ADD COLUMN "Order" NUMBER COMMENT 'Position in the plan (1, 2, …), so the order holds without dates; set by Claude'
```

A tracker that already has rows and lacks `Order` is brought up by **Tracker update** (after step 8), which also numbers the rows.

Make every database inline so it renders on the page: `notion-update-data-source`, `is_inline: true`.

**Page layouts** — `notion-update-data-source` with `page_layout` (a whole layout per call; on an existing data source fetch first and skip it if its `<page-layout>` already matches — a new one has none; Problems keeps the default layout):

```
<projects>    {"main":[{"type":"cover"},{"type":"title"},{"type":"properties"},{"type":"editor"},{"type":"discussions"}],"format":{"pageFullWidth":true}}
<milestones>  {"main":[{"type":"cover"},{"type":"title","pinnedProperties":["Status"]},{"type":"properties"},{"type":"views","relation":"Tasks"},{"type":"editor"},{"type":"discussions"}],"format":{"pageFullWidth":true}}
<tasks>       {"main":[{"type":"cover"},{"type":"title","pinnedProperties":["Status"]},{"type":"properties"},{"type":"editor"},{"type":"discussions"}],"format":{"pageFullWidth":true}}
```

Project, milestone and task pages then open at full width, and a milestone page shows its tasks above its history. Only a select can be pinned (a date is rejected); a layout the API rejects is not worth a retry in another form — leave the default layout and mention it.

## 3. Config

The config toggle gets the four data source IDs and the structure's version, `schema` (**Tracker update** says what it means), as its lines:

```
<details color="gray_bg">
<summary>⚙️ **Config** — read by the `project-tracker` skill; edit if the databases move</summary>
	projects: `<projects>`
	milestones: `<milestones>`
	tasks: `<tasks>`
	problems: `<problems>`
	schema: 2
</details>
```

Add the missing lines with `update_content` — `old_str` from the fetch (for an empty toggle, `</summary>\n</details>`), lines indented one tab. Never a second toggle. `schema: 2` goes in only on a tracker with no rows yet (Projects' `Active` and `Closed` views, as far as they exist, list nothing — every other row belongs to a project): a new tracker, or an interrupted setup that never got a project. If rows exist and the line is missing or lower, run **Tracker update**, which writes it last. A root page found by the user's link that has no config at all gets the toggle inserted at the start (`insert_content`, `position: {"type": "start"}`).

## 4. Views on the databases

Views live on the databases themselves; linked views on the root page would add "View of …" pages to the sidebar. Fetch each database for its views. A new database comes with one view, "Default view", and it is the one the database opens on: it becomes the view marked "(default view)" below — rename and configure it with `notion-update-view`, never create that view anew (it would land after the others, and the database would open on another one). Create the rest with `notion-create-view` (`database_id` + `data_source_id`), in the order listed; fix an existing one with `notion-update-view`, `CLEAR FILTER; CLEAR SORT` first, then its whole configuration below. On an existing database whose first view is not the "(default view)" one, create the missing view and add "drag `<view>` to the first place" to the checklist in step 8. `TIMELINE BY "Dates"` with one date-range property is valid. Filters list the statuses to show rather than the ones to hide, so a status added later never leaks into a view.

```
Projects    Active             (default view)  FILTER "Status" IN ("Active", "Paused"); SHOW "Name", "Client", "Origin", "Status", "Late, days", "Summary", "Target end", "Source"
            Closed             table           FILTER "Status" IN ("Done", "Removed"); SORT BY "Target end" DESC; SHOW "Name", "Client", "Origin", "Status", "Target end", "Source"
Milestones  Next up            (default view)  FILTER "Status" IN ("Planned", "In progress", "Paused"); GROUP BY "Project"; SORT BY "Order" ASC, "Dates" ASC; SHOW "Name", "Status", "Dates", "Late, days"
            Timeline           timeline        FILTER "Status" IN ("Planned", "In progress", "Paused"); TIMELINE BY "Dates"; GROUP BY "Project"; SORT BY "Dates" ASC; SHOW "Name", "Status"
Tasks       All                (default view)  FILTER "Status" IN ("Planned", "In progress", "Waiting"); GROUP BY "Project"; SORT BY "Dates" ASC, "Order" ASC; SHOW "Name", "Milestone", "Status", "Dates", "Waiting on", "Late, days"
            Waiting on         table           FILTER "Status" = "Waiting"; GROUP BY "Waiting on"; SORT BY "Dates" ASC; SHOW "Name", "Project", "Milestone", "Dates"
            Timeline           timeline        FILTER "Status" IN ("Planned", "In progress", "Waiting"); TIMELINE BY "Dates"; GROUP BY "Project"; SORT BY "Dates" ASC; SHOW "Name", "Status"
Problems    Open               (default view)  FILTER "Status" IN ("Open", "Waiting"); GROUP BY "Type"; SORT BY "Opened" ASC; SHOW "Name", "Project", "Status", "Waiting on", "Opened"
            Recently resolved  table           FILTER "Status" = "Resolved"; SORT BY "Resolved on" DESC; SHOW "Name", "Project", "Type", "Resolved on", "Note"
```

Tasks `All` sorts by `Dates` first: `Order` restarts per milestone, so across a project it only breaks ties. The view DSL takes only fixed dates, so `Recently resolved` gets its "past month" window by hand (checklist below); until then it lists every resolved problem, newest first.

## 5. Tabs

Unless the page already has its `<tabs>` block: fetch the root page and `update_content` with `old_str` = the `<database>` lines after the config toggle, as fetched (from the line after `</details>` to the end of the page), `new_str` = the same database lines wrapped in tabs. Passing an existing database's url moves it; it does not copy.

```
<tabs>
	<tab>
		Projects
		<database url="<projects db url>" inline="true" data-source-url="collection://<projects>">Projects</database>
	</tab>
	<tab>
		Milestones
		<database url="<milestones db url>" inline="true" data-source-url="collection://<milestones>">Milestones</database>
	</tab>
	<tab>
		Tasks
		<database url="<tasks db url>" inline="true" data-source-url="collection://<tasks>">Tasks</database>
	</tab>
	<tab>
		Problems
		<database url="<problems db url>" inline="true" data-source-url="collection://<problems>">Problems</database>
	</tab>
</tabs>
```

## 6. Verify

Fetch the root page: the config toggle with its four IDs first, then one `<tabs>` block with four tabs — Projects, Milestones, Tasks, Problems — each holding exactly one inline database, no `icon=` on tabs, nothing after it. Notion sometimes puts a rewritten block above the toggle; if the order is wrong, one `update_content` over both blocks puts them back. Fetch each database: the columns, views and page layouts above exist with those names.

## 7. Dashboard

Unless the config already has a `dashboard` line: publish the dashboard as `references/dashboard.md` says and add the line.

## 8. Tell the user

What was created or added (or that everything was already in place), the dashboard (its link, or where the file is), and the page's name — the user can rename or move it freely, it is found by the config toggle, which stays collapsed; open it only to fix the IDs. Then the things the API cannot do, as a short checklist to click through once:

- **Recently resolved**: Problems tab → `Recently resolved` → Filter → `Resolved on` → *is within* → *Past month*, so the view stays short.
- **Full width** on the tracker page itself (••• → Full width) — without it Notion folds each tab's second view (`Closed`, `Timeline`, `Recently resolved`) into a dropdown. Project, milestone and task pages are already full width.
- After the first project exists — **hide properties**, once for the whole database (the API cannot set property visibility): on any project page, click `Milestones`, `Tasks`, `Milestones late`, `Tasks late` → *Always hide*, and `Chat`, `Claude project` → *Hide when empty*; on any milestone page, `Project status`, `Open late` and `Order` → *Always hide*, `Chat` → *Hide when empty*; on any task page, `Project status`, `Milestone status`, `Open late` and `Order` → *Always hide*, `Chat` → *Hide when empty*; on any problem page, `Chat` → *Hide when empty*. The helpers exist only to compute lateness, and `Order` shows in the sorting; `Chat` and `Claude project` are set later, from the dashboard and on request. (new-project.md repeats this, and the timeline zoom, when it creates the first project.)

Next step: a new project.

## Tracker update (not part of setup)

Not a numbered step, so a setup run from the top never reaches it: SKILL.md (**Finding things**) starts it, or step 3 on a tracker that has rows.

The config's `schema` is the structure the tracker was built with; no `schema` line is schema 1 (the tracker as release 1.0.0 built it). This skill works with schema **2**. A tracker below it is brought up by the skill itself, in the first conversation that finds it, before the request — installing the newer plugin is the user's go for it; one short line says what was done, then the request is answered. An unfinished setup (a database ID missing from the config) is finished by setup instead, whose step 3 decides whether this update runs. Each step checks before it writes, so an interrupted update is simply run again. If a step fails, stop the update, say in one line what failed, and handle the request without writing `Order` — views and the dashboard fall back to `Dates`; the next conversation tries again.

**1 → 2: `Order`.**
1. Milestones and Tasks get `Order` (`ADD COLUMN` as in step 2, skipped where it exists).
2. Number the rows of every project in `Active`, `Closed` too: milestones 1, 2, … per project; tasks within each milestone, and a project's tasks without a milestone among themselves. A body's `Contract milestone N` sets N. Otherwise by `Dates`; undated rows after the dated ones, in the order history states, else as the views list them (named in the closing line, so the user can reorder — the update never waits on a question). Rows that already have `Order` keep it.
3. Views sort by it (`notion-update-view`; the filters stay): root `Next up` and every project's `Schedule` and `Tasks` (the table) → `CLEAR SORT; SORT BY "Order" ASC, "Dates" ASC`; root Tasks `All` → `CLEAR SORT; SORT BY "Dates" ASC, "Order" ASC` (step 4 says why).
4. Write `schema: 2` in the config toggle (the line replaced, or added as its last line, tab-indented) — last, so an interrupted update is found again.

A future step goes here as **2 → 3**, and the number above moves with it.
