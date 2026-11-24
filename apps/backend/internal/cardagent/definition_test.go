package cardagent

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestNamedCardAgentDefinition(t *testing.T) {
	role := Definition{"workspace", "Review code", "src", "Review the diff."}
	raw, err := UpdateSettings(`{"keep":true}`, &role)
	if err != nil || *FromSettings(raw) != role {
		t.Fatalf("role round trip: %s, %v", raw, err)
	}
	unchanged, err := UpdateSettings(raw, nil)
	if err != nil || unchanged != raw {
		t.Fatal("omitted role changed settings")
	}
	cleared, err := UpdateSettings(raw, &Definition{})
	if err != nil || cleared != `{"keep":true}` {
		t.Fatalf("clear: %s %v", cleared, err)
	}
	snap := map[string]any{}
	if role.Snapshot(snap, "other") == nil || len(snap) != 0 {
		t.Fatal("accepted role outside workspace")
	}
	if err := role.Snapshot(snap, "workspace"); err != nil {
		t.Fatal(err)
	}
	out := Assignment(snap, "Review commit A.")
	if strings.Count(Assignment(snap, out), role.Instructions) != 1 || !strings.HasSuffix(out, "Review commit A.") {
		t.Fatal("instructions duplicated or missing")
	}
	public, _ := json.Marshal(PublicSnapshot(snap))
	if strings.Contains(string(public), role.Instructions) || snap["card_agent_instructions"] != role.Instructions {
		t.Fatal("public snapshot leaked or changed private role")
	}
}
func TestNamedCardAgentFolder(t *testing.T) {
	root := t.TempDir()
	outside := t.TempDir()
	if err := os.Mkdir(filepath.Join(root, "review"), 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join(root, "outside")); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "file"), nil, 0600); err != nil {
		t.Fatal(err)
	}
	for _, folder := range []string{"../", "..", "/tmp", "outside", "missing", "file", "a/../review"} {
		if _, err := ResolveFolder(root, folder); err == nil {
			t.Errorf("accepted %q", folder)
		}
	}
	for _, folder := range []string{".", "review"} {
		got, err := ResolveFolder(root, folder)
		want, _ := filepath.EvalSymlinks(filepath.Join(root, folder))
		if err != nil || got != want {
			t.Errorf("%q: got %q, %v", folder, got, err)
		}
	}
}
