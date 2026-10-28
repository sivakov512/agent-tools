# Skill design

How the `my-skill` skill is put together and the criteria every change is checked against — for whoever edits `skills/my-skill/`. Read `docs/skill-development.md` at the repository root first: this file adds only what is particular to this plugin. The skill does not read it at run time.

## What the skill must do

These hold in every mode. Each has an eval case (`evals/README.md`) where `docs/skill-development.md` §7.2 calls for one; a change that breaks one is a bug, not a trade-off.

1. **<Guarantee.>** <What it means in practice, and why.>

## Decisions

Choices the user made or confirmed. A request that goes against one is raised with the user before anything changes.

- **<What was chosen.>** <Why, in a sentence or two.>
- **<Which eval cases the suite has.>** <Trigger cases, plus the behaviours that meet the criteria of `docs/skill-development.md` §7.2; each guarantee or behaviour left without a case, and why.>

## Where things live

| File | Owns |
|---|---|
| `SKILL.md` | trigger; words; the data model; the rules every mode needs; the modes table |
| `references/example-mode.md` | <the mode's procedure> |

## Exceptions

Where this plugin departs from `docs/skill-development.md`, and why. None.

## Checking a change

Beyond `docs/skill-development.md` §7: <the plugin's own checks, or none>.
