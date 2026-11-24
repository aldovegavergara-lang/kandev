// Package cardagent owns the persisted role and executor-relative folder of a named agent.
package cardagent

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/kandev/kandev/internal/sysprompt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"unicode/utf8"
)

const FolderKey = "card_agent_folder"
const FolderCapability = "card-agent-folder-v1"

type Definition struct {
	WorkspaceID  string `json:"workspace_id"`
	Purpose      string `json:"purpose"`
	Folder       string `json:"folder"`
	Instructions string `json:"instructions"`
}

func (d Definition) Validate() error {
	if strings.TrimSpace(d.WorkspaceID) == "" || len(d.WorkspaceID) > 128 {
		return errors.New("select a workspace for the agent")
	}
	if strings.TrimSpace(d.Purpose) == "" || utf8.RuneCountInString(d.Purpose) > 160 {
		return errors.New("agent purpose must be 1 to 160 characters")
	}
	if strings.TrimSpace(d.Instructions) == "" || len(d.Instructions) > 16*1024 {
		return errors.New("agent instructions must be 1 to 16384 bytes")
	}
	if !validFolder(d.Folder) {
		return errors.New("choose a folder relative to the card workspace, or . for its root")
	}
	return nil
}

func validFolder(folder string) bool {
	return fs.ValidPath(folder) && len(folder) <= 1024 && !strings.ContainsAny(folder, "\\:\x00") && (folder == "." || filepath.IsLocal(filepath.FromSlash(folder)))
}

func FromSettings(raw string) *Definition {
	var settings struct {
		Agent *Definition `json:"card_agent"`
	}
	_ = json.Unmarshal([]byte(raw), &settings)
	return settings.Agent
}

// An omitted patch retains the saved role; an empty object removes it.
func UpdateSettings(raw string, patch *Definition) (string, error) {
	if patch == nil {
		return raw, nil
	}
	settings := map[string]json.RawMessage{}
	if raw != "" {
		if err := json.Unmarshal([]byte(raw), &settings); err != nil {
			return "", err
		}
	}
	if settings == nil {
		settings = map[string]json.RawMessage{}
	}
	if *patch == (Definition{}) {
		delete(settings, "card_agent")
	} else {
		if err := patch.Validate(); err != nil {
			return "", err
		}
		value, err := json.Marshal(patch)
		if err != nil {
			return "", err
		}
		settings["card_agent"] = value
	}
	encoded, err := json.Marshal(settings)
	return string(encoded), err
}

// Resolve on the execution host where checkout and symlink targets actually exist.
func ResolveFolder(root, folder string) (string, error) {
	if folder == "" {
		return root, nil
	}
	if !validFolder(folder) || !filepath.IsAbs(root) {
		return "", errors.New("invalid delegated working directory")
	}
	base, err := filepath.EvalSymlinks(root)
	if err != nil {
		return "", err
	}
	target, err := filepath.EvalSymlinks(filepath.Join(base, filepath.FromSlash(folder)))
	if err != nil {
		return "", fmt.Errorf("delegated folder: %w", err)
	}
	rel, err := filepath.Rel(base, target)
	if err != nil || !filepath.IsLocal(rel) {
		return "", errors.New("delegated folder leaves the card workspace")
	}
	info, err := os.Stat(target)
	if err != nil {
		return "", err
	}
	if !info.IsDir() {
		return "", errors.New("delegated folder is not a directory")
	}
	return target, nil
}

func (d *Definition) Snapshot(snapshot map[string]any, workspace string) error {
	if d == nil {
		return nil
	}
	if err := d.Validate(); err != nil {
		return err
	}
	if d.WorkspaceID != workspace {
		return errors.New("named agent belongs to another workspace")
	}
	d.WriteSnapshot(snapshot)
	return nil
}

func (d *Definition) WriteSnapshot(snapshot map[string]any) {
	snapshot[FolderKey] = d.Folder
	snapshot["card_agent_workspace"] = d.WorkspaceID
	snapshot["card_agent_purpose"] = d.Purpose
	snapshot["card_agent_instructions"] = d.Instructions
}

func Assignment(snapshot map[string]any, prompt string) string {
	role, _ := snapshot["card_agent_instructions"].(string)
	if role == "" {
		return prompt
	}
	block := sysprompt.Wrap("SAVED AGENT INSTRUCTIONS\n" + sysprompt.StripTags(role) + "\nFinish with a brief result and supporting evidence.")
	return block + "\n\n" + strings.ReplaceAll(prompt, block+"\n\n", "")
}

// PublicSnapshot omits the worker prompt from session lists and board events.
func PublicSnapshot(snapshot map[string]any) map[string]any {
	if _, named := snapshot["card_agent_instructions"]; !named {
		return snapshot
	}
	copy := make(map[string]any, len(snapshot)-1)
	for k, v := range snapshot {
		if k != "card_agent_instructions" {
			copy[k] = v
		}
	}
	return copy
}
