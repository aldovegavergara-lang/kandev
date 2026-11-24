---
id: "01-save-definition"
title: "Save the agent definition"
status: done
wave: 1
depends_on: []
plan: plan.md
requirements: [REQ-AGENTS-NAMED-CARD-AGENTS-001]
acceptance_criteria: [AC-AGENTS-NAMED-CARD-AGENTS-001.1, AC-AGENTS-NAMED-CARD-AGENTS-001.2, AC-AGENTS-NAMED-CARD-AGENTS-001.6]
system_design: [../../specs/agents/system-design/named-card-agents.md]
---

# Save the agent definition

## Summary and scope

Extend the existing profile form, DTOs and store. Add the workspace folder picker and instructions editor, preserve model-aware options, and reject incompatible selections in both API and UI. Scope the saved binding to the workspace. Include migration and round-trip coverage for SQLite and PostgreSQL using the existing store test patterns.

## Exclusions

Session admission and card launch are covered by the next work orders.

## Implementation acceptance

- The saved binding and exact Markdown survive reload, rename, duplication and unrelated edits. A legacy profile round trips without a binding.
- Changing harness or model refreshes the valid options. An unsupported effort can be left unset and a stale explicit effort cannot be saved.

## ASCII UI preview

UI-01. Settings > Agents, create
```text
Create agent
Name          [Reviewer                 ]
Folder        [project / src          v ]
Instructions  [# Review changes         ]
              [Check the added tests.   ]
Harness       [Codex                  v ]
Model         [Select model           v ]
Effort        [High                   v ]
                            [Save agent]
```

Use the same field order in a scrolling single column on phones. Show a field-level reason when launch or save is unavailable. [Complete previews](plan.md#ascii-ui-preview).

## Likely files and risks

apps/backend/internal/agent/settings/{models/models.go,controller/agent_crud.go,store/sqlite.go}, apps/web/components/settings/{profile-form-fields.tsx,agent-profile-page.tsx} and the shared API types.

Profile and Office share storage. Check how scope and duplication affect legacy listings. A capability probe can return after the user changes models.

## Verification

Run from the repository root after installing workspace dependencies.

```sh
(cd apps/backend && go test ./internal/agent/settings/... -count=1)
(cd apps/web && pnpm exec vitest run components/settings/profile-form-fields.test.tsx)
```

## Results

The profile editor persists the definition in the existing settings record. The Chromium fixture saved and reloaded the worker instructions.
