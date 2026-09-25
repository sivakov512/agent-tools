# Hourly search

One run: read the rules, take the queue of postings published since the watermark, filter and assess them, write cards and a run log, move the watermark, and send one message only if something is worth applying to fast.

## 1. Read first

Fetch **Search rules** and **Field notes** (ids from the config). If Search rules cannot be fetched, or its content is not a search specification: do not improvise from memory — write a Runs row with `Status` empty and `Window` = `rules read failed`, send nothing, stop.

## 2. The queue

Fetch **Run state**; find `PROCESSED_UNTIL: <ISO time>`.

- Queue = from `PROCESSED_UNTIL − 10 min` to now. The overlap catches postings that appeared while the previous run was writing.
- No line, or unparseable → the last 70 minutes.
- Longer than 24 h → only the last 24 h (older backlog is dropped; it shows only as the window in the log).

Not longer than 2 h: process it whole, and at the very end — after every card, the log and the message — rewrite the line to now (`replace_content` on Run state, format `2026-09-20T14:00+02:00` in the config timezone).

Longer: work in 2-hour chunks, oldest first (search results arrive newest first — reverse them). After each chunk is fully written, rewrite the watermark to that chunk's end. Continue to now or to the budget — about 25 detailed job requests per run. At the budget: stop, log `partial`; the next run takes the rest. The watermark moves only after a fully written chunk; a run interrupted mid-chunk leaves it where it was.

## 3. Search

Run each query from Search rules as its own `find_jobs` search (`action: search`), sorted by recency, paginating until published dates leave the queue window. Merge results by job id. No budget, level, duration or payment-verified filters unless the rules say so.

## 4. Two-stage filter

**Stage 1**, on title and snippet: drop only what is obviously outside the user's field per the rules' "reject on sight" items. Keep anything that might fit — snippets lie. Skill tags are noise; never filter on them.

**Stage 2**, on the full text (`find_jobs`, action `get`, one call per survivor): apply the rules' reject list, then flags, then verdict. Decisions come from the full text only. Two rejects hold for every user, whatever the rules say: **already hired** — the client has hired as many people as the posting seeks; **not a job** — a personal message or a request for direct contact dressed as a posting.

The default flags mean the same for everyone (the rules decide how much each weighs on the verdict): `no client history` — the client has never hired; `partially hired` — some of the people sought are hired, not all; `timezone lock` — a hard requirement on presence or working hours; `mandatory calls` — regular calls required; `budget mismatch` — a fixed budget far below the scope; `full-time` — 30+ hours a week or 6+ months, effectively a hire; `unfamiliar tech` — a tool, platform or part the user has not worked with. The user's own flags are defined in the rules.

