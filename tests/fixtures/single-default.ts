import { defineTool } from "../../src/define.js";

export default defineTool({
  name: "hello",
  description: "Say hello",
  args: {
    name: { type: "text", description: "Name to greet" },
  },
  run: ({ name }) => `echo Hello, ${name}!`,
});
