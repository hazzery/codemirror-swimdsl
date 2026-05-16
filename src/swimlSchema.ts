import {
  equipmentType,
  programmeMetadataElements,
  standardStrokeType,
  swiMLSchemaInfo,
  xslDisplayNames,
  type EquipmentType,
  type ProgrammeMetadataElementName,
  type StandardStrokeType,
} from "./generatedSwimlModel";
import type { ReadonlyNonEmptyArray } from "./types";

type AliasRecord<T extends string> = Record<T, readonly string[]>;
type NonEmptyAliasRecord<T extends string> = Record<
  T,
  readonly [string, ...string[]]
>;

export interface AliasInfo<T extends string> {
  xmlValue: T;
  displayLabel?: string | undefined;
  documentation?: string | undefined;
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value.slice(0, 1).toUpperCase() + value.slice(1);
}

function xmlValueToIdentifier(value: string): string {
  return /^nr\d+$/u.test(value)
    ? `Nr${value.slice(2)}`
    : capitalize(value);
}

function displayLabelToIdentifier(value: string): string {
  return value
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .map((part) => capitalize(part.toLowerCase()))
    .join("");
}

function getXslDisplayLabel(value: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(xslDisplayNames, value)
    ? xslDisplayNames[value as keyof typeof xslDisplayNames]
    : undefined;
}

function buildAliasRecord<T extends string>(
  canonicalValues: readonly T[],
  extraAliases: AliasRecord<T>,
): NonEmptyAliasRecord<T> {
  const aliasesByXmlValue = {} as NonEmptyAliasRecord<T>;

  for (const canonicalValue of canonicalValues) {
    const aliases = new Set<string>([xmlValueToIdentifier(canonicalValue)]);
    const displayLabel = getXslDisplayLabel(canonicalValue);

    if (displayLabel) {
      aliases.add(displayLabelToIdentifier(displayLabel));
    }

    for (const alias of extraAliases[canonicalValue]) {
      aliases.add(alias);
    }

    aliasesByXmlValue[canonicalValue] = Array.from(aliases) as unknown as readonly [
      string,
      ...string[],
    ];
  }

  return aliasesByXmlValue;
}

function flattenAliasRecord<T extends string>(
  canonicalValues: readonly T[],
  aliasesByXmlValue: NonEmptyAliasRecord<T>,
): ReadonlyNonEmptyArray<string> {
  return canonicalValues.flatMap(
    (canonicalValue) => aliasesByXmlValue[canonicalValue],
  ) as unknown as ReadonlyNonEmptyArray<string>;
}

function invertAliasRecord<T extends string>(
  canonicalValues: readonly T[],
  aliasesByXmlValue: NonEmptyAliasRecord<T>,
): ReadonlyMap<string, T> {
  const aliases = new Map<string, T>();

  for (const canonicalValue of canonicalValues) {
    for (const alias of aliasesByXmlValue[canonicalValue]) {
      aliases.set(alias, canonicalValue);
    }
  }

  return aliases;
}

function buildAliasInfo<T extends string>(
  canonicalValues: readonly T[],
  aliasesByXmlValue: NonEmptyAliasRecord<T>,
  getDocumentation?: (canonicalValue: T) => string | undefined,
): Readonly<Record<string, AliasInfo<T>>> {
  const aliasInfo: Record<string, AliasInfo<T>> = {};

  for (const canonicalValue of canonicalValues) {
    const displayLabel = getXslDisplayLabel(canonicalValue);
    const documentation = getDocumentation?.(canonicalValue);

    for (const alias of aliasesByXmlValue[canonicalValue]) {
      aliasInfo[alias] = {
        xmlValue: canonicalValue,
        displayLabel,
        documentation,
      };
    }
  }

  return aliasInfo;
}

const strokeAliasExtras = {
  butterfly: ["Fly"],
  backstroke: ["Back"],
  breaststroke: ["Breast"],
  freestyle: ["Free"],
  individualMedley: ["Medley"],
  reverseIndividualMedley: ["ReverseMedley", "ReverseIm"],
  individualMedleyOverlap: ["MedleyOverlap", "ImOverlap"],
  individualMedleyOrder: ["MedleyOrder"],
  reverseIndividualMedleyOrder: ["ReverseMedleyOrder", "ReverseImOrder"],
  any: ["Choice"],
  nr1: ["NumberOne"],
  nr2: ["NumberTwo"],
  nr3: ["NumberThree"],
  nr4: ["NumberFour"],
  notButterfly: ["NotFly"],
  notBackstroke: ["NotBack"],
  notBreaststroke: ["NotBreast", "NotBreastroke"],
  notFreestyle: ["NotFree"],
} as const satisfies AliasRecord<StandardStrokeType>;

const equipmentAliasExtras = {
  board: [],
  pads: [],
  pullBuoy: [],
  fins: [],
  snorkel: [],
  chute: [],
  stretchCord: [],
} as const satisfies AliasRecord<EquipmentType>;

const programmeMetadataElementNames = Object.keys(
  programmeMetadataElements,
) as ProgrammeMetadataElementName[];

const constantAliasExtras = {
  title: [],
  programDescription: ["Description"],
  creationDate: ["Date"],
  poolLength: [],
  lengthUnit: [],
  programAlign: ["Align"],
  numeralSystem: [],
  hideIntro: [],
  layoutWidth: [],
} as const satisfies AliasRecord<ProgrammeMetadataElementName>;

const strokeAliasesByXmlValue = buildAliasRecord(
  standardStrokeType,
  strokeAliasExtras,
);
const equipmentAliasesByXmlValue = buildAliasRecord(
  equipmentType,
  equipmentAliasExtras,
);
const constantAliasesByElementName = buildAliasRecord(
  programmeMetadataElementNames,
  constantAliasExtras,
);

const strokeAliases = invertAliasRecord(
  standardStrokeType,
  strokeAliasesByXmlValue,
);
const equipmentAliases = invertAliasRecord(
  equipmentType,
  equipmentAliasesByXmlValue,
);
const constantAliases = invertAliasRecord(
  programmeMetadataElementNames,
  constantAliasesByElementName,
);

export const strokeNames = flattenAliasRecord(
  standardStrokeType,
  strokeAliasesByXmlValue,
);

export const equipmentNames = flattenAliasRecord(
  equipmentType,
  equipmentAliasesByXmlValue,
);

export const constantNames = flattenAliasRecord(
  programmeMetadataElementNames,
  constantAliasesByElementName,
);

export const strokeNameInfo = buildAliasInfo(
  standardStrokeType,
  strokeAliasesByXmlValue,
);

export const equipmentNameInfo = buildAliasInfo(
  equipmentType,
  equipmentAliasesByXmlValue,
);

export const constantNameInfo = buildAliasInfo(
  programmeMetadataElementNames,
  constantAliasesByElementName,
  (elementName) => programmeMetadataElements[elementName].documentation,
);

export const swiMLNamespace = swiMLSchemaInfo.namespace;

export function resolveStrokeName(strokeName: string): StandardStrokeType {
  return strokeAliases.get(strokeName) ?? "any";
}

export function resolveEquipmentName(
  equipmentName: string | undefined,
): EquipmentType | "" {
  if (equipmentName === undefined) return "";
  return equipmentAliases.get(equipmentName) ?? "";
}

export function resolveConstantName(
  constantName: string,
): ProgrammeMetadataElementName | undefined {
  return constantAliases.get(constantName);
}

export function serializeConstantValue(
  elementName: ProgrammeMetadataElementName,
  value: string,
): string {
  return programmeMetadataElements[elementName].typeName === "xs:boolean"
    ? value.toLowerCase()
    : value;
}
