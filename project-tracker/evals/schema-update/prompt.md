---
max_turns: 160
timeout_seconds: 2400
allowed_tools: [Skill, Read, Glob, Grep]
runs: 1
tags: [setup, upgrade]
append_system_prompt: 'The current date is Friday, 9 October 2026. The date shown elsewhere in the environment is wrong for this session — use 2026-10-09 as today.'
---
How is the energy meter going?
