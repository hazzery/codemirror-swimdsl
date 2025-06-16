import { syntaxTree } from "@codemirror/language";
import { Diagnostic, linter } from "@codemirror/lint";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { SyntaxNodeRef, TreeCursor } from "@lezer/common";

import {
  duplicateGearDiagnostic,
  duplicatePaceNameDefinitionDiagnostic,
  incompatibleGearDiagnostic,
  invalidDurationDiagnostic,
  invalidNodeValueDiagnostic,
  syntaxErrorDiagnostic,
  undefinedPaceNameDiagnostic,
} from "./diagnostics";
import {
  strokeNames,
  strokeTypes,
  requiredGear,
  distanceUnits,
  lengthUnits,
} from "./enumerations";

const MAXIMUM_TIME_VALUE: number = 59;

function lintUndefinedPaceName(
  node: SyntaxNodeRef,
  declaredIdentifiers: Set<string>,
  state: EditorState,
  diagnostics: Diagnostic[],
): void {
  if (node.name !== "PaceAlias") return;

  const parent = node.node.parent;
  if (parent === null) return;

  // Ask the document for the characters that make up the Identifier node
  const node_value = state.sliceDoc(node.from, node.to);

  if (parent.name === "PaceDefinition") {
    if (declaredIdentifiers.has(node_value)) {
      diagnostics.push(
        duplicatePaceNameDefinitionDiagnostic(node_value, node, parent),
      );
    } else {
      declaredIdentifiers.add(node_value);
    }
  } else if (
    parent.name === "PerceivedRate" &&
    !declaredIdentifiers.has(node_value)
  ) {
    diagnostics.push(
      undefinedPaceNameDiagnostic(node, node_value, declaredIdentifiers),
    );
  }
}

function lintSyntaxErrors(
  node: SyntaxNodeRef,
  diagnostics: Diagnostic[],
): void {
  if (node.name !== "⚠") return;

  diagnostics.push(syntaxErrorDiagnostic(node));
}

const incompatibleGearMap: Map<string, Set<string>> = new Map<
  string,
  Set<string>
>([
  ["Default", new Set(["Board", "Bouy"])],
  ["Kick", new Set(["Bouy", "Paddles"])],
  ["Pull", new Set(["Board", "Fins"])],
]);

function lintIncompatibleGear(
  node: SyntaxNodeRef,
  editorState: EditorState,
  diagnostics: Diagnostic[],
): void {
  if (node.name !== "Instruction") return;

  const gearSpecificationNode = node.node.getChild("GearSpecification");
  if (gearSpecificationNode === null) return;

  const strokeTypeNode = node.node.getChild("StrokeType");
  const strokeType =
    strokeTypeNode !== null
      ? editorState.sliceDoc(strokeTypeNode.from, strokeTypeNode.to)
      : "Default";

  const fromPosition =
    strokeTypeNode !== null ? strokeTypeNode.from : gearSpecificationNode.from;

  const specifiedGear = gearSpecificationNode
    .getChildren("RequiredGear")
    .map((child) => editorState.sliceDoc(child.from, child.to));
  const gearSet = new Set(specifiedGear);

  if (gearSet.size !== specifiedGear.length) {
    diagnostics.push(
      duplicateGearDiagnostic(fromPosition, gearSpecificationNode.to),
    );
  }

  const incompatibleGear = incompatibleGearMap.get(strokeType);

  if (incompatibleGear === undefined) return;

  for (const gearType of gearSet) {
    if (incompatibleGear.has(gearType)) {
      diagnostics.push(
        incompatibleGearDiagnostic(
          fromPosition,
          gearSpecificationNode.to,
          gearType,
          strokeType,
        ),
      );
    }
  }
}

function lintInvalidNodeValue(
  node: SyntaxNodeRef,
  editorState: EditorState,
  nodeName: string,
  validValues: string[],
  diagnostics: Diagnostic[],
): void {
  if (node.name !== nodeName) return;

  const nodeValue = editorState.sliceDoc(node.from, node.to);
  if (validValues.indexOf(nodeValue) === -1) {
    diagnostics.push(
      invalidNodeValueDiagnostic(node, nodeValue, nodeName, validValues),
    );
  }
}

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
    lintSyntaxErrors(treeCursor, diagnostics);
    lintIncompatibleGear(treeCursor, editorState, diagnostics);
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
      "StrokeType",
      strokeTypes,
      diagnostics,
    );
    lintInvalidNodeValue(
      treeCursor,
      editorState,
      "RequiredGear",
      requiredGear,
      diagnostics,
    );
    lintInvalidNodeValue(
      treeCursor,
      editorState,
      "DistanceUnit",
      distanceUnits,
      diagnostics,
    );
    lintInvalidNodeValue(
      treeCursor,
      editorState,
      "LengthUnit",
      lengthUnits,
      diagnostics,
    );
    lintInvalidDuration(treeCursor, editorState, diagnostics);
  } while (treeCursor.next());

  return diagnostics;
}

export default linter(swimdslLintSource);
