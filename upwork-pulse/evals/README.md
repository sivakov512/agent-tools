# Evals

`claude plugin eval` suite for the `upwork-pulse` plugin: every mode, with Notion and Upwork replaced by mock servers, so nothing touches a real workspace or account.

Run from `upwork-pulse/`:

```
claude plugin eval . --tag routine   --model sonnet --judge-model sonnet --runs 1 --ablation none --trust-plugin -j 2 --no-publish
claude plugin eval . --tag proposal  --model opus   --judge-model sonnet --runs 1 --ablation none --trust-plugin -j 2 --no-publish
```

- Two groups because two models do the work: `routine` (everything but proposals and drafts) runs on Sonnet, what the scheduled tasks use; `proposal` (chat proposals and the drafts mode) runs on Opus, what proposals and drafts are written with. `--judge-model sonnet`: the default Haiku judge is too noisy on these rubrics.
- One case: `--case hourly-take` (one `--case` per run; `--case` and `--tag` together match nothing). By mode: `--tag hourly` (hourly, digest, weekly, chat, setup, drafts, negative).
- 32 cases, roughly 15 minutes at `-j 3`.

What is checked:

- **Guards on every case** — no Notion SQL / rows queries; no Upwork submission (`confirm_preview`) ever; no `replace_content` on the root, the rules pages, Run state or a card (only a Proposals row may be rewritten whole); the skill was loaded.
- **Per mode** — the exact Notion and Upwork calls (which database, which id, which property) via `tool_used` graders, plus an LLM judge over the final message for format and silence.
- **Proposals, schema 6 and the job's chat** — `drafts-run` (as the hourly run's subagent with auto skip on: one Apply written as a Proposals row: `State` Ready, no price, connects or send columns on the row — the price and hours go to the card with the advice — the body in the fixed sections with the guide's intro line, no `## Rate` section, no copied markdown escapes; one gone posting advised Skip with a reason and no proposal, left New — skipping is the hourly run's job — and no `Locked` written; one older card picked up by the catch-up); `hourly-take` checks the card is written as columns (country, duration, rate range, hires) and none of the old text columns; the digests and `chat-sync` write what was sent as a new Proposals row (`pr-7701`, no `State`) with the card Applied and the price sent (1500) in its `My $`, and skip `pr-7690`, which is already there; `chat-proposal` writes the package to Proposals; `chat-skip` checks `Skipped by` manual with a reason; `update-pipeline` runs on a schema-1 workspace (the update in place, on the user's "update the pipeline": Proposals added, job columns added and filled from the old text columns — checked on two cards — the old columns dropped only after that, nothing copied, config and Run state updated). `update-to-4` runs the 3 → 4 update on the shared workspace with the sent row still holding `Rate` 55: the price and `Decided on` go to the card, the row loses `State` and gets `Written`, the open draft's price is not copied over the card's, `Rate` and `Sent on` are dropped, both views filter on `Proposal ID`, `schema: 5` written, the `updating` lock taken first. Nobody asks for the update in `hourly-auto-update` and `chat-auto-update` (same schema-3 workspace): the hourly run takes the lock, converts, drops, writes `schema: 6` and pushes, without searching, moving the watermark or logging a run; a chat about the Take list updates first and then answers. `hourly-update-stopped`: the config holds an `update_error` — the hourly run writes nothing, changes no columns, does not search and does not push. `drafts-rewrite-skip`: the dashboard's Rewrite on a card whose posting is gone, with auto skip on — Skip advice and `Advised on`, the card stays New and gets `Locked`, the old proposal goes back from Writing to Ready untouched, no preview, no catch-up; the job comes in the run's payload, as the dashboard sends it. `drafts-request-only` is the same run with no payload at all: the task finds the request from the Writing row alone. `chat-sync` also turns an open draft into the sent proposal instead of adding a second row. The updates go on to schema 6 in the same run: `update-to-4`, `hourly-auto-update`, `chat-auto-update` and `update-pipeline` also check that the `Chat` and `Locked` columns are added. Schema 7 (the `Estimate` column): `hourly-take` checks the card's `Estimate` breakdown and the report's `## Log`; `hourly-maybe-only` reports with a Log but pushes nothing; `drafts-run` writes `Estimate` with the price and hours in one call and never edits a card's body; the update cases add the column and write `schema: 7`. `update-to-6`: a chat on a schema-5 workspace updates first — `Locked` added, and checked on the card advised Skip that has a Proposals row (the user's own request) and on the invited card, not on a card advised Skip without one; nothing is skipped by the update. `hourly-auto-skip`: auto proposals and auto skip on, two New cards advised Skip days ago — the unlocked one is skipped (auto, with the advice as the reason), the locked one stays whatever its advice. `job-chat` opens the chat the dashboard starts for #000101: the card's `Chat` gets this session's link (given in the case's system prompt, as Cowork gives it), the posting is fetched fresh, nothing is sent; `job-chat-taken` is the same with `Chat` already holding another session — no write, and the reply points to that chat. `hourly-invite`: a pending invitation for a job outside the search window — the run reads the invitations, fetches the job, writes a card for it flagged `invited`, and the message lists it marked invited. The shared Upwork mock has no pending invitations. `chat-project-default`: a chat inside a project (its id given in the case's system prompt, as Cowork gives it) on a config with no `chat_project` line writes that project there; `chat-project-change`: the line says `none` and the user asks for this project — it is written. Every other mock's config has `chat_project: none`, so the other cases write nothing for it; `setup-empty` (no project) writes `none`.
- `unrelated` — a question that has nothing to do with Upwork must not touch Notion.

Layout:

```
evals/
├── mocks/notion/          the shared fake workspace: an existing schema-6 pipeline (drafts and auto skip off) with rules pages, four cards, one sent proposal (for #000102), one run, one open question
├── mocks/upwork/          the shared fake Upwork: three fresh postings (a Take, a stage-1 reject, a Maybe), the postings behind cards #000101 and #000104, and two own proposals (one for #000104, still New in Notion)
├── <case>/prompt.md       what the user or the scheduled task says; frontmatter: date/time, tools, runs
├── <case>/graders/*.md    checks
└── <case>/mocks/…         case-specific fakes (Maybe-only feed; a feasibility-study posting; a rules page that fails to load; an empty workspace; a pipeline without a config; a schema-1 pipeline; a schema-3 one with the old Proposals columns, and the same with an `update_error`; a card whose `Chat` already holds another session; a config with no `chat_project` line; drafts and auto skip on with a fifth card whose posting is gone)
```

## Keeping the suite honest

A grader file with no frontmatter is skipped without a word, so a case can pass while checking nothing. Before trusting a green run: `find evals -name '*.md' -size 0` must print nothing. Regex graders match the tool input as JSON text, where quotes are escaped — match `Job ID`, not `"Job ID"`.

## Silent runs

Sonnet cannot reliably end a run with an empty reply, and when the reply is empty the harness shows the run's last progress note instead. On Cowork this is harmless — the push comes only from an explicit `PushNotification` call, never from the reply. So silent cases have no "silent" judge: they check that the push tool was not loaded and, with regexes, that no run report, digest header or card leaked into the reply.

## Reading failures

The agent, the mocks and the judge are all models; one run can fail for reasons unrelated to the skill. Read the trace first, re-run the case (`--case <name> --runs 3`), and change the skill only for failures that repeat or that would damage data — with a general rule and its reason, not a patch for the one example. The LLM judge itself misfires: `setup-adopt` and `chat-proposal` have failed on replies that meet every claim when re-judged by hand; check the reply against the rubric before touching the skill.

Known unstable on Sonnet, one run in two or three: `chat-auto-update` (Sonnet usually answers and asks for "update the pipeline" instead of updating unasked, because the update drops columns — the next hourly run does it anyway; on Opus, which chats run on, it updates); `question-repeat` (the case is decided without recording a question, or a second row instead of bumping `Seen`); `setup-adopt` (a `<root>` placeholder left in the hand-made task table); `setup-empty` (the watermark takes the machine date instead of the case's date; or, without a task tool, the reply says the tasks are missing but leaves out the table of prompts). The LLM judge on `setup-adopt` and `chat-proposal` fails replies that pass every claim when re-judged by hand.

## Pushes

The eval harness disallows `PushNotification`, so a case cannot see the push itself. Cases with a message check that the run loads the tool (`ToolSearch` for `PushNotification`); silent cases check that it does not. Whether the push reaches the phone is checked live.
