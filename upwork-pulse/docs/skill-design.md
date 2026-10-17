# Skill design

How the `upwork-pulse` skill is put together and the criteria every change is checked against — for whoever edits `skills/upwork-pulse/`. Read `docs/skill-development.md` at the repository root first: this file adds only what is particular to this plugin. The skill does not read it at run time. The dashboard's own spec is `docs/dashboard-design.md`.

## What the skill must do

These hold in every mode, whatever the rules pages say. The eval suite (`evals/README.md`) checks each; a change that breaks one is a bug, not a trade-off.

1. **Nothing goes to Upwork without the user's go.** Reading is free; a submission, message, boost, save or offer answer waits for an explicit "send it" about that action, in that conversation. Scheduled runs never write to Upwork (a proposal preview is a read). Cases: the guard on every case, `chat-proposal`.
2. **Notion is read through views and page fetches only**, and pages are edited a line at a time (*Decisions* → `replace_content`). Cases: the guards on every case.
3. **No posting is lost or read twice.** A watermark moves only after everything it covers is written; a run that stops early leaves it, and the next run catches up. Cases: `hourly-take`, `hourly-rules-fail`, `hourly-jobs-refused`, `hourly-auto-update`.
4. **Rules are not guessed.** A case the rules do not settle becomes at least a Maybe card and a question, never a silent reject; a rule enters the rules pages only when the user confirms it. Cases: `question-repeat`, `chat-rule`, `weekly-questions`.
5. **One fact, one place, the latest value.** The card holds the job's facts, the decision, the time and the money; the Proposals row holds the text and whether it was sent. Hours, price and their breakdown change together. Cases: `drafts-run`, `chat-sync`, `update-to-4`.
6. **Every judgement names the model that made it** (`Reviewed by`, `Drafted by`, `Found by`), as the model's own context states it. Cases: `hourly-take`, `drafts-run`.
7. **Scheduled runs are silent and honest.** No text between tool calls; one report ending with `## Log`; a push only when there is something to act on; failures in the Log, never hidden. Cases: `digest-empty`, `hourly-maybe-only`, `hourly-rules-fail`.
8. **The structure follows the plugin by itself.** An older `schema` is updated in place, safely re-runnable, nothing dropped before its values are checked in their new place; an older dashboard is republished to the same link. Cases: `update-pipeline`, `update-to-4`, `update-to-6`, `hourly-auto-update`, `chat-auto-update`, `hourly-update-stopped`.
9. **A write that errors stops the work**: re-fetch, report, no retries with other escaping. No case yet.
10. **Jobs are judged on Opus.** The hourly run filters by title and snippet alone, against the rules' "reject on sight" items, and hands every survivor to the Opus subagent whenever it has the Agent tool, without opening a job page or writing a card itself (*Decisions* → *Two models*). Cases: `hourly-handoff`, `hourly-take`.

## Decisions

Choices the user made or confirmed. A request that goes against one is raised with the user before anything changes.

