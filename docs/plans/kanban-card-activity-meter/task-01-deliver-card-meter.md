---
id: "01-deliver-card-meter"
title: "Deliver the live card meter"
status: done
wave: 1
depends_on: []
plan: plan.md
requirements:
  - REQ-UI-KANBAN-CARD-ACTIVITY-METER-001
acceptance_criteria:
  - AC-UI-KANBAN-CARD-ACTIVITY-METER-001.1
  - AC-UI-KANBAN-CARD-ACTIVITY-METER-001.2
  - AC-UI-KANBAN-CARD-ACTIVITY-METER-001.3
system_design:
  - ../../specs/ui/system-design/kanban-card-activity-meter.md
---

# Deliver the live card meter

## Scope and acceptance

Project a bounded category and timestamp in internal/task/statussummary, render the labeled meter in the shared desktop/mobile card body, and test the flow on a board with its chat closed. Keep transcript delivery, approval and drag interactions in their existing components. Test that a secondary session can supply the latest observation and an inactive card stops pulsing.

## ASCII UI preview

```text
▂▄▃▆▅▃▂  Reading a file      now
```

## Verification

```sh
(cd apps/backend && go test ./internal/task/statussummary)
(cd apps/web && pnpm exec vitest run components/kanban-card-activity.test.tsx components/kanban-card-content.test.tsx components/kanban-card-status-icon.test.tsx components/kanban-card-regression.test.tsx)
(cd apps/web && pnpm exec playwright test --config=e2e/playwright.config.ts tests/kanban/card-activity-equalizer.spec.ts --project=chromium)
```

Verified on 2026-11-24. Go projection tests and 62 card tests passed. Chromium observed the live tool start and finish on the board with the session chat closed and the meter settled after the turn.
