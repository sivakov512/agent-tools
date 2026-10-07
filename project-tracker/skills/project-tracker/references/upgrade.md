# Upgrade — a tracker made by version 0.x

Version 0.x had three databases — Projects, Milestones (with a `Phase` select) and Issues (`Blocker / Risk / Question / Task`, config key `open_items`). This version adds Tasks and turns Issues into Problems. The old tracker is not converted in place: a new tracker is set up next to it, the live data is copied over by fixed rules, and the old page is retired but kept — it stays the backup. The procedure is deterministic, so running it twice on the same old tracker gives the same rows, and an interrupted run is finished, not repeated.

## 1. Read the old tracker

From its config: the `projects`, `milestones`, `open_items` data sources. Read through views only:

- Projects `Active` (Active and Paused) — the projects to move. Done and Removed projects stay in the old tracker; say so in the preview.
- Per project, from its page: the callout, the `Notes` tab (lines and `<page>` sub-pages), the `Schedule` view (every milestone but Dropped) and the `Open items` view; the root Issues `Recently resolved` view for its resolved issues.
- The page body of every milestone and issue that moves, and every Notes sub-page.

Dropped milestones and issues, and Removed projects, do not move.

## 2. Map — the fixed rules

**Projects**: every field as is (`Name`, `Client`, `Status`, `Summary`, `Target end`, `Repository`, `Source`); `Origin` from the old rule — `Source` on upwork.com → Upwork, empty `Client` → Personal, else Direct.

**Milestones**, by the project's phases:

- All milestones in one phase (`General` or any single phase) → they stay milestones, one to one: `Name`, `Status`, `Dates`, `Finished`, body.
- Several phases → each phase becomes a milestone named after it, and the milestones of that phase become its tasks, one to one (`Name`, `Status`, `Dates`, `Finished`, body; Paused → Planned with a history line `Was Paused in the 0.x tracker`). A phase that holds a single milestone with the phase's own name stays that one milestone, without a task.
  - The phase milestone's `Dates` run from its first task's start to its last task's end; with no dated task, none.
  - Its `Status`: every task Done → Done, `Finished` = the latest task `Finished`; any task In progress or Done → In progress; else Planned.
  - Its body: one line `- **<today>** — Was the phase "<phase>" in the 0.x tracker; its milestones are now its tasks.`

**Issues**:

- `Task` → a task of the same project, under the milestone (or the task's new milestone, if its old milestone became a task) the issue was linked to. `Open` → Planned; `Waiting` → Waiting, `Waiting on` kept; `Resolved` → Done, `Finished` = `Resolved on`. No `Dates`.
- `Blocker`, `Risk`, `Question` → a problem of the same type: `Status`, `Waiting on`, `Note`, `Opened`, `Resolved on` as is; `Milestone` = the new milestone; `Task` = the new task, if the old milestone it was linked to became a task.
- An issue's `Note` → history lines of the new task (problems keep their `Note` as is): split at ` · `, each part a line `- **<date>** — <part>`, where the date is the `YYYY-MM-DD:` the part starts with (removed from the text) or else `Opened`; oldest first.

**Bodies**: every history and page body is copied verbatim, as fetched, then one line is added at the end: `- **<today>** — Moved from the 0.x tracker.` (for a milestone that became a task: `… was a milestone of the phase "<phase>"`). Mentions of old pages (`<mention-page url="…">`) are rewritten to the new page of the same row once that page exists — write the body as it was, then fix the mention with `update_content` after the target row is created; mentions of pages that did not move stay.

**Notes tab**: lines and sub-pages in the old tab's order — short lines copied as they are, each sub-page re-created under the new project page with the same title and its body copied verbatim, then moved into the tab as SKILL.md (**Notes and files**) describes. Lines the upgrade itself adds come last.

**Callout**: rebuilt by the rules of this version from the new rows; `On hold` reasons and `Paused` / `Done` lines come from the old callout.

## 3. Preview

Show, per project: the milestones with their tasks (dates, status), the problems, what is not moved (Dropped, Removed, Done projects) and anything the rules could not place. Ask. This is a replan of every row, so it waits for the user's yes. Decisions the user adds ("everything after the demo has no dates yet", "add the demo milestone") are applied after the copy, as ordinary plan changes, so the copy itself stays mechanical.

## 4. Copy

1. Set up the new tracker (`setup.md`): the name is the old page's title, the place is the old page's parent. Both pages carry a config toggle while the copy runs; the old one is recognised by its `open_items` line, so it is never written to.
2. Per project, as `new-project.md` → **Create** does: the Projects row, the page's views and tabs, milestones, tasks, problems, Notes, then the callout. Before creating a row, look for it in the new project's views by name; if it exists (an interrupted run), compare and fill what is missing instead of creating a second.
3. Verify by counts, per project: milestones, tasks, problems and notes in the new tracker equal what the preview listed. Fix any gap before going on.

## 5. Retire the old tracker

Only after the counts match:

- The old config toggle's summary becomes `⚙️ **Retired 0.x tracker** — not read by any skill; the live tracker is <mention-page url="<new root>"/>`, so search no longer finds it; its lines stay as they were.
- The old page title gets ` (0.x)` appended.
- The dashboard: if the old config had a `dashboard` line, copy it into the new config and update that artifact as `dashboard.md` → **Updating** says, with the new root page — the link the user already has keeps working. Otherwise publish a new one.

Tell the user what moved (counts per project), what stayed behind, the new page, and that the old page is kept as a backup they can delete by hand once they are satisfied.
