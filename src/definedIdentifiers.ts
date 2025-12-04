import { StateField, Transaction } from "@codemirror/state";
import { TreeCursor } from "@lezer/common";
import { EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

/**
 * Generate a list of all pace names the user has defined in their programme.
 *
 * @param editorState - The state of the editor, containing the current text
 *    contents.
 *
 * @returns A set of all defined pace names in the current programme.
 */
function computeDeclaredIdentifiers(editorState: EditorState): Set<string> {
  const declaredIdentifiers = new Set<string>();
  const treeCursor: TreeCursor = syntaxTree(editorState).cursor();

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
 * An editor state field is a way of caching state within the editor. Here it is
 * used to store the set of all defined identifiers so they can be used multiple
 * times in a single transaction without needing to be recomputed multiple
 * times.
 */
export const definedIdentifiersField: StateField<Set<string>> =
  StateField.define({
    create: computeDeclaredIdentifiers,

    update(value: Set<string>, transaction: Transaction): Set<string> {
      // Recompute only if the document has changed.
      if (transaction.docChanged) {
        return computeDeclaredIdentifiers(transaction.state);
      }

      return value;
    },
  });
