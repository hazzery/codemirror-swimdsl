/**
 * The list of all strings considered valid in place of a stroke name.
 */
export const strokeNames = [
  "Freestyle",
  "Free",
  "Fr",
  "Backstroke",
  "Back",
  "Bk",
  "Breaststroke",
  "Breast",
  "Br",
  "Butterfly",
  "Fly",
  "Fl",
  "Choice",
  "IndividualMedley",
  "Medley",
  "Im",
  "ReverseIndividualMedley",
  "ReverseMedley",
  "ReverseIm",
  "IndividualMedleyOverlap",
  "MedleyOverlap",
  "ImOverlap",
  "IndividualMedleyOrder",
  "MedleyOrder",
  "ImOrder",
  "ReverseIndividualMedleyOrder",
  "ReverseMedleyOrder",
  "ReverseImOrder",
  "NumberOne",
  "NumberTwo",
  "NumberThree",
  "NumberFour",
  "NotFreestyle",
  "NotFree",
  "NotFr",
  "NotBackstroke",
  "NotBack",
  "NotBk",
  "NotBreastroke",
  "NotBreast",
  "NotBr",
  "NotButterfly",
  "NotFly",
  "NotFl",
] as const;

/**
 * The list of all strings considered valid in place of a stroke type.
 */
export const strokeTypes = ["Pull", "Kick", "Drill"] as const;

/**
 * The list of all strings considered valid in place of an equipment name.
 */
export const equipmentNames = [
  "Board",
  "Pads",
  "PullBuoy",
  "Fins",
  "Snorkel",
  "Chute",
  "StretchCord",
] as const;

/**
 * The list of all strings considered valid in place of a constant name.
 */
export const constantNames = [
  "Title",
  "Author",
  "Description",
  "Date",
  "PoolLength",
  "LengthUnit",
  "Align",
  "NumeralSystem",
  "HideIntro",
  "LayoutWidth",
] as const;

/**
 * The list of all strings considered valid in place of a boolean.
 */
export const booleans = ["True", "False"] as const;
