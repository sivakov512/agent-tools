# Evals

`claude plugin eval` suite for the `tracker` plugin: every user scenario, with Notion (and mail / Upwork where needed) replaced by mock servers, so nothing touches a real workspace.

Run from `project-tracker/`:

```
claude plugin eval . --runs 1 --ablation none --scaffold --trust-plugin --judge-model sonnet -j 2 --no-publish
```

- One case: `--case progress`. By tag: `--tag create` (create, update, dates, issues, notes, state, plan, corrections, read, contracts, commands, setup, negative).
- `--model sonnet` pins the model under test. `--judge-model sonnet`: the default Haiku judge is too noisy on these rubrics.
- One full run is 29 agent runs, about 20 minutes at `-j 2` and roughly $15 of API usage (`--runs 3` for a stability check triples that). Raise `-j` only on a machine with spare cores and memory — too many parallel runs get killed and show up as harness errors, not as failures.
- `--scaffold` is needed for `new-from-file` (its `scaffold.sh` writes the estimate file into the sandbox).

What is checked:

- **Guards on every case** — no Notion SQL / rows queries, no tab icons, no `replace_content`, the skill was loaded (not on the two cases that invoke it as `/project-tracker:project-tracker`, where its text is injected instead of loaded by a tool call); on update cases also no escaped markup.
- **Per scenario** — the exact Notion writes (which page, which property, which dates) via `tool_used` graders, plus an LLM judge over the mock calls or the final message for the parts regexes cannot pin down.
- `unrelated` — a question that has nothing to do with projects must not touch Notion.

Layout (callout, tabs, views) is checked structurally here but a mock cannot render Notion; after changing the page markup, also run the skill once against a scratch page in a real workspace and look at it.

Layout:

```
evals/
├── mocks/notion/          the shared fake workspace (_server.md = two projects with milestones and issues)
├── <case>/prompt.md       what the user says; frontmatter: date, tools, runs
├── <case>/graders/*.md    checks
└── <case>/mocks/…         case-specific fakes (empty and half-built trackers for setup; a moved plan for undo; mail; Upwork)
```

## Reading failures

The agent, the mock Notion and the judge are all models, so one run can fail for reasons that have nothing to do with the skill — a mock answering with an error real Notion would not give, a judge reading a claim too strictly. Before changing the skill because of a failure:

1. Read the trace (`tracePath` in the result, or the report) — what did the agent actually do, and what did the mock answer?
2. Re-run that case a few times (`--case <name> --runs 3`). A failure that does not repeat is noise.
3. Change the skill only for failures that repeat or that would damage data, and fix them with a general rule and its reason, not a patch for the one example.

