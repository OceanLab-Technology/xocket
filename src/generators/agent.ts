import type { Config } from '../types.js';
import path from 'path';
import fs from 'fs-extra';
import { writeFile, ensureDir } from '../utils/file.js';
import { DEPS } from '../versions.js';

/**
 * Generates services/<name> as an MCP server.
 *
 * MCP servers are increasingly part of a product rather than a side project —
 * exposing your own API to coding agents and assistants. This one lives in the
 * same workspace as everything else, so it can import @xocket/db and the
 * shared types directly instead of reimplementing them.
 */
export async function generateAgent(
  _config: Config,
  rootDir: string,
  opts: { name: string },
): Promise<string> {
  const { name } = opts;
  const targetDir = path.join(rootDir, 'services', name);

  if (await fs.pathExists(targetDir)) {
    throw new Error(`services/${name} already exists — choose a different name.`);
  }

  await ensureDir(path.join(targetDir, 'src'));

  await writeFile(
    path.join(targetDir, 'package.json'),
    JSON.stringify(
      {
        name,
        version: '0.0.0',
        private: true,
        type: 'module',
        bin: { [name]: './dist/index.js' },
        scripts: {
          dev: 'tsx watch src/index.ts',
          build: 'tsup src/index.ts --format esm --clean',
          start: 'node dist/index.js',
          // stdio servers are driven by a client, so there is no dev server to
          // curl; the inspector is the way to exercise it by hand.
          inspect: 'npx @modelcontextprotocol/inspector tsx src/index.ts',
          lint: 'eslint .',
          'type-check': 'tsc --noEmit',
        },
        dependencies: {
          '@modelcontextprotocol/sdk': DEPS['@modelcontextprotocol/sdk'],
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
    path.join(targetDir, 'turbo.json'),
    JSON.stringify({ extends: ['//'], tasks: { build: { outputs: ['dist/**'] } } }, null, 2) + '\n',
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

  await writeFile(
    path.join(targetDir, 'src', 'index.ts'),
    `#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const server = new McpServer({
  name: '${name}',
  version: '0.0.0',
})

/**
 * Tools are what an assistant can call.
 *
 * Keep each one narrow and describe it precisely — the description is the only
 * thing the model has to decide whether to call it.
 */
server.registerTool(
  'ping',
  {
    title: 'Ping',
    description: 'Health check. Returns "pong" plus the message you sent.',
    inputSchema: { message: z.string().describe('Any text to echo back') },
  },
  async ({ message }) => ({
    content: [{ type: 'text', text: \`pong: \${message}\` }],
  }),
)

/**
 * Resources are read-only data an assistant can load into context.
 * Swap this for something from @xocket/db once you add it.
 */
server.registerResource(
  'status',
  'status://current',
  {
    title: 'Service status',
    description: 'Current status of the ${name} service.',
    mimeType: 'application/json',
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify({ status: 'ok', service: '${name}' }, null, 2),
      },
    ],
  }),
)

/**
 * stdio transport: stdout carries the protocol, so anything logged there
 * corrupts the stream. Always log to stderr.
 */
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('${name} MCP server ready on stdio')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
`,
  );

  await writeFile(
    path.join(targetDir, 'README.md'),
    `# ${name}

An [MCP](https://modelcontextprotocol.io) server, exposing this project to
coding agents and assistants.

## Try it

\`\`\`bash
pnpm --filter ${name} inspect
\`\`\`

That opens the MCP Inspector, where you can call each tool by hand.

## Connect it to Claude Code

\`\`\`bash
pnpm --filter ${name} build
claude mcp add ${name} -- node "$(pwd)/services/${name}/dist/index.js"
\`\`\`

## Connect it to Claude Desktop

Add this to \`claude_desktop_config.json\`:

\`\`\`json
{
  "mcpServers": {
    "${name}": {
      "command": "node",
      "args": ["/absolute/path/to/services/${name}/dist/index.js"]
    }
  }
}
\`\`\`

## Adding capabilities

- **Tools** — things the assistant can *do*. Narrow, well-described, validated
  with zod.
- **Resources** — things it can *read*. Files, records, config.
- **Prompts** — reusable prompt templates you want to share.

Because this is a workspace package, it can import \`@xocket/db\` or any shared
package directly rather than going back out over HTTP.

> **stdout belongs to the protocol.** Log to \`console.error\`, never
> \`console.log\`, or the connection breaks.
`,
  );

  return targetDir;
}