A posting already handled by the previous run (in the overlap, present in Jobs by `Job ID`, or in the previous run's log): skip silently — not counted, not logged.

**A case the rules do not settle.** The test is mechanical: the posting's main deliverable is not on the rules' in-scope list and not on their reject lists (a study or report, consulting, a review with an optional build, a mixed role), or a flag would fit but is not listed, or two rules pull in different directions. "Probably out of scope" is not a rule — if you had to reason it out, it is a question. It still gets a verdict for this run, by the nearest analogy, with the usual reason in the log. And it gets recorded, before the run log is written: query `questions_open`; the same question already there → append this job id to `Job IDs`, `Seen` + 1; not there → a new row (SKILL.md → Questions and quirks). Skipping this step is how the same doubt gets re-decided differently every hour; recording it is what lets the weekly review turn it into a rule once.

## 5. Cards

For each **Take** or **Maybe** — rejected postings get no card — check Jobs by `Job ID` in `jobs_all` (every status — `jobs_inbox` alone misses Skipped and Applied cards): an existing card is left as is, whatever its status. Otherwise `notion-create-pages` into `jobs` with the properties from SKILL.md; `Status` New; `Found` = the clock time when you write the card (not the chunk boundary, not the publish time); `Published` from the API; `Link` = `https://www.upwork.com/jobs/~02` + id; `Client time` = the API's `duration` string exactly as returned (`1 to 3 months`, `Less than 1 month`), nothing added or rephrased; `Client $` as the posting states it (`$1,500 fixed`, `$20–50/hr`, `rate not stated`); `Client` and `Competition` as one line each, skipping fields the API did not return (no dashes) and zero counts ("0 hired" is left out); `Score` = the sum of the points of every criterion in the rules' Ranking section that holds for this posting when the card is written, and `Score why` = those criteria in a few words each, in `language`, in one line (`6 hires · rating 4.9 · 3 proposals · budget mismatch −2`); no Ranking section → leave both empty. The score is not recomputed later, so criteria that go stale with time (the posting's age) are not the ranking's business — the dashboard handles age itself. `Run` is set after the chunk's run row is written (§7): update each card of the chunk with `update_properties`.

The body: exactly these five sections in this order, nothing else — the headings in English as written (structure), the text under them in `language`; the run message and the dashboard quote them:

```
## What's needed
2–4 sentences in your own words: what the client actually needs and where the real difficulty is, plus what they already have (hardware, files, constraints, stage). Do not list components or requirements back — the card explains, it does not retell.
## Complexity
One sentence why this level (the level itself is the Complexity property).
## Risks
- bullets
## To clarify
- only questions whose answer changes the estimate
## Estimate
One sentence: why these hours and this price (numbers live in My hours / My $).
```

## 6. Questions and quirks

Any question from step 4 is written now (or bumped), and any new fact about the API or tools met during the run goes as one line to Field notes. Neither appears in the message.

## 7. The run log

Always, including empty runs: one row in `runs` per chunk, written when the chunk is done. `Run` = `DD.MM HH:MM` in the config timezone; `Status` ok (queue fully processed), empty (processed, nothing relevant), partial (stopped at the budget); the counters; `Window` = the range actually processed. Body — written in the `content` of the same `notion-create-pages` call that makes the row, never added later with `replace_content`: each stage-2 reject as *title* — link — one sentence — **reason from the reject list**. Stage-1 rejects only as the `Title pass` number, except a doubtful one or one whose title hints at the user's field — log it with the note "stage 1, doubt". Obvious foreign work caught at stage 1 (web, design, marketing, data entry) is never listed, not even as "reject on sight". Partial: add `Not processed: N postings, window HH:MM–HH:MM, next run takes them`.

## 8. The message

The message is the "respond fast" signal. Send it once per run and **only if this run wrote at least one Take card**. Maybe cards go into it too, but on their own they do not earn a message: Maybe only, or nothing written → send nothing at all — no empty message, no "nothing found", no report. Finish silently. The user sees Maybe cards in the digest and on the dashboard. Questions never go into the message.

Format, in `language` (labels translated, structure kept), only these blocks, nothing before or after:

```
# Run HH:MM · window HH:MM–HH:MM
Checked N · take M · maybe K · connects L

## Take
### 1. #<short id> <title as posted>

**<Client $>** · <Client time> · <N> connects · [Upwork →](<link>) · [Notion →](<card url>)

Client: <Client line>
Competition: <Proposals> proposals, <Competition line>

<the What's needed paragraph, no heading>

Complexity **<low|medium|high>** — <the Complexity sentence>

Risks:
- …

To clarify:
- …

Estimate **<My hours> h** · ask **<My $>** — <the Estimate sentence>

---
### 2. …

## Maybe
…
```

`<short id>` is the last six digits of `Job ID`, as on the dashboard, so the user can refer to an item by its number in this message or by its id. Numbering runs across both sections; an empty section is left out; a horizontal rule between cards; `Client:` and `Competition:` labels not bold. `connects L` in the header is the sum over the listed cards.

Forbidden in the message: describing your own actions, anything outside the format, draft proposal text. Before the final reply, re-read SKILL.md → automatic mode: all writes done, then the message alone — or an empty reply.
