# Weekly report

"What happened on the weather station this week?", "weekly report", "draft the client update".

**Form.** By default the report is your answer in the conversation, in the conversation's language. Write it as an email to the client, in English, only when the user asks for an email, a client update or something to send. With several active projects and none named, ask which.

**Window.** From the same weekday one week ago through today, both included (on a Friday, from last Friday), or since the previous report if the user says when it went out.

**Collect**, all four every time:

1. The project's `Plan` view; fetch the In-progress and Paused milestones, milestones finished in the window, open milestones past their end, and milestones whose `Dates` overlap the window — their history lines dated in the window.
2. The project's `Open items` view — issues opened in the window and everything still waiting on someone.
3. The root `Recently resolved` view — this project's issues resolved in the window. Resolved problems are often the main news.
4. The `Notes` tab lines dated in the window.

**Write**: what was done, what is next (with dates), what is waiting on the client or a vendor (by name), what is late or on hold and why, and — if dates were moved with the client — which dates and why. Notes that a delay is "not agreed with the client yet" are for the user: mention them next to the draft, never in a client email. Plain prose from an engineer, not a dashboard export.

Every fact comes from those four sources (the rule on writing only what was said applies in full). An email pulls towards phrases that read naturally but put words in the user's mouth — "as discussed, we'll…", "before we can move forward with…", "happy to jump on a call". Leave out every intention, promise, reason or offer the tracker does not record; the user adds their own before sending. If something the reader would expect is missing (a milestone due today with no progress logged), say so to the user next to the draft instead of filling it in. If all four sources are empty for the window, say so and ask what happened. Nothing is written to Notion.
