import { describe, expect, it } from 'vitest';
import { rankCohort, voteWeight } from '../src/ranking.js';

const trusted = {
  accountAgeDays: 400,
  verifiedIdentity: true,
  engagementDiversity: 20,
  graphDistanceToMaker: 4,
  fraudScore: 0,
};

describe('voteWeight', () => {
  it('gives established, unconnected voters full weight', () => {
    expect(voteWeight(trusted)).toBe(1);
  });

  it('zeroes likely fraud silently', () => {
    expect(voteWeight({ ...trusted, fraudScore: 0.8 })).toBe(0);
  });

  it('discounts the maker’s direct connections', () => {
    expect(voteWeight({ ...trusted, graphDistanceToMaker: 1 })).toBeCloseTo(0.3);
  });
});

describe('rankCohort', () => {
  it('puts broad support above a few lucky votes', () => {
    const base = { qualifiedComments: 0, uniqueClicks: 0, returnVisits: 0 };
    const ranked = rankCohort([
      { item: 'lucky', signals: { ...base, voteWeights: Array(3).fill(1) } },
      { item: 'broad', signals: { ...base, voteWeights: Array(60).fill(0.8) } },
    ]);
    expect(ranked[0]?.item).toBe('broad');
  });
});
