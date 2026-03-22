import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  pack: [
    {
      entry: { index: "src/index.ts" },
      dts: { tsgo: true },
      exports: true,
      format: ["esm"],
      minify: true,
      outDir: "dist",
    },
    {
      entry: { cli: "bin/index.ts" },
      dts: false,
      format: ["esm"],
      outDir: "dist",
      minify: true,
      banner: "#!/usr/bin/env node",
    },
  ],
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
