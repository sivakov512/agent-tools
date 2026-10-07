---
type: 'llm'
focus: 'last_message'
---
- Reports a new Risk about finding a laboratory, linked to the task Laboratory found and the milestone Hardware.
- Does not move any dates and does not claim the Hardware milestone is late.
- Does not ask the user to confirm creating the risk.

Judge only these claims. Different wording, ordering, extra harmless detail and extra read calls are fine. Answer FAIL only if one of the claims above is clearly false.
