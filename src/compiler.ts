import { ViewPlugin, ViewUpdate, EditorView } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";

import buildAst from "./buildAst";
import emitXml from "./swimlGen";

/**
 * A plugin that runs `buildAst` → `emitXml` on every document change
 * passing the generated XML string to a supplied callback.
 *
 * @param onResult - A function which should be called with the generated
 *    swimlXML string each time the compilation process is run.
 *
 * @returns A CodeMirror plugin object.
 */
export default function compilePlugin(onResult: (xml: string) => void): ViewPlugin<{
  new (view: EditorView): void;
}> {
  return ViewPlugin.fromClass(
    class {
      constructor(public view: EditorView) {
        this.run(this.view);
      }

      update(u: ViewUpdate): void {
        if (u.docChanged) {
          this.run(u.view);
        }
      }

      run(view: EditorView): void {
        const treeCursor = syntaxTree(view.state).cursor();
        const ast = buildAst(treeCursor, view.state);
        const xml = emitXml(ast);

        onResult(xml);
      }
    },
  );
}
