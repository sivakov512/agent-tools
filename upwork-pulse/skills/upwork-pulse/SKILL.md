---
name: upwork-pulse
description: Runs a freelancer's Upwork job pipeline with Notion as the source of truth — scheduled search and assessment, digests, a weekly review of rule questions, advice and ready-to-paste proposals for new cards, a history of sent proposals, and in chat: assessing a posting, writing a proposal and submitting it on the user's go, Skipped / Applied marks, search rules, connects. Use it whenever a scheduled task or the user mentions Upwork Pulse or the Upwork pipeline, its Notion pages or databases (Search rules, Proposal guide, Field notes, Jobs, Proposals, Runs, Questions), its Take / Maybe / Skipped lists, the dashboard, or asks to set up or update the pipeline — and whenever a message is about a job posting, a proposal, a client, or a rule for which jobs to take or skip on a freelance platform, even without the word Upwork. A job named as `#` plus six digits ("skip #584350", "what about #000101?") is a card here, so "details 3", "run the hourly search", "draft #584350", "from now on skip X", "mark it applied" all belong here.
---

# Upwork Pulse

The user is a freelancer on Upwork. Instead of scrolling the feed, an agent searches on a schedule, assesses every posting against the user's own rules, writes the promising ones into Notion, and sends a message only when something is worth applying to fast. In chat the same agent evaluates a posting, drafts a proposal by the user's guide and submits it only on an explicit go. The rules live in Notion so the user can change them from any device and the agent can write confirmed rules back; this skill holds the mechanics.

**Language.** The config's `language` is the user's language, and everything you write is in it: messages, chat replies, the text of cards, logs, questions, rule lines. The structure stays in English whatever `language` says — page and database titles, columns, select options, view names, config keys, the section headings of the rules pages and of cards — because the modes and the dashboard find things by those names. Message templates below are translated, labels included, structure kept. Proposals and screening answers go to a client and are written in the posting's language. No `language` key → the language the rules pages are written in. Never say what you are about to do — do it and report what changed.

## What lives where

A **root page** — its name is the user's choice ("Upwork Pulse" by default), so it is never found by name. Its first block is the config — a collapsed toggle (`⚙️ Config`; older pipelines have a callout, which works the same) whose title reads "read by the `upwork-pulse` skill" — that marker is how the root is found — holding these keys, one per line, `key: value`:

| Key | What it is |
|---|---|
| `jobs`, `proposals`, `runs`, `questions` | data source IDs of the four databases |
| `jobs_inbox`, `jobs_applied`, `jobs_skipped`, `jobs_all`, `proposals_open`, `proposals_sent`, `runs_latest`, `questions_open` | view URLs, for reading without quota (`jobs_all` has every status, Skipped included; `proposals_open` the ones not sent yet, `proposals_sent` the sent ones) |
| `rules`, `guide`, `notes`, `state` | page IDs of Search rules, Proposal guide, Field notes, Run state |
| `language` | the user's language (e.g. `Russian`): everything you write is in it; the structure stays English |
| `timezone` | IANA zone of the user's wall clock (e.g. `Europe/Belgrade`); all times in messages and windows are in it |
| `match_score` | the Score from which a card counts as a strong match; the dashboard highlights those (default 4) |
| `upwork_org` | the Upwork org_uid to pass to every Upwork call |
| `dashboard` | URL of the published dashboard page, if any |
| `dashboard_version` | the dashboard version that page was published from (see *Dashboard updates*) |
| `dashboard_skip` | a dashboard version the user declined; not offered again |
| `auto_drafts` | `on` / `off` — after an hourly run finds cards, Opus writes advice and a proposal draft for each (`references/drafts.md`) |
| `auto_skip` | `on` / `off` — with `auto_drafts` on, a Skip advice from those automatic drafts also sets the card Skipped |
| `drafts_task` | id of the "Upwork drafts" task the dashboard starts to write or redo a proposal |
| `schema` | version of the pipeline's structure; this skill writes `4`. No key means 1 |

