import type { Config } from '../types.js';
import path from 'path';
import { readPkg, writePkg, addDeps } from '../utils/pkg.js';
import { writeFile, ensureDir } from '../utils/file.js';
import { envConvention } from '../utils/env.js';
import { deps } from '../versions.js';

/**
 * Installs Axios and generates the API client for the given app.
 *
 * The base-URL expression follows the target's env convention, so the Expo app
 * reads EXPO_PUBLIC_API_URL rather than a web-only variable.
 */
export async function generateApi(config: Config, targetDir: string) {
  const { target } = config;
  const env = envConvention(config);

  let pkg = await readPkg(targetDir);
  pkg = addDeps(pkg, deps('axios'));
  await writePkg(targetDir, pkg);

  const apiDir = path.join(targetDir, 'src', 'api');
  await ensureDir(apiDir);

  // React Native has no localStorage, so each target gets its own token store
  // behind one shared getToken/setToken interface.
  const tokenStore =
    target === 'expo'
      ? `// In-memory for now — swap for expo-secure-store when you add real sessions.
let token: string | null = null

export function setToken(next: string | null) {
  token = next
}

export function getToken(): string | null {
  return token
}
`
      : `const TOKEN_KEY = 'token'

export function setToken(next: string | null) {
  if (typeof window === 'undefined') return
  if (next === null) window.localStorage.removeItem(TOKEN_KEY)
  else window.localStorage.setItem(TOKEN_KEY, next)
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}
`;

  await writeFile(
    path.join(apiDir, 'axios.ts'),
    `import axios from 'axios'

const BASE_URL = ${env.read('API_URL')} ?? 'http://localhost:3001/api'

${tokenStore}
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach the auth token when one is present.
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Centralised error handling.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear the session and send the user back to sign-in.
    }
    return Promise.reject(error)
  },
)
`,
  );

  await writeFile(
    path.join(apiDir, 'index.ts'),
    `export { apiClient, getToken, setToken } from './axios'

// Example service pattern:
//
// import { apiClient } from './axios'
//
// export const userService = {
//   getMe: () => apiClient.get<User>('/users/me'),
//   updateProfile: (data: Partial<User>) => apiClient.put<User>('/users/me', data),
// }
`,
  );
}
