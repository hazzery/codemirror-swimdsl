import { syntaxTree } from '@codemirror/language';
import { Diagnostic, linter } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { SyntaxNodeRef, TreeCursor } from '@lezer/common';

function undefinedPaceNameMessage(pace_name: string): string {
  return `'${pace_name}' is not a defined pace name.
If you wish to be able to use '${pace_name}' in the place of a pace percentage, please define it with the following line:
Pace ${pace_name} = _%`;
}

function lintUndefinedPaceName(
  node: SyntaxNodeRef,
  declaredIdentifiers: Set<string>,
  state: EditorState,
  diagnostics: Diagnostic[],
) {
  if (node.name !== "Identifier") return;

  let parent = node.node.parent;
  if (parent === null) return;

  // Ask the document for the characters that make up the Identifier node
  let node_value = state.sliceDoc(node.from, node.to);

  if (parent.name === "PaceDefinition") {
    declaredIdentifiers.add(node_value);
  } else if (parent.name === "PaceAlias" && !declaredIdentifiers.has(node_value)) {
    diagnostics.push({
      from: node.from,
      to: node.to,
      severity: "error",
      message: undefinedPaceNameMessage(node_value),
      actions: [{
        name: "Define pace name",
        apply(view: EditorView, _from: number, _to: number) {
          view.dispatch(
            { changes: { from: 0, to: 0, insert: `Pace ${node_value} = _%\n` } },
          );
        }
      }]
    });
  }
}

function lintSyntaxErrors(node: SyntaxNodeRef, diagnostics: Diagnostic[]) {
  if (node.name !== "⚠") return;

  diagnostics.push({
    from: node.from,
    to: node.to,
    severity: "error",
    message: "Syntax error"
  });
}

function swimdslLintSource(view: EditorView): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  const declaredIdentifiers = new Set<string>();

  let state = view.state;
  let treeCursor: TreeCursor = syntaxTree(state).cursor();

  while (treeCursor.next()) {
    lintUndefinedPaceName(treeCursor, declaredIdentifiers, state, diagnostics);
    lintSyntaxErrors(treeCursor, diagnostics);
  }

  return diagnostics;
}

export default linter(swimdslLintSource);
