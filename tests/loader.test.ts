import { describe, it, expect, vi } from "vitest";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { loadPlugins } from "../src/loader.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => join(__dirname, "fixtures", name);

describe("loadPlugins", () => {
  it("loads a single tool from a default export", async () => {
    const tools = await loadPlugins([fixture("single-default.ts")]);

    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe("hello");
    expect(tools[0].description).toBe("Say hello");
    expect(typeof tools[0].run).toBe("function");
  });

  it("loads multiple tools from a default array export (defineTools)", async () => {
    const tools = await loadPlugins([fixture("multiple-default.ts")]);

    expect(tools).toHaveLength(2);
    expect(tools.map((t) => t.name)).toEqual(["tool-a", "tool-b"]);
  });

  it("loads tools from named exports", async () => {
    const tools = await loadPlugins([fixture("named-exports.ts")]);

    expect(tools).toHaveLength(2);
    expect(tools.map((t) => t.name)).toContain("tool-one");
    expect(tools.map((t) => t.name)).toContain("tool-two");
  });

  it("loads tools from a named array export", async () => {
    const tools = await loadPlugins([fixture("named-array.ts")]);

    expect(tools).toHaveLength(2);
    expect(tools.map((t) => t.name)).toEqual(["array-tool-1", "array-tool-2"]);
  });

  it("skips exports that are not valid tool defs", async () => {
    const tools = await loadPlugins([fixture("invalid-export.ts")]);

    expect(tools).toHaveLength(0);
  });

  it("loads tools from multiple plugin files", async () => {
    const tools = await loadPlugins([fixture("single-default.ts"), fixture("named-exports.ts")]);

    expect(tools).toHaveLength(3);
    expect(tools.map((t) => t.name)).toContain("hello");
    expect(tools.map((t) => t.name)).toContain("tool-one");
    expect(tools.map((t) => t.name)).toContain("tool-two");
  });

  it("returns empty array for empty paths list", async () => {
    const tools = await loadPlugins([]);
    expect(tools).toHaveLength(0);
  });

  it("skips a nonexistent path without throwing", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const tools = await loadPlugins([fixture("does-not-exist.ts")]);

    expect(tools).toHaveLength(0);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("continues loading valid plugins after a failed one", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const tools = await loadPlugins([fixture("does-not-exist.ts"), fixture("single-default.ts")]);

    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe("hello");

    consoleSpy.mockRestore();
  });

  it("loaded tool run functions are callable", async () => {
    const tools = await loadPlugins([fixture("single-default.ts")]);
    const result = tools[0].run({ name: "Alice" } as never);

    expect(result).toBe("echo Hello, Alice!");
  });
});
