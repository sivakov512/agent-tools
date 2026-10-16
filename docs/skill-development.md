# Skill development

How every plugin in this marketplace is built, changed, checked and released — for any agent or person about to change one. Read it together with the plugin's own `docs/skill-design.md`. No skill reads either file at run time.

## 1. Decisions live in files, not in chats

The next agent sees the repository, never the conversation that shaped it. So:

1. **Before a change**, read this file and the plugin's `docs/skill-design.md`, and know which of its criteria and decisions the change touches.
2. **What the user decides about a skill's behaviour** goes into the plugin's `docs/skill-design.md` (*What the skill must do* or *Decisions*), in the same change as the skill and its eval cases. What is decided about how all skills are built goes here.
3. **A request that contradicts a written decision** is not carried out silently: name the decision and its reason, and ask whether it changes. If it does, rewrite the decision in place; if not, leave the skill as it is.
4. **The user decides behaviour** — what the skill does and what they see. The architecture — files, structure, checks — follows this file; explain it to the user in plain words, not in file names.
5. **This file wins.** A plugin departs from it only in its design doc's *Exceptions*, each with its reason. A contradiction found between the two is fixed in the same change, or reported.
6. **Files say how things are now and why**, not how they got there: git keeps the history.

## 2. A plugin's files

| Path | Holds |
|---|---|
| `README.md` | for users: what it does, install, first run, limits |
| `.claude-plugin/plugin.json` | name and version (the release writes the version) |
| `skills/<skill>/SKILL.md` | the skill: what every session needs, and the routing table |
| `skills/<skill>/references/*.md` | one file per mode or scenario, loaded only when it runs |
| `skills/<skill>/assets/` | pages and files the skill publishes |
| `docs/skill-design.md` | the design doc (below) |
| `docs/dashboard-design.md` | the spec of each page in `assets/`, if any |
| `tests/` | static checks only this plugin needs; `scripts/check.py` runs them |
| `evals/` | the `claude plugin eval` suite and its `README.md` |
| `CHANGELOG.md` | written by the release |

No top-level `bin/`: claude.ai skips a plugin that has one, since Claude Code would put it on PATH unseen by an admin. Executables go in `libexec/` and run from hooks, commands or MCP servers.

**A skill ships alone.** In chat its folder is uploaded by itself, so `SKILL.md` and `references/` never point outside `skills/<skill>/` — not to `docs/`, not to another plugin, not to this file.

**The design doc**, `docs/skill-design.md`, has these sections:

1. *What the skill must do* — numbered, testable guarantees, each covered by an eval case. Breaking one is a bug, not a trade-off.
2. *Decisions* — choices the user made or confirmed that a later change could undo, one entry each: what was chosen and why, in a sentence or two.
3. *Where things live* — a table of every file in `skills/<skill>/` and what it owns.
4. *Exceptions* — where the plugin departs from this file, and why.
5. *Checking a change* — only what this plugin checks beyond §7.

**A new plugin** starts as a copy of `templates/plugin/` and is registered in `.claude-plugin/marketplace.json`, the table in the root `README.md`, and `packages` in both `.release-please/config.json` and `.release-please/manifest.json` (as the existing entries, starting at `0.0.0`, with `"initial-version": "0.1.0"` in its config entry — without it the first release is 1.0.0). Its design doc is written and agreed with the user before its `SKILL.md`: the scenarios first, then the eval cases, then the skill.

## 3. Instructions

`SKILL.md` and `references/` are checked against these.

