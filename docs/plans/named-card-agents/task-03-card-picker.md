---
id: "03-card-picker"
title: "Select the agent and verify the session"
status: done
wave: 3
depends_on: ["02-launch-on-card"]
plan: plan.md
requirements: [REQ-AGENTS-NAMED-CARD-AGENTS-001]
acceptance_criteria: [AC-AGENTS-NAMED-CARD-AGENTS-001.1, AC-AGENTS-NAMED-CARD-AGENTS-001.2, AC-AGENTS-NAMED-CARD-AGENTS-001.3, AC-AGENTS-NAMED-CARD-AGENTS-001.4, AC-AGENTS-NAMED-CARD-AGENTS-001.5, AC-AGENTS-NAMED-CARD-AGENTS-001.6]
system_design: [../../specs/agents/system-design/named-card-agents.md]
---

# Select the agent and verify the session

## Summary and scope

Extend the existing New Session selector to show the agent name and working folder. Exercise save, reload, coordinator discovery and launch, and the human path on the same card with a protocol-recording mock harness. Verify the real launch CWD, first prompt and observed settings.

## Exclusions

Provider installation, persistent demo data and external model calls are outside the automated test.

## Implementation acceptance

- A user completes both dialogs with keyboard and at phone width. On the card the launched session is visibly attributed to its agent.
- An MCP-driven coordinator test and a card-picker test observe the same named profile and actual mock-harness inputs. Existing profiles still work.

## ASCII UI preview

UI-02. Card > New Session
```text
Agent       [Reviewer                 v ]
Folder       project / src
Assignment  [Review the latest changes. ]
                         [Start session]
```

Use the same field order in a scrolling single column on phones. Show a field-level reason when launch or save is unavailable. [Complete previews](plan.md#ascii-ui-preview).

## Likely files and risks

apps/web/components/task/{new-session-dialog.tsx,new-session-profile-selection.ts}, apps/web/e2e/tests/kanban/{named-card-agent,mobile-named-card-agent}.spec.ts (new).

A visible session name alone proves neither correct settings nor working directory. Assert against the process/session protocol recorder.

## Verification

Run from the repository root after installing workspace dependencies.

```sh
(cd apps/web && pnpm exec vitest run components/task/new-session-dialog.test.tsx)
(cd apps/web && pnpm e2e:raw --project=chromium tests/kanban/named-card-agent.spec.ts)
(cd apps/web && pnpm e2e:raw --project=mobile-chrome tests/kanban/mobile-named-card-agent.spec.ts)
```

## Results

Desktop and mobile browser fixtures launched a named worker from the card. Desktop also discovered and launched the role through the coordinator and verified the resulting card preview.
