---
name: upwork-pulse
description: Runs a freelancer's Upwork job pipeline with Notion as the source of truth — scheduled search and assessment of new postings, digests, a weekly review of open rule questions, and in chat: assessing a posting, drafting a proposal and submitting it on the user's go, setting a card Skipped or Applied, connects. Use it whenever a scheduled task or the user mentions Upwork Pulse or the Upwork pipeline, its Notion pages or databases (Search rules, Proposal guide, Field notes, Jobs, Runs, Questions), the dashboard, or asks to set the pipeline up — and whenever a message is about a job posting, a proposal or a client on a freelance platform, even without the word Upwork. A job named as `#` plus six digits ("skip #584350", "what about #000101?") is a card in this pipeline, so "skip #584350, not for me", "details 3", "run the hourly search", "write a proposal for this", "mark it applied" all belong here.
---

# Upwork Pulse

The user is a freelancer on Upwork. Instead of scrolling the feed, an agent searches on a schedule, assesses every posting against the user's own rules, writes the promising ones into Notion, and sends a message only when something is worth applying to fast. In chat the same agent evaluates a posting, drafts a proposal by the user's guide and submits it only on an explicit go. The rules live in Notion so the user can change them from any device and the agent can write confirmed rules back; this skill holds the mechanics.

**Language.** The config's `language` is the user's language, and everything you write is in it: messages, chat replies, the text of cards, logs, questions, rule lines. The structure stays in English whatever `language` says — page and database titles, columns, select options, view names, config keys, the section headings of the rules pages and of cards — because the modes and the dashboard find things by those names. Message templates below are translated, labels included, structure kept. Proposals and screening answers go to a client and are written in the posting's language. No `language` key → the language the rules pages are written in. Never say what you are about to do — do it and report what changed.

## What lives where

A **root page** — its name is the user's choice ("Upwork Pulse" by default), so it is never found by name. Its first block is the config — a collapsed toggle (`⚙️ Config`; older pipelines have a callout, which works the same) whose title reads "read by the `upwork-pulse` skill" — that marker is how the root is found — holding these keys, one per line, `key: value`:

| Key | What it is |
|---|---|
| `jobs`, `runs`, `questions` | data source IDs of the three databases |
| `jobs_inbox`, `jobs_applied`, `jobs_all`, `runs_latest`, `questions_open` | view URLs, for reading without quota (`jobs_all` has every status, Skipped included) |
| `rules`, `guide`, `notes`, `state` | page IDs of Search rules, Proposal guide, Field notes, Run state |
| `language` | the user's language (e.g. `Russian`): everything you write is in it; the structure stays English |
| `timezone` | IANA zone of the user's wall clock (e.g. `Europe/Belgrade`); all times in messages and windows are in it |
| `match_score` | the Score from which a card counts as a strong match; the dashboard highlights those (default 4) |
| `upwork_org` | the Upwork org_uid to pass to every Upwork call |
| `dashboard` | URL of the published dashboard page, if any |

**Pages** — the user's rules, written by the user and by you on the user's confirmation:

- **Search rules** — what to search (queries), what is in scope, what to reject outright, what to flag, how to set verdict, hours and price, the user's rate, and how to rank a card (Ranking: criteria with points). Read at the start of every run.
- **Proposal guide** — how the user writes proposals: voice, structure, what never to say, the portfolio (projects with the exact line to quote and the file names to attach), rate rules, what to do after sending.
- **Field notes** — environment quirks only: facts about the Upwork API and tools that a run should know (fields that lag the site, calls that get blocked). No rules, no questions. Read every run; append one line when you discover a new quirk.
- **Run state** — one line `PROCESSED_UNTIL: <ISO time with offset>`, the hourly search's watermark.

**Databases:**

