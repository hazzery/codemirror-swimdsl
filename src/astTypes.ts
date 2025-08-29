export const enum Statements {
  SWIM_INSTRUCTION,
  REST_INSTRUCTION,
  MESSAGE,
  PACE_DEFINITION,
  CONSTANT_DEFINITION,
}

export const enum InstructionModifiers {
  GEAR_SPECIFICATION,
  PACE,
  TIME,
}

export interface Programme {
  statements: Statement[];
}

export type Instruction = SwimInstruction | RestInstruction | Message;

export interface ConstantDefinition {
  statement: Statements.CONSTANT_DEFINITION;
  constantName: string;
  value: string;
}

export type Statement = Instruction | PaceDefinition | ConstantDefinition;

export interface GearSpecification {
  modifier: InstructionModifiers.GEAR_SPECIFICATION;
  gear: string[];
}

export interface Time {
  modifier: InstructionModifiers.TIME;
  minutes: string;
  seconds: string;
}

export type InstructionModifier = GearSpecification | Pace | Time;

export interface SwimInstruction {
  statement: Statements.SWIM_INSTRUCTION;
  repetitions: number;
  instruction: SingleInstruction | BlockInstruction;
  strokeModifier: string;
  instructionModifiers: InstructionModifier[];
}

export interface SingleInstruction {
  isBlock: false;
  distance: string;
  stroke: string;
}

export interface BlockInstruction {
  isBlock: true;
  instructions: Instruction[];
}

export interface RestInstruction {
  statement: Statements.REST_INSTRUCTION;
  minutes: string;
  seconds: string;
}

export interface Intensity {
  isAlias: boolean;
  value: string;
}

export interface Pace {
  modifier: InstructionModifiers.PACE;
  startIntensity: Intensity;
  stopIntensity?: Intensity;
}

export interface PaceDefinition {
  statement: Statements.PACE_DEFINITION;
  name: string;
  pace: Pace;
}

export interface Message {
  statement: Statements.MESSAGE;
  message: string;
}
