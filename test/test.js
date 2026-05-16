import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { fileTests } from "@lezer/generator/dist/test";
import {
  constantNames,
  programmeMetadataElements,
  resolveConstantName,
  resolveStrokeName,
  strokeNames,
  swimdslLanguage,
  swiMLNamespace,
  xslDisplayNames,
} from "../dist/index.js";

const caseDir = path.dirname(fileURLToPath(import.meta.url));

for (const file of fs.readdirSync(caseDir)) {
  if (!file.endsWith(".lezertest")) continue;

  const name = /^[^.]*/.exec(file)?.[0];
  if (!name) continue;

  describe(name, () => {
    for (const test of fileTests(
      fs.readFileSync(path.join(caseDir, file), "utf8"),
      file,
    ))
      it(test.name, () => {
        test.run(swimdslLanguage.parser);
      });
  });
}

describe("swiML metadata generation", () => {
  it("keeps the namespace aligned with the schema", () => {
    assert.equal(swiMLNamespace, "https://github.com/bartneck/swiML");
  });

  it("exposes canonical metadata fields from the XSD", () => {
    assert.equal(programmeMetadataElements.lengthUnit.typeName, "lengthUnits");
    assert.equal(programmeMetadataElements.programDescription.required, false);
    assert.ok(constantNames.includes("ProgramDescription"));
    assert.equal(resolveConstantName("Description"), "programDescription");
  });

  it("keeps stroke aliases mapped onto the schema values", () => {
    assert.ok(strokeNames.includes("Freestyle"));
    assert.equal(resolveStrokeName("NotBreaststroke"), "notBreaststroke");
    assert.equal(resolveStrokeName("NotBreastroke"), "notBreaststroke");
    assert.equal(xslDisplayNames.freestyle, "FR");
  });
});
