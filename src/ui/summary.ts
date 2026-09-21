import pc from 'picocolors';
import { t, glyph, rule, gradient } from './theme.js';

export interface SummaryRow {
  label: string;
  value: string;
}

export interface SummarySection {
  title: string;
  items: string[];
}

/** A key/value block with aligned values. */
export function keyValues(rows: SummaryRow[], indent = '  '): string {
  const width = Math.max(...rows.map((r) => r.label.length));
  return rows.map((r) => `${indent}${pc.bold(r.label.padEnd(width))}  ${r.value}`).join('\n');
}

/** A two-column checklist, so long feature lists do not run off the screen. */
export function checklist(items: string[], indent = '  '): string {
  const cols = (process.stdout.columns ?? 80) >= 90 && items.length > 6 ? 2 : 1;
  if (cols === 1) {
    return items.map((i) => `${indent}${t.success(glyph.tick)} ${i}`).join('\n');
  }

  const half = Math.ceil(items.length / 2);
  const left = items.slice(0, half);
  const right = items.slice(half);
  const width = Math.max(...left.map((i) => i.length)) + 4;

  return left
    .map((l, i) => {
      const cell = `${t.success(glyph.tick)} ${l}`;
      const pad = ' '.repeat(Math.max(width - l.length, 2));
      const r = right[i];
      return `${indent}${cell}${r ? `${pad}${t.success(glyph.tick)} ${r}` : ''}`;
    })
    .join('\n');
}

/** A boxed list of shell commands the user is meant to run next. */
export function commandBlock(commands: Array<{ cmd: string; note?: string }>): string {
  const width = Math.max(...commands.map((c) => c.cmd.length));
  return commands
    .map(({ cmd, note }) => {
      const line = `  ${t.muted(glyph.arrow)} ${t.code(cmd.padEnd(note ? width : 0))}`;
      return note ? `${line}  ${t.muted(note)}` : line.trimEnd();
    })
    .join('\n');
}

/** Section heading with a gradient underline. */
export function heading(text: string): string {
  return `\n${gradient(text)}\n${rule(Math.max(text.length, 24))}`;
}
