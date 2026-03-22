# Contributing a Tool

Adding a tool to toolry requires changes to two files (currently two different repos, will merge into a monorepo in future).

---

## 1. `toolry-web/src/data/tools.ts`

Add an entry to the `tools` array. This drives the website card, install snippet, and PM command dropdown.

```ts
{
  id: 'my-tool',
  exportName: 'myTool',        // camelCase, used as the named export
  addPath: 'category/my-tool', // must match the catalog key below
  title: 'My Tool',
  description: 'What it does.',
  code: createToolCode('myTool', `{
  name: 'my-tool',
  description: '...',
  category: 'Category',
  run: () => \`some-shell-command\`,
}`),
}
```

## 2. `toolry/src/tools-catalog.ts`

Add a matching entry to `catalog`. This is what `toolry --add` writes into the user's `.ts` file.

```ts
'category/my-tool': {
  exportName: 'myTool',
  description: 'What it does.',
  code: `export const myTool = defineTool({
  name: 'my-tool',
  description: '...',
  category: 'Category',
  run: () => \`some-shell-command\`,
})`,
},
```

The `code` string must be the exact content appended to the user's file — no import line (that's injected automatically by `addTool`), just the `export const` statement.

---

## How it fits together

- The card on the website renders from `tools.ts`
- The install snippet uses `addPath` to build the `toolry --add` command
- The package manager dropdown copies the correct install command
- `toolry --add category/my-tool` looks up the catalog key and writes the tool code

The `addPath` in `tools.ts` and the catalog key in `tools-catalog.ts` must match exactly.
