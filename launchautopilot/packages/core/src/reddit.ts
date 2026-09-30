/**
 * Guardrails for publishing from a maker's own connected Reddit account.
 * The goal is to never do what gets accounts banned for manipulation, and to
 * stop at the first warning sign. It never evades detection.
 */

export interface SubredditRules {
  allowsSelfPromotion: boolean;
  /** Weekday (0 = Sunday) of a self-promotion thread, when that's the only allowed place. */
  selfPromotionDay?: number;
  requiresFlair: boolean;
  allowsLinks: boolean;
  minAccountAgeDaysEstimate: number;
  minKarmaEstimate: number;
}

export interface AccountState {
  ageDays: number;
  karma: number;
  postsToday: number;
  commentsToday: number;
  /** Days since this account last posted in the target subreddit; null = never. */
  daysSincePostInSub: number | null;
  /** Share of the last 30 days' contributions that mention the maker's product. */
  promoRatio30d: number;
  health: number;
}

export interface Draft {
  kind: 'post' | 'comment';
  approvedByOwner: boolean;
  mentionsProduct: boolean;
  hasDisclosure: boolean;
  hasFlair: boolean;
  hasLink: boolean;
  /** Highest text similarity to this account's recent posts, 0..1. */
  maxSimilarityToRecent: number;
  /** Other platform users already active in the target thread. */
  platformUsersInThread: number;
  scheduledWeekday: number;
}

export const LIMITS = {
  postsPerDay: 2,
  commentsPerDay: 10,
  daysBetweenPostsInSub: 7,
  maxPromoRatio: 0.1,
  maxSimilarity: 0.6,
  minHealth: 70,
} as const;

export type BlockReason =
  | 'not_approved'
  | 'missing_disclosure'
  | 'self_promotion_not_allowed'
  | 'wrong_self_promotion_day'
  | 'missing_flair'
  | 'links_not_allowed'
  | 'account_too_new'
  | 'karma_too_low'
  | 'daily_post_limit'
  | 'daily_comment_limit'
  | 'subreddit_cooldown'
  | 'promo_ratio_too_high'
  | 'too_similar_to_recent'
  | 'thread_already_has_platform_user'
  | 'account_paused';

export function canPublish(
  account: AccountState,
  rules: SubredditRules,
  draft: Draft,
): { ok: true } | { ok: false; reasons: BlockReason[] } {
  const reasons: BlockReason[] = [];
  if (!draft.approvedByOwner) reasons.push('not_approved');
  if (draft.mentionsProduct && !draft.hasDisclosure) reasons.push('missing_disclosure');
  if (draft.mentionsProduct) {
    if (!rules.allowsSelfPromotion && rules.selfPromotionDay === undefined) {
      reasons.push('self_promotion_not_allowed');
    } else if (!rules.allowsSelfPromotion && rules.selfPromotionDay !== draft.scheduledWeekday) {
      reasons.push('wrong_self_promotion_day');
    }
  }
  if (draft.kind === 'post' && rules.requiresFlair && !draft.hasFlair)
    reasons.push('missing_flair');
  if (draft.hasLink && !rules.allowsLinks) reasons.push('links_not_allowed');
  if (account.ageDays < rules.minAccountAgeDaysEstimate) reasons.push('account_too_new');
  if (account.karma < rules.minKarmaEstimate) reasons.push('karma_too_low');
  if (draft.kind === 'post') {
    if (account.postsToday >= LIMITS.postsPerDay) reasons.push('daily_post_limit');
    if (
      account.daysSincePostInSub !== null &&
      account.daysSincePostInSub < LIMITS.daysBetweenPostsInSub
    ) {
      reasons.push('subreddit_cooldown');
    }
  } else if (account.commentsToday >= LIMITS.commentsPerDay) {
    reasons.push('daily_comment_limit');
  }
  if (draft.mentionsProduct && account.promoRatio30d >= LIMITS.maxPromoRatio) {
    reasons.push('promo_ratio_too_high');
  }
  if (draft.maxSimilarityToRecent >= LIMITS.maxSimilarity) reasons.push('too_similar_to_recent');
  if (draft.platformUsersInThread > 0) reasons.push('thread_already_has_platform_user');
  if (account.health < LIMITS.minHealth) reasons.push('account_paused');
  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}

export interface HealthSignals {
  removals30d: number;
  modWarnings30d: number;
  negativeScoreItems30d: number;
  /** False when the account's recent items aren't visible logged out. */
  visibleLoggedOut: boolean;
}

/** 0–100. Below LIMITS.minHealth the account is paused and the maker is told why. */
export function accountHealth(s: HealthSignals): number {
  const score =
    100 -
    25 * s.removals30d -
    15 * s.modWarnings30d -
    10 * s.negativeScoreItems30d -
    (s.visibleLoggedOut ? 0 : 40);
  return Math.max(0, Math.min(100, score));
}
