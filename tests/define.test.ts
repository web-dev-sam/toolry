import { describe, it, expect } from "vitest";
import { defineTool, defineTools } from "../src/define.js";

describe("defineTool", () => {
  it("returns the same object reference", () => {
    const def = {
      name: "test",
      description: "A test tool",
      run: () => "echo hi",
    };
    expect(defineTool(def)).toBe(def);
  });

  it("preserves all fields", () => {
    const def = defineTool({
      name: "deploy",
      description: "Deploy the app",
      category: "Ops",
      askToRun: false,
      args: {
        env: { type: "text", description: "Target env", default: "staging" },
      },
      run: ({ env }) => `deploy --env=${env}`,
    });

    expect(def.name).toBe("deploy");
    expect(def.description).toBe("Deploy the app");
    expect(def.category).toBe("Ops");
    expect(def.askToRun).toBe(false);
    expect(def.args?.env.default).toBe("staging");
  });

  it("run function is callable and returns expected value", () => {
    const def = defineTool({
      name: "greet",
      description: "Greet",
      args: { name: { type: "text", description: "Name" } },
      run: ({ name }) => `echo ${name}`,
    });

    expect(def.run({ name: "world" })).toBe("echo world");
  });
});

describe("defineTools", () => {
  it("returns all provided tools", () => {
    const a = { name: "a", description: "A", run: () => "echo a" };
    const b = { name: "b", description: "B", run: () => "echo b" };
    const result = defineTools(a, b);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(a);
    expect(result[1]).toBe(b);
  });

  it("returns an empty array when called with no arguments", () => {
    expect(defineTools()).toHaveLength(0);
  });

  it("returns a single-element array for one tool", () => {
    const def = { name: "solo", description: "Solo", run: () => "echo solo" };
    expect(defineTools(def)).toEqual([def]);
  });
});
