# Weekly review

Once a week the open questions — the cases the rules did not settle — are put to the user with a recommendation each, and the answers become rules. This is the only place questions surface: hourly messages and digests never carry them.

## 1. Automatic part

Query `questions_open`. No open rows → change nothing, and the final reply is empty (SKILL.md → automatic mode).

Otherwise fetch **Search rules** and **Proposal guide** (the recommendations must point at the item they would refine) and send exactly one message:

```
# Questions this week · N

1. <Question, one line> — seen <Seen>×, jobs <short ids>
   Recommend: <yes | no | so-and-so> — <one phrase why, naming the rules item or guide section it touches>
2. …

Stale in the rules/guide: <items that contradict or duplicate each other; leave the line out if none>

Reply by number — "1 yes, 2 no, 3 as recommended" — and I will apply it and close them.
```

No description of your work, nothing outside the format, no Notion changes before the user answers.

## 2. After the user answers

For each question the user decided:

1. Write the rule as one line into the right section of Search rules or Proposal guide — refining the existing item (`update_content` on that item), not a new paragraph. "As recommended" means your recommendation. Keep the pages' language.
2. Set the question's `Status` Resolved and put the decision in `Decision`, one phrase. Rows are never deleted.

A question the user did not answer stays Open. Stale or duplicate items are edited only when the user says so.

End with one short message: what was written and where.

Always off limits in this mode: writing anything to Upwork; touching `PROCESSED_UNTIL`; changing rows in Jobs or Runs.
