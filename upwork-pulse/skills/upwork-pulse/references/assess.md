# Assessment — the hourly run's survivors: stage 2, cards, drafts

The careful half of the hourly run. The search (`references/hourly.md`) finds the postings and drops the obvious foreign work by title; this mode opens each one that is left, decides it by the Search rules, writes its card and estimate, and — with `auto_drafts: on` — goes straight on to the advice and the proposal (`references/drafts.md`). It runs on Opus as the hourly run's subagent, one chunk per call, because what is decided here — a lead kept or dropped, the hours and the price, the proposal — is what the user acts on; the search stays on the cheaper model, and an hour with nothing to open never starts this mode. It writes to Notion and sends nothing: no message, no push. The hourly run itself runs this mode only with no Agent tool at all, or after its subagent failed with nothing returned (`references/hourly.md` §5).

## 1. Inputs

From the prompt: the root page, the chunk's Runs row (created by the hourly run with the counts it knows), the chunk's window, the survivors of stage 1 (job ids with their publish time, already-seen cards removed), the pending invitations that need a card (job ids), and the catch-up cards the hourly run chose for drafts (card URLs, `references/hourly.md` §6). Read the config, **Search rules**, **Field notes** and **Run state** in the first turn; `jobs_recent` when there are deferred postings to check (§2), `questions_open` when a case is unsettled (§3), the **Proposal guide** only when drafting (§6). A config below the schema this skill works with (SKILL.md → *Pipeline update*) → write nothing, return `pipeline updating`; Search rules that cannot be read or hold no rules → write nothing, return `rules unreadable` (§7). Either one leaves the chunk unfinished.

## 2. Job pages

Stage 2 decides on the full text: `find_jobs` `get` (SKILL.md → *Upwork calls*), one call per posting, at most three in one turn — a burst of job pages is what Upwork refuses. The survivors first, then the invitations' jobs, then the deferred ones below.

**`get` says not found or closed** for a posting the search just listed: the posting is gone — count it as rejected, and as gone, in the return (§7), and go on.

