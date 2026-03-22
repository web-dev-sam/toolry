export interface CatalogEntry {
  exportName: string;
  description: string;
  /** Full `export const x = defineTool({...})` statement, ready to append to a file. */
  code: string;
}

export const catalog: Record<string, CatalogEntry> = {
  "generators/uuid": {
    exportName: "uuid",
    description: "Generate a UUID and copy to clipboard",
    code: `export const uuid = defineTool({
  name: 'uuid',
  description: 'Generate a UUID and copy to clipboard',
  category: 'Generators',
  askToRun: false,
  run: () => \`uuidgen | tr -d '\\n' | wl-copy && echo "→ copied to clipboard"\`,
})`,
  },
  "generators/timestamp": {
    exportName: "timestamp",
    description: "Generate current Unix timestamp in milliseconds and copy to clipboard",
    code: `export const timestamp = defineTool({
  name: 'timestamp',
  description: 'Generate current Unix timestamp in milliseconds and copy to clipboard',
  category: 'Generators',
  askToRun: false,
  run: () => \`date +%s%3N | tr -d '\\n' | wl-copy && echo "→ copied to clipboard"\`,
})`,
  },
  "web/open": {
    exportName: "webOpen",
    description: "Open a URL in your default browser",
    code: `export const webOpen = defineTool({
  name: 'web:open',
  description: 'Open a website in your default browser',
  category: 'Web',
  args: {
    url: { type: 'text', description: 'URL', default: 'https://toolry.webry.com' },
  },
  run: ({ url }) => \`open "\${url}"\`,
})`,
  },
};
