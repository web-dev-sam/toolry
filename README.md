# toolry

A beautiful, plugin-based CLI toolkit. Define commands in small TypeScript plugin files, wire them together with a shell alias, and get a fully interactive, categorised CLI with zero boilerplate. Useful for remembering complex commands that aren't used frequently and have complex syntax.

## Setup

```bash
pnpm i -g toolry

# Add a shell alias (~/.bashrc or similar)
alias tools="pnpx toolry ~/.toolry/*.ts" # If using ts you need tsx or bun or a new enough node version (24+) that can directly run ts files
```

Now `tools` anywhere gives you a beautiful interactive menu.

---

## Writing a plugin

A plugin is any `.ts` or `.js` file that exports one or more tools via `defineTool` / `defineTools`.

```ts
// ~/.toolry/laravel.ts
import { defineTools } from "toolry";

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

### Named exports also work

```ts
export const up   = defineTool({ name: 'docker:up',   ... })
export const down = defineTool({ name: 'docker:down', ... })
```
