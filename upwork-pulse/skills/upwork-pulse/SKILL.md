---
name: upwork-pulse
description: 'Runs a freelancer''s Upwork job pipeline kept in Notion — scheduled search and assessment, digests, a weekly review of rule questions, advice and ready-to-paste proposals, a history of sent proposals; in chat: assessing a posting, writing a proposal and submitting it on the user''s go, Skipped / Applied marks, search rules, connects. Use it whenever a scheduled task or the user mentions Upwork Pulse or the Upwork pipeline, its Notion pages or databases (Search rules, Proposal guide, Field notes, Jobs, Proposals, Runs, Questions), its Take / Maybe / Skipped lists, the dashboard or a chat it starts ("Job: … — Upwork Pulse, job #…"), or asks to set up or update the pipeline — and whenever a message is about a job posting, a proposal, a client, or a rule for which jobs to take or skip on a freelance platform, even without the word Upwork. A job named as `#` plus six digits ("skip #584350") is a card here, as are "details 3", "run the hourly search", "draft #584350", "from now on skip X", "mark it applied".'
---

# Upwork Pulse

The user is a freelancer on Upwork. Instead of scrolling the feed, an agent searches on a schedule, assesses every posting against the user's own rules, writes the promising ones into Notion, reports each run in its task's chat, and pushes to the phone only when something is worth applying to fast. In chat the same agent evaluates a posting, drafts a proposal by the user's guide and submits it only on an explicit go. The rules live in Notion so the user can change them from any device and the agent can write confirmed rules back; this skill holds the mechanics.

**Language.** The config's `language` is the user's language, and everything you write is in it: messages, chat replies, the text of cards, logs, questions, rule lines. The structure stays in English whatever `language` says — page and database titles, columns, select options, view names, config keys, the section headings of the rules pages and of cards — because the modes and the dashboard find things by those names. Report templates in the references are translated, labels included, structure kept. Proposals and screening answers go to a client and are written in the posting's language. No `language` key → the language the rules pages are written in. Never say what you are about to do — do it and report what changed.

**Replies.** Answer what the message is about — a question, a doubt, a choice — before or along with what was done: a report of the work alone does not tell the user whether it was the right call. Chat replies are plain text, since code blocks are hard to read on a phone; a code block holds only what the user pastes into Upwork as it is — a proposal's text and its milestones (`references/chat.md` → *Proposals*).

