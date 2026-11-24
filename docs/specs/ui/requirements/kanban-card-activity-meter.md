---
status: active
system: ui
owners:
  - kandev
created: 2026-11-24
---

# Kanban card activity meter

### REQ-UI-KANBAN-CARD-ACTIVITY-METER-001: Read agent activity on the board

- **AC-UI-KANBAN-CARD-ACTIVITY-METER-001.1:** A short, silent pulse accompanies an observed reply or tool event in its own card. Running sessions share one indicator per card. The label and time of the latest observation remain readable when motion stops.
- **AC-UI-KANBAN-CARD-ACTIVITY-METER-001.2:** Requests for input take priority. Settlement clears the meter and inactive cards can remain in any workflow column. Reduced-motion users receive the same information with stationary bars.
- **AC-UI-KANBAN-CARD-ACTIVITY-METER-001.3:** Opening the board requires no transcript subscription for a card. Input, output and arguments remain scoped to their session.

## Scope

The meter shows activity for interactive sessions in the Kanban. Bar height is decorative.
