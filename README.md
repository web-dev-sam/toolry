# pretty-tools

A beautiful, plugin-based CLI toolkit. Define commands in small TypeScript plugin files, wire them together with a shell alias, and get a fully interactive, categorised CLI with zero boilerplate.

## Setup

```bash
# 1. Install tsx globally (one-time)
npm i -g tsx

# 2. Clone / copy this repo somewhere stable, e.g. ~/dotfiles/tools
# 3. Install deps
npm install

# 4. Add a shell alias (zsh / bash)
alias tools="tsx ~/dotfiles/tools/bin/tools.ts \
  ~/dotfiles/tools/plugins/laravel.ts \
  ~/dotfiles/tools/plugins/docker.ts"
```

Now `tools` anywhere gives you a beautiful interactive menu.

---

## Writing a plugin

A plugin is any `.ts` or `.js` file that exports one or more tools via `defineTool` / `defineTools`.

```ts
// ~/dotfiles/tools/plugins/laravel.ts
import { defineTools } from "../src/index.js";

export default defineTools(
  {
    name: "serve",
    description: "Start the dev server",
    category: "Laravel",
    args: {
      port: { type: "string", description: "Port", default: "8000" },
    },
    run: ({ port }) => `php artisan serve --port=${port}`,
  },
  {
    name: "migrate",
    description: "Run migrations",
    category: "Laravel",
    args: {
      fresh: { type: "boolean", description: "Drop all tables first?" },
    },
    run: ({ fresh }) => `php artisan migrate${fresh ? ":fresh" : ""}`,
  },
);
```

That's it. Full autocomplete on `args` and `run`. Under 20 lines.

---

## API

### `defineTool(def)`

Define a single tool. The `run` function receives fully-typed args.

```ts
import { defineTool } from "pretty-tools";

export default defineTool({
  name: "my-tool", // shown in the menu
  description: "Does stuff", // shown as hint
  category: "My Category", // groups tools in the menu

  args: {
    // --- arg types ---
    myString: { type: "string", description: "...", default: "hello" },
    myBool: { type: "boolean", description: "...", default: false },
    myNumber: { type: "number", description: "..." },

    // string with a select dropdown
    mySelect: { type: "string", description: "...", options: ["a", "b", "c"] },

    // required field (validated before running)
    myRequired: { type: "string", description: "...", required: true },
  },

  // Return a shell command string → it gets executed
  run: ({ myString, myBool }) => `echo "${myString}" && ls`,

  // Or handle it yourself (async ok)
  async run({ myString }) {
    await doSomething(myString);
    // optionally still return a shell command at the end
    return `open https://example.com/${myString}`;
  },
});
```

### `defineTools(...defs)`

Sugar for exporting multiple tools from one file.

```ts
export default defineTools(toolA, toolB, toolC);
```

### Named exports also work

```ts
export const up   = defineTool({ name: 'docker:up',   ... })
export const down = defineTool({ name: 'docker:down', ... })
```

---

## Arg types reference

| Field         | Type                                | Description                                 |
| ------------- | ----------------------------------- | ------------------------------------------- |
| `type`        | `'string' \| 'boolean' \| 'number'` | Determines the prompt style                 |
| `description` | `string`                            | Shown as the prompt question                |
| `default`     | matches `type`                      | Pre-filled value, used if user hits enter   |
| `required`    | `boolean`                           | Validates that the field is not empty       |
| `options`     | `string[]`                          | Renders a `select` dropdown instead of text |
| `placeholder` | `string`                            | Greyed-out hint inside text prompts         |

---

## Wrapping existing shell aliases

Your `run` can return any shell string — it runs in your current shell env, so aliases and PATH are inherited:

```ts
run: () => 'sail up -d',           // wraps a Laravel Sail alias
run: () => 'pnpm run dev',         // any package script
run: () => 'gh pr create --web',   // GitHub CLI
```

---

## Project structure

```
pretty-tools/
├── bin/
│   └── tools.ts          ← entry point (your alias points here)
├── src/
│   ├── index.ts           ← public API (re-exports everything)
│   ├── types.ts           ← ToolDef, ArgDef, etc.
│   ├── define.ts          ← defineTool / defineTools helpers
│   ├── loader.ts          ← imports plugin files at runtime
│   ├── prompts.ts         ← @clack/prompts interaction layer
│   ├── exec.ts            ← shell command runner
│   └── runtime.ts         ← orchestrator (intro → pick → args → run → outro)
├── example-plugins/
│   ├── laravel.ts
│   ├── docker.ts
│   └── review.ts
└── tsconfig.json
```

---

## Try the examples

```bash
npm run dev
# runs: tsx bin/tools.ts ./example-plugins/laravel.ts ./example-plugins/docker.ts ./example-plugins/review.ts
```
