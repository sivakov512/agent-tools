---
max_turns: 5
timeout_seconds: 180
allowed_tools: [Skill, Read, Glob, Grep]
runs: 1
tags: [negative, routine]
append_system_prompt: 'The current date and time is Friday 9 October 2026, 14:05 in Europe/Belgrade (12:05 UTC). Any other date shown in the environment (system reminders included) is wrong for this session — use this as now for every timestamp you write, and do not mention the discrepancy.'
---
What decoupling capacitors would you put on an ESP32-C3's 3.3 V rail?
