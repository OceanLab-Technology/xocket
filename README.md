# xocket

> Monorepo Development Platform CLI

A modern scaffolding tool to bootstrap production-ready TypeScript monorepos powered by **pnpm workspaces** and **Turborepo**.

## 🚀 Quick Start

You can run `xocket` directly without installing it globally:

```bash
npx xocket create my-project
```

Or install it globally:

```bash
npm install -g xocket
# then run
xocket create my-project
```

## ✨ Features

- 📦 **Monorepo by default**: pnpm workspaces + Turborepo pipeline setup out of the box
- 🔷 **TypeScript mandatory**: Strict TypeScript configuration across the root, shared packages, and web apps
- 🎨 **Tailwind CSS + shadcn/ui**: Pre-configured design tokens, `components.json`, and `cn()` utility
- ⚡ **Framework options**:
  - React (Vite)
  - Next.js (App Router)
- 🗄️ **State Management**:
  - Zustand (recommended)
  - React Context
  - Redux Toolkit
  - None
- 🌐 **Data Fetching & API**:
  - Axios with interceptors and base URLs
  - TanStack Query (v5)
- 🔐 **Authentication & Backend**:
  - Supabase (includes `@supabase/ssr` with browser, server, and admin clients for Next.js)
  - AWS Cognito (Amplify v6)
  - Custom API (token auth helpers)
- 🚨 **Sentry Error Tracking**: Pre-wired for Vite (`@sentry/react`) and Next.js (`@sentry/nextjs`)
- 🛠️ **Shared Workspace Packages**:
  - `@xocket/typescript-config`
  - `@xocket/eslint-config`
  - `@xocket/prettier-config`
- 🔒 **Git & Hooks**: Git init, Husky pre-commit hooks, lint-staged, ESLint, Prettier

## 📖 Commands

```bash
# Create a new monorepo project
xocket create [name]

# Check version
xocket -v

# Display help
xocket --help
```

## 📄 License

MIT
