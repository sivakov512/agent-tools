# Setup — create or finish the tracker

One procedure for two cases: no tracker yet, and a setup that was interrupted halfway. Each step checks first and only adds what is missing, so running it again is always safe — and a second root page or a duplicate database is never created.

## 1. Root page

`notion-search` for "Project tracker".

- Found → fetch it and each `<database>` on it; reuse what exists. If its databases do not match the schema below (for example an old tracker with `Current dates` / `Promised dates`), do not try to convert it: tell the user it was made by an older version and should be deleted or renamed, then set up anew.
- Not found → ask where to put it (a parent page, or top level) if the user has not said, then `notion-create-pages` with the title `Project tracker`, no icon, no content.

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

## 3. Config callout

At the start of the root page (`insert_content`, `position: {"type": "start"}`), unless it is there:

```
<callout icon="⚙️" color="gray_bg">
	**Config** — read by the `project-tracker` skill; edit if the databases move
	projects: `<projects>`
	milestones: `<milestones>`
	open_items: `<open_items>`
</callout>
```

If the callout exists but lacks an ID, edit that callout (`update_content`) rather than adding another.

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

Unless the page already has its `<tabs>` block: fetch the root page and `update_content` with `old_str` = everything from the end of the config callout to the end of the page (the `<database>` lines), `new_str` = the same database lines wrapped in tabs. Passing an existing database's url moves it; it does not copy.

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

Fetch the root page: the config callout with three IDs first, then one `<tabs>` block with three tabs — Projects, All plans, Issues — each holding exactly one inline database, no `icon=` on tabs, nothing after it. Notion sometimes puts a rewritten block above the callout; if the order is wrong, one `update_content` over both blocks puts them back. Fetch each database: the columns and views above exist with those names.

## 7. Tell the user

What was created or added (or that everything was already in place). Then the things the API cannot do, as a short checklist to click through once:

- **Full width** on the Project tracker page (••• → Full width) — without it Notion folds each tab's second view (`Timeline`, `Recently resolved`) into a dropdown. Optional, recommended.
- **Hide helper properties**, once for the whole database: on any project page, click the `Milestones` property → *Always hide*; on any milestone page, the same for `Project status` and `Open late`. They exist only to compute lateness.
- On each project page, the `Plan` timeline zoom → **Quarter** (Notion remembers it per view).

Next step: a new project.
