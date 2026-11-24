---
status: current
system: agents
requirements:
  - REQ-AGENTS-NAMED-CARD-AGENTS-001
---

# Named agents for Kanban cards

## Requirement mapping

| Criteria | Boundary |
| --- | --- |
| AC-AGENTS-NAMED-CARD-AGENTS-001.1, AC-AGENTS-NAMED-CARD-AGENTS-001.2 | Saved definition and provider capabilities |
| AC-AGENTS-NAMED-CARD-AGENTS-001.3, AC-AGENTS-NAMED-CARD-AGENTS-001.5 | Discovery and launch |
| AC-AGENTS-NAMED-CARD-AGENTS-001.4, AC-AGENTS-NAMED-CARD-AGENTS-001.6 | Execution and visible outcome |

## Saved definition and provider capabilities

Extend the concrete AgentProfile. Keep its ID, name, harness association, model and model-aware config options. Persist an optional binding on the profile containing the owning workspace ID, a short purpose, a directory relative to the card checkout (default "."), and verbatim instructions Markdown. A nullable binding distinguishes ordinary and Office profiles from this feature. Save the profile and binding atomically in the existing profile settings JSON. Editing, reloading and duplicating a profile must preserve these fields within its scope. Handle partial updates without clearing omitted fields. Do not repurpose the deprecated Office CustomPrompt or implicitly enroll the profile in Office.

In Settings > Agents provide a named-agent creation action using the existing profile editor and harness capability probe. Resolve the exact advertised model before loading effort choices. Keep the provider's option ID and value in ConfigOptions. An unset effort delegates to the harness. Require an exact model for this form and disable fallback that would change the user's explicit choice. Only offer harnesses that can apply a configured folder and deliver the first assignment programmatically. Describe unavailable capabilities in the editor.

## Discovery and launch

Extend the existing task-scoped list_agents_kandev projection with a named agent's stable ID, display name, harness, model and explicit short purpose. Expose only visible bindings for this workspace. The coordinator chooses the agent for the assignment and passes its ID, the current task ID and a prompt to spawn_session_kandev. The human uses the card menu’s Delegate to an agent picker. If two names match, distinguish them by visible folder and harness, and always submit an ID.

Both paths already converge on LaunchSession. Keep creation of an additional same-card session, its lineage and workflow binding. Recheck task authority, profile availability, folder membership and executor compatibility at admission even when the profile was already listed. Reject an invalid explicit ID without inheriting the sender's profile. The coordinator needs discovery and launch permissions only.

## Execution and visible outcome

Interpret the folder as the CLI's actual working directory. The picker accepts a relative directory in the registered card checkout. For a direct local execution use that folder. For a worktree or remote executor, resolve the corresponding directory inside the card's admitted checkout or mount. Check canonical containment, including symbolic links, at the executor that starts the process. A root outside the card's admitted folders requires adding it to the workspace/card first. Never drop to the card root on mismatch.

At admission capture the chosen ID, display name, instructions, requested provider settings and directory binding with the new session. Feed the resolved CWD to the harness session and its working tools. Compose the Markdown as labeled role context alongside the existing card assignment on the first delivery. Preserve prompt ordering and replay semantics. Do not create or overwrite files in the checkout, interpolate Markdown into a shell command or log the instructions. Pending and resumed sessions use their captured values; permission checks and workspace readiness still run on recovery. A failure applying explicit model or effort stops prompt delivery and records the reason against this session.

Use the existing session status and errors in the card and the existing MCP response. Display the agent name and working folder before launch. Keep the folder distinct from the executor/worktree identity. The new form stacks labeled fields on desktop and phone, with field-level validation and a keyboard-accessible submit action.

## Related contracts

- [Provider model options](../requirements/dynamic-provider-options.md)
- [Dynamic profile routing decision](../../../decisions/2026-08-13-dynamic-agent-profile-routing.md)
- [Delivery plan](../../../plans/named-card-agents/plan.md)
