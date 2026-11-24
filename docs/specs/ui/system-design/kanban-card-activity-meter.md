---
status: current
system: ui
requirements:
  - REQ-UI-KANBAN-CARD-ACTIVITY-METER-001
---

# Task-scoped activity on the Kanban

## Requirement mapping

For AC-UI-KANBAN-CARD-ACTIVITY-METER-001.1 and AC-UI-KANBAN-CARD-ACTIVITY-METER-001.3, the task summary projector observes committed agent message additions and updates. Each running session retains its latest action category and source timestamp. A task publishes its most recent running session's observation. Repeated observations of the same category within two seconds coalesce. The optional projection fits the existing [bounded task status contract](../../platform/system-design/bounded-task-status-delivery.md).

For AC-UI-KANBAN-CARD-ACTIVITY-METER-001.2, the shared card body reads the authorized board snapshot. Pending approval and clarification win over stale activity. Bars replay a finite CSS transform animation keyed by the observed event time. Loading an older observation shows its label without replaying it. Reduced motion disables keyframes. Existing snapshots without the optional observation display only available runtime state.

## Delivery

[Implementation and verification](../../../plans/kanban-card-activity-meter/plan.md)
