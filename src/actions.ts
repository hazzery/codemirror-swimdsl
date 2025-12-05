import { Action } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { SyntaxNodeRef } from "@lezer/common";

import { closestLevenshtienDistance } from "./utils";

/**
 * The maximum distance between a typed identifier, and the closest valid
 * indentifier for the editor to suggest replacing the rerror with the valid
 * identifier.
 */
const MAX_LEVENSHTIEN_DISTANCE = 2;

/**
 * Provide the user with a list of actions they can to resolve an undefined
 * pace name error.
 *
 * @param undefinedName - The user entered pace name which is undefined.
 * @param definedNames  - The list of defined pace names.
 *
 * @returns An array of editor actions which the user can choose to take.
 */
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

/**
 * Provide the user with an action to remove a duplicated definition of a pace
 * name.
 *
 * @param paceDefinitionNode - The syntax tree node of the duplicated pace name
 *    definition.
 *
 * @returns An editor action the user can choose to take
 */
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

/**
 * Provide the user with an action to replace an invalid identifier with the
 * closest valid identifier.
 *
 * @param invalidValue - The user entered node value which is invalid.
 * @param validValues - The list of values which are valid in place of the
 *    invalid value.
 *
 * @returns An editor action the user can choose to take.
 */
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
