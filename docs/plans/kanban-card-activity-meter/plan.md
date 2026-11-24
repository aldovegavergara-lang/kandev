---
created: 2026-11-24
status: done
requirements:
  - REQ-UI-KANBAN-CARD-ACTIVITY-METER-001
system_design:
  - ../../specs/ui/system-design/kanban-card-activity-meter.md
legacy_specs: []
---

# Kanban card activity meter

Use the existing task summary subscription to carry bounded evidence from runtime message events into the card. [Work order](task-01-deliver-card-meter.md).

## ASCII UI preview

Desktop and phone share this row below the description. The animated mark is decorative. The status and timestamp stay readable.

```text
Review the board
▂▄▃▆▅▃▂  Reading a file      now
```
