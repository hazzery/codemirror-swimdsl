import { LRLanguage, LanguageSupport, delimitedIndent, foldInside, foldNodeProp, indentNodeProp } from "@codemirror/language";
import { styleTags, tags } from "@lezer/highlight";
import { LRParser } from "@lezer/lr";

import completeSwimDsl from "./completion";
import swimdslLinter from "./lint";
import { parser } from "./syntax.grammar";

let parserWithMetadata: LRParser = parser.configure({
  props: [
    indentNodeProp.add({
      Application: delimitedIndent({ closing: ")", align: false }),
    }),
    foldNodeProp.add({
      Application: foldInside,
    }),
    styleTags({
      Stroke: tags.className,
      StrokeType: tags.typeName,
      Duration: tags.integer,
      Percentage: tags.integer,
      Number: tags.integer,
      Identifier: tags.variableName,
      RequiredGear: tags.macroName,
      Comment: tags.comment,
    }),
  ],
});

export const swimdslLanguage: LRLanguage = LRLanguage.define({
  name: "swimdsl",
  parser: parserWithMetadata,
  languageData: {
    commentTokens: { line: "#" },
  },
});

export const swimdslCompletion = swimdslLanguage.data.of({
  autocomplete: completeSwimDsl,
});

export function swimdsl(): LanguageSupport {
  return new LanguageSupport(swimdslLanguage, [swimdslCompletion, swimdslLinter]);
}
