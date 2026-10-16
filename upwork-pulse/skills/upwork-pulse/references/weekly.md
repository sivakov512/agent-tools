# Weekly review

Once a week the open questions — the cases the rules did not settle — are put to the user with a recommendation each, and the answers become rules. This is the only place questions surface: hourly messages and digests never carry them.

Started by the weekly task, or by the user asking about open questions. Inputs: the root page; the mode reads `questions_open` and, when there are open questions, the rules pages (§1). Its output is the report (§1), then the rules the user confirms (§2).

## 1. Automatic part

Query `questions_open`. No open rows → change nothing, no push; the report is the header (`# Questions this week · 0`) and the Log.

Otherwise fetch **Search rules** and **Proposal guide** (the recommendations must point at the item they would refine) and write the report:

```
# Questions this week · N

1. <Question, one line> — seen <Seen>×, jobs <short ids>
   Recommend: <yes | no | so-and-so> — <one phrase why, naming the rules item or guide section it touches>
2. …

Stale in the rules/guide: <items that contradict or duplicate each other; leave the line out if none>

Reply by number — "1 yes, 2 no, 3 as recommended" — and I will apply it and close them.

## Log
- Questions: <N> open
- Problems: <one line per problem: where, what failed, what is left undone>
```

`Questions` is always there; `Problems` only when a call failed or was blocked (SKILL.md → *Automatic mode*).

No description of your work outside the Log, nothing outside the format, no Notion changes before the user answers.

**Push line**, in `language`, plain text: `Upwork: <N> open questions for the weekly review`. Last steps: with open questions, load `PushNotification` and push the line; then the final reply — the report alone, its first characters `# Questions`. None → no push, the report all the same.

## 2. After the user answers

For each question the user decided:

1. Write the rule and close the question as SKILL.md → *Questions and quirks* says (a confirmed rule). "As recommended" means your recommendation; keep the pages' language.

A question the user did not answer stays Open. Stale or duplicate items are edited only when the user says so.

End with one short message: what was written and where.

Always off limits in this mode: writing anything to Upwork; touching `PROCESSED_UNTIL`; changing rows in Jobs or Runs.
