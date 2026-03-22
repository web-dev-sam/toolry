---
name: toolry
description: Build or update Toolry plugins and documentation for the interactive CLI toolkit that loads TypeScript or JavaScript tool definitions.
---

# toolry

Use this skill when working on Toolry itself or when authoring plugins that run inside Toolry's interactive CLI.

## When to use

Use this skill for tasks involving:

- Toolry plugin authoring or review
- Changes to the Toolry runtime, loader, prompts, or execution flow
- Documentation for plugin authors or CLI users
- Debugging why a Toolry plugin is not being discovered or executed

Do not use this skill for unrelated generic CLI tooling unless the code is specifically built on Toolry.

## What Toolry does

Toolry is a small library and CLI for building interactive developer tool menus from plain `.ts` or `.js` plugin files.

- The CLI entrypoint is `toolry`
- Plugin file paths are passed on the command line
- Toolry dynamically imports each plugin file from the current working directory
- A plugin can export:
  - `default defineTool({...})`
  - `default defineTools(...)`
  - named `defineTool(...)` exports
  - named arrays that contain valid tool definitions
- The runtime presents a category-driven menu, prompts for arguments, optionally shows the generated shell command, then executes it

## Authoring model

Tool definitions are created with `defineTool` or `defineTools`.

Each tool supports:

- `name`: user-visible tool name
- `description`: user-visible description in menus
- `category`: either a single string or a string array for nested categories
- `args`: prompt definitions keyed by argument name
- `askToRun`: defaults to `true`; when `false`, the generated shell command runs immediately after argument collection
- `run(args)`: may return a shell command string or perform side effects directly and return `void`

If `run()` returns a string:

- Toolry shows the command
- The user can `run`, go `back`, or `abort`
- If `askToRun` is `false`, Toolry still logs the command and executes it immediately

If `run()` returns `void`:

- Toolry assumes the tool handled everything itself
- No shell command confirmation step appears

## Supported argument prompt types

Document and implement plugins using the exact current arg types from `src/types.ts`:

- `text`
- `password`
- `confirm`
- `select`
- `multiselect`
- `autocomplete`
- `autocompleteMultiselect`
- `selectKey`
- `groupMultiselect`
- `path`

Current prompt behavior:

- `required` validation is enforced for `text`, `password`, `autocomplete`, and `path`
- `default` values are supported across prompts where relevant
- `options()` is used for `select`, `multiselect`, `autocomplete`, `autocompleteMultiselect`, and `selectKey`
- `groups()` is used only for `groupMultiselect`
- `path` supports `root` and `directory`

## Runtime behavior to preserve

When editing Toolry, keep these user-facing behaviors intact unless the task explicitly changes them:

- Categories are hierarchical when `category` is an array
- The menu shows category counts
- Users can navigate back up the category tree
- Cancelling exits cleanly
- Empty plugin lists show usage guidance instead of throwing
- Invalid plugin imports are skipped and logged, while remaining plugins still load
- Tool execution uses the user's shell with inherited stdio and environment

## Constraints and caveats

Be explicit about the current implementation limits:

- Plugin loading is based on dynamic `import()`, so plugin paths must resolve correctly from the invoking shell's working directory
- A value is treated as a tool only if it is an object with a string `name` and function `run`
- `InferArgs` currently maps most non-boolean, non-multiselect prompts to `string`
- Execution is string-command based; Toolry does not escape shell arguments for the user
- The shipped CLI currently reads plugin paths from positional arguments only

## Good documentation targets

When updating docs, prioritize the things users actually need to succeed:

- How to install and invoke `toolry`
- How to structure a plugin file
- Which export forms are discovered
- Which arg types exist and how they behave
- What `askToRun` changes
- The difference between returning a command string and executing directly inside `run`
- How nested categories are represented

Avoid inventing features that are not present in the codebase.

## Example plugin

```ts
import { defineTools } from "toolry";

export default defineTools(
  {
    name: "serve",
    description: "Start the dev server",
    category: ["Laravel", "Local"],
    args: {
      port: { type: "text", description: "Port", default: "8000" },
      open: { type: "confirm", description: "Open in browser?" },
    },
    run: ({ port, open }) => `php artisan serve --port=${port}${open ? " --no-reload" : ""}`,
  },
  {
    name: "logs",
    description: "Tail application logs",
    category: "Laravel",
    askToRun: false,
    run: () => "tail -f storage/logs/laravel.log",
  },
);
```

## Working approach

1. Read `src/types.ts`, `src/prompts.ts`, `src/runtime.ts`, and `src/loader.ts` before changing user-facing docs.
2. Verify examples against actual exported APIs from `src/index.ts`.
3. Keep docs aligned with the current runtime rather than aspirational behavior.
4. If behavior is surprising, document the current behavior first, then change code separately if requested.
5. If you change how tools are added (the catalog format, `tools.ts` shape, `addPath` convention, or how `addTool` injects code), update `CONTRIBUTING.md` in the same task.
