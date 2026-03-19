import { select, text, confirm, path, isCancel, cancel, group, log } from "@clack/prompts";
import { bold, gray } from "colorette";
import type { ArgDef, ArgsDef, ToolDef } from "./types.js";

type CategoryNode = {
  tools: ToolDef[];
  children: Map<string, CategoryNode>;
};

function buildCategoryTree(tools: ToolDef[]): CategoryNode {
  const root: CategoryNode = { tools: [], children: new Map() };
  for (const tool of tools) {
    const raw = tool.category;
    const path = !raw ? [] : Array.isArray(raw) ? raw : [raw];
    let node = root;
    for (const seg of path) {
      if (!node.children.has(seg)) node.children.set(seg, { tools: [], children: new Map() });
      node = node.children.get(seg)!;
    }
    node.tools.push(tool);
  }
  return root;
}

function countTools(node: CategoryNode): number {
  let n = node.tools.length;
  for (const child of node.children.values()) n += countTools(child);
  return n;
}

export async function pickTool(allTools: ToolDef[]): Promise<ToolDef | null> {
  const root = buildCategoryTree(allTools);
  const stack: CategoryNode[] = [root];
  const breadcrumb: string[] = [];

  while (true) {
    const node = stack[stack.length - 1];
    const options: Array<{ value: string; label: string; hint: string }> = [];

    if (stack.length > 1) {
      options.push({ value: "__back__", label: "← Back", hint: "" });
    }

    for (const [name, child] of node.children) {
      const count = countTools(child);
      options.push({
        value: `cat:${name}`,
        label: name,
        hint: `${count} tool${count === 1 ? "" : "s"}`,
      });
    }

    for (const tool of node.tools) {
      options.push({ value: `tool:${tool.name}`, label: tool.name, hint: tool.description });
    }

    const isLeaf = node.children.size === 0;
    const message =
      breadcrumb.length === 0
        ? isLeaf
          ? "Which tool?"
          : "Which category?"
        : `${breadcrumb.join(" › ")} · ${isLeaf ? "Which tool?" : "Which subcategory?"}`;

    process.stdout.write("\x1b[s");
    const chosen = await select<string>({ message, options });

    if (isCancel(chosen)) {
      cancel("Cancelled.");
      return null;
    }

    process.stdout.write("\x1b[u\x1b[0J");

    if (chosen === "__back__") {
      stack.pop();
      breadcrumb.pop();
      continue;
    }

    if (chosen.startsWith("cat:")) {
      const name = chosen.slice(4);
      stack.push(node.children.get(name)!);
      breadcrumb.push(name);
      continue;
    }

    return allTools.find((t) => t.name === chosen.slice(5)) ?? null;
  }
}

export async function collectArgs(tool: ToolDef): Promise<Record<string, unknown>> {
  const argsDef = tool.args as ArgsDef | undefined;
  if (!argsDef || Object.keys(argsDef).length === 0) return {};

  const prompts: Record<string, () => Promise<unknown>> = {};

  for (const [key, def] of Object.entries(argsDef)) {
    prompts[key] = () => promptForArg(key, def as ArgDef);
  }

  const result = await group(prompts, {
    onCancel: () => {
      cancel("Cancelled.");
      process.exit(0);
    },
  });

  // Fill in defaults for any skipped optional fields
  for (const [key, def] of Object.entries(argsDef)) {
    const d = def as ArgDef;
    if ((result[key] === "" || result[key] === undefined) && d.default !== undefined) {
      result[key] = d.default;
    }
  }

  return result as Record<string, unknown>;
}

export async function confirmRun(command: string): Promise<"run" | "back" | "abort"> {
  log.info(gray(`$ ${bold(command)}`));

  const action = await select<"run" | "back" | "abort">({
    message: "Run this command?",
    options: [
      { value: "run", label: "Yes", hint: "run the command" },
      { value: "back", label: "No", hint: "go back to tool selection" },
      { value: "abort", label: "Abort", hint: "exit the CLI" },
    ],
  });

  if (isCancel(action)) {
    cancel("Cancelled.");
    process.exit(0);
  }

  return action as "run" | "back" | "abort";
}

async function promptForArg(key: string, def: ArgDef): Promise<unknown> {
  const label = key.replace(/([A-Z])/g, " $1").toLowerCase();

  if (def.type === "boolean") {
    return confirm({
      message: def.description,
      initialValue: (def.default as boolean) ?? false,
    });
  }

  if (def.type === "path") {
    return path({
      message: def.description,
      root: def.root ?? process.cwd(),
      directory: def.directory ?? false,
      initialValue: def.default as string | undefined,
      validate: def.required ? (v) => (!v ? `${label} is required` : undefined) : undefined,
    });
  }

  if (def.options) {
    return select<string>({
      message: def.description,
      options: def.options.map((o) => ({ value: o, label: o })),
      initialValue: (def.default as string) ?? def.options[0],
    });
  }

  return text({
    message: def.description,
    placeholder:
      def.placeholder ?? (def.default !== undefined ? String(def.default) : `Enter ${label}…`),
    defaultValue: def.default !== undefined ? String(def.default) : undefined,
    validate: def.required ? (v) => (!v ? `${label} is required` : undefined) : undefined,
  });
}
