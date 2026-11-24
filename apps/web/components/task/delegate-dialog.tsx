import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@kandev/ui/dialog";
import { Button } from "@kandev/ui/button";
import { Textarea } from "@kandev/ui/textarea";

import { useAgentListResource } from "@/hooks/domains/settings/use-settings-data";
import { launchSession } from "@/lib/services/session-launch-service";
import TaskLink from "@/components/routing/task-link";
import type { AgentProfile } from "@/lib/types/agent-profile";
import type { Task } from "../kanban-card-types";

export default function DelegateDialog({
  task,
  workspace,
  close,
}: {
  task: Task;
  workspace: string;
  close: () => void;
}) {
  const { t } = useTranslation("agents");
  const { snapshot, delegates } = useWorkspaceDelegates(workspace);
  const [selected, setSelected] = useState("");
  const [assignment, setAssignment] = useState("");
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState("");
  const agent = delegates.find((d) => d.profile.id === selected) ?? delegates[0];
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agent || !assignment.trim() || running.current || session) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await launchSession({
        task_id: task.id,
        intent: "start",
        agent_profile_id: agent.profile.id,
        profile_explicit: true,
        delegate: true,
        prompt: assignment.trim(),
      });
      if (!result.success || !result.session_id)
        throw new Error(result.error || t("delegateFailed"));
      setSession(result.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("delegateFailed"));
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !running.current) close();
      }}
    >
      <DialogContent
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>{t("delegateAction")}</DialogTitle>
          <DialogDescription>{task.title}</DialogDescription>
        </DialogHeader>
        {session ? (
          <TaskLink className="underline" taskId={task.id} sessionId={session}>
            {t("delegateOpen")}
          </TaskLink>
        ) : (
          <form className="grid gap-3 text-sm" onSubmit={submit}>
            {!snapshot.loaded && !snapshot.error && <p role="status">{t("common:loading")}</p>}
            {!!snapshot.error && <p role="alert">{t("delegateFailed")}</p>}
            {snapshot.loaded && !agent && (
              <a href="/settings/agents" className="underline">
                {t("delegateConfigure")}
              </a>
            )}
            {agent && (
              <>
                <DelegatePicker
                  delegates={delegates}
                  agent={agent}
                  busy={busy}
                  onSelect={setSelected}
                />
                <label className="grid gap-1">
                  {t("delegateAssignment")}
                  <Textarea
                    rows={4}
                    value={assignment}
                    disabled={busy}
                    onChange={(e) => setAssignment(e.target.value)}
                  />
                </label>
                <Button disabled={busy || !assignment.trim()} type="submit">
                  {t("delegateAction")}
                </Button>
              </>
            )}
            {error && <p role="alert">{error}</p>}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function useWorkspaceDelegates(workspace: string) {
  const { snapshot } = useAgentListResource(true);
  const delegates = (snapshot.response?.agents ?? []).flatMap((a) =>
    a.profiles
      .filter(
        (p) =>
          p.enabled !== false &&
          p.cardAgent &&
          p.cardAgent.workspace_id === workspace &&
          !p.cliPassthrough,
      )
      .map((p) => ({ profile: p, harness: a.name })),
  );
  return { snapshot, delegates };
}

type DelegateOption = { profile: AgentProfile; harness: string };
function DelegatePicker({
  delegates,
  agent,
  busy,
  onSelect,
}: {
  delegates: DelegateOption[];
  agent: DelegateOption;
  busy: boolean;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation("agents");
  return (
    <>
      {" "}
      <label className="grid gap-1">
        {t("delegateRole")}
        <select
          className="rounded border bg-background p-2"
          value={agent.profile.id}
          disabled={busy}
          onChange={(e) => onSelect(e.target.value)}
        >
          {delegates.map((d) => (
            <option key={d.profile.id} value={d.profile.id}>
              {d.profile.name} · {d.harness} · {d.profile.cardAgent?.folder}
            </option>
          ))}
        </select>
      </label>
      <p>{agent.profile.cardAgent?.purpose}</p>
      <p className="break-all text-muted-foreground">
        {agent.harness} · {agent.profile.model} · {agent.profile.cardAgent?.folder}
      </p>
    </>
  );
}
