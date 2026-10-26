/// <reference lib="webworker" />
// Runs Python (Pyodide) off the main thread, so a slow or endless loop never freezes the page.
import { loadPyodide, type PyodideInterface } from "pyodide";
import { AKADA_MODULE } from "./akada";

const INDEX_URL = (import.meta.env.VITE_PYODIDE_URL as string | undefined) ?? "/pyodide/";
const PACKAGES_URL = (import.meta.env.VITE_PYODIDE_PACKAGES_URL as string | undefined)
  ?? "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";

// Runs the learner's code in a shared namespace, then (optionally) the step's check.
// Errors are rewritten into short, beginner-friendly messages.
const RUNNER = String.raw`
import io, json, contextlib, traceback

_akada_ns = {"__name__": "__main__"}

def _akada_explain(e, code):
    line = None
    if isinstance(e, SyntaxError):
        line = e.lineno
    else:
        for frame in traceback.extract_tb(e.__traceback__):
            if frame.filename == "<your code>":
                line = frame.lineno
    name = type(e).__name__
    tips = {
        "SyntaxError": "Python couldn't read this line. Check for a missing bracket, quote or colon.",
        "IndentationError": "The spacing at the start of a line is off. Lines inside if, for and def need 4 spaces.",
        "NameError": "Python doesn't know that name yet. Check the spelling, or create it before you use it.",
        "TypeError": "A value is the wrong type here, for example text where a number is needed.",
        "ZeroDivisionError": "Something was divided by zero.",
        "IndexError": "You asked for a list position that doesn't exist.",
        "KeyError": "That key isn't in the dictionary.",
        "AttributeError": "That value doesn't have the method or property you used.",
        "ValueError": "The value has the right type but the wrong content.",
        "ModuleNotFoundError": "That library isn't available in this lab.",
        "AIError": "The AI call didn't work. The message says why and what to do.",
    }
    message = f"{name}: {e.msg if isinstance(e, SyntaxError) else e}"
    tip = tips.get(name) or tips.get(type(e).__mro__[1].__name__, "")
    return {"line": line, "message": message, "tip": tip}

def _akada_run(code, check):
    out = io.StringIO()
    result = {"error": None, "passed": None, "hint": ""}
    try:
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
            exec(compile(code, "<your code>", "exec"), _akada_ns)
    except BaseException as e:
        result["error"] = _akada_explain(e, code)
    result["output"] = out.getvalue()
    if check is not None:
        if result["error"]:
            result["passed"] = False
            result["hint"] = "Fix the error in your code first, then check again."
        else:
            scope = dict(_akada_ns)
            scope["__output__"], scope["__code__"] = result["output"], code
            try:
                with contextlib.redirect_stdout(io.StringIO()):
                    exec(check, scope)
                result["passed"] = True
            except AssertionError as e:
                result["passed"] = False
                result["hint"] = str(e).strip() or "Not quite yet. Read the task again."
            except NameError as e:
                result["passed"] = False
                result["hint"] = f"Python can't find {e.name!r} yet. Create it in your code, then run again."
            except Exception as e:
                result["passed"] = False
                result["hint"] = f"Something in your answer isn't right yet ({type(e).__name__}: {e})."
    return json.dumps(result)

def _akada_reset():
    _akada_ns.clear()
    _akada_ns["__name__"] = "__main__"
`;

let py: PyodideInterface | null = null;

type Request =
  | { id: number; type: "init"; apiBase?: string }
  | { id: number; type: "run"; code: string; check?: string | null; quiet?: boolean }
  | { id: number; type: "reset" };

const post = (msg: unknown) => (self as DedicatedWorkerGlobalScope).postMessage(msg);

async function init(apiBase?: string) {
  post({ type: "detail", detail: "Downloading Python" });
  py = await loadPyodide({ indexURL: INDEX_URL, packageBaseUrl: PACKAGES_URL });
  post({ type: "detail", detail: "Starting Python" });
  py.runPython(RUNNER);
  // The akada helper module (AI calls, embeddings, chunking through our server)
  py.FS.writeFile("/home/pyodide/akada.py", AKADA_MODULE);
  py.runPython(`import sys; sys.path.insert(0, "/home/pyodide")\nimport akada\nakada._BASE = ${JSON.stringify(apiBase ?? "")}`);
}

self.onmessage = async (event: MessageEvent<Request>) => {
  const req = event.data;
  try {
    if (req.type === "init") {
      if (!py) await init(req.apiBase);
      post({ id: req.id, ok: true });
    } else if (req.type === "reset") {
      py!.runPython("_akada_reset()");
      post({ id: req.id, ok: true });
    } else if (req.type === "run") {
      try {
        await py!.loadPackagesFromImports(req.code + "\n" + (req.check ?? ""), {
          messageCallback: (m: string) => !req.quiet && post({ type: "detail", detail: m }),
        });
      } catch { /* a missing package shows up as an import error when the code runs */ }
      const run = py!.globals.get("_akada_run");
      const json = run(req.code, req.check ?? null) as string;
      run.destroy();
      post({ id: req.id, ok: true, result: JSON.parse(json) });
    }
  } catch (err) {
    post({ id: req.id, ok: false, error: String(err) });
  }
};
