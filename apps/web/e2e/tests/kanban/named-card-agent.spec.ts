import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "../../fixtures/test-base";
import { useRegularMode } from "../../helpers/regular-mode";
import { readMockACPTrace } from "../../helpers/transient-turn-runtime-continuity";
import { SessionPage } from "../../pages/session-page";
import { KanbanPage } from "../../pages/kanban-page";

useRegularMode();

test("saves a role and delegates into its folder without replacing the coordinator", async ({
  testPage,
  apiClient,
  seedData,
  backend,
}) => {
  const folder = "review";
  const dir = path.join(seedData.repositoryPath, folder);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "delegate-proof.txt"), "only in the delegated folder");
  const git = (...args: string[]) =>
    execFileSync("git", [
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.test",
      "-C",
      seedData.repositoryPath,
      ...args,
    ]);
  git("add", folder);
  git("commit", "-m", "Seed delegate working directory");
  git("push", "origin", "main");
  const parentProfile = await apiClient.getAgentProfile(seedData.agentProfileId);
  const tracePath = path.join(backend.tmpDir, "worker-acp.jsonl");
  const agent = await apiClient.createAgentProfile(parentProfile.agentId, "Revisor", {
    model: "mock-fast",
    config_options: { effort: "low" },
    env_vars: [{ key: "E2E_MOCK_AGENT_ACP_TRACE_FILE", value: tracePath }],
  });
  await testPage.goto(`/settings/agents/${parentProfile.agentId}/profiles/${agent.id}`);
  await testPage.getByRole("checkbox", { name: "Saved delegate" }).check();
  await testPage
    .getByLabel("Purpose", { exact: true })
    .fill("Review a change and report the evidence");
  await testPage.getByLabel("Folder in the card workspace", { exact: false }).fill(folder);
  const role = "Check the regression case before reporting.";
  await testPage.getByLabel("Instructions (Markdown)", { exact: true }).fill(role);
  await testPage
    .getByRole("button", { name: /^Save( changes)?$/i })
    .first()
    .click();
  await expect
    .poll(async () => (await apiClient.getAgentProfile(agent.id)).cardAgent?.instructions)
    .toBe(role);
  const task = await apiClient.createTaskWithAgent(
    seedData.workspaceId,
    "Review the patch",
    seedData.agentProfileId,
    {
      workflow_id: seedData.workflowId,
      workflow_step_id: seedData.startStepId,
      repository_ids: [seedData.repositoryId],
      description: 'e2e:message("Coordinator ready")',
    },
  );
  const board = new KanbanPage(testPage);
  await board.goto(seedData.workflowId);
  const card = board.taskCard(task.id);
  await card.getByRole("button", { name: "More options" }).click();
  await testPage.getByRole("menuitem", { name: "Delegate to an agent" }).click();
  const dialog = testPage.getByRole("dialog");
  await expect(dialog).toContainText("mock-fast");
  await dialog
    .getByLabel("Assignment", { exact: true })
    .fill('e2e:await_file("delegate-proof.txt")\ne2e:message("Verified the regression fixture")');
  await dialog.getByRole("button", { name: "Delegate to an agent" }).click();
  const result = dialog.getByRole("link", { name: "Open agent session" });
  await expect(result).toBeVisible();
  const href = await result.getAttribute("href");
  const id = new URL(href!, backend.frontendUrl).searchParams.get("sessionId");
  expect(id).toBeTruthy();
  expect(id).not.toBe(task.session_id);
  await testPage.keyboard.press("Escape");
  await expect(card).toContainText("Verified the regression fixture", { timeout: 25000 });
  const { sessions } = await apiClient.listTaskSessions(task.id);
  expect(sessions.find((s) => s.is_primary)?.id).toBe(task.session_id);
  const transcript = await apiClient.listSessionMessages(id!);
  const first = transcript.messages.find((m) => m.author_type === "user");
  expect((first?.raw_content ?? first?.content ?? "").split(role)).toHaveLength(2);
  const trace = readMockACPTrace(tracePath);
  const firstPrompt = trace.findIndex((record) => record.event === "prompt");
  expect(firstPrompt).toBeGreaterThan(0);
  const setup = trace.slice(0, firstPrompt);
  expect(
    setup.some(
      (r) => r.event === "set_config_option" && r.config_id === "effort" && r.value === "low",
    ),
  ).toBe(true);
  await testPage.goto(`/t/${task.id}?sessionId=${task.session_id}`);
  const chat = new SessionPage(testPage);
  await chat.waitForLoad();
  await chat.waitForChatIdle({ timeout: 30000 });
  const spawn = {
    agent_profile_id: agent.id,
    prompt: 'e2e:await_file("delegate-proof.txt")\ne2e:message("Coordinator delegation verified")',
  };
  await chat.sendMessage(
    'e2e:mcp:kandev:list_agents_kandev({"named_only":true})\n' +
      `e2e:mcp:kandev:spawn_session_kandev(${JSON.stringify(spawn)})`,
  );
  await expect
    .poll(
      async () => {
        const { messages } = await apiClient.listSessionMessages(task.session_id);
        const tools = messages.filter((m) => m.type?.startsWith("tool"));
        return JSON.stringify(tools);
      },
      { timeout: 25000 },
    )
    .toContain("Review a change and report the evidence");
  const coordinator = await apiClient.listSessionMessages(task.session_id);
  expect(JSON.stringify(coordinator.messages)).not.toContain(role);
  await board.goto(seedData.workflowId);
  await expect(card).toContainText("Coordinator delegation verified", { timeout: 30000 });
});
