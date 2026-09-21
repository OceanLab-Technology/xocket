import type { Config, Manifest, DeployTarget } from '../types.js';
import path from 'path';
import { writeFile, ensureDir } from '../utils/file.js';

/**
 * Generates container and deployment manifests for everything in the
 * workspace.
 *
 * Dockerfiles are written per service in the language that service actually
 * uses, and compose/k8s are generated from the manifest so they list the
 * services that exist rather than a fixed set.
 */
export async function generateDocker(
  config: Config,
  rootDir: string,
  manifest: Manifest,
  target: DeployTarget,
): Promise<void> {
  const services = Object.entries(manifest.services);

  for (const [name, svc] of services) {
    await writeServiceDockerfile(rootDir, name, svc.lang);
  }

  await writeWebDockerfile(rootDir, config);

  if (target === 'compose' || target === 'both') {
    await writeCompose(rootDir, manifest);
  }
  if (target === 'k8s' || target === 'both') {
    await writeK8s(rootDir, manifest);
  }

  await writeFile(
    path.join(rootDir, '.dockerignore'),
    `node_modules
**/node_modules
.git
.turbo
**/.turbo
**/dist
**/.next
**/target
**/bin
**/.venv
**/__pycache__
.env
.env.*
!.env.example
*.log
.DS_Store
`,
  );
}

const PORTS: Record<string, number> = { node: 3001, go: 3002, rust: 3003, python: 3004 };

async function writeServiceDockerfile(rootDir: string, name: string, lang: string) {
  const dir = path.join(rootDir, 'services', name);
  const port = PORTS[lang] ?? 3000;

  // Each is a multi-stage build so the runtime image carries no toolchain.
  const dockerfiles: Record<string, string> = {
    node: `# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/${name}/package.json ./services/${name}/
COPY packages ./packages
RUN pnpm install --frozen-lockfile --filter ${name}...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/${name}/node_modules ./services/${name}/node_modules
COPY . .
RUN pnpm --filter ${name} build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Never run as root.
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/services/${name}/dist ./dist
COPY --from=build --chown=app:app /app/node_modules ./node_modules
USER app
EXPOSE ${port}
CMD ["node", "dist/index.js"]
`,

    go: `# syntax=docker/dockerfile:1
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY services/${name}/go.mod services/${name}/go.su[m] ./
RUN go mod download
COPY services/${name}/ ./
# Static binary so the runtime image can be scratch.
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags='-s -w' -o /out/server .

FROM gcr.io/distroless/static-debian12 AS runtime
COPY --from=build /out/server /server
USER nonroot:nonroot
EXPOSE ${port}
ENTRYPOINT ["/server"]
`,

    rust: `# syntax=docker/dockerfile:1
FROM rust:1-slim AS build
WORKDIR /src
# Copy manifests first so dependency compilation caches independently of source.
COPY services/${name}/Cargo.toml services/${name}/Cargo.loc[k] ./
RUN mkdir src && echo 'fn main(){}' > src/main.rs && cargo build --release && rm -rf src
COPY services/${name}/src ./src
RUN touch src/main.rs && cargo build --release

FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \\
    && rm -rf /var/lib/apt/lists/* \\
    && useradd -r -u 10001 app
COPY --from=build /src/target/release/${name.replace(/-/g, '_')} /usr/local/bin/server
USER app
EXPOSE ${port}
CMD ["server"]
`,

    python: `# syntax=docker/dockerfile:1
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS build
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
COPY services/${name}/pyproject.toml services/${name}/uv.loc[k] ./
RUN uv sync --no-install-project --no-dev
COPY services/${name}/ ./
RUN uv sync --no-dev

FROM python:3.12-slim-bookworm AS runtime
WORKDIR /app
RUN useradd -r -u 10001 app
COPY --from=build --chown=app:app /app /app
ENV PATH="/app/.venv/bin:$PATH"
USER app
EXPOSE ${port}
CMD ["uvicorn", "${name.replace(/-/g, '_')}.main:app", "--host", "0.0.0.0", "--port", "${port}"]
`,
  };

  await writeFile(path.join(dir, 'Dockerfile'), dockerfiles[lang] ?? dockerfiles.node!);
}

