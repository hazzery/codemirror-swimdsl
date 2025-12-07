import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { fileTests } from "@lezer/generator/dist/test";
import { swimdslLanguage } from "../dist/index.js";

const caseDir = path.dirname(fileURLToPath(import.meta.url));

for (const file of fs.readdirSync(caseDir)) {
  if (!file.endsWith(".lezertest")) continue;

  const name = /^[^.]*/.exec(file)?.[0];
  if (!name) continue;

  describe(name, () => {
    for (const { name, run } of fileTests(
      fs.readFileSync(path.join(caseDir, file), "utf8"),
      file,
    ))
      it(name, () => {
        run(swimdslLanguage.parser);
      });
  });
}
