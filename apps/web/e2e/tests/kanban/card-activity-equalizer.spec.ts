import { test, expect } from "../../fixtures/test-base";
import { KanbanPage } from "../../pages/kanban-page";
import { useRegularMode } from "../../helpers/regular-mode";

useRegularMode();

for (const es of [false, true]) {
  test(`shows live tool activity with the chat closed (${es ? "es" : "en"})`, async ({
    testPage,
    apiClient,
    seedData,
    backend,
  }, testInfo) => {
    if (es)
      await testPage
        .context()
        .addCookies([{ name: "kandev_locale", value: "es", url: backend.frontendUrl }]);
    const board = new KanbanPage(testPage);
    await board.goto(seedData.workflowId);
    const consolePanel = testPage.getByRole("region", {
      name: es ? "Consola de sonido" : "Sound console",
    });
    await expect(consolePanel).toContainText(es ? "En reposo" : "Standby");
    await expect(consolePanel.getByRole("heading")).toHaveCount(0);
    const channels = consolePanel.getByRole("group", {
      name: es ? "Carga por columna" : "Channel load",
    });
    await channels.getByRole("button", { name: /Review/ }).click();
    await expect(testPage.locator('[data-console-column][aria-label="Review"]')).toBeFocused();
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
    await expect(activity).toContainText(
      es ? /Usando una herramienta|Leyendo un archivo/ : /Using a tool|Reading a file/,
      { timeout: 60_000 },
    );
    await expect(activity.locator(".kanban-meter i")).toHaveCount(7);
    await expect(consolePanel.getByRole("button", { name: "Review the board" })).toBeVisible();
    await expect(consolePanel).toContainText(
      es ? /Usando una herramienta|Leyendo un archivo/ : /Using a tool|Reading a file/,
    );
    await expect(consolePanel).toHaveAttribute("data-console-live", "true");
    await expect(consolePanel.locator(".console-spectrum i")).toHaveCount(34);
    await testPage.screenshot({
      path: testInfo.outputPath(es ? "live-board-es.png" : "live-board-en.png"),
    });
    await expect(activity).toContainText(es ? "Herramienta finalizada" : "Tool finished");
    await expect(activity.locator(".kanban-meter")).toHaveCount(0, { timeout: 30_000 });
    await expect(consolePanel).toContainText(es ? "En reposo" : "Standby");
    await expect(consolePanel.getByRole("heading")).toHaveCount(0);
    await expect(consolePanel).toHaveAttribute("data-console-live", "false");
  });
}
