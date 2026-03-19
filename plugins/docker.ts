import { defineTool } from '../src/index.js'

export const up = defineTool({
  name: 'docker:up',
  description: 'Start Docker containers',
  category: 'Docker',
  args: {
    detach: { type: 'boolean', description: 'Run in detached mode?', default: true },
    build: { type: 'boolean', description: 'Force rebuild images?' },
  },
  run: ({ detach, build }) =>
    `docker compose up${detach ? ' -d' : ''}${build ? ' --build' : ''}`,
})

export const down = defineTool({
  name: 'docker:down',
  description: 'Stop and remove containers',
  category: 'Docker',
  args: {
    volumes: { type: 'boolean', description: 'Also remove volumes?' },
  },
  run: ({ volumes }) => `docker compose down${volumes ? ' -v' : ''}`,
})

export const logs = defineTool({
  name: 'docker:logs',
  description: 'Tail container logs',
  category: 'Docker',
  args: {
    service: {
      type: 'string',
      description: 'Which service?',
      options: ['app', 'db', 'redis', 'queue'],
    },
    lines: { type: 'string', description: 'How many lines to tail?', default: '100' },
  },
  run: ({ service, lines }) => `docker compose logs -f --tail=${lines} ${service}`,
})
