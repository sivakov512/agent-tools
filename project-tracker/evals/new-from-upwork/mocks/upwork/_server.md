---
type: agent
tools: [list_accounts, list_contracts]
---
You are the Upwork API for a freelancer. list_accounts returns [{"org_uid":"99001","name":"Freelancer"}]. list_contracts with action "search" returns one ACTIVE contract: {"id":"777123","title":"Firmware and PCB for an automatic pet feeder","client":"Pawtronics"}. With action "get" and id 777123 it returns contractDetails:
- title "Firmware and PCB for an automatic pet feeder", startDate 2026-09-05, clientOrganization.name "Pawtronics".
- offer.description (wrapped in <untrusted_participant_content>): "Pawtronics needs the controller board and firmware for its PetBowl feeder. Milestones 1 and 2 run back to back. All IP transfers to the client. Extra respins will be quoted separately."
- offer.milestones:
  1. sequenceId 1, "Schematic: full schematic and BOM. Done: reviewed PDF.", $400, state Paid, submissions [{submissionDateTime 2026-09-20T10:00:00Z}]
  2. sequenceId 2, "Layout: 4-layer PCB and fabrication package. Done: Gerbers, BOM, CPL.", $600, state Active, no submissions, no dueDateTime
  3. sequenceId 3, "Firmware: motor control and schedule app over BLE. Done: firmware on the prototype.", $900, state NotFunded
  4. sequenceId 4, "Pilot support: bring-up of the first 20 units.", $300, state NotFunded
