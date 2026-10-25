import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { keymap } from "@codemirror/view";
import { EditorState, Prec } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";

const theme = EditorView.theme({
  "&": { height: "100%", fontSize: "14.5px", backgroundColor: "#ffffff" },
  ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", lineHeight: "1.65" },
  ".cm-content": { padding: "14px 0" },
  ".cm-gutters": { backgroundColor: "#faf8f3", color: "#9aa39d", border: "none", paddingRight: "4px" },
  ".cm-activeLineGutter": { backgroundColor: "#eef7f1", color: "#0b5d3b" },
  ".cm-activeLine": { backgroundColor: "#f6fbf8" },
  "&.cm-focused": { outline: "none" },
  ".cm-cursor": { borderLeftColor: "#0b5d3b", borderLeftWidth: "2px" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": { backgroundColor: "#d6ede0 !important" },
});

/** A Python editor. `docKey` switches documents (one per step); Ctrl/Cmd+Enter runs, Shift+Enter checks. */
export function CodeEditor({ value, docKey, onChange, onRun, onCheck, ariaLabel }:
  { value: string; docKey: string; onChange: (v: string) => void; onRun: () => void; onCheck: () => void; ariaLabel: string }) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const handlers = useRef({ onChange, onRun, onCheck });
  handlers.current = { onChange, onRun, onCheck };

  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup, python(), theme, keymap.of([indentWithTab]),
          Prec.highest(keymap.of([
            { key: "Mod-Enter", run: () => { handlers.current.onRun(); return true; } },
            { key: "Shift-Enter", run: () => { handlers.current.onCheck(); return true; } },
          ])),
          EditorView.updateListener.of((u) => { if (u.docChanged) handlers.current.onChange(u.state.doc.toString()); }),
          EditorView.contentAttributes.of({ "aria-label": ariaLabel, autocapitalize: "off", autocorrect: "off", spellcheck: "false" }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Swap the document when the step changes, or when the code is replaced (reset / solution)
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [docKey, value]);

  return <div ref={host} className="h-full min-h-0 overflow-hidden [&_.cm-editor]:h-full" />;
}
