import { describe, expect, it } from 'vitest';
import {
  accountHealth,
  canPublish,
  type AccountState,
  type Draft,
  type SubredditRules,
} from '../src/reddit.js';

const rules: SubredditRules = {
  allowsSelfPromotion: true,
  requiresFlair: true,
  allowsLinks: true,
  minAccountAgeDaysEstimate: 30,
  minKarmaEstimate: 100,
};
const account: AccountState = {
  ageDays: 400,
  karma: 2000,
  postsToday: 0,
  commentsToday: 0,
  daysSincePostInSub: null,
  promoRatio30d: 0.05,
  health: 100,
};
const draft: Draft = {
  kind: 'post',
  approvedByOwner: true,
  mentionsProduct: true,
  hasDisclosure: true,
  hasFlair: true,
  hasLink: true,
  maxSimilarityToRecent: 0.1,
  platformUsersInThread: 0,
  scheduledWeekday: 2,
};

describe('canPublish', () => {
  it('allows an approved, disclosed post that fits the rules', () => {
    expect(canPublish(account, rules, draft)).toEqual({ ok: true });
  });

  it('never publishes without the owner’s approval or disclosure', () => {
    const r = canPublish(account, rules, {
      ...draft,
      approvedByOwner: false,
      hasDisclosure: false,
    });
    expect(r).toEqual({ ok: false, reasons: ['not_approved', 'missing_disclosure'] });
  });

  it('keeps our makers out of each other’s threads', () => {
    const r = canPublish(account, rules, { ...draft, platformUsersInThread: 1 });
    expect(r.ok).toBe(false);
  });

  it('respects self-promotion days', () => {
    const weekly = { ...rules, allowsSelfPromotion: false, selfPromotionDay: 6 };
    expect(canPublish(account, weekly, draft)).toEqual({
      ok: false,
      reasons: ['wrong_self_promotion_day'],
    });
    expect(canPublish(account, weekly, { ...draft, scheduledWeekday: 6 })).toEqual({ ok: true });
  });

  it('enforces cooldowns and the promo ratio', () => {
    const r = canPublish({ ...account, daysSincePostInSub: 3, promoRatio30d: 0.2 }, rules, draft);
    expect(r).toEqual({ ok: false, reasons: ['subreddit_cooldown', 'promo_ratio_too_high'] });
  });
});

describe('accountHealth', () => {
  it('pauses after a removal plus a warning', () => {
    const h = accountHealth({
      removals30d: 1,
      modWarnings30d: 1,
      negativeScoreItems30d: 0,
      visibleLoggedOut: true,
    });
    expect(h).toBe(60);
  });

  it('treats a visibility drop as a stop signal', () => {
    expect(
      accountHealth({
        removals30d: 0,
        modWarnings30d: 0,
        negativeScoreItems30d: 0,
        visibleLoggedOut: false,
      }),
    ).toBe(60);
  });
});
