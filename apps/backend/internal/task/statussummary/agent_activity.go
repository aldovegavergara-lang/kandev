package statussummary

import (
	"time"

	"github.com/kandev/kandev/internal/events"
)

// AgentActivitySummary describes the last observed action of a running session.
// Arguments, transcript text and command output stay on the session channel.
type AgentActivitySummary struct {
	SessionID string    `json:"session_id"`
	Kind      string    `json:"kind"`
	At        time.Time `json:"at"`
}

func (a AgentActivitySummary) valid() bool {
	switch a.Kind {
	case "reply", "tool", "tool_read", "tool_edit", "tool_search", "tool_execute", "tool_done", "tool_failed":
		return a.SessionID != "" && len(a.SessionID) <= maxSessionIDBytes && !a.At.IsZero()
	}
	return false
}

func agentMessageKind(data map[string]any) string {
	if stringField(data, "author_type") != messageTypeAgent {
		return ""
	}
	kind := stringField(data, "type")
	switch kind {
	case "", "message", "content":
		if stringField(data, "content") != "" {
			return "reply"
		}
	case "tool_call", "tool_read", "tool_edit", "tool_search", "tool_execute":
		meta, _ := data["metadata"].(map[string]any)
		switch stringField(meta, "status") {
		case "complete", "completed", "success", "done":
			return "tool_done"
		case "error", "failed", "cancelled", "canceled":
			return "tool_failed"
		default:
			if kind == "tool_call" {
				return "tool"
			}
			return kind
		}
	}
	return ""
}

func observeAgentActivity(state *projectionState, eventType string, data map[string]any) bool {
	if eventType != events.MessageAdded && eventType != events.MessageUpdated {
		return false
	}
	id := stringField(data, "session_id")
	obs := state.sessions[id]
	if obs.state != sessionStateRunning {
		return false
	}
	at := timeValue(data["updated_at"])
	if at.IsZero() {
		at = timeValue(data["created_at"])
	}
	next := AgentActivitySummary{SessionID: id, Kind: agentMessageKind(data), At: at.UTC()}
	if !next.valid() {
		return false
	}
	if prev := obs.agentActivity; prev != nil {
		// Publish stage changes immediately. Long text and tool-output streams
		// need at most one visible pulse every two seconds.
		if !next.At.After(prev.At) || (next.Kind == prev.Kind && next.At.Sub(prev.At) < 2*time.Second) {
			return false
		}
	}
	obs.agentActivity = &next
	state.sessions[id] = obs
	return true
}

func latestAgentActivity(state *projectionState) *AgentActivitySummary {
	var latest *AgentActivitySummary
	for _, obs := range state.sessions {
		next := obs.agentActivity
		if obs.state != sessionStateRunning || next == nil {
			continue
		}
		if latest == nil || next.At.After(latest.At) || (next.At.Equal(latest.At) && next.SessionID < latest.SessionID) {
			latest = next
		}
	}
	return latest
}
