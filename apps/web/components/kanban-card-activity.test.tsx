import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KanbanCardActivity } from "./kanban-card-activity";
import type { Task } from "./kanban-card-types";
import type { TaskStatusSummary } from "@/lib/types/task-status-summary";

const task: Task = { id: "card", title: "Review", workflowStepId: "running", state: "IN_PROGRESS" };
const at = new Date().toISOString();
function summary(change: Partial<TaskStatusSummary> = {}): TaskStatusSummary {
  return {
    revision: 1,
    updated_at: at,
    has_running_session: true,
    foreground_activity: "generating",
    agent_activity: { session_id: "s", at, kind: "reply" },
    ...change,
  };
}

describe("card activity meter", () => {
  it("replays on a new beat and preserves the bars across unrelated summary revisions", () => {
    const view = render(<KanbanCardActivity task={{ ...task, statusSummary: summary() }} />);
    const bars = view.container.querySelector(".kanban-meter");
    expect(screen.getByText("Writing a reply")).toBeTruthy();
    view.rerender(
      <KanbanCardActivity task={{ ...task, statusSummary: summary({ revision: 2 }) }} />,
    );
    expect(view.container.querySelector(".kanban-meter")).toBe(bars);
    view.rerender(
      <KanbanCardActivity
        task={{
          ...task,
          statusSummary: summary({
            agent_activity: {
              session_id: "s",
              at: new Date(Date.now() + 1).toISOString(),
              kind: "tool",
            },
          }),
        }}
      />,
    );
    expect(screen.getByText("Using a tool")).toBeTruthy();
    expect(view.container.querySelector(".kanban-meter")).not.toBe(bars);
  });
  it("gives pending approval and clarification priority over stale running evidence", () => {
    for (const [pending, text] of [
      ["permission", "Permission requested"],
      ["clarification", "Needs input"],
    ] as const) {
      const view = render(
        <KanbanCardActivity
          task={{ ...task, statusSummary: summary({ pending_action: pending }) }}
        />,
      );
      expect(screen.getByText(text)).toBeTruthy();
      expect(view.container.querySelector(".kanban-meter")).toBeNull();
      view.unmount();
    }
  });
  it("stays quiet in an idle In Progress column and shows a completed session", () => {
    const view = render(<KanbanCardActivity task={task} />);
    expect(view.container.firstChild).toBeNull();
    view.rerender(<KanbanCardActivity task={{ ...task, primarySessionState: "COMPLETED" }} />);
    expect(screen.getByText("Completed")).toBeTruthy();
    expect(view.container.querySelector(".kanban-meter")).toBeNull();
  });
  it("keeps a historical observation readable without replaying it on reload", () => {
    const view = render(
      <KanbanCardActivity
        task={{
          ...task,
          statusSummary: summary({
            agent_activity: {
              kind: "tool_done",
              session_id: "s",
              at: "2020-01-01T00:00:00Z",
            },
          }),
        }}
      />,
    );
    expect(screen.getByText("Tool finished")).toBeTruthy();
    expect(view.container.querySelector(".kanban-meter")?.getAttribute("data-pulse")).toBe("false");
  });
});