- **Jobs** — one card per Take or Maybe posting. `Title`, `Job ID` (the numeric id; the duplicate key), `Link`, `Published`, `Found`, `Verdict` (Take / Maybe), `Status` (New / Applied / Skipped), `Payment` (Fixed / Hourly), `Client $` (as stated, text), `Budget` (number, fixed only), `Rate min` / `Rate max` (hourly only), `My $` (hourly: the rate to ask per hour; fixed: the total), `My hours`, `Client time`, `Complexity` (Low / Medium / High), `Flags` (multi-select), `Client` (one line: country, verification, hires, spent, average = spent / paid hires, rating), `Proposals`, `Connects` (cost to apply), `Competition` (one line: invites sent, hired if more than zero, the range of competitors' bids — the proposal count has its own column), `Score` (number, by the rules' Ranking section) and `Score why` (one line: the criteria that scored), `Run` (relation to Runs). The page body has exactly five sections: **What's needed**, **Complexity**, **Risks**, **To clarify**, **Estimate** (`references/hourly.md`).
- **Runs** — one row per hourly run (per 2-hour chunk when a run catches up on a backlog), always, even empty: `Run` (title, `DD.MM HH:MM`, a label — order by `Created`, never by the title), `Created` (created time), `Status` (ok / empty / partial), `Scanned`, `Title pass`, `Detailed`, `Take`, `Maybe`, `Budget hit` (checkbox), `Tool calls`, `Window`; the body lists what stage 2 rejected and why.
- **Questions** — cases the rules do not settle: `Question` (title, one sentence), `Job IDs`, `Seen` (number), `Status` (Open / Resolved), `First seen`, `Decision`.

Card `Status` is the one thing three actors write: the hourly run creates cards as New; the user, the dashboard and chat set Applied or Skipped. Digests and the dashboard show only New. A Skipped card is never re-evaluated or duplicated when the same job turns up again.

## Rules that protect the user

- **Nothing goes to Upwork without the user's explicit go in this conversation.** Reading (`find_jobs`, `get_profile`, previews) is free; `confirm_preview`, `send_message`, `boost_profile`, `save_job`, `respond_to_offer` and any other write wait for a plain "send it" about that specific action. A scheduled run never writes to Upwork at all.
- **Read Notion through views and page fetches only; never SQL or rows mode.** Those draw on a workspace quota that runs out mid-day on most plans. `notion-query-data-sources` defaults to SQL when `mode` is omitted — always pass `mode: "view"` with a view URL from the config, and filter the rows yourself.
- **The watermark moves only after a chunk is fully written.** `PROCESSED_UNTIL` is what stops the search from re-reading or skipping jobs; a run that stops early leaves it alone (`references/hourly.md`). Never edit it in chat unless the user asks.
- **Rules are not guessed.** A case the rules do not settle is decided by the nearest analogy for this run and recorded as a question (below); it is not a new rule until the user confirms it.
- **If a write returns an error, stop, re-fetch, report.** Do not retry with another command or another escaping — that is how pages get destroyed.
- **Skill first, rules page second, but the rules page wins on content.** This file defines the mechanics and message formats. Whatever the Search rules or Proposal guide say about *what* to take, reject, flag, price or write overrides anything here; if they also define a message format, use theirs.

## Finding things

The root page, in this order:

1. A page URL or name in the task prompt or the conversation → that page. Scheduled tasks always carry the URL, so they never guess.
2. Keys already read earlier in this conversation → reuse them.
3. `notion-search` for `read by the upwork-pulse skill` (the config marker) → keep only the results whose page actually holds the config (fetch to check; a text match on other Upwork pages does not count). One → use it. Several (a sandbox and a live pipeline, say) → ask which, by name; in automatic mode, with no page named, send one line — "Several pipelines found (<names>) and the task names none; add the page URL to the task prompt" — and stop.
4. None → the pipeline is not set up; offer `references/setup.md`.

Fetch the root and read the config.

A job can be named by short id (`#584350`, the last six digits of `Job ID`), by title, by link, or by its number in a list this conversation already holds ("the second one" after a digest or a run message). A number means nothing outside the conversation that showed the list — with no such list here, ask which job. To find the card: query `jobs_inbox` (New cards) and match; not there → `jobs_all` (Applied and Skipped cards too). "No card" is said only after `jobs_all`. **Talking about a job starts from fresh data.** Before you assess, estimate or answer anything about a specific posting in a conversation, fetch it from Upwork (`find_jobs`, action `get`), then give its link and talk. The card is a snapshot from the moment it was found; proposals, hires and the connects price move, and advice on stale numbers is wrong advice. This holds for every conversation about a job, whatever the rules pages say; scheduled runs and digests read the cards only.

## Questions and quirks

