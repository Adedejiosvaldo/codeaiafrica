import { useCallback, useEffect, useRef, useState } from "react";

export type RunResult = {
  output: string;
  error: { line: number | null; message: string; tip: string } | null;
  passed: boolean | null;
  hint: string;
};
export type EngineStatus = "loading" | "ready" | "running" | "error";

/**
 * One Python session in a Web Worker. Stopping a run terminates the worker and starts a fresh one,
 * then replays `restore` (the learner's passed steps) so earlier variables and functions exist again.
 */
export function usePython(restore: () => string[], apiBase?: string) {
  const worker = useRef<Worker | null>(null);
  const pending = useRef(new Map<number, (v: { ok: boolean; result?: RunResult; error?: string }) => void>());
  const nextId = useRef(1);
  const [status, setStatus] = useState<EngineStatus>("loading");
  const [detail, setDetail] = useState("Downloading Python");
  const restoreRef = useRef(restore);
  restoreRef.current = restore;

  const call = useCallback((msg: Record<string, unknown>) => new Promise<{ ok: boolean; result?: RunResult; error?: string }>((resolve) => {
    const id = nextId.current++;
    pending.current.set(id, resolve);
    worker.current?.postMessage({ ...msg, id });
  }), []);

  const start = useCallback(async () => {
    worker.current?.terminate();
    pending.current.forEach((resolve) => resolve({ ok: false, error: "stopped" }));
    pending.current.clear();
    setStatus("loading");
    setDetail("Downloading Python");
    const w = new Worker(new URL("./python.worker.ts", import.meta.url), { type: "module" });
    worker.current = w;
    w.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === "detail") { setDetail(msg.detail); return; }
      pending.current.get(msg.id)?.(msg);
      pending.current.delete(msg.id);
    };
    w.onerror = () => { setStatus("error"); setDetail("Python couldn't start. Check your connection and reload."); };
    const init = await call({ type: "init", apiBase });
    if (!init.ok) { setStatus("error"); setDetail("Python couldn't start. Check your connection and reload."); return; }
    const codes = restoreRef.current();
    if (codes.length) {
      setStatus("loading");
      setDetail("Restoring your earlier steps");
      for (const code of codes) await call({ type: "run", code, quiet: true });
    }
    setStatus("ready");
  }, [call, apiBase]);

  useEffect(() => {
    start();
    return () => worker.current?.terminate();
  }, [start]);

  const run = useCallback(async (code: string, check?: string) => {
    setStatus("running");
    const r = await call({ type: "run", code, check: check ?? null });
    setStatus((s) => (s === "running" ? "ready" : s));
    return r.ok ? r.result! : null;
  }, [call]);

  return { status, detail, run, restart: start };
}
