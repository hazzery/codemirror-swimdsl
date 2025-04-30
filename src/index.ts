import { LRLanguage, LanguageSupport, delimitedIndent, foldInside, foldNodeProp, indentNodeProp } from "@codemirror/language";
import { styleTags, tags } from "@lezer/highlight";
import { LRParser } from "@lezer/lr";
import { parser } from "./syntax.grammar";

let parserWithMetadata: LRParser = parser.configure({
  props: [
    indentNodeProp.add({
      Application: delimitedIndent({ closing: ")", align: false })
    }),
    foldNodeProp.add({
      Application: foldInside
    }),
    styleTags({
      Identifier: tags.variableName,
      Boolean: tags.bool,
      String: tags.string,
      LineComment: tags.lineComment,
      "( )": tags.paren
    })
  ]
});

export const swimdslLanguage: LRLanguage = LRLanguage.define({
  name: "swimdsl",
  parser: parserWithMetadata,
  languageData: {
    commentTokens: { line: ";" }
  },
});

export function swimdsl(): LanguageSupport {
  return new LanguageSupport(swimdslLanguage);
}
