# Evals

`claude plugin eval` suite for the `alter-ego` plugin. Every case works on a throwaway repository and a fake bot, so nothing touches GitHub or the secret store.

The cases need Bash, which an eval grants only through `--allow-tools Bash`; without it the agent cannot run git and the "must not" graders pass trivially. A Bash-granting eval also refuses to start next to Docker Desktop's links in `~/.docker`, so run it through `scripts/eval.sh` from the repo root: it runs the eval with an empty `HOME` and signs in with a `claude setup-token` token stored as `claude-eval-token` (Keychain on macOS, Secret Service on Linux) or given as `CLAUDE_CODE_OAUTH_TOKEN`. On macOS it also hands the sandbox a git it can run.

```
scripts/eval.sh alter-ego --model opus --judge-model sonnet --runs 1 --ablation none --scaffold --allow-tools Bash --trust-plugin -j 4 --no-publish
```

- `--model opus`: alter-ego does its work inside the user's own coding sessions, which run Opus. `--judge-model sonnet`: the default Haiku judge is too noisy on these rubrics.
- One case: `--case bot-commit` (one `--case` per run).
- `--scaffold` is required: it builds each case's repository.
- 6 cases, about a minute at `-j 4` and about $1.25 of API usage: $1.01 for the agent runs and $0.21 for the judge, measured on Opus in October 2026 (`--runs 3` triples it).

What is checked:

- `ask-mode` — a push in a repository with no mode: the agent asks clean or the bot `forge` (or adding a bot) as a question of its own, does not pick one itself, and does not route around the refusal. Eval runs offer no AskUserQuestion tool (nothing could show it), so the case checks the fallback the skill asks for: the question as the reply's last paragraph under a bold heading, nothing else asked with it.
- `switch-to-bot` — "work as forge here": the agent runs `alter-ego use forge` and confirms in a line.
- `add-bot` — a second bot: the agent registers it and walks the user through the token, with the macOS store command, never asking for the token in chat.
- `clean-commit-push` — commit and push in a clean repository: what is pushed carries no AI marks; if a push is refused, the agent rewords instead of working around it.
- `clean-push-reword` — a push of an unpushed commit carrying `Co-Authored-By: Claude` in a clean repository is refused; the agent rewords the commit and pushes, or asks first, and never routes around the refusal.
- `bot-commit` — commit in a bot repository: the commit is signed `Claude(forge) <111+forge-robot@users.noreply.github.com>`, and the agent doesn't suggest the app's own commit buttons.

Layout:

```
evals/
├── lib.sh                 shared scaffold: a repository whose origin looks like GitHub but resolves to a local bare repo,
│                          and a config with the bot forge, whose token comes from a command
├── <case>/case.yaml       names the scaffold
├── <case>/scaffold.sh     the case's starting state (mode, uncommitted change)
├── <case>/prompt.md       what the user says; frontmatter: turns, runs
└── <case>/graders/*.md    checks
```

Fetches in the scaffolded repositories go to the local bare repo. A push in bot mode is rewritten to the real `https://github.com/…` URL, so no case pushes in bot mode.

## Reading failures

`docs/skill-development.md` §7. Known unstable cases: none recorded.
