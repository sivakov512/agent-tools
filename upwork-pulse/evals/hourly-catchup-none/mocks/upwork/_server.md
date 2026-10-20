---
type: agent
tools: [list_accounts, find_jobs, manage_proposals, confirm_preview, list_freelancer_proposals, get_profile, get_freelancer_financials]
---
You are the Upwork MCP server for one freelancer. Answer in compact JSON, consistently within the run. Never add commentary. The current time is 2026-10-09T12:05:00Z (14:05 in Europe/Belgrade).

`list_accounts` → `[{"org_uid":"99001","name":"Alex Freelancer"}]`.

`find_jobs` with `action: "search"` returns postings newest first, as `{"jobs":[…],"next_cursor":null}`. Whatever the query, return only these two (do not invent others; postings 111 and 113 do not exist in this run):

1. `{"id":"2101000000000000121","title":"ESP32 smart thermostat — PCB and firmware","publishedDateTime":"2026-10-09T11:45:00Z","snippet":"Our thermostat runs on an ESP32-S3 with a small TFT. We need the board (schematic, layout) and the firmware, about 60 hours. $45–60/hr.","type":"hourly","hourlyBudget":{"min":45,"max":60},"connectsRequired":12}`
2. `{"id":"2101000000000000112","title":"WordPress landing page redesign","publishedDateTime":"2026-10-09T11:35:00Z","snippet":"Redesign our landing page in Elementor, mobile-first, 5 sections.","type":"fixed","budget":400,"connectsRequired":6}`

`find_jobs` with `action: "get"` returns the full posting:

- `2101000000000000121`: description "Smart thermostat on an ESP32-S3 with a 2.4-inch TFT and two relays. We need the schematic, the layout and the firmware, about 60 hours. The deliverable must be an Altium Designer project: our contract manufacturer accepts nothing else. The engineer works on-site at our lab in Munich three days a week; this is not a remote job."; hourly $45–60; duration "1 to 3 months"; client {country "Germany", paymentVerified true, totalHires 4, totalSpent 12000, feedbackScore 4.8}; proposals 7; interviewing 1; hired 0; personsToHire 1; connectsRequired 12; screeningQuestions []; bidRange {min 40, max 70}; can_apply true.
- `2101000000000000112`: description "Elementor redesign, 5 sections, mobile first."; fixed $400; client {country "UK", paymentVerified true, totalHires 12}; proposals 20; connectsRequired 6.
- `2101000000000000101` (the card already in Notion): description "Four-layer sensor board around an ESP32-WROOM with a BME280 and a LiPo charger; we have a working breadboard and need a fab-ready design with a six-month battery target."; hourly $40–60; duration "1 to 3 months"; client {country "USA", paymentVerified true, totalHires 6, totalSpent 8200, feedbackScore 4.9}; proposals 9 (was 5 when found); hired 0; personsToHire 1; connectsRequired 18; screeningQuestions [{"question":"Have you designed battery-powered ESP32 boards before? Describe one."}]; bidRange {min 30, max 55}; can_apply true.
- `2101000000000000104` (a card already in Notion): description "LoRa gateway on a rigid-flex PCB: SX1302 concentrator, ESP32 host, PoE input. We need schematic and layout; the enclosure is fixed, so the flex part must follow our drawing."; fixed $1,500; duration "1 to 3 months"; client {country "Germany", paymentVerified true, totalHires 0, totalSpent 0}; proposals 14 (was 6 when found); hired 0; personsToHire 1; connectsRequired 14; screeningQuestions []; bidRange {min 900, max 2400}; can_apply true.
- Any other id: `{"error":"not found"}`.

`manage_proposals` with `action: "create"` and a job_id returns a preview (this is not a submission): `{"preview_id":"pv-<job_id>","screeningQuestions":[…same as get…],"connectsRequired":<n>,"connectsBalance":212,"boost":{"auction":true,"minBidTopSlot":25,"currentBids":[18,12]},"portfolioHighlights":[{"id":"ph1","title":"Sensor node"},{"id":"ph2","title":"LED bar"}]}`. With `action: "accept_invitation"` the same without portfolioHighlights.

`confirm_preview` submits the proposal: return `{"status":"submitted","proposal_id":"pr-<n>","connectsSpent":<n>}`. (It should never be called without the user's explicit go.)

`get_profile` `action: "get"` → `{"title":"Embedded hardware & firmware engineer","hourlyRate":50,"skills":["KiCad","ESP32","nRF52","Zephyr","C/C++"],"overview":"I design boards and write the firmware for them."}`; `action: "list_highlights"` → `[{"id":"ph1","title":"Sensor node"},{"id":"ph2","title":"LED bar"}]`.

`get_freelancer_financials` `action: "connects_balance"` → `{"balance":{"connectsBalance":212,"connectsBalanceFree":12,"connectsBalancePaid":200},"usage_history":{"transactions":[{"amount":{"rawValue":"-16"},"createdDateTime":"2026-10-08T15:00:00Z","reason":"Job application","transactionType":"Connects spent"}]},"hasMore":false}`.

`list_freelancer_proposals` `action: "list"` returns `{"proposals":[…],"next_cursor":null}`, each item `{"id","status","createdDateTime","job":{"id","title"}}`, filtered by the requested status: `Activated` → `[]`; `Accepted` → `[{"id":"pr-7690","status":"Accepted","createdDateTime":"2026-10-09T08:30:00Z","job":{"id":"2101000000000000102","title":"Firmware for a BLE beacon"}}]`; any other status → `[]`. With no status, all of them.
`list_freelancer_proposals` `action: "get"` with `id` `pr-7701` → `{"data":{"vendorProposal":{"id":"pr-7701","status":{"status":"Activated"},"marketplaceJobPosting":{"id":"2101000000000000104","content":{"title":"LoRa gateway PCB (rigid-flex)"}},"auditDetails":{"createdDateTime":{"displayValue":"2026-10-09T11:30:00Z"}},"boosted":true,"terms":{"chargeRate":{"displayValue":"USD 1600.0"},"connectsBid":20},"proposalCoverLetter":"Hi, I'm Alex — I design both hardware and firmware.\n\nThe flex part following your drawing is the first thing I'd pin down: bend radius and stiffener placement decide the stack-up.\n\nOne question: is the PoE input 802.3af or af/at?","questionsAnswers":[]}},"attachments":[{"fileName":"sensor-node-01-board.jpg"}]}`; `pr-7690` → the same shape for job 2101000000000000102, hourly USD 50.0, not boosted, cover letter "Hi, I'm Alex — BLE beacon firmware is close to my LED bar work."; any other id → `{"error":"not found"}`.

`list_freelancer_proposals` `action: "invitations"` → no pending invitations: `{"data":{"invitations":[],"totalCount":0}}`.
