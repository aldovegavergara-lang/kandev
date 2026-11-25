"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@kandev/ui/button";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/components/state-provider";
import { sortWorkflowStepsByPosition } from "@/lib/kanban/workflow-step-order";

export type BoardTaskDestination = { workflowId: string; stepId: string };

export const BoardActionsContext = createContext<{
  destinations: ReadonlyMap<string, BoardTaskDestination>;
  onCreate: (destination: BoardTaskDestination) => void;
  selection: { active: boolean; toggle: () => void };
} | null>(null);

export function BacklogCreateButton({ stepId, touch }: { stepId: string; touch?: boolean }) {
  const { t } = useTranslation();
  const actions = useContext(BoardActionsContext);
  const destination = actions?.destinations.get(stepId);
  if (!actions || !destination) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size={touch ? "icon" : "icon-sm"}
      className={touch ? "size-11" : undefined}
      aria-label={t("kanban:addTask")}
      title={t("kanban:addTask")}
      data-testid="kanban-backlog-create"
      onClick={() => actions.onCreate(destination)}
    >
      <IconPlus className="size-4" />
    </Button>
  );
}

export function BoardSelectionButton({ onDone, touch }: { onDone: () => void; touch?: boolean }) {
  const { t } = useTranslation();
  const selection = useContext(BoardActionsContext)?.selection;
  if (!selection) return null;
  return (
    <Button
      type="button"
      variant="ghost"
      className={touch ? "min-h-11 w-full justify-start" : undefined}
      data-testid={touch ? "mobile-select-tasks" : "multi-select-toggle"}
      aria-pressed={selection.active}
      onClick={() => {
        selection.toggle();
        onDone();
      }}
    >
      {t(selection.active ? "kanban:cancelTaskSelection" : "kanban:selectTasks")}
    </Button>
  );
}

export function useBoardTaskActions(onOpen: () => void, active: boolean, toggle: () => void) {
  const snapshots = useAppStore((state) => state.kanbanMulti.snapshots);
  const [destination, setDestination] = useState<BoardTaskDestination | null>(null);
  const backlogByStep = useMemo(() => {
    const result = new Map<string, BoardTaskDestination>();
    for (const [workflowId, snapshot] of Object.entries(snapshots)) {
      const first = sortWorkflowStepsByPosition(snapshot.steps)[0];
      if (first) result.set(first.id, { workflowId, stepId: first.id });
    }
    return result;
  }, [snapshots]);

  const createInBacklog = useCallback(
    (target: BoardTaskDestination) => {
      setDestination(target);
      onOpen();
    },
    [onOpen],
  );
  const actions = useMemo(
    () => ({
      destinations: backlogByStep,
      onCreate: createInBacklog,
      selection: { active, toggle },
    }),
    [backlogByStep, createInBacklog, active, toggle],
  );
  const clearDestination = useCallback(() => setDestination(null), []);
  return {
    destination,
    steps: destination ? snapshots[destination.workflowId]?.steps : undefined,
    actions,
    clearDestination,
  };
}
