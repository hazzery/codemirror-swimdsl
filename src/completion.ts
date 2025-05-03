import { Completion, CompletionContext } from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";

const strokeList: Completion[] = [
  { label: "Freestyle", type: "constant" },
  { label: "Backstroke", type: "constant" },
  { label: "Breaststroke", type: "constant" },
  { label: "Butterfly", type: "constant" },
];

function completeSwimDSL(context: CompletionContext) {
  let nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);
  // You can examine the node type, its parent, or even the node text to decide what completions to offer
  if (nodeBefore.name === "Stroke" || nodeBefore.parent?.name === "Stroke") {
    // If the cursor is inside or right after a Stroke field, suggest stroke names.
    return {
      from: context.pos,
      options: strokeList,
      validFor: /^[A-Za-z]/
    };
  }
  // For pace keyword completion at the start of a line (e.g., when writing a PaceDefinition)
  if (nodeBefore.name === "Statement" &&
    context.state.doc.lineAt(context.pos).text.trim().startsWith("P")) {
    return {
      from: context.pos,
      options: [{ label: "Pace", type: "keyword", boost: 90 }],
      validFor: /^Pace?/i
    };
  }
  // // If the previous token was the "@" symbol, offer pace alias completions.
  // // One way is to check the text immediately before the cursor.
  // let line = context.state.doc.lineAt(context.pos);
  // let beforeCursor = line.text.slice(0, context.pos - line.from);
  // if (/@\s/.test(beforeCursor)) {
  //   return {
  //     from: context.pos,
  //     options: paceAliasList,
  //     validFor: /^[A-Za-z]*/
  //   };
  // }
  return null;
}

export default completeSwimDSL;
