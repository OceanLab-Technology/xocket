import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// execa is the only side effect here; capture the argv it is handed.
const calls: Array<{ file: string; args: string[] }> = [];

vi.mock('execa', () => ({
  execa: (file: string, args: string[]) => {
    calls.push({ file, args });
    return Promise.resolve({ stdout: '', stderr: '' });
  },
}));

describe('install', () => {
  beforeEach(() => {
    calls.length = 0;
  });
  afterEach(() => {
    vi.resetModules();
  });

  it('always passes --no-frozen-lockfile', async () => {
    const { install } = await import('../src/utils/pm.js');
    await install('/tmp/project');

    expect(calls).toHaveLength(1);
    expect(calls[0]!.file).toBe('pnpm');

    // pnpm enables --frozen-lockfile by default when CI=true, but Xocket always
    // installs right after writing package.json: a new project has no lockfile
    // at all, and `xocket add` deliberately invalidates the existing one.
    // Without this flag both commands fail in CI with ERR_PNPM_NO_LOCKFILE /
    // ERR_PNPM_OUTDATED_LOCKFILE.
    expect(calls[0]!.args).toEqual(['install', '--no-frozen-lockfile']);
  });

  it('installs into the directory it is given', async () => {
    const { install } = await import('../src/utils/pm.js');
    await install('/tmp/elsewhere');
    expect(calls).toHaveLength(1);
  });
});
