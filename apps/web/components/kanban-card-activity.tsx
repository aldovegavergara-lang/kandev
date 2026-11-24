"use client";

import { IconCheck, IconMessageQuestion, IconShieldQuestion } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useNow } from "@/hooks/use-now";
import { formatRelativeTime } from "@/lib/i18n/formats";
import { parseTurnTimestamp } from "@/lib/state/slices/session/turn-actions";
import type { Task } from "./kanban-card-types";
import type { TaskStatusSummary } from "@/lib/types/task-status-summary";
import "./kanban-card-activity.css";

type Beat = NonNullable<TaskStatusSummary["agent_activity"]>;

const beatLabels = {
  reply: "activityReply",
  tool: "activityTool",
  tool_read: "activityRead",
  tool_edit: "activityEdit",
  tool_search: "activitySearch",
  tool_execute: "activityExecute",
  tool_done: "activityToolFinished",
  tool_failed: "activityToolFailed",
} as const;

function ActivityMeter({ pulse }: { pulse: boolean }) {
  return (
    <span className="kanban-meter" aria-hidden="true" data-pulse={pulse}>
      <i />
      <i />
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

function ObservedActivity({ beat }: { beat: Beat }) {
  const { t } = useTranslation("kanban");
  const now = useNow(10_000);
  const timestamp = parseTurnTimestamp(beat.at);
  const ms = timestamp === null ? null : Number(timestamp / BigInt(1_000_000));
  const age = ms === null ? Infinity : Date.now() - ms;
  return (
    <>
      <ActivityMeter key={beat.at} pulse={age >= -1000 && age < 2500} />
      <span className="truncate">{t(beatLabels[beat.kind])}</span>
      {ms !== null && (
        <time
          className="ml-auto shrink-0 text-muted-foreground"
          dateTime={beat.at}
          title={new Date(ms).toLocaleString()}
        >
          {formatRelativeTime(ms, Math.max(now, ms))}
        </time>
      )}
    </>
  );
}

function hasBlockingStatus(task: Task) {
  const summary = task.statusSummary;
  return Boolean(
    task.interrupted ||
    task.autoStartFailed ||
    task.workspaceOrphaned ||
    summary?.active_error ||
    summary?.task_error ||
    summary?.turn_error ||
    summary?.quota_wait ||
    summary?.launch_queue,
  );
}

function sessionActivity(task: Task) {
  const summary = task.statusSummary;
  const session = summary?.primary_session?.state ?? task.primarySessionState;
  const foreground = summary ? summary.foreground_activity : task.foregroundActivity;
  const running = summary?.has_running_session ?? (session === "RUNNING" || !!foreground);
  if (running) return foreground === "background" ? "background" : "running";
  if (session === "COMPLETED" || task.state === "COMPLETED") return "completed";
  if (session === "WAITING_FOR_INPUT") return "waiting";
  return null;
}

function cardActivity(task: Task) {
  const pending = task.statusSummary
    ? task.statusSummary.pending_action
    : (task.taskPendingAction ??
      (task.primarySessionState === "WAITING_FOR_INPUT" && task.primarySessionPendingAction));
  if (pending === "permission" || pending === "clarification") return pending;
  return hasBlockingStatus(task) ? null : sessionActivity(task);
}

const labels = {
  permission: "sessionStatusPermissionRequested",
  clarification: "needsInput",
  waiting: "sessionStatusWaitingForInput",
  completed: "completed",
  running: "sessionStatusRunning",
  background: "sessionStatusBackgroundRunning",
} as const;

const settledIcons = {
  completed: IconCheck,
  permission: IconShieldQuestion,
  clarification: IconMessageQuestion,
  waiting: IconMessageQuestion,
};

export function KanbanCardActivity({ task }: { task: Task }) {
  const { t } = useTranslation("task");
  const state = cardActivity(task);
  if (!state) return null;

  const beat = task.statusSummary?.agent_activity;
  const playing = state === "running" || state === "background";
  const Icon = playing ? null : settledIcons[state];
  return (
    <div
      data-testid="kanban-card-activity"
      data-activity={state}
      className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11px] leading-4 text-muted-foreground"
    >
      {playing && beat ? (
        <ObservedActivity beat={beat} />
      ) : (
        <>
          {Icon ? (
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <ActivityMeter pulse={false} />
          )}
          <span>{t(labels[state])}</span>
        </>
      )}
    </div>
  );
}
