import { run } from "../src/index";
import { ensureToolryShim, runSetup, readConfig, resolveConfigPaths } from "../src/config";
import pkg from "../package.json" with { type: "json" };
import { bold, cyan, gray } from "colorette";

// Create a symlink to the currently running toolry so that defineTools imports automatically work with node
ensureToolryShim(import.meta.url);

const rawArgs = process.argv.slice(2);
const flags = rawArgs.filter((a) => a.startsWith("-"));
const filePaths = rawArgs.filter((a) => !a.startsWith("-"));

const knownFlags = new Set(["-h", "--help", "-v", "--version", "-s", "--setup"]);
const unknownFlags = flags.filter((f) => !knownFlags.has(f));

if (unknownFlags.length > 0) {
  console.log();
  console.log(
    `  Unknown option${unknownFlags.length > 1 ? "s" : ""}: ${unknownFlags.map((f) => bold(f)).join(", ")}`,
  );
}

if (unknownFlags.length > 0 || flags.includes("-h") || flags.includes("--help")) {
  console.log();
  console.log(bold(cyan("  Toolry Help")));
  console.log();
  console.log(`  ${bold("-h")}, ${bold("--help")}     ${gray("Show this help message")}`);
  console.log(`  ${bold("-v")}, ${bold("--version")}  ${gray("Print the current version")}`);
  console.log(
    `  ${bold("-s")}, ${bold("--setup")}    ${gray("Create ~/.toolry.json config and sample tool")}`,
  );
  console.log();
  console.log(gray(`  Pass .ts plugin files directly:`));
  console.log(gray(`    toolry ./my-plugin.ts ./other-plugin.ts`));
  console.log();
  process.exit(0);
}

if (flags.includes("-v") || flags.includes("--version")) {
  console.log(pkg.version);
  process.exit(0);
}

if (flags.includes("-s") || flags.includes("--setup")) {
  await runSetup();
  process.exit(0);
}

let pluginPaths = filePaths;
let configuredPaths: string[] | undefined;

if (pluginPaths.length === 0) {
  let config = readConfig();
  if (!config) {
    await runSetup();
    config = readConfig();
  }
  if (config) {
    configuredPaths = config.paths;
    pluginPaths = await resolveConfigPaths(config);
  }
}

await run(pluginPaths, {
  name: "Toolry",
  description: "Your developer toolkit",
  configuredPaths,
});
