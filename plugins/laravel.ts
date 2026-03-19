import { defineTools } from '../src/index.js'

export default defineTools(
  {
    name: 'serve',
    description: 'Start the Laravel dev server',
    category: 'Laravel',
    args: {
      port: { type: 'string', description: 'Port to listen on', default: '8000', placeholder: '8000' },
    },
    run: ({ port }) => `php artisan serve --port=${port}`,
  },

  {
    name: 'migrate',
    description: 'Run database migrations',
    category: 'Laravel',
    args: {
      fresh: { type: 'boolean', description: 'Drop all tables and re-run migrations?' },
      seed: { type: 'boolean', description: 'Run seeders after migrating?' },
    },
    run: ({ fresh, seed }) =>
      `php artisan migrate${fresh ? ':fresh' : ''}${seed ? ' --seed' : ''}`,
  },

  {
    name: 'tinker',
    description: 'Open the Laravel REPL',
    category: 'Laravel',
    run: () => 'php artisan tinker',
  },
)
