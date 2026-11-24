---
status: active
system: agents
created: 2026-11-24
owners:
  - kandev
---

# Named agents for Kanban cards

## Overview

A user defines an agent once. A coordinator can then choose it for a specific assignment on a card. Agents owns the saved definition. Tasks owns the card and its sessions.

### REQ-AGENTS-NAMED-CARD-AGENTS-001: Create and launch a reusable agent

- **AC-AGENTS-NAMED-CARD-AGENTS-001.1:** A workspace user can save, reopen and edit a named agent with a working folder, multiline Markdown instructions, a concrete CLI harness, a model and an optional reasoning effort. Saving alone starts no session.
- **AC-AGENTS-NAMED-CARD-AGENTS-001.2:** The editor offers models and effort choices for the selected harness and model. Unsupported effort is identified and may be left unset. Changing the model clears incompatible choices. A requested value that cannot be applied produces an actionable error before the assignment is sent.
- **AC-AGENTS-NAMED-CARD-AGENTS-001.3:** In the card context the coordinator can discover eligible agents by name, purpose and stable ID, select one, provide an assignment and receive a session ID. The new session belongs to that same card and preserves the coordinator session.
- **AC-AGENTS-NAMED-CARD-AGENTS-001.4:** A new session runs the selected harness and model with the requested effort in its configured working directory. Its first assignment includes its own Markdown and card assignment exactly once. Distinct agents on one card retain their own instructions. Changes affect future sessions.
- **AC-AGENTS-NAMED-CARD-AGENTS-001.5:** The card picker and coordinator launch share eligibility checks. A missing folder, an unavailable profile or a workspace mismatch produces an actionable reason. An incompatible launch never silently uses another directory, profile or model.
- **AC-AGENTS-NAMED-CARD-AGENTS-001.6:** Keyboard and touch users can create and select a named agent. The card identifies the launched agent. Existing ordinary profiles and their saved sessions continue to use their existing launch behavior.

## Out of scope

Office hiring, new provider integrations and creating a new Kanban card per invocation.
