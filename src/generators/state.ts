import type { Config } from '../types.js';
import path from 'path';
import { readPkg, writePkg, addDeps } from '../utils/pkg.js';
import { writeFile, ensureDir } from '../utils/file.js';

/**
 * Generates state management setup in apps/web.
 * TypeScript is mandatory — no JS branches.
 */
export async function generateState(config: Config, targetDir: string) {
  const { stateManagement } = config;
  if (stateManagement === 'none') return;

  if (stateManagement === 'zustand') {
    await generateZustand(targetDir);
  } else if (stateManagement === 'context') {
    await generateContext(targetDir);
  } else if (stateManagement === 'redux') {
    await generateRedux(targetDir);
  }
}

// ─── Zustand ──────────────────────────────────────────────────────────────────

async function generateZustand(webDir: string) {
  let pkg = await readPkg(webDir);
  pkg = addDeps(pkg, { zustand: '^4.5.4' });
  await writePkg(webDir, pkg);

  const storeDir = path.join(webDir, 'src', 'store');
  await ensureDir(storeDir);

  await writeFile(
    path.join(storeDir, 'index.ts'),
    `import { create } from 'zustand'

interface AuthState {
  user: Record<string, unknown> | null
  isAuthenticated: boolean
  setUser: (user: Record<string, unknown> | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}))
`,
  );
}

// ─── React Context ────────────────────────────────────────────────────────────

async function generateContext(webDir: string) {
  const contextDir = path.join(webDir, 'src', 'context');
  await ensureDir(contextDir);

  await writeFile(
    path.join(contextDir, 'AppContext.tsx'),
    `import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface AppContextValue {
  user: Record<string, unknown> | null
  setUser: (user: Record<string, unknown> | null) => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Record<string, unknown> | null>(null)

  return (
    <AppContext.Provider value={{ user, setUser }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}
`,
  );
}

// ─── Redux Toolkit ────────────────────────────────────────────────────────────

async function generateRedux(webDir: string) {
  let pkg = await readPkg(webDir);
  pkg = addDeps(pkg, {
    '@reduxjs/toolkit': '^2.2.7',
    'react-redux': '^9.1.2',
  });
  await writePkg(webDir, pkg);

  const storeDir = path.join(webDir, 'src', 'store');
  const slicesDir = path.join(storeDir, 'slices');
  await ensureDir(slicesDir);

  await writeFile(
    path.join(storeDir, 'index.ts'),
    `import { configureStore } from '@reduxjs/toolkit'
import { appReducer } from './slices/appSlice'

export const store = configureStore({
  reducer: {
    app: appReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
`,
  );

  await writeFile(
    path.join(slicesDir, 'appSlice.ts'),
    `import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

interface AppState {
  user: Record<string, unknown> | null
  isAuthenticated: boolean
}

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<Record<string, unknown> | null>) {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
    },
    logout(state) {
      state.user = null
      state.isAuthenticated = false
    },
  },
})

export const { setUser, logout } = appSlice.actions
export const appReducer = appSlice.reducer
`,
  );
}
