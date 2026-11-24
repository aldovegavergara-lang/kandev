import { test, expect } from "../../fixtures/test-base";
import { KanbanPage } from "../../pages/kanban-page";
import { useRegularMode } from "../../helpers/regular-mode";

useRegularMode();

test("shows live tool activity on its card with the session chat closed", async ({
  testPage,
  apiClient,
  seedData,
}, testInfo) => {
  const board = new KanbanPage(testPage);
  await board.goto(seedData.workflowId);
  const task = await apiClient.createTaskWithAgent(
    seedData.workspaceId,
    "Review the board",
    seedData.agentProfileId,
    {
      workflow_id: seedData.workflowId,
      workflow_step_id: seedData.startStepId,
      repository_ids: [seedData.repositoryId],
      description: [
        "e2e:delay(1700)",
        'e2e:message("Checking the board")',
        'e2e:tool_use("Read", {"file_path":"README.md"})',
        "e2e:delay(4000)",
        'e2e:tool_result("Read complete")',
        "e2e:delay(4000)",
        'e2e:message("Finished")',
      ].join("\n"),
    },
  );
  const card = board.taskCard(task.id);
  const activity = card.getByTestId("kanban-card-activity");
  await expect(activity).toContainText(/Using a tool|Reading a file/, { timeout: 60_000 });
  await expect(activity.locator(".kanban-meter i")).toHaveCount(7);
  await testPage.screenshot({ path: testInfo.outputPath("live-board.png") });
  await expect(activity).toContainText("Tool finished");
  await expect(activity.locator(".kanban-meter")).toHaveCount(0, { timeout: 30_000 });
});
