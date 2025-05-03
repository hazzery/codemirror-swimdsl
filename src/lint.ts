import { syntaxTree } from '@codemirror/language';
import { linter, Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';

function swimdslLintSource(view: EditorView): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  const declaredIdentifiers = new Set<string>();

  let state = view.state;
  syntaxTree(state).cursor().iterate(node => {
    if (node.name !== "Identifier") return;

    let parent = node.node.parent;
    if (parent === null) return;

    let node_value = state.sliceDoc(node.from, node.to);
    if (parent.name === "PaceDefinition") {
      declaredIdentifiers.add(node_value);
    } else if (parent.name === "PaceAlias" && !declaredIdentifiers.has(node_value)) {
      diagnostics.push({
        from: node.from,
        to: node.to,
        severity: "error",
        message: `This pace name has not been defined. If you wish to be able to use this name in the place of a pace specifier please define it with the following line: Pace ${node_value} = _%`,
        actions: [{
          name: "Define pace name",
          apply(view, _from, _to) {
            view.dispatch({ changes: { from: 0, to: 0, insert: `Pace ${node_value} = _%\n` } });
          }
        }]
      });
    }
  });

  return diagnostics;
}

export default linter(swimdslLintSource);

