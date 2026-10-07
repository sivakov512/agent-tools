# Weekly report

"What happened on the weather station this week?", "weekly report", "draft the client update".

**Form.** By default the report is your answer in the conversation, in the conversation's language. Write it as an email to the client, in English, only when the user asks for an email, a client update or something to send. With several active projects and none named, ask which.

**Window.** From the same weekday one week ago through today, both included, or since the previous report if the user says when it went out.

**Collect**, all five every time:

1. The project's `Schedule` view; fetch the In-progress and Paused milestones, milestones finished in the window, open milestones past their end, and milestones whose `Dates` overlap the window — their history lines dated in the window.
2. The project's `Tasks` view; fetch the tasks finished in the window, the In-progress and Waiting ones, open tasks past their end, and tasks whose `Dates` overlap the window — their history lines dated in the window. Tasks are the report's main lines: what was done, what is under way, what waits on whom.
3. The project's `Problems` view — problems opened in the window and everything still waiting on someone.
4. The root `Recently resolved` view — this project's problems resolved in the window. Resolved problems are often the main news.
5. The `Notes` tab lines dated in the window.

**Write**: what was done, what is next (with dates), what is waiting on the client or a vendor (by name), what is late or on hold and why, and — if dates were moved with the client — which dates and why. Notes that a delay is "not agreed with the client yet", and dates only proposed, are for the user: mention them next to the draft, never in a client email. Plain prose from an engineer, not a dashboard export.

Every fact comes from those five sources (the rule on writing only what was said applies in full). An email pulls towards phrases that read naturally but put words in the user's mouth — "as discussed, we'll…", "before we can move forward with…", "happy to jump on a call". Leave out every intention, promise, reason or offer the tracker does not record; the user adds their own before sending. If something the reader would expect is missing (an item due today with no progress logged), say so to the user next to the draft instead of filling it in. If all five sources are empty for the window, say so and ask what happened. Nothing is written to Notion.
