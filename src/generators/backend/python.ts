import type { Config } from '../../types.js';
import path from 'path';
import { writeFile, ensureDir } from '../../utils/file.js';
import { DEFAULT_PORTS } from './types.js';

/**
 * A FastAPI service managed with uv.
 *
 * uv replaces the Poetry setup in the reference repo: it needs no global
 * install step beyond uv itself, and `uv run` resolves the venv on demand —
 * which matters because the reference repo's dev script hard-coded an absolute
 * path to one developer's Poetry binary.
 */
export async function generatePythonService(_config: Config, targetDir: string, name: string) {
  const port = DEFAULT_PORTS.python;
  const moduleName = name.replace(/-/g, '_');

  await writeFile(
    path.join(targetDir, 'package.json'),
    JSON.stringify(
      {
        name,
        version: '0.0.0',
        private: true,
        scripts: {
          dev: `uv run uvicorn ${moduleName}.main:app --reload --port ${port}`,
          build: 'uv sync --frozen',
          start: `uv run uvicorn ${moduleName}.main:app --port ${port}`,
          lint: 'uv run ruff check .',
          'type-check': 'uv run ruff check .',
          test: 'uv run pytest',
        },
      },
      null,
      2,
    ) + '\n',
  );

  await writeFile(
    path.join(targetDir, 'turbo.json'),
    JSON.stringify({ extends: ['//'], tasks: { build: { outputs: ['.venv/**'] } } }, null, 2) +
      '\n',
  );

  await writeFile(
    path.join(targetDir, 'pyproject.toml'),
    `[project]
name = "${moduleName}"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.118",
    "uvicorn[standard]>=0.38",
]

[dependency-groups]
dev = [
    "pytest>=8.4",
    "ruff>=0.14",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["${moduleName}"]
`,
  );

  await ensureDir(path.join(targetDir, moduleName));
  await writeFile(path.join(targetDir, moduleName, '__init__.py'), '');
  await writeFile(
    path.join(targetDir, moduleName, 'main.py'),
    `from fastapi import FastAPI

app = FastAPI(title="${name}")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "${name}"}
`,
  );

  await writeFile(
    path.join(targetDir, '.gitignore'),
    `.venv/
__pycache__/
*.pyc
.pytest_cache/
.ruff_cache/
`,
  );
  await writeFile(path.join(targetDir, '.env.example'), `PORT=${port}\n`);
}
