# In chat

Everything the user does by hand with the pipeline: look at a posting, get an estimate, draft and send a proposal, set a card's status, ask about connects. The user's own rules for content — what to take, how to price, how to write — are in Search rules and Proposal guide; read the one the scenario needs before acting, every time, since the user edits them.

## Looking at a posting — "what about #584350?", a link, "is this worth it?"

Fresh data first (SKILL.md → Finding things): `find_jobs` `get` on the job. Then the link, and an assessment by Search rules with the card structure — what's needed, complexity, risks, to clarify, estimate — as prose, with the fresh numbers: proposals now vs at find time, hired, connects to apply.

If the card does not exist and the verdict is Take or Maybe, offer to create it (hourly card format); do not create it silently.

## Skip and applied — "skip it", "not this one", "already applied"

- "Skip", "pass", "not interested" about a posting → `Status` Skipped on its card, without asking, with `Skipped by` manual, `Decided on` now, and `Skip reason` only when the user gave one or one came up in this conversation — never a question just to get one.
- "Applied", "sent it", "I responded" → `Status` Applied, `Decided on` now; no card yet → create one with the posting's data, then set Applied. What was sent reaches Proposals with the next sync (or "sync proposals" now).
- Undoing: "put it back", "unskip" → `Status` New, and clear `Skipped by`, `Skip reason`, `Decided on`.

Reply with one line: `#584350 → Skipped` (with `: <reason>` when there is one).

## Drafts — "draft #584350", "redo the draft for #584350"

Only for these short commands to fill a proposal for the dashboard. "Write a proposal" and "apply to this" are **Proposals** below: the whole package in this chat. Drafts mode (`references/drafts.md`) for that card, here in the conversation: fresh data, advice, and for Apply the proposal written to Proposals. It works whatever `auto_drafts` says — asking is the decision. On Sonnet, say once that drafts are written for Opus and the text will drift from the guide; do it anyway if the user insists.

## Proposals — "write a proposal", "apply to this", "respond to the invitation"

Read the **Proposal guide** first and follow it for the text, the portfolio selection, attachments, screening answers, rate and boost. Whatever it says wins over this section. What this section fixes is the mechanics and the guard:

1. **Fresh data**: `find_jobs` `get`. Check whether the client has already hired the number sought, whether there are screening questions, and the current connects price. If the job already has a proposal in `proposals_open` (`State` Ready), start from it — the user may have read it on the dashboard — and change what the fresh data or the user's remarks require.
2. **Preview, not submission**: gathering the form data (`manage_proposals` create → preview: screening questions, bid statistics, boost) is not a submission and costs nothing; do it as part of this request without asking. First `list_freelancer_proposals` `invitations`: an invitation to this job uses `accept_invitation` instead of `create`. If the preview is blocked, build the package from `find_jobs` `get` and mark screening and boost as unavailable.
3. **One package, one message.** The message starts with the `Fresh data:` line — no greeting, no preamble, no "here's the proposal" — and follows this order with these labels, plain text (no bold on the numbers), because the user reads it on a phone, opens the link to check the posting and says "ok" or "send it"; anything before the package pushes the text they need to read below the fold:

```
Fresh data: proposals <N> (<M> at find time), hired <N>, <N> connects to apply.
<link to the posting>

**Proposal text:**

<code block with the full text>

**Rate:** <$N/hr in the form field | fixed $N, and how it is split, if the guide says>

**Screening, drafts:**   ← only if there are questions
1. *<question as posted>* → <draft answer>
2. *<question>* → ⚠️ check: <draft + why it needs the user>

**Boost:** <N> connects to apply, balance <N>. <no auction | auction: …>. Recommend: <boost to <slot> | no boost> — <one phrase why>.

**Files:** <which, by the guide's file names | none needed>

```

   Before replying, read the draft reply once as the user will. It starts with `Fresh data:` — anything above it (a verdict, a summary of your work) or between the blocks pushes the text down on a phone; a concern about fit fits into the Fresh data line in a few words. The proposal text breaks none of the guide's "never" lines. Every claim about past work can be pointed to in the guide's portfolio lines or the profile — a client who asks about a detail you added and the user never did will stop trusting the rest; what is missing becomes a question to the client instead. The package around the text is in `language`; only the proposal text and screening answers follow the posting's language.

   The package also goes to the job's row in Proposals (`references/drafts.md` §4 — the same columns, sections and create-or-replace; `State` Ready, `Written` now) in the same turn, and again after every edit — so the latest version is in Notion even if the user sends it from the dashboard or the website. No card yet (an invitation, a job found outside the pipeline) → create one first, as the hourly run would, with `Status` New.

   Then nothing — wait. Any time you show the full text again (an edit, the final), put the link right above it so the user does not scroll for it.
4. **Send only on the user's plain "send it"** about this proposal, in this conversation. Right before, name the total once more: connects for the application, boost separately, balance after. Attachments are uploaded only after the package is approved, with the mechanics Field notes describe. If the platform cannot take the shape the guide asks for, say so and hand the user what to paste into the web form.
5. **After sending**: write this proposal exactly as the sync does (`references/sync.md` §2, the `get` of the proposal just sent): the Proposals row becomes what Upwork stored, including the boost it actually took; the card Applied. Then one line to the user with what was sent and what it cost.

Never guess a fact for a screening answer or the text: profile, portfolio, cards and what the user said in this conversation are the only sources. Where an honest answer depends on something only the user knows, mark the draft ⚠️.

## Proposals sync — "sync proposals", "pull my past proposals"

`references/sync.md`: no period → from its watermark, as a digest would; a period the user names ("for the last 3 months", "all") → from that start. Reply with one line: how many proposals written, how many of them for jobs the pipeline never saw, how many already in place.

## Connects — "how many connects", "what's my balance"

`get_freelancer_financials` `connects_balance`: balance (free / paid), and the recent history, paged with the cursor while it covers the period asked. Purchases are not spend; refunds are shown separately from spend.

## Rules the user states in chat

"From now on skip anything with X", "always ask about Y", "the rate is Z" — a confirmed rule goes into Search rules or Proposal guide as one line refining the existing item, right away (SKILL.md → Questions and quirks). An unclear case the user did not decide becomes a question row, not a rule.

## What stays off limits here

Sending, boosting, messaging or saving anything on Upwork without the explicit go for that action; moving `PROCESSED_UNTIL`; editing Runs.
