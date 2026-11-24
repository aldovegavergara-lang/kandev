---
created: 2026-11-24
status: implemented
requirements: [REQ-AGENTS-NAMED-CARD-AGENTS-001]
system_design: [../../specs/agents/system-design/named-card-agents.md]
legacy_specs: []
---

# Named agents for Kanban cards

## Overview

Save a reusable CLI agent, then launch it as a separate session on an existing card. Deliver persistence first, shared session execution second and the card experience last. See the [requirements](../../specs/agents/requirements/named-card-agents.md) and [design](../../specs/agents/system-design/named-card-agents.md).

## Scope and approach

Use AgentProfile, model-aware config options, the New Session dialog, the task-scoped list and spawn tools, and the shared LaunchSession path. Add the bound working directory and Markdown to the existing flow. The coordinator discovers predefined agents and sends each a specific assignment. Provider installation, Office hiring and automatic changes to board columns are outside this slice.

| Provider/transport | Behavior and evidence |
| --- | --- |
| Concrete ACP CLI with model and effort options, including capable Codex, Claude Code or Copilot adapters | Select exact advertised values. Verify model then effort in the recording harness before first prompt. |
| Launch-capable CLI without advertised effort | Show unavailable effort and allow provider default. Supplying an explicit unsupported value fails. |
| Unattended first prompt or working directory unsupported | Explain the missing capability and disable this launch. Ordinary profiles keep their existing paths. |

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

UI-02. Card menu > Delegate to an agent
```text
Agent       [Reviewer                 v ]
Folder       project / src
Assignment  [Review the latest changes. ]
                         [Start session]
```

Both views use the same single-column ordering on desktop and phone. Fields scroll vertically on a phone. Preserve labels, errors and the primary action at narrow widths. While options load, withhold stale effort choices. Show the invalid folder next to its picker when a launch cannot proceed. Field grouping, action order and accessible labels are required. Preview names and paths are illustrative.

## Work orders and verification

1. [Save the agent definition](task-01-save-definition.md)
2. [Launch a saved agent on its card](task-02-launch-on-card.md)
3. [Select the agent and verify the session](task-03-card-picker.md)

## Tests and E2E evidence

The first order covers criteria 1, 2 and 6 through profile-store round trips and profile-form-fields.test.tsx. The second covers criteria 2 through 5 with TestNamedCardAgent cases for discovery, launch, rejection and resume. The final order covers all criteria across the existing UI flows and a recording harness, using named-card-agent.spec.ts in Chromium and mobile-named-card-agent.spec.ts in mobile Chrome. Use isolated fixtures and a temporary checkout for all test data.

Run from the repository root:

```sh
(cd apps && pnpm install --frozen-lockfile)
(cd apps/backend && go test ./internal/agent/settings/... -count=1)
(cd apps/web && pnpm exec vitest run components/settings/profile-form-fields.test.tsx)
(cd apps/backend && go test ./internal/orchestrator/... ./internal/agent/runtime/lifecycle/... ./internal/mcp/handlers ./internal/mcp/server -run 'NamedCardAgent|SpawnSession|LaunchPromptIntegrity' -count=1)
(cd apps/web && pnpm exec vitest run components/task/new-session-dialog.test.tsx)
(cd apps/web && pnpm e2e:raw --project=chromium tests/kanban/named-card-agent.spec.ts)
(cd apps/web && pnpm e2e:raw --project=mobile-chrome tests/kanban/mobile-named-card-agent.spec.ts)
python3 scripts/list-docs.py validate
python3 scripts/lint-spec-files.py --all
git diff --check
```

## Risks

Provider options depend on the selected model. The executor can see a different filesystem than the server. Both need runtime evidence before claiming the agent ran as configured.

## Verification results

Chromium verified saving a named role, delegating from a card, delegated process CWD, applying the configured effort before the first prompt, and a second delegation through the coordinator’s MCP tools. Mobile Chrome verified touch selection and launch. A recording CLI handled both runs without provider inference. Go tests cover scope, path containment, prompt inclusion, bounded discovery and reply projection.
