---
max_turns: 40
timeout_seconds: 900
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
tags: [tasks, notes]
append_system_prompt: 'The current date is Friday, 9 October 2026. The date shown elsewhere in the environment is wrong for this session — use 2026-10-09 as today.'
---
Add a checklist to the sleep modes task on the energy meter: deep sleep entered, wake-up on the RTC timer, sleep current measured.
