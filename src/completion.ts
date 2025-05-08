import {
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";

import { StrokeName } from "./enumerations";

const strokeNames: Completion[] = Object.keys(StrokeName)
  .filter((key) => isNaN(Number(key)))
  .map((strokeName) => ({
    label: strokeName,
    type: "constant",
    boost: strokeName.length,
  }));

function completeSwimDSL(context: CompletionContext): CompletionResult | null {
  const nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);

  if (nodeBefore.name === "Distance") {
    return {
      from: context.pos,
      options: strokeNames,
      validFor: /^[A-Za-z]/,
    };
  }

  if (nodeBefore.name === "Stroke") {
    return {
      from: nodeBefore.from,
      to: nodeBefore.to,
      options: strokeNames,
      validFor: /^[A-Za-z]/,
    };
  }

  if (nodeBefore.name === "Pace") {
    return {
      from: context.pos,
      options: [{ label: "alias", type: "variable" }],
      validFor: /^[A-Za-z]/,
    };
  }

  if (nodeBefore.name === "PaceAlias") {
    return {
      from: nodeBefore.from,
      to: nodeBefore.to,
      options: [{ label: "alias", type: "variable" }],
      validFor: /^[A-Za-z]/,
    };
  }

  return null;
}

export default completeSwimDSL;
