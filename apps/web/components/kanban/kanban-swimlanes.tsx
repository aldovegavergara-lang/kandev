import type { ComponentProps } from "react";
import { SwimlaneContainer } from "./swimlane-container";
import { DelegateBoard } from "./delegate-board";
import { PullToRefresh } from "../mobile/pull-to-refresh";

type KanbanSwimlanesProps = ComponentProps<typeof SwimlaneContainer> & {
  isMobile: boolean;
  workspace: string | null;
  onRefresh: () => Promise<void>;
};

export function KanbanSwimlanes({
  workspace,
  isMobile,
  onRefresh,
  ...props
}: KanbanSwimlanesProps) {
  const swimlanes = <SwimlaneContainer {...props} />;
  return (
    <DelegateBoard key={workspace} workspace={workspace}>
      {isMobile ? <PullToRefresh onRefresh={onRefresh}>{swimlanes}</PullToRefresh> : swimlanes}
    </DelegateBoard>
  );
}
