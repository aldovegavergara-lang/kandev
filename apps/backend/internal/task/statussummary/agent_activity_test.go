package statussummary

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/kandev/kandev/internal/events"
)

func TestCardAgentActivity(t *testing.T) {
	start := time.Now().UTC()
	state := &projectionState{sessions: map[string]sessionObservation{"s": {id: "s", state: sessionStateRunning}}}
	msg := map[string]any{"session_id": "s", "author_type": "agent", "type": "message", "content": "Hello", "updated_at": start}
	if !observeAgentActivity(state, events.MessageAdded, msg) || latestAgentActivity(state).Kind != "reply" {
		t.Fatal("expected a reply pulse")
	}
	msg["updated_at"] = start.Add(time.Millisecond)
	if observeAgentActivity(state, events.MessageUpdated, msg) {
		t.Fatal("rapid text chunks should be coalesced")
	}
	msg["type"], msg["metadata"] = "tool_call", map[string]any{"status": "in_progress"}
	if !observeAgentActivity(state, events.MessageUpdated, msg) || latestAgentActivity(state).Kind != "tool" {
		t.Fatal("tool start should be immediate")
	}
	msg["metadata"], msg["updated_at"] = map[string]any{"status": "completed"}, start.Add(time.Second)
	if !observeAgentActivity(state, events.MessageUpdated, msg) || latestAgentActivity(state).Kind != "tool_done" {
		t.Fatal("tool completion should be immediate")
	}
	msg["updated_at"] = start
	if observeAgentActivity(state, events.MessageUpdated, msg) || observeAgentActivity(state, events.MessageDeleted, msg) {
		t.Fatal("old or deleted events should not restart a pulse")
	}
	state.sessions["s"] = sessionObservation{id: "s", state: "COMPLETED"}
	if latestAgentActivity(state) != nil || observeAgentActivity(state, events.MessageUpdated, msg) {
		t.Fatal("a finished session cannot emit a live pulse")
	}
}

func TestLatestAgentActivityFollowsRunningSessions(t *testing.T) {
	at := time.Now().UTC()
	first := &AgentActivitySummary{SessionID: "first", Kind: "reply", At: at}
	second := &AgentActivitySummary{SessionID: "second", Kind: "tool_read", At: at.Add(time.Second)}
	state := &projectionState{sessions: map[string]sessionObservation{
		"first":  {id: "first", state: sessionStateRunning, agentActivity: first},
		"second": {id: "second", state: sessionStateRunning, agentActivity: second},
	}}
	if got := deriveSummary(state).AgentActivity; got != second {
		t.Fatalf("latest = %+v", got)
	}
	state.sessions["second"] = sessionObservation{id: "second", state: "COMPLETED"}
	if got := deriveSummary(state).AgentActivity; got != first {
		t.Fatalf("remaining live session = %+v", got)
	}
	encoded, err := deriveSummary(state).SemanticJSON()
	if err != nil {
		t.Fatal(err)
	}
	var decoded TaskStatusSummary
	if err := json.Unmarshal(encoded, &decoded); err != nil {
		t.Fatal(err)
	}
	if decoded.AgentActivity == nil || !decoded.AgentActivity.At.Equal(first.At) {
		t.Fatal("lost activity crossing persistence boundary")
	}
}

func TestAgentActivityOnlyExposesActionKinds(t *testing.T) {
	for _, kind := range []string{"tool_read", "tool_edit", "tool_search", "tool_execute"} {
		data := map[string]any{"author_type": "agent", "type": kind, "metadata": map[string]any{"status": "in_progress", "tool_name": "private command"}}
		if got := agentMessageKind(data); got != kind {
			t.Fatalf("%s = %s", kind, got)
		}
	}
	if got := agentMessageKind(map[string]any{"author_type": "user", "type": "message", "content": "hello"}); got != "" {
		t.Fatalf("user message classified as %s", got)
	}
}
