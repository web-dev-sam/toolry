import { defineTools } from "../../src/define.js";

export default defineTools(
  {
    name: "tool-a",
    description: "Tool A",
    run: () => "echo a",
  },
  {
    name: "tool-b",
    description: "Tool B",
    run: () => "echo b",
  },
);