**Words.** A *card* is a row in Jobs (the dashboard calls a New card a *lead*); a *proposal row* is a row in Proposals; a *run* is one scheduled session; a *chunk* is up to 2 hours of the hourly run's queue; a *report* is a run's final reply.

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
| `dashboard_version` | the dashboard version that page was published from (`references/dashboard.md` → *When*) |
| `skill_version` | the plugin version the last hourly run used (N from the asset's first line); the dashboard shows it under Settings → Versions, and while its own version is older, the command that updates it (*Dashboard updates*). Written by the hourly run when it differs, and by setup |
| `dashboard_skip` | present (any value) when the user declined a dashboard (`references/dashboard.md` → *When*) |
| `chat_project` | the claude.ai project new Claude chats from the dashboard open in: `<project id> <name>`, or `none` (*Chat project*) |
| `auto_drafts` | `on` / `off` — "Auto proposals" on the dashboard: the hourly run's assessment on Opus goes on from each new card to advice and a proposal draft (`references/drafts.md`) |
| `auto_skip` | `on` / `off` — with `auto_drafts` on, every hourly run sets Skipped each New card with a Skip advice that is not `Locked`, whenever the advice was written (`references/hourly.md` §6) |
| `drafts_task` | id of the "Upwork drafts" task the dashboard starts to write or redo a proposal |
| `schema` | version of the pipeline's structure; this skill writes `8`. No key means 1 |
| `updating` | only while a pipeline update runs: when it started (ISO time) |
| `update_error` | only after an update stopped: the step and why, one line; automatic runs wait for a conversation to finish it |

**Pages** — the user's rules, written by the user and by you on the user's confirmation:

- **Search rules** — what to search (queries), what is in scope, what to reject outright, what to flag, how to set verdict, hours and price, the user's rate, and how to rank a card (Ranking: criteria with points). Read at the start of every run.
- **Proposal guide** — how the user writes proposals: voice, structure, what never to say, the portfolio (projects with the exact line to quote and the file names to attach), rate rules, what to do after sending.
- **Field notes** — environment quirks only: facts about the Upwork API and tools that a run should know (fields that lag the site, calls that get blocked). No rules, no questions. Read by every run that fetches postings in detail or writes proposals; append one line when you discover a new quirk.
- **Run state** — one line per watermark or pause, each changed alone with `update_content`, only by its owner:
  - `PROCESSED_UNTIL: <ISO time with offset>` — the hourly search's watermark; the hourly run (`references/hourly.md` §2);
  - `PROPOSALS_SYNCED_UNTIL: <…>` — the proposals sync's (`references/sync.md` §1);
  - `JOB_PAGES_PAUSE: <time> <hours>` — while Upwork refuses to open job pages; whoever opens a job page keeps it (`references/assess.md` §2);
  - `DEFERRED: <job id>@<time>, …` — the hourly search's postings waiting to be opened; the hourly run and its assessment (`references/assess.md` §2).

**Databases:**

- **Jobs** — one card per Take or Maybe posting (and one per job the user is invited to or applied to outside the pipeline). Every fact is its own column, as the API gives it — no column holds a sentence made of several facts:
  - the posting: `Title`, `Job ID` (the numeric id; the duplicate key), `Link`, `Published`, `Found`, `Run` (relation to Runs);
  - the client's terms: `Payment` (Fixed / Hourly), `Budget` (fixed), `Rate min` / `Rate max` (hourly), `Duration` (the API's duration, one of its five values), `Connects` (cost to apply);
  - competition: `Proposals`, `Invites`, `Interviewing`, `Bid low` / `Bid high` (the range of competitors' bids);
  - the client: `Country`, `Verified` (checkbox), `Hires`, `Spent`, `Rating`;
  - the assessment: `Verdict` (Take / Maybe), `Score` (by the rules' Ranking) and `Score why` (one line: the criteria that scored), `Complexity` (Low / Medium / High), `My hours` (how long the work takes), `My $` (the price — what the work earns, and what goes into the proposal form: hourly the rate, fixed the total), `Estimate` (the hours by part of the work, adding up to `My hours`), `Reviewed by` (*Which model*), `Flags` (multi-select; `invited` marks a job the client invited the user to — every pending invitation gets a card, `references/hourly.md` §3);
  - the decision: `Advice` (Apply / Skip), `Advice why`, `Advised on` (when the advice was last written); `Status` (New / Applied / Skipped) and `Decided on`; for skips `Skipped by` (manual / auto) and `Skip reason`; `Locked` (*Locked*); `Proposal` (relation to Proposals);
  - `Chat`: the link of the job's Cowork chat with Claude (`https://claude.ai/code/session_…`) — one chat per job, whatever it was opened from (`references/chat.md` → *A job's chat*).

  Money columns are plain numbers in dollars. A value the API did not return stays empty — never a made-up 0, never a dash; a zero the source states (no hires yet) is 0. The card body has exactly four sections, headings in English: **What's needed**, **Complexity**, **Risks**, **To clarify** (`references/assess.md` §4). Cards made before schema 7 have a fifth body section, `## Estimate`, and an empty `Estimate` column; they stay as they are.
- **Proposals** — the text of a job's proposal and the fact that it went out; nothing about money or time, which is the card's: `Title` (the job's title, so the row reads on its own in Notion), `Job` (relation to the Jobs card), `Job ID` (the key), `State` (Writing / Ready, while a draft is being written; empty once sent), `Written` (when this body was written — for a sent one, when it was sent), `Drafted by` (*Which model*; empty for a proposal written outside the pipeline), `Proposal ID` (Upwork's; set ⇔ sent), `Boost` (connects bid on top, as sent). The body is the proposal in fixed sections (`references/drafts.md` §4): what to paste, nothing to untangle. **One row per job, the last version**: every rewrite replaces the body, and once the proposal is submitted the body becomes what Upwork stored — the letter, answers and files as sent, whoever wrote them and wherever they were sent from. Every row has a card: the sync creates one for a proposal sent outside the pipeline.
- **Runs** — one row per hourly run (per chunk when a run catches up on a backlog), always, even empty: `Run` (title, `DD.MM HH:MM`, a label — order by `Created`, never by the title), `Created` (created time), `Status` (ok / empty / partial), `Scanned`, `Title pass`, `Detailed`, `Take`, `Maybe`, `Budget hit` (checkbox), `Tool calls`, `Window`, `Found by` and `Reviewed by` (*Which model*); the body lists what stage 2 rejected and why.
- **Questions** — cases the rules do not settle: `Question` (title, one sentence), `Job IDs`, `Seen` (number), `Status` (Open / Resolved), `First seen`, `Decision`.

### Card status

`Status` is written by several actors: the hourly run (through its assessment) creates cards as New; the proposals sync sets Applied when a proposal for the job shows up on Upwork (creating the card if there is none) and writes what was sent into Proposals; the user, the dashboard and chat set Applied, Skipped or back to New; the hourly run sets Skipped by itself only through auto skip (`references/hourly.md` §6). Digests and the dashboard's lead lists show only New. A Skipped card is never re-evaluated or duplicated when the same job turns up again.

**Every status change carries when, every skip who.** Applied or Skipped sets `Decided on` (now; the sync uses the proposal's send time). A skip also gets `Skipped by` — manual: the user did it, by a button or by asking in chat; auto: the hourly run's auto skip did it, on the card's Skip advice, with nobody involved — and `Skip reason`, one line in `language`: an auto skip always has one (the advice); a manual one has the reason the user gave or accepted (the dashboard's Skip offers Claude's Skip advice as the reason, editable), else stays empty — the user may skip just because. Putting a card back to New clears all three.

### One fact, one place

The card is the job and everything you know and decided about it; the proposal row is the text. Nothing is kept in both:
- **The job's facts** (terms, competition, client) live on the card, as last read. A mode that reads the job fresh (`find_jobs` `get`: drafts, a chat look or proposal) writes what changed back in one `update_properties` — the dashboard and the digests show today's numbers, not the ones from the hour it was found.
- **Time and money** — `My hours`, `My $`, `Complexity` and `Estimate` — live on the card, as last refined. The first assessment sets them; drafts, a chat proposal and a chat look that prices the work again refine them and write `My hours`, `My $` and `Estimate` together, with `Reviewed by`, in one `update_properties` — never the hours without their breakdown, never the card body — so they never disagree. The proposal is written for `My $`; if the user sends it at another price, the sync writes that price to `My $` — the price sent is the price.
- **Sent or not** is the card's `Status` Applied with `Decided on` (when it was sent) and the row's `Proposal ID`; the row holds no date or price of its own.
- `Verdict`, `Score` and `Score why` stay as written when the card was made: the ranking is a record of how the job looked when found, not a live number. `Title` and `Job ID` on a proposal row are its name and key — a job's title and id do not change.

### Locked

`Locked` keeps auto skip away from a card: its Skip advice stays advice and the user decides. Tick it when the user asks Claude to write for a job — the dashboard's Write a proposal / Rewrite, "draft #…" and a proposal requested in chat (`references/chat.md`) — and on every card of a job the user is invited to (`references/hourly.md` §3), since the client waits for the user's own answer. The user sets or clears it by hand: the dashboard drawer's Lock / Unlock, "lock #584350" / "unlock #584350" in chat, the checkbox in Notion. Nothing else clears it, and it never blocks a manual skip.

### Which model

The user checks that the work they pay Opus for is done by Opus, so every piece of work records the model that did it, each column named for what was done: the card's `Reviewed by` with every write that judges the job — its assessment (verdict, body, score), its estimate (`My hours`, `My $`, `Estimate`) or its advice — so it names whoever reviewed it last; the proposal row's `Drafted by` with every proposal text (a proposal can be written in a chat on another model than the card's); and on every Runs row `Found by` (the hourly run's own model) and `Reviewed by` (the assessment's, once one worked on the chunk). The hourly and drafts reports repeat them in their Log. The value is the exact model ID your own context states about the model you run on — the line naming your model (`The exact model ID is claude-opus-5-5`) — written as it is; never the model a prompt, a task or the Agent tool's `model` parameter asked for, never a guess: a subagent started with `model: "opus"` records what its own context says, so a mismatch shows. A context that names no model → `unknown`. Each write records the one who wrote it: a refresh of the job's facts or a sync touches none of these, and a proposal sent outside the pipeline has no `Drafted by`.

## Rules that protect the user

- **Nothing goes to Upwork without the user's explicit go in this conversation.** Reading (`find_jobs`, `get_profile`, previews) is free; `confirm_preview`, `send_message`, `boost_profile`, `save_job`, `respond_to_offer` and any other write wait for a plain "send it" about that specific action. A scheduled run writes nothing to Upwork; the only exception is the proposal preview drafts mode builds to read the screening questions and bids, which is not a submission.
- **Read Notion through views and page fetches only; never SQL or rows mode.** Those draw on a workspace quota that runs out mid-day on most plans. `notion-query-data-sources` defaults to SQL when `mode` is omitted — always pass `mode: "view"` with a view URL from the config, and filter the rows yourself.
- **A watermark moves only after everything it covers is written.** `PROCESSED_UNTIL` is what stops the search from re-reading or skipping jobs; a run that stops early leaves it alone (`references/hourly.md` §2). Never edit it in chat unless the user asks.
- **Rules are not guessed.** A case the rules do not settle is recorded as a question (*Questions and quirks*) and, in the hourly run, kept as a card (at least Maybe) rather than rejected, so the user sees it (`references/assess.md` §3); it is not a new rule until the user confirms it.
- **If a write returns an error, stop, re-fetch, report.** Do not retry with another command or another escaping — that is how pages get destroyed. The one exception: a validation error that names a wrong property or value and wrote nothing (the re-fetch shows the page unchanged) may be fixed and sent once more.
- **Skill first, rules page second, but the rules page wins on content.** This skill defines the mechanics and report formats. Whatever the Search rules or Proposal guide say about *what* to take, reject, flag, price or write overrides anything here; if they also define a message format, use theirs.

## Finding things

The root page, in this order:

1. A page URL or name in the task prompt or the conversation → that page. Scheduled tasks always carry the URL, so they never guess.
2. Keys already read earlier in this conversation → reuse them.
3. `notion-search` for `read by the upwork-pulse skill` (the config marker) → keep only the results whose page actually holds the config (fetch to check; a text match on other Upwork pages does not count). One → use it. Several (a sandbox and a live pipeline, say) → ask which, by name; in automatic mode, with no page named, send one line — "Several pipelines found (<names>) and the task names none; add the page URL to the task prompt" — and stop.
4. None → the pipeline is not set up; offer `references/setup.md`.

Fetch the root and read the config. **Then check `schema` before anything else**: not 8 → *Pipeline update* decides what this session does first — in a conversation that is the update itself, whatever the user asked.

**In a conversation, a config without a `chat_project` line gets one in the same session** — whatever the user asked, a question as much as a write, after answering it: the project this conversation is in, or `none` (*Chat project*). It is one config edit and one closing line; skipping it leaves the dashboard opening chats in no project until some later conversation does it.

A job can be named by short id (`#584350`, the last six digits of `Job ID`), by title, by link, or by its number in a list this conversation already holds ("the second one", "details 3" after a digest or a run report). A number means nothing outside the conversation that showed the list — with no such list here, ask which job. To find the card: query `jobs_inbox` (New cards) and match; not there → `jobs_all` (Applied and Skipped cards too). "No card" is said only after `jobs_all`. A conversation about a job starts from fresh data (`references/chat.md` → *Fresh data first*); scheduled runs and digests read the cards only.

## Questions and quirks

- **A question** is a situation the rules do not cover (a posting type nobody decided on, a rule that contradicts another). Query `questions_open` and compare by meaning, not wording: if an open question would be settled by the same decision as this case — an open row about taking paid studies where the board is optional covers a new optical-sensor study with an optional board — it is the same question; append the job id to `Job IDs` and add one to `Seen`. Only a case no open row would settle gets a new row: `Job IDs`, `Seen` = 1, `Status` Open, `First seen` today, and `Question` written for the user, who answers it at a glance: one sentence in plain words saying what they decide about the job that raised it — the kind of work in everyday words and the choice ("Take a paid study of a sensor design when the board itself is optional, like Optical dust sensor feasibility?") — never the rules page's terms or a retelling of the posting, which the user could not understand. Questions never appear in run reports or digests — the weekly review presents them and closes the ones that never came back (`references/weekly.md`).
- **A rule the user confirms** — in chat or in the weekly review — goes straight into the Search rules or the Proposal guide as one line refining the existing item (`update_content`), and the question, if there was one, gets `Status` Resolved with the answer in `Decision`. Rows are never deleted.
- **A quirk** (a field that lags the site, a call the classifier blocks) is one line appended to Field notes; it is not a question.

## Chat project

On the phone and the web the dashboard starts a job's new Claude chat in the project named by the config's `chat_project`; the desktop app's link has no way to name a project, so there new chats open outside projects. The dashboard reads the line on every load and only shows it (Settings), so changing it never needs a republish.

- **Set once, by the first conversation that finds no `chat_project` line** — the setup itself, or the first conversation after the plugin update that brought it, whatever it was about, after answering it: the project this conversation belongs to, as `<project id> <name>`; `none` when the conversation is in no project. The user chose this default: the project the skill was set up or updated from. After that it changes only when the user asks. Automatic runs never write it.
- **The project's id** is its claude.ai UUID, the one in a link to it (`claude.ai/project/<id>`). The session sees it only indirectly — in a project-scoped path in its tools' instructions, such as a memory scope `/projects/<id>/` — and never guesses it; the name is the one the session's context gives the project. In a project whose id is nowhere in sight, write nothing: a later conversation tries again.
- **Write it** with `update_content` on the config toggle — the line replaced, or added as the toggle's last line (tab-indented) — then one short line in `language` at the end of the reply: new chats from the dashboard open in <name> (or outside projects), and saying so in a chat inside another project moves them there.
- **The user changes it in chat**: "open dashboard chats in this project" → this conversation's project, as above; "no project" → `none`. Another project by name cannot be resolved from here (its id is not visible): say to ask from a chat inside that project.

## Modes — read the file for the mode you are in

The user's own message decides the mode, not a paraphrase of it (the arguments the skill was loaded with may reword "write a proposal" as "draft"): "write a proposal", "apply to this" is the package in chat; only "draft #…" itself is drafts mode.

| When | Read |
|---|---|
| A scheduled run says "hourly search", or the user asks to scan / search for new jobs | `references/hourly.md` |
| A scheduled run says "digest" with a window, or the user asks what was found since a time | `references/digest.md` (it starts with `references/sync.md`) |
| A scheduled run says "weekly review", or the user asks about open questions | `references/weekly.md` |
| The user asks about a posting, an estimate, a skip, an applied mark, a lock, connects, "details N", or asks to write a proposal ("write a proposal for #584350", "apply to this", "respond to the invitation") — the package in chat — or to sync proposals; a chat the dashboard started ("Job: <title> — Upwork Pulse, job #… (Job ID …). … Load it with the upwork-pulse skill.", or "Client: <client> — Upwork Pulse, Upwork room …") | `references/chat.md` (and `references/sync.md` for a sync or a sent proposal) |
| A prompt says "assessment mode" (the hourly run hands its survivors to a subagent), or the hourly run has no Agent tool and assesses them itself | `references/assess.md` |
| A prompt says "drafts mode" (the hourly run's catch-up, the dashboard's drafts task), or the user's own short command to fill a job's proposal for the dashboard — "draft #584350", "redo the draft for #584350", nothing longer | `references/drafts.md` |
| Set up the pipeline, adopt existing pages, create the scheduled tasks | `references/setup.md` |
| Publish or update the dashboard | `references/dashboard.md` |
| The skill invoked with `update` — `/upwork-pulse:upwork-pulse update`, the command an outdated dashboard gives the user — to bring everything up to date | `references/update.md` when `schema` is below 8, then `references/dashboard.md` → *Update* when `dashboard_version` is below the asset's version; nothing behind → one line saying the pipeline and the dashboard are current |
| Bring an older pipeline up to date (*Pipeline update*, or "update the pipeline") | `references/update.md` |

## Pipeline update

The config's `schema` is the structure the pipeline was built with; this skill works with `8`. A pipeline below it is brought up to date by the skill itself, in place (`references/update.md`): safe to stop and run again, nothing dropped before its values are checked in their new place, and the `updating` line in the config keeps two sessions from converting the same rows at once. **Installing the newer plugin is the user's go for its update** — the user chose this so that a plugin update never needs a second step; do not ask, do not wait for "update the pipeline", do not leave it for later because the user asked about something else. Asking only delays it: the next hourly run does the same update anyway, and until it is done the newer skill cannot work on the old structure.

What each session does on a config below 8:

- **The hourly run**: no `update_error` and no live `updating` line (`references/update.md` → *One session at a time*) → the update instead of the search; its push and report are the update's (`references/update.md` → *When it ends*). The watermark has not moved, so the next run catches up. A live `updating` → another session is at it: an empty reply. `update_error` → paused until a conversation finishes the update: write nothing at all, empty reply (the user was told when it stopped, and the dashboard shows it from the config).
- **A conversation**, whatever the user asked — a question as much as a write: the update right away (it also finishes a stopped one, `update_error` or not), its report, then the user's request. A chat the dashboard opened claims its card first (`references/chat.md` → *A job's chat*). A live `updating` → answer what needs no writes; a request that writes cards or proposals gets one line: an update is running, ask again in a few minutes. "Update the pipeline" runs it the same way.
- **Every other automatic run** — digests, the weekly review, drafts mode, assessment mode — never starts it: it writes nothing and reads nothing beyond the config. The weekly review ends with an empty reply; drafts mode as `references/drafts.md` §1 says; the assessment returns `pipeline updating`; a digest's whole report is one line, pushed like a digest — with `update_error`: "Upwork Pulse update stopped: <update_error>. Open a chat and say \"update the pipeline\""; otherwise: "Upwork Pulse is updating to the new version; digests resume after it". The watermarks stay where they are, so the search catches up after the update.

**A config above 8** was written by a newer copy of this plugin: this copy is out of date. Write nothing; in a conversation say in one line that the plugin needs updating; an automatic run ends with an empty reply.

## Automatic mode

A run whose prompt says it is scheduled starts in automatic mode — the hourly run, the digests, the weekly review and the drafts task the dashboard starts (a subagent the hourly run starts follows its own return format instead). Nobody is watching it: the user learns about it from a push to the phone, and reads the report in the task's chat when the push says there is something to read. A push that says "nothing new" 24 times a day trains the user to ignore the pipeline, so a run pushes only when it has news; the report is always written, for the user to open when they want to see what ran. All of this lives here, not in the task prompts, so a changed skill changes every task.

- **No text between tool calls.** Call the tools one after another without "Now I'll query…", "All writes are done" in between — the platform may show those words as the run's result. Each of these was a real run's result: "No Take cards this run — one Maybe was logged, so no notification is sent", "All writes are confirmed. Sending the run message now.", "That was an accidental tool call, not needed here.", "Now linking the card to this run and moving the watermark.", "Validation error only (nothing written); fixing my properties and resending once.". What you would want to explain goes to Field notes (a quirk) or Questions (a decision); what the run did and what failed, to the report's `## Log`.
- **Now is when the run fired**: the fire time the platform gives (in the prompt or the session's context), else the shell clock (`date`); the run's subagents read the same clock. Never the "as of" time on a Notion fetch — that is when Notion cached the page, often an hour before the run, and a run that takes it for now ends its window early, misnames its Runs row and leaves the newest postings, the Takes the push is for, to the next run.
- **Fewer turns, same work.** Every turn re-reads the whole conversation, so a run's cost is roughly its number of turns. Put calls that do not depend on each other into one turn; a write that the next one depends on waits for its result. Load the Notion and Upwork tools you will need with one `ToolSearch` call, not one per tool; `PushNotification` is not among them.
- **Finish all work first.** Every read and write happens before the push and the report.
- **The push is the last tool call, only when the run has news** — what counts as news is the mode's (`references/hourly.md` §7, `references/digest.md` §3, `references/weekly.md` §1; the drafts task never pushes: the user is on the dashboard). Load the tool (`ToolSearch`, query `select:PushNotification`), then call `PushNotification` with `status: "proactive"` and the mode's push line in `language`: one line under 200 characters, no markdown. One push per run. Nothing to send → no push, and do not load the tool. No push tool on this surface → the report is the only delivery; never write about the push tool or its absence.
- **The report is the final reply and nothing else** — from its first character (`# Run`, `# Digest`, `# Questions`, `# Drafts`) to its last line. No lead-in, no sign-off. Every run has one, news or not, except where this skill says the reply is empty (*Pipeline update*) or is the update's report (`references/update.md`).
- **Every report ends with `## Log`** — what the run did, the one place for that: one bullet per process, `- <Process>: <what happened>` in a few words per item (the reasons live on the cards), labels in `language`; the mode lists its lines and which ones are always there; `Problems` only when a call failed or was blocked — where, the error in a few words, and what stays undone for the next run. What the session cannot do by design (no Artifact tool, no push tool, no Agent tool) is not a problem and is not mentioned anywhere in the report. A run with nothing to show is the report's header, its counts line and the Log alone.

The moment the user writes in that same session, automatic mode ends: no more pushes, and `references/chat.md` applies.

## Dashboard updates

The dashboard follows the plugin: when the config's `dashboard_version` is below the version on the first line of `assets/dashboard.html`, the first conversation that sees it republishes it without asking, after answering. Scheduled runs cannot — they have no Artifact tool — so until then the page shows, beside its status, the command to send Claude: `/upwork-pulse:upwork-pulse update` (modes table). The slash form loads this skill for certain, which a plain message in a new chat may not, and a chat about something else may never come. A conversation on a pipeline with no dashboard offers one. When and how: `references/dashboard.md`.

## Notion calls

Tool names are the Notion MCP tools (`notion-search`, `notion-fetch`, `notion-query-data-sources`, `notion-create-pages`, `notion-update-page`, `notion-create-database`, `notion-update-data-source`, `notion-create-view`); the prefix differs by surface.

- **Reading a view**: `data: {mode: "view", view_url: "<from config>", page_size: 20}`; page with `start_cursor` while `has_more`, until the mode's own stop rule says enough. A view returns every property of every row, whatever columns it shows — a Jobs row is about 1.7k characters — and a tool result above about 50k characters is cut off into a file the run then has to parse, so 20 rows is what one read can carry; a view showing fewer columns does not shrink it. Rows carry `url` (page id), dates as `date:<Prop>:start`.
- **New card / run / question**: `notion-create-pages` with `parent: {data_source_id: <id from config>}`; a date goes as `"date:Found:start": "2026-09-20T14:05:00+02:00"` with `"date:Found:is_datetime": 1`; a relation as `["<page id>"]`; a select as the option name; a checkbox as `"__YES__"`.
- **Status and other properties**: `notion-update-page`, `command: "update_properties"`, `properties: {"Status": "Skipped"}` — the plain property name as in the schema (`Link`, `Job ID` — the tool's `userDefined:` prefix is only for properties literally named `id` or `url`). Dates are the exception, as in create: `"date:Decided on:start": "<ISO time>"` with `"date:Decided on:is_datetime": 1`; clearing a property is `null` (`"date:Decided on:start": null`).
- **Page text**: `insert_content` to append a line, `update_content` with the exact old text to change one line. `replace_content` rebuilds the whole body, so it is only for a proposal row's body (the proposal is rewritten whole); never on Run state, whose lines are changed one at a time, and never on a rules page.
- **Block tags** in page content (`<details>`, `<summary>`, `<callout>`) go as raw characters, never as `&lt;` `&gt;` entities — escaped tags land on the page as text.
- **Dates from Notion** come back as UTC instants (`…Z`); convert to `timezone` before showing a time.
- **Text read from a view is markdown-escaped** (`\$`, `\<`, `\*`, line breaks as `<br>`). Write plain text — `$45/hr`, real line breaks — never copy the backslashes back, or they land on the page and in the dashboard's copy buttons.

## Upwork calls

Exact names, because Upwork drops a parameter it does not know without an error, and a run that guesses spends a call or reads the tool's long help to find out. Every call passes `org_uid: "<upwork_org>"`. A call only one mode makes is spelled out there: the search in `references/hourly.md` §3, the proposal preview in `references/drafts.md` §2.

- **A job page**: `find_jobs` `{action: "get", org_uid: "<upwork_org>", params: {id: "<Job ID>"}}` — the numeric id. How fast job pages may be opened: `references/assess.md` §2.