**Pages** — the user's rules, written by the user and by you on the user's confirmation:

- **Search rules** — what to search (queries), what is in scope, what to reject outright, what to flag, how to set verdict, hours and price, the user's rate, and how to rank a card (Ranking: criteria with points). Read at the start of every run.
- **Proposal guide** — how the user writes proposals: voice, structure, what never to say, the portfolio (projects with the exact line to quote and the file names to attach), rate rules, what to do after sending.
- **Field notes** — environment quirks only: facts about the Upwork API and tools that a run should know (fields that lag the site, calls that get blocked). No rules, no questions. Read by every run that fetches postings in detail or writes proposals; append one line when you discover a new quirk.
- **Run state** — two watermark lines: `PROCESSED_UNTIL: <ISO time with offset>` (the hourly search) and `PROPOSALS_SYNCED_UNTIL: <…>` (the proposals sync). Each mode rewrites only its own line.

**Databases:**

- **Jobs** — one card per Take or Maybe posting (and one per job the user applied to outside the pipeline). Every fact is its own column, as the API gives it — no column holds a sentence made of several facts:
  - the posting: `Title`, `Job ID` (the numeric id; the duplicate key), `Link`, `Published`, `Found`, `Run` (relation to Runs);
  - the client's terms: `Payment` (Fixed / Hourly), `Budget` (fixed), `Rate min` / `Rate max` (hourly), `Duration` (the API's duration, one of its five values), `Connects` (cost to apply);
  - competition: `Proposals`, `Invites`, `Interviewing`, `Bid low` / `Bid high` (the range of competitors' bids);
  - the client: `Country`, `Verified` (checkbox), `Hires`, `Spent`, `Rating`;
  - the assessment: `Verdict` (Take / Maybe), `Score` (by the rules' Ranking) and `Score why` (one line: the criteria that scored), `Complexity` (Low / Medium / High), `My hours` (how long the work takes), `My $` (the price — what the work earns, and what goes into the proposal form: hourly the rate, fixed the total), `Flags` (multi-select);
  - the decision: `Advice` (Apply / Skip), `Advice why` and `Advised on` (when the advice was last written); `Status` (New / Applied / Skipped) and `Decided on` (when it last became Applied or Skipped); for skips `Skipped by` (manual / auto) and `Skip reason`; `Proposal` (relation to Proposals).

  Money columns are plain numbers in dollars. A value the API did not return stays empty — never a made-up 0, never a dash; a zero the source states (no hires yet) is 0. The card body has exactly five sections, headings in English: **What's needed**, **Complexity**, **Risks**, **To clarify**, **Estimate** (`references/hourly.md` §5).
- **Proposals** — the text of a job's proposal and the fact that it went out; nothing about money or time, which is the card's: `Title` (the job's title, so the row reads on its own in Notion), `Job` (relation to the Jobs card), `Job ID` (the key), `State` (Writing / Ready, while a draft is being written; empty once sent), `Written` (when this body was written — for a sent one, when it was sent), `Proposal ID` (Upwork's; set ⇔ sent), `Boost` (connects bid on top, as sent). The body is the proposal in fixed sections (`references/drafts.md` §4): what to paste, nothing to untangle. **One row per job, the last version**: every rewrite replaces the body, and once the proposal is submitted the body becomes what Upwork stored — the letter, answers and files as sent, whoever wrote them and wherever they were sent from. Every row has a card: the sync creates one for a proposal sent outside the pipeline.
- **Runs** — one row per hourly run (per 2-hour chunk when a run catches up on a backlog), always, even empty: `Run` (title, `DD.MM HH:MM`, a label — order by `Created`, never by the title), `Created` (created time), `Status` (ok / empty / partial), `Scanned`, `Title pass`, `Detailed`, `Take`, `Maybe`, `Budget hit` (checkbox), `Tool calls`, `Window`; the body lists what stage 2 rejected and why.
- **Questions** — cases the rules do not settle: `Question` (title, one sentence), `Job IDs`, `Seen` (number), `Status` (Open / Resolved), `First seen`, `Decision`.

Card `Status` is written by several actors: the hourly run creates cards as New; the proposals sync (digests, or on command) sets Applied when a proposal for the job shows up on Upwork (creating the card if there is none), and writes what was sent into Proposals; the user, the dashboard and chat set Applied, Skipped or back to New; drafts mode sets Skipped only as the hourly run's subagent with `auto_skip: on`. Digests and the dashboard's lead lists show only New. A Skipped card is never re-evaluated or duplicated when the same job turns up again.

**One fact, one place, the latest value.** The card is the job and everything you know and decided about it; the Proposals row is the text. Nothing is kept in both:
- **The job's facts** (terms, competition, client) live on the card, as last read. A mode that reads the job fresh (`find_jobs` `get`: drafts, a chat look or proposal) writes what changed back in one `update_properties` — the dashboard and the digests show today's numbers, not the ones from the hour it was found.
- **Time and money** — `My hours`, `My $`, `Complexity`, and the body's **Estimate** section that explains them — live on the card, as last refined. The first assessment sets them; drafts mode and a chat proposal refine them and write the new numbers back (columns, and `update_content` on the Estimate section only); the proposal is written for `My $`, and if the user sends it at another price, the sync writes that price to `My $` — the price sent is the price.
- **Sent or not** is the card's `Status` Applied with `Decided on` (when it was sent) and the row's `Proposal ID`; the row holds no date or price of its own.
- `Verdict`, `Score` and `Score why` stay as written when the card was made: the ranking is a record of how the job looked when found, not a live number. `Title` and `Job ID` on a Proposals row are its name and key — a job's title and id do not change.

**Every status change carries when, every skip who**: Applied or Skipped sets `Decided on` (now; the sync uses the proposal's send time). A skip also gets `Skipped by` — manual: the user did it, by a button or by asking in chat; auto: drafts mode did it with nobody involved — and `Skip reason`, one line in `language`: an auto skip always has one (the advice); a manual one has the user's reason when they gave one, else stays empty — the user may skip just because. Putting a card back to New clears all three.

## Rules that protect the user

- **Nothing goes to Upwork without the user's explicit go in this conversation.** Reading (`find_jobs`, `get_profile`, previews) is free; `confirm_preview`, `send_message`, `boost_profile`, `save_job`, `respond_to_offer` and any other write wait for a plain "send it" about that specific action. A scheduled run writes nothing to Upwork; the only exception is the proposal preview drafts mode builds to read the screening questions and bids, which is not a submission.
- **Read Notion through views and page fetches only; never SQL or rows mode.** Those draw on a workspace quota that runs out mid-day on most plans. `notion-query-data-sources` defaults to SQL when `mode` is omitted — always pass `mode: "view"` with a view URL from the config, and filter the rows yourself.
- **The watermark moves only after a chunk is fully written.** `PROCESSED_UNTIL` is what stops the search from re-reading or skipping jobs; a run that stops early leaves it alone (`references/hourly.md`). Never edit it in chat unless the user asks.
- **Rules are not guessed.** A case the rules do not settle is decided by the nearest analogy for this run and recorded as a question (below); it is not a new rule until the user confirms it.
- **If a write returns an error, stop, re-fetch, report.** Do not retry with another command or another escaping — that is how pages get destroyed. The one exception: a validation error that names a wrong property or value and wrote nothing (the re-fetch shows the page unchanged) may be fixed and sent once more.
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

## Dashboard updates

The first line of `assets/dashboard.html` is `<!-- dashboard-version: N -->`, where N is the plugin's version (`x.y.z`) — the release stamps it on every release, so N is never edited by hand. The config's `dashboard_version` is the version the user's dashboard was last published from (no line = 1; a whole number, from before versions followed the plugin, is older than any `x.y.z`). In a conversation with the user — never in a scheduled or unattended run — answer what was asked first; then, once per conversation and only if `dashboard_skip` is not N, end with one short line in `language`:

- **The config has no `dashboard` line** (set up before the dashboard existed, or the user removed it): what the dashboard is, in a few words, and whether to publish it now. Yes → publish it as `references/setup.md` → 7. Dashboard says.
- **Its `dashboard_version` is below N**: the dashboard has an update to N — what is new, in a few words, from the plugin's `CHANGELOG.md` (at the plugin root, next to `skills/`) between the two versions, the entries about the dashboard; no such entries or no file → just the version — and whether to update it now. Yes → update it as `references/setup.md` → 7. Dashboard says (same link, `dashboard_version` set to N).

No to either → add `dashboard_skip: N` to the config, so it is not offered again until a newer version. For the check read only the asset's first line, not the whole file.

While the **pipeline update** below is due, offer that instead of this line: it republishes the dashboard too.

## Modes — read the file for the mode you are in

| When | Read |
|---|---|
| A scheduled run says "hourly search", or the user asks to scan / search for new jobs | `references/hourly.md` |
| A scheduled run says "digest" with a window, or the user asks what was found since a time | `references/digest.md` (it starts with `references/sync.md`) |
| A scheduled run says "weekly review", or the user asks about open questions | `references/weekly.md` |
| The user asks about a posting, an estimate, a skip, an applied mark, connects, replies after a digest, or asks to write a proposal ("write a proposal for #584350", "apply to this") — the package in chat — or to sync proposals | `references/chat.md` (and `references/sync.md` for a sync or a sent proposal) |
| A prompt says "drafts mode", an hourly run hands cards to a subagent, or the user's short command to write a job's proposal for the dashboard ("draft #584350", "redo the draft for #584350") | `references/drafts.md` |
| Set up the pipeline, adopt existing pages, publish or update the dashboard, create the scheduled tasks, "update the pipeline" | `references/setup.md` |

**Pipeline update.** The config's `schema` is the structure the pipeline was built with; this skill works with `4`. In a conversation (not in automatic mode), after reading the config: if `schema` is missing or below 4, finish what the user asked, then end the reply with this paragraph on its own, separated from the rest, once per conversation — translated into `language` like every message (only the words to say, "update the pipeline", may stay in English):

> **Pipeline update available** (schema <n> → 4): <what the newer versions bring, from `references/setup.md` §10 — for 3: a Proposals database with every proposal you write or send, and job facts in plain columns; for 4: price and time kept only on the job card, the proposal holds just its text>. Your data is converted in place, links and tasks stay. Until then the scheduled runs are paused. Say "update the pipeline" to apply.

Do not fold it into the answer, and do not repeat it after the user declines. The update itself is `references/setup.md` §10. Until it is done, everything else that writes cards or proposals waits: a chat request that needs them gets one line saying the pipeline needs the update first. **Automatic runs on an older schema** write nothing and read nothing beyond the config: the hourly run and the weekly review end with an empty reply; a digest's whole message is one line, "Upwork Pulse needs an update: open a chat and say \"update the pipeline\"", pushed like a digest. The watermarks stay where they are, so the search catches up after the update.

A run whose prompt says it is scheduled starts in **automatic mode**. Nobody is watching it: the user learns about it from a push to the phone, and reads the full message in the task's chat when the push says there is something to read. A push that says "nothing new" 24 times a day trains the user to ignore the pipeline, so a run pushes only when its mode has a message. Everything below lives here, not in the task prompts, so a changed skill changes every task.

**Fewer turns, same work.** Every turn re-reads the whole conversation, so a scheduled run's cost is roughly its number of turns. Put calls that do not depend on each other into one turn: after the config, Run state and Search rules together; all searches together; all stage-2 `get` calls together; the chunk's cards in one create call. A write that the next one depends on (the log row before the cards, both before the watermark) waits for its result. Load the Notion and Upwork tools you will need with one `ToolSearch` call, not one per tool; `PushNotification` is not among them — it is loaded only at the end, and only when there is a message.

- **Finish all work first.** Every read and write — cards, log, watermark, questions — happens before the push and the final reply.
- **The push is the last tool call, only when the mode has a message.** Load the tool (`ToolSearch`, query `select:PushNotification`), then call `PushNotification` with `status: "proactive"` and one line in `language`: under 200 characters, no markdown, what the user would act on — the mode's push line (`references/hourly.md` §9, `references/digest.md` §3, `references/weekly.md` §1). One push per run. Nothing to send → no push, and do not load the tool. If the surface has no push tool, the final reply is the only delivery; go on without it and never write about the push tool or its absence in the reply.
- **The final reply is the mode's message and nothing else** — from its first character (`# Run`, `# Digest`, `# Questions`) to its last line. No lead-in, no sign-off. It stays in the task's chat for the user to open.
- **Nothing to send → the final reply is empty.** Not a word, not a dot.
- **No text between tool calls either.** Work in silence: call the tools one after another without "Now I'll query…", "All writes are done" in between. Where the final reply is empty, the platform may show your last written words as the run's result.

What that noise looks like — each of these was a real run's result: "No Take cards this run — one Maybe was logged, so no notification is sent", "No cards fall in the 12:00–14:05 window — nothing to send", "All writes are confirmed. Sending the run message now.", "That was an accidental tool call, not needed here.", "Now linking the card to this run and moving the watermark.". Anything you would want to explain goes to Field notes (a quirk) or Questions (a decision). The moment the user writes in that same session, automatic mode ends, no more pushes, and `references/chat.md` applies.

## Notion calls

Tool names are the Notion MCP tools (`notion-search`, `notion-fetch`, `notion-query-data-sources`, `notion-create-pages`, `notion-update-page`, `notion-create-database`, `notion-update-data-source`, `notion-create-view`); the prefix differs by surface.

- **Reading a view**: `data: {mode: "view", view_url: "<from config>", page_size: 100}`; page with `start_cursor` while `has_more`. Rows carry `url` (page id), dates as `date:<Prop>:start`.
- **New card / run / question**: `notion-create-pages` with `parent: {data_source_id: <id from config>}`; a date goes as `"date:Found:start": "2026-09-20T14:05:00+02:00"` with `"date:Found:is_datetime": 1`; a relation as `["<page id>"]`; a select as the option name; a checkbox as `"__YES__"`.
- **Status and other properties**: `notion-update-page`, `command: "update_properties"`, `properties: {"Status": "Skipped"}` — the plain property name as in the schema (`Link`, `Job ID` — the tool's `userDefined:` prefix is only for properties literally named `id` or `url`). Dates are the exception, as in create: `"date:Decided on:start": "<ISO time>"` with `"date:Decided on:is_datetime": 1`; clearing a property is `null` (`"date:Decided on:start": null`).
- **Page text**: `insert_content` to append a line, `update_content` with the exact old text to change one line. `replace_content` only for a Proposals row's body (the proposal is rewritten whole); never on Run state, whose two lines are changed one at a time with `update_content`, and never on a rules page.
- **Block tags** in page content (`<details>`, `<summary>`, `<callout>`) go as raw characters, never as `&lt;` `&gt;` entities — escaped tags land on the page as text.
- **Dates from Notion** come back as UTC instants (`…Z`); convert to `timezone` before showing a time.
- **Text read from a view is markdown-escaped** (`\$`, `\<`, `\*`, line breaks as `<br>`). Write plain text — `$45/hr`, real line breaks — never copy the backslashes back, or they land on the page and in the dashboard's copy buttons.
