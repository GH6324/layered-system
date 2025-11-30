import { invoke } from "@tauri-apps/api/core";
import { useCallback, useState } from "react";

type RunnerDeps = {
  setStatus: (s: "idle" | "initialized" | "error") => void;
  setMessage: (m: string) => void;
  t: (key: string, options?: any) => string;
};

export function useCommandRunner({ setStatus, setMessage, t }: RunnerDeps) {
  const [busy, setBusy] = useState<string | null>(null);

  const run = useCallback(
    async <T>(cmd: string, args?: Record<string, unknown>) => {
      setBusy(cmd);
      try {
        return await invoke<T>(cmd, args);
      } catch (err) {
        setStatus("error");
        setMessage(t("status-error", { msg: String(err) }));
        throw err;
      } finally {
        setBusy((prev) => (prev === cmd ? null : prev));
      }
    },
    [setStatus, setMessage, t],
  );

  const isBusy = useCallback(
    (cmd?: string) => {
      if (!cmd) return busy !== null;
      return busy === cmd;
    },
    [busy],
  );

  return { run, isBusy, busy };
}
