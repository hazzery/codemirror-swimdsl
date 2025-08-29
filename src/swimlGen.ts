import { create } from "xmlbuilder2";
import {
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

function writeIntensity(xmlParent: XMLBuilder, intensity: Intensity): void {
  if (intensity.isAlias) {
    xmlParent.ele("zone").txt(intensity.value);
  } else {
    xmlParent.ele("percentageEffort").txt(intensity.value);
  }
}

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

function writeMessage(xmlParent: XMLBuilder, instruction: Message): void {
  xmlParent.ele("instruction").ele("segmentName").txt(instruction.message);
}

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
        doc.ele("pace").att("pace", statement.name).txt(String(statement.pace));
        break;

      case Statements.CONSTANT_DEFINITION:
        doc.ele(statement.constantName).txt(statement.value);
        break;
    }
  }

  return doc.end({ prettyPrint: true });
}
