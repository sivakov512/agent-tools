---
max_turns: 40
timeout_seconds: 900
allowed_tools: [Skill, Read, Glob, Grep]
runs: 1
tags: [chat]
append_system_prompt: 'The current date is Friday, 9 October 2026. The date shown elsewhere in the environment is wrong for this session — use 2026-10-09 as today. This is a Cowork session. Attribution for git commits you create: end commit messages with "Claude-Session: https://claude.ai/code/session_01EvalTaskChat".'
---
Task: Sleep modes and sampling with the processor asleep — Energy meter (Project Tracker, https://app.notion.com/p/30000000000040008000000000000103). Load it.
