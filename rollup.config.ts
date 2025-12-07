import typescript from "@rollup/plugin-typescript";
import type { RollupOptions } from "rollup";
import { lezer } from "@lezer/generator/rollup";

const config: RollupOptions = {
  input: "src/index.ts",
  external: (id: string) => id !== "tslib" && !/^(\.?\/|\w:)/.test(id),
  output: [
    { file: "dist/index.cjs", format: "cjs" },
    { dir: "./dist", format: "es" },
  ],
  plugins: [
    lezer(),
    typescript({
      tsconfig: "./tsconfig.lib.json",
    }),
  ],
};

export default config;
