# Hourly search

One run: read the rules, take the queue of postings published since the watermark, filter and assess them, write cards and a run log, move the watermark, hand the new cards to drafts mode when it is on, and end with a short report of what it did — pushed to the phone only when there is something to apply to fast.

**Silent until the report.** No text at all between tool calls — not "Hourly search is running", not "Now the watermark": the app pushes every message of a scheduled session to the user's phone, so each such line is a false alarm. What the run did goes in the report's `## Log` (§9), and nowhere else.

## 1. Read first

Fetch **Search rules** (id from the config). **Field notes** and `jobs_all` are read only once the search (§3) returns postings inside the queue or there is a pending invitation — an empty hour needs neither: it searches, writes its `empty` log row, moves the watermark and goes to the version check (end of §8). If Search rules cannot be fetched, or its content is not a search specification: do not improvise from memory — write a Runs row with `Status` empty and `Window` = `rules read failed`, send nothing, stop.

## 2. The queue

Fetch **Run state**; find `PROCESSED_UNTIL: <ISO time>`.

- Queue = from `PROCESSED_UNTIL − 10 min` to now. The overlap catches postings that appeared while the previous run was writing.
- No line, or unparseable → the last 70 minutes.
- Longer than 24 h → only the last 24 h (older backlog is dropped; it shows only as the window in the log).

