import {
  select,
  text,
  confirm,
  path,
  password,
  multiselect,
  autocomplete,
  autocompleteMultiselect,
  selectKey,
  groupMultiselect,
  isCancel,
  cancel,
  group,
  log,
} from "@clack/prompts";
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

    const firstNonBack = options.find((o) => o.value !== "__back__")?.value;
    process.stdout.write("\x1b[s");
    const chosen = await select<string>({ message, options, initialValue: firstNonBack });

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
  const mapOptions = (opts: ReturnType<NonNullable<ArgDef["options"]>>) =>
    opts.map((o) => ({ value: o.value, label: o.label ?? o.value, hint: o.description }));

  if (def.type === "confirm") {
    return confirm({
      message: def.description,
      initialValue: (def.default as boolean) ?? false,
    });
  }

  if (def.type === "password") {
    return password({
      message: def.description,
      validate: def.required ? (v) => (!v ? `${label} is required` : undefined) : undefined,
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

  if (def.type === "select") {
    const options = mapOptions(def.options?.() ?? []);
    return select<string>({
      message: def.description,
      options,
      initialValue: (def.default as string) ?? options[0]?.value,
    });
  }

  if (def.type === "multiselect") {
    return multiselect<string>({
      message: def.description,
      options: mapOptions(def.options?.() ?? []),
      initialValues: def.default as string[] | undefined,
      required: def.required,
    });
  }

  if (def.type === "autocomplete") {
    return autocomplete({
      message: def.description,
      options: mapOptions(def.options?.() ?? []),
      initialValue: def.default as string | undefined,
      validate: def.required ? (v) => (!v ? `${label} is required` : undefined) : undefined,
    });
  }

  if (def.type === "autocompleteMultiselect") {
    return autocompleteMultiselect<string>({
      message: def.description,
      options: mapOptions(def.options?.() ?? []),
      initialValues: def.default as string[] | undefined,
      required: def.required,
    });
  }

  if (def.type === "selectKey") {
    return selectKey<string>({
      message: def.description,
      options: mapOptions(def.options?.() ?? []),
    });
  }

  if (def.type === "groupMultiselect") {
    const rawGroups = def.groups?.() ?? {};
    const options = Object.fromEntries(
      Object.entries(rawGroups).map(([groupName, items]) => [
        groupName,
        items.map((o) => ({ value: o.value, label: o.label ?? o.value, hint: o.description })),
      ]),
    );
    return groupMultiselect<string>({
      message: def.description,
      options,
      initialValues: def.default as string[] | undefined,
      required: def.required,
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
