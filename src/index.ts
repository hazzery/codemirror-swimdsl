import { parser } from "./syntax.grammar"
import { LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent } from "@codemirror/language"
import { styleTags, tags } from "@lezer/highlight"

let parserWithMetadata = parser.configure({
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

export const SwimdslLanguage = LRLanguage.define({
  name: "swimdsl",
  parser: parserWithMetadata,
  languageData: {
    commentTokens: { line: ";" }
  }
})

export function swimdsl() {
  return new LanguageSupport(SwimdslLanguage)
}