async function writeWebDockerfile(rootDir: string, config: Config) {
  const dir = path.join(rootDir, 'apps', 'web');

  const content =
    config.framework === 'next'
      ? `# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter '*/web' build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
# Requires \`output: 'standalone'\` in next.config.ts.
COPY --from=build --chown=app:app /app/apps/web/.next/standalone ./
COPY --from=build --chown=app:app /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=app:app /app/apps/web/public ./apps/web/public
USER app
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
`
      : `# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter '*/web' build

# A Vite build is static; nginx serves it.
FROM nginx:alpine AS runtime
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
`;

  await writeFile(path.join(dir, 'Dockerfile'), content);

  if (config.framework === 'react') {
    await writeFile(
      path.join(dir, 'nginx.conf'),
      `server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # Hashed assets are immutable; the shell must never be cached.
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-cache";
  }
}
`,
    );
  }
}

async function writeCompose(rootDir: string, manifest: Manifest) {
  const services = Object.entries(manifest.services);
  const needsDb = manifest.db != null;

  const blocks: string[] = [
    `  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - '3000:${manifest.apps.web?.framework === 'next' ? '3000' : '80'}'
    env_file:
      - apps/web/.env.development
    depends_on:${services.length ? '\n' + services.map(([n]) => `      - ${n}`).join('\n') : ' []'}`,
  ];

  for (const [name, svc] of services) {
    const port = PORTS[svc.lang] ?? 3000;
    blocks.push(`  ${name}:
    build:
      context: .
      dockerfile: services/${name}/Dockerfile
    ports:
      - '${port}:${port}'
    environment:
      PORT: '${port}'${needsDb ? `\n      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/app` : ''}${
        needsDb
          ? `
    depends_on:
      postgres:
        condition: service_healthy`
          : ''
      }`);
  }

  if (needsDb) {
    blocks.push(`  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    ports:
      - '5432:5432'
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      # Dependents wait for this rather than racing the first connection.
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 10`);
  }

  await writeFile(
    path.join(rootDir, 'docker-compose.yml'),
    `# Local stack. Production deploys should use the k8s manifests or your
# platform of choice — this is for getting everything running on one machine.
services:
${blocks.join('\n\n')}
${needsDb ? '\nvolumes:\n  postgres-data:\n' : ''}`,
  );
}

async function writeK8s(rootDir: string, manifest: Manifest) {
  const dir = path.join(rootDir, 'infra', 'k8s');
  await ensureDir(dir);

  const all = [
    ['web', manifest.apps.web?.framework === 'next' ? 3000 : 80] as const,
    ...Object.entries(manifest.services).map(
      ([name, svc]) => [name, PORTS[svc.lang] ?? 3000] as const,
    ),
  ];

  for (const [name, port] of all) {
    await writeFile(
      path.join(dir, `${name}.yaml`),
      `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
  labels:
    app: ${name}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
        app: ${name}
    spec:
      containers:
        - name: ${name}
          # Replace with your registry path and an immutable tag.
          image: ghcr.io/your-org/${manifest.projectName}-${name}:latest
          ports:
            - containerPort: ${port}
          env:
            - name: PORT
              value: '${port}'
          # Requests are what the scheduler packs against; limits cap bursts.
          resources:
            requests:
              cpu: 50m
              memory: 96Mi
            limits:
              memory: 256Mi
          readinessProbe:
            httpGet:
              path: ${name === 'web' ? '/' : '/health'}
              port: ${port}
            initialDelaySeconds: 3
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: ${name === 'web' ? '/' : '/health'}
              port: ${port}
            initialDelaySeconds: 15
            periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: ${name}
spec:
  selector:
    app: ${name}
  ports:
    - port: 80
      targetPort: ${port}
`,
    );
  }

  await writeFile(
    path.join(dir, 'README.md'),
    `# Kubernetes manifests

One Deployment + Service per workspace app, generated from \`.xocket/config.json\`.

## Before applying

1. Replace \`ghcr.io/your-org/…\` with your registry, and use an immutable tag
   rather than \`latest\`.
2. Create the secrets these reference — nothing here carries real credentials:

\`\`\`bash
kubectl create secret generic app-env --from-env-file=apps/web/.env.production
\`\`\`

3. Add an Ingress (or Gateway) for whatever should be publicly reachable.

\`\`\`bash
kubectl apply -f infra/k8s/
\`\`\`
`,
  );
}
