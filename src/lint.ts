import { syntaxTree } from "@codemirror/language";
import { Diagnostic, linter } from "@codemirror/lint";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { SyntaxNodeRef, TreeCursor } from "@lezer/common";
import { StrokeName, StrokeType, RequiredGear } from "./enumerations";

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
): void {
  if (node.name !== "Identifier") return;

  let parent = node.node.parent;
  if (parent === null) return;

  // Ask the document for the characters that make up the Identifier node
  let node_value = state.sliceDoc(node.from, node.to);

  if (parent.name === "PaceDefinition") {
    declaredIdentifiers.add(node_value);
  } else if (
    parent.name === "PaceAlias" &&
    !declaredIdentifiers.has(node_value)
  ) {
    diagnostics.push({
      from: node.from,
      to: node.to,
      severity: "error",
      message: undefinedPaceNameMessage(node_value),
      actions: [
        {
          name: "Define pace name",
          apply(view: EditorView, _from: number, _to: number) {
            view.dispatch({
              changes: { from: 0, to: 0, insert: `Pace ${node_value} = _%\n` },
            });
          },
        },
      ],
    });
  }
}

function lintSyntaxErrors(
  node: SyntaxNodeRef,
  diagnostics: Diagnostic[],
): void {
  if (node.name !== "⚠") return;

  diagnostics.push({
    from: node.from,
    to: node.to,
    severity: "error",
    message: "Syntax error",
  });
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
    diagnostics.push({
      from: fromPosition,
      to: gearSpecificationNode.to,
      severity: "error",
      message:
        "Duplicate gear specified. Please do not use the same gear multiple times",
    });
  }

  const incompatibleGear = incompatibleGearMap.get(strokeType);

  if (incompatibleGear === undefined) return;

  for (const gearType of gearSet) {
    if (incompatibleGear.has(gearType)) {
      diagnostics.push({
        from: fromPosition,
        to: gearSpecificationNode.to,
        severity: "error",
        message: `'${gearType}' is not compatible with stroke type '${strokeType}'`,
      });
    }
  }
}

function pascalCaseToSentence(pascalCase: string): string {
  // Insert a space before all caps that follow a lowercase letter.
  const sentenceWithSpaces = pascalCase.replace(/([a-z])([A-Z])/g, "$1 $2");

  // Lowercase the entire sentence.
  return sentenceWithSpaces.toLowerCase();
}

function lintInvalidNodeValue<Enumeration>(
  node: SyntaxNodeRef,
  editorState: EditorState,
  nodeName: string,
  enumeration: Enumeration,
  diagnostics: Diagnostic[],
): void {
  if (node.name !== nodeName) return;

  const strokeType = editorState.sliceDoc(node.from, node.to);
  if (enumeration[strokeType as keyof Enumeration] === undefined) {
    diagnostics.push({
      from: node.from,
      to: node.to,
      severity: "error",
      message: `${strokeType} is not a valid ${pascalCaseToSentence(nodeName)}.`,
    });
  }
}

function swimdslLintSource(view: EditorView): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  const declaredIdentifiers = new Set<string>();

  let editorState = view.state;
  let treeCursor: TreeCursor = syntaxTree(editorState).cursor();

  while (treeCursor.next()) {
    lintUndefinedPaceName(treeCursor, declaredIdentifiers, editorState, diagnostics);
    lintSyntaxErrors(treeCursor, diagnostics);
    lintIncompatibleGear(treeCursor, editorState, diagnostics);
    lintInvalidNodeValue(
      treeCursor,
      editorState,
      "Stroke",
      StrokeName,
      diagnostics,
    );
    lintInvalidNodeValue(
      treeCursor,
      editorState,
      "StrokeType",
      StrokeType,
      diagnostics,
    );
    lintInvalidNodeValue(
      treeCursor,
      editorState,
      "RequiredGear",
      RequiredGear,
      diagnostics,
    );
  }

  return diagnostics;
}

export default linter(swimdslLintSource);
