## What this changes

<!-- One or two sentences. What was broken or missing, and what does this do? -->

## Why

<!-- Why this approach? If you considered something else and rejected it, say so. -->

## Generated-output check

Xocket's product is the project it generates, so CLI tests passing is not
enough on its own.

<!-- Delete this section only if you changed nothing under src/generators or templates. -->

```bash
pnpm build
node dist/index.js create /tmp/demo --yes --no-git
cd /tmp/demo && pnpm lint && pnpm type-check && pnpm build && pnpm test
```

- [ ] The generated project still passes `lint`, `type-check`, `build` and `test`
- [ ] Combinations affected by this change were checked (framework / state / backend)

## Checklist

- [ ] New dependency versions went into `src/versions.ts`, not inline
- [ ] A bug fix comes with a test that fails without it
- [ ] If the bug would appear in an existing project, `xocket doctor` detects it
- [ ] `pnpm test` passes
- [ ] Docs updated (README / CLAUDE.md / CHANGELOG) if behaviour changed

## Related

<!-- Closes #123 -->
