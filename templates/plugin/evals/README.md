# Evals

`claude plugin eval` suite for the `my-plugin` plugin, with every outside service replaced by a mock server, so nothing touches a real account.

Run from `my-plugin/`:

```
claude plugin eval . --model sonnet --judge-model sonnet --runs 1 --ablation none --trust-plugin -j 2 --no-publish
```

- `--model`: the model that does this work in use. `--judge-model sonnet`: the default Haiku judge is too noisy on these rubrics.
- One case: `--case <name>`. <How long a full run takes and roughly what it costs.>

What is checked:

- **Guards on every case** — <what no case may ever do>.
- `unrelated` — a question that has nothing to do with the skill must not load it or touch any service.

Layout:

```
evals/
├── <case>/prompt.md       what the user says; frontmatter: turns, allowed tools, runs, tags
├── <case>/graders/*.md    checks
└── <case>/mocks/…         case-specific fakes
```

## Reading failures

`docs/skill-development.md` §7. Known unstable cases: none yet.
