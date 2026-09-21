import type { Config } from '../../types.js';
import path from 'path';
import { writeFile, ensureDir } from '../../utils/file.js';
import { DEPS } from '../../versions.js';
import { DEFAULT_PORTS } from './types.js';

/** A Hono + Node service. Real workspace member, so it shares the tsconfig package. */
export async function generateNodeService(_config: Config, targetDir: string, name: string) {
  const port = DEFAULT_PORTS.node;

  await writeFile(
    path.join(targetDir, 'package.json'),
    JSON.stringify(
      {
        name,
        version: '0.0.0',
        private: true,
        type: 'module',
        main: './dist/index.js',
        scripts: {
          dev: 'tsx watch src/index.ts',
          build: 'tsup src/index.ts --format esm --clean --dts',
          start: 'node dist/index.js',
          lint: 'eslint .',
          'type-check': 'tsc --noEmit',
        },
        dependencies: {
          hono: DEPS.hono,
          '@hono/node-server': DEPS['@hono/node-server'],
          zod: DEPS.zod,
        },
        devDependencies: {
          '@xocket/typescript-config': 'workspace:*',
          '@xocket/eslint-config': 'workspace:*',
          '@xocket/prettier-config': 'workspace:*',
          '@types/node': DEPS['@types/node'],
          tsup: DEPS.tsup,
          tsx: DEPS.tsx,
          typescript: DEPS.typescript,
          eslint: DEPS.eslint,
        },
        prettier: '@xocket/prettier-config',
      },
      null,
      2,
    ) + '\n',
  );

  await writeFile(
    path.join(targetDir, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: '@xocket/typescript-config/node.json',
        compilerOptions: { outDir: 'dist', paths: { '@/*': ['./src/*'] } },
        include: ['src'],
        exclude: ['node_modules', 'dist'],
      },
      null,
      2,
    ) + '\n',
  );

  await writeFile(
    path.join(targetDir, 'eslint.config.js'),
    `import base from '@xocket/eslint-config/base.js'

export default base
`,
  );

  // Per-package turbo config so this service's outputs are cached correctly.
  await writeFile(
    path.join(targetDir, 'turbo.json'),
    JSON.stringify({ extends: ['//'], tasks: { build: { outputs: ['dist/**'] } } }, null, 2) + '\n',
  );

  await ensureDir(path.join(targetDir, 'src'));
  await writeFile(
    path.join(targetDir, 'src', 'index.ts'),
    `import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { z } from 'zod'

const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok', service: '${name}' }))

const echoSchema = z.object({ message: z.string().min(1) })

app.post('/echo', async (c) => {
  const parsed = echoSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', issues: parsed.error.issues }, 400)
  }
  return c.json({ echo: parsed.data.message })
})

const port = Number(process.env.PORT ?? ${port})

serve({ fetch: app.fetch, port }, (info) => {
  console.warn(\`${name} listening on http://localhost:\${info.port}\`)
})
`,
  );

  await writeFile(path.join(targetDir, '.env.example'), `PORT=${port}\n`);
}
