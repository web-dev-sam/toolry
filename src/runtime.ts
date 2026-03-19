import { intro, outro, spinner, log, cancel } from '@clack/prompts'
import { bold, cyan, gray, green } from 'colorette'
import { loadPlugins } from './loader.js'
import { pickTool, collectArgs, confirmRun } from './prompts.js'
import { exec } from './exec.js'
import type { ToolsConfig } from './types.js'

export async function run(pluginPaths: string[], config: ToolsConfig = {}) {
  const { name = 'tools', description = 'Your developer toolkit', version } = config

  intro(
    bold(cyan(` ${name} `)) +
    gray(version ? ` v${version}` : '') +
    '\n  ' +
    gray(description)
  )

  if (pluginPaths.length === 0) {
    log.warn('No plugin files provided.')
    log.info(`Usage: ${name} ./my-plugin.ts ./other-plugin.ts`)
    outro('Nothing to do.')
    return
  }

  const s = spinner()
  s.start('Loading tools…')
  const tools = await loadPlugins(pluginPaths)
  s.stop(`Loaded ${tools.length} tool${tools.length === 1 ? '' : 's'}`)

  if (tools.length === 0) {
    log.error('No tools found. Make sure your plugins export a defineTool() or defineTools().')
    outro('Exiting.')
    return
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const tool = await pickTool(tools)
    if (!tool) return

    const args = await collectArgs(tool)

    let result: string | void
    try {
      result = await tool.run(args as never)
    } catch (e) {
      log.error(`Tool failed: ${(e as Error).message}`)
      process.exit(1)
    }

    if (typeof result === 'string') {
      const shouldAsk = tool.askToRun !== false

      if (shouldAsk) {
        const action = await confirmRun(result)
        if (action === 'abort') {
          cancel('Aborted.')
          return
        }
        if (action === 'back') {
          continue
        }
      } else {
        log.info(gray(`$ ${result}`))
      }

      log.step(`Running ${bold(green(tool.name))}…`)
      try {
        await exec(result)
      } catch (e) {
        log.error(`Command failed: ${(e as Error).message}`)
        process.exit(1)
      }
    }

    break
  }

  outro(bold(green('Done ✔')))
}
