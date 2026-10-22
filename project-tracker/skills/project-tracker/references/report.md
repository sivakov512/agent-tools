# Answering from the tracker

Started by a question the tracker answers: how a project is going, what is on the user, what is due, late or burning, whom to chase, what got done; or a request for a weekly report or a client update.

**Inputs:** the views each block names (**Where the blocks come from**); for the weekly report, the five sources of its **Collect**.

## The goal

Answer what was asked, from what the tracker records and nothing else; reading writes nothing. The scope, the period and the blocks come from the question; the **Defaults** below are for the usual questions when the user says no more. They are examples of the blocks, not separate procedures: a question none of them names ("what's due in the next two weeks?", "what did I close in October?", "status of everything") is answered with the blocks it asks for, over its own period and scope.

- **Scope.** The project the user names; else every project in `Active`, a paused one under **On hold**. Rows of other projects are left out.
- **The period.** The one the user names, looking back ("this week", "two weeks", "since Oct 1") or ahead ("the next two weeks", "by the end of the month"). When none is named: back, the last 7 days, today included; ahead, today through Sunday, or through the next Sunday when today is Friday, Saturday or Sunday. One default each way, so no two answers count their days differently.

## The blocks

Each has one meaning in every answer. Nothing Paused, or under something Paused, is late, due or on the user (SKILL.md → **How lateness works**): it is on hold.

- **Now** — the In-progress milestones with their ends, each with its In-progress and Waiting tasks; in a project without milestones, its In-progress tasks.
- **Late** — open milestones and tasks whose end is before today, with days late; looking back, those finished in the period after their end, with how late.
- **Due** — open milestones and tasks whose end falls in the period ahead.
- **Starting** — Planned milestones and tasks whose start falls in the period ahead, or has passed without the work starting ("not started").
- **On you** — what the user has to move: open milestones and tasks, not Waiting and with `Waiting on` empty (a milestone with open tasks counts through them), that are In progress, late, due or starting, or Planned without dates under an In-progress milestone or in a project without milestones ("no date"); Blockers and Questions with `Waiting on` empty. A risk is never on the user.
- **Chase** — Waiting tasks and problems waiting on someone, grouped by whom, oldest first: a problem's age counts from `Opened`, a task's from the start of its `Dates`, or, without dates, from the history line that set it Waiting.
- **On hold** — paused projects and milestones, with the reason and since when (their pause line, `references/state.md`).
- **Closed** — milestones and tasks finished, and problems resolved, in the period looking back.
- **Next** — the next one or two open milestones or tasks by `Order` after what is under way, with their dates if they have them.
- **Risks** — the open risks with their consequence, in one line.

## Where the blocks come from

Each view is read as SKILL.md → **Reading a view** says.

- **One project:** its `Schedule`, `Tasks` and `Problems` views (the first two hold its Done rows too), and the root `Recently resolved` for its problems resolved in the period.
- **Across projects:** the root views only — Projects `Active`; Milestones `Next up` and `Done`; Tasks `All`, `Waiting on` and `Done`; Problems `Open` and `Recently resolved` — never each project's views, since the root views hold every row.
- **Pages** only for what no view holds: the history line that dates a task's wait, a pause's reason.

`Recently resolved` holds the past month: for a period that starts earlier, the answer says that problems resolved before then are not counted.

## Defaults

The usual questions, and the blocks that answer them in this order; an empty block is left out, except that a question about lateness gets "nothing late".

- **"How is X going?"** — Now; Late ("nothing late" if none); then what holds it — its Blockers first, then Chase for this project with since when, On hold, Risks and open Questions in one line; Next. With no project named and several active, the overview below.
- **"What's on me this week?", "what do I have to do?"** — On you, grouped by project: late first, then due, in progress, starting, and the Blockers and Questions to decide; then one short line of whom to chase. A Waiting item is never on the user.
- **"What's burning?", "who do I chase?", "what got done this week?"** — the overview, across projects: Late, then Due, by project; On hold; Chase; On you; Risks in one line; Closed when there is any. A question about what is burning or whom to chase takes this default even when it says "this week": "what's on me" answers only what the user has to do. If the config has a `dashboard` line, end with its link: the same picture, live.
- **A weekly report or a client update** — one summary of the period, below.

## Weekly report — "what happened on the weather station this week?", "weekly report", "draft the client update"

**Form.** A report is one summary of what matters, the same for whoever reads it. By default it is your answer in the conversation, in the conversation's language; when the user asks for an email, a client update or something to send, it is the same summary in English with a greeting and a sign-off around it. The reader changes only what is private: a client never sees Private notes or what **Who sees what** keeps private (SKILL.md). With several active projects and none named, ask which.

**Window.** **The period** looking back (above).

**Collect**, all five every time:

1. The project's `Schedule` view; fetch the In-progress and Paused milestones, milestones finished in the window, open milestones past their end, and milestones whose `Dates` overlap the window — their history lines dated in the window.
2. The project's `Tasks` view; fetch the tasks finished in the window, the In-progress and Waiting ones, open tasks past their end, and tasks whose `Dates` overlap the window — their history lines dated in the window. Tasks are the report's main lines: what was done, what is under way, what waits on whom.
3. The project's `Problems` view — problems opened in the window and everything still waiting on someone.
4. The root `Recently resolved` view, read back to the window's start (SKILL.md → **Reading a view**) — this project's problems resolved in the window. Resolved problems are often the main news.
5. The project page's notes and history lines dated in the window; its private notes only as context for the user, never in a client email.

**Write**: what was done, what is next (with dates), what is waiting on whom (by name), what is late or on hold, and — if dates were moved — which dates; a why only where the tracker records it. Dates only proposed are for the user: mention them next to the draft, never in a client email. Plain prose from an engineer, not a dashboard export.

A report states only what the tracker records: every sentence comes from those five sources (the rule on writing only what was said applies in full). An email pulls towards phrases that read naturally but put words in the user's mouth — "as discussed, we'll…", "before we can move forward with…", "could you let me know…", a cause linking two facts — so it carries no request, reason, intention, promise or offer the tracker does not hold; the user adds their own before sending. If something the reader would expect is missing (an item due today with no progress logged), say so to the user next to the draft instead of filling it in. If all five sources are empty for the window, say so and ask what happened. Nothing is written to Notion.

## Output

An answer in the chat, plain text, every row named by its ID and name (SKILL.md → **The tracker**), or a draft email for the user to send.

## Off limits

Any write to Notion; a fact, intention or promise the tracker does not record.
