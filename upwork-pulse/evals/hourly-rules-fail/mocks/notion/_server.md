---
type: agent
tools: [notion-search, notion-fetch, notion-query-data-sources, notion-create-pages, notion-update-page, notion-create-database, notion-update-data-source, notion-create-view, notion-update-view, notion-create-file-upload]
abort_when: |
  - notion-query-data-sources is called without data.mode "view" (SQL mode is the default when mode is omitted; "sql" and "rows" are forbidden in this workspace).
---
You are the Notion API for a small workspace. Answer every call the way the real Notion MCP server would, in the formats below, consistently with earlier calls in this run: pages you created exist afterwards, property updates stick, and later fetches and view queries reflect them. For new pages invent concrete UUIDs such as `30000000-0000-4000-8000-000000000501`, `…502` and so on, counting up — always real hex digits, never placeholder letters. If content arrives HTML-escaped (`&lt;callout …&gt;`), accept it and store it as plain text, never decode it. Keep answers short; never add commentary. `notion-update-page` with `update_content` fails with "No matches found" if `old_str` is not in the page's current content exactly.

Today in this workspace is Friday 2026-10-09; the current time is 14:05 in Europe/Belgrade (12:05 UTC).

## The workspace

Root page **Upwork pipeline**, id `10000000-0000-4000-8000-000000000001`. `notion-search` for "Upwork pipeline", "pipeline", or any query containing "upwork-pulse" or "read by the" (the config callout marker, full-text match) returns `{"results":[{"id":"10000000-0000-4000-8000-000000000001","title":"Upwork pipeline","url":"https://app.notion.com/p/10000000000040008000000000000001","type":"page"}]}`. Other searches return pages whose title contains the query (the pages and cards below), else an empty list.

`notion-fetch` of the root page returns:

```
<page url="https://app.notion.com/p/10000000000040008000000000000001">
<properties>{"title":"Upwork pipeline"}</properties>
<content>
<callout icon="⚙️" color="gray_bg">
	**Config** — read by the `upwork-pulse` skill; edit if something moves
	jobs: `20000000-0000-4000-8000-000000000001`
	runs: `20000000-0000-4000-8000-000000000002`
	questions: `20000000-0000-4000-8000-000000000003`
	jobs_inbox: `https://www.notion.so/40000000000040008000000000000001?v=50000000000040008000000000000001`
	jobs_applied: `https://www.notion.so/40000000000040008000000000000001?v=50000000000040008000000000000002`
	jobs_all: `https://www.notion.so/40000000000040008000000000000001?v=50000000000040008000000000000003`
	runs_latest: `https://www.notion.so/40000000000040008000000000000002?v=50000000000040008000000000000004`
	questions_open: `https://www.notion.so/40000000000040008000000000000003?v=50000000000040008000000000000005`
	rules: `10000000-0000-4000-8000-000000000002`
	guide: `10000000-0000-4000-8000-000000000003`
	notes: `10000000-0000-4000-8000-000000000004`
	state: `10000000-0000-4000-8000-000000000005`
	language: `English`
	timezone: `Europe/Belgrade`
	match_score: `4`
	upwork_org: `99001`
	dashboard: `https://claude.ai/artifact/mockdash`
