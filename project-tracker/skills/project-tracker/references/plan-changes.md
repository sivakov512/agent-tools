# Plan changes and removal

## Plan changes — "the client added a stage", "drop the load test", "split that milestone", "finished early, pull everything in"

The scope or structure changes. `Dates` are the commitment, so every change here is a change of what the client is told.

1. Work it out on the project's `Plan` view.
   - **Add**: dates the user stated, or that follow from the rules in `new-project.md` (start = end of the previous milestone); otherwise ask. A milestone inserted into the chain pushes everything starting on or after its start by its length.
   - **Drop**: the milestone becomes `Dropped`. The rest does not move unless the user says so.
   - **Rename**: change `Name` in place, with a history line — the history and links stay.
   - **Split, merge**: the new milestones cover the old dates unless the user says otherwise; the replaced ones become `Dropped`.
   - **Pull in** (a milestone finished early): the following milestones keep their dates unless the user says the earlier dates are agreed with the client or that this project runs on their own plan — finishing early is recorded by `Finished`, it does not change what was promised. When they do move: everything starting on or after the old end, by the same amount, unless the user says only some move.
2. Moving existing milestones needs the new dates to be agreed with the client (or the user's own plan), as for a delay; if the user has not said, ask. Adding or dropping a stage the client asked for is agreed by its nature.
3. Show the change as a short list (`+ Field trial: Apr 6 – Apr 17`, `− Load test`, `Handover: Apr 30 → Apr 24`) and ask.
4. On yes: create and update milestones. Every touched milestone gets a history line with the reason and, for a move, `old → new` (`- **Mar 18** — Added: client asked for a field trial.`, `- **Mar 18** — Dropped (was Planned): client no longer needs the load test.`, `- **Mar 18** — Moved with Fjord Labs, pushed by the field trial: Apr 20 → Apr 30.`). Then `Target end`, `Summary`, the callout, and the usual was → now reply.

## Removing — "delete the test project", "remove that issue"

The Notion API cannot delete pages; say so in one line, then do the equivalent without asking — the user asked for it gone:

- **Project** → `Status` Removed; callout line 1 → `**Removed**` (🗑️ `gray_bg`), so the page itself says so; each milestone that is Planned, In progress or Paused and each Open or Waiting issue → Dropped. Then add one line to the project's `Notes` tab recording what was changed — `**Mar 18** — Removed (was Active). Dropped: <mention-page url="<milestone url>">Load test</mention-page> (was In progress), <mention-page url="<issue url>">Test rig</mention-page> (was Waiting).` Dropped rows appear in no view, so this line is the only way back to them for a restore.
- **Issue** → Dropped, with ` · removed (was Waiting)` appended to `Note`.
- **Milestone** → that is a plan change: drop it as above, with confirmation.

`Removed` and `Dropped` are outside every view, overview and report, so nothing of it shows as live or as progress. Reply with what was set, and that the user can delete the pages by hand if they want them gone.

**Restoring** ("bring the test project back"): find it with `notion-search`, read the removal line in its `Notes` tab, and put the project and every row listed there back to the status recorded; then the callout. Rows dropped for another reason stay dropped. A single issue or milestone comes back the same way, from `removed (was X)` in its `Note` or `Dropped (was X)` in its history; drop the suffix from the note and add a history line `Restored`.
