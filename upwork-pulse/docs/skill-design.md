# Skill design

How the `upwork-pulse` skill is put together and the criteria every change is checked against — for whoever edits `skills/upwork-pulse/`. The skill does not read this file at run time. The dashboard's own spec is `docs/dashboard-design.md`.

## What the skill must do

These hold in every mode, whatever the rules pages say. The eval suite (`evals/README.md`) checks them; a change that breaks one is a bug, not a trade-off.

1. **Nothing goes to Upwork without the user's go.** Reading is free; a submission, message, boost, save or offer answer waits for an explicit "send it" about that action, in that conversation. Scheduled runs never write to Upwork (a proposal preview is a read).
2. **Notion is read through views and page fetches only**, never SQL or rows mode (a workspace quota runs out mid-day), and pages are edited a line at a time: `replace_content` only on a Proposals row's body.
3. **No posting is lost or read twice.** A watermark moves only after everything it covers is written; a run that stops early leaves it, and the next run catches up.
4. **Rules are not guessed.** A case the rules do not settle becomes at least a Maybe card and a question, never a silent reject; a rule enters the rules pages only when the user confirms it.
5. **One fact, one place, the latest value.** The card holds the job's facts, the decision, the time and the money; the Proposals row holds the text and whether it was sent. Hours, price and their breakdown change together.
6. **Every judgement names the model that made it** (`Reviewed by`, `Drafted by`, `Found by`), as the model's own context states it.
7. **Scheduled runs are silent and honest.** No text between tool calls; one report ending with `## Log`; a push only when there is something to act on; failures in the Log, never hidden.
8. **The structure follows the plugin by itself.** An older `schema` is updated in place, safely re-runnable, nothing dropped before its values are checked in their new place; an older dashboard is republished to the same link.
9. **A write that errors stops the work**: re-fetch, report, no retries with other escaping.

## Instruction criteria

What makes the instructions good, as opposed to what they make the agent do.

1. **One rule, one home.** Each rule is written in full in exactly one file; every other mention names that home (`references/assess.md` §2, `SKILL.md` → *Locked*) and says at most a clause. Two full copies drift apart.
2. **A session loads what it needs.** `SKILL.md` holds what every session needs: the trigger, the data model, the cross-mode rules and the routing table. A mode's procedure lives in its reference, loaded only by that mode. Maintainer material — UI specs, history, design notes — lives in `docs/`, never in the skill. A rule a session must act on without being asked — in every conversation, or in every run of a mode — stays in the file that session surely reads; behind a link it gets skipped (the `chat-project-default` eval failed when *Chat project* moved to `chat.md`, which a question about the Take list never opens).
3. **Every link resolves.** A named file and section exists and says what the link claims. Headings are stable: renaming one means fixing its links.
4. **No contradictions, one name per thing.** A card is a row in Jobs; a lead is a New card on the dashboard; a chunk is up to 2 hours of the hourly queue; a run is one scheduled session. Numbers (budgets, windows, limits) are stated once. Routing reads the user's own words: the arguments a skill is loaded with may paraphrase them ("write a proposal" passed on as "draft").
5. **Actionable and checkable.** Each step says what to call, with what, and when to stop; formats are given as templates; limits are numbers. A rule that looks odd carries its reason in one sentence, so a later edit does not undo it.
6. **Mode files share a shape:** what the mode is for and who starts it, its inputs, its steps, its output, what is off limits.
7. **Compatibility in one place.** What exists only for older pipelines is in `references/update.md` (and the one-line notes on old card shapes the modes need to read them); nothing else talks about history.

## Where things live

| File | Owns |
|---|---|
| `SKILL.md` | trigger; the config keys; pages and databases with their columns; card status, `Locked`, *Which model*; the rules that protect the user; finding the root and a job; questions and quirks; *Pipeline update* (who starts it); *Chat project* (every conversation may have to set it); automatic mode (silence, report, Log, push); Notion call shapes; the modes table |
| `references/hourly.md` | the hourly run: queue and watermark, search, stage 1, chunks and the hand-off, catch-up, auto skip, version check, the report and its push |
| `references/assess.md` | stage 2, job pages and their pacing (`JOB_PAGES_PAUSE`, `DEFERRED`), the card's columns and body, the run row, the return to the hourly run |
| `references/drafts.md` | advice, the proposal row's columns and body, the drafts task's report |
| `references/chat.md` | everything in a conversation: fresh data first, the two kinds of card made in chat, a look at a posting, "details N", a job's chat from the dashboard, statuses, the proposal package and sending, connects, rules said in chat |
| `references/sync.md` | sent proposals into Proposals, the sync watermark |
| `references/digest.md`, `references/weekly.md` | their reports and pushes |
| `references/setup.md` | a new or adopted pipeline: profile, pages, databases and views, config, scheduled tasks, the final check |
| `references/dashboard.md` | when the dashboard is published or updated, how, with which capabilities |
| `references/update.md` | the in-place update from each older schema |
| `assets/dashboard.html` | the dashboard page (`docs/dashboard-design.md`) |

## Dashboard code criteria

1. It does what `docs/dashboard-design.md` says, and that file is updated in the same change as the page.
2. Notion and Upwork are the source of truth. What the page derives and wants to keep — chat summaries, chats parked by hand — lives in the artifact's shared storage (`db`), so every device and every viewer sees the same; browser storage only for per-device conveniences (the drawer's width, a folded section) and for caches it can rebuild.
3. Its script parses (`node --check`), and it runs without console errors on the mock harness and on real data.
4. One function, one job; no dead code; no logic written twice; every `localStorage` access guarded; colours only from the theme tokens.
5. Calls are bounded: lists are watched, per-item reads go through the paced queue, nothing is read again that the page already knows for good.
6. When a capability is missing (no `sample`, no `db`), the page says what does not work instead of failing quietly.

## Checking a change

- **Instructions**: the eval suite, both groups (`evals/README.md`), compared with a run of the previous commit — a case that fails on both is not the change's; one that fails only after it is. Read the trace before touching the skill.
- **Links**: every `references/*.md` and `§` mention in the skill points to a section that exists.
- **Dashboard**: `node --check` on the script; the page on mock data (a copy of the page with a stub `window.claude`); then a preview artifact on the user's real data, before release — never a release the user has not seen.