Not longer than 2 h: process it whole, and once every card and the log are written — before §8 and the report — rewrite the line to now — `update_content` on that line only (Run state also holds the proposals sync's line, and, while Upwork refuses job pages, the `DEFERRED:` and `JOB_PAGES_PAUSE:` lines of §4), format `2026-09-20T14:00+02:00` in the config timezone.

Longer: work in 2-hour chunks, oldest first (search results arrive newest first — reverse them). After each chunk is fully written, rewrite the watermark to that chunk's end. Continue to now or to the budget — about 25 detailed job requests per run. At the budget: stop, log `partial`; the next run takes the rest. The watermark moves only after a fully written chunk; a run interrupted mid-chunk leaves it where it was.

## 3. Search

Run each query from Search rules as its own `find_jobs` search (`action: search`), sorted by recency, paginating until published dates leave the queue window. Merge results by job id. No budget, level, duration or payment-verified filters unless the rules say so.

**Invitations**, every run, whatever the queue: `list_freelancer_proposals` `invitations` with `status: pending`, in the same turn as the searches. A client who invites the user is waiting for an answer, so every pending invitation's job gets a card and advice, like a found posting — the dashboard shows it under Your move with that advice and the proposal. Per invitation, by its job id:
- A card in `jobs_all` → it lacks the flag `invited` → add it and check `Locked` (`update_properties`, the card's flags plus `invited`; SKILL.md → *Locked*). Nothing else.
- No card → `find_jobs` `get` and stage 2 (§4), but it always gets a card: the user decides on an invitation, not the filter. A posting the rules would reject becomes Maybe, with the reject reason as the first line under Risks. Its flags include `invited`, and `Locked` is checked. It joins this run's cards: written with them (§5), counted in the log (§7), handed to drafts (§8), and it is news (§9).
- `get` says gone → no card; the invitation is the client's to withdraw.

No pending invitations → nothing about them anywhere, the report's Log included.

## 4. Two-stage filter

**Stage 1**, on title and snippet: drop only what is obviously outside the user's field per the rules' "reject on sight" items. Keep anything that might fit — snippets lie. Skill tags are noise; never filter on them.

**Stage 2**, on the full text (`find_jobs`, action `get`, one call per survivor): apply the rules' reject list, then flags, then verdict. Decisions come from the full text only. Two rejects hold for every user, whatever the rules say: **already hired** — the client has hired as many people as the posting seeks; **not a job** — a personal message or a request for direct contact dressed as a posting.

The default flags mean the same for everyone (the rules decide how much each weighs on the verdict): `no client history` — the client has never hired; `partially hired` — some of the people sought are hired, not all; `timezone lock` — a hard requirement on presence or working hours; `mandatory calls` — regular calls required; `budget mismatch` — a fixed budget far below the scope; `full-time` — 30+ hours a week or 6+ months, effectively a hire; `unfamiliar tech` — a tool, platform or part the user has not worked with. The user's own flags are defined in the rules.

**`get` says not found or closed** for a posting the search just listed: the posting is gone — count it as rejected ("gone") in the log and go on. It never holds the watermark back: a gone posting stays gone, and holding the watermark for it would retry the same window every hour.

**Job pages refused.** `get` can answer PERMISSION ("This job can't be opened right now. It may be private or invite-only, or jobs are being opened too quickly"). Upwork gives this one answer both for a posting that went private and for job pages opened too fast, says no time for how long, and asks not to retry the same job — retrying makes the refusal last. So one such answer proves nothing about the posting; it is handled with a growing pause, kept in Run state on the line `JOB_PAGES_PAUSE: <ISO time until> <hours>`:
- **Before the first job page of a run** (stage 2, an invitation's job, a deferred one): a `JOB_PAGES_PAUSE` time still ahead → open none in this run; every survivor goes straight to `DEFERRED` (below).
- **The first PERMISSION of a run** → open no more job pages in this run, and write the pause: 1 hour from now with no line yet, else double the line's hours, at most 8 (1 → 2 → 4 → 8 → 8…), as `JOB_PAGES_PAUSE: <now + hours> <hours>` (`update_content` on the line; no line → `insert_content` at the end).
- **A job page that opens** → remove the `JOB_PAGES_PAUSE` line, if there is one: pages are open again.
- **The searches go on** whatever the pause: they open no job page and are not refused.
- **An invitation's job is not deferred**: it stays without a card for now, and the next run lists the pending invitation again (§3).

Every search survivor not opened — refused, or not tried because of the pause — goes to the `DEFERRED:` line in Run state, `DEFERRED: <job id>@<its publishedDateTime>, …` (the same edits), and the chunk counts as processed: the watermark moves as usual, so the window is not searched again, and nothing is lost.

**Deferred postings** are opened once job pages are allowed again (no pause ahead): this run's own survivors first; after the first `get` that succeeds (or, with no survivor of its own, one `get` on the newest deferred one — the probe) take up to 5 deferred ones, newest first (a fresh posting is worth more: fewer proposals on it yet), through the already-seen check and stage 2 like this run's own. Each one opened, or gone, leaves the line (drop the line when it is empty). A refusal → the pause as above; they wait. A posting published more than 48 hours ago leaves the line unopened: log it as `deferred 48 h, dropped`. Only an error of the call itself (timeout, rate limit, server error) leaves the chunk unfinished.

**Already seen** — checked once, before stage 2: a posting that has a card in `jobs_all` (any status; the view is newest `Found` first, so stop paging once `Found` is two days older than the queue start) → skip silently, not counted, not logged. (A posting the previous run rejected can come back in the 10-minute overlap; it is simply assessed again.)

**A case the rules do not settle.** The test is mechanical: the posting's main deliverable is not on the rules' in-scope list and not on their reject lists (a study or report, consulting, a review with an optional build, a mixed role), or a flag would fit but is not listed, or two rules pull in different directions. "Probably out of scope" is not a rule — if you had to reason it out, it is a question. It still gets a verdict for this run, by the nearest analogy, with the usual reason in the log. And it gets recorded, before the run log is written: query `questions_open`; the same question already there → append this job id to `Job IDs`, `Seen` + 1; not there → a new row (SKILL.md → Questions and quirks).

## 5. Cards

Each **Take** or **Maybe** gets a card — rejected postings and the already-seen ones do not. The chunk's cards go in one `notion-create-pages` call into `jobs`, after the chunk's run row (§7) so `Run` is set right there: `Status` New, every column filled straight from the `get` response — one fact per column, copied, not summarised:

| Column | From |
|---|---|
| `Title`, `Published` | the posting |
| `Job ID`, `Link` | the id; `https://www.upwork.com/jobs/~02` + id |
| `Found` | the clock time when you write the card (not the chunk boundary, not the publish time) |
| `Payment` | Fixed / Hourly |
| `Budget` | the fixed amount (fixed only) |
| `Rate min`, `Rate max` | the hourly range (hourly only; one end stated → only that one) |
| `Duration` | the API's duration, exactly one of `Less than 1 week`, `Less than 1 month`, `1 to 3 months`, `3 to 6 months`, `More than 6 months` |
| `Connects` | the cost to apply |
| `Proposals`, `Invites`, `Interviewing` | the counters |
| `Bid low`, `Bid high` | the range of competitors' bids, as numbers |
| `Country`, `Verified`, `Hires`, `Spent`, `Rating` | the client: country, payment verified, paid hires, total spent, the freelancers' rating of the client |
| `Verdict`, `Complexity`, `My hours`, `My $`, `Flags` | your assessment by the rules (`My $`: hourly — the rate to ask; fixed — the total) |
| `Estimate` | the hours by part of the work, as below; its lines add up to `My hours` |
| `Score`, `Score why` | the sum of the points of every criterion in the rules' Ranking section that holds now, and those criteria in a few words each, in `language`, one line (`6 hires · rating 4.9 · 3 proposals · budget mismatch −2`); no Ranking section → both empty |

Numbers are plain numbers in dollars (`1500`, not `$1,500`). A field the API did not return stays empty — no made-up 0, no dash, no "not stated"; a zero the API returns is 0. The score is not recomputed later, so criteria that go stale with time (the posting's age) are not the ranking's business — the dashboard handles age itself.

**`Estimate`** is the estimate itself: one line per part of the work, `<part> — <hours> h` (the part in `language`, short and concrete — "Schematic and layout study against the spec — 3 h", "Ripple and fuse calculations for the 4 channels — 3 h", "Report with severities and annotated images — 5 h"), 3–7 lines, whole or half hours. The lines add up to `My hours` exactly. Work the client asks to be priced apart (a recheck, an option, a later phase) goes last as `+ <part> — <hours> h` and is not in the sum. No money and no total line: the price is `My $`, the total is `My hours`, and the dashboard and the message print both next to it. A line break between lines (a real newline in the text value).

The body: exactly these four sections in this order, nothing else — the headings in English as written (structure), the text under them in `language`; the run report and the dashboard quote them:

```
## What's needed
2–4 sentences in your own words: what the client actually needs and where the real difficulty is, plus what they already have (hardware, files, constraints, stage). Do not list components or requirements back — the card explains, it does not retell.
## Complexity
One sentence why this level (the level itself is the Complexity property).
## Risks
- bullets
## To clarify
- only questions whose answer changes the estimate
```

The estimate is the `Estimate` column, not a body section: hours, price and their breakdown change together, in one `update_properties`, so they never disagree. (Cards made before schema 7 have a fifth section, `## Estimate`, and an empty column; leave them as they are.)

## 6. Questions and quirks

Any question from step 4 is written now (or bumped), and any new fact about the API or tools met during the run goes as one line to Field notes. Questions never appear in the report; a tool problem appears as one `Problems` line (§9) and, when it is a quirk of the environment, also in Field notes.

## 7. The run log

Always, including empty runs: one row in `runs` per chunk, written once the chunk is assessed, before its cards (§5). `Run` = `DD.MM HH:MM` in the config timezone; `Status` ok (queue fully processed), empty (processed, nothing relevant), partial (stopped at the budget); `Scanned` (postings in the queue), `Title pass` (left after stage 1), `Detailed` (`get` calls), `Take`, `Maybe`, `Budget hit` (stopped at the budget), `Tool calls` (this chunk's calls); `Window` = the range actually processed. Body — written in the `content` of the same `notion-create-pages` call that makes the row, never added later with `replace_content`: each stage-2 reject as *title* — link — one sentence — **reason from the reject list**. Stage-1 rejects only as the `Title pass` number, except a doubtful one or one whose title hints at the user's field — log it with the note "stage 1, doubt". Obvious foreign work caught at stage 1 (web, design, marketing, data entry) is never listed, not even as "reject on sight". Partial: add `Not processed: N postings, window HH:MM–HH:MM, next run takes them`.

## 8. Drafts

After the log and the watermark, so a failure here never loses a card or a window. (Marking cards Applied is the proposals sync's job: `references/sync.md`.)

Only with `auto_drafts: on`, and only when this run wrote at least one card or `jobs_inbox` shows a New card posted in the last 5 days without `Advice` (left by an earlier run, or found while drafts were off) — one read of `jobs_inbox` tells. Start a subagent with the Agent tool, `model: "opus"`, and this task: "Use the upwork-pulse skill in drafts mode on <root URL> for the cards <card URLs written by this run, if any, then the older ones that read showed: New, posted in the last 5 days (`Published`, else `Found`), no `Advice` — Take first, then Maybe, newest first within each, at most 5>. You are the hourly run's subagent: write to Notion, no message, no push; return one line per card." Wait for it. Its lines tell you which cards got Apply. If the Agent tool is missing or the subagent fails, leave the cards as they are and go on: drafts mode also picks up New cards left without advice by an earlier run, up to 5 per run.

**Auto skip**, with `auto_skip: on` and `auto_drafts: on`, after the drafts step (whether or not a subagent ran): read `jobs_inbox` (fresh — the subagent may have just written advice). Every New card with `Advice` Skip and `Locked` unchecked gets one `update_properties`: `Status` Skipped, `Skipped by` auto, `Skip reason` = its `Advice why` (one line), `Decided on` = now. Whenever that advice was written — by this run, an earlier one, before auto skip was switched on — it counts: the switch means "skip what Claude advises to skip". A `Locked` card stays New whatever its advice (SKILL.md → *Locked*). Cards skipped here are not news (§9).

**Version check**, every run, last before the report: first, when the config's `skill_version` is not N (the first line of `assets/dashboard.html`), write `skill_version: N` (add the line if missing) — the dashboard shows which skill the runs use; remember the old value for the report's `Update` line. Then: a `dashboard` line in the config, its `dashboard_version` below N, and an Artifact tool in this session → republish the dashboard as SKILL.md → *Dashboard updates* says, in this run — reading the whole live page first is part of it (`references/setup.md` → 7, step 2), not a reason to skip. Only a publish that fails is left for the next run; it goes in the report as a `Problems` line.

## 9. The report

Every run ends with a report in the task's chat: what was found, then what the run did. The **push** is the "respond fast" signal and goes only when the run has **news**: a card from this run that is still New and is a Take, or comes from an invitation (its title line ends with ` · invited`). Maybe cards, Apply advice on a Maybe, auto skips, updates and problems are in the report and never earn a push on their own.

Format, in `language` (labels translated, structure kept), only these blocks, nothing before or after:

```
# Run HH:MM · window HH:MM–HH:MM
Checked N · take M · maybe K · connects L

## Take
### 1. #<short id> <title as posted>

**<client's price>** · <Duration> · <Connects> connects · [Upwork →](<link>) · [Notion →](<card url>)

Client: <Country> · verified · <Hires> hires · $<Spent> spent · rating <Rating>
Competition: <Proposals> proposals · <Invites> invited · <Interviewing> interviewing · bids $<Bid low>–<Bid high>

<the What's needed paragraph, no heading>

Complexity **<low|medium|high>** — <the Complexity sentence>

Risks:
- …

To clarify:
- …

Estimate **<My hours> h** · ask **<My $>**
- <each line of the Estimate column, as written>

Advice **<apply|skip>** — <the reason from the subagent's line> · proposal ready   ← only when drafts ran

---
### 2. …

## Maybe
…

## Log
- Search: <N> in the window → <cards written> cards[, <gone> gone]
- Deferred: <n> waiting — #<short id>, …[; job pages paused until HH:MM][; <m> dropped after 48 h]   ← Upwork would not open job pages (§4); only when the line is not empty
- Invitations: <n> pending, <new> new card(s): #<short id>, …
- Drafts: <n> advised — apply #<short id>, …; skip #<short id>, …
- Auto skip: #<short id> <title, cut to 40 characters>, …
- Update: skill <old> → <N> · dashboard <old> → <N>   ← no old skill_version: `skill <N>`
- Problems: <one line per problem: where, what failed, what is left undone>
```

`<client's price>` is made from the columns: `$<Budget> fixed`, `$<Rate min>–<Rate max>/hr`, or `rate not stated`; money is written as money (`$8,400`). In the Client and Competition lines leave out a part whose column is empty or zero, and "verified" when it is not. `<short id>` is the last six digits of `Job ID`, as on the dashboard, so the user can refer to an item by its number in this message or by its id. Numbering runs across both sections; an empty section is left out; a horizontal rule between cards; `Client:` and `Competition:` labels not bold. `connects L` in the header is the sum over the listed cards.

**The Log** follows SKILL.md → automatic mode — one line per process, only for what happened: `Search` always; `Deferred` while postings wait to be opened (a refused job page is not a `Problems` line: it is Upwork pacing, handled); `Invitations` only when there are pending ones; `Drafts` only when the subagent ran (its lines); `Auto skip` only when it skipped something; `Update` only when `skill_version` changed or the dashboard was republished (just the parts that happened); `Problems` only when a call failed or was blocked — the card or step, the error in a few words, and what stays undone for the next run. What this session cannot do by design is not a problem and is not mentioned anywhere in the report: no Artifact tool for the dashboard, no push tool, no Agent tool for drafts. An hour with no cards is the header, the counts line and the Log alone.

Forbidden in the report: narration outside the Log ("Now I'll…", "All writes are done"), notes on a value (the client's price is exactly as built above — `rate not stated`, nothing in brackets), extra sections, draft proposal text, questions.

**Push line** (SKILL.md → automatic mode), in `language`, plain text: `Upwork: <M> take[, <K> maybe] · #<short id> <title> · <client's price>` for the first news card (the client's price as above), with ` +<n>` after the title when there are more news cards; cut the title so the line stays under 200 characters.

Last steps, in this order, once all writes are done: with news, load `PushNotification` and push the line (no such tool → skip it without a word); then the final reply — the report alone, its first characters `# Run`. No news → no push, the report all the same.
