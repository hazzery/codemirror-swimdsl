import { parser } from "./syntax.grammar"
import { LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent } from "@codemirror/language"
import { styleTags, tags } from "@lezer/highlight"
import { LRParser } from "@lezer/lr"

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
})

export const swimdslLanguage: LRLanguage = LRLanguage.define({
  name: "swimdsl",
  parser: parserWithMetadata,
  languageData: {
    commentTokens: { line: ";" }
  },
})

export function swimdsl(): LanguageSupport {
  return new LanguageSupport(swimdslLanguage)
}
