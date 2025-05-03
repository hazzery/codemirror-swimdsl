import { Completion, CompletionContext } from "@codemirror/autocomplete";
import { LRLanguage, LanguageSupport, delimitedIndent, foldInside, foldNodeProp, indentNodeProp, syntaxTree } from "@codemirror/language";
import { Diagnostic, linter } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { styleTags, tags } from "@lezer/highlight";
import { LRParser } from "@lezer/lr";
import { parser } from "./syntax.grammar";

const strokeList: Completion[] = [
  { label: "Freestyle", type: "constant" },
  { label: "Backstroke", type: "constant" },
  { label: "Breaststroke", type: "constant" },
  { label: "Butterfly", type: "constant" }
];

let parserWithMetadata: LRParser = parser.configure({
  props: [
    indentNodeProp.add({
      Application: delimitedIndent({ closing: ")", align: false })
    }),
    foldNodeProp.add({
      Application: foldInside
    }),
    styleTags({
      Stroke: tags.className,
      Duration: tags.integer,
      Percentage: tags.integer,
      Number: tags.integer,
      Identifier: tags.variableName,
      Comment: tags.comment,
    })
  ]
});

export const swimdslLanguage: LRLanguage = LRLanguage.define({
  name: "swimdsl",
  parser: parserWithMetadata,
  languageData: {
    commentTokens: { line: "#" }
  },
});

function lintSwimDsl(view: EditorView) {
  let diagnostics: Diagnostic[] = [];

  syntaxTree(view.state).cursor().iterate(node => {
    if (node.name == "Identifier") {
      diagnostics.push({
        from: node.from,
        to: node.to,
        severity: "error",
        message: "This is an Identifier",
      });
    }
  });

  return diagnostics;
}

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

export const swimdslCompletion = swimdslLanguage.data.of({
  autocomplete: completeSwimDSL
});

export const swimdslLinter = linter(lintSwimDsl);


export function swimdsl(): LanguageSupport {
  return new LanguageSupport(swimdslLanguage, [swimdslCompletion, swimdslLinter]);
}
