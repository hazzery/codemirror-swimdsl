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

/**
 * The SwimDSL parser configuration.
 */
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
      StrokeModifier: tags.typeName,
      Duration: tags.integer,
      Percentage: tags.integer,
      Number: tags.integer,
      Identifier: tags.variableName,
      RequiredGear: tags.macroName,
      Comment: tags.comment,
      SetKeyword: tags.keyword,
      RestKeyword: tags.keyword,
      PaceKeyword: tags.keyword,
      OnKeyword: tags.keyword,
    }),
  ],
});

/**
 * The SwimDSL language supoort configuration for CodeMirror.
 */
const swimdslLanguage: LRLanguage = LRLanguage.define({
  name: "swimdsl",
  parser: parserWithMetadata,
  languageData: {
    commentTokens: { line: "#" },
    autocomplete: completeSwimDsl,
    closeBrackets: ["{"],
  },
});

/**
 * Provide the configured CodeMirror language support extension.
 *
 * @returns A CodeMirror extension which provides support for SwimDSL.
 */
export function swimdsl(): LanguageSupport {
  return new LanguageSupport(swimdslLanguage, [
    definedIdentifiersField.extension,
    swimdslLinter,
  ]);
}
