import { createContext, lazy, Suspense, useState, type ReactNode } from "react";
import type { Task } from "../kanban-card-types";

const DelegateDialog = lazy(() => import("../task/delegate-dialog"));
export const DelegateCardContext = createContext<((task: Task) => void) | null>(null);

export function DelegateBoard({
  workspace,
  children,
}: {
  workspace: string | null;
  children: ReactNode;
}) {
  const [task, setTask] = useState<Task | null>(null);
  return (
    <DelegateCardContext.Provider value={setTask}>
      {children}
      {task && workspace && (
        <Suspense fallback={null}>
          <DelegateDialog task={task} workspace={workspace} close={() => setTask(null)} />
        </Suspense>
      )}
    </DelegateCardContext.Provider>
  );
}
