/**
 * Mention-rate statistics. AI answers change almost every run, so every
 * number we show is a rate with an interval, never a single "rank".
 */

export interface Interval {
  low: number;
  high: number;
}

/** Wilson score interval for a binomial proportion (default 95%). */
export function wilson(successes: number, trials: number, z = 1.96): Interval {
  if (trials <= 0) return { low: 0, high: 1 };
  if (successes < 0 || successes > trials) {
    throw new RangeError(`successes (${successes}) must be within 0..${trials}`);
  }
  const p = successes / trials;
  const z2 = z * z;
  const denom = 1 + z2 / trials;
  const centre = (p + z2 / (2 * trials)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / trials + z2 / (4 * trials * trials))) / denom;
  return { low: Math.max(0, centre - margin), high: Math.min(1, centre + margin) };
}

export type Engine = 'chatgpt' | 'google_aio' | 'perplexity' | 'gemini' | 'claude';

export interface EngineSample {
  mentions: number;
  samples: number;
}

/** Rough share of buyer usage per engine. Editable per customer. */
export const DEFAULT_ENGINE_WEIGHTS: Record<Engine, number> = {
  chatgpt: 0.45,
  google_aio: 0.25,
  perplexity: 0.12,
  gemini: 0.1,
  claude: 0.08,
};

export interface VisibilityScore {
  score: number;
  low: number;
  high: number;
  /** False when the range is too wide to be worth showing as a number. */
  enoughData: boolean;
}

/**
 * AI Visibility Score, 0–100: engine-weighted mention rate.
 * Engines with no samples are dropped and the remaining weights renormalised.
 */
export function visibilityScore(
  byEngine: Partial<Record<Engine, EngineSample>>,
  weights: Partial<Record<Engine, number>> = DEFAULT_ENGINE_WEIGHTS,
  maxRangeWidth = 25,
): VisibilityScore {
  let totalWeight = 0;
  let point = 0;
  let low = 0;
  let high = 0;
  for (const [engine, sample] of Object.entries(byEngine) as [Engine, EngineSample][]) {
    const w = weights[engine] ?? 0;
    if (w <= 0 || sample.samples <= 0) continue;
    const ci = wilson(sample.mentions, sample.samples);
    totalWeight += w;
    point += w * (sample.mentions / sample.samples);
    low += w * ci.low;
    high += w * ci.high;
  }
  if (totalWeight === 0) return { score: 0, low: 0, high: 100, enoughData: false };
  const scale = 100 / totalWeight;
  const result = {
    score: Math.round(point * scale),
    low: Math.round(low * scale),
    high: Math.round(high * scale),
  };
  return { ...result, enoughData: result.high - result.low <= maxRangeWidth };
}

export interface ArmCounts {
  pre: EngineSample;
  post: EngineSample;
}

export type Verdict = 'significant_lift' | 'no_detectable_change' | 'not_enough_data';

export interface ProofResult {
  lift: number;
  interval: Interval;
  verdict: Verdict;
}

/**
 * Difference-in-differences on mention rates: treatment prompts vs control
 * prompts, before vs after. Uses a normal approximation on the four
 * independent proportions; the production stats service replaces this with a
 * prompt-clustered bootstrap because runs of one prompt are correlated.
 */
export function differenceInDifferences(
  treatment: ArmCounts,
  control: ArmCounts,
  minSamplesPerCell = 50,
  z = 1.96,
): ProofResult {
  const cells = [treatment.pre, treatment.post, control.pre, control.post];
  const rate = (s: EngineSample) => s.mentions / s.samples;
  const variance = (s: EngineSample) => (rate(s) * (1 - rate(s))) / s.samples;

  if (cells.some((c) => c.samples < minSamplesPerCell)) {
    const lift = cells.every((c) => c.samples > 0)
      ? rate(treatment.post) - rate(treatment.pre) - (rate(control.post) - rate(control.pre))
      : 0;
    return { lift, interval: { low: -1, high: 1 }, verdict: 'not_enough_data' };
  }

  const lift =
    rate(treatment.post) - rate(treatment.pre) - (rate(control.post) - rate(control.pre));
  const se = Math.sqrt(cells.reduce((sum, c) => sum + variance(c), 0));
  const interval = { low: lift - z * se, high: lift + z * se };
  const verdict: Verdict = interval.low > 0 ? 'significant_lift' : 'no_detectable_change';
  return { lift, interval, verdict };
}
