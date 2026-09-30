import { describe, expect, it } from 'vitest';
import { mentionsProduct, planSamples } from '../src/engines.js';

describe('planSamples', () => {
  it('samples uncertain prompts more than settled ones', () => {
    const jobs = planSamples(
      [
        { id: 'open', lastRate: 0.4, lastSamples: 40 },
        { id: 'settled', lastRate: 0, lastSamples: 40 },
      ],
      ['chatgpt', 'perplexity'],
      'en-US',
    );
    expect(jobs.filter((j) => j.promptId === 'open')).toHaveLength(16);
    expect(jobs.filter((j) => j.promptId === 'settled')).toHaveLength(8);
  });
});

describe('mentionsProduct', () => {
  it('matches aliases as whole words, case-insensitively', () => {
    expect(mentionsProduct('Try Linear or Jira.', ['linear'])).toBe(true);
    expect(mentionsProduct('A nonlinear approach', ['linear'])).toBe(false);
    expect(mentionsProduct('Use cal.com for this', ['cal.com'])).toBe(true);
  });
});
