import { create } from "xmlbuilder2";
import {
  ConstantDefinition,
  Instruction,
  InstructionModifier,
  InstructionModifiers,
  Intensity,
  Message,
  Programme,
  RestInstruction,
  Statements,
  SwimInstruction,
} from "./astTypes";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

const XML_NAMESPACE = "https://github.com/bartneck/swiML";
const XSI_LINK = "http://www.w3.org/2001/XMLSchema-instance";
const SCHEMA_LOCATION =
  "https://github.com/bartneck/swiML https://raw.githubusercontent.com/bartneck/swiML/main/version/latest/swiML.xsd";

/**
 * Format the given duration value for use within XML.
 *
 * @param minutes - A string containing a number from 0 to 59.
 * @param seconds - A string containing a number from 0 to 59.
 *
 * @returns A correctly formatted XML duration string.
 */
function xmlDuration(minutes: string, seconds: string): string {
  let durationString = "PT";
  if (Number(minutes) > 0) {
    durationString += minutes;
    durationString += "M";
  }
  if (Number(seconds) > 0) {
    durationString += seconds;
    durationString += "S";
  }
  return durationString;
}

/**
 * Write an AST Instruction node into the XML document.
 *
 * @param xmlParent - The parent XML node to write the instruction inside of.
 * @param instruction - The AST instruction node to write as XML.
 */
function writeInstruction(
  xmlParent: XMLBuilder,
  instruction: Instruction,
): void {
  switch (instruction.statement) {
    case Statements.SWIM_INSTRUCTION:
      writeSwimInstruction(xmlParent, instruction);
      break;

    case Statements.REST_INSTRUCTION:
      writeRestInstruction(xmlParent, instruction);
      break;
    case Statements.MESSAGE:
      writeMessage(xmlParent, instruction);
      break;
  }
}

/**
 * Write an AST Intensity node into the XML document.
 *
 * @param xmlParent - The parent XML node to write the intensity inside of.
 * @param intensity - The AST intensity node to write as XML.
 */
function writeIntensity(xmlParent: XMLBuilder, intensity: Intensity): void {
  if (intensity.isAlias) {
    xmlParent.ele("zone").txt(intensity.value);
  } else {
    xmlParent.ele("percentageEffort").txt(intensity.value);
  }
}

/**
 * Write an AST InstructionModifier node into the XML document.
 *
 * @param xmlParent - The parent XML node to write the instruction modifier
 *    inside of.
 * @param modifier - The AST instruction modifier node to write as XML.
 */
function writeInstructionModifier(
  xmlParent: XMLBuilder,
  modifier: InstructionModifier,
): void {
  switch (modifier.modifier) {
    case InstructionModifiers.PACE:
      const intensity = xmlParent.ele("intensity");

      writeIntensity(intensity.ele("startIntensity"), modifier.startIntensity);

      if (modifier.stopIntensity) {
        writeIntensity(intensity.ele("stopIntensity"), modifier.stopIntensity);
      }
      break;

    case InstructionModifiers.GEAR_SPECIFICATION:
      for (const gear of modifier.gear) {
        xmlParent.ele("equipment").txt(gear);
      }
      break;

    case InstructionModifiers.TIME:
      xmlParent
        .ele("rest")
        .ele("sinceStart")
        .txt(xmlDuration(modifier.minutes, modifier.seconds));
      break;
  }
}

/**
 * Write an AST SwimInstruction node into the XML document.
 *
 * @param xmlParent - The parent XML node to write the instruction inside of.
 * @param instruction - The AST swim instruction node to write as XML.
 */
function writeSwimInstruction(
  xmlParent: XMLBuilder,
  instruction: SwimInstruction,
): void {
  let parent = xmlParent.ele("instruction");

  if (instruction.repetitions > 1) {
    parent = parent.ele("repetition");
    parent.ele("repetitionCount").txt(String(instruction.repetitions)).up();
  }

  if (instruction.instruction.isBlock) {
    for (const subInstruction of instruction.instruction.instructions) {
      writeInstruction(parent, subInstruction);
    }
  } else {
    parent
      .ele("length")
      .ele("lengthAsDistance")
      .txt(instruction.instruction.distance);
    parent
      .ele("stroke")
      .ele("standardStroke")
      .txt(instruction.instruction.stroke);
  }

  if (instruction.instructionModifiers.length > 0) {
    for (const modifier of instruction.instructionModifiers) {
      writeInstructionModifier(parent, modifier);
    }
  }
}

/**
 * Write an AST RestInstruction node into the XML document.
 *
 * @param xmlParent - The parent XML node to write the rest instruction inside
 *    of.
 * @param instruction - The AST rest instruction node to write as XML.
 */
function writeRestInstruction(
  xmlParent: XMLBuilder,
  instruction: RestInstruction,
): void {
  xmlParent
    .ele("instruction")
    .ele("rest")
    .ele("afterStop")
    .txt(xmlDuration(instruction.minutes, instruction.seconds));
}

/**
 * Write an AST Message node into the XML document.
 *
 * @param xmlParent - The parent XML node to write the message inside of.
 * @param instruction - The AST message node to write as XML.
 */
function writeMessage(xmlParent: XMLBuilder, instruction: Message): void {
  xmlParent.ele("instruction").ele("segmentName").txt(instruction.message);
}

function writeConstantDefinition(
  xmlParent: XMLBuilder,
  definition: ConstantDefinition,
) {
  switch (definition.constantName) {
    case "Title":
      xmlParent.ele("title").txt(definition.value);
      break;

    case "Author":
      xmlParent.ele("author").ele("firstName").txt(definition.value);
      break;

    case "Description":
      xmlParent.ele("programDescription").txt(definition.value);
      break;

    case "Date":
      xmlParent.ele("creationDate").txt(definition.value);
      break;

    case "PoolLength":
      xmlParent.ele("poolLength").txt(definition.value);
      break;

    case "LengthUnit":
      xmlParent.ele("lengthUnit").txt(definition.value);
      break;

    case "Align":
      xmlParent.ele("programAlign").txt(definition.value);
      break;

    case "NumeralSystem":
      xmlParent.ele("numeralSystem").txt(definition.value);
      break;

    case "HideIntro":
      xmlParent.ele("hideIntro").txt(definition.value);
      break;

    case "LayoutWidth":
      xmlParent.ele("layoutWidth").txt(definition.value);
      break;
  }
}

/**
 * Given a complete AST for a SwimDSL document, generate a valid swiML XML
 * document describing the same programme.
 *
 * @param programme - The AST of a SwimDSL programme.
 *
 * @returns A correctly formed swiML XML document exactly describing the
 *    content in `programme`.
 */
export default function emitXml(programme: Programme): string {
  const doc = create({ version: "1.0", encoding: "UTF-8" }).ele("program", {
    xmlns: XML_NAMESPACE,
    "xmlns:xsi": XSI_LINK,
    "xsi:schemaLocation": SCHEMA_LOCATION,
  });

  for (const statement of programme.statements) {
    switch (statement.statement) {
      case Statements.SWIM_INSTRUCTION:
        writeSwimInstruction(doc, statement);
        break;

      case Statements.REST_INSTRUCTION:
        writeRestInstruction(doc, statement);
        break;

      case Statements.MESSAGE:
        writeMessage(doc, statement);
        break;

      case Statements.PACE_DEFINITION:
        break;

      case Statements.CONSTANT_DEFINITION:
        writeConstantDefinition(doc, statement);
        break;
    }
  }

  return doc.end({ prettyPrint: true });
}
