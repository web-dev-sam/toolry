import { defineTool } from "../../src/define.js";

export const toolOne = defineTool({
  name: "tool-one",
  description: "Named export tool one",
  run: () => "echo one",
});

export const toolTwo = defineTool({
  name: "tool-two",
  description: "Named export tool two",
  run: () => "echo two",
});
