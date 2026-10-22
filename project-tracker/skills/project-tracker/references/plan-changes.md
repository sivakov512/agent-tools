# Plan changes and removal

Started by the user: a plan change, a reorder, a removal or a restore, or an undo.

**Inputs:** the project's `Schedule` and `Tasks` views; for an undo, the values before the change — from this conversation, or from the history.

## Plan changes — "the client added a stage", "drop the load test", "split that milestone", "break the demo into tasks", "finished early, pull everything in"

The scope or structure changes, and one sentence of the user's rewrites many rows on your reading of it: so every change here is shown with every row it moves and made on their yes (SKILL.md → **Recording a fact vs a plan change**).

1. Work it out on the project's `Schedule` and `Tasks` views.
   - **Add a milestone**: dates the user stated, or that follow from the rules in `references/new-project.md` (start = end of the previous milestone); otherwise ask. A milestone inserted into the chain pushes everything starting on or after its start by its length.
   - **Add tasks** — more than the one task the user named ("the demo has these steps: …"): under the milestone they serve, with the dates the user gave or that follow from what they said (SKILL.md → **Never guess a date or a duration**), or none. The one task the user asked for is not a plan change — SKILL.md, **Tasks**.
   - **Break a milestone into tasks**: the steps become tasks of that milestone; the milestone keeps its own `Dates`. Steps the user gives dates for get them; one that runs past the milestone's end is offered as SKILL.md → **Dates are the user's** says.
   - **Turn a stage into a milestone with tasks** (a phase that grew steps, or a milestone that was really a step of a bigger one): create the new milestone, set the existing rows' `Milestone` to it, keep their histories; nothing is deleted.
   - **Drop** a milestone or several tasks: they become `Dropped`; a dropped milestone's open tasks are dropped with it (say so). The rest does not move unless the user says so. The one task the user names is a removal, without a preview (**Removing**).
   - **Rename**: change `Name` in place, with a history line — the history and links stay.
   - **Order**: an added milestone or task takes the `Order` after the last one, or the place the user names (the rows after it shift by one); split and merged items take the place of what they replace. A reorder alone is not a plan change (**Reorder**).
   - **Split, merge**: the new items cover the old dates unless the user says otherwise; the replaced ones become `Dropped`.
   - **Pull in** (finished early): the following items keep their dates unless the user says to move them — finishing early is recorded by `Finished`, it does not change the plan by itself. When they do move: everything starting on or after the old end, by the same amount, unless the user says only some move.
   - **Clear dates** ("everything after the demo has no dates yet, I'll re-plan"): `Dates` → empty on the items named, each with a history line keeping the old dates (`- **Oct 6** — Dates cleared for re-planning: Nov 13 – Dec 4 → none.`). Milestones without dates show under Your move → Milestones without dates on the dashboard until new ones are set. If the last milestone loses its dates, `Target end` is emptied too, with a history line on the project page keeping the old one (`- **Oct 6** — Target end Jul 31, 2027 → none: re-planning after the demo.`).
2. Existing dates move on the user's word, as for a delay; if the user has not said, ask.
3. Show the change as a short list (`+ Field trial: Apr 6 – Apr 17`, `+ Demo firmware (task of Demo prototype): Oct 20 – Oct 30`, `− Load test`, `TSK-9 Handover: Apr 30 → Apr 24`) and ask.
4. On yes: create and update rows. Every touched item gets a history line with the reason and, for a move, `old → new` (`- **Mar 18** — Added: client asked for a field trial.`, `- **Mar 18** — Dropped (was Planned): client no longer needs the load test.`, `- **Mar 18** — Moved with Fjord Labs, pushed by the field trial: Apr 20 → Apr 30.`). Then `Target end`, `Summary`, and the usual was → now reply.

## Reorder — "bring-up comes after firmware", "swap these two milestones"

Not a plan change, so no preview: renumber the rows that move (SKILL.md → **Order**), with a history line on the row that moved (`- **Oct 9** — Moved after Firmware in the plan.`). `Dates` do not follow a reorder: if they now contradict the order, say so and offer the move, which happens only on the user's word.

## Removing — "delete the test project", "remove that problem", "drop that task"

Removing has two forms, and the user picks one: **drop** — the row stays with `Status` Dropped (Removed for a project), hidden from every view, with a line on why, so the plan's history keeps it — or **delete** — the page goes to Notion's trash (`notion-delete-pages`, a project with its rows), from where it can be restored for a while. Ask in one line, with your advice: an item that was in the plan the client saw, or has history, is better dropped; a test, a duplicate or something made by mistake is better deleted. Delete only on the user's yes, never on your own to tidy up. Dropping:

- **Project** → `Status` Removed; each milestone that is Planned, In progress or Paused, each task that is Planned, In progress or Waiting, and each Open or Waiting problem → Dropped. Then add one history line to the project page recording what was changed — `- **Mar 18** — Removed (was Active). Dropped: <mention-page url="<milestone url>">Load test</mention-page> (was In progress), <mention-page url="<task url>">Rig booked</mention-page> (was Waiting), <mention-page url="<problem url>">Test rig</mention-page> (was Waiting).` Dropped rows appear in no view, so this line is the only way back to them for a restore.
- **Problem** → Dropped, with a history line `- **Mar 18** — Dropped (was Waiting).`
- **Task** — the one the user names → Dropped, with a history line `- **Mar 18** — Dropped (was Planned): <reason, if given>.`
- **Milestone**, or several tasks → a plan change: drop them as above, with confirmation.

`Removed` and `Dropped` are not live statuses (SKILL.md → **The tracker**), so nothing of it shows as live or as progress. Reply with what was set, and that the user can delete the pages by hand if they want them gone.

**Restoring** ("bring the test project back"): a deleted page comes back from the trash with `notion-restore-pages` (Notion empties the trash after a while; past that it is gone). A dropped one: find it with `notion-search`, read the removal line in its history, and put the project and every row listed there back to the status recorded. Rows dropped for another reason stay dropped. A single problem, task or milestone comes back the same way, from the `Dropped (was X)` line in its history (older forms: `references/upgrade.md` → **Old shapes**), with a history line `Restored`.

## Undo — "undo that", "revert", "put it back"

Undo takes a change back; it is not a new fact.

**Made in this conversation**: you have the old values. Check that each field still holds what you wrote — if the user edited it since, show that and ask. Otherwise restore without asking: old property values back; an entry the change rewrote (an exchange settled into its outcome, a correction) back to its old text; a note edited in place back to its old text; history or note lines that recorded the change removed (`update_content` with the line as `old_str`, empty `new_str`, with its heading when it was the section's only entry — plain text lines only); a checklist tick taken back; milestones, tasks and problems you created → Dropped, a project you created → Removed. A sub-page or file you added stays: tell the user they can delete it by hand. Then SKILL.md → **Every change**, steps 2–4.

**Made earlier** ("undo the delay I reported last week") is a reconstruction: first make sure which change is meant (ask unless the user named it). Rebuild the old values from what Notion shows — history lines record date moves as `Mar 6 → Mar 13`, pause and removal lines record the previous status — then show what you would restore and ask. A value recorded nowhere is asked for, not guessed. On yes, restore as for an undo in this conversation.

Notion's version history (••• → Version history) is the user's last resort; the API cannot restore versions.

## Output

The rows changed, each touched one with its history line, `Target end` and `Summary` in line, and the reply of SKILL.md → **Every change**.

## Off limits

A plan change or a reconstructed undo before the user's yes; deleting a page without it; a value recorded nowhere, guessed.
