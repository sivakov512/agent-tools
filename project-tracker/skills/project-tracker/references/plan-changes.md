# Plan changes and removal

## Plan changes — "the client added a stage", "drop the load test", "split that milestone", "break the demo into tasks", "finished early, pull everything in"

The scope or structure changes. `Dates` are the commitment, so every change here is a change of what the client is told.

1. Work it out on the project's `Schedule` and `Tasks` views.
   - **Add a milestone**: dates the user stated, or that follow from the rules in `new-project.md` (start = end of the previous milestone); otherwise ask. A milestone inserted into the chain pushes everything starting on or after its start by its length.
   - **Add tasks** — more than the one task the user named ("the demo has these steps: …"): under the milestone they serve, with the dates the user gave (agreed with the client) or none. The one task the user asked for is not a plan change — SKILL.md, **Tasks**.
   - **Break a milestone into tasks**: the steps become tasks of that milestone; the milestone keeps its own `Dates`. Steps the user gives dates for get them; if those run past the milestone's end, say so — the milestone's end moves only if the user says the new end is agreed.
   - **Turn a stage into a milestone with tasks** (a phase that grew steps, or a milestone that was really a step of a bigger one): create the new milestone, set the existing rows' `Milestone` to it, keep their histories; nothing is deleted.
   - **Drop** a milestone or several tasks: they become `Dropped`; a dropped milestone's open tasks are dropped with it (say so). The rest does not move unless the user says so. The one task the user names is a removal, without a preview (**Removing**).
   - **Rename**: change `Name` in place, with a history line — the history and links stay.
   - **Order**: an added milestone or task takes the `Order` after the last one, or the place the user names (the rows after it shift by one); split and merged items take the place of what they replace. A reorder alone is not a plan change (SKILL.md → **Order**).
   - **Split, merge**: the new items cover the old dates unless the user says otherwise; the replaced ones become `Dropped`.
   - **Pull in** (finished early): the following items keep their dates unless the user says the earlier dates are agreed with the client or that this project runs on their own plan — finishing early is recorded by `Finished`, it does not change what was promised. When they do move: everything starting on or after the old end, by the same amount, unless the user says only some move.
   - **Clear dates** ("everything after the demo has no dates yet, I'll re-plan"): `Dates` → empty on the items named, each with a history line keeping the old dates (`- **Oct 6** — Dates cleared for re-planning: Nov 13 – Dec 4 → none.`). Milestones without dates show under **Needs dates** on the dashboard until new ones are agreed. If the last milestone loses its dates, `Target end` is emptied too, with a line in `Notes` keeping the old one (`**Oct 6** — Target end Jul 31, 2027 → none: re-planning after the demo.`).
2. Moving existing dates needs the new dates to be agreed with the client (or the user's own plan), as for a delay; if the user has not said, ask. Adding or dropping a stage the client asked for is agreed by its nature.
3. Show the change as a short list (`+ Field trial: Apr 6 – Apr 17`, `+ Demo firmware (task of Demo prototype): Oct 20 – Oct 30`, `− Load test`, `Handover: Apr 30 → Apr 24`) and ask.
4. On yes: create and update rows. Every touched item gets a history line with the reason and, for a move, `old → new` (`- **Mar 18** — Added: client asked for a field trial.`, `- **Mar 18** — Dropped (was Planned): client no longer needs the load test.`, `- **Mar 18** — Moved with Fjord Labs, pushed by the field trial: Apr 20 → Apr 30.`). Then `Target end`, `Summary`, the callout, and the usual was → now reply.

## Removing — "delete the test project", "remove that problem", "drop that task"

The Notion API cannot delete pages; say so in one line, then do the equivalent without asking — the user asked for it gone:

- **Project** → `Status` Removed; callout line 1 → `**Removed**` (🗑️ `gray_bg`), so the page itself says so; each milestone that is Planned, In progress or Paused, each task that is Planned, In progress or Waiting, and each Open or Waiting problem → Dropped. Then add one line to the project's `Notes` tab recording what was changed — `**Mar 18** — Removed (was Active). Dropped: <mention-page url="<milestone url>">Load test</mention-page> (was In progress), <mention-page url="<task url>">Rig booked</mention-page> (was Waiting), <mention-page url="<problem url>">Test rig</mention-page> (was Waiting).` Dropped rows appear in no view, so this line is the only way back to them for a restore.
- **Problem** → Dropped, with ` · removed (was Waiting)` appended to `Note`.
- **Task** — the one the user names → Dropped, with a history line `- **Mar 18** — Dropped (was Planned): <reason, if given>.`
- **Milestone**, or several tasks → a plan change: drop them as above, with confirmation.

`Removed` and `Dropped` are outside every view, overview and report, so nothing of it shows as live or as progress. Reply with what was set, and that the user can delete the pages by hand if they want them gone.

**Restoring** ("bring the test project back"): find it with `notion-search`, read the removal line in its `Notes` tab, and put the project and every row listed there back to the status recorded; then the callout. Rows dropped for another reason stay dropped. A single problem, task or milestone comes back the same way, from `removed (was X)` in its `Note` or `Dropped (was X)` in its history; drop the suffix from the note and add a history line `Restored`.

## Undo of an earlier change — "undo the delay I reported last week"

SKILL.md (**Undo**) covers a change made in this conversation. One made earlier is a reconstruction: first make sure which change is meant (ask unless the user named it). Rebuild the old values from what Notion shows — history lines record date moves as `Mar 6 → Mar 13`, pause and removal lines record the previous status — then show what you would restore and ask. A value recorded nowhere is asked for, not guessed. On yes, restore as for an undo in this conversation.

Notion's version history (••• → Version history) is the user's last resort; the API cannot restore versions.
