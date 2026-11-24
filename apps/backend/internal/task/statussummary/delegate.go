package statussummary

import (
	"github.com/kandev/kandev/internal/cardagent"
	"github.com/kandev/kandev/internal/events"
	"strings"
	"time"
	"unicode/utf8"
)

type DelegateSummary struct {
	SessionID string    `json:"session_id"`
	Name      string    `json:"name"`
	At        time.Time `json:"at"`
	Folder    string    `json:"folder,omitempty"`
	Purpose   string    `json:"purpose,omitempty"`
	Preview   string    `json:"preview,omitempty"`
}

func boundedText(raw string, limit int) string {
	raw = strings.TrimSpace(raw)
	if len(raw) <= limit {
		return raw
	}
	for limit > 0 && !utf8.RuneStart(raw[limit]) {
		limit--
	}
	return raw[:limit]
}
func (d DelegateSummary) valid() bool {
	return d.SessionID != "" && len(d.SessionID) <= maxSessionIDBytes && d.Name != "" && len(d.Name) <= 128 && len(d.Preview) <= 320 && len(d.Folder) <= 1024 && len(d.Purpose) <= 640 && !d.At.IsZero()
}

func observeDelegateState(obs *sessionObservation, id string, data map[string]any) {
	at := timeValue(data["updated_at"])
	if at.IsZero() || (obs.delegate != nil && at.Before(obs.delegate.At)) {
		return
	}
	snap, _ := data["agent_profile_snapshot"].(map[string]any)
	if _, named := snap[cardagent.FolderKey]; !named && obs.delegate == nil {
		return
	}
	d := DelegateSummary{SessionID: id}
	if obs.delegate != nil {
		d = *obs.delegate
	}
	d.At = at
	if name := stringField(snap, "name"); name != "" {
		d.Name = boundedText(name, 128)
	}
	if folder := stringField(snap, cardagent.FolderKey); folder != "" {
		d.Folder = boundedText(folder, 1024)
	}
	if purpose := stringField(snap, "card_agent_purpose"); purpose != "" {
		d.Purpose = boundedText(purpose, 640)
	}
	if obs.replyPreview != "" {
		d.Preview = obs.replyPreview
	}
	if d.valid() {
		obs.delegate = &d
	}
}

func observeDelegateMessage(state *projectionState, eventType, id string, data map[string]any) bool {
	obs := state.sessions[id]
	if obs.delegate == nil || (eventType != events.MessageAdded && eventType != events.MessageUpdated) || stringField(data, "author_type") != messageTypeAgent {
		return false
	}
	kind := stringField(data, "type")
	if kind != "" && kind != "message" && kind != "content" && kind != messageTypeClarificationRequest {
		return false
	}
	at := timeValue(data["updated_at"])
	if at.IsZero() {
		at = timeValue(data["created_at"])
	}
	if at.IsZero() || at.Before(obs.replyAt) {
		return false
	}
	preview := boundedText(stringField(data, "content"), 320)
	if kind == messageTypeClarificationRequest {
		meta, _ := data["metadata"].(map[string]any)
		question, _ := meta["question"].(map[string]any)
		if prompt := stringField(question, "prompt"); prompt != "" {
			preview = boundedText(prompt, 320)
		}
	}
	if preview == "" {
		return false
	}
	obs.replyPreview = preview
	obs.replyAt = at
	publish := obs.delegate.Preview == "" || at.Sub(obs.delegate.At) >= 2*time.Second || kind == messageTypeClarificationRequest || (obs.state != sessionStateRunning && obs.state != sessionStateStarting)
	if publish {
		d := *obs.delegate
		d.Preview = preview
		if at.After(d.At) {
			d.At = at
		}
		obs.delegate = &d
	}
	state.sessions[id] = obs
	return publish
}

func latestDelegate(state *projectionState) *DelegateSummary {
	var latest *DelegateSummary
	for _, obs := range state.sessions {
		d := obs.delegate
		if d != nil && (latest == nil || d.At.After(latest.At) || (d.At.Equal(latest.At) && d.SessionID < latest.SessionID)) {
			latest = d
		}
	}
	return latest
}
