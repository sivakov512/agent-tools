# Evals

`claude plugin eval` suite for the `project-tracker` plugin: every user scenario, with Notion (and mail / Upwork where needed) replaced by mock servers, so nothing touches a real workspace.

Run from `project-tracker/`:

```
claude plugin eval . --runs 1 --ablation none --scaffold --trust-plugin --judge-model sonnet -j 2 --no-publish
```

- One case: `--case progress`. By tag: `--tag create` (create, update, dates, tasks, problems, notes, state, plan, corrections, read, contracts, commands, setup, upgrade, chat, routine, negative).
- `--model sonnet` pins the model under test. `--judge-model sonnet`: the default Haiku judge is too noisy on these rubrics.
- One full run is 49 agent runs, about half an hour at `-j 2` and roughly $25 of API usage (`--runs 3` for a stability check triples that). Raise `-j` only on a machine with spare cores and memory — too many parallel runs get killed and show up as harness errors, not as failures.
- `--scaffold` is needed for `new-from-file` (its `scaffold.sh` writes the estimate file into the sandbox) and `client-dashboard-refresh` (its `scaffold.sh` writes the published page and `data.js` where the Artifact mock's `read` says it saved them, the page's first line copied from `assets/client.html`, so the case stays a `data.js`-only refresh after every release).

What is checked:

- **Guards on every case** — no Notion SQL / rows queries, no tab icons, no `replace_content`, the skill was loaded (not on the two cases that invoke it as `/project-tracker:project-tracker`, where its text is injected instead of loaded by a tool call); on update cases also no escaped markup.
- **Per scenario** — the exact Notion writes (which page, which property, which dates) via `tool_used` graders, plus an LLM judge over the mock calls or the final message for the parts regexes cannot pin down.
- `unrelated` — a question that has nothing to do with projects must not touch Notion.
- `upgrade-detect` — a workspace with only a 0.x tracker (config with `open_items`): the agent must not write to it and must offer the upgrade.
- `schema-update` — the shared workspace as release 1.0.0 built it (no `schema` line, no `Order`, no `Client dashboard`, problems with `Note`, page bodies without headings, project notes in a `Notes` tab): the agent brings it to schema 4 without asking — adds `Order`, numbers the rows, re-sorts the views, writes `schema: 2`; adds `Client dashboard`, writes `schema: 3`; renames `Note` to `Summary`, puts `## Notes` / `## History` in front of the existing entries, moves the `Notes` tab's entries below `</tabs>` and drops the tab, writes `schema: 4` last — then answers the status question.
- `description-checklist`, `private-note`, `checklist-tick` — the page parts: a checklist inserted at the start of a task page with no heading of its own; a note "for myself" placed under a new `## Private notes` heading before `## History`; a checklist item ticked in place plus a history line at the end.
- `client-dashboard-*` — the client's `data.js` carries each page's public text (`page`: description, `## Notes`, `## History`) and `Summary`, never `## Private notes` (the shared workspace has one on the Energy meter page to check this) or internal fields.
- `reorder` — "Hardware comes before Firmware — swap them": `Order` is renumbered without a preview, the dates stay, and the reply offers to move them because they now contradict the order.

Layout (callout, tabs, views) is checked structurally here but a mock cannot render Notion; after changing the page markup, also run the skill once against a scratch page in a real workspace and look at it.

Layout:

```
evals/
├── mocks/notion/          the shared fake workspace (_server.md, below)
├── <case>/prompt.md       what the user says; frontmatter: turns, allowed tools, runs, tags, today (append_system_prompt)
├── <case>/graders/*.md    checks
└── <case>/mocks/…         case-specific fakes (empty and half-built trackers for setup; a moved plan for undo; a 0.x tracker for upgrade-detect; a schema-1 tracker in the old page layout for schema-update; a task with a checklist for checklist-tick; a published `data.js` for client-dashboard-refresh / -remove; a task that already has a chat for dashboard-chat-taken / -new; mail; Upwork)
```

## The shared workspace

`mocks/notion/_server.md` is a schema-4 tracker (config line `schema: 4`; `Client dashboard` empty everywhere; every milestone and task has `Order`, 1, 2, … in the order listed below; problems carry `Summary`; every page is laid out in parts — history under `## History`, the Energy meter page's note under `## Notes` and one private note under `## Private notes`, below its four tabs): root page **Client work** (`10000000-…-0001`) with the config toggle and four tabs, plus a decoy page with another tool's config callout. Today in it is Fri 2026-10-09. Ids graders match on:

| What | Ids |
|---|---|
| Data sources | projects `20000000-…-0001`, milestones `…0002`, problems `…0003`, tasks `…0004` (problems kept the old Issues id, tasks are new) |
| Root views | Projects `Active` `50000000-…-0001`, `Closed` `…0009`; Milestones `Next up` `…0002`, `Timeline` `…0003`; Problems `Open` `…0004`, `Recently resolved` `…0005` (last 30 days); Tasks `All` `…0008` (default; open tasks), `Waiting on` `…0006`, `Timeline` `…0007` |
| Energy meter (`30000000-…-0010`, Northwind, Origin Direct) | milestones `0110` Firmware on the dev board (In progress, Sep 15 → Nov 13), `0111` Hardware (Planned, Nov 13 → Jan 8); tasks `0101`–`0104` under 0110 (0101 Done, 0102 Real readings In progress → Oct 9, 0103 Sleep modes Oct 9 → Nov 6, 0104 Power measured), `0105`–`0106` under 0111; Waiting tasks `0201` CI runner set up (Marko), `0202` RFQ reviewed (Northwind), `0203` Invoice received from Acme (Acme); `0205` Laboratory found (Planned, no dates); problems `0204` Holiday shutdown window (Risk, Open) and `0206` Zigbee binding error (Blocker, Resolved Oct 2) |
| Brightbrush (`30000000-…-0020`, Upwork contract, Origin Upwork) | milestones `0301` Schematic (Done), `0302` Layout (In progress → Oct 20), `0303` Firmware (Planned, Oct 20 → Nov 10); Waiting task `0401` Firmware spec approved by Brightbrush Ltd (Brightbrush Ltd) under 0303 |
| Project page view blocks | Energy meter `60000000-…-0011` Plan, `…0012` Tasks, `…0013` Schedule, `…0014` Problems (views `70000000-…` with the same suffix; block `…0012` also holds the timeline view `…0015`); Brightbrush `…0021`–`…0024` (timeline `…0025`) |

The config carries `dashboard` and `dashboard_version: 99.0.0` so the once-per-conversation dashboard offer stays out of the final messages the graders read.

## Reading failures

The agent, the mock Notion and the judge are all models, so one run can fail for reasons that have nothing to do with the skill — a mock answering with an error real Notion would not give, a judge reading a claim too strictly. Before changing the skill because of a failure:

1. Read the trace (`tracePath` in the result, or the report) — what did the agent actually do, and what did the mock answer?
2. Re-run that case a few times (`--case <name> --runs 3`). A failure that does not repeat is noise.
3. Change the skill only for failures that repeat or that would damage data, and fix them with a general rule and its reason, not a patch for the one example.

