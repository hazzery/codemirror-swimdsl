import { TreeCursor } from "@lezer/common";
import {
  BlockInstruction,
  ConstantDefinition,
  Instruction,
  InstructionModifier,
  InstructionModifiers,
  Message,
  Pace,
  PaceDefinition,
  Programme,
  RestInstruction,
  SingleInstruction,
  Statement,
  Statements,
  SwimInstruction,
} from "./astTypes";
import { EditorState } from "@codemirror/state";

/**
 * Create an AST node for a `pace` CST node.
 *
 * Precondition: `cursor` points to one of `Number`, `VariableRate`, or
 * `PaceAlias`.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `Pace` AST node.
 */
function visitPace(cursor: TreeCursor, state: EditorState): Pace {
  if (cursor.name === "Number") {
    return {
      modifier: InstructionModifiers.FIXED_PACE,
      percentage: state.sliceDoc(cursor.from, cursor.to),
    };
  }

  if (cursor.name === "VariableRate") {
    // Move down to the start rate
    cursor.firstChild();
    const startPercentage = state.sliceDoc(cursor.from, cursor.to);

    // Move to the finish percentage
    cursor.nextSibling();
    const finishPercentage = state.sliceDoc(cursor.from, cursor.to);

    // Move up out of the VariableRate
    cursor.parent();

    return {
      modifier: InstructionModifiers.VARYING_PACE,
      startPercentage,
      finishPercentage,
    };
  }

  return {
    modifier: InstructionModifiers.PACE_ALIAS,
    alias: state.sliceDoc(cursor.from, cursor.to),
  };
}

/**
 * Create an AST node for a `PaceDefinition` CST node.
 *
 * Precondition: `cursor` points to a `PaceAlias`.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `PaceDefinition` AST node.
 */
function visitPaceDefinition(
  cursor: TreeCursor,
  state: EditorState,
): PaceDefinition {
  // Move into PaceDefinitionName
  cursor.firstChild();
  const name = state.sliceDoc(cursor.from, cursor.to);

  // Move into Number (fixed percentage) | VariableRate | PaceAlias
  cursor.nextSibling();
  const pace = visitPace(cursor, state);

  // Move up out of the PaceDefinition
  cursor.parent();

  return { statement: Statements.PACE_DEFINITION, name, pace };
}

/**
 * Create an AST node for an `instruction` CST node.
 *
 * Precondition: `cursor` points to any of `SwimInstruction`,
 * `RestInstruction`, or `Message`.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns An `Instruction` AST node.
 */
function visitInstruction(cursor: TreeCursor, state: EditorState): Instruction {
  if (cursor.name === "SwimInstruction") {
    return visitSwimInstruction(cursor, state);
  }

  if (cursor.name === "RestInstruction") {
    return visitRestInstruction(cursor, state);
  }

  return visitMessage(cursor, state);
}

/**
 * Create an AST node for a `Duration` CST node.
 *
 * Precondition: `cursor` points to a `Duration` node.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `PaceDefinition` AST node.
 */
function visitDuration(
  cursor: TreeCursor,
  state: EditorState,
): { minutes: string; seconds: string } {
  // Move down to minutes Number
  cursor.firstChild();
  const minutes = state.sliceDoc(cursor.from, cursor.to);

  // Move to seconds Number
  cursor.nextSibling();
  const seconds = state.sliceDoc(cursor.from, cursor.to);

  // Move back up to Duration
  cursor.parent();

  return { minutes, seconds };
}

/**
 * Create an AST node for an `InstructionModifier` CST node.
 *
 * Precondition: `cursor` points to one of `GearSpecification`,
 * `PaceSpecification`, or `Duration`.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns An `InstructionModifier` AST node.
 */
function visitInstructionModifier(
  cursor: TreeCursor,
  state: EditorState,
): InstructionModifier {
  if (cursor.name === "GearSpecification") {
    const gear: string[] = [];

    // Move down into first RequiredGear
    cursor.firstChild();

    do {
      gear.push(state.sliceDoc(cursor.from, cursor.to));
    } while (cursor.nextSibling());

    // Step back up to the GearSpecification
    cursor.parent();

    return {
      modifier: InstructionModifiers.GEAR_SPECIFICATION,
      gear,
    };
  }

  if (cursor.name === "PaceSpecification") {
    // Move into Number | VariableRate | PaceAlias
    cursor.firstChild();
    const pace = visitPace(cursor, state);

    // Move back up to PaceSpecification
    cursor.parent();

    return pace;
  }

  // We are in Duration
  const duration = visitDuration(cursor, state);

  return {
    modifier: InstructionModifiers.TIME,
    ...duration,
  };
}

/**
 * Create an AST node for a `SwimInstruction` CST node.
 *
 * Precondition: `cursor` points to a `SwimInstruction` node.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `SwimInstruction` AST node.
 */
