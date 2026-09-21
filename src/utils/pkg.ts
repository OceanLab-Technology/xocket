import fs from 'fs-extra';
import path from 'path';

export async function readPkg(dir: string): Promise<any> {
  return fs.readJson(path.join(dir, 'package.json'));
}

export async function writePkg(dir: string, pkg: any): Promise<void> {
  await fs.writeJson(path.join(dir, 'package.json'), pkg, { spaces: 2 });
}

export function addDeps(pkg: any, deps: Record<string, string>): any {
  pkg.dependencies = { ...(pkg.dependencies || {}), ...deps };
  return pkg;
}

export function addDevDeps(pkg: any, deps: Record<string, string>): any {
  pkg.devDependencies = { ...(pkg.devDependencies || {}), ...deps };
  return pkg;
}

export function addScript(pkg: any, name: string, cmd: string): any {
  pkg.scripts = { ...(pkg.scripts || {}), [name]: cmd };
  return pkg;
}

export function setField(pkg: any, key: string, value: any): any {
  pkg[key] =
    typeof value === 'object' && !Array.isArray(value) ? { ...(pkg[key] || {}), ...value } : value;
  return pkg;
}
