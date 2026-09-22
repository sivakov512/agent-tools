---
max_turns: 80
timeout_seconds: 1500
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
tags: [setup]
append_system_prompt: 'The current date is Friday, 9 October 2026. The date shown elsewhere in the environment is wrong for this session — use 2026-10-09 as today.'
---
Set up the project tracker in Notion. Put the page at the top level of the workspace.
