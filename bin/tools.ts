#!/usr/bin/env tsx
/**
 * pretty-tools entry point.
 *
 * This file is what your shell alias points at:
 *   alias tools="tsx /path/to/this/bin/tools.ts ./pluginA.ts ./pluginB.ts"
 *
 * Or copy it into your project and alias locally:
 *   alias tools="tsx ~/dotfiles/tools/bin/tools.ts $HOME/dotfiles/tools/plugins/*.ts"
 */
import { run } from '../src/index.js'

const pluginPaths = process.argv.slice(2)

await run(pluginPaths, {
  name: 'tools',
  description: 'Your developer toolkit',
  version: '1.0.0',
})
