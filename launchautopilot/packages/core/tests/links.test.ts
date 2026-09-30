import { describe, expect, it } from 'vitest';
import { relAttribute, relFor } from '../src/links.js';

const approved = { review: 'approved' as const, factsVerified: true };

describe('relFor', () => {
  it('follows editorially approved free listings', () => {
    expect(relFor({ paidOrderId: null, source: 'listing', listing: approved })).toBe('');
  });

  it('marks anything paid as sponsored, even when approved', () => {
    expect(relFor({ paidOrderId: 'ord_1', source: 'listing', listing: approved })).toBe(
      'sponsored',
    );
    expect(relFor({ paidOrderId: null, source: 'placement' })).toBe('sponsored');
  });

  it('marks user content ugc and unreviewed listings nofollow', () => {
    expect(relFor({ paidOrderId: null, source: 'comment' })).toBe('ugc');
    expect(
      relFor({
        paidOrderId: null,
        source: 'listing',
        listing: { review: 'pending', factsVerified: true },
      }),
    ).toBe('nofollow');
    expect(
      relFor({
        paidOrderId: null,
        source: 'listing',
        listing: { review: 'approved', factsVerified: false },
      }),
    ).toBe('nofollow');
  });

  it('always adds noopener', () => {
    expect(relAttribute({ paidOrderId: null, source: 'listing', listing: approved })).toBe(
      'noopener',
    );
    expect(relAttribute({ paidOrderId: 'x', source: 'listing' })).toBe('noopener sponsored');
  });
});
