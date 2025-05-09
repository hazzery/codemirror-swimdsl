import { StateField, Transaction } from "@codemirror/state";
import { TreeCursor } from "@lezer/common";
import { EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

/**
 * This function walks the syntax tree once to compute the declared pace names.
 * You can extend this function if you have other definitions to collect.
 */
function computeDeclaredIdentifiers(editorState: EditorState): Set<string> {
  const declaredIdentifiers: Set<string> = new Set();
  const treeCursor: TreeCursor = syntaxTree(editorState).cursor();

  console.log("Declaring identifiers");

  do {
    if (treeCursor.name !== "PaceDefinition") continue;

    // Move into the node to find the Identifier child.
    if (!treeCursor.firstChild()) continue;

    const nodeValue = editorState.sliceDoc(treeCursor.from, treeCursor.to);
    declaredIdentifiers.add(nodeValue);

    treeCursor.parent();
  } while (treeCursor.next());

  return declaredIdentifiers;
}

/**
 * A StateField holding declared identifiers.
 */
// export const definedIdentifiersField: StateField<Set<string>> =
//   StateField.define({
//     create: computeDeclaredIdentifiers,
//     update(value: Set<string>, transaction: Transaction): Set<string> {
//       // Recompute only if the document has changed.
//       if (transaction.docChanged) {
//         return computeDeclaredIdentifiers(transaction.state);
//       }
//
//       return value;
//     },
//   });

export const definedIdentifiersField: StateField<Set<string>> =
  StateField.define({
    create(_state: EditorState): Set<string> {
      return new Set(["Test"]);
    },
    update(value: Set<string>, transaction: Transaction): Set<string> {
      // Recompute only if the document has changed.
      if (transaction.docChanged) {
        const newValue = computeDeclaredIdentifiers(transaction.state);
        console.log("Updating value of StateField", newValue);
        return newValue;
      }

      console.log("Using old value of StateField", value);
      return value;
    },
  });
