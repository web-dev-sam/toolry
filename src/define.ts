import type { ArgsDef, ToolDef } from './types.js'

/**
 * Define a tool. This is the only thing plugin authors need to call.
 *
 * @example
 * export default defineTool({
 *   name: 'dev',
 *   description: 'Start the dev server',
 *   category: 'Laravel',
 *   args: {
 *     port: { type: 'string', description: 'Port to run on', default: '8000' },
 *   },
 *   run: ({ port }) => `php artisan serve --port=${port}`,
 * })
 */
export function defineTool<T extends ArgsDef>(def: ToolDef<T>): ToolDef<T> {
  return def
}

/**
 * Define multiple tools at once (useful for one plugin file per category).
 */
export function defineTools<T extends ArgsDef>(...defs: ToolDef<T>[]): ToolDef<T>[] {
  return defs
}