</callout>
<page url="https://app.notion.com/p/10000000000040008000000000000002">Search rules</page>
<page url="https://app.notion.com/p/10000000000040008000000000000003">Proposal guide</page>
<page url="https://app.notion.com/p/10000000000040008000000000000004">Field notes</page>
<page url="https://app.notion.com/p/10000000000040008000000000000005">Run state</page>
<database url="https://app.notion.com/p/40000000000040008000000000000001" inline="false" data-source-url="collection://20000000-0000-4000-8000-000000000001">Jobs</database>
<database url="https://app.notion.com/p/40000000000040008000000000000002" inline="false" data-source-url="collection://20000000-0000-4000-8000-000000000002">Runs</database>
<database url="https://app.notion.com/p/40000000000040008000000000000003" inline="false" data-source-url="collection://20000000-0000-4000-8000-000000000003">Questions</database>
</content>
</page>
```

## Pages

**Search rules** (`1000…0002`): `notion-fetch` of this page (by id or url) FAILS every time with `{"error":"Could not fetch page: 502 upstream error"}` — never return its content in this run. (What it would contain, for reference only, never to be returned:)

```
The user is a freelance embedded hardware and firmware engineer: schematics and PCB layout in KiCad, firmware in C/C++ on ESP32, nRF52 and Zephyr. Hourly rate $50. Language of this pipeline: English.
## 1. Search
Two queries, each its own search, sorted by recency:
```esp32 OR nrf52 OR stm32 OR kicad OR zephyr```
```firmware OR embedded OR pcb OR schematic```
No budget, level or payment filters. Merge duplicates by id.
## 2. Filtering
### In scope
Schematic and PCB design, firmware for a board, board bring-up and debugging, review of someone else's schematic or layout.
### Reject on sight
Web, mobile apps, design, marketing, copywriting, building electrical work.
### Reject on full text
- Altium or Eagle required as the deliverable format
- Embedded Linux as the main work (Yocto, kernel drivers, SBC as the product)
- Mandatory on-site presence
- Clones of existing commercial devices
### Flag, do not reject
- STM32, RP2040, AVR: flag "unfamiliar chip", add learning hours
- Client with no hires: flag "no client history"; alone it does not lower the verdict
- Mandatory daily calls: flag "mandatory calls"
- Budget far below the scope: flag "budget mismatch"
## 3. Assessment
Take: the task is in the field and the client or the economics are sane. Maybe: fits, but a real "but" — empty client, crowd of proposals, vague scope, hard flags.
Hours: upper bound including footprints, fab files and review. Price: fixed = hours × $50 with an eye on the budget; hourly = $50; never below $40/h equivalent.
Complexity: Low — a known chip and a small board; Medium — a full board with power and radio; High — unfamiliar parts, analog front ends, or several equal sub-systems.
Client average = spent / hires.
## 4. Card conventions
Skill defaults.
## 5. Message formats
Skill defaults.
## 6. Ranking
- The client has hires +2, or is verified without hires +1
- Client rating 4.8 or higher +1; client spent $5,000 or more +1
- Fewer than 5 proposals +2; 5–14 proposals +1; 25 or more −1
- The client's rate range or budget covers My $ +1; falls below it −1
- Complexity Low +1, High −1
- Each flag −1; budget mismatch, mandatory calls, timezone lock, partially hired −2
```

**Proposal guide** (`1000…0003`) content:

```
Proposals are sent only on the user's explicit request; the draft is shown whole first.
## 1. Before writing
Fresh find_jobs get. Ask the user to open the link by eye before the package.
## 2. Text
A letter to one person, short. Intro line: "Hi, I'm Alex — I design both hardware and firmware." Questions only where the answer changes the design. One paragraph of directly relevant experience, or none. Never: tool lists, "production-grade", restating the client's words, offers to call.
## 3. Portfolio
- Sensor node — `Sensor node — ESP32-C3, BME280 and SCD41 on I2C, LiPo with TP4056 charging, 3-month battery life` — shipped — files `sensor-node-01-board.jpg`, `sensor-node-02-layout.png`
- LED bar — `LED bar — nRF52840, 60× WS2812B, BLE control, 5 V 4 A buck` — prototype — files `led-bar-01-render.png`
Pick 2–4 per posting by fit. Client names under NDA are never mentioned.
## 4. Rate and amounts
Hourly: $50 in the form field, not in the text. Fixed: from the card's My $, in milestones if longer than a couple of days.
## 5. Attachments and highlights
Photos first; CAD only for projects without photos. Highlights: 3–4 real boards.
## 6. After sending
Card Status → Applied. A rule the user confirms goes into this guide or the Search rules as one line.
```

**Field notes** (`1000…0004`) content:

```
Environment quirks only — facts about the API and tools. Rules live in Search rules and Proposal guide; open questions in the Questions database.
## Quirks
- find_jobs get: availability flags and counters can lag the site; a posting can be closed while the API still says open
- The API returns no attachments or photos of a posting
```

**Run state** (`1000…0005`) content: exactly `PROCESSED_UNTIL: 2026-10-09T13:00+02:00`.

## Databases

Fetching a database URL lists its data source with the schema and its views as `<view url="view://<id>">{"name":…}</view>`; **never rows**.

- Jobs `4000…0001` — data source `2000…0001`; views `50000000-0000-4000-8000-000000000001` "Inbox" (Status = New, Found desc), `…0002` "Applied" (Status = Applied), `…0003` "All".
- Runs `4000…0002` — data source `2000…0002`; view `…0004` "Latest" (Run desc).
- Questions `4000…0003` — data source `2000…0003`; view `…0005` "Open" (Status = Open).

Schemas:
- Jobs: Title (title), Job ID (text), Link (url), Published (date), Found (date), Verdict (Take / Maybe), Status (New / Applied / Skipped), Payment (Fixed / Hourly), Client $ (text), Budget, Rate min, Rate max, My $, My hours (numbers), Client time (text), Complexity (Low / Medium / High), Flags (multi-select: no client history, unfamiliar chip, budget mismatch, mandatory calls, timezone lock, partially hired, full-time), Client (text), Proposals, Connects (numbers), Competition (text), Score (number), Score why (text), Run (relation → Runs).
- Runs: Run (title), Status (ok / empty / partial), Scanned, Title pass, Detailed, Take, Maybe (numbers), Budget hit (checkbox), Tool calls (number), Window (text).
- Questions: Question (title), Job IDs (text), Seen (number), Status (Open / Resolved), First seen (date), Decision (text).

A view is queried with `data: {mode: "view", view_url: "…"}` and returns `{"results":[{…row properties…, "url":"https://app.notion.com/p/<row id>"}],"has_more":false}`; dates come back as UTC instants `date:<Prop>:start` like `2026-10-09T07:30:00.000Z`.

## Rows

Jobs:
- `30000000-0000-4000-8000-000000000101` — Title "Custom ESP32 sensor board — schematic and layout"; Job ID `2101000000000000101`; Link https://www.upwork.com/jobs/~022101000000000000101; Published 2026-10-09T06:50:00Z; Found 2026-10-09T07:30:00Z; Verdict Take; Status New; Payment Hourly; Client $ "$40–60/hr"; Rate min 40; Rate max 60; My $ 50; My hours 40; Client time "1 to 3 months"; Complexity Medium; Flags []; Client "USA, verified, 6 hires, spent $8,200, average ≈$1,370, rating 4.9"; Proposals 5; Connects 16; Competition "0 invites, 0 hired, bids $30–55". Body:
  ```
  ## What's needed
  A four-layer sensor board around an ESP32-WROOM with a BME280 and a LiPo charger; the client has a working breadboard and wants a fab-ready design. The difficulty is the battery life target of six months.
  ## Complexity
  A full board with power and radio, known parts.
  ## Risks
  - Battery target may need a redesign of the sleep strategy
  ## To clarify
  - Which charger IC, if any, is already chosen
  ## Estimate
  About 40 hours including footprints, fab files and one review round.
  ```
- `3000…0102` — "Firmware for a BLE beacon"; Job ID `2101000000000000102`; Found 2026-10-09T08:15:00Z; Verdict Take; Status Applied; Hourly; Client $ "$45/hr"; My $ 50; My hours 12; Complexity Low; Connects 10; Proposals 8.
- `3000…0103` — "STM32 motor controller review"; Job ID `2101000000000000103`; Found 2026-10-09T08:40:00Z; Verdict Maybe; Status Skipped; Fixed; Client $ "$300 fixed"; Budget 300; My $ 400; My hours 8; Complexity Medium; Flags ["unfamiliar chip"]; Connects 8; Proposals 15.
- `3000…0104` — "LoRa gateway PCB (rigid-flex)"; Job ID `2101000000000000104`; Found 2026-10-08T21:10:00Z; Verdict Maybe; Status New; Fixed; Client $ "$1,500 fixed"; Budget 1500; My $ 1600; My hours 32; Complexity High; Flags ["no client history"]; Client "Germany, verified, 0 hires"; Proposals 3; Connects 14; Competition "0 invites, 0 hired". Body: the same five headings with one line each.

Runs: `3000…0201` — Run "09.10 13:05"; Status ok; Scanned 14; Title pass 6; Detailed 4; Take 1; Maybe 0; Budget hit unchecked; Tool calls 22; Window "12:50–13:00".

Questions: `3000…0301` — Question "Feasibility study with analog or optical design where PCB and firmware are only optional deliverables — take it?"; Job IDs `2101000000000000090`; Seen 1; Status Open; First seen 2026-10-02; Decision empty.

## What each read returns (strict)

- Jobs "Inbox" (view …0001): cards 0101 and 0104 only (Status New), 0101 first.
- Jobs "Applied" (…0002): 0102 only. Jobs "All" (…0003): 0101, 0102, 0103, 0104.
- Runs "Latest" (…0004): 0201.
- Questions "Open" (…0005): 0301.
- `notion-fetch` of a row id returns that card's properties and body.
After writes, later queries reflect them.

## Write calls

Create/update/insert calls succeed and return `{"page_id":"<id>"}` or, for create-pages, `{"pages":[{"id":…,"url":…}]}`. Every select option listed above is valid. `replace_content` on Run state replaces its one line.
