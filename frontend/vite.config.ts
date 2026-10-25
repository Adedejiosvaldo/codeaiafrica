import { createReadStream, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Pyodide's core files are served from our own site at /pyodide/ (faster first load, no third-party
// dependency for the interpreter itself). Extra packages such as pandas still come from the Pyodide CDN.
const PYODIDE_FILES = ["pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"];
const pyodideDir = dirname(createRequire(import.meta.url).resolve("pyodide/package.json"));

function pyodideCore(): Plugin {
  return {
    name: "pyodide-core",
    configureServer(server) {
      server.middlewares.use("/pyodide", (req, res, next) => {
        const name = (req.url ?? "").split("?")[0].replace(/^\//, "");
        if (!PYODIDE_FILES.includes(name)) return next();
        if (name.endsWith(".wasm")) res.setHeader("Content-Type", "application/wasm");
        if (name.endsWith(".mjs")) res.setHeader("Content-Type", "text/javascript");
        createReadStream(join(pyodideDir, name)).pipe(res);
      });
    },
    writeBundle(options) {
      const out = join(options.dir ?? resolve("dist"), "pyodide");
      if (!existsSync(out)) mkdirSync(out, { recursive: true });
      for (const f of PYODIDE_FILES) copyFileSync(join(pyodideDir, f), join(out, f));
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), pyodideCore()],
  worker: { format: "es" },
  optimizeDeps: { exclude: ["pyodide"] },
  server: {
    port: 5173,
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
});
