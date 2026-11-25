"use client";

import { useMemo, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { IconArrowUpRight } from "@tabler/icons-react";
import { parseTurnTimestamp } from "@/lib/state/slices/session/turn-actions";
import type { Task } from "../kanban-card-types";
import type { WorkflowStep } from "../kanban-column";
import { beatLabels, cardActivity } from "../kanban-card-activity";
import "./sound-console.css";

type Channel = { id: string; title: string; count: number; queued: number };
type BandStyle = CSSProperties & { "--level": string; "--delay": string };
const waveform = [
  3, 5, 7, 5, 3, 2, 4, 6, 4, 2, 1, 2, 4, 6, 8, 5, 3, 2, 4, 6, 5, 3, 1, 1, 2, 4, 7, 6, 4, 2, 5, 4, 3,
  2,
];

function consoleMix(tasks: Task[], steps: WorkflowStep[]) {
  const channels = steps.map(({ id, title }) => ({ id, title, count: 0, queued: 0 }));
  const byStep = new Map(channels.map((channel) => [channel.id, channel]));
  let lead: Task | undefined;
  let activityTime = BigInt(-1);
  for (const task of tasks) {
    const channel = byStep.get(task.workflowStepId);
    if (!channel) continue;
    channel.count++;
    if (task.queuedForStepId === channel.id && task.wipAdmitted !== true) channel.queued++;
    const state = cardActivity(task);
    if (state !== "running" && state !== "background") continue;
    const at = parseTurnTimestamp(task.statusSummary?.agent_activity?.at) ?? BigInt(-1);
    if (!lead || at > activityTime) {
      lead = task;
      activityTime = at;
    }
  }
  return { channels, lead, total: channels.reduce((sum, ch) => sum + ch.count, 0) };
}

function Meter({ lead }: { lead: Task }) {
  const beat = lead?.statusSummary?.agent_activity;
  const phase = beat ? Object.keys(beatLabels).indexOf(beat.kind) : 0;
  const recent = beat && Math.abs(Date.now() - Date.parse(beat.at)) < 2500;
  return (
    <div
      className="console-spectrum"
      key={beat?.at}
      data-pulse={Boolean(recent)}
      aria-hidden="true"
    >
      {waveform.map((_, i) => {
        const level = waveform[(i + phase * 3) % waveform.length];
        const style: BandStyle = { "--level": `${level * 10}%`, "--delay": `${(i % 7) * 32}ms` };
        return (
          <i key={i} style={style}>
            <b />
          </i>
        );
      })}
    </div>
  );
}

function ConsoleCaption({
  lead,
  total,
  workflowName,
}: {
  lead?: Task;
  total: number;
  workflowName?: string;
}) {
  const { t } = useTranslation("kanban");
  const beat = lead?.statusSummary?.agent_activity;
  const delegate = lead?.statusSummary?.delegate;
  const agent = delegate && beat?.session_id === delegate.session_id ? delegate.name : undefined;
  let detail = t("consoleTrackCount", { count: total });
  if (beat) detail = t(beatLabels[beat.kind]);
  else if (lead) detail = t("task:sessionStatusRunning");
  return (
    <div className="console-caption">
      {workflowName && <span>{workflowName}</span>}
      {agent && <span>{agent}</span>}
      <span>{detail}</span>
    </div>
  );
}

function ChannelLoad({
  channels,
  onSelect,
}: {
  channels: Channel[];
  onSelect: (index: number) => void;
}) {
  const { t } = useTranslation("kanban");
  const max = Math.max(1, ...channels.map((c) => c.count));
  return (
    <div className="console-channels" role="group" aria-label={t("consoleLoad")}>
      <div className="console-scale">
        <span>{t("consoleLoad")}</span>
      </div>
      <div className="console-channel-list">
        {channels.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className="subtle-action"
            onClick={() => onSelect(i)}
            style={{ "--load": (100 * c.count) / max + "%" } as CSSProperties}
            title={t("consoleTrackCount", { count: c.count })}
          >
            <span aria-hidden="true" className="console-channel-level">
              <i />
            </span>
            <strong>{c.count}</strong>
            {c.title}
            {c.queued > 0 && <small>{t("queuedCount", { count: c.queued })}</small>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SoundConsole({
  steps,
  tasks,
  workflowName,
  onOpenTask,
  onSelectChannel,
}: {
  steps: WorkflowStep[];
  tasks: Task[];
  workflowName?: string;
  onOpenTask: (task: Task) => void;
  onSelectChannel: (index: number) => void;
}) {
  const { t } = useTranslation("kanban");
  const { channels, lead, total } = useMemo(() => consoleMix(tasks, steps), [tasks, steps]);
  const channel = channels.findIndex((c) => c.id === lead?.workflowStepId);
  return (
    <section
      className="sound-console"
      aria-label={t("soundConsole")}
      data-console-live={Boolean(lead)}
    >
      <div className="console-track">
        <div className="console-eyebrow">
          <i />
          {lead ? t("consoleLive") : t("consoleStandby")}
        </div>
        {lead && (
          <h2>
            <button type="button" onClick={() => onOpenTask(lead)}>
              {lead.title}
              <IconArrowUpRight size={15} />
            </button>
          </h2>
        )}
        <ConsoleCaption lead={lead} total={total} workflowName={lead ? workflowName : undefined} />
      </div>
      {lead && (
        <div className="console-display">
          <div className="console-scale">
            <span>{t("consoleChannel", { number: String(channel + 1).padStart(2, "0") })}</span>
            <span>{channels[channel]?.title}</span>
          </div>
          <Meter lead={lead} />
        </div>
      )}
      <ChannelLoad channels={channels} onSelect={onSelectChannel} />
    </section>
  );
}
