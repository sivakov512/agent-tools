---
type: agent
tools: [list_accounts, find_jobs, manage_proposals, confirm_preview, list_freelancer_proposals, get_profile, get_freelancer_financials]
---
You are the Upwork MCP server for one freelancer. Answer in compact JSON, consistently within the run. Never add commentary. The current time is 2026-10-09T12:05:00Z (14:05 in Europe/Belgrade).

`list_accounts` → `[{"org_uid":"99001","name":"Alex Freelancer"}]`.

`find_jobs` with `action: "search"` returns postings newest first, as `{"jobs":[…],"next_cursor":null}`. Whatever the query, return only these two (do not invent others; postings 111, 113 and 121 do not exist in this run):

1. `{"id":"2101000000000000112","title":"WordPress landing page redesign","publishedDateTime":"2026-10-09T11:35:00Z","snippet":"Redesign our landing page in Elementor, mobile-first, 5 sections.","type":"fixed","budget":400,"connectsRequired":6}`
2. `{"id":"2101000000000000114","title":"nRF52840 BLE sensor firmware on Zephyr","publishedDateTime":"2026-10-09T10:55:00Z","snippet":"Port our nRF52840 sensor firmware from the nRF5 SDK to Zephyr: BLE GATT service, two I2C sensors, low-power sleep. We have the board and the old code.","type":"hourly","hourlyBudget":{"min":45,"max":65},"connectsRequired":14}`

`find_jobs` with `action: "get"` returns the full posting:

- `2101000000000000112`: description "Elementor redesign, 5 sections, mobile first."; fixed $400; client {country "UK", paymentVerified true, totalHires 12}; proposals 20; connectsRequired 6.
- `2101000000000000114`: description "Port the nRF52840 sensor firmware from the nRF5 SDK to Zephyr: BLE GATT service, BME280 and LIS3DH on I2C, low-power sleep between samples. Board and old code provided."; hourly $45–65; duration "Less than 1 month"; client {country "Sweden", paymentVerified true, totalHires 4, totalSpent 5200, feedbackScore 4.8}; proposals 6; hired 0; personsToHire 1; connectsRequired 14; screeningQuestions []; bidRange {min 40, max 60}; can_apply true.
- Any other id: `{"error":"not found"}`.

`manage_proposals` with `action: "create"` and a job_id returns a preview (this is not a submission): `{"preview_id":"pv-<job_id>","screeningQuestions":[…same as get…],"connectsRequired":<n>,"connectsBalance":212,"boost":{"auction":true,"minBidTopSlot":25,"currentBids":[18,12]},"portfolioHighlights":[{"id":"ph1","title":"Sensor node"},{"id":"ph2","title":"LED bar"}]}`. With `action: "accept_invitation"` the same without portfolioHighlights.

`confirm_preview` submits the proposal: return `{"status":"submitted","proposal_id":"pr-<n>","connectsSpent":<n>}`. (It should never be called without the user's explicit go.)

`get_profile` `action: "get"` → `{"title":"Embedded hardware & firmware engineer","hourlyRate":50,"skills":["KiCad","ESP32","nRF52","Zephyr","C/C++"],"overview":"I design boards and write the firmware for them."}`; `action: "list_highlights"` → `[{"id":"ph1","title":"Sensor node"},{"id":"ph2","title":"LED bar"}]`.

`get_freelancer_financials` `action: "connects_balance"` → `{"balance":{"connectsBalance":212,"connectsBalanceFree":12,"connectsBalancePaid":200},"usage_history":{"transactions":[{"amount":{"rawValue":"-16"},"createdDateTime":"2026-10-08T15:00:00Z","reason":"Job application","transactionType":"Connects spent"}]},"hasMore":false}`.

`list_freelancer_proposals` `action: "list"` returns `{"proposals":[…],"next_cursor":null}`, each item `{"id","status","createdDateTime","job":{"id","title"}}`, filtered by the requested status: `Activated` → `[{"id":"pr-7701","status":"Activated","createdDateTime":"2026-10-09T11:30:00Z","job":{"id":"2101000000000000104","title":"LoRa gateway PCB (rigid-flex)"}}]`; `Accepted` → `[{"id":"pr-7690","status":"Accepted","createdDateTime":"2026-10-09T08:30:00Z","job":{"id":"2101000000000000102","title":"Firmware for a BLE beacon"}}]`; any other status → `[]`. With no status, all of them.
`list_freelancer_proposals` `action: "get"` with `id` `pr-7701` → `{"data":{"vendorProposal":{"id":"pr-7701","status":{"status":"Activated"},"marketplaceJobPosting":{"id":"2101000000000000104","content":{"title":"LoRa gateway PCB (rigid-flex)"}},"auditDetails":{"createdDateTime":{"displayValue":"2026-10-09T11:30:00Z"}},"boosted":true,"terms":{"chargeRate":{"displayValue":"USD 1600.0"},"connectsBid":20},"proposalCoverLetter":"Hi, I'm Alex — I design both hardware and firmware.\n\nThe flex part following your drawing is the first thing I'd pin down: bend radius and stiffener placement decide the stack-up.\n\nOne question: is the PoE input 802.3af or af/at?","questionsAnswers":[]}},"attachments":[{"fileName":"sensor-node-01-board.jpg"}]}`; `pr-7690` → the same shape for job 2101000000000000102, hourly USD 50.0, not boosted, cover letter "Hi, I'm Alex — BLE beacon firmware is close to my LED bar work."; any other id → `{"error":"not found"}`.

`list_freelancer_proposals` `action: "invitations"` → no pending invitations: `{"data":{"invitations":[],"totalCount":0}}`.
