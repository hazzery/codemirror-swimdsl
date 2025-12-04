import { syntaxTree } from "@codemirror/language";
import { Diagnostic, linter } from "@codemirror/lint";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { SyntaxNodeRef, TreeCursor } from "@lezer/common";

import {
  duplicateEquipmentDiagnostic,
  duplicatePaceNameDefinitionDiagnostic,
  incompatibleEquipmentDiagnostic,
  invalidDurationDiagnostic,
  invalidNodeValueDiagnostic,
  syntaxErrorDiagnostic,
  undefinedPaceNameDiagnostic,
} from "./diagnostics";
import {
  booleans,
  constantNames,
  equipmentNames,
  strokeNames,
  strokeTypes,
} from "./enumerations";

/**
 * The maximum allows value for either minutes and seconds in a duration node.
 */
const MAXIMUM_TIME_VALUE = 59;

/**
 * Provide a lint error to the user for referencing a pace name which does not
 * exist.
 *
 * @param node - A refernce to a syntax node to lint.
 * @param declaredIdentifiers - A set of all pace names defined in the current
 *    SwimDSL document.
 * @param state - The current state of the CodeMirror code editor.
 * @param diagnostics - An arrray of diagnostics to append to if `node`
 *    references an undefined pace name.
 */
function lintUndefinedPaceName(
  node: SyntaxNodeRef,
  declaredIdentifiers: Set<string>,
  state: EditorState,
  diagnostics: Diagnostic[],
): void {
  if (node.name !== "PaceAlias") return;

  // Ask the document for the characters that make up the Identifier node
  const node_value = state.sliceDoc(node.from, node.to);

  if (!declaredIdentifiers.has(node_value)) {
    diagnostics.push(
      undefinedPaceNameDiagnostic(node, node_value, declaredIdentifiers),
    );
  }
}

/**
 * Provide a lint error to the user for providing multiple definitions for the
 * same pace name.
 *
 * @param node - A refernce to a syntax node to lint.
 * @param declaredIdentifiers - A set of all pace names defined in the current
 *    SwimDSL document.
 * @param state - The current state of the CodeMirror code editor.
 * @param diagnostics - An arrray of diagnostics to append to if `node`
 *    attempts to redefine a pace name.
 */
function lintDuplicatePaceNameDefinition(
  node: SyntaxNodeRef,
  declaredIdentifiers: Set<string>,
  state: EditorState,
  diagnostics: Diagnostic[],
): void {
  if (node.name !== "PaceDefinitionName") return;

  const node_value = state.sliceDoc(node.from, node.to);

  if (declaredIdentifiers.has(node_value)) {
    diagnostics.push(duplicatePaceNameDefinitionDiagnostic(node_value, node));
  } else {
    declaredIdentifiers.add(node_value);
  }
}

/**
 * Provide a lint error to the user for syntax errors.
 *
 * @param node - A refernce to a syntax node to lint.
 * @param diagnostics - An arrray of diagnostics to append to if `node`
 *    is a syntax error node.
 */
function lintSyntaxErrors(
  node: SyntaxNodeRef,
  diagnostics: Diagnostic[],
): void {
  if (node.name !== "⚠") return;

  diagnostics.push(syntaxErrorDiagnostic(node));
}

const incompatibleEquipmentMap: Map<string, Set<string>> = new Map<
  string,
  Set<string>
>([
  ["Default", new Set(["Board", "PullBuoy"])],
  ["Kick", new Set(["PullBuoy", "Pads"])],
  ["Pull", new Set(["Board", "Fins"])],
]);

/**
 * Provide a lint error to the user for attemping to combine incompatible
 * equipment.
 *
 * @param node - A refernce to a syntax node to lint.
 * @param editorState - The current state of the CodeMirror code editor.
 * @param diagnostics - An arrray of diagnostics to append to if `node`
 *    specifies a combination of incompatible equipment items.
 */
function lintIncompatibleEquipment(
  node: SyntaxNodeRef,
  editorState: EditorState,
  diagnostics: Diagnostic[],
): void {
  if (node.name !== "Instruction") return;

  const equipmentSpecificationNode = node.node.getChild(
    "EquipmentSpecification",
  );
  if (equipmentSpecificationNode === null) return;

  const strokeTypeNode = node.node.getChild("StrokeType");
  const strokeType =
    strokeTypeNode !== null
      ? editorState.sliceDoc(strokeTypeNode.from, strokeTypeNode.to)
      : "Default";

  const fromPosition =
    strokeTypeNode !== null
      ? strokeTypeNode.from
      : equipmentSpecificationNode.from;

  const specifiedEquipment = equipmentSpecificationNode
    .getChildren("EquipmentName")
    .map((child) => editorState.sliceDoc(child.from, child.to));
  const equipmentSet = new Set(specifiedEquipment);

  if (equipmentSet.size !== specifiedEquipment.length) {
    diagnostics.push(
      duplicateEquipmentDiagnostic(fromPosition, equipmentSpecificationNode.to),
    );
  }

  const incompatibleEquipment = incompatibleEquipmentMap.get(strokeType);

  if (incompatibleEquipment === undefined) return;

  for (const equipmentName of equipmentSet) {
    if (incompatibleEquipment.has(equipmentName)) {
      diagnostics.push(
        incompatibleEquipmentDiagnostic(
          fromPosition,
          equipmentSpecificationNode.to,
          equipmentName,
          strokeType,
        ),
      );
    }
  }
}

