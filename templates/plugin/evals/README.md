# Evals

`claude plugin eval` suite for the `my-plugin` plugin: trigger cases, and a case for each behaviour decided *checked* in `docs/skill-design.md` → *Decisions* (`docs/skill-development.md` §7.2). Every outside service a behaviour case touches is replaced by a mock server, so nothing touches a real account.

Run from `my-plugin/`. Trigger cases:

```
claude plugin eval . --model sonnet --ablation none --trust-plugin -j 3 --no-publish --tag trigger
```

Full suite:

```
claude plugin eval . --model sonnet --judge-model sonnet --runs 1 --ablation none --trust-plugin -j 2 --no-publish
```

- `--model`: the model that does this work in use, for every case, trigger cases included. `--judge-model sonnet`: the default Haiku judge is too noisy on these rubrics.
- One case: `--case <name>`. <How long a full run takes and roughly what it costs.>

What is checked:

- `trigger-named` — <a request the skill is for, naming the product or tool>: the skill loads.
- `trigger-unnamed` — <a request the skill is for, without the name>: the skill loads.
- `unrelated` — a question that has nothing to do with the skill: the skill does not load.
- **Guards on every behaviour case** — <what no case may ever do>.

The trigger cases are never deleted: a skill that stops loading fails silently in use. Their graders, `skill-loaded` and `skill-not-loaded`, check only the Skill tool call; a run that ends on the turn limit, right after the load, is expected.

Layout:

```
evals/
├── <case>/prompt.md       what the user says; frontmatter: turns, allowed tools, runs, tags
├── <case>/graders/*.md    checks
└── <case>/mocks/…         case-specific fakes
```

## Reading failures

`docs/skill-development.md` §7. Known unstable cases: none yet.
