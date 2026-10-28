# Evals

`claude plugin eval` suite for the `my-plugin` plugin. Which cases it has follows `docs/skill-development.md` §7.2: trigger cases always, behaviour cases only where that section's criteria call for them (`docs/skill-design.md` records the decision either way). Every outside service a behaviour case touches is replaced by a mock server, so nothing touches a real account. Delete what this plugin does not use.

Trigger cases only, run from `my-plugin/`:

```
claude plugin eval . --model haiku --runs 3 --ablation none --trust-plugin -j 3 --no-publish --tag trigger
```

Behaviour cases:

```
claude plugin eval . --model sonnet --judge-model sonnet --runs 1 --ablation none --trust-plugin -j 2 --no-publish
```

- `--model`: for trigger cases a cheap model, since they only check the load; for behaviour cases the model that does this work in use. `--judge-model sonnet`: the default Haiku judge is too noisy on these rubrics.
- One case: `--case <name>`. <How long a full run takes and roughly what it costs.>

What is checked:

- `trigger` — <a request the skill is for, without its name>: the skill loads.
- `unrelated` — a question that has nothing to do with the skill: the skill does not load.
- **Guards on every behaviour case** — <what no case may ever do>.

Trigger cases have one grader, `skill-loaded`, a `tool_used` check on the Skill tool; `max_turns: 2` ends the run right after the load.

Layout:

```
evals/
├── <case>/prompt.md       what the user says; frontmatter: turns, allowed tools, runs, tags
├── <case>/graders/*.md    checks
└── <case>/mocks/…         case-specific fakes
```

## Reading failures

`docs/skill-development.md` §7. Known unstable cases: none yet.
