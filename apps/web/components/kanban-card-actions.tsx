"use client";

import { useRef, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconArrowsMaximize, IconDots } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@kandev/ui/dropdown-menu";
import { KanbanCardDropdownMenuItems } from "@/components/kanban-card-menu-items";
import type { KanbanCardActionProps } from "@/components/kanban-card-content";
import {
  renderSubagentCountChip,
  renderTaskStatusIcon,
} from "@/components/kanban-card-status-icon";
import { useAppStoreApi } from "@/components/state-provider";
import { useTaskPendingInput } from "@/hooks/use-task-pending-input";
import { createDebugLogger, isDebug } from "@/lib/debug/log";
import { shouldShowTaskRunningSpinner } from "@/lib/ui/state-icons";
import type { Task } from "@/components/kanban-card";

import { DelegateCardContext } from "./kanban/delegate-board";

const kanbanStatusDebug = createDebugLogger("kanban:task-status");

function OpenFullPageButton({
  task,
  onOpenFullPage,
}: {
  task: Task;
  onOpenFullPage: (task: Task) => void;
}) {
  const { t } = useTranslation("common");

  return (
    <button
      type="button"
      className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm p-1 -m-1 transition-colors cursor-pointer"
      onClick={(event) => {
        event.stopPropagation();
        onOpenFullPage(task);
      }}
      onPointerDown={(event) => event.stopPropagation()}
      aria-label={t("common:openFullPage")}
      title={t("common:openFullPage")}
    >
      <IconArrowsMaximize className="h-4 w-4" />
    </button>
  );
}

type KanbanCardMenuProps = KanbanCardActionProps & {
  effectiveMenuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
};

function KanbanCardMenu(props: KanbanCardMenuProps) {
  const { t } = useTranslation();
  const {
    effectiveMenuOpen,
    setMenuOpen,
    isDeleting,
    isArchiving,
    menuTriggerRef,
    onPRMenuOpenChange,
  } = props;
  const { menuEntries } = props;
  const delegate = useContext(DelegateCardContext);
  const isProcessing = isDeleting || isArchiving;
  const touchTrigger = useRef(false);

  return (
    <DropdownMenu
      open={effectiveMenuOpen}
      onOpenChange={(open) => {
        if (!open && isProcessing) return;
        setMenuOpen(open);
        onPRMenuOpenChange?.(open);
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          ref={menuTriggerRef}
          type="button"
          className="subtle-action text-muted-foreground hover:text-foreground hover:bg-muted inline-flex h-11 min-h-11 w-11 min-w-11 items-center justify-center rounded-sm p-0 transition-colors cursor-pointer sm:h-auto sm:min-h-0 sm:w-auto sm:min-w-0 sm:p-1 sm:-m-1"
          onClick={(e) => {
            e.stopPropagation();
            if (touchTrigger.current) {
              touchTrigger.current = false;
              setMenuOpen(!effectiveMenuOpen);
              onPRMenuOpenChange?.(!effectiveMenuOpen);
            }
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            touchTrigger.current = e.pointerType === "touch";
            if (touchTrigger.current) e.preventDefault();
          }}
          aria-label={t("kanban:moreOptions")}
        >
          <IconDots className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {delegate && (
          <DropdownMenuItem
            onClick={(e) => e.stopPropagation()}
            onSelect={() => delegate(props.task)}
          >
            {t("agents:delegateAction")}
          </DropdownMenuItem>
        )}
        <KanbanCardDropdownMenuItems entries={menuEntries} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function KanbanCardActions({
  task,
  showMaximizeButton,
  onOpenFullPage,
  menuEntries,
  isDeleting,
  isArchiving,
  menuTriggerRef,
  onPRMenuOpenChange,
}: KanbanCardActionProps) {
  const { t } = useTranslation("common");
  const [menuOpen, setMenuOpen] = useState(false);
  const [storePrimarySessionState, setStorePrimarySessionState] = useState<string | null>(null);
  const storeApi = useAppStoreApi();
  const debugEnabled = isDebug();
  const effectiveMenuOpen = menuOpen;
  const pendingInput = useTaskPendingInput(task.primarySessionId, {
    taskId: task.id,
    taskPendingAction: task.taskPendingAction,
    statusSummary: task.statusSummary,
    primarySessionState: task.primarySessionState,
    primarySessionPendingAction: task.primarySessionPendingAction,
  });
  const showRunningSpinner = shouldShowTaskRunningSpinner(task.state, task.primarySessionState);
  const storeWouldShowRunningSpinner =
    storePrimarySessionState === null
      ? null
      : shouldShowTaskRunningSpinner(task.state, storePrimarySessionState);
  const hasSpinnerMismatch =
    showRunningSpinner &&
    storeWouldShowRunningSpinner === false &&
    task.primarySessionState !== storePrimarySessionState;
  const statusIcon = renderTaskStatusIcon(
    task,
    showRunningSpinner,
    pendingInput.clarification,
    pendingInput.permission,
  );
  const hasKnownSession =
    Boolean(task.primarySessionId) || Boolean(task.sessionCount && task.sessionCount > 0);

  useEffect(() => {
    if (!debugEnabled || !task.primarySessionId) {
      setStorePrimarySessionState(null);
      return;
    }

    const primarySessionId = task.primarySessionId;
    const readPrimarySessionState = () =>
      storeApi.getState().taskSessions.items[primarySessionId]?.state ?? null;
    const syncPrimarySessionState = () => {
      const nextState = readPrimarySessionState();
      setStorePrimarySessionState((current) => (current === nextState ? current : nextState));
    };

    syncPrimarySessionState();
    return storeApi.subscribe(syncPrimarySessionState);
  }, [debugEnabled, storeApi, task.primarySessionId]);

  useEffect(() => {
    if (!hasSpinnerMismatch || !debugEnabled) return;
    kanbanStatusDebug("spinner mismatch", {
      task_id: task.id,
      taskState: task.state ?? "-",
      primarySessionId: task.primarySessionId ?? "-",
      taskPrimarySessionState: task.primarySessionState ?? "-",
      storePrimarySessionState: storePrimarySessionState ?? "-",
      showSpinner: showRunningSpinner,
    });
  }, [
    debugEnabled,
    hasSpinnerMismatch,
    showRunningSpinner,
    storePrimarySessionState,
    task.id,
    task.primarySessionId,
    task.primarySessionState,
    task.state,
  ]);

  return (
    <div className="flex items-center gap-2">
      {renderSubagentCountChip(
        task,
        t("common:activeSubagents", { count: task.activeSubagentCount ?? 0 }),
      )}
      {statusIcon}
      {showMaximizeButton && onOpenFullPage && hasKnownSession && (
        <OpenFullPageButton task={task} onOpenFullPage={onOpenFullPage} />
      )}
      <KanbanCardMenu
        task={task}
        effectiveMenuOpen={effectiveMenuOpen}
        setMenuOpen={setMenuOpen}
        isDeleting={isDeleting}
        isArchiving={isArchiving}
        menuEntries={menuEntries}
        menuTriggerRef={menuTriggerRef}
        onPRMenuOpenChange={onPRMenuOpenChange}
      />
    </div>
  );
}
