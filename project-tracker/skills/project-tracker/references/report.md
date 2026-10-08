# Reading the tracker and the weekly report

## Reading the tracker

### My week — "what's on me this week?", "what do I have to do?"

Across the active projects, from today through Sunday (on Friday to Sunday, through the next Sunday): the tasks and milestones the user has to move — not Waiting, `Waiting on` empty — grouped by project:

- **Overdue**: items past their end.
- **Due this week**: items whose end falls in the window.
- **In progress**: what is underway without a date in the window.
- **Starting**: Planned items whose start falls in the window.
- **Decide**: Questions and Blockers that are on the user.

Then one short line of whom to chase (Waiting items, oldest first). Undated Planned tasks are listed only under an In-progress milestone or in a project without milestones, as "no date".

### Overview — "what's burning?", "who do I chase?", "what got done this week?"

A question about what is burning or whom to chase is this Overview even when it says "this week"; My week answers only what the user has to do.

From the root views `Next up`, `Open` (problems), `Recently resolved`, and the Tasks views `All` and `Waiting on`; Done milestones and tasks are in no root view, so what closed this week comes from the active projects' `Schedule` and `Tasks` views. Only projects in `Active` count — skip rows of other projects. The criteria are the dashboard's:

- Late and due soon: open milestones and tasks past their end (with days late), then those ending in the next 7 days, by project — nothing paused is late.
- On hold: paused milestones, with reason and how long.
- Chase: Waiting tasks and problems waiting on someone, grouped by who, oldest first (a problem's age counts from `Opened`; a task's from the start of its `Dates`, or, without dates, from the history line that set it Waiting).
- On you: tasks with empty `Waiting on` that are in progress, start or end in the next 7 days, or have no dates under the In-progress milestone or in a project without milestones; Blockers and Questions with empty `Waiting on`. Risks are not on you: the open ones go in one line of their own.
- Closed this week: milestones and tasks done and problems resolved in the last 7 days, today included — when there are any.

If the config has a `dashboard` line, end with its link: the same picture, live.

## Weekly report — "what happened on the weather station this week?", "weekly report", "draft the client update"

**Form.** By default the report is your answer in the conversation, in the conversation's language. Write it as an email to the client, in English, only when the user asks for an email, a client update or something to send. With several active projects and none named, ask which.

**Window.** From the same weekday one week ago through today, both included, or since the previous report if the user says when it went out.

**Collect**, all five every time:

1. The project's `Schedule` view; fetch the In-progress and Paused milestones, milestones finished in the window, open milestones past their end, and milestones whose `Dates` overlap the window — their history lines dated in the window.
2. The project's `Tasks` view; fetch the tasks finished in the window, the In-progress and Waiting ones, open tasks past their end, and tasks whose `Dates` overlap the window — their history lines dated in the window. Tasks are the report's main lines: what was done, what is under way, what waits on whom.
3. The project's `Problems` view — problems opened in the window and everything still waiting on someone.
4. The root `Recently resolved` view — this project's problems resolved in the window. Resolved problems are often the main news.
5. The project page's notes and history lines dated in the window; its private notes only as context for the user, never in a client email.

**Write**: what was done, what is next (with dates), what is waiting on the client or a vendor (by name), what is late or on hold and why, and — if dates were moved with the client — which dates and why. Notes that a delay is "not agreed with the client yet", and dates only proposed, are for the user: mention them next to the draft, never in a client email. Plain prose from an engineer, not a dashboard export.

Every fact comes from those five sources (the rule on writing only what was said applies in full). An email pulls towards phrases that read naturally but put words in the user's mouth — "as discussed, we'll…", "before we can move forward with…", "happy to jump on a call". Leave out every intention, promise, reason or offer the tracker does not record; the user adds their own before sending. If something the reader would expect is missing (an item due today with no progress logged), say so to the user next to the draft instead of filling it in. If all five sources are empty for the window, say so and ask what happened. Nothing is written to Notion.
