import { defineConfig } from "vite-plus";

const coverageConfig = {
  exclude: ["src/**/*.spec.*", "src/**/*.integration.spec.*", "dist/**", "coverage/**"],
  include: ["src/**/*.ts"],
  provider: "v8",
  reporter: ["text", "lcov"],
} as const;

export default defineConfig({
  pack: {
    clean: true,
    dts: true,
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    outDir: "dist",
    platform: "neutral",
    sourcemap: true,
  },
  staged: {
    "*.{js,ts,tsx,mjs,cjs,mts,cts}": "vp check --fix",
  },
  test: {
    coverage: coverageConfig,
    exclude: ["src/**/*.integration.spec.ts"],
    include: ["src/**/*.spec.ts"],
  },
});
