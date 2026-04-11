import * as Levenshtein from "fastest-levenshtein";

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
  array: string[],
): [string, number] {
  let min_distance = Infinity;
  let min_index = 0;

  for (let i = 0; i < array.length; i++) {
    // Because of `"noUncheckedIndexedAccess": true` in tsconfig, array accesses
    // return a type of `T | undefined`. As we know here that `i < array.length`
    // the non-null assertion operator is appropriate.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const dist = Levenshtein.distance(str, array[i]!);

    if (dist < min_distance) {
      min_distance = dist;
      min_index = i;
    }
  }

  // Read above comment
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return [array[min_index]!, min_distance];
}
