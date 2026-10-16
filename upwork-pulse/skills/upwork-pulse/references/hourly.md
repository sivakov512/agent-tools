# Hourly search

One run: read the rules, take the queue of postings published since the watermark, search it and drop the obvious foreign work by title, hand what is left to the assessment on Opus (`references/assess.md`: stage 2, cards, estimates and — with `auto_drafts: on` — advice and proposals), move the watermark, catch up drafts, auto-skip, and end with a short report of what it did — pushed to the phone only when there is something to apply to fast. This run is the cheap half: most hours find nothing to open past the title, and then Opus is never started. It runs in automatic mode (SKILL.md → *Automatic mode*); a config whose `schema` is not 8 is handled before anything here (SKILL.md → *Pipeline update*).

**Turns.** The first turn reads the config; the second, Search rules and Run state together; then all searches and the invitations in one turn. A write the next one depends on waits for its result: the run row before the hand-off, the cards and the row before the watermark.

## 1. Read first

Fetch **Search rules** (id from the config). `jobs_all` is read only once the search (§3) returns postings inside the queue or there is a pending invitation — an empty hour does not need it: it searches, writes its `empty` log row, moves the watermark and goes on to §6. If Search rules cannot be fetched, or its content is not a search specification: do not improvise from memory — write a Runs row with `Status` `partial`, `Window` = `rules read failed` and `Found by` (§5), leave the watermark, skip §3–§6, push nothing, and end with the report: its header, a counts line of zeros and a Log with `Models: found by <the model you run on>` and `Problems: Search rules could not be read; the window waits for the next run`.

## 2. The queue

Fetch **Run state**; find `PROCESSED_UNTIL: <ISO time>`.

- Queue = from `PROCESSED_UNTIL − 10 min` to now. The overlap catches postings that appeared while the previous run was writing.
- No line, or unparseable → the last 70 minutes.
- Longer than 24 h → only the last 24 h (older backlog is dropped; it shows only as the window in the log).

