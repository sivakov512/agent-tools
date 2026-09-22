---
type: 'llm'
focus: 'trace'
---
Judge only the agent's final message (the report) against the Notion data the agent received in its tool results in this trace.

- Every fact the report states — dates, statuses, who is waited on, causes, what is linked to what — appears in those tool results (paraphrase and simple arithmetic on them are fine).
- The report makes no promise, decision, intention, reason or offer on the user's behalf that the tool results do not record (for example "we'll ship…", "before we can move forward with…", "happy to jump on a call"). Questions or notes addressed to the user outside the report itself do not count.

Answer FAIL only if one of these is clearly false, and name the sentence.
