---
max_turns: 40
timeout_seconds: 900
allowed_tools: [Skill, Read, Glob, Grep]
runs: 1
tags: [chat]
append_system_prompt: 'The current date is Friday, 9 October 2026. Any other date in the environment, a "Today''s date" line included, is wrong for this session: today is 2026-10-09 — use it for every date you write and every "today" you count from. This is a local Claude Code session in the Claude desktop app; its working directory is /Users/dana/Development/energy-meter/.claude/worktrees/sleepy-fox-1a2b3c.'
---
Task: Sleep modes and sampling with the processor asleep TK-3 — Energy meter (Project Tracker, https://app.notion.com/p/30000000000040008000000000000103). Code session, repository https://git.example.com/hw/energy-meter. Chat title: "Task: Sleep modes and sampling with the processor asleep TK-3 — Energy meter". Load it with the project-tracker skill.
