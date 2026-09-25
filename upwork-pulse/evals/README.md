# Evals

`claude plugin eval` suite for the `upwork-pulse` plugin: every mode, with Notion and Upwork replaced by mock servers, so nothing touches a real workspace or account.

Run from `upwork-pulse/`:

```
claude plugin eval . --tag routine   --model sonnet --judge-model sonnet --runs 1 --ablation none --trust-plugin -j 2 --no-publish
claude plugin eval . --tag proposal  --model opus   --judge-model sonnet --runs 1 --ablation none --trust-plugin -j 2 --no-publish
```

- Two groups because two models do the work: `routine` (everything but proposals) runs on Sonnet, what the scheduled tasks use; `proposal` runs on Opus, what proposals are written with. `--judge-model sonnet`: the default Haiku judge is too noisy on these rubrics.
- One case: `--case hourly-take` (one `--case` per run; `--case` and `--tag` together match nothing). By mode: `--tag hourly` (hourly, digest, weekly, chat, setup, negative).
- 13 cases, roughly 15 minutes at `-j 2`.

What is checked:

- **Guards on every case** — no Notion SQL / rows queries; no Upwork submission (`confirm_preview`) ever; no `replace_content` on anything but the Run state page; the skill was loaded.
- **Per mode** — the exact Notion and Upwork calls (which database, which id, which property) via `tool_used` graders, plus an LLM judge over the final message for format and silence.
- `unrelated` — a question that has nothing to do with Upwork must not touch Notion.

Layout:

```
evals/
├── mocks/notion/          the shared fake workspace: an existing pipeline with rules pages, four cards, one run, one open question
├── mocks/upwork/          the shared fake Upwork: three fresh postings (a Take, a stage-1 reject, a Maybe) and the posting behind card #000101
├── <case>/prompt.md       what the user or the scheduled task says; frontmatter: date/time, tools, runs
├── <case>/graders/*.md    checks
└── <case>/mocks/…         case-specific fakes (Maybe-only feed; a feasibility-study posting; a rules page that fails to load; an empty workspace; a pipeline without a config)
```

## Keeping the suite honest

A grader file with no frontmatter is skipped without a word, so a case can pass while checking nothing. Before trusting a green run: `find evals -name '*.md' -size 0` must print nothing. Regex graders match the tool input as JSON text, where quotes are escaped — match `Job ID`, not `"Job ID"`.

## Silent runs

Sonnet cannot reliably end a run with an empty reply, and when the reply is empty the harness shows the run's last progress note instead. On Cowork this is harmless — task notifications are pushed only when a run has something worth reporting. So silent cases have no "silent" judge; they check with regexes that no run report, digest header or card leaked into the reply.

## Reading failures

The agent, the mocks and the judge are all models; one run can fail for reasons unrelated to the skill. Read the trace first, re-run the case (`--case <name> --runs 3`), and change the skill only for failures that repeat or that would damage data — with a general rule and its reason, not a patch for the one example. The LLM judge itself misfires: `setup-adopt` and `chat-proposal` have failed on replies that meet every claim when re-judged by hand; check the reply against the rubric before touching the skill.

Known unstable on Sonnet, one run in two or three: `question-repeat` (the case is decided without recording a question, or a second row instead of bumping `Seen`); `setup-adopt` (a `<root>` placeholder left in the hand-made task table); `setup-empty` (the watermark takes the machine date instead of the case's date). The LLM judge on `setup-adopt` and `chat-proposal` fails replies that pass every claim when re-judged by hand.