1. **One rule, one home.** Each rule is written in full in exactly one file; every other mention names that home (`references/assess.md` §2, `SKILL.md` → *Locked*) and says at most a clause. Two full copies drift apart.
2. **A session loads what it needs.** `SKILL.md` holds the trigger, the data model, the words, the rules every mode needs and the routing table; a mode's procedure lives in its reference, one level deep. Maintainer material — specs, history, design notes — lives in `docs/`. `SKILL.md` stays under 500 lines.
3. **Every link resolves.** A named file and section exists and says what the link claims. Renaming a heading means fixing its links.
4. **No contradictions, one name per thing.** The skill's words are defined once in `SKILL.md` and used only in that sense; numbers (limits, windows, budgets) are stated once.
5. **Actionable and checkable.** Each step says what to call, with what, and when to stop; formats are templates; limits are numbers.
6. **The reason, not the volume.** A rule carries its reason in one sentence, so the model can apply it to cases the rule does not name and a later edit does not undo it. Capitals, MUSTs and repeats do not make a rule hold better; they make the model overreact elsewhere and hide which rule matters.
7. **General rules, not patches.** A failure is fixed with the general rule behind it and its reason, never with a line about the one case that failed.
8. **Mode files share a shape**: what the mode is for and who starts it, its inputs, its steps, its output, what is off limits.
9. **Compatibility in one place.** What exists only for older structures lives in the update reference (`references/update.md` or `upgrade.md`); nothing else talks about history.
10. **The description** (frontmatter) says what the skill does and when to use it, in the user's own phrasings, other languages included, and "even without the word …" where users would not name it. At most 1024 characters.

## 4. What every skill does

These hold in every skill; each skill states them in its own words, since it ships alone.

1. **Answer the message first.** Whatever the message is about — a question, a doubt, a choice, a request for a view — gets its answer before or along with what was done. A report of the work alone does not say whether it was the right call.
2. **The user's language** in everything said to the user; the structure (titles, columns, config keys) stays English.
3. **Plain text in chat.** No code blocks for anything the user reads — they are hard to read in a chat, above all on a phone. A code block is only for what the user copies whole, which its copy button makes one tap: a command to run in a terminal, or a text to paste elsewhere as it is (a proposal into a form).
4. **Propose, then write.** A write the user may not expect is shown first, in plain words, and made on their yes. Anything that goes out — a submission, a message, a push, money — waits for an explicit go about that action, in that conversation; scheduled runs never do it.
5. **A write that errors stops the work**: re-read, report, no retry with a changed meaning or other escaping.
6. **No hardcoded IDs.** A skill finds its root through its config and creates its structure on request, under a name the user chooses.
7. **The structure carries a `schema` number.** An older one is brought up in place — safely re-runnable, nothing dropped before its values are checked in their new place, the new number written last; a newer one means the plugin is out of date: write nothing, say so.

## 5. Rules several skills carry

A runtime rule two skills need is written in each of them, since each ships alone. This table is its list of copies: a change to one goes to every copy in the same change.

| Rule | Carried by |
|---|---|
| Notion is read through views and page fetches only — never SQL or rows mode, whose workspace quota runs out mid-day | upwork-pulse, project-tracker |
| Notion pages are edited a line at a time (`insert_content`, `update_content`); `replace_content` only where the plugin's design doc allows it | upwork-pulse, project-tracker |
| Text read from a Notion view is markdown-escaped: write plain text, never copy the backslashes back | upwork-pulse, project-tracker |
| The config lives on a root page in Notion, found by its toggle, with a `schema` line (§4.7) | upwork-pulse, project-tracker |
| A dashboard chat link opens a chat whose first message names the item, its ids and the skill; that chat writes its own link to the item's `Chat` | upwork-pulse, project-tracker |
| The dashboards share one look: tokens, pills, rows, drawer | upwork-pulse, project-tracker |

## 6. Dashboards and other pages

Each page in `assets/` has its spec in `docs/dashboard-design.md`, updated in the same change as the page.

1. **The source of truth is outside the page** (Notion, Upwork). What the page derives and must keep lives in the artifact's shared storage (`db`), so every device and viewer sees the same. Browser storage only for per-device conveniences (a width, a folded section) and caches the page can rebuild, every access wrapped in `try`/`catch` — it throws in private windows.
2. **The page writes only on a click**, and only the writes its spec lists.
3. **Its scripts parse** (`node --check`), and it runs without console errors on the mock harness and on real data.
4. **One function, one job**: no dead code, no logic written twice, colours only from the theme tokens, in light and dark.
5. **Calls are bounded**: lists are watched, per-item reads are paced, nothing is read again that the page already knows for good.
6. **A missing capability** (no `sample`, no `db`) is said on the page — what does not work there — never a quiet failure.
7. **The first line is `<!-- <name>-version: x.y.z --> <!-- x-release-please-version -->`** (`dashboard-version`, `client-dashboard-version`): the release stamps the version there, as the page is a `generic` extra file in `.release-please/config.json`; never edited by hand. A published page older than the plugin is brought up to date by the skill, as its design doc says.