- **Notion is the source of truth, the rules are pages in it.** The user changes Search rules and the Proposal guide from any device, and the agent writes a rule back only once the user confirms it.
- **Two models.** The scheduled search, title filter, digests and weekly review run on Sonnet; everything that decides or writes about a job — assessment, estimate, advice, proposals — on Opus (the hourly run's subagent with `model: "opus"`, the drafts task set to Opus). On the same 22 postings Sonnet dropped a borderline lead without asking, missed the user's flags and put about 40% more hours on the cards; its proposals drift from the guide. So whenever the hourly run has the Agent tool, every posting past the title filter goes to the Opus subagent, and the run itself never opens a job page, judges a posting on its full text or writes a card; it assesses on its own model only with no Agent tool at all, or after a subagent that failed and returned nothing.
- **Which model did it is recorded**, from the model's own context, never from what was asked for: the user checks that the work they pay Opus for is done by Opus.
- **A push only for news**: a Take or an invitation from the hourly run, cards for a digest, open questions for the weekly review; the drafts task never pushes. A push saying "nothing new" 24 times a day trains the user to ignore the pipeline. The report is still written every run, in the task's chat.
- **Questions wait for the weekly review**: they never appear in run reports or digests.
- **Apply is for a fair job with a decent client**, not only a perfect match: the user wants work and income.
- **Auto skip**, with `auto_drafts` and `auto_skip` on, skips every New card advised Skip that is not `Locked`. `Locked` covers the jobs the user asked Claude to write for and every invitation, since there the user decides; only the user clears it. A manual skip needs no reason.
- **Every pending invitation gets a card**, flagged `invited` and locked, and is pushed with the hourly run that finds it.
- **Price and time live only on the card**; the Proposals row is the text and the fact of sending, one row per job in its last version, which after sending is what Upwork stored. The price sent becomes the card's `My $`.
- **A plugin update brings the pipeline up by itself**: installing the newer plugin is the user's go, so an update never needs a second step; the next hourly run does it instead of its search, or a conversation that gets there first.
- **An older dashboard is republished without asking** (project-tracker offers it instead): the newer page is part of the update the user installed, and an old page can misread what the new skill writes. A pipeline with no dashboard gets one offer per conversation until the user declines.
- **One Claude chat per job**, opened from the dashboard and kept on the card's `Chat`. On the phone and the web it opens in `chat_project`, by default the project the skill was set up or updated from, written by the first conversation that finds the line missing.
- **A code block only for what the user pastes into Upwork as it is**: the proposal text and each milestone's description. Everything else in chat is plain text, which reads on a phone; a code block's copy button makes pasting one tap.
- **`replace_content` only on a Proposals row's body**, which is rewritten whole; every other page is edited a line at a time.
- **A dashboard chat claims its job before a due pipeline update**, as project-tracker's chats do, so a second click on the job opens the same chat while the update runs.
- **An unread message keeps a chat in Your move**, whatever its summary says, even a teammate's note shared for information: a message the user has not read is theirs to look at. Once read, the summary decides.
- **Chat summaries and parks are shared across devices** (the artifact's `db`), so a phone and a laptop show the same chat as parked or waiting.
- **In a group chat or a direct message, the user's turn is what the thread asks of them**: a message from another freelancer or a file shared for information is not their move.
- **The user's language for everything written to them; proposals in the posting's language**; the structure stays English, since the modes and the dashboard find things by those names.

## Where things live

| File | Owns |
|---|---|
| `SKILL.md` | trigger; words; the config keys; pages and databases with their columns; card status, `Locked`, *Which model*; the rules that protect the user; finding the root and a job; questions and quirks; *Chat project* (every conversation may have to set it, so it stays where every session reads it); the modes table; *Pipeline update* (who starts it); automatic mode (silence, report, Log, push); Notion call shapes |
| `references/hourly.md` | the hourly run: queue and watermark, search, stage 1, chunks and the hand-off, catch-up, auto skip, version check, the report and its push |
| `references/assess.md` | stage 2, job pages and their pacing (`JOB_PAGES_PAUSE`, `DEFERRED`), the card's columns and body, the run row, the return to the hourly run |
| `references/drafts.md` | advice, the proposal row's columns and body, the drafts task's report |
| `references/chat.md` | everything in a conversation: fresh data first, the two kinds of card made in chat, a look at a posting, "details N", a job's chat from the dashboard, statuses, the proposal package and sending, connects, rules said in chat |
| `references/sync.md` | sent proposals into Proposals, the sync watermark |
| `references/digest.md`, `references/weekly.md` | their reports and pushes |
| `references/setup.md` | a new or adopted pipeline: profile, pages, databases and views, config, scheduled tasks, the final check |
| `references/dashboard.md` | when the dashboard is published or updated, how, with which capabilities and placeholders |
| `references/update.md` | the in-place update from each older schema |
| `assets/dashboard.html` | the dashboard page (`docs/dashboard-design.md`) |

## Exceptions

Where this plugin departs from `docs/skill-development.md`, and why.

- **§3.9, compatibility in one place**: besides `references/update.md`, the skill keeps one-line notes on old shapes a mode still meets in a live pipeline — cards made before schema 7 with a fifth body section, a config in a callout instead of a toggle, a sent Proposals row whose `Proposal ID` is `unknown` (`references/sync.md` §2), a whole-number `dashboard_version` (`references/dashboard.md` → *When*) — since those rows and lines are never converted and the mode must read them.
- **§4.4, propose then write**: the pipeline update and the dashboard republish go ahead without asking (*Decisions*); `chat_project` is written by the first conversation that lacks it, with one closing line saying so.

## Checking a change

Beyond `docs/skill-development.md` §7:

- **Evals**: two groups on two models, `routine` on Sonnet and `proposal` on Opus (`evals/README.md`); a change to `SKILL.md` runs both.
- **Dashboard**: `tests/check_dashboard.py` checks that the page carries every placeholder `references/dashboard.md` → *Publish* fills, and no other — a missing one leaves the page reading nothing, an unknown one is published as is.
