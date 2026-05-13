/**
 * This file is generated from `swiML.xsd` and `swiML.xsl`.
 * Run `npm run generate:swiml` after updating either source file.
 */

export const swiMLSchemaInfo = {
  namespace: "https://github.com/bartneck/swiML",
  version: "2.1",
} as const;

export const drillNameType = [
  "6KickDrill",
  "8KickDrill",
  "10KickDrill",
  "12KickDrill",
  "fingerTrails",
  "123",
  "bigDog",
  "scull",
  "singleArm",
  "any",
  "technic",
  "dogPaddle",
  "tarzan",
  "fist",
  "2Kick1Pull",
  "3Kick1Pull",
  "2Pull1Kick",
  "3Pull1Kick",
  "3Right3Left",
  "2Right2Left",
  "other",
] as const;

export type DrillNameType = (typeof drillNameType)[number];

export const equipmentType = [
  "board",
  "pads",
  "pullBuoy",
  "fins",
  "snorkel",
  "chute",
  "stretchCord",
] as const;

export type EquipmentType = (typeof equipmentType)[number];

export const legMovementType = [
  "flutter",
  "dolphin",
  "scissor",
] as const;

export type LegMovementType = (typeof legMovementType)[number];

export const lengthUnits = [
  "meters",
  "kilometers",
  "miles",
  "yards",
] as const;

export type LengthUnits = (typeof lengthUnits)[number];

export const numeralSystems = [
  "decimal",
  "roman",
] as const;

export type NumeralSystems = (typeof numeralSystems)[number];

export const orientationType = [
  "front",
  "back",
  "left",
  "right",
  "side",
  "vertical",
  "waka",
] as const;

export type OrientationType = (typeof orientationType)[number];

export const standardStrokeType = [
  "butterfly",
  "backstroke",
  "breaststroke",
  "freestyle",
  "individualMedley",
  "reverseIndividualMedley",
  "individualMedleyOverlap",
  "individualMedleyOrder",
  "reverseIndividualMedleyOrder",
  "any",
  "nr1",
  "nr2",
  "nr3",
  "nr4",
  "notButterfly",
  "notBackstroke",
  "notBreaststroke",
  "notFreestyle",
] as const;

export type StandardStrokeType = (typeof standardStrokeType)[number];

export const zoneType = [
  "easy",
  "threshold",
  "endurance",
  "racePace",
  "max",
] as const;

export type ZoneType = (typeof zoneType)[number];

export const programmeMetadataElements = {
  "title": {
    typeName: "titleString",
    required: false,
    defaultValue: null,
    documentation: "A short title of the program.",
  },
  "programDescription": {
    typeName: "descriptionString",
    required: false,
    defaultValue: null,
    documentation: "A short description for the program.",
  },
  "creationDate": {
    typeName: "xs:date",
    required: false,
    defaultValue: "2022-02-22",
    documentation: "The date on which the program was created.",
  },
  "poolLength": {
    typeName: "xs:nonNegativeInteger",
    required: true,
    defaultValue: "25",
    documentation: "The length of pool",
  },
  "lengthUnit": {
    typeName: "lengthUnits",
    required: true,
    defaultValue: "meters",
    documentation: "The length of pool requires a measurement unit.",
  },
  "programAlign": {
    typeName: "xs:boolean",
    required: false,
    defaultValue: null,
    documentation: "When set to False all elements in the program will not align",
  },
  "numeralSystem": {
    typeName: "numeralSystems",
    required: false,
    defaultValue: null,
    documentation: "Can set to different numeral systems to display",
  },
  "hideIntro": {
    typeName: "xs:boolean",
    required: false,
    defaultValue: null,
    documentation: "True if intro should be hidden in output.",
  },
  "layoutWidth": {
    typeName: "xs:nonNegativeInteger",
    required: false,
    defaultValue: "50",
    documentation: "The width of the program on the HTML page. The unit is characters. 50ch are 11cm wide.",
  },
} as const;

export type ProgrammeMetadataElementName = keyof typeof programmeMetadataElements;

export const xslDisplayNames = {
  "123": "123",
  "butterfly": "FL",
  "backstroke": "BK",
  "breaststroke": "BR",
  "freestyle": "FR",
  "individualMedley": "IM",
  "reverseIndividualMedley": "IM Reverse",
  "individualMedleyOverlap": "IM Overlap",
  "individualMedleyOrder": "IM Order",
  "reverseIndividualMedleyOrder": "IM Reverse Order",
  "any": "Any",
  "nr1": "Nr 1",
  "nr2": "Nr 2",
  "nr3": "Nr 3",
  "nr4": "Nr 4",
  "notButterfly": "Not FL",
  "notBackstroke": "Not BK",
  "notBreaststroke": "Not BR",
  "notFreestyle": "Not FR",
  "flutter": "Flutter",
  "dolphin": "Dolphin",
  "scissor": "Scissor",
  "front": "Front",
  "back": "Back",
  "left": "Left",
  "right": "Right",
  "side": "Side",
  "vertical": "Vertical",
  "easy": "Easy",
  "threshold": "Threshold",
  "endurance": "Endurance",
  "racePace": "Race Pace",
  "max": "Max",
  "6KickDrill": "6KD",
  "8KickDrill": "8KD",
  "10KickDrill": "10KD",
  "12KickDrill": "12KD",
  "fingerTrails": "FT",
  "bigDog": "Big Dog",
  "scull": "Scull",
  "singleArm": "Single Arm",
  "technic": "Technic",
  "dogPaddle": "Dog Paddle",
  "tarzan": "Tarzan",
  "fist": "Fist",
  "3Kick1Pull": "3K1P",
  "board": "Board",
  "pads": "Pads",
  "pullBuoy": "Pullbuoy",
  "fins": "Fins",
  "snorkel": "Snorkel",
  "chute": "Chute",
  "stretchCord": "Stretch Cord",
  "other": "other",
  "breath": "b",
  "laps": "laps",
  "meters": "m",
  "yards": "yd",
} as const;

