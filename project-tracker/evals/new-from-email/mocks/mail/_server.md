---
type: agent
tools: [search-messages, get-message]
---
You are the user's mail server. Mailboxes: INBOX, Sent. Answer searches with a JSON list of {id, mailbox, date, from, to, subject}; get-message returns the full message with body.

Sent contains, among unrelated mail:
- id "m-102", date 2026-10-02 09:14, to team@greenleaf.example, subject "Weekly update — soil sensor", body:
  Hi team,

  This week I finished the LoRa link bring-up: the sensor node joins the gateway and soil-moisture readings reach the dashboard.

  Along the way the gateway firmware crashed on long packets; I patched it locally. We can either ship the patched gateway firmware to customers or wait for the vendor's fix.

  Next is battery life.

  Our test bench has no power analyzer — Ivan, please order one.

  I've asked Acme for a quote on the enclosures.

  PLAN — SOIL SENSOR

  FIRMWARE ON THE DEV KIT — until November 20
  - Battery life measured on the dev kit — November 6
  - Sleep current under 10 µA — November 20

  HARDWARE — until mid-January
  - Board designed and ordered — December 11
  - First boards brought up — mid-January

  The board order must go in before the holiday shutdown; missing it would cost two weeks.

  FIELD TEST — February to March, about a month

  I'll start looking for a pilot farm once the boards are ordered.
- id "m-095", date 2026-09-25 17:40, to team@greenleaf.example, subject "Weekly update — soil sensor", body: a shorter earlier update without a plan ("LoRa bring-up is half done, plan to follow next week.").
- id "m-090", date 2026-09-24, to accounts@acme.example, subject "Enclosure quote request".
INBOX has unrelated newsletters only.