function visitSwimInstruction(
  cursor: TreeCursor,
  state: EditorState,
): SwimInstruction {
  let repetitions = 1;
  let strokeModifier = "default";
  let instruction: SingleInstruction | BlockInstruction;
  const instructionModifiers: InstructionModifier[] = [];

  // Move into either Number (for repetitions) or SingleInstruction |
  // BlockInstruction
  cursor.firstChild();

  if (cursor.name === "Number") {
    repetitions = Number(state.sliceDoc(cursor.from, cursor.to));

    // Move into SingleInstruction | BlockInstruction
    cursor.nextSibling();
  }

  if (cursor.name === "BlockInstruction") {
    // Move into first Instruction of the block
    cursor.firstChild();

    const instructions: Instruction[] = [];
    do {
      instructions.push(visitInstruction(cursor, state));
    } while (cursor.nextSibling());

    instruction = { isBlock: true, instructions };
  } else {
    // Move into Number
    cursor.firstChild();
    const distance = state.sliceDoc(cursor.from, cursor.to);

    // Move into Stroke
    cursor.nextSibling();
    const stroke = state.sliceDoc(cursor.from, cursor.to);

    instruction = { isBlock: false, distance, stroke };
  }
  // Move back up to SingleInstruction | BlockInstruction
  cursor.parent();

  if (cursor.nextSibling()) {
    let hasModifiers = true;
    if (cursor.name === "StrokeModifier") {
      strokeModifier = state.sliceDoc(cursor.from, cursor.to);

      // Move away from the StrokeModifier to a potential instruction modifier.
      hasModifiers = cursor.nextSibling();
    }

    if (hasModifiers) {
      do {
        instructionModifiers.push(visitInstructionModifier(cursor, state));
      } while (cursor.nextSibling());
    }
  }

  // Move up out of the SwimInstruction
  cursor.parent();

  return {
    statement: Statements.SWIM_INSTRUCTION,
    repetitions,
    instruction,
    strokeModifier,
    instructionModifiers,
  };
}

/**
 * Create an AST node for a `RestInstruction` CST node.
 *
 * Precondition: `cursor` points to a `RestInstruction` node.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `RestInstruction` AST node.
 */
function visitRestInstruction(
  cursor: TreeCursor,
  state: EditorState,
): RestInstruction {
  // Move down to Duration
  cursor.firstChild();

  const duration = visitDuration(cursor, state);

  // Move back up to RestInstruction
  cursor.parent();

  return {
    statement: Statements.REST_INSTRUCTION,
    ...duration,
  };
}

/**
 * Create an AST node for a `Message` CST node.
 *
 * Precondition: `cursor` points to a `Message` node.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `Message` AST node.
 */
function visitMessage(cursor: TreeCursor, state: EditorState): Message {
  return {
    statement: Statements.MESSAGE,
    message: state.sliceDoc(cursor.from, cursor.to),
  };
}

/**
 * Create an AST node for a `ConstantDefinition` CST node.
 *
 * Precondition: `cursor` points to a `ConstantDefinition` node.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `ConstantDefinition` AST node.
 */
function visitConstantDefinition(
  cursor: TreeCursor,
  state: EditorState,
): ConstantDefinition {
  // Move into ConstantDefinition
  cursor.firstChild();
  const constantName = state.sliceDoc(cursor.from, cursor.to);

  // Move into Number | StringValue
  cursor.nextSibling();
  let value: string = state.sliceDoc(cursor.from, cursor.to);

  // Move up out of the ConstantDefinition
  cursor.parent();
  return {
    statement: Statements.CONSTANT_DEFINITION,
    constantName,
    value,
  };
}

/**
 * Create an AST for the current program in `state`.
 *
 * Precondition: `cursor` points to the topmost node (`SwimProgramme`).
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns An AST as an objection holding a list of top level statements.
 */
export default function buildAst(
  cursor: TreeCursor,
  state: EditorState,
): Programme {
  const statements: Statement[] = [];

  function walk(): void {
    do {
      let node: Statement | null = null;

      switch (cursor.type.name) {
        case "SwimInstruction":
          node = visitSwimInstruction(cursor, state);
          break;
        case "RestInstruction":
          node = visitRestInstruction(cursor, state);
          break;
        case "Message":
          node = visitMessage(cursor, state);
          break;
        case "PaceDefinition":
          node = visitPaceDefinition(cursor, state);
          break;
        case "ConstantDefinition":
          node = visitConstantDefinition(cursor, state);
          break;
        default:
          break;
      }

      if (node !== null) {
        statements.push(node);
      }
    } while (cursor.nextSibling());
  }

  cursor.firstChild();
  walk();
  return { statements };
}
