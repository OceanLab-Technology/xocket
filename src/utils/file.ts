import fs from 'fs-extra';
import path from 'path';

export async function ensureDir(dir: string): Promise<void> {
  await fs.ensureDir(dir);
}

export async function copyFile(src: string, dest: string): Promise<void> {
  await fs.copy(src, dest);
}

export async function replaceInFile(
  filePath: string,
  searchValue: string | RegExp,
  replaceValue: string,
): Promise<void> {
  if (!(await fs.pathExists(filePath))) return;
  const content = await fs.readFile(filePath, 'utf-8');
  await fs.writeFile(filePath, content.replace(searchValue, replaceValue));
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content);
}