/**
 * Provide a lint error to the user for providing an unknown identifier.
 *
 * Examples of providing unknown identifiers could be, specifying a stroke of
 * "Airplane", or "Chicken" as a piece of euqipment. "Airplane" is not understood by the
 * system as a known stroke name, nor "Chicken" a valid piece of equipment.
 *
 * @param node - A refernce to a syntax node to lint.
 * @param editorState - The current state of the CodeMirror code editor.
 * @param nodeName - The name of the syntax node for which we are linting.
 * @param validValues - The allowed list of values for this node.
 * @param diagnostics - An arrray of diagnostics to append to if `node`
 *    specifies a combination of incompatible pieces of equipment.
 */
function lintInvalidNodeValue(
  node: SyntaxNodeRef,
  editorState: EditorState,
  nodeName: string,
  validValues: string[],
  diagnostics: Diagnostic[],
): void {
  if (node.name !== nodeName) return;

  const nodeValue = editorState.sliceDoc(node.from, node.to);
  if (!validValues.includes(nodeValue)) {
    diagnostics.push(
      invalidNodeValueDiagnostic(node, nodeValue, nodeName, validValues),
    );
  }
}

/**
 * Provide a lint error to the user for incorrectly specifying a time duration.
 *
 * Examples of providing an incorrect duration are "0:62" or "240:00". "0:62"
 * should instead be specified as "1:02". "240:00" would be equivalent to four
 * hours, this is simply too long. The maximum duration that can be specified is
 * "59:59", fifty nine minutes and fifty nine seconds.
 *
 * @param node - A refernce to a syntax node to lint.
 * @param editorState - The current state of the CodeMirror code editor.
 * @param diagnostics - An arrray of diagnostics to append to if `node`
 *    specifies a combination of incompatible pieces of equipment.
 */
function lintInvalidDuration(
  node: SyntaxNodeRef,
  editorState: EditorState,
  diagnostics: Diagnostic[],
): void {
  if (node.name !== "Duration") return;

  const numbers = node.node.getChildren("Number");
  for (const numberNode of numbers) {
    const number = Number(editorState.sliceDoc(numberNode.from, numberNode.to));
    if (number > MAXIMUM_TIME_VALUE) {
      diagnostics.push(invalidDurationDiagnostic(numberNode));
    }
  }
}

/**
 * Lint the entire document in the provided CodeMirror editor view.
 *
 * @param view - A CodeMirror editor view object. Contains the current state of
 *    the document.
 *
 * @returns A list of lint diagnostics to display to the user as squiggly lines.
 */
function swimdslLintSource(view: EditorView): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  const declaredIdentifiers = new Set<string>();

  const editorState = view.state;
  const treeCursor: TreeCursor = syntaxTree(editorState).cursor();

  do {
    lintUndefinedPaceName(
      treeCursor,
      declaredIdentifiers,
      editorState,
      diagnostics,
    );
    lintDuplicatePaceNameDefinition(
      treeCursor,
      declaredIdentifiers,
      editorState,
      diagnostics,
    );
    lintSyntaxErrors(treeCursor, diagnostics);
    lintIncompatibleEquipment(treeCursor, editorState, diagnostics);
    lintInvalidNodeValue(
      treeCursor,
      editorState,
      "Stroke",
      strokeNames,
      diagnostics,
    );
    lintInvalidNodeValue(
      treeCursor,
      editorState,
      "StrokeModifier",
      strokeTypes,
      diagnostics,
    );
    lintInvalidNodeValue(
      treeCursor,
      editorState,
      "EquipmentName",
      equipmentNames,
      diagnostics,
    );
    lintInvalidNodeValue(
      treeCursor,
      editorState,
      "Boolean",
      booleans,
      diagnostics,
    );
    lintInvalidNodeValue(
      treeCursor,
      editorState,
      "ConstantName",
      constantNames,
      diagnostics,
    );
    lintInvalidDuration(treeCursor, editorState, diagnostics);
  } while (treeCursor.next());

  return diagnostics;
}

export default linter(swimdslLintSource);
