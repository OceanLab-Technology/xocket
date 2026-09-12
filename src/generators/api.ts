import type { Config } from '../types.js';
import path from 'path';
import { readPkg, writePkg, addDeps } from '../utils/pkg.js';
import { writeFile, ensureDir } from '../utils/file.js';

/**
 * Installs Axios and generates the API client. Always runs.
 * TypeScript only — writes .ts files.
 */
export async function generateApi(config: Config, targetDir: string) {
  const { framework } = config;

  let pkg = await readPkg(targetDir);
  pkg = addDeps(pkg, { axios: '^1.7.7' });
  await writePkg(targetDir, pkg);

  const apiDir = path.join(targetDir, 'src', 'api');
  await ensureDir(apiDir);

  // Environment-aware base URL per framework convention
  const baseUrlExpr =
    framework === 'react'
      ? "(import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001/api'"
      : "process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'";

  await writeFile(
    path.join(apiDir, 'axios.ts'),
    `import axios from 'axios'

const BASE_URL = ${baseUrlExpr}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach auth token when present
apiClient.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor — centralised error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthenticated — clear token, redirect to login, etc.
    }
    return Promise.reject(error)
  },
)
`,
  );

  await writeFile(
    path.join(apiDir, 'index.ts'),
    `// Re-export the configured Axios instance
export { apiClient } from './axios'

// Example service pattern:
// import { apiClient } from './axios'
//
// export const userService = {
//   getMe: () => apiClient.get<User>('/users/me'),
//   updateProfile: (data: Partial<User>) => apiClient.put<User>('/users/me', data),
// }
`,
  );
}
