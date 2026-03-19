import { defineTool } from '../src/index.js'
import { log } from '@clack/prompts'

export default defineTool({
  name: 'review:checklist',
  description: 'Run pre-review checklist and open the PR',
  category: 'Review',
  args: {
    branch: {
      type: 'string',
      description: 'Branch to review',
      placeholder: 'feature/my-branch',
      required: true,
    },
    autoOpen: { type: 'boolean', description: 'Open PR in browser?', default: true },
  },
  async run({ branch, autoOpen }) {
    // Custom async logic — no need to return a shell command
    log.info(`Fetching latest for: ${branch}`)
    log.info('Running tests…')
    // you could actually spawn processes here, call APIs, etc.
    if (autoOpen) {
      return `gh pr view ${branch} --web`
    }
  },
})
