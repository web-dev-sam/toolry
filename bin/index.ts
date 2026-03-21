import { run } from "../src/index";

const pluginPaths = process.argv.slice(2);

await run(pluginPaths, {
  name: "toolry",
  description: "Your developer toolkit",
  version: "0.2.0",
});
