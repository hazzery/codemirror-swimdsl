import {
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";

import { StrokeName } from "./enumerations";

// Convert all stroke names to autocomplpetions.
const strokeNames: Completion[] = Object.keys(StrokeName)
  .filter((key) => isNaN(Number(key)))
  .map((strokeName) => ({
    label: strokeName,
    type: "constant",
    boost: strokeName.length,
  }));

function completeSwimDSL(context: CompletionContext): CompletionResult | null {
  const nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);

  // If the cursor is immediately after a distance, ready for a stroke name to be
  // specified, provide stroke name autocomplpetions.
  if (nodeBefore.name === "Distance") {
    return {
      from: context.pos,
      options: strokeNames,
      validFor: /^[A-Za-z]/,
    };
  }

  // If the cursor is midway through typing a stroke name, provide relevant stroke name
  // autocomplpetions which will replace any existing characters.
  if (nodeBefore.name === "Stroke") {
    return {
      from: nodeBefore.from,
      to: nodeBefore.to,
      options: strokeNames,
      validFor: /^[A-Za-z]/,
    };
  }

  // If the cursor is immediately after the @ operator, provide defined pace names as
  // autocomplpetions.
  if (nodeBefore.name === "Pace") {
    return {
      from: context.pos,
      options: [{ label: "alias", type: "variable" }],
      validFor: /^[A-Za-z]/,
    };
  }

  //If the user is mid-way through typing a pace name, provide relevant defined pace
  //names which replace any existing characters.
  if (nodeBefore.name === "PaceAlias") {
    return {
      from: nodeBefore.from,
      to: nodeBefore.to,
      options: [{ label: "alias", type: "variable" }],
      validFor: /^[A-Za-z]/,
    };
  }

  // No autocomplpetions are available at the current cursor position.
  return null;
}

export default completeSwimDSL;