- **A question** is a situation the rules do not cover (a posting type nobody decided on, a rule that contradicts another). Query `questions_open` and compare by meaning, not wording: if an open question would be settled by the same decision as this case — an open row about "feasibility studies where the PCB is optional" covers a new optical-sensor study with an optional board — it is the same question; append the job id to `Job IDs` and add one to `Seen`. Only a case no open row would settle gets a new row: `Question` one sentence without retelling the posting, `Job IDs`, `Seen` = 1, `Status` Open, `First seen` today. Questions never appear in run messages or digests — the weekly review presents them (`references/weekly.md`).
- **A rule the user confirms in chat** goes straight into the Search rules or the Proposal guide as one line refining the existing item (`update_content`), and the question, if there was one, gets `Status` Resolved with the answer in `Decision`. Rows are never deleted.
- **A quirk** (a field that lags the site, a call the classifier blocks) is one line appended to Field notes; it is not a question.

## Modes — read the file for the mode you are in

| When | Read |
|---|---|
| A scheduled run says "hourly search", or the user asks to scan / search for new jobs | `references/hourly.md` |
| A scheduled run says "digest" with a window, or the user asks what was found since a time | `references/digest.md` |
| A scheduled run says "weekly review", or the user asks about open questions | `references/weekly.md` |
| The user asks about a posting, an estimate, a proposal, a skip, an applied mark, connects, or replies after a digest | `references/chat.md` |
| Set up the pipeline, adopt existing pages, publish or update the dashboard, create the scheduled tasks | `references/setup.md` |

A scheduled run starts in **automatic mode**. Its final reply is pushed to the user's phone as it is, every hour — so every word in it that is not the mode's message is noise the user gets woken up by, and a run that says "nothing new" 24 times a day trains the user to ignore the pipeline. Three habits keep it clean:

- **Finish all work first.** Every read and write — cards, log, watermark, questions — happens before the final reply. The final reply is a turn with no tool calls in it.
- **The final reply is the mode's message and nothing else** — from its first character (`# Run`, `# Digest`, `# Questions`) to its last line. No lead-in, no sign-off.
- **Nothing to send → the final reply is empty.** Not a word, not a dot.
- **No text between tool calls either.** Work in silence: call the tools one after another without "Now I'll query…", "All writes are done" in between. Where the final reply is empty, the platform may show your last written words instead — so the only text a run writes is the message itself, or none at all.

What these replies look like when they go wrong — each of these was a real notification: "No Take cards this run — one Maybe was logged, so no notification is sent", "No cards fall in the 12:00–14:05 window — nothing to send", "All writes are confirmed. Sending the run message now.", "That was an accidental tool call, not needed here.", and progress notes like "Now linking the card to this run and moving the watermark." that surfaced because the final reply was empty Anything you would want to explain goes to Field notes (a quirk) or Questions (a decision). The moment the user writes in that same session, automatic mode ends and `references/chat.md` applies.

## Notion calls

Tool names are the Notion MCP tools (`notion-search`, `notion-fetch`, `notion-query-data-sources`, `notion-create-pages`, `notion-update-page`, `notion-create-database`, `notion-update-data-source`, `notion-create-view`); the prefix differs by surface.

- **Reading a view**: `data: {mode: "view", view_url: "<from config>", page_size: 100}`; page with `start_cursor` while `has_more`. Rows carry `url` (page id), dates as `date:<Prop>:start`.
- **New card / run / question**: `notion-create-pages` with `parent: {data_source_id: <id from config>}`; a date goes as `"date:Found:start": "2026-09-20T14:05:00+02:00"` with `"date:Found:is_datetime": 1`; a relation as `["<page id>"]`; a select as the option name; a checkbox as `"__YES__"`.
- **Status and other properties**: `notion-update-page`, `command: "update_properties"`, `properties: {"Status": "Skipped"}` — the plain property name as in the schema, no type prefix.
- **Page text**: `insert_content` to append a line, `update_content` with the exact old text to change one line. `replace_content` only on Run state, whose whole body is the one watermark line.
- **Block tags** in page content (`<details>`, `<summary>`, `<callout>`) go as raw characters, never as `&lt;` `&gt;` entities — escaped tags land on the page as text.
- **Dates from Notion** come back as UTC instants (`…Z`); convert to `timezone` before showing a time.
