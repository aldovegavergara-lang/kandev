"use client";

import { useMemo, useState } from "react";
import { Button } from "@kandev/ui/button";
import { Checkbox } from "@kandev/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kandev/ui/dropdown-menu";
import { IconColumns3 } from "@tabler/icons-react";
import { cn } from "@kandev/ui/lib/utils";
import { useTranslation } from "react-i18next";
import { sortWorkflowStepsByPosition } from "@/lib/kanban/workflow-step-order";

export type ColumnsMenuStep = { id: string; title: string; position: number };

export type ColumnsMenuProps = {
  workflowId: string;
  workflowName: string;
  /** That workflow's snapshot steps. Never another workflow's. */
  steps: ColumnsMenuStep[];
  /** Persisted hidden ids for this workflow; ids with no live step are inert. */
  hiddenStepIds: string[];
  onToggle: (workflowId: string, stepId: string) => void;
  autoHideEmpty: boolean;
  onToggleAutoHide: (workflowId: string) => void;
  /**
   * Phone rows must clear 44 CSS px. Content is identical either way — this
   * only relaxes menu density for touch.
   */
  touchTargets?: boolean;
};

/**
 * Column visibility for a single workflow, rendered next to the board it
 * configures — the swimlane header on desktop/tablet, the phone drawer's
 * focused-workflow block on mobile.
 *
 * One workflow per menu is the whole design: there is no grouping, no
 * disclosure state and no eligibility rule to model, because a lane already
 * answers "which workflow is this?".
 */
export function ColumnsMenu({
  workflowId,
  workflowName,
  steps,
  hiddenStepIds,
  onToggle,
  autoHideEmpty,
  onToggleAutoHide,
  touchTargets = false,
}: ColumnsMenuProps) {
  const { t } = useTranslation();
  const orderedSteps = useMemo(() => sortWorkflowStepsByPosition(steps), [steps]);
  const hiddenSet = useMemo(() => new Set(hiddenStepIds), [hiddenStepIds]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "subtle-action cursor-pointer text-muted-foreground hover:text-foreground",
            touchTargets ? "h-11 w-11" : "h-6 w-6",
          )}
          data-testid={`columns-menu-${workflowId}`}
          aria-label={t("kanban:columnsForWorkflow", { name: workflowName })}
        >
          <IconColumns3 className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t("kanban:displayOptions")}</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          data-testid={`columns-menu-auto-hide-empty-${workflowId}`}
          className={touchTargets ? "min-h-11" : undefined}
          checked={autoHideEmpty}
          onCheckedChange={() => onToggleAutoHide(workflowId)}
          onSelect={(event) => event.preventDefault()}
        >
          <span className="min-w-0 flex-1 whitespace-normal">
            {t("kanban:autoHideEmptyColumns")}
          </span>
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t("kanban:columns")}</DropdownMenuLabel>
        {orderedSteps.map((step) => (
          <DropdownMenuCheckboxItem
            key={step.id}
            data-testid={`columns-menu-step-${step.id}`}
            className={touchTargets ? "min-h-11" : undefined}
            checked={!hiddenSet.has(step.id)}
            onCheckedChange={() => onToggle(workflowId, step.id)}
            onSelect={(event) => event.preventDefault()}
          >
            <span className="min-w-0 flex-1 truncate" title={step.title}>
              {step.title}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function EmbeddedColumnsSettings(props: ColumnsMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const orderedSteps = useMemo(() => sortWorkflowStepsByPosition(props.steps), [props.steps]);
  const hidden = useMemo(() => new Set(props.hiddenStepIds), [props.hiddenStepIds]);
  return (
    <div className="min-w-0">
      <Button
        variant="ghost"
        type="button"
        size="sm"
        aria-expanded={open}
        aria-controls={`board-column-settings-${props.workflowId}`}
        data-state={open ? "open" : "closed"}
        data-testid={`columns-menu-${props.workflowId}`}
        onClick={() => setOpen((previous) => !previous)}
      >
        <IconColumns3 className="size-3.5" />
        {t("kanban:columns")}
      </Button>
      <div
        id={`board-column-settings-${props.workflowId}`}
        hidden={!open}
        className="space-y-1 px-2 py-1"
      >
        <label className="flex cursor-pointer items-center gap-2 py-1 text-xs">
          <Checkbox
            checked={props.autoHideEmpty}
            onCheckedChange={() => props.onToggleAutoHide(props.workflowId)}
            data-testid={`columns-menu-auto-hide-empty-${props.workflowId}`}
          />
          {t("kanban:autoHideEmptyColumns")}
        </label>
        {orderedSteps.map((step) => (
          <label key={step.id} className="flex cursor-pointer items-center gap-2 py-1 text-xs">
            <Checkbox
              checked={!hidden.has(step.id)}
              onCheckedChange={() => props.onToggle(props.workflowId, step.id)}
              data-testid={`columns-menu-step-${step.id}`}
            />
            {step.title}
          </label>
        ))}
      </div>
    </div>
  );
}
