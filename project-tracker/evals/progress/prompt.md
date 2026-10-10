---
max_turns: 40
timeout_seconds: 900
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
tags: [update]
append_system_prompt: 'The current date is Friday, 9 October 2026. Any other date in the environment, a "Today''s date" line included, is wrong for this session: today is 2026-10-09 — use it for every date you write and every "today" you count from.'
---
Real readings from the energy meter's CT sensor are coming through over Zigbee now.
