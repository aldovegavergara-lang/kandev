import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { Task } from "../kanban-card-types";
import { SoundConsole } from "./sound-console";

const steps = [
  { id: "build", title: "Build", color: "" },
  { id: "review", title: "Review", color: "" },
];
const task: Task = {
  id: "one",
  title: "First task",
  workflowStepId: "review",
  state: "IN_PROGRESS",
};

it("shows visible occupancy, distinguishes queued cards, and opens even an empty channel", () => {
  const onSelect = vi.fn();
  render(
    <SoundConsole
      steps={steps}
      tasks={[
        task,
        { ...task, id: "two", queuedForStepId: "review", wipAdmitted: false },
        { ...task, id: "hidden", workflowStepId: "hidden" },
      ]}
      onOpenTask={vi.fn()}
      onSelectChannel={onSelect}
    />,
  );
  const load = within(screen.getByRole("group", { name: "Channel load" }));
  const review = load.getByRole("button", { name: /Review/ });
  expect(review.textContent).toContain("1 queued");
  expect(review.title).toBe("2 tasks");
  const build = load.getByRole("button", { name: /Build/ });
  expect(build.title).toBe("0 tasks");
  fireEvent.click(build);
  expect(onSelect).toHaveBeenCalledWith(0);
});
