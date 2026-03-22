import { confirm } from "@clack/prompts";
import { bold, cyan, gray, green, red } from "colorette";
import { homedir, platform } from "os";
import { resolve, join } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { parseModule, generateCode } from "magicast";
import { glob } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { catalog } from "./tools-catalog.js";

export interface ToolryConfig {
  paths: string[];
}

const DEFAULT_PATHS = ["~/.toolry/*.ts"];

export function getDefaultConfigPath(): string {
  const home = homedir();
  if (platform() === "win32") {
    return join(home, ".toolry.json");
  }
  return join(home, ".toolry.json");
}

export function expandHome(p: string): string {
  if (p.startsWith("~/") || p === "~") {
    return join(homedir(), p.slice(2));
  }
  return p;
}

export function readConfig(configPath?: string): ToolryConfig | null {
  const filePath = configPath ?? getDefaultConfigPath();
  if (!existsSync(filePath)) return null;
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as ToolryConfig;
    if (!Array.isArray(parsed.paths)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConfig(config: ToolryConfig, configPath: string): void {
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export async function resolveConfigPaths(config: ToolryConfig): Promise<string[]> {
  const resolved: string[] = [];
  for (const pattern of config.paths) {
    const expanded = expandHome(pattern);
    if (expanded.includes("*") || expanded.includes("?") || expanded.includes("{")) {
      let matches: string[] = [];
      try {
        matches = await Array.fromAsync(glob(expanded));
      } catch {
        // directory doesn't exist yet — skip
      }
      resolved.push(...matches.map((m) => resolve(m)));
    } else {
      resolved.push(resolve(expanded));
    }
  }
  return resolved;
}

export async function runSetup(): Promise<void> {
  const configPath = getDefaultConfigPath();
  const toolryDir = join(homedir(), ".toolry");
  const samplePath = join(toolryDir, "hello.ts");

  console.log();
  console.log(bold(cyan("  Toolry setup")));
  console.log();

  const alreadyExists = existsSync(configPath) || existsSync(toolryDir);
  if (alreadyExists) {
    const ok = await confirm({
      message: `${configPath} and ~/.toolry/ already exist. Re-run setup and overwrite?`,
      initialValue: false,
    });
    if (!ok || typeof ok !== "boolean") {
      console.log("\n  Cancelled.\n");
      return;
    }
    console.log();
  }

  const config: ToolryConfig = { paths: DEFAULT_PATHS };
  writeConfig(config, configPath);

  mkdirSync(toolryDir, { recursive: true });
  if (!existsSync(samplePath)) {
    writeFileSync(
      samplePath,
      `import { defineTools } from 'toolry'\n\nexport default defineTools(\n  {\n    name: 'hello-world',\n    description: 'A sample tool — edit or delete this file',\n    category: 'Examples',\n    args: {\n      who: {\n        type: 'text',\n        description: 'Who to greet',\n        default: 'World',\n      },\n    },\n    askToRun: false,\n    run: ({ who }) => \`echo "Hello \${who}!"\`,\n  },\n)\n`,
      "utf-8",
    );
  }

  console.log(`  ${bold("Config")}      → ${cyan(configPath)}`);
  console.log(`  ${bold("Sample tool")} → ${cyan(samplePath)}`);
  console.log();
  console.log(gray(`  Add more .ts tool files to ${bold("~/.toolry/")} and run:`));
  console.log(gray(`    npx toolry`));
  console.log();
}

export function addTool(toolPath: string): void {
  const entry = catalog[toolPath];

  if (!entry) {
    const available = Object.keys(catalog)
      .map((k) => `    ${bold(k)}  ${gray(catalog[k].description)}`)
      .join("\n");
    console.log();
    console.log(`  ${red(`Unknown tool: ${bold(toolPath)}`)}`);
    console.log();
    console.log(`  Available tools:`);
    console.log(available);
    console.log();
    return;
  }

  const [fileName] = toolPath.split("/");
  const toolryDir = join(homedir(), ".toolry");
  const filePath = join(toolryDir, `${fileName}.ts`);

  mkdirSync(toolryDir, { recursive: true });

  if (!existsSync(filePath)) {
    writeFileSync(filePath, `import { defineTool } from 'toolry'\n\n${entry.code}\n`, "utf-8");
  } else {
    const existing = readFileSync(filePath, "utf-8");
    if (existing.includes(`export const ${entry.exportName}`)) {
      console.log();
      console.log(`  ${bold(entry.exportName)} already exists in ${cyan(filePath)}`);
      console.log();
      return;
    }

    // Use magicast to reliably add the import if it's missing
    const mod = parseModule(existing);
    const alreadyImported = mod.imports.$items.some(
      (i) => i.imported === "defineTool" && i.from === "toolry",
    );
    if (!alreadyImported) {
      mod.imports.$prepend({ imported: "defineTool", from: "toolry" });
    }
    const { code: updatedSource } = generateCode(mod);
    writeFileSync(filePath, `${updatedSource}\n${entry.code}\n`, "utf-8");
  }

  console.log();
  console.log(`  ${green("✔")} Added ${bold(entry.exportName)} → ${cyan(filePath)}`);
  console.log();
}

export function ensureToolryShim(cliUrl: string): void {
  // Derive the package root from the running CLI file (dist/cli.mjs → package root)
  const packageRoot = resolve(dirname(dirname(fileURLToPath(cliUrl))));
  const shimDir = join(homedir(), ".toolry", "node_modules", "toolry");
  const shimPkg = join(shimDir, "package.json");

  // Skip if shim already points to the current package root
  if (existsSync(shimPkg)) {
    try {
      const existing = JSON.parse(readFileSync(shimPkg, "utf-8")) as { _toolryRoot?: string };
      if (existing._toolryRoot === packageRoot) return;
    } catch {}
  }

  const root = packageRoot.replace(/\\/g, "/");
  mkdirSync(shimDir, { recursive: true });
  writeFileSync(
    shimPkg,
    JSON.stringify(
      {
        type: "module",
        _toolryRoot: packageRoot,
        exports: { ".": { types: "./index.d.mts", default: "./index.mjs" } },
      },
      null,
      2,
    ) + "\n",
    "utf-8",
  );
  writeFileSync(join(shimDir, "index.mjs"), `export * from '${root}/dist/index.mjs'\n`, "utf-8");
  writeFileSync(
    join(shimDir, "index.d.mts"),
    readFileSync(join(packageRoot, "dist", "index.d.mts"), "utf-8"),
    "utf-8",
  );
}