**Job pages refused.** `get` can answer PERMISSION ("This job can't be opened right now. It may be private or invite-only, or jobs are being opened too quickly"). Upwork gives this one answer both for a posting that went private and for job pages opened too fast, says no time for how long, and asks not to retry the same job — retrying makes the refusal last. So one such answer proves nothing about the posting; it is handled with a growing pause, kept in Run state on the line `JOB_PAGES_PAUSE: <ISO time until> <hours>`:
- **Before the first job page** (a survivor, an invitation's job, a deferred one): a `JOB_PAGES_PAUSE` time still ahead → open none; every survivor goes straight to `DEFERRED` (below).
- **The first PERMISSION on a survivor or a deferred job** → open no more job pages in this call, and write the pause: 1 hour from now with no line yet, else double the line's hours, at most 8 (1 → 2 → 4 → 8 → 8…), as `JOB_PAGES_PAUSE: <now + hours> <hours>` (`update_content` on the line; no line → `insert_content` at the end).
- **A job page that opens** → remove the `JOB_PAGES_PAUSE` line, if there is one: pages are open again.
- **An invitation's job is not deferred** and a refusal on it writes no pause: an invited job is often invite-only, so its PERMISSION says nothing about pacing, and a pause it doubled every hour would stop every job page for good. Its card is made from the invitation itself instead (`list_freelancer_proposals` `invitations`: title, job id, link, the client and terms it carries) — `Verdict` Maybe, `Flags` `invited`, `Locked` checked, the columns it cannot fill left empty, `What's needed` saying the posting would not open, and `Advised on` = now with `Advice why` saying the posting would not open and no `Advice`: drafts has nothing to advise from, and `Advised on` keeps the catch-up from retrying it — so the user has it and decides.

Every survivor not opened — refused, or not tried because of the pause — goes to the `DEFERRED:` line in Run state, `DEFERRED: <job id>@<its publishedDateTime>, …` (the same edits). The chunk still counts as processed, so the window is not searched again, and nothing is lost.

**Deferred postings** are opened once job pages are allowed again (no pause ahead). A deferred job that is also one of this chunk's survivors (it came back in the search's overlap) is taken off the line and handled as a survivor — never twice. This chunk's own survivors first; after the first `get` that succeeds (or, with no survivor of its own, one `get` on the newest deferred one — the probe) take up to 5 deferred ones, newest first (a fresh posting is worth more: fewer proposals on it yet), through the already-seen check of `references/hourly.md` §4 and stage 2 like this chunk's own. Each one opened, or gone, leaves the line (drop the line when it is empty). A refusal → the pause as above; they wait. A posting published more than 48 hours ago leaves the line unopened, counted in the return's `dropped after 48 h`. Only an error of the call itself (timeout, rate limit, server error) leaves the chunk unfinished: return it as a problem, so the hourly run keeps the watermark where it was.

**Budget**: the job pages the prompt gives (`Budget:`; when it gives none, the hourly run's, `references/hourly.md` §2), drafts' pages included; the return says how many were opened (`pages`). At the budget, stop: the run row says `partial` (§5) and the return lists the postings not opened as `not processed`; the hourly run then leaves the watermark at the chunk's start (`references/hourly.md` §2), so the next run takes them. The budget running out during drafts (§6) is no stop of this kind: stage 2 is done and the row stays as §5 wrote it; the cards not yet advised wait for a later catch-up.

## 3. Stage 2 — the decision

Apply the rules' reject list, then flags, then verdict — on the full text only; the title and snippet that stage 1 saw prove nothing. Two rejects hold for every user, whatever the rules say: **already hired** — the client has hired as many people as the posting seeks; **not a job** — a personal message or a request for direct contact dressed as a posting.

The default flags mean the same for everyone (the rules decide how much each weighs on the verdict): `no client history` — the client has never hired; `partially hired` — some of the people sought are hired, not all; `timezone lock` — a hard requirement on presence or working hours; `mandatory calls` — regular calls required; `budget mismatch` — a fixed budget far below the scope; `full-time` — 30+ hours a week or 6+ months, effectively a hire; `unfamiliar tech` — a tool, platform or part the user has not worked with. The user's own flags are defined in the rules.

An invitation always gets a card: the user decides on an invitation, not the filter. A posting the rules would reject becomes Maybe, with the reject reason as the first line under Risks; its flags include `invited`, and `Locked` is checked (SKILL.md → *Locked*).

**A case the rules do not settle** is never rejected: it is at least a Maybe (a Take when the rules otherwise make it one). The test is mechanical: the posting's main deliverable is not on the rules' in-scope list and not on their reject lists (a study or report, consulting, a review with an optional build, a mixed role), or a flag would fit but is not listed, or two rules pull in different directions (an in-scope item and a reject item both describe it). "Probably out of scope" is not a rule — if you had to reason it out, it is a question. It gets a card, so the user sees it and drafts advise on it, and it is recorded as a question (SKILL.md → *Questions and quirks*). A rejected posting the user never sees is the one mistake nobody can catch later.

## 4. Cards

Each **Take** or **Maybe** gets a card; rejected postings do not. This chunk's cards go in one `notion-create-pages` call into `jobs`, `Run` = the chunk's Runs row: `Status` New, every column filled straight from the `get` response — one fact per column, copied, not summarised:

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
| `Reviewed by` | the model you run on (SKILL.md → *Which model*) |

Numbers are plain numbers in dollars (`1500`, not `$1,500`). A field the API did not return stays empty — no made-up 0, no dash, no "not stated"; a zero the API returns is 0. The score is not recomputed later, so criteria that go stale with time (the posting's age) are not the ranking's business — the dashboard handles age itself.

**`Estimate`** is the estimate itself: one line per part of the work, `<part> — <hours> h` (the part in `language`, short and concrete — "Schematic and layout study against the spec — 3 h", "Ripple and fuse calculations for the 4 channels — 3 h", "Report with severities and annotated images — 5 h"), 3–7 lines, whole or half hours. The lines add up to `My hours` exactly. Work the client asks to be priced apart (a recheck, an option, a later phase), or that the client says is optional, goes last as `+ <part> — <hours> h` and is not in the sum. No money and no total line: the price is `My $`, the total is `My hours`, and the dashboard and the report print both next to it. A line break between lines (a real newline in the text value). Estimate what the posting asks for, not a fuller project you imagine around it: a two-line posting is priced for its two lines, and what it leaves open goes under To clarify.

The body: exactly these four sections in this order, nothing else — the headings in English as written (structure), the text under them in `language`; the report and the dashboard quote them:

```
## What's needed
2–4 sentences in your own words: what the client actually needs and where the real difficulty is, plus what they already have (hardware, files, constraints, stage). Do not list components or requirements back — the card explains, it does not retell.
## Complexity
One sentence why this level (the level itself is the Complexity property).
## Risks
- bullets: what could go wrong with the job. That the rules leave the case open is not one — it is a question and goes only to Questions (§3): run reports quote this section, and questions wait for the weekly review (SKILL.md → *Questions and quirks*).
## To clarify
- only questions whose answer changes the estimate
```

The estimate is the `Estimate` column, not a body section (SKILL.md → *One fact, one place*).

Any new fact about the API or tools met here goes as one line to Field notes.

## 5. The run row

Once the cards are written, one `update_properties` on the chunk's Runs row: `Detailed` (`get` calls), `Take`, `Maybe`, `Status` — ok (fully processed), empty (processed, nothing relevant), partial (stopped at the budget), `Budget hit` checked when it stopped at the budget — `Tool calls` (the row's number plus this call's), and `Reviewed by` = the model you run on (SKILL.md → *Which model*), so the row says who reviewed the chunk even when nothing became a card. Then one `insert_content` at the end of its body: each stage-2 reject as *title* — link — one sentence — **reason from the reject list**; partial adds `Not processed: N postings, window HH:MM–HH:MM, next run takes them`. Nothing is written to the body otherwise, and it is never rewritten.

## 6. Drafts

With `auto_drafts: on`, and only in a subagent (the hourly run doing the assessment itself skips this step: `references/hourly.md` §5): `references/drafts.md` for this chunk's cards (the ones you just wrote: work from them, no second `get`, as `references/drafts.md` §2 says for fresh cards), then for the catch-up cards the prompt names. No card written and none named → no drafts, and `references/drafts.md` is not read: the hourly run has already looked for older cards to catch up (`references/hourly.md` §6), so there is nothing for it to do. Drafts mode's own rules hold, `Locked` left as it is. `auto_drafts: off` → no advice, no proposal.

## 7. Return

To the hourly run, nothing else:

```
model <the model you run on>
pages: <job pages opened, drafts' included>
## Take
<each Take card's block for the report, exactly as references/hourly.md §7 shows it (` · invited` on an invitation's card), numbered from 1, with the Advice line when drafts ran>
## Maybe
<each Maybe card's block, the same way, numbered on>   ← an empty section is left out, its heading too
rejected: <n>[ (<g> of them gone)]
deferred: <n> waiting — #<short id>, …[; job pages paused until HH:MM][; <m> dropped after 48 h]   ← only when the line is not empty
not processed: <n> postings, window HH:MM–HH:MM   ← only at the budget
drafts: <n> advised — apply #<short id>, …; skip #<short id>, …[; not new #<short id>, …][; not advised #<short id> (<why>), …]   ← only when drafts ran, its catch-up included: drafts' per-card lines (`references/drafts.md` §5) summed into this one
problems: <where: stage 2 | cards | run row | drafts> — <what failed, what is left undone>   ← one line per problem, only when a call failed
```

The two headings tell the hourly run which cards are Takes, which its push depends on (`references/hourly.md` §7). A run that could not start — the schema check or the rules of §1 — returns that one line alone: `pipeline updating` or `rules unreadable`.

Off limits here: the watermark (`PROCESSED_UNTIL`), the report and the push — the hourly run's; `confirm_preview` and every other write to Upwork.
