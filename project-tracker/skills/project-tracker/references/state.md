# Pause, resume and project state

SKILL.md (**Pause**) has the core: `Status` Paused, a dated line with the reason and the previous status, and nothing paused is late.

## Milestone paused — "the enclosure test is on hold until Kestrel sends the parts"

A milestone stops for a reason outside the work: pause it as SKILL.md (**Pause**) says. If someone else has to act, so that it shows up in "who to chase": a Waiting task for exactly that already exists → name it in the pause line; otherwise open a Blocker waiting on whoever must act (`Waiting on` Kestrel), linked to the milestone. A pause without a reason is allowed: propose it with `no reason given` and ask for the reason in the same reply. The pause is a fact the user reported: it goes into the proposal (or is written at once on an instruction or a go-ahead, SKILL.md → **Propose, then write**), and the same reply asks whether later milestones wait on this one — those that do are paused the same way, the rest carry on (several milestones can be In progress).

Tasks are not paused on their own: a task that cannot move because someone else has to act is Waiting; one the user set aside stays Planned with a history line saying why.

## Milestone resumed — "resume the enclosure test"

The status recorded in the pause line comes back, for this milestone and those paused with it. Ask how much work is left and whether to move the dates. Move → shift `Dates` from today as for a delay, and push the milestones that waited on it only where the new end runs past their start (pulling them earlier is a separate plan change): `- **Mar 24** — Resumed after 14 days. Mar 20 → Apr 1.` Keep → `Dates` stay, the history says `Resumed after 14 days`, and tell the user the milestone counts as late from its old date. Offer to resolve the problem or finish the task it was waiting on.

## Project state and fields — "put the project on hold", "that one is finished", "the repo is …"

Paused / Done / Active → project `Status`, a history line on the project page with the reason if given and the previous status (`- **Mar 3** — Paused (was Active): client budget review.`). Resuming it: ask whether its dates move; yes → move them as for a delay; no → they stay, and items past their dates count as late again. Done with milestones or tasks still open: ask whether to close them — they stay in the views until closed. Other fields (client, origin, repository, source): set them; a new `Origin` value becomes a new option of the select. Removing a project: `references/plan-changes.md`.
