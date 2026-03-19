import { select, text, confirm, isCancel, cancel, group, log } from '@clack/prompts'
import { bold, gray } from 'colorette'
import type { ArgDef, ArgsDef, ToolDef } from './types.js'

export async function pickTool(tools: ToolDef[]): Promise<ToolDef | null> {
  // Group by category, preserving insertion order
  const categories = new Map<string, ToolDef[]>()
  for (const tool of tools) {
    const cat = tool.category ?? 'General'
    if (!categories.has(cat)) categories.set(cat, [])
    categories.get(cat)!.push(tool)
  }

  const options = [] as Array<{ value: string; label: string; hint: string }>
  for (const [cat, catTools] of categories) {
    for (const tool of catTools) {
      options.push({
        value: tool.name,
        label: tool.name,
        hint: `${cat} · ${tool.description}`,
      })
    }
  }

  const chosen = await select<string>({
    message: 'Which tool do you want to run?',
    options,
  })

  if (isCancel(chosen)) {
    cancel('Cancelled.')
    return null
  }

  return tools.find(t => t.name === chosen) ?? null
}

export async function collectArgs(tool: ToolDef): Promise<Record<string, unknown>> {
  const argsDef = tool.args as ArgsDef | undefined
  if (!argsDef || Object.keys(argsDef).length === 0) return {}

  const prompts: Record<string, () => Promise<unknown>> = {}

  for (const [key, def] of Object.entries(argsDef)) {
    prompts[key] = () => promptForArg(key, def as ArgDef)
  }

  const result = await group(prompts, {
    onCancel: () => {
      cancel('Cancelled.')
      process.exit(0)
    },
  })

  // Fill in defaults for any skipped optional fields
  for (const [key, def] of Object.entries(argsDef)) {
    const d = def as ArgDef
    if ((result[key] === '' || result[key] === undefined) && d.default !== undefined) {
      result[key] = d.default
    }
  }

  return result as Record<string, unknown>
}

export async function confirmRun(command: string): Promise<'run' | 'back' | 'abort'> {
  log.info(gray(`$ ${bold(command)}`))

  const action = await select<'run' | 'back' | 'abort'>({
    message: 'Run this command?',
    options: [
      { value: 'run', label: 'Yes', hint: 'run the command' },
      { value: 'back', label: 'No', hint: 'go back to tool selection' },
      { value: 'abort', label: 'Abort', hint: 'exit the CLI' },
    ],
  })

  if (isCancel(action)) {
    cancel('Cancelled.')
    process.exit(0)
  }

  return action as 'run' | 'back' | 'abort'
}

async function promptForArg(key: string, def: ArgDef): Promise<unknown> {
  const label = key.replace(/([A-Z])/g, ' $1').toLowerCase()

  if (def.type === 'boolean') {
    return confirm({
      message: def.description,
      initialValue: (def.default as boolean) ?? false,
    })
  }

  if (def.options) {
    return select<string>({
      message: def.description,
      options: def.options.map(o => ({ value: o, label: o })),
      initialValue: (def.default as string) ?? def.options[0],
    })
  }

  return text({
    message: def.description,
    placeholder: def.placeholder ?? (def.default !== undefined ? String(def.default) : `Enter ${label}…`),
    defaultValue: def.default !== undefined ? String(def.default) : undefined,
    validate: def.required ? v => (!v ? `${label} is required` : undefined) : undefined,
  })
}
