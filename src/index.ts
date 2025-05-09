import {
  LRLanguage,
  LanguageSupport,
  delimitedIndent,
  foldInside,
  foldNodeProp,
  indentNodeProp,
} from "@codemirror/language";
import { styleTags, tags } from "@lezer/highlight";
import { LRParser } from "@lezer/lr";

import completeSwimDsl from "./completion";
import { definedIdentifiersField } from "./definedIdentifiers";
import swimdslLinter from "./lint";
import { parser } from "./syntax.grammar";

const parserWithMetadata: LRParser = parser.configure({
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

const swimdslLanguage: LRLanguage = LRLanguage.define({
  name: "swimdsl",
  parser: parserWithMetadata,
  languageData: {
    commentTokens: { line: "#" },
    autocomplete: completeSwimDsl,
    closeBrackets: ["{"],
  },
});

export function swimdsl(): LanguageSupport {
  return new LanguageSupport(swimdslLanguage, [
    definedIdentifiersField.extension,
    swimdslLinter,
  ]);
}
