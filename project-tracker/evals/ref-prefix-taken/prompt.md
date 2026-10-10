---
max_turns: 160
timeout_seconds: 2400
allowed_tools: [Skill, Read, Glob, Grep]
runs: 1
tags: [setup, upgrade, ids]
append_system_prompt: 'The current date is Friday, 9 October 2026. Any other date in the environment, a "Today''s date" line included, is wrong for this session: today is 2026-10-09 — use it for every date you write and every "today" you count from.'
---
How's the energy meter coming along?
