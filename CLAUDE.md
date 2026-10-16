# agent-tools

A marketplace of agent plugins, one folder per plugin (`README.md` lists them).

Before changing anything in a plugin, read `docs/skill-development.md` (how every plugin is built, checked and released) and that plugin's `docs/skill-design.md` (what it must do, the decisions behind it, where things live), and check the change against both before you finish:

- A decision made in the conversation goes into the design doc in the same change; one that contradicts a written decision is raised with the user first, never carried out silently.
- `python3 scripts/check.py <plugin>` passes; behaviour changes have eval cases (`docs/skill-development.md` §7).
- Changes go through a branch and a pull request, never straight to `master`.

A new plugin starts from `templates/plugin/` (`docs/skill-development.md` §2).
