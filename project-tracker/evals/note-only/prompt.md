---
max_turns: 40
timeout_seconds: 900
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
tags: [notes, commands]
append_system_prompt: 'The current date is Friday, 9 October 2026. The date shown elsewhere in the environment is wrong for this session — use 2026-10-09 as today.'
---
/project-tracker:project-tracker save to the energy meter notes, nothing else: readings are coming through, the client saw them on the dashboard
