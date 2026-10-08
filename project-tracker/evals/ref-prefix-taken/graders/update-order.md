---
type: 'llm'
focus: 'mock_calls'
---
The tracker started at `schema: 4`. Projects, Milestones and Problems had no `Ref`; Tasks already had `Ref` with prefix `TK`. The prefix `PR` is taken elsewhere in the workspace, so the mock refuses any `ADD COLUMN "Ref" UNIQUE_ID PREFIX 'PR'` with `Unique ID prefix is already in use` (409 conflict_error). Judge the agent's calls to the Notion mock.

- Projects (`20000000-…-0001`) got `ADD COLUMN "Ref" UNIQUE_ID PREFIX 'PR'`, which was refused, and after that `ADD COLUMN "Ref" UNIQUE_ID PREFIX 'PRJ'`, which was accepted. Milestones (`…0002`) got `'MS'` and Problems (`…0003`) `'PB'`. Tasks (`…0004`) got no `ADD COLUMN "Ref"` at all — its existing `Ref` was kept as it was.
- No `Ref` value was written to any row.
- The config toggle on the root page (`10000000-…-0001`) got a line `ref_prefixes: PRJ, MS, TK, PB` (backticks around the values are fine), written after the `PRJ` column was accepted.
- The config toggle got `schema: 5` (replacing `schema: 4`), written after the `ref_prefixes` line, after the three `Ref` columns were added and after the root views were updated to show `Ref`; no write that is part of the tracker update comes after it.

Judge only these claims. Extra read calls (fetching a task page to read its `TK` prefix, view queries) and writes that answer the user's question after the update are fine. Answer FAIL only if one of the claims above is clearly false.
