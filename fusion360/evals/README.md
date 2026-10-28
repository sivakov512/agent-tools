# Evals

`claude plugin eval` suite for the `fusion360` plugin: trigger cases only. No behaviour of the skill is decided *checked* in `docs/skill-design.md` → *Decisions* (`docs/skill-development.md` §7.2), so there are no behaviour cases and no mock Fusion.

Run from `fusion360/`:

```
claude plugin eval . --model opus --ablation none --trust-plugin -j 4 --no-publish --tag trigger
```

- `--model opus`: modelling in Fusion runs in the user's own coding sessions, which run Opus.
- 4 cases × 3 runs, about 45 seconds at `-j 4` and about $0.70 of API usage, measured on Opus in October 2026.
- One case: `--case <name>`.

What is checked:

- `trigger-named` — "In Fusion, model a simple bracket with two mounting holes": the skill loads.
- `trigger-unnamed` — "Make the walls of this part 0.5 mm thicker and keep the lid fit as it is", without the word Fusion: the skill loads.
- `unrelated` — a question about a shell script: the skill does not load.
- `other-cad-tool` — the same kind of modelling request in OpenSCAD, a close call: the skill does not load.

The trigger cases are never deleted: a skill that stops loading fails silently in use. Their graders, `skill-loaded` and `skill-not-loaded`, check only the Skill tool call; a run that ends on the turn limit, right after the load, is expected.

Layout:

```
evals/
├── <case>/prompt.md       what the user says; frontmatter: turns, allowed tools, runs, tags
└── <case>/graders/*.md    checks
```

## Reading failures

`docs/skill-development.md` §7. Known unstable cases: none yet.
