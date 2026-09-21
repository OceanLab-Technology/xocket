import pc from 'picocolors';
import { gradientBlock, gradient, t, glyph } from './theme.js';
import { VERSION } from '../version.js';

const LOGO = String.raw`
 __  __     ______     ______     __  __     ______     ______
/\ \_\ \   /\  __ \   /\  ___\   /\ \/ /    /\  ___\   /\__  _\
\ \  __ \  \ \ \/\ \  \ \ \____  \ \  _"-.  \ \  __\   \/_/\ \/
 \ \_\ \_\  \ \_____\  \ \_____\  \ \_\ \_\  \ \_____\    \ \_\
  \/_/\/_/   \/_____/   \/_____/   \/_/\/_/   \/_____/     \/_/`;

/**
 * The full banner, for the start of `create`.
 *
 * Suppressed when stdout is not a TTY (CI logs, piped output) — there the
 * compact one-liner carries the same information without the noise.
 */
export function banner(subtitle?: string): string {
  if (!process.stdout.isTTY || (process.stdout.columns ?? 80) < 70) {
    return compactBanner(subtitle);
  }

  const lines = [
    gradientBlock(LOGO.replace(/^\n/, '')),
    '',
    `  ${t.muted(`v${VERSION}`)}  ${t.muted(glyph.dot)}  ${gradient('Monorepo Development Platform')}`,
  ];

  if (subtitle) lines.push(`  ${t.muted(subtitle)}`);

  return lines.join('\n');
}

/** One-line banner for `add` and for non-TTY output. */
export function compactBanner(subtitle?: string): string {
  const tag = `${glyph.sparkle} ${pc.bold('Xocket')} ${t.muted(`v${VERSION}`)}`;
  return subtitle ? `${tag}  ${t.muted(glyph.dot)}  ${t.muted(subtitle)}` : tag;
}
