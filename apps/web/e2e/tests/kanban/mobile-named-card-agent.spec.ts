import { test, expect } from "../../fixtures/test-base";
import { assertNoDocumentHorizontalOverflow } from "../../helpers/layout-assertions";
import { MobileKanbanPage } from "../../pages/mobile-kanban-page";

test("delegates a card by touch", async ({ testPage, apiClient, seedData }) => {
  const harness = await apiClient.getAgentProfile(seedData.agentProfileId);
  const role = await apiClient.createAgentProfile(harness.agentId, "Mobile reviewer", {
    model: "mock-fast",
  });
  await apiClient.updateAgentProfile(role.id, {
    card_agent: {
      workspace_id: seedData.workspaceId,
      folder: ".",
      purpose: "Review from mobile",
      instructions: "Check the changes.",
    },
  });
  const task = await apiClient.createTask(seedData.workspaceId, "Mobile review", {
    workflow_id: seedData.workflowId,
    workflow_step_id: seedData.startStepId,
    repository_ids: [seedData.repositoryId],
  });
  const board = new MobileKanbanPage(testPage);
  await board.goto();
  const channels = testPage.getByRole("group", { name: "Channel load" });
  await channels.getByRole("button", { name: /Review/ }).tap();
  await expect(board.boardNavigator).toContainText("Review");
  await channels.getByRole("button", { name: /In Progress/ }).tap();
  await board.taskCard(task.id).getByRole("button", { name: "More options" }).tap();
  await testPage.getByRole("menuitem", { name: "Delegate to an agent" }).tap();
  const dialog = testPage.getByRole("dialog");
  await expect(dialog).toContainText("Review from mobile");
  await assertNoDocumentHorizontalOverflow(testPage);
  await dialog
    .getByLabel("Assignment", { exact: true })
    .fill('e2e:message("Mobile review complete")');
  await dialog.getByRole("button", { name: "Delegate to an agent" }).tap();
  await expect(dialog.getByRole("link", { name: "Open agent session" })).toBeVisible();
});
