import {
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";

import { strokeNames } from "./enumerations";
import { definedIdentifiersField } from "./definedIdentifiers";

// Convert all stroke names to autocomplpetions.
const strokeNameCompletions: Completion[] = strokeNames.map((strokeName) => ({
  label: strokeName,
  type: "constant",
  boost: strokeName.length,
}));

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

  // If the cursor is immediately after a distance, ready for a stroke name to be
  // specified, provide stroke name autocomplpetions.
  if (nodeBefore.name === "Distance") {
    return {
      from: context.pos,
      options: strokeNameCompletions,
      validFor: /^[A-Za-z]/,
    };
  }

  // If the cursor is midway through typing a stroke name, provide relevant stroke name
  // autocomplpetions which will replace any existing characters.
  if (nodeBefore.name === "Stroke") {
    return {
      from: nodeBefore.from,
      to: nodeBefore.to,
      options: strokeNameCompletions,
      validFor: /^[A-Za-z]/,
    };
  }

  // Fetch the list of all defined pace names, and convert to autocomplpetions.
  const definedPaceNames: Completion[] = Array.from(
    context.state.field(definedIdentifiersField),
  ).map((paceName) => ({ label: paceName, type: "variable" }));

  // If the cursor is immediately after the @ operator, provide defined pace names as
  // autocomplpetions.
  if (nodeBefore.name === "Pace") {
    return {
      from: context.pos,
      options: definedPaceNames,
      validFor: /^[A-Za-z]/,
    };
  }

  //If the user is mid-way through typing a pace name, provide relevant defined pace
  //names which replace any existing characters.
  if (
    nodeBefore.name === "PaceAlias" &&
    nodeBefore.parent?.name !== "PaceDefinition"
  ) {
    return {
      from: nodeBefore.from,
      to: nodeBefore.to,
      options: definedPaceNames,
      validFor: /^[A-Za-z]/,
    };
  }

  // No autocomplpetions are available at the current cursor position.
  return null;
}

export default completeSwimDSL;
