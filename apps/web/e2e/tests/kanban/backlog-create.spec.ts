import { test, expect } from "../../fixtures/test-base";
import { useRegularMode } from "../../helpers/regular-mode";

useRegularMode();

test("creates in Backlog from its column instead of the workflow start step", async ({
  testPage,
  seedData,
}) => {
  const backlog = seedData.steps.find((step) => step.name === "Backlog");
  expect(backlog).toBeDefined();
  expect(backlog?.id).not.toBe(seedData.startStepId);
  await testPage.goto("/");
  const action = testPage.getByTestId("kanban-backlog-create");
  await expect(action).toHaveCount(1);
  await action.click();

  const dialog = testPage.getByRole("dialog");
  await expect(dialog.getByTestId("task-create-target-column")).toHaveText("Backlog");
  await dialog.getByTestId("source-mode-scratch").click();
  const prompt = dialog.getByTestId("task-description-input");
  await prompt.fill("Verify that the new task stays in Backlog.");
  const [input] = await dialog.getByTestId("task-title-input").all();
  if (input && (await input.isEnabled())) await input.fill("Create from the Backlog column");
  await dialog.getByTestId("submit-start-agent-chevron").click();

  const createdResponse = testPage.waitForResponse((response) => {
    return response.url().endsWith("/api/v1/tasks") && response.request().method() === "POST";
  });
  await testPage.getByTestId("submit-create-without-agent").click();

  const response = await createdResponse;
  expect(response.ok()).toBe(true);
  expect(response.request().postDataJSON()).toMatchObject({
    workflow_id: seedData.workflowId,
    workflow_step_id: backlog?.id,
  });
  const created = await response.json();
  await expect(
    testPage.getByTestId(`kanban-column-${backlog?.id}`).getByTestId(`task-card-${created.id}`),
  ).toBeVisible();
});
