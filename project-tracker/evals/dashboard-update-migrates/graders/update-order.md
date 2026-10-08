---
type: 'llm'
focus: 'mock_calls'
---
The tracker started at `schema: 4` with a dashboard published from 1.0.0; the user asked only to update the dashboard. Judge the order of the agent's calls to the Notion and Artifact mocks.

- Each of the four data sources got `ADD COLUMN "Ref" UNIQUE_ID PREFIX '…'` with its own prefix — Projects (`20000000-…-0001`) `PR`, Milestones (`…0002`) `MS`, Tasks (`…0004`) `TK`, Problems (`…0003`) `PB` — and no `Ref` value was written to any row.
- The config toggle on the root page (`10000000-…-0001`) got `schema: 5` (replacing `schema: 4`), written after all four `Ref` columns were added and after the root views were updated to show `Ref`; no write that is part of the tracker update comes after it.
- All four `Ref` columns and `schema: 5` came BEFORE the Artifact `publish` of the dashboard (`https://claude.ai/artifact/d0000000-…-0001`). A publish before any of them is a FAIL.
- If the dashboard was published, it went to that same URL (not a new artifact) after an Artifact `read` of it. The eval has no shell to copy the dashboard's files, so stopping before the publish is fine here — this case is about the update coming first, not about the copy.

Judge only these claims. Extra read calls, and reading the artifact before or during the tracker update, are fine. A `ref_prefixes: …` line written to the config toggle before `schema: 5` is part of the update and fine; a `dashboard_version` line written after the publish belongs to the dashboard, not to the tracker update, so it may come after `schema: 5`. Answer FAIL only if one of the claims above is clearly false.
