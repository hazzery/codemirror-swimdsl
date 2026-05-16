import {
  constantNames,
  equipmentNames,
  strokeNames,
} from "./swimlSchema";

export { constantNames, equipmentNames, strokeNames };

/**
 * The list of all strings considered valid in place of a stroke type.
 */
export const strokeTypes = ["Pull", "Kick", "Drill"] as const;

/**
 * The list of all strings considered valid in place of a boolean.
 */
export const booleans = ["True", "False"] as const;
