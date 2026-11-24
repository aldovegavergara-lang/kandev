import { useTranslation } from "react-i18next";
import { Input } from "@kandev/ui/input";
import { Textarea } from "@kandev/ui/textarea";
import { useAppStore } from "@/components/state-provider";
import type { CardAgent } from "@/lib/types/agent-profile";

export function CardAgentFields({
  value,
  onChange,
}: {
  value?: CardAgent;
  onChange: (value?: CardAgent) => void;
}) {
  const { t } = useTranslation("agents");
  const workspaces = useAppStore((s) => s.workspaces.items);
  const active = useAppStore((s) => s.workspaces.activeId);
  return (
    <fieldset className="space-y-3 border-t pt-4 text-sm">
      <label className="flex items-center gap-2 font-medium">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) =>
            onChange(
              e.target.checked
                ? {
                    workspace_id: active ?? workspaces[0]?.id ?? "",
                    purpose: "",
                    folder: ".",
                    instructions: "",
                  }
                : undefined,
            )
          }
        />
        {t("delegateRole")}
      </label>
      {value && (
        <>
          <label className="grid gap-1">
            {t("common:workspace")}
            <select
              className="rounded border bg-background p-2"
              value={value.workspace_id}
              onChange={(e) => onChange({ ...value, workspace_id: e.target.value })}
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            {t("delegatePurpose")}
            <Input
              maxLength={160}
              value={value.purpose}
              onChange={(e) => onChange({ ...value, purpose: e.target.value })}
            />
          </label>
          <label className="grid gap-1">
            {t("delegateFolder")}
            <Input
              value={value.folder}
              onChange={(e) => onChange({ ...value, folder: e.target.value })}
            />
          </label>
          <label className="grid gap-1">
            {t("delegateInstructions")}
            <Textarea
              rows={5}
              value={value.instructions}
              onChange={(e) => onChange({ ...value, instructions: e.target.value })}
            />
          </label>
        </>
      )}
    </fieldset>
  );
}
