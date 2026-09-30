import { describe, expect, it } from 'vitest';
import { differenceInDifferences, visibilityScore, wilson } from '../src/stats.js';

describe('wilson', () => {
  it('matches the textbook interval for 40/200', () => {
    const ci = wilson(40, 200);
    expect(ci.low).toBeCloseTo(0.1505, 3);
    expect(ci.high).toBeCloseTo(0.2609, 3);
  });

  it('stays inside 0..1 at the edges', () => {
    expect(wilson(0, 10).low).toBe(0);
    expect(wilson(10, 10).high).toBe(1);
  });

  it('returns the full range with no samples', () => {
    expect(wilson(0, 0)).toEqual({ low: 0, high: 1 });
  });
});

describe('visibilityScore', () => {
  it('weights engines and reports a range', () => {
    const s = visibilityScore({
      chatgpt: { mentions: 60, samples: 200 },
      perplexity: { mentions: 20, samples: 200 },
    });
    // (.45*.30 + .12*.10) / .57 = 25.8%
    expect(s.score).toBe(26);
    expect(s.low).toBeLessThan(s.score);
    expect(s.high).toBeGreaterThan(s.score);
    expect(s.enoughData).toBe(true);
  });

  it('refuses to present a number from a tiny panel', () => {
    expect(visibilityScore({ chatgpt: { mentions: 1, samples: 5 } }).enoughData).toBe(false);
  });
});

describe('differenceInDifferences', () => {
  it('finds a real lift when treatment moves and control does not', () => {
    const r = differenceInDifferences(
      { pre: { mentions: 24, samples: 200 }, post: { mentions: 48, samples: 200 } },
      { pre: { mentions: 30, samples: 200 }, post: { mentions: 32, samples: 200 } },
    );
    expect(r.lift).toBeCloseTo(0.11, 5);
    expect(r.verdict).toBe('significant_lift');
  });

  it('reports no change when control moved just as much', () => {
    const r = differenceInDifferences(
      { pre: { mentions: 24, samples: 200 }, post: { mentions: 48, samples: 200 } },
      { pre: { mentions: 30, samples: 200 }, post: { mentions: 54, samples: 200 } },
    );
    expect(r.verdict).toBe('no_detectable_change');
  });

  it('says not enough data on small panels', () => {
    const r = differenceInDifferences(
      { pre: { mentions: 2, samples: 20 }, post: { mentions: 8, samples: 20 } },
      { pre: { mentions: 3, samples: 20 }, post: { mentions: 3, samples: 20 } },
    );
    expect(r.verdict).toBe('not_enough_data');
  });
});
