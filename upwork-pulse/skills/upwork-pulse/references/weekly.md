# Weekly review

Once a week the open questions — the cases the rules did not settle — are put to the user, so that each answer becomes a rule or a decision that there is none. This is the only place questions surface (SKILL.md → *Questions and quirks*). It works only if the user can answer it at a glance, on a phone, in a minute: a long list of rules-page sentences goes unanswered, and the questions pile up week after week.

Started by the weekly task, or by the user asking about open questions. Inputs: the root page; the mode reads `questions_open` and, when questions stay open, their jobs' cards and the rules pages (§2). Output: the stale questions closed (§1), the report (§2), then the rules the user confirms (§3).

## 1. Close the stale ones

Query `questions_open`. A question with `Seen` 1 whose `First seen` is 28 days or more before now never came up again: the user chose to bury such ones rather than decide them. Each gets one `update_properties`: `Status` Resolved, `Decision` "no rule: decide per job" (in `language`). The row stays, and a later job like it opens a new question. This is the only write before the user answers.

## 2. The report

No question left open → no push; the report is the header (`# Questions this week · 0`), the closed ones' line when §1 closed any, and the Log.

Otherwise fetch **Search rules** and **Proposal guide** (a recommendation names the item it would refine) and read the cards of the questions you will show: `jobs_all`, newest `Found` first, until each shown question's newest jobs (up to three) are found, or `Found` reaches the oldest shown question's `First seen`. What the user did with those jobs — applied, skipped and why, left New — is the best evidence of the rule they already follow.

The report's goal: the user decides the questions that matter in a minute, by number, without opening Notion. What it must hold, in `language`:

- **The header**: `# Questions this week · N`, N the questions still open.
- **The few that matter, first** — five at most, ordered by `Seen`, the highest first, and among equal counts the newest `First seen` first: a case that keeps coming back costs the user most. Each one numbered, written for the user: what they decide, in plain words, about the job that raised it (its title and short id, and how many jobs like it came up). A row written like a rules page is said plainly here; its text in Notion stays.
- **A recommendation for each, always** — one answer the user can accept with "as recommended": drawn from what the user did with those jobs ("you skipped both, as not your field → reject on sight"), or, when the jobs show no decision yet, from the rules, saying that the jobs give nothing to go on. It names in plain words the rules item or guide section it would change.
- **The rest counted, not listed**: how many more are open, with the link to them in Notion (`questions_open`).
- **The closed ones** (§1), when there are any: one line — how many, and that each is now "decide per job".
- **Rules or guide items that contradict or duplicate each other**, when you saw any: one line.
- **How to answer**: by number, in a few words ("1 yes, 2 no, 3 as recommended"); a question left unanswered stays open.
- **The Log**, last:

```
## Log
- Questions: <N> open[, <k> closed as stale]
- Problems: <one line per problem: where, what failed, what is left undone>
```

`Questions` is always there; `Problems` only when a call failed or was blocked (SKILL.md → *Automatic mode*). No description of your work outside the Log.

**Push line**, in `language`, plain text: `Upwork: <N> open questions for the weekly review`. Last steps: with questions open, load `PushNotification` and push the line; then the final reply — the report alone, its first characters `# Questions`. None → no push, the report all the same.

## 3. After the user answers

For each question the user decided:

1. Write the rule and close the question as SKILL.md → *Questions and quirks* says (a confirmed rule). "As recommended" means your recommendation; keep the pages' language.
2. "Decide per job", "no rule" or the like → `Status` Resolved, `Decision` "no rule: decide per job", nothing written to the rules.

A question the user did not answer stays Open; one of the rest that the user asks about is shown the same way, then decided. Stale or duplicate rules items are edited only when the user says so.

End with one short message: what was written and where.

Always off limits in this mode: writing anything to Upwork; touching `PROCESSED_UNTIL`; changing rows in Jobs or Runs.
