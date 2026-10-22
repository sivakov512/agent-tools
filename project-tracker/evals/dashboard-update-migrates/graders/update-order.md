---
type: 'llm'
focus: 'mock_calls'
---
This conversation takes place on Friday, 9 October 2026: judge every "today", "late" and "due" against that date, not your own. The machine running it may show a later date; a reply that counts a day or two from that later date is not wrong for that alone.

The tracker started at `schema: 4` with a dashboard published from 1.0.0; the user asked only to update the dashboard. Judge the order of the agent's calls to the Notion and Artifact mocks.

- Each of the four data sources got `ADD COLUMN "Ref" UNIQUE_ID PREFIX '…'` with its own prefix — Projects (`20000000-…-0001`) `PRJ`, Milestones (`…0002`) `MLS`, Tasks (`…0004`) `TSK`, Problems (`…0003`) `PRB` — and no `Ref` value was written to any row.
- The config toggle on the root page (`10000000-…-0001`) got `schema: 5` (replacing `schema: 4`), written after all four `Ref` columns were added and after the root views were updated to show `Ref`; no write that is part of the 4 → 5 step comes after it.
- Then the 5 → 6 step: each of the four data sources got `ADD COLUMN "Code session" URL` and Projects also `ADD COLUMN "Code folder" RICH_TEXT` (a column added in an earlier call, together with `Ref`, is fine too), and the config toggle got `schema: 6` (replacing `schema: 5`) after them; then `schema: 7` (replacing `schema: 6`); between them a `ref_prefixes` line (and a `ref_prefixes_before` line) is fine, and no prefix needs changing, since the `Ref` columns were added with the new ones.
- Then the 7 → 8 step: Projects got `ADD COLUMN "Views" RICH_TEXT`, the Milestones and Tasks databases each a new view `Done`, `Recently resolved` (`50000000-…-0005`) a new filter, each project row a `Views` value and the config toggle the `projects_views`, `milestones_views`, `tasks_views` and `problems_views` lines; then `schema: 8` (replacing `schema: 7`) — the update's last write.
- All four `Ref` columns, `schema: 5`, `schema: 6`, `schema: 7` and `schema: 8` came BEFORE the Artifact `publish` of the dashboard (`https://claude.ai/artifact/d0000000-…-0001`). A publish before any of them is a FAIL.
- If the dashboard was published, it went to that same URL (not a new artifact) after an Artifact `read` of it. The eval has no shell to copy the dashboard's files, so stopping before the publish is fine here — this case is about the update coming first, not about the copy.

Judge only these claims. Extra read calls, and reading the artifact before or during the tracker update, are fine. A `ref_prefixes: …` line written to the config toggle before `schema: 5` is part of the update and fine; a `dashboard_version` line written after the publish belongs to the dashboard, not to the tracker update, so it may come after `schema: 8`. Answer FAIL only if one of the claims above is clearly false.
