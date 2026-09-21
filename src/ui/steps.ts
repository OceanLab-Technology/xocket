import ora, { type Ora } from 'ora';
import { t, glyph } from './theme.js';

/**
 * A numbered progress reporter for multi-phase commands.
 *
 * Scaffolding runs ~20 generators behind one spinner, which gave no sense of
 * progress or of where a failure happened. This shows `[2/5] Web app` and
 * leaves a tick behind for each completed phase.
 *
 * Falls back to plain lines when stdout is not a TTY so CI logs stay linear.
 */
export class Steps {
  private current = 0;
  private spinner: Ora | null = null;
  private readonly interactive = Boolean(process.stdout.isTTY);

  constructor(private readonly total: number) {}

  private label(title: string): string {
    const counter = t.muted(`[${this.current}/${this.total}]`);
    return `${counter} ${title}`;
  }

  /** Begin a phase. Any running phase is marked done first. */
  start(title: string): void {
    this.succeed();
    this.current += 1;

    if (!this.interactive) {
      process.stdout.write(`${this.label(title)}\n`);
      return;
    }
    this.spinner = ora({ text: this.label(title), spinner: 'dots' }).start();
  }

  /** Update the in-flight phase's text without advancing the counter. */
  update(detail: string): void {
    if (this.spinner)
      this.spinner.text = `${this.spinner.text} ${t.muted(glyph.dot)} ${t.muted(detail)}`;
  }

  /** Mark the current phase complete. */
  succeed(text?: string): void {
    if (!this.spinner) return;
    this.spinner.stopAndPersist({
      symbol: t.success(glyph.tick),
      text: text ?? this.spinner.text,
    });
    this.spinner = null;
  }

  /** Mark the current phase failed and stop. */
  fail(text?: string): void {
    if (!this.spinner) {
      if (text && !this.interactive) process.stdout.write(`${glyph.cross} ${text}\n`);
      return;
    }
    this.spinner.stopAndPersist({
      symbol: t.error(glyph.cross),
      text: text ? t.error(text) : this.spinner.text,
    });
    this.spinner = null;
  }

  /** Leave a dimmed note under the current phase. */
  note(text: string): void {
    const wasSpinning = this.spinner !== null;
    this.spinner?.stop();
    process.stdout.write(`  ${t.muted(text)}\n`);
    if (wasSpinning) this.spinner?.start();
  }

  /** Report a phase that was deliberately skipped. */
  skip(title: string, reason: string): void {
    this.succeed();
    this.current += 1;
    process.stdout.write(
      `${t.muted(glyph.dot)} ${this.label(t.muted(title))} ${t.muted(`(skipped — ${reason})`)}\n`,
    );
  }
}
