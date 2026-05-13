import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const xsdPath = path.join(repoRoot, "swiML.xsd");
const xslPath = path.join(repoRoot, "swiML.xsl");
const outputPath = path.join(repoRoot, "src", "generatedSwimlModel.ts");

/**
 * @typedef {{
 *   name: string;
 *   attributes: Record<string, string>;
 *   children: XmlNode[];
 * }} XmlElementNode
 */

/**
 * @typedef {{
 *   type: "text";
 *   value: string;
 * }} XmlTextNode
 */

/** @typedef {XmlElementNode | XmlTextNode} XmlNode */

/**
 * Parse a constrained subset of XML into a lightweight tree.
 *
 * The schema and stylesheet files in this repository only use features that
 * this parser understands: tags, attributes, comments, declarations, and text.
 *
 * @param {string} source
 * @returns {XmlElementNode}
 */
function parseXml(source) {
  /** @type {XmlElementNode} */
  const root = { name: "#document", attributes: {}, children: [] };
  /** @type {XmlElementNode[]} */
  const stack = [root];
  const tokenRegex =
    /<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\/?[^>]+>|[^<]+/g;

  for (const token of source.match(tokenRegex) ?? []) {
    if (
      token.startsWith("<?") ||
      token.startsWith("<!--") ||
      token.startsWith("<![CDATA[")
    ) {
      continue;
    }

    if (token.startsWith("</")) {
      stack.pop();
      continue;
    }

    if (!token.startsWith("<")) {
      if (token.trim().length === 0) continue;
      stack.at(-1)?.children.push({ type: "text", value: token });
      continue;
    }

    const selfClosing = token.endsWith("/>");
    const rawTag = token.slice(1, selfClosing ? -2 : -1).trim();
    const spaceIndex = rawTag.search(/\s/);
    const name = spaceIndex === -1 ? rawTag : rawTag.slice(0, spaceIndex);
    const attributeSource = spaceIndex === -1 ? "" : rawTag.slice(spaceIndex + 1);

    /** @type {Record<string, string>} */
    const attributes = {};
    for (const match of attributeSource.matchAll(
      /([^\s=]+)\s*=\s*"([^"]*)"/g,
    )) {
      attributes[match[1]] = match[2];
    }

    /** @type {XmlElementNode} */
    const element = { name, attributes, children: [] };
    stack.at(-1)?.children.push(element);

    if (!selfClosing) {
      stack.push(element);
    }
  }

  return root;
}

/**
 * @param {XmlNode} node
 * @returns {node is XmlElementNode}
 */
function isElement(node) {
  return node.type !== "text";
}

/**
 * @param {XmlElementNode} node
 * @returns {string}
 */
