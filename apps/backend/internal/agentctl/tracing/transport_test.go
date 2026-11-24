package tracing

import (
	"context"
	"fmt"
	"net/http"
	"testing"
	"time"
)

func TestTraceEndpoint(t *testing.T) {
	for raw, want := range map[string]string{"https://collector.example/base": "https://collector.example/base/v1/traces", "collector.example:4318": "https://collector.example:4318/v1/traces", "http://localhost:4318": "http://localhost:4318/v1/traces", "http://[::1]:4318": "http://[::1]:4318/v1/traces", "http://collector.example": "", "https://user@collector.example": "", "https://collector.example/?token=a": "", "": ""} {
		got, err := traceEndpoint(raw)
		if got != want || (err != nil) != (want == "") {
			t.Errorf("%q: %q, %v", raw, got, err)
		}
	}
}

func TestTracer(t *testing.T) {
	t.Run("returns non-nil tracer", func(t *testing.T) {
		tracer := Tracer("test-tracer")
		if tracer == nil {
			t.Error("expected non-nil tracer")
		}
	})

	t.Run("returns no-op tracer without env vars", func(t *testing.T) {
		// Without KANDEV_DEBUG_AGENT_MESSAGES=true, we get a no-op tracer
		tracer := Tracer("test-noop")
		if tracer == nil {
			t.Error("expected non-nil tracer")
		}
	})
}

func TestTraceHTTPRequest(t *testing.T) {
	ctx := context.Background()

	t.Run("returns non-nil context and span", func(t *testing.T) {
		returnedCtx, span := TraceHTTPRequest(ctx, "POST", "/api/v1/start", "exec-123")
		if returnedCtx == nil {
			t.Error("expected non-nil context")
		}
		if span == nil {
			t.Error("expected non-nil span")
		}
		span.End()
	})
}

func TestTraceHTTPResponse(t *testing.T) {
	ctx := context.Background()

	t.Run("records success", func(t *testing.T) {
		_, span := TraceHTTPRequest(ctx, "GET", "/api/v1/status", "exec-123")
		TraceHTTPResponse(span, 200, nil)
		span.End()
	})

	t.Run("records error", func(t *testing.T) {
		_, span := TraceHTTPRequest(ctx, "POST", "/api/v1/stop", "exec-123")
		TraceHTTPResponse(span, 500, fmt.Errorf("server error"))
		span.End()
	})
}

func TestTraceWSRequest(t *testing.T) {
	ctx := context.Background()

	t.Run("returns non-nil context and span", func(t *testing.T) {
		returnedCtx, span := TraceWSRequest(ctx, "agent.initialize", "msg-123", "exec-456", "sess-789")
		if returnedCtx == nil {
			t.Error("expected non-nil context")
		}
		if span == nil {
			t.Error("expected non-nil span")
		}
		TraceWSResponse(span, "response", nil)
		span.End()
	})
}

func TestTraceAgentEvent(t *testing.T) {
	ctx := context.Background()

	t.Run("does not panic", func(t *testing.T) {
		TraceAgentEvent(ctx, "message_chunk", "sess-123", "exec-456", 24)
	})

	t.Run("handles empty values", func(t *testing.T) {
		TraceAgentEvent(ctx, "", "", "", 0)
	})
}

func TestTraceWorkspaceEvent(t *testing.T) {
	ctx := context.Background()

	t.Run("does not panic", func(t *testing.T) {
		TraceWorkspaceEvent(ctx, "git_status", "exec-123", "sess-456")
	})

	t.Run("handles empty session_id", func(t *testing.T) {
		TraceWorkspaceEvent(ctx, "file_change", "exec-123", "")
	})
}

func TestTraceTurnEnd(t *testing.T) {
	ctx := context.Background()

	t.Run("returns non-nil context and span", func(t *testing.T) {
		returnedCtx, span := TraceTurnEnd(ctx, "exec-123", "sess-456")
		if returnedCtx == nil {
			t.Error("expected non-nil context")
		}
		if span == nil {
			t.Error("expected non-nil span")
		}
		span.End()
	})
}

func TestTraceMCPDispatch(t *testing.T) {
	ctx := context.Background()

	t.Run("returns non-nil context and span", func(t *testing.T) {
		returnedCtx, span := TraceMCPDispatch(ctx, "tools/call", "msg-789", "exec-123")
		if returnedCtx == nil {
			t.Error("expected non-nil context")
		}
		if span == nil {
			t.Error("expected non-nil span")
		}
		TraceMCPResponse(span, nil)
		span.End()
	})

	t.Run("records error", func(t *testing.T) {
		_, span := TraceMCPDispatch(ctx, "tools/call", "msg-789", "exec-123")
		TraceMCPResponse(span, fmt.Errorf("dispatch failed"))
		span.End()
	})
}

func TestTraceSessionStart(t *testing.T) {
	ctx := context.Background()

	t.Run("returns non-nil context and span", func(t *testing.T) {
		returnedCtx, span := TraceSessionStart(ctx, "task-1", "sess-1", "exec-1")
		if returnedCtx == nil {
			t.Error("expected non-nil context")
		}
		if span == nil {
			t.Error("expected non-nil span")
		}
		span.End()
	})

	t.Run("child span shares trace ID with session", func(t *testing.T) {
		sessionCtx, sessionSpan := TraceSessionStart(ctx, "task-2", "sess-2", "exec-2")
		defer sessionSpan.End()

		// Create a child span using the session context
		childCtx, childSpan := TraceHTTPRequest(sessionCtx, "POST", "/api/v1/start", "exec-2")
		defer childSpan.End()

		sessionTraceID := sessionSpan.SpanContext().TraceID()
		childTraceID := childSpan.SpanContext().TraceID()

		if sessionTraceID != childTraceID {
			t.Errorf("child trace ID %s != session trace ID %s", childTraceID, sessionTraceID)
		}

		_ = childCtx
	})
}

func TestTraceSessionRecovered(t *testing.T) {
	ctx := context.Background()

	t.Run("returns non-nil context and span", func(t *testing.T) {
		returnedCtx, span := TraceSessionRecovered(ctx, "task-1", "sess-1", "exec-1")
		if returnedCtx == nil {
			t.Error("expected non-nil context")
		}
		if span == nil {
			t.Error("expected non-nil span")
		}
		span.End()
	})
}

func TestShutdown(t *testing.T) {
	t.Run("no-op shutdown does not error", func(t *testing.T) {
		if err := Shutdown(context.Background()); err != nil {
			t.Errorf("expected nil error, got %v", err)
		}
	})
}

func TestCollectorClientUsesBoundedSingleDestinationTransport(t *testing.T) {
	t.Setenv("OTEL_EXPORTER_OTLP_TRACES_TIMEOUT", "2500")
	t.Setenv("OTEL_EXPORTER_OTLP_TIMEOUT", "100")
	client, err := collectorClient()
	if err != nil {
		t.Fatal(err)
	}
	if client.Timeout != 2500*time.Millisecond || client.CheckRedirect(nil, nil) != http.ErrUseLastResponse {
		t.Fatal("unexpected collector policy")
	}
	t.Setenv("OTEL_EXPORTER_OTLP_TRACES_CERTIFICATE", t.TempDir()+"/missing")
	if _, err := collectorClient(); err == nil {
		t.Fatal("invalid CA should disable export")
	}
}
