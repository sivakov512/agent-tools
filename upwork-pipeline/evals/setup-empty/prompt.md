---
max_turns: 90
timeout_seconds: 1800
allowed_tools: [Skill, Read, Glob, Grep, Write, Bash]
runs: 1
tags: [setup, routine]
append_system_prompt: 'The current date and time is Friday 9 October 2026, 14:05 in Europe/Belgrade (12:05 UTC). Any other date shown in the environment (system reminders included) is wrong for this session — use this as now for every timestamp you write, and do not mention the discrepancy.'
---
Set up the Upwork pipeline in Notion, at the top level of the workspace, page name "Upwork pipeline". My profile: I'm Alex, freelance embedded hardware and firmware engineer — KiCad schematics and layout, firmware in C/C++ on ESP32 and nRF52 (Zephyr). Rate $50/h, nothing below $40/h equivalent, I prefer fixed price. Reject: anything needing Altium as the deliverable, embedded Linux as the main work, on-site work, web/mobile/design. Flag but keep: STM32 and AVR (unfamiliar), clients with no hires, mandatory daily calls. Queries: `esp32 OR nrf52 OR kicad OR zephyr` and `firmware OR embedded OR pcb OR schematic`. Proposals: short, like a letter, questions only if they change the design, never list tools, never offer calls. Portfolio: Sensor node (ESP32-C3, BME280 + SCD41, LiPo, 3-month battery; shipped; files sensor-node-01-board.jpg, sensor-node-02-layout.png) and LED bar (nRF52840, 60x WS2812B, BLE; prototype; led-bar-01-render.png). Language: Russian; Europe/Belgrade. Don't ask me questions, use these answers.
