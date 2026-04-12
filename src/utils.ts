import * as Levenshtein from "fastest-levenshtein";
import type { ReadonlyNonEmptyArray } from "./types";

/**
 * Find the string within `array` which is most similar to `str`.
 *
 * @param str - The string to compare to.
 * @param array - A non-empty list of strings to find the closest of.
 *
 * @returns An array containing the string which is the closest, and its
 * Levenshtein distance from `str`.
 */
export function closestLevenshtienDistance(
  str: string,
  array: ReadonlyNonEmptyArray<string>,
): [string, number] {
  const [first, ...rest] = array;

  return rest.reduce(
    ([minStr, minDist], item) => {
      const dist = Levenshtein.distance(str, item);

      return dist < minDist ? [item, dist] : [minStr, minDist];
    },
    [first, Levenshtein.distance(str, first)],
  );
}
