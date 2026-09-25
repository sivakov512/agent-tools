# Setup — create or finish the tracker

One procedure for two cases: no tracker yet, and a setup that was interrupted halfway. Each step checks first and only adds what is missing, so running it again is always safe — and a second root page or a duplicate database is never created.

## 1. Root page

Find it as in SKILL.md (**Finding things**) — by the config toggle, whatever the page is called.

- Found → fetch it and each `<database>` on it; reuse what exists. If its databases do not match the schema below (for example an old tracker with `Current dates` / `Promised dates`), do not try to convert it: tell the user it was made by an older version and should be deleted or renamed, then set up anew.
- Not found → the page needs a name and a place. Take what the user already said; propose the rest in one short question — "I'll create **Project tracker** at the top level of the workspace — OK, or another name or place?" — and wait. Then `notion-create-pages` with that title, no icon, and as its only content the config toggle — collapsed, because the IDs are for the skill, not for reading:

  ```
  <details color="gray_bg">
  <summary>⚙️ **Config** — read by the `project-tracker` skill; edit if the databases move</summary>
  </details>
  ```

  Its summary line is how every later conversation finds the page, so it goes in with the page itself: an interrupted setup is found and finished instead of started over, and the user can rename or move the page at any time.

## 2. Databases

Create only the ones missing, titled exactly `Projects`, `Milestones`, `Issues`, with `notion-create-database`, `parent: {page_id: <root>}`, in this order — each references the ones before it. The `CREATE TABLE` / `ALTER` text is the schema definition these tools take, not a query.

```sql
-- Projects
CREATE TABLE ("Name" TITLE, "Client" RICH_TEXT,
  "Status" SELECT('Active':blue, 'Paused':yellow, 'Done':green, 'Removed':gray),
  "Summary" RICH_TEXT COMMENT 'One sentence: where we are, what is next',
  "Target end" DATE, "Repository" URL,
  "Source" URL COMMENT 'Where the project came from; empty for pasted text, email or a local file')

-- Milestones
CREATE TABLE ("Name" TITLE,
  "Project" RELATION('<projects>', DUAL 'Milestones'),
  "Phase" SELECT('General':gray),
  "Status" SELECT('Planned':gray, 'In progress':blue, 'Paused':yellow, 'Done':green, 'Dropped':brown),
  "Dates" DATE COMMENT 'Agreed with the client; drives the Gantt',
  "Finished" DATE COMMENT 'The day it was actually done')

-- Issues
CREATE TABLE ("Name" TITLE, "Project" RELATION('<projects>'),
  "Type" SELECT('Blocker':red, 'Risk':orange, 'Question':blue, 'Task':gray),
  "Status" SELECT('Open':red, 'Waiting':yellow, 'Resolved':green, 'Dropped':brown),
  "Waiting on" RICH_TEXT,
  "Milestone" RELATION('<milestones>') COMMENT 'Which plan item this affects, if any',
  "Note" RICH_TEXT, "Opened" DATE, "Resolved on" DATE)
```

