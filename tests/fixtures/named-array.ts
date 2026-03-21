import { defineTools } from "../../src/define.js";

export const tools = defineTools(
  {
    name: "array-tool-1",
    description: "First tool in named array",
    run: () => "echo 1",
  },
  {
    name: "array-tool-2",
    description: "Second tool in named array",
    run: () => "echo 2",
  },
);
