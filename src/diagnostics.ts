import { Diagnostic } from "@codemirror/lint";
import { SyntaxNodeRef } from "@lezer/common";

import {
  undefinedPaceNameActions,
  duplicatePaceNameDefinitionActions,
  invalidNodeValueActions,
} from "./actions";

export function duplicatePaceNameDefinitionDiagnostic(
  undefinedName: string,
  paceAliasNode: SyntaxNodeRef,
  paceDefinitionNode: SyntaxNodeRef,
): Diagnostic {
  return {
    from: paceAliasNode.from,
    to: paceAliasNode.to,
    severity: "error",
    message: `A pace named '${undefinedName}' has already been defined`,
    actions: duplicatePaceNameDefinitionActions(paceDefinitionNode),
  };
}

export function undefinedPaceNameDiagnostic(
  paceAliasNode: SyntaxNodeRef,
  undefinedName: string,
  definedPaceNames: Set<string>,
): Diagnostic {
  return {
    from: paceAliasNode.from,
    to: paceAliasNode.to,
    severity: "error",
    actions: undefinedPaceNameActions(undefinedName, definedPaceNames),
    message: `'${undefinedName}' is not a defined pace name.
If you wish to be able to use '${undefinedName}' in the place of a pace percentage, please define it with the following line:
Pace ${undefinedName} = _%`,
  };
}

export function syntaxErrorDiagnostic(errorNode: SyntaxNodeRef): Diagnostic {
  return {
    from: errorNode.from,
    to: errorNode.to,
    severity: "error",
    message: "Syntax error",
  };
}

export function duplicateGearDiagnostic(from: number, to: number): Diagnostic {
  return {
    from,
    to,
    severity: "error",
    message:
      "Duplicate gear specified. Please do not use the same gear multiple times",
  };
}

export function incompatibleGearDiagnostic(
  from: number,
  to: number,
  gearType: string,
  strokeType: string,
): Diagnostic {
  return {
    from,
    to,
    severity: "error",
    message: `'${gearType}' is not compatible with stroke type '${strokeType}'`,
  };
}

function pascalCaseToSentence(pascalCase: string): string {
  // Insert a space before all caps that follow a lowercase letter.
  const sentenceWithSpaces = pascalCase.replace(/([a-z])([A-Z])/g, "$1 $2");

  // Lowercase the entire sentence.
  return sentenceWithSpaces.toLowerCase();
}

export function invalidNodeValueDiagnostic(
  node: SyntaxNodeRef,
  nodeValue: string,
  nodeName: string,
  validValues: string[],
): Diagnostic {
  return {
    from: node.from,
    to: node.to,
    severity: "error",
    message: `${nodeValue} is not a valid ${pascalCaseToSentence(nodeName)}.`,
    actions: invalidNodeValueActions(nodeValue, validValues),
  };
}

export function invalidDurationDiagnostic(
  numberNode: SyntaxNodeRef,
): Diagnostic {
  return {
    from: numberNode.from,
    to: numberNode.to,
    severity: "error",
    message: `Number too large for duration`,
  };
}