Then the computed columns, with `notion-update-data-source` `statements`, one `ADD COLUMN` per call (formulas that reach into another database are rejected by the API, so the project's status comes in through a rollup):

```sql
-- on <milestones>
ADD COLUMN "Project status" ROLLUP('Project', 'Status', 'show_original');
ADD COLUMN "Late, days" FORMULA('if(prop("Status") == "Dropped" or empty(prop("Dates")), toNumber(""), if(prop("Status") == "Done", if(empty(prop("Finished")), toNumber(""), dateBetween(prop("Finished"), dateEnd(prop("Dates")), "days")), if(prop("Status") == "Paused" or format(prop("Project status")).contains("Paused"), toNumber(""), if(today() > dateEnd(prop("Dates")), dateBetween(today(), dateEnd(prop("Dates")), "days"), 0))))');
ADD COLUMN "Open late" FORMULA('if(prop("Status") == "Planned" or prop("Status") == "In progress", prop("Late, days"), toNumber(""))')

-- on <projects>
ADD COLUMN "Late, days" ROLLUP('Milestones', 'Open late', 'max')
```

The Milestones–Projects relation is two-way because the project's `Late, days` needs it; Issues point at projects one way only, so project pages do not grow another backlink list.

Existing databases from an interrupted setup: fetch each data source and add what is missing (`ADD COLUMN` as above).

Make every database inline so it renders on the page: `notion-update-data-source`, `is_inline: true`.

## 3. Config

The config toggle gets the three data source IDs as its lines:

```
<details color="gray_bg">
<summary>⚙️ **Config** — read by the `project-tracker` skill; edit if the databases move</summary>
	projects: `<projects>`
	milestones: `<milestones>`
	open_items: `<open_items>`
</details>
```

Add the missing lines with `update_content` — `old_str` from the fetch (for an empty toggle, the summary's end through `</details>`), lines indented one tab. Never a second toggle. A root page found by the user's link that has no config at all gets the toggle inserted at the start (`insert_content`, `position: {"type": "start"}`).

## 4. Views on the databases

Views live on the databases themselves; linked views on the root page would add "View of …" pages to the sidebar. Fetch each database for its views; rename the default view and create the rest, or fix the configuration of an existing one (`notion-update-view`, `CLEAR FILTER` first). Filters list the statuses to show rather than the ones to hide, so a status added later never leaks into a view.

```
Projects    Active             (default view)  FILTER "Status" IN ("Active", "Paused"); SHOW "Name", "Client", "Status", "Late, days", "Summary", "Target end", "Source"
Milestones  Next up            (default view)  FILTER "Status" IN ("Planned", "In progress", "Paused"); GROUP BY "Project"; SORT BY "Dates" ASC; SHOW "Name", "Status", "Dates", "Late, days"
            Timeline           timeline        FILTER "Status" IN ("Planned", "In progress", "Paused"); TIMELINE BY "Dates"; GROUP BY "Project"; SORT BY "Dates" ASC; SHOW "Name", "Status"
Issues      Waiting on         (default view)  FILTER "Status" IN ("Open", "Waiting"); GROUP BY "Waiting on"; SORT BY "Opened" ASC; SHOW "Name", "Project", "Type", "Status", "Opened"
            Recently resolved  table           FILTER "Status" = "Resolved"; SORT BY "Resolved on" DESC; SHOW "Name", "Project", "Type", "Resolved on", "Note"
```

## 5. Tabs

Unless the page already has its `<tabs>` block: fetch the root page and `update_content` with `old_str` = everything from the end of the config toggle (`</details>`) to the end of the page (the `<database>` lines), `new_str` = the same database lines wrapped in tabs. Passing an existing database's url moves it; it does not copy.

```
<tabs>
	<tab>
		Projects
		<database url="<projects db url>" inline="true" data-source-url="collection://<projects>">Projects</database>
	</tab>
	<tab>
		All plans
		<database url="<milestones db url>" inline="true" data-source-url="collection://<milestones>">Milestones</database>
	</tab>
	<tab>
		Issues
		<database url="<issues db url>" inline="true" data-source-url="collection://<open_items>">Issues</database>
	</tab>
</tabs>
```

## 6. Verify

Fetch the root page: the config toggle with its three IDs first, then one `<tabs>` block with three tabs — Projects, All plans, Issues — each holding exactly one inline database, no `icon=` on tabs, nothing after it. Notion sometimes puts a rewritten block above the toggle; if the order is wrong, one `update_content` over both blocks puts them back. Fetch each database: the columns and views above exist with those names.

## 7. Tell the user

What was created or added (or that everything was already in place), and the page's name — the user can rename or move it freely, it is found by the config toggle, which stays collapsed; open it only to fix the IDs. Then the things the API cannot do, as a short checklist to click through once:

- **Full width** on the tracker page (••• → Full width) — without it Notion folds each tab's second view (`Timeline`, `Recently resolved`) into a dropdown. Optional, recommended.
- **Hide helper properties**, once for the whole database: on any project page, click the `Milestones` property → *Always hide*; on any milestone page, the same for `Project status` and `Open late`. They exist only to compute lateness.
- On each project page, the `Plan` timeline zoom → **Quarter** (Notion remembers it per view).

Next step: a new project.
