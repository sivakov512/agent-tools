# Upgrade — older trackers

Everything that exists only for trackers made by older versions lives here: the **Tracker update**, which brings a current tracker's structure up to this skill's `schema` in place; the **Old shapes** a mode still meets on pages; and **A tracker made by 0.x**, copied to a new one.

Started by SKILL.md → **Finding things** (a `schema` below the skill's, a 0.x tracker), by a mode that meets an old shape, or by the user asking to upgrade or migrate the tracker.

**Inputs:** the config, the databases and the pages the step at hand names.

## Tracker update

SKILL.md (**Finding things**) starts it, or `references/setup.md` §3 on a tracker that has rows.

The config's `schema` is the structure the tracker was built with; no `schema` line is schema 1 (the tracker as release 1.0.0 built it). This skill works with schema **7**. A tracker below it is brought up before the request, as SKILL.md → **Finding things** says; one short line says what was done, then the request is answered. An unfinished setup (a database ID missing from the config) is finished by setup instead, whose `references/setup.md` §3 decides whether this update runs. Each step checks before it writes, so an interrupted update is simply run again: a column is added only where the data source's schema, fetched first, lacks it — Notion refuses a second column of the same name, and the one already there (a column the user added or restored, or an interrupted run's) may hold values that must stay. Each step ends by writing its own number in the config toggle (`schema: 2` after 1 → 2, `schema: 3` after 2 → 3, …) as its last write: the number then says exactly which steps are done, so after a step that failed the next conversation resumes at that step, and a step is never taken as done before it is. The numbers are for failures, never a place to stop: steps run in order, all of them before the request is answered (a schema-1 tracker gets 1 → 2, 2 → 3, 3 → 4, 4 → 5, 5 → 6, then 6 → 7, in one go); only a step that fails stops it. If a step fails, stop the update, say in one line what failed, and handle the request without what the update adds — rows without `Order` (views and the dashboard fall back to `Dates`), no client dashboards, pages written as they are laid out; the next conversation tries again.

**Columns older trackers lack.** Fetch each data source and add the plain columns that are missing — `Origin`, `Chat` and `Claude project`, which only pre-release 1.0 trackers lack, `Order`, which schema 1 lacks, `Client dashboard`, which schema 2 lacks, `Ref`, which schema 4 lacks, and `Code session` and `Code folder`, which schema 5 lacks (one call per data source, statements joined by `;`):

```sql
-- on <projects>
ADD COLUMN "Origin" SELECT('Upwork':green, 'Direct':blue, 'Personal':gray) COMMENT 'Where the work comes from; add options freely';
ADD COLUMN "Chat" URL COMMENT 'Its Claude chat, opened from the dashboard; set by Claude';
ADD COLUMN "Claude project" RICH_TEXT COMMENT 'The claude.ai project its dashboard chats open in: <name> — <project id>; empty = none'

-- on <milestones>, <tasks>, <problems>, each
ADD COLUMN "Chat" URL COMMENT 'Its Claude chat, opened from the dashboard; set by Claude'

-- on <milestones>, <tasks>, each
ADD COLUMN "Order" NUMBER COMMENT 'Position in the plan (1, 2, …), so the order holds without dates; set by Claude'

-- on <projects>
ADD COLUMN "Client dashboard" URL COMMENT 'The client dashboard that shows it; set by Claude'

-- on each, with its own prefix (`references/setup.md` §2 → `Ref` prefixes): PRJ <projects>, MLS <milestones>, TSK <tasks>, PRB <problems>
ADD COLUMN "Ref" UNIQUE_ID PREFIX 'TSK' COMMENT 'Its ID, to name it in a chat (TSK-34); numbered by Notion'

-- on <projects>, <milestones>, <tasks>, <problems>, each
ADD COLUMN "Code session" URL COMMENT 'Its Claude Code session on the Mac, opened from the dashboard; set by Claude'

-- on <projects>
ADD COLUMN "Code folder" RICH_TEXT COMMENT 'The folder on the Mac its Code sessions open in (an absolute path); set by its first Code session or on request'
```

A tracker that already has rows and lacks `Order`, `Client dashboard` or `Ref` is brought up by the schema steps below, which also number the rows.

**1 → 2: `Order`.**
1. Milestones and Tasks get `Order` (`ADD COLUMN` as in **Columns older trackers lack**, skipped where it exists).
2. Number the rows of every project in `Active`, `Closed` too: milestones 1, 2, … per project; tasks within each milestone, and a project's tasks without a milestone among themselves. A body's `Contract milestone N` sets N. Otherwise by `Dates`; undated rows after the dated ones, in the order history states, else as the views list them (named in the closing line, so the user can reorder — the update never waits on a question). Rows that already have `Order` keep it.
3. Views sort by it (`notion-update-view`; the filters stay): root `Next up` and every project's `Schedule` and `Tasks` (the table) → `CLEAR SORT; SORT BY "Order" ASC, "Dates" ASC`; root Tasks `All` → `CLEAR SORT; SORT BY "Dates" ASC, "Order" ASC` (`references/setup.md` §4 says why).
4. Write `schema: 2` in the config toggle (the line replaced, or added as its last line — SKILL.md → **Page text**) — the step's last write.

**2 → 3: `Client dashboard`.**
1. Projects get `Client dashboard` (`ADD COLUMN` as in **Columns older trackers lack**, skipped where it exists). Nothing to fill: it is set when a client dashboard is made (`references/client-dashboards.md`).
2. Write `schema: 3` in the config toggle, as above — last.

The closing line names what is new for the user: client dashboards, and that `Client dashboard` is best set to *Hide when empty* on a project page (the API cannot).

**3 → 4: pages in parts.** SKILL.md (**Pages**) lays every page out as a description, `## Notes`, `## Private notes` and `## History`; before, a row's notes and history were told apart only by how a line looked, a project's notes lived in a `Notes` tab, and a problem kept its changes in `Note`. The update moves what is there into the parts by its form and decides nothing about privacy: a client dashboard published before it is checked before its next refresh (`references/client-dashboards.md` → **Keeping it current**), and one made later is checked when it is made.
1. Problems: `RENAME COLUMN "Note" TO "Summary"` (skipped where `Summary` exists; views follow the rename). Values stay as they are — older ones may hold several parts joined by ` · `; they are not split into history lines, which would need dates nobody wrote down.
2. Lay out every milestone, task and problem page with a body: the milestones and tasks of every project in `Active` and `Closed` (its `Schedule` and `Tasks` views), and the problems in root `Open` and `Recently resolved`. Fetch the page; a page that already has one of the three headings, or no body, is skipped. Its blocks, read top to bottom:
   - a dated list line (`- **Oct 6** — …`) is history;
   - a dated paragraph (`**Oct 2** — …`), a sub-page (`<page …>`) or a file is a note;
   - any other block belongs with the dated entry above it (a note's own continuation), and before the first dated entry it is the description.

   Already in that order (the usual case — notes were written above the history): one `update_content` with two `content_updates` — the first note → `## Notes`, a newline, that note; the first history line → `## History`, a newline, that line. Out of order (a note below a history line): the same call also moves each such note — its block → empty, and the first history line's replacement gets the notes in front of `## History`. Nothing is rewritten or dropped, only headed and moved; fetch the page after the call and check.
3. Every project page in `Active` and `Closed` whose tabs still hold `Notes`: its entries (below the gray placeholder line) move under the tabs, and the tab goes — one `update_content` with `old_str` from the `Notes` tab's `<tab>` line through `</tabs>`, as fetched, and `new_str` `</tabs>` followed by the parts, without the tabs' indentation: the lines that record the project's own state (`Paused`, `Done`, `Active`, `Removed`, `Target end` lines) as history lines (`- ` added) under `## History`, `Client side:` lines under `## Private notes`, everything else, sub-pages included, under `## Notes`, each in its old order. A tab with no entries just goes.
4. A Dropped row, or a row of a Removed project, is in no view: its page is laid out the same way the first time anything is written to it.
5. Write `schema: 4` in the config toggle, as above — last.

The closing line names what is new for the user: every page — project, milestone, task, problem — can have a description and a checklist (they ask: "add a checklist to the layout task: …"), then Notes, Private notes and History; a client dashboard shows all of it but Private notes; the user's own dashboard needs its update to show the parts (the offer follows).

**4 → 5: `Ref`, an ID per row.**
1. Fetch each data source; each one whose schema has no `Ref` gets it (`ADD COLUMN` as in **Columns older trackers lack**) with its prefix and, when that one is in use, the next of its chain (`references/setup.md` §2, `Ref` prefixes). Where `Ref` already exists (a column the user added or restored), it stays as it is — 6 → 7 renames its prefix — and its prefix is read from one row's page fetch (`"Ref":"TSK-3"`). Notion numbers the rows that exist itself, in no set order; nothing is written to them.
2. Write `ref_prefixes: <projects>, <milestones>, <tasks>, <problems>` in the config toggle (the line replaced, or added before `schema`): the prefixes in use. Views give `Ref` as the bare number, so this line is what puts `TSK-` in front of it on the dashboard and what an ID the user writes is matched against.
3. The root views show it right after `Name` (`notion-update-view`, the `SHOW` lines of `references/setup.md` §4); the project pages' views stay as they are — their rows carry `Ref` all the same.
4. Write `schema: 5` in the config toggle, as above — last.

The closing line names what is new for the user: every project, milestone, task and problem has an ID — next to its name on the dashboard and in Notion — to name it in a chat ("link PRB-5 to TSK-34", "TSK-34 is done"); and, when a prefix other than `PRJ` / `MLS` / `TSK` / `PRB` was taken, which and why (a deleted `Ref` that holds the usual one can be restored from the database's Properties → deleted properties, with its old numbers).

**5 → 6: Code sessions.** A row gets a Claude Code session on the Mac beside its chat (`references/chats.md`).
1. Fetch each data source; add `Code session` to each of the four and `Code folder` to Projects where they are missing (`ADD COLUMN` as in **Columns older trackers lack**). Nothing to fill: a Code session writes its own link when the dashboard starts it, and a project's first one fills `Code folder`. The views stay as they are — a view returns every property, whatever it shows.
2. Write `schema: 6` in the config toggle, as above — last.

The closing line names what is new for the user: a Code session on the Mac for any project, milestone, task or problem, next to its chat, from the dashboard once it is updated (the offer follows); and that `Code session` and `Code folder` are best set to *Hide when empty* on the pages (`references/setup.md` §8 — the API cannot).

**6 → 7: three-letter IDs.** The `Ref` prefixes become `PRJ` / `MLS` / `TSK` / `PRB` (`references/setup.md` §2), since `PR` reads as a pull request and `PR` and `PB` were confused; the numbers stay, so `TK-17` becomes `TSK-17`.
1. The prefixes in use are the config's `ref_prefixes` (no such line: `PR, MS, TK, PB`).
2. Each database whose prefix is not its new one, nor one of that one's chain (`PRJ2`, `PRJ3`, … — taken earlier when it was in use), gets `ALTER COLUMN "Ref" SET UNIQUE_ID PREFIX '<new>'` (`notion-update-data-source`): Notion keeps every row's number and frees the old prefix. `Unique ID prefix is already in use` → the next of the chain, as setup says. Nothing is written to the rows.
3. Write `ref_prefixes: <the prefixes now in use>` and `ref_prefixes_before: <the ones step 1 read>` in the config toggle (each line replaced, or added before `schema`), then `schema: 7` — last.

The closing line names what is new for the user, both halves of it: every ID has three letters now (`TK-17` is `TSK-17`, the number stays), and the old IDs still work in a chat — the user has the old ones in notes and messages, and without this half would take them for broken; and, when a prefix other than `PRJ` / `MLS` / `TSK` / `PRB` was taken, which and why.

A future step goes here as **7 → 8**, and the number above moves with it.

## Old shapes

What older versions left on pages and configs that are never converted in place; the modes that meet them point here.

- **An ID with an older prefix** — one of the config's `ref_prefixes_before`, in its place (projects, milestones, tasks, problems) — names the row with the same number in the same database: `TK-17` is `TSK-17`. Replies name it by its current ID.
- **A status callout** on a project page (`**Now:** …`): the first time you write to that project, remove it (`update_content`, `old_str` = the whole callout as fetched, `new_str` empty) and say so in the reply.
- **A `Client sees` note in the dated form** (`**Oct 8** — Client sees: …`) is read the same as `**Client sees** — …` (`references/client-dashboards.md` → **What a client may see**).
- **A published `data.js` without any `page` key** was made when the client dashboard showed no page content: before this first refresh with pages, run `references/client-dashboards.md` → **Make one** step 2 on every covered page and refresh only after the user has answered — until then it keeps showing the previous state, and the reply says so.
- **Removal lines**: `Removed (was X)` on older pages is read as `Dropped (was X)`; a problem removed before schema 4 has it as ` · removed (was X)` at the end of `Summary` — on a restore that suffix goes.
- **Databases that match neither this version nor 0.x** (for example an old tracker with `Current dates` / `Promised dates`): do not try to convert them — tell the user the tracker was made by an older version and should be deleted or renamed, then set up anew (`references/setup.md`).

## A tracker made by 0.x

Version 0.x had three databases — Projects, Milestones (with a `Phase` select) and Issues (`Blocker / Risk / Question / Task`, config key `open_items`). This version adds Tasks and turns Issues into Problems. The old tracker is not converted in place: a new tracker is set up next to it, the live data is copied over by fixed rules, and the old page is retired but kept — it stays the backup. The procedure is deterministic, so running it twice on the same old tracker gives the same rows, and an interrupted run is finished, not repeated.

### 1. Read the old tracker

From its config: the `projects`, `milestones`, `open_items` data sources. Read through views only:

- Projects `Active` (Active and Paused) — the projects to move. Done and Removed projects stay in the old tracker; say so in the preview.
- Per project, from its page: the callout, the `Notes` tab (lines and `<page>` sub-pages), the `Schedule` view (every milestone but Dropped) and the `Open items` view; the root Issues `Recently resolved` view for its resolved issues.
- The page body of every milestone and issue that moves, and every Notes sub-page.

Dropped milestones and issues, and Removed projects, do not move.

### 2. Map — the fixed rules

**Projects**: every field as is (`Name`, `Client`, `Status`, `Summary`, `Target end`, `Repository`, `Source`); `Origin` from the old rule — `Source` on upwork.com → Upwork, empty `Client` → Personal, else Direct; `Chat`, `Code session`, `Claude project` and `Code folder` empty (set later — `references/chats.md`).

**Milestones**, by the project's phases:

- `Order`: milestones 1, 2, … per project; tasks 1, 2, … within each milestone (a project's tasks without a milestone among themselves), in the old tracker's order: by `Dates`, then as the old `Schedule` view lists them; phases in the order of their first milestone; issues that become tasks after the tasks they join.
- All milestones in one phase (`General` or any single phase) → they stay milestones, one to one: `Name`, `Status`, `Dates`, `Finished`, body.
- Several phases → each phase becomes a milestone named after it, and the milestones of that phase become its tasks, one to one (`Name`, `Status`, `Dates`, `Finished`, body; Paused → Planned with a history line `Was Paused in the 0.x tracker`). A phase that holds a single milestone with the phase's own name stays that one milestone, without a task.
  - The phase milestone's `Dates` run from its first task's start to its last task's end; with no dated task, none.
  - Its `Status`: every task Done → Done, `Finished` = the latest task `Finished`; any task In progress or Done → In progress; else Planned.
  - Its body: one line `- **<today>** — Was the phase "<phase>" in the 0.x tracker; its milestones are now its tasks.`

**Issues**:

- `Task` → a task of the same project, under the milestone (or the task's new milestone, if its old milestone became a task) the issue was linked to. `Open` → Planned; `Waiting` → Waiting, `Waiting on` kept; `Resolved` → Done, `Finished` = `Resolved on`. No `Dates`.
- `Blocker`, `Risk`, `Question` → a problem of the same type: `Status`, `Waiting on`, `Opened`, `Resolved on` as is, `Note` into `Summary` as is; `Milestone` = the new milestone; `Task` = the new task, if the old milestone it was linked to became a task.
- An issue's `Note` → history lines of the new task (problems keep theirs, in `Summary`): split at ` · `, each part a line `- **<date>** — <part>`, where the date is the `YYYY-MM-DD:` the part starts with (removed from the text) or else `Opened`; oldest first.

**Bodies**: every history and page body is copied verbatim, as fetched, laid out in the parts of SKILL.md **Pages** by the rule of **Tracker update** (3 → 4, step 2), then one history line is added at the end: `- **<today>** — Moved from the 0.x tracker.` (for a milestone that became a task: `… was a milestone of the phase "<phase>"`). Mentions of old pages (`<mention-page url="…">`) are rewritten to the new page of the same row once that page exists — write the body as it was, then fix the mention with `update_content` after the target row is created; mentions of pages that did not move stay.

**Notes tab**: its lines and sub-pages become the new project page's notes, in the old tab's order — short lines copied as they are under `## Notes`, each sub-page re-created under the new project page with the same title and its body copied verbatim, then placed as `references/notes.md` describes; a line or sub-page that **Who sees what** keeps private goes under `## Private notes` instead. A paused, done or removed line becomes a history line. Lines the upgrade itself adds come last.

**Callout**: not carried over — this version keeps no status callout; an `On hold` reason in the old callout becomes the pause line in that milestone's history (`- **<date it was paused, else the upgrade day>** — Paused (was In progress): <reason>.`).

### 3. Preview

Show, per project: the milestones with their tasks (dates, status), the problems, what is not moved (Dropped, Removed, Done projects) and anything the rules could not place. Ask. This is a plan change of every row, so it waits for the user's yes. Decisions the user adds ("everything after the demo has no dates yet", "add the demo milestone") are applied after the copy, as ordinary plan changes, so the copy itself stays mechanical.

### 4. Copy

1. The new root page. A current tracker with the old page's title already found (SKILL.md → **Finding things**: an interrupted upgrade) → use it. Otherwise create it directly, without a search or a question: `notion-create-pages` with the old page's title, `parent` = the old page's parent (none for a top-level page), and the config toggle as `references/setup.md` §1 shows. Then `references/setup.md` §2–6 on it — databases, computed columns, page layouts, config, views, tabs, verify; not step 7: the dashboard is step 5 below. Both pages carry a config toggle while the copy runs; the old one is recognised by its `open_items` line, so it is never written to.
2. Per project: the Projects row with the fields mapped above, then as `references/new-project.md` → **Create** steps 2–5 do, with the field values mapped above — the page's views and tabs, milestones, tasks, problems; then the Notes tab as mapped (no `Source` sub-page: the old Notes come over as they are). `Target end` is copied, not recomputed, and the Claude project question is not asked. Before creating a row, look for it in the new project's views by name; if it exists (an interrupted run), compare and fill what is missing instead of creating a second.
3. Verify by counts, per project: milestones, tasks, problems and notes in the new tracker equal what the preview listed. Fix any gap before going on.

### 5. Retire the old tracker

Only after the counts match:

- The old config toggle's summary becomes `⚙️ **Retired 0.x tracker** — not read by any skill; the live tracker is <mention-page url="<new root>"/>`, so search no longer finds it; its lines stay as they were.
- The old page title gets ` (0.x)` appended.
- The dashboard: if the old config had a `dashboard` line, copy it into the new config and republish that artifact as `references/dashboard.md` → **Republishing** says, with the new root page — the link the user already has keeps working. Otherwise publish a new one.

Tell the user what moved (counts per project), what stayed behind, the new page, that the old page is kept as a backup they can delete by hand once they are satisfied, and the click-through list from `references/setup.md` §8.

## Output

A tracker at schema 7, each step's number written as that step's last write, said in one line before the request is answered; for a 0.x tracker, the new tracker and the message of **5. Retire the old tracker**.

## Off limits

Writing to a 0.x tracker; dropping a value before it is checked in its new place; writing a step's `schema` number before the rest of that step is done, or one number for several steps.