function textContent(node) {
  return node.children
    .map((child) => (isElement(child) ? textContent(child) : child.value))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {XmlElementNode} node
 * @param {(candidate: XmlElementNode) => boolean} predicate
 * @returns {XmlElementNode | undefined}
 */
function findFirst(node, predicate) {
  for (const child of node.children) {
    if (!isElement(child)) continue;
    if (predicate(child)) return child;

    const nested = findFirst(child, predicate);
    if (nested) return nested;
  }

  return undefined;
}

/**
 * @param {XmlElementNode} node
 * @param {(candidate: XmlElementNode) => boolean} predicate
 * @returns {XmlElementNode[]}
 */
function findAll(node, predicate) {
  /** @type {XmlElementNode[]} */
  const matches = [];

  for (const child of node.children) {
    if (!isElement(child)) continue;
    if (predicate(child)) {
      matches.push(child);
    }
    matches.push(...findAll(child, predicate));
  }

  return matches;
}

/**
 * @param {XmlElementNode} node
 * @param {string} name
 * @returns {XmlElementNode[]}
 */
function childElements(node, name) {
  return node.children.filter(
    (child) => isElement(child) && child.name === name,
  );
}

/**
 * @param {XmlElementNode} node
 * @returns {string}
 */
function getDocumentation(node) {
  const documentation = findFirst(
    node,
    (candidate) => candidate.name === "xs:documentation",
  );

  return documentation ? textContent(documentation) : "";
}

/**
 * @param {string} value
 * @returns {string}
 */
function tsString(value) {
  return JSON.stringify(value);
}

/**
 * @param {readonly string[]} values
 * @returns {string}
 */
function tsStringArray(values) {
  return values.map((value) => `  ${tsString(value)},`).join("\n");
}

/**
 * @param {Record<string, string>} values
 * @returns {string}
 */
function tsObject(values) {
  return Object.entries(values)
    .map(([key, value]) => `  ${JSON.stringify(key)}: ${tsString(value)},`)
    .join("\n");
}

/**
 * @param {Record<string, { typeName: string; required: boolean; defaultValue: string | null; documentation: string }>} values
 * @returns {string}
 */
function tsMetadataObject(values) {
  return Object.entries(values)
    .map(
      ([key, value]) => `  ${JSON.stringify(key)}: {
    typeName: ${tsString(value.typeName)},
    required: ${value.required},
    defaultValue: ${
      value.defaultValue === null ? "null" : tsString(value.defaultValue)
    },
    documentation: ${tsString(value.documentation)},
  },`,
    )
    .join("\n");
}

const schemaSource = fs.readFileSync(xsdPath, "utf8");
const stylesheetSource = fs.readFileSync(xslPath, "utf8");
const schemaTree = parseXml(schemaSource);
const stylesheetTree = parseXml(stylesheetSource);

const schemaNode = findFirst(schemaTree, (node) => node.name === "xs:schema");
if (!schemaNode) {
  throw new Error("Unable to locate xs:schema in swiML.xsd");
}

const simpleTypeNodes = findAll(
  schemaNode,
  (node) => node.name === "xs:simpleType" && typeof node.attributes.name === "string",
);

/** @type {Record<string, string[]>} */
const enumerationsByType = {};
for (const simpleTypeNode of simpleTypeNodes) {
  const typeName = simpleTypeNode.attributes.name;
  const enumerations = findAll(
    simpleTypeNode,
    (node) => node.name === "xs:enumeration" && typeof node.attributes.value === "string",
  ).map((node) => node.attributes.value);

  if (enumerations.length > 0) {
    enumerationsByType[typeName] = enumerations;
  }
}

const programElement = findFirst(
  schemaNode,
  (node) => node.name === "xs:element" && node.attributes.name === "program",
);
if (!programElement) {
  throw new Error("Unable to locate the program element in swiML.xsd");
}

const programComplexType = childElements(programElement, "xs:complexType")[0];
const programSequence = programComplexType
  ? childElements(programComplexType, "xs:sequence")[0]
  : undefined;

if (!programSequence) {
  throw new Error("Unable to locate the program sequence in swiML.xsd");
}

/** @type {Record<string, { typeName: string; required: boolean; defaultValue: string | null; documentation: string }>} */
const programmeMetadataElements = {};
for (const child of childElements(programSequence, "xs:element")) {
  const elementName = child.attributes.name;
  if (elementName === "author" || elementName === "instruction" || !elementName) {
    continue;
  }

  programmeMetadataElements[elementName] = {
    typeName: child.attributes.type ?? "xs:string",
    required: child.attributes.minOccurs !== "0",
    defaultValue: child.attributes.default ?? null,
    documentation: getDocumentation(child),
  };
}

const translationContainer = findFirst(
  stylesheetTree,
  (node) => node.name === "myData:translation",
);
if (!translationContainer) {
  throw new Error("Unable to locate the XSL translation table in swiML.xsl");
}

/** @type {Record<string, string>} */
const xslDisplayNames = {};
for (const termNode of childElements(translationContainer, "term")) {
  const index = termNode.attributes.index;
  if (!index || Object.hasOwn(xslDisplayNames, index)) continue;

  xslDisplayNames[index] = textContent(termNode);
}

const enumeratedTypeNames = Object.keys(enumerationsByType).sort();

const fileContents = `/**
 * This file is generated from \`swiML.xsd\` and \`swiML.xsl\`.
 * Run \`npm run generate:swiml\` after updating either source file.
 */

export const swiMLSchemaInfo = {
  namespace: ${tsString(schemaNode.attributes.targetNamespace ?? "")},
  version: ${tsString(schemaNode.attributes.version ?? "")},
} as const;

${enumeratedTypeNames
  .map(
    (typeName) => `export const ${typeName} = [
${tsStringArray(enumerationsByType[typeName])}
] as const;

export type ${typeName[0].toUpperCase()}${typeName.slice(1)} = (typeof ${typeName})[number];`,
  )
  .join("\n\n")}

export const programmeMetadataElements = {
${tsMetadataObject(programmeMetadataElements)}
} as const;

export type ProgrammeMetadataElementName = keyof typeof programmeMetadataElements;

export const xslDisplayNames = {
${tsObject(xslDisplayNames)}
} as const;
`;

fs.writeFileSync(outputPath, `${fileContents}\n`);
