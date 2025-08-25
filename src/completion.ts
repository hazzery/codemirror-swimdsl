import {
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";

import { requiredGear, strokeNames, strokeTypes } from "./enumerations";
import { definedIdentifiersField } from "./definedIdentifiers";

const enum CompletableNodes {
  STROKE_NAME,
  GEAR_NAME,
  PACE_ALIAS,
  STROKE_MODIFIER,
  NUMBER_COMPLETEABLE_NODES,
}

interface NodeCompletionSpec {
  priorNodeName: string;
  nodeName: string;
  completions: Completion[];
}

// Convert all stroke names to autocomplpetions.
const strokeNameCompletions: Completion[] = strokeNames.map((strokeName) => ({
  label: strokeName,
  type: "constant",
  boost: strokeName.length,
}));

const gearNameCompletions: Completion[] = requiredGear.map((gearName) => ({
  label: gearName,
  type: "constant",
}));

const strokeModifierCompletions: Completion[] = strokeTypes.map(
  (strokeModifier) => ({ label: strokeModifier, type: "constant" }),
);

const nodeCompletions: Map<CompletableNodes, NodeCompletionSpec> = new Map([
  [
    CompletableNodes.STROKE_NAME,
    {
      priorNodeName: "Distance",
      nodeName: "Stroke",
      completions: strokeNameCompletions,
    },
  ],
  [
    CompletableNodes.GEAR_NAME,
    {
      priorNodeName: "GearSpecification",
      nodeName: "RequiredGear",
      completions: gearNameCompletions,
    },
  ],
  [
    CompletableNodes.PACE_ALIAS,
    {
      priorNodeName: "Pace",
      nodeName: "PaceAlias",
      completions: [] as Completion[],
    },
  ],
  [
    CompletableNodes.STROKE_MODIFIER,
    {
      priorNodeName: "",
      nodeName: "StrokeType",
      completions: strokeModifierCompletions,
    },
  ],
]);

/**
 * Provide the user with autocomplpetions within the editor based on the current
 * location of the cursor within the syntax tree.
 *
 * @param context - The editor context, contains the current text contents of
 *    the editor.
 *
 * @returns An editor autocompletion if possible, otherwise `null`.
 */
function completeSwimDSL(context: CompletionContext): CompletionResult | null {
  const nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);

  // Fetch the list of all defined pace names, and convert to autocomplpetions.
  nodeCompletions.get(CompletableNodes.PACE_ALIAS)!.completions = Array.from(
    context.state.field(definedIdentifiersField),
  ).map((paceName) => ({ label: paceName, type: "variable" }));

  for (const {
    priorNodeName,
    nodeName,
    completions,
  } of nodeCompletions.values()) {
    // If the user has just typed a character placing the curson in a position
    // which accepts autocomplpetions, provide the autocomplpetions.
    if (nodeBefore.name === priorNodeName) {
      return {
        from: context.pos,
        options: completions,
        validFor: /^[A-Za-z]/,
      };
    }

    // If the user is midway through typing a node which accepts
    // autocomplpetions, continue to provide autocomplpetions.
    if (nodeBefore.name === nodeName) {
      return {
        from: nodeBefore.from,
        to: nodeBefore.to,
        options: completions,
        validFor: /^[A-Za-z]/,
      };
    }
  }

  // No autocomplpetions are available at the current cursor position.
  return null;
}

export default completeSwimDSL;
