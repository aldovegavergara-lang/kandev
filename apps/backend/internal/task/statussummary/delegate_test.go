package statussummary

import (
	"strings"
	"testing"
	"time"

	"github.com/kandev/kandev/internal/cardagent"
	"github.com/kandev/kandev/internal/events"
)

func TestNamedCardAgentReplyProjection(t *testing.T) {
	at := time.Now().UTC()
	obs := sessionObservation{id: "worker", state: sessionStateRunning}
	observeDelegateState(&obs, obs.id, map[string]any{"updated_at": at, "state": sessionStateRunning, "agent_profile_snapshot": map[string]any{"name": "Reviewer", cardagent.FolderKey: "review"}})
	state := projectionState{sessions: map[string]sessionObservation{obs.id: obs}}
	msg := map[string]any{"session_id": obs.id, "author_type": "agent", "updated_at": at.Add(time.Second), "type": "message", "content": "First observation"}
	if !observeDelegateMessage(&state, events.MessageAdded, obs.id, msg) {
		t.Fatal("first reply was lost")
	}
	msg["content"] = "Completed the check"
	msg["updated_at"] = at.Add(1200 * time.Millisecond)
	observeDelegateMessage(&state, events.MessageUpdated, obs.id, msg)
	obs = state.sessions[obs.id]
	observeDelegateState(&obs, obs.id, map[string]any{"updated_at": at.Add(2 * time.Second), "state": "WAITING_FOR_INPUT"})
	if obs.delegate.Preview != "Completed the check" || obs.delegate.Folder != "review" {
		t.Fatalf("settled reply: %+v", obs.delegate)
	}
	state.sessions[obs.id] = obs
	msg["updated_at"] = at.Add(3 * time.Second)
	msg["type"] = messageTypeClarificationRequest
	msg["metadata"] = map[string]any{"question": map[string]any{"prompt": "Which branch?"}}
	if !observeDelegateMessage(&state, events.MessageAdded, obs.id, msg) || latestDelegate(&state).Preview != "Which branch?" {
		t.Fatal("question preview missing")
	}
	if got := boundedText(strings.Repeat("á", 200), 319); len(got) != 318 {
		t.Fatal("preview split a UTF-8 character")
	}
}
