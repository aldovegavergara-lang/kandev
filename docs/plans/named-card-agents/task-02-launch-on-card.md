---
id: "02-launch-on-card"
title: "Launch a saved agent on its card"
status: done
wave: 2
depends_on: ["01-save-definition"]
plan: plan.md
requirements: [REQ-AGENTS-NAMED-CARD-AGENTS-001]
acceptance_criteria: [AC-AGENTS-NAMED-CARD-AGENTS-001.2, AC-AGENTS-NAMED-CARD-AGENTS-001.3, AC-AGENTS-NAMED-CARD-AGENTS-001.4, AC-AGENTS-NAMED-CARD-AGENTS-001.5]
system_design: [../../specs/agents/system-design/named-card-agents.md]
---

# Launch a saved agent on its card

## Summary and scope

Use the existing MCP inventory and spawn tools. Resolve the folder under the admitted workspace, snapshot the definition at session creation and compose role instructions at first prompt delivery. Test the shared launcher from both human and coordinator entry points.

## Exclusions

Office hiring, a second coordinator service and changes to executor access policies are outside this work order.

## Implementation acceptance

- A task-scoped discovery plus spawn produces a second session on the same card. A captured runtime launch uses the selected directory, model, effort, role text and assignment.
- Disabled or foreign profiles, missing directories, path escapes and unmapped executor folders return a reason before work is dispatched. A rejected explicit provider option sends no assignment.
- A profile edit between creation and delivery leaves queued and resumed session instructions intact. Two agent launches on one card cannot exchange instructions.

## Likely files and risks

apps/backend/internal/mcp/{server/core_discovery_tools.go,handlers/spawn_session.go}, internal/orchestrator and its executor, internal/agent/runtime/lifecycle/profile_resolver.go (Go paths under apps/backend).

Task workspace reuse and deferred first prompt delivery can otherwise overwrite the requested directory or repeat the assignment. Resolve and validate paths where the worker runs.

## Verification

Run from the repository root after installing workspace dependencies.

```sh
(cd apps/backend && go test ./internal/orchestrator/... ./internal/agent/runtime/lifecycle/... ./internal/mcp/handlers ./internal/mcp/server -run 'NamedCardAgent|SpawnSession|LaunchPromptIntegrity' -count=1)
```

## Results

The executor checks the folder on the execution host. The Chromium fixture proved the worker could read a file found only in its configured subdirectory and applied the selected effort before the assignment.
