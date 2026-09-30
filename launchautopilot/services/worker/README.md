# worker

A node service in this monorepo.

## Toolchain

Requires **Node (already installed)**.

The package.json in this directory exists so Turborepo can see the service; its
scripts delegate to the node toolchain. Turbo caches the build output the
same way it caches a JS package.

## Commands

Run from the monorepo root:

```bash
pnpm dev                      # starts every app and service
pnpm --filter worker dev     # just this one
pnpm --filter worker build
```
