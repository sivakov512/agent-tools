# Evals

`claude plugin eval` suite for the `project-tracker` plugin: every user scenario, with Notion (and mail / Upwork where needed) replaced by mock servers, so nothing touches a real workspace.

Run from `project-tracker/`:

```
CLAUDE_CODE_DISABLE_AUTO_MEMORY=1 claude plugin eval . --model sonnet --judge-model sonnet --runs 1 --ablation none --scaffold --trust-plugin --allow-tools Write -j 2 --no-publish
```

- One case: `--case progress`. By tag: `--tag create` (create, update, dates, tasks, problems, notes, state, plan, corrections, read, contracts, commands, setup, upgrade, chat, routine, negative, ids).
- `--model sonnet`: the model the suite is kept passing on. `--judge-model sonnet`: the default Haiku judge is too noisy on these rubrics.
- One full run is 69 agent runs, about half an hour at `-j 2` and roughly $25 of API usage (`--runs 3` for a stability check triples that). Raise `-j` only on a machine with spare cores and memory — too many parallel runs get killed and show up as harness errors, not as failures.
- `--allow-tools Write`: the harness grants Write only on the operator's word, and the cases that write a dashboard folder or a draft (`client-dashboard-*`, `dashboard-update-migrates`, `report-email`) list it in `allowed_tools`; without it their Write graders cannot pass.
- `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` (from the shell: a case may set only `EVAL_*` variables): with Claude Code's auto-memory on, the agent takes "note for myself …" or "I told you …" to its own memory folder, which the sandbox denies, instead of loading the skill.
- `--scaffold` is needed for `new-from-file` (its `scaffold.sh` writes the estimate file into the sandbox) and `client-dashboard-refresh` (its `scaffold.sh` writes the published page and `data.js` where the Artifact mock's `read` says it saved them, the page's first line copied from `assets/client.html`, so the case stays a `data.js`-only refresh after every release).

What is checked:

