import { Action } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { SyntaxNodeRef } from "@lezer/common";

import { closestLevenshtienDistance } from "./utils";

const MAX_LEVENSHTIEN_DISTANCE: number = 2;

export function undefinedPaceNameActions(
  undefinedName: string,
  definedNames: Set<string>,
): Action[] {
  const [closestName, distance] = closestLevenshtienDistance(
    undefinedName,
    Array.from(definedNames),
  );

  const actions: Action[] = [];

  if (distance <= MAX_LEVENSHTIEN_DISTANCE) {
    actions.push({
      name: `Did you mean '${closestName}'?`,
      apply(view: EditorView, from: number, to: number) {
        view.dispatch({ changes: { from, to, insert: closestName } });
      },
    });
  }

  actions.push({
    name: "Define pace name",
    apply(view: EditorView) {
      view.dispatch({
        changes: { from: 0, to: 0, insert: `Pace ${undefinedName} = _%\n` },
      });
    },
  });

  return actions;
}

export function duplicatePaceNameDefinitionActions(
  paceDefinitionNode: SyntaxNodeRef,
): Action[] {
  return [
    {
      name: "Remove duplicated definition",
      apply(view: EditorView) {
        view.dispatch({
          changes: { from: paceDefinitionNode.from, to: paceDefinitionNode.to },
        });
      },
    },
  ];
}

export function invalidNodeValueActions(
  invalidValue: string,
  validValues: string[],
): Action[] {
  const [closestValue, distance] = closestLevenshtienDistance(
    invalidValue,
    validValues,
  );

  if (distance > MAX_LEVENSHTIEN_DISTANCE) return [];

  return [
    {
      name: `Did you mean ${closestValue}`,
      apply(view: EditorView, from: number, to: number): void {
        view.dispatch({ changes: { from, to, insert: closestValue } });
      },
    },
  ];
}
