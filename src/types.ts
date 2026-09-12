export interface Config {
  projectName: string;
  rootDir: string;
  webDir: string;
  packageManager: string;
  projectType: string;
  framework: string;
  language: string;
  stateManagement: string;
  serverState: string;
  backend: string;
  isNext: boolean;
  isReact: boolean;
}

export interface ManifestApp {
  path: string;
  framework: string;
  backend: string;
  serverState: string;
  stateManagement: string;
  sentry: boolean;
}

export interface Manifest {
  version: string;
  createdAt: string;
  projectName: string;
  packageManager: string;
  apps: Record<string, ManifestApp>;
  packages: string[];
  modules: string[];
}
