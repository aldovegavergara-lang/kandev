"use client";

import { useContext, type HTMLAttributes, type ReactNode } from "react";
import { Button } from "@kandev/ui/button";
import { IconChevronDown, IconGripVertical } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { KanbanDisplayDropdown } from "@/components/kanban-display-dropdown";
import { BoardActionsContext, BoardSelectionButton } from "./board-actions";
import { usePluginTaskFilters } from "@/hooks/use-plugin-task-filters";

export function BoardWorkflowControls({
  name,
  count,
  triggerTestId,
  columns,
  onCollapse,
  dragHandleProps,
}: {
  name: string;
  count: number;
  triggerTestId?: string;
  columns: ReactNode;
  onCollapse: () => void;
  dragHandleProps?: HTMLAttributes<HTMLDivElement>;
}) {
  const { t } = useTranslation();
  const filters = usePluginTaskFilters();
  const selection = useContext(BoardActionsContext)?.selection;

  return (
    <div
      className="flex min-w-0 items-center gap-1"
      data-testid="swimlane-header"
      data-multi-select-active={selection?.active || undefined}
    >
      {dragHandleProps && (
        <div className="shrink-0 cursor-grab active:cursor-grabbing" {...dragHandleProps}>
          <IconGripVertical className="size-3.5 text-muted-foreground" />
        </div>
      )}
      <KanbanDisplayDropdown
        triggerSize="sm"
        triggerTestId={triggerTestId}
        triggerContent={
          <>
            <span className="truncate font-semibold">{name}</span>
            <span className="text-muted-foreground">
              {t("kanban:consoleTrackCount", { count })}
            </span>
            <IconChevronDown className="size-3.5 text-muted-foreground" />
          </>
        }
        pluginFilters={filters.filters}
        pluginFilterSelections={filters.selections}
        onPluginFilterChange={filters.setFilterSelection}
        extraActions={(close) => (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Button type="button" variant="ghost" onClick={onCollapse}>
                {t("sidebar:collapseGroup", { label: name })}
              </Button>
            </div>
            {columns}
            <BoardSelectionButton onDone={close} />
          </div>
        )}
      />
    </div>
  );
}