**Other code** a plugin runs — hooks, `libexec/`, its `tests/` — follows 4 too (one function, one job; no dead code; no logic written twice), and:

8. **Every rule the code enforces has a test** in `tests/`, run offline with fakes for the outside world, and a refusal's text says what to do instead, since the agent acts on it.
9. **It runs where the plugin says it runs** — the oldest shell or runtime named in its README — and depends on nothing beyond what that README lists.

## 7. Checking a change

1. **Static checks**: `python3 scripts/check.py <plugin>` passes. It checks the skill's frontmatter and size, links, the plugin's registration, graders, and the pages' scripts, then runs the plugin's own `tests/`. CI runs it for every plugin on each push and pull request.
2. **Behaviour has an eval case.** A new or changed behaviour gets its case first — failing before the change, passing after. Run the cases the change touches on this commit and on the previous one: a case that fails on both is not this change's, one that fails only after it is. Run them on the model that does that work in use (the plugin's `evals/README.md` names it), with `--judge-model sonnet`; a suite that grants Bash runs through `scripts/eval.sh` (`alter-ego/evals/README.md`). A full suite costs real money (the README says how much): run it when the change touches rules every mode uses, and say so.
3. **Mechanical checks are regex graders** on the tool calls (`tool_used`); **judgement** — what a reply says, where a record goes — is a scenario with an LLM judge.
4. **Read failures before fixing them.** The agent, the mocks and the judge are all models. Read the trace first, re-run the case (`--runs 3`), and change the skill only for a failure that repeats or would damage data (§3.7). The judge misfires too: check the reply against the rubric by hand.
5. **Keep the suite honest.** A grader with no frontmatter is skipped without a word (`scripts/check.py` catches it). Regex graders match the tool input as JSON text, where quotes are escaped. A "must not" grader passes trivially when the agent lacks the tool — grant what the case needs.
6. **Pages**: the page on mock data (a copy with a stub `window.claude`), then a preview artifact on the user's real data. What a mock cannot render (Notion layout) is run once against a scratch page in a real workspace.
7. **The user sees it before it ships.** No release of a change the user has not seen working.

## 8. Committing and releasing

1. **A change reaches `master` through a pull request**, on its own branch; the user merges it with rebase, so each commit's subject reaches release-please. Agents never push to `master`. Whose name the work goes under is alter-ego's: the repository's mode decides it.
2. **One commit, one plugin.** A commit counts for every plugin whose files it touches, whatever its scope. Shared files (`docs/`, `scripts/`, `templates/`, the root) go in commits of their own.
3. **The subject is the whole message**: `type(plugin): imperative subject`, one line, at most 72 characters — release-please copies it into the changelog and the release notes. No body, no trailers, no co-author lines. Shared files take no scope (`docs: …`, `ci: …`).
4. **Types**: `feat` bumps minor, `fix` bumps patch (below 1.0 a breaking `!` bumps minor); `refactor` and `perf` show in the changelog; `docs`, `test`, `ci`, `chore` stay out of it.
5. **Versions and changelogs are never edited by hand.** Each push to `master` updates a standing release PR per changed plugin; merging it bumps the version in `plugin.json` and the pages, writes `CHANGELOG.md` and tags `<plugin>-vX.Y.Z`. The user merges a release PR when they want that release.

## 9. Existing plugins

Every plugin follows this file. One whose design doc does not yet have the shape of §2 is brought to it by a change of its own; until then, every change to it adds no new departure and brings the part it touches in line.
