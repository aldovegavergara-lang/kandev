package handlers

import (
	"encoding/json"
	dto "github.com/kandev/kandev/internal/agent/settings/dto"
	"github.com/kandev/kandev/internal/cardagent"
	"strings"
	"testing"
)

func TestNamedCardAgentCompactDiscovery(t *testing.T) {
	role := &cardagent.Definition{WorkspaceID: "w", Purpose: "Review changes", Folder: "review", Instructions: strings.Repeat("private instructions ", 600)}
	other := *role
	other.WorkspaceID = "other"
	list := dto.ListAgentsResponse{Agents: []dto.AgentDTO{{Name: "mock", Profiles: []dto.AgentProfileDTO{
		{ID: "visible", Enabled: true, CardAgent: role}, {ID: "disabled", CardAgent: role}, {ID: "hidden", Enabled: true, CardAgent: &other}, {ID: "regular", Enabled: true},
	}}}}
	bytes, err := json.Marshal(taskAgentCatalog(&list, "w", true))
	if err != nil {
		t.Fatal(err)
	}
	out := string(bytes)
	if !strings.Contains(out, "visible") || !strings.Contains(out, "Review changes") || len(bytes) > 350 {
		t.Fatalf("unexpected compact catalog: %d bytes", len(bytes))
	}
	for _, excluded := range []string{"private instructions", "disabled", "hidden", "regular"} {
		if strings.Contains(out, excluded) {
			t.Fatalf("catalog leaked %s", excluded)
		}
	}
	full, _ := json.Marshal(taskAgentCatalog(&list, "w", false))
	if !strings.Contains(string(full), "regular") || strings.Contains(string(full), "private instructions") || strings.Contains(string(full), "hidden") {
		t.Fatal("ordinary discovery lost compatibility or leaked role")
	}
	if !strings.Contains(role.Instructions, "private instructions") {
		t.Fatal("modified persisted profile")
	}
}
