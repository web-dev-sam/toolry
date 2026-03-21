import { pathToFileURL } from "url";
import { resolve } from "path";
import type { ToolDef } from "./types.js";

export async function loadPlugins(paths: string[]): Promise<ToolDef[]> {
  const tools: ToolDef[] = [];

  for (const raw of paths) {
    const abs = resolve(process.cwd(), raw);
    const url = pathToFileURL(abs).href;

    let mod: unknown;
    try {
      mod = await import(url);
    } catch (e) {
      console.error(`[pretty-tools] Failed to load plugin: ${raw}`);
      console.error(e);
      continue;
    }

    const exports = mod as Record<string, unknown>;

    // Support: export default defineTool({...})
    if (exports.default) {
      const d = exports.default;
      if (Array.isArray(d)) {
        tools.push(...(d as ToolDef[]));
      } else if (isToolDef(d)) {
        tools.push(d as ToolDef);
      }
    }

    // Support: export const myTool = defineTool({...})
    for (const [key, val] of Object.entries(exports)) {
      if (key === "default") continue;
      if (Array.isArray(val)) {
        for (const item of val) {
          if (isToolDef(item)) tools.push(item as ToolDef);
        }
      } else if (isToolDef(val)) {
        tools.push(val as ToolDef);
      }
    }
  }

  return tools;
}

function isToolDef(v: unknown): boolean {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Record<string, unknown>).name === "string" &&
    typeof (v as Record<string, unknown>).run === "function"
  );
}