Not longer than 2 h: process it whole, and once every card and the log are written — before §6 and the report — rewrite the line to the time the search ran (not the time you write it: an assessment can take longer than the 10-minute overlap, and postings published meanwhile would be skipped) — `update_content` on that line only (Run state also holds the proposals sync's line, and, while Upwork refuses job pages, the `DEFERRED:` and `JOB_PAGES_PAUSE:` lines the assessment keeps, `references/assess.md` §2), format `2026-09-20T14:00+02:00` in the config timezone.

Longer: work in 2-hour chunks, oldest first (search results arrive newest first — reverse them). After each chunk is fully written, rewrite the watermark to that chunk's end. Continue to now or to the budget — **about 25 job pages per run**, whatever the number of chunks: each hand-off passes what is left of it (§5), and a chunk that comes back `not processed` is the last one this run starts. At the budget: stop, the chunk is `partial`; the next run takes the rest. The watermark moves only after a fully written chunk; a run interrupted mid-chunk leaves it where it was.

## 3. Search

Run each query from Search rules as its own `find_jobs` search (`action: search`), sorted by recency, paginating until published dates leave the queue window. Merge results by job id. No budget, level, duration or payment-verified filters unless the rules say so.

**Invitations**, every run, whatever the queue: `list_freelancer_proposals` `invitations` with `status: pending`, in the same turn as the searches. A client who invites the user is waiting for an answer, so every pending invitation's job gets a card and advice, like a found posting — the dashboard shows it under Your move with that advice and the proposal. Per invitation, by its job id:
- A card in `jobs_all` → if it lacks the flag `invited`, add it and tick `Locked` (one `update_properties`: the card's flags plus `invited`; SKILL.md → *Locked*). Nothing else.
- No card → it goes to the assessment with the survivors (§5): it gets a card there, flagged `invited` and locked (`references/assess.md` §2–§3), and it is news (§7).

No pending invitations → nothing about them anywhere, the report's Log included.

## 4. Stage 1 and the already-seen check

**Stage 1**, on title and snippet: drop only what is obviously outside the user's field per the rules' "reject on sight" items. Keep anything that might fit — snippets lie, and the assessment reads the full text. Skill tags are noise; never filter on them.

**Already seen** — checked once, after stage 1: a posting that has a card in `jobs_all` (any status; the view is newest `Found` first, so stop paging once `Found` is two days older than the queue start) → drop silently, not counted, not logged. (A posting the previous run rejected can come back in the 10-minute overlap; it is simply assessed again.)

What is left are the **survivors**. Stage-1 rejects appear only as the `Title pass` number, except a doubtful one or one whose title hints at the user's field — that one is listed in the run row's body with the note "stage 1, doubt". Obvious foreign work (web, design, marketing, data entry) is never listed.

## 5. Chunk by chunk: the run row and the hand-off

The run's job-page budget is §2's. For each chunk, oldest first (a queue up to 2 h is one chunk):

1. **Its row in `runs`**, created now — every chunk has one, empty hours included: `Run` = `DD.MM HH:MM` in the config timezone; `Scanned` (postings in the chunk), `Title pass` (survivors), `Tool calls` (this run's so far), `Found by` (the model you run on, SKILL.md → *Which model*), `Window` = the chunk's range; `Status` `empty` (the option), `Detailed` 0, `Take` 0, `Maybe` 0, `Budget hit` unchecked — the assessment overwrites them. Its body holds only the "stage 1, doubt" lines, if any.
2. **Nothing to assess** — no survivors, no invitation without a card, no `DEFERRED:` line in Run state → the row stands; the chunk is done.
3. **Job pages paused** — a `JOB_PAGES_PAUSE` time still ahead (in Run state, or a `deferred` return line saying pages are paused) → nothing can be opened, so no Opus is started: add the survivors not already on the `DEFERRED:` line to it yourself (`<job id>@<publishedDateTime>`, the format and edits of `references/assess.md` §2); invitations wait for the next run. The chunk is done.
4. **Otherwise the assessment**, as a subagent: the Agent tool with `model: "opus"` — the alias, so a newer Opus is used as soon as it exists — and this task: "Use the upwork-pulse skill in assessment mode on <root URL>. Runs row: <its URL>. Window: <HH:MM–HH:MM>. Survivors: <job id>@<publishedDateTime>, …. Invitations without a card: <job ids, or none — they go with the first chunk handed off only>. Budget: <job pages left this run> job pages. You are the hourly run's subagent: write to Notion, no message, no push; return as references/assess.md §7 says." Wait for its return; take its `pages` from the budget.
   - **No Agent tool**, or the subagent fails and returns nothing → do the assessment yourself, now: read `references/assess.md` and follow it for this chunk with the budget left, your own model on the cards and as the row's `Reviewed by`, and in the Log's `reviewed by` (so the dashboard and the report show the run fell back) — without its §6: the advice and proposals are written on Opus, so the cards wait for a catch-up that has the Agent tool. After a failed subagent, read `jobs_all` first and leave out the survivors that have a card by now: it may have written some before it stopped.
5. **Done or held.** A chunk is done unless the return has `pipeline updating`, `rules unreadable`, `not processed`, or a `problems` line about stage 2, the cards or the run row. Done → move the watermark to the chunk's end (§2) and go on to the next chunk. Held → the watermark stays at the chunk's start, the row is set `partial` (one `update_properties`, if the assessment left it `empty`; with `rules unreadable` also `Window` = `rules read failed`, which the dashboard shows as such), and no further chunk starts: the next run takes the window again. A `problems` line about drafts alone does not hold a chunk: every card is written, and a later catch-up drafts them. A budget used up also ends the loop.

## 6. After the chunks

In this order, after the cards, the rows and the watermark (§2) are written, so a failure here never loses a card or a window. (Marking cards Applied is the proposals sync's job: `references/sync.md`.)

**Catch-up drafts.** With `auto_drafts: on`, no assessment subagent returned this run (one that did ran its own catch-up), no `JOB_PAGES_PAUSE` time ahead and the Agent tool at hand: when `jobs_inbox` shows a New card that `references/drafts.md` §1 would catch up (not yet advised, posted in its window), start a subagent with `model: "opus"` and this task: "Use the upwork-pulse skill in drafts mode on <root URL> for the catch-up. You are the hourly run's subagent: write to Notion, no message, no push; return your model line, then one line per card." (An assessment does its own catch-up.)

**Auto skip**, with `auto_skip: on` and `auto_drafts: on`: read `jobs_inbox` (fresh — the assessment may have just written advice). Every New card with `Advice` Skip and `Locked` unchecked gets one `update_properties`: `Status` Skipped, `Skipped by` auto, `Skip reason` = its `Advice why` (one line), `Decided on` = now. Whenever that advice was written — by this run, an earlier one, before auto skip was switched on — it counts: the switch means "skip what Claude advises to skip". A `Locked` card stays New whatever its advice (SKILL.md → *Locked*). Cards skipped here are not news (§7).

**Version check**, every run, last before the report: first, when the config's `skill_version` is not N (the first line of `assets/dashboard.html`), write `skill_version: N` (add the line if missing) — the dashboard shows which skill the runs use; remember the old value for the report's `Update` line. Then: a `dashboard` line in the config, its `dashboard_version` below N, and an Artifact tool in this session → republish the dashboard (`references/dashboard.md` → *Update*), in this run. Only a publish that fails is left for the next run; it goes in the report as a `Problems` line.

## 7. The report

Every run ends with a report in the task's chat: what was found, then what the run did. The card blocks come from the assessments' returns as they are: all Takes, then all Maybes, oldest chunk first, renumbered from 1 across both sections; the Log's counts are summed over the chunks, and `Deferred` is the line as Run state holds it at the end. The **push** is the "respond fast" signal and goes only when the run has **news**: a card from this run that is still New and is a Take, or comes from an invitation (its title line ends with ` · invited`). Maybe cards, Apply advice on a Maybe, auto skips, updates and problems are in the report and never earn a push on their own.

Format, in `language` (labels translated, structure kept), only these blocks, nothing before or after:

```
# Run HH:MM · window HH:MM–HH:MM
Checked N · take M · maybe K · connects L

## Take
### 1. #<short id> <title as posted>[ · invited]   ← ` · invited` when the card's Flags have it

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

Advice **<apply|skip>** — <Advice why> · proposal ready   ← only when drafts ran

---
### 2. …

## Maybe
…

## Log
- Models: found by <the model this run ran on>[, reviewed by <the reviewing model>]   ← always; `reviewed by` only when an assessment or a catch-up drafts subagent ran: its model line
- Search: <N> in the window → <survivors> past the title → <cards written> cards[, <rejected> rejected (<gone> of them gone)]
- Deferred: <n> waiting — #<short id>, …[; job pages paused until HH:MM][; <m> dropped after 48 h]   ← Upwork would not open job pages (`references/assess.md` §2); only when the line is not empty
- Invitations: <n> pending, <new> new card(s): #<short id>, …
- Drafts: <n> advised — apply #<short id>, …; skip #<short id>, …
- Auto skip: #<short id> <title, cut to 40 characters>, …
- Update: skill <old> → <N> · dashboard <old> → <N>   ← no old skill_version: `skill <N>`
- Problems: <one line per problem: where, what failed, what is left undone>   ← a held chunk is one too: `assessment — <rules unreadable | pipeline updating | the problem>; window HH:MM–HH:MM waits for the next run`, and `not processed` reads `budget — N postings, window HH:MM–HH:MM, next run takes them`
```

`<client's price>` is made from the columns: `$<Budget> fixed`, `$<Rate min>–<Rate max>/hr`, or `rate not stated`; money is written as money (`$8,400`). In the Client and Competition lines leave out a part whose column is empty or zero, and "verified" when it is not. `<short id>` is the last six digits of `Job ID`, as on the dashboard, so the user can refer to an item by its number in this message or by its id. Numbering runs across both sections; an empty section is left out; a horizontal rule between cards; `Client:` and `Competition:` labels not bold. `connects L` in the header is the sum over the listed cards.

**The Log** (SKILL.md → *Automatic mode*): `Models` and `Search` always (`Models`: the model IDs as each context states them, SKILL.md → *Which model*; the subagent's part from its model line); `Deferred` while postings wait to be opened (a refused job page is not a `Problems` line: it is Upwork pacing, handled); `Invitations` only when there are pending ones; `Drafts` only when drafts ran — the assessments' `drafts:` lines and the catch-up's per-card lines summed into one line in the `drafts:` format of `references/assess.md` §7 (`not new` and `not advised` included); `Auto skip` only when it skipped something; `Update` only when `skill_version` changed or the dashboard was republished (just the parts that happened); `Problems` only when a call failed or was blocked. No Agent tool is not a problem: the assessment then ran in this session, which the `Models` line shows.

Forbidden in the report: narration outside the Log ("Now I'll…", "All writes are done"), notes on a value (the client's price is exactly as built above — `rate not stated`, nothing in brackets), extra sections, draft proposal text, questions.

**Push line**, in `language`, plain text: `Upwork: [<M> take][, <K> maybe][, <I> invited] · #<short id> <title> · <client's price>` (a part that would be zero is left out) for the first news card (the client's price as above), with ` +<n>` after the title when there are more news cards; cut the title so the line stays under 200 characters.

Off limits here: `confirm_preview` and every other write to Upwork; `PROPOSALS_SYNCED_UNTIL` and the proposals sync (`references/sync.md`); a card's `Status`, except auto skip; the rules pages.
