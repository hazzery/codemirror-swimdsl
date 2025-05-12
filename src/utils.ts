import * as Levenshtein from "fastest-levenshtein";

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
