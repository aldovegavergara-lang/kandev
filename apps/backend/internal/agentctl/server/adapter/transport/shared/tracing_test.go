package shared

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/kandev/kandev/internal/agentctl/types/streams"
)

func TestTraceProtocolEvent(t *testing.T) {
	ctx := context.Background()

	t.Run("nil normalized event does not panic", func(t *testing.T) {
		TraceProtocolEvent(ctx, "acp", "agent-1", "message_chunk",
			json.RawMessage(`{"text":"hello"}`), nil)
	})

	t.Run("valid normalized event with raw data does not panic", func(t *testing.T) {
		event := &streams.AgentEvent{
			Type:      "message_chunk",
			SessionID: "sess-123",
			Text:      "hello world",
		}
		rawData := json.RawMessage(`{"type":"message_chunk","text":"hello world"}`)

		TraceProtocolEvent(ctx, "acp", "agent-1", "message_chunk", rawData, event)
	})

	t.Run("empty raw data does not panic", func(t *testing.T) {
		event := &streams.AgentEvent{
			Type:      "complete",
			SessionID: "sess-456",
		}

		TraceProtocolEvent(ctx, "acp", "agent-1", "complete", nil, event)
	})
}

func TestTracer_ReturnsSameNoopInstance(t *testing.T) {
	// When debug mode is off (default), Tracer() should return the same cached
	// noop tracer instance to avoid garbage on every call.
	t1 := Tracer()
	t2 := Tracer()
	if t1 != t2 {
		t.Error("expected Tracer() to return the same noop tracer instance when debug mode is off")
	}
}

func TestTraceProtocolRequest(t *testing.T) {
	t.Run("returns non-nil context and span", func(t *testing.T) {
		ctx := context.Background()

		returnedCtx, span := TraceProtocolRequest(ctx, "acp", "agent-1", "session/new")

		if returnedCtx == nil {
			t.Error("expected non-nil context, got nil")
		}
		if span == nil {
			t.Error("expected non-nil span, got nil")
		}

		// Clean up the span
		span.End()
	})
}
