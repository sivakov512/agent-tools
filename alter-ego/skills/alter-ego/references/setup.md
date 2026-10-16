# Setup

Setting alter-ego up on a machine. Started when the user installs the plugin or asks to set it up.

**Inputs:** what `alter-ego doctor` reports.

## First run on a machine

1. Run `alter-ego doctor` and report what is missing (`jq`, `gh`, a secret store).
2. Remind the user that the wrappers start working in new sessions.
3. Offer `alter-ego attribution off` (`SKILL.md` → **Clean mode**).
4. Add a bot if they want one (`references/bots.md`). Nothing else needs setting up, since repositories are asked about as they come.

## Output

`alter-ego doctor` with nothing missing, and the user knowing which bots they have.

## Off limits

`alter-ego attribution off` without the user's yes: it changes their global Claude settings.