- **Guards on every case** — no Notion SQL / rows queries, no tab icons, no `replace_content`, the skill was loaded (not on the two cases that invoke it as `/project-tracker:project-tracker`, where its text is injected instead of loaded by a tool call); on update cases also no escaped markup.
- **Per scenario** — the exact Notion writes (which page, which property, which dates) via `tool_used` graders, plus an LLM judge over the mock calls or the final message for the parts regexes cannot pin down.
- `unrelated` — a question that has nothing to do with projects must not touch Notion.
- `schema-newer` — the shared workspace with `schema: 8`, newer than the skill: "TSK-3 is done" writes nothing, and the reply says the plugin needs updating.
- `upgrade-detect` — a workspace with only a 0.x tracker (config with `open_items`): the agent must not write to it and must offer the upgrade.
- `schema-update` — the shared workspace as release 1.0.0 built it (no `schema` line, no `Order`, no `Client dashboard`, problems with `Note`, page bodies without headings, project notes in a `Notes` tab): the agent brings it to schema 7 without asking — adds `Order`, numbers the rows, re-sorts the views, writes `schema: 2`; adds `Client dashboard`, writes `schema: 3`; renames `Note` to `Summary`, puts `## Notes` / `## History` in front of the existing entries, moves the `Notes` tab's entries below `</tabs>` and drops the tab, writes `schema: 4`; adds `Ref` to every database (`UNIQUE_ID PREFIX 'PRJ'` / `'MLS'` / `'TSK'` / `'PRB'`; the mock numbers the existing rows itself, as Notion does), shows it in the root views, writes `schema: 5`; adds `Code session` to every database and `Code folder` to Projects, writes `schema: 6`; finds nothing to rename (the `Ref` columns already have the new prefixes), writes `schema: 7` last — then answers the status question. The order is checked by regex graders on the mock calls (`target: 'mock_calls'`): the six numbers in sequence, and no step's write after its number.
- `dashboard-update-migrates` — the shared workspace at `schema: 4` (no `Ref` anywhere) with a dashboard published from 1.0.0, and the user asks only to update the dashboard: the agent runs the 4 → 5, 5 → 6 and 6 → 7 updates first (the four `Ref` columns with the new prefixes, the root views showing `Ref`, `schema: 5`; the `Code session` and `Code folder` columns, `schema: 6`; `schema: 7` last), all of it before any Artifact `publish`; the reply names the update in one line and says plainly where the dashboard stands. The case checks the order, not the copy: without a shell the republish (**Publish** step 1) may stop short, which passes; a publish, if made, must go to the same URL.
- `ref-prefix-taken` — the shared workspace at `schema: 4`, but Tasks already has `Ref` (prefix `TK`, added by hand) and `PRJ` is taken elsewhere in the Notion workspace (prefixes are workspace-wide): the mock refuses any `Ref` with the prefix `PRJ` with the real `409 conflict_error` *Unique ID prefix is already in use*. The agent takes `PRJ2` on Projects, `MLS` and `PRB` on the others, leaves Tasks' `Ref` alone at 4 → 5 and renames it to `TSK` at 6 → 7 (`ALTER COLUMN`, the numbers kept), writes `ref_prefixes: PRJ2, MLS, TSK, PRB` and `schema: 7` last; the reply names `PRJ2` and why in a line and still answers the status question. The order is checked by regex graders on the mock calls: no `Ref` column added or view changed after `schema: 5`, no `ref_prefixes` and no prefix change after `schema: 7`, `schema: 5`, `6`, `7` in sequence.
- `schema-update-7` — the shared workspace as schema 6 left it (`PR` / `MS` / `TK` / `PB`, no `ref_prefixes` line): the agent renames the four prefixes in place (`ALTER COLUMN "Ref" SET UNIQUE_ID PREFIX 'PRJ'` / `'MLS'` / `'TSK'` / `'PRB'`, no new column, no row written), writes `ref_prefixes: PRJ, MLS, TSK, PRB`, `ref_prefixes_before: PR, MS, TK, PB` and `schema: 7` last; the reply says the IDs have three letters now and answers with the new ones.
- `ref-old-prefix` — `ref-lookup` on a tracker whose config keeps `ref_prefixes_before: PR, MS, TK, PB`: "TSK-4 is done" closes TSK-4 and the reply names it `TSK-4`.
- **Propose, then write** (SKILL.md) — news without an instruction is put to the user first and written on their yes. A case can only send one message, so the cases that check what gets written end their news with `Update the tracker.`, a general go-ahead: the rules still decide what is written, the agent just does not stop to ask. `propose-first` is the same news as `task-done` without it: nothing may be written, and the last message must propose TSK-3 → Done with its history line and ask.
- `exchange-settles` — the RFQ went to Northwind for review today (its history line is dated Oct 9) and the review comes back the same day: the agent rewrites that line into the outcome instead of adding a second one, and closes the task. The wait did not matter, so one entry is left (SKILL.md → **What is worth writing**).
- `note-placement`, `note-placement-asked` — where a record goes: a reimbursed expense told in a chat opened from the task TSK-2 is noted on its milestone MLS-1, under `## Notes` (the client pays it back), with only the facts that matter (the courier back-and-forth left out), and the reply says where and why; the same expense with the user naming the task is not written until the user answers the suggestion to keep it on the milestone.
- `description-checklist`, `private-note`, `checklist-tick` — the page parts: a checklist inserted at the start of a task page with no heading of its own; a note "for myself" placed under a new `## Private notes` heading before `## History`; a checklist item ticked in place plus a history line at the end.
- `client-dashboard-*` — the client's `data.js` carries each page's public text (`page`: description, `## Notes`, `## History`) and `Summary`, never `## Private notes` (the shared workspace has one on the Energy meter page to check this) or internal fields.
- `ref-lookup`, `ref-link`, `ref-unknown` — rows named by ID: "TSK-4 is done" closes *Power measured, module fixed* (not the In-progress task, not the milestone MLS-4); "Link PRB-1 to TSK-6" sets the risk's `Task` to *First prototype working on the custom board*, not the *Board designed* task its text suggests (its own mock: the risk has no task yet); no other row changes, and the reply leads the changed item with its ID. "TSK-40 is done" names no row: the agent asks and writes nothing.
- `milestone-end-offered` — the user sets TSK-4's end to Nov 20, past its milestone MLS-1's end (Nov 13): TSK-4's dates are written at once (an instruction), MLS-1's stay, and the reply offers to move the milestone's end (SKILL.md → **Dates are the user's**).
- `view-escaped` — view rows come markdown-escaped, as from real Notion (`Acme\_Labs`): TSK-10 is set to wait on whom TSK-9 waits on, written plain (`Acme_Labs`), with no backslash copied back (SKILL.md → **Text read from a view is markdown-escaped**).
- `waiting-shared` — "Marko and I still have to decide together whether to move the meter from Zigbee to Thread": a Question problem, `Status` Open, `Waiting on` empty (part of the move is the user's), Marko named in its description (SKILL.md → **`Waiting on` says who moves next**).
- `waiting-agent` — "I've handed the sleep modes task over to Claude": TSK-3 gets `Waiting on` Claude, since an agent working on an item is a party like any other, and a history line; no row is created.
- `code-session-claim`, `code-session-folder-mismatch`, `code-session-taken`, `dashboard-chat-code-kept` — a row's two threads (`references/chats.md`). A Code session started from the dashboard (its first message says `Code session`; a mock `get_session` gives its link, and its folder is the workspace, a git repository its `scaffold.sh` builds):
  - `code-session-claim`: it writes its link to TSK-3's `Code session`, never `Chat`, and names itself `TSK-3 … — Energy meter`. The workspace's remote (`git@git.example.com:hw/energy-meter.git`) names the project's `Repository` in another form, so it fills Energy meter's empty `Code folder` with that folder.
  - `code-session-folder-mismatch`: the same, but the remote is another repository, so `Code folder` stays empty and the reply asks where the project's code lives.
  - `code-session-taken`: a session on a row whose `Code session` holds another link writes nothing and points to it.
  - `dashboard-chat-code-kept`: a Cowork chat on a row that has a Code session writes `Chat` only.

  The two `Code folder` cases need Bash for git, so they run through `scripts/eval.sh` with `--allow-tools Bash Write` (`alter-ego/evals/README.md` says why); without Bash the agent cannot read the remote and asks, so `code-session-claim` fails.
- `reorder` — "Hardware comes before Firmware — swap them": `Order` is renumbered without a preview, the dates stay, and the reply offers to move them because they now contradict the order.

Layout (tabs, views) is checked structurally here but a mock cannot render Notion; after changing the page markup, also run the skill once against a scratch page in a real workspace and look at it.

Layout:

```
evals/
├── mocks/notion/          the shared fake workspace (_server.md, below)
├── <case>/prompt.md       what the user says; frontmatter: turns, allowed tools, runs, tags, today (append_system_prompt)
├── <case>/graders/*.md    checks
└── <case>/mocks/…         case-specific fakes (empty and half-built trackers for setup; a moved plan for undo; a 0.x tracker for upgrade-detect; a schema-1 tracker in the old page layout for schema-update; a schema-4 tracker and its 1.0.0 dashboard for dashboard-update-migrates; a schema-4 tracker whose Tasks already has `Ref` and whose workspace already uses `PRJ` for ref-prefix-taken; a schema-6 tracker with the old prefixes for schema-update-7; a config with `ref_prefixes_before` for ref-old-prefix; a risk with no task for ref-link; a task with a checklist for checklist-tick; a published `data.js` for client-dashboard-refresh / -remove; the Zigbee fix resolved on Oct 6, inside the week, for report-email; a task that already has a chat for dashboard-chat-taken / -new; a task that already has a Code session for code-session-taken and dashboard-chat-code-kept; the desktop app's `get_session` and `set_session_title` for code-session-claim / -taken / -folder-mismatch, with a git repository built by `scaffold.sh` for -claim and -folder-mismatch; the desktop app's `set_session_title` for dashboard-chat (the chat names itself by the message's `Chat title`) and -taken; mail; Upwork)
```

## The shared workspace

`mocks/notion/_server.md` is a schema-7 tracker (config lines `ref_prefixes: PRJ, MLS, TSK, PRB` and `schema: 7`; `Chat`, `Code session` and `Code folder` empty everywhere; every row has `Ref` — the IDs below — which view queries return as the bare number (`"Ref":"4"`) and page fetches with the prefix (`"Ref":"TSK-4"`), as real Notion does; `Client dashboard` empty everywhere; every milestone and task has `Order`, 1, 2, … in the order listed below; problems carry `Summary`; every page is laid out in parts — history under `## History`, the Energy meter page's note under `## Notes` and one private note under `## Private notes`, below its four tabs): root page **Client work** (`10000000-…-0001`) with the config toggle and four tabs, plus a decoy page with another tool's config callout. Today in it is Fri 2026-10-09. Ids graders match on:

| What | Ids |
|---|---|
| Data sources | projects `20000000-…-0001`, milestones `…0002`, problems `…0003`, tasks `…0004` (problems kept the old Issues id, tasks are new) |
| Root views | Projects `Active` `50000000-…-0001`, `Closed` `…0009`; Milestones `Next up` `…0002`, `Timeline` `…0003`; Problems `Open` `…0004`, `Recently resolved` `…0005` (last 30 days); Tasks `All` `…0008` (default; open tasks), `Waiting on` `…0006`, `Timeline` `…0007` |
| Refs | projects Energy meter PRJ-1, Brightbrush PRJ-2; milestones 0110 MLS-1, 0111 MLS-2, 0301–0303 MLS-3–MLS-5; tasks 0101–0106 TSK-1–TSK-6, 0201 TSK-7, 0202 TSK-8, 0203 TSK-9, 0205 TSK-10, 0401 TSK-11; problems 0204 PRB-1, 0206 PRB-2 |
| Energy meter (`30000000-…-0010`, Northwind, Origin Direct) | milestones `0110` Firmware on the dev board (In progress, Sep 15 → Nov 13), `0111` Hardware (Planned, Nov 13 → Jan 8); tasks `0101`–`0104` under 0110 (0101 Done, 0102 Real readings In progress → Oct 9, 0103 Sleep modes Oct 9 → Nov 6, 0104 Power measured), `0105`–`0106` under 0111; Waiting tasks `0201` CI runner set up (Marko), `0202` RFQ reviewed (Northwind), `0203` Invoice received from Acme (Acme); `0205` Laboratory found (Planned, no dates); problems `0204` Holiday shutdown window (Risk, Open) and `0206` Zigbee binding error (Blocker, Resolved Oct 2) |
| Brightbrush (`30000000-…-0020`, Upwork contract, Origin Upwork) | milestones `0301` Schematic (Done), `0302` Layout (In progress → Oct 20), `0303` Firmware (Planned, Oct 20 → Nov 10); Waiting task `0401` Firmware spec approved by Brightbrush Ltd (Brightbrush Ltd) under 0303 |
| Project page view blocks | Energy meter `60000000-…-0011` Plan, `…0012` Tasks, `…0013` Schedule, `…0014` Problems (views `70000000-…` with the same suffix; block `…0012` also holds the timeline view `…0015`); Brightbrush `…0021`–`…0024` (timeline `…0025`) |

The config carries `dashboard` and `dashboard_version: 99.0.0` so the once-per-conversation dashboard offer stays out of the final messages the graders read.

## Reading failures

`docs/skill-development.md` §7. What is particular to this suite: the mock Notion is a model too, and may answer a call with an error real Notion would not give — read its answer in the trace before blaming the skill. Three limits of the harness (2.1.304) that look like skill failures:

- **The date.** Claude Code puts the machine's date into the agent's context and nothing pins it (`CLAUDE_CODE_OVERRIDE_DATE` has no effect), so the cases pin Oct 9 in `append_system_prompt`, and the skill takes the date the session states as today (SKILL.md → **Today is the conversation's date**).
- **Long traces.** An `llm` grader with `focus: 'trace'` sees only a trace's first and last 12 events, and a long run's tool results fall in between. A judge that must check a reply against the data gets that data in its rubric and reads `last_message`, as `report`'s `facts` does.
- **One-word judges.** The harness asks each judge for exactly PASS or FAIL and counts a vote as PASS only when the word FAIL is nowhere in it, so a rubric never asks the judge to explain or name what it found: an explained PASS can be scored FAIL.

Add `--keep-temp` to a run whose failure you will need to read: without it the harness deletes each run's trace, and the results keep only the mock calls and the judges' votes.

Known unstable cases: none recorded.
