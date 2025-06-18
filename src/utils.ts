import * as Levenshtein from "fastest-levenshtein";

/**
 * Find the string within `array` which is most similar to `str`.
 *
 * @param str - The string to compare to.
 * @param array - A list of strings to find the closest of.
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
    const dist = Levenshtein.distance(str, array[i]);

    if (dist < min_distance) {
      min_distance = dist;
      min_index = i;
    }
  }

  return [array[min_index], min_distance];
}
