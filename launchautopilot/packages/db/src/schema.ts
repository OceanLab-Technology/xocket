import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

const id = () => uuid('id').primaryKey().defaultRandom();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

// ─── People ────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: id(),
  email: text('email').notNull().unique(),
  name: text('name'),
  /** 0..1, feeds vote weighting. Recomputed by the anti-fraud job. */
  trustScore: real('trust_score').notNull().default(0.5),
  verifiedIdentity: boolean('verified_identity').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ─── Products and launches ─────────────────────────────────────────────────

export const reviewState = pgEnum('review_state', ['pending', 'approved', 'rejected']);

export const products = pgTable('products', {
  id: id(),
  slug: text('slug').notNull().unique(),
  domain: text('domain').notNull(),
  name: text('name').notNull(),
  /** Every spelling we match in AI answers: brand, domain, common typos. */
  aliases: text('aliases').array().notNull().default([]),
  makerId: uuid('maker_id')
    .notNull()
    .references(() => users.id),
  review: reviewState('review').notNull().default('pending'),
  factsVerified: boolean('facts_verified').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Versioned facts the maker confirmed: pricing, audience, competitors. */
export const productFacts = pgTable('product_facts', {
  id: id(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  version: integer('version').notNull(),
  facts: jsonb('facts').notNull(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  createdAt: createdAt(),
});

export const cohorts = pgTable('cohorts', {
  id: id(),
  /** ISO week, e.g. "2026-W41". Monday–Sunday UTC. */
  week: text('week').notNull().unique(),
  capacity: integer('capacity').notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
});

export const launches = pgTable(
  'launches',
  {
    id: id(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    cohortId: uuid('cohort_id')
      .notNull()
      .references(() => cohorts.id),
    reviewerId: uuid('reviewer_id').references(() => users.id),
    /** Payment picks a date among open slots; it never changes review. */
    paidOrderId: text('paid_order_id'),
    finalRank: integer('final_rank'),
    badge: text('badge'),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('launches_product_cohort').on(t.productId, t.cohortId)],
);

export const votes = pgTable(
  'votes',
  {
    id: id(),
    launchId: uuid('launch_id')
      .notNull()
      .references(() => launches.id),
    voterId: uuid('voter_id')
      .notNull()
      .references(() => users.id),
    /** 0 = silently discounted. */
    weight: real('weight').notNull(),
    fraudScore: real('fraud_score').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('votes_one_per_voter').on(t.launchId, t.voterId)],
);

export const comments = pgTable('comments', {
  id: id(),
  launchId: uuid('launch_id')
    .notNull()
    .references(() => launches.id),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  body: text('body').notNull(),
  qualified: boolean('qualified').notNull().default(false),
  createdAt: createdAt(),
});

export const linkSource = pgEnum('link_source', ['listing', 'comment', 'review', 'placement']);

/** Every outbound link we render. Invariant: paid_order_id ⇒ rel = sponsored. */
export const outboundLinks = pgTable('outbound_links', {
  id: id(),
  productId: uuid('product_id').references(() => products.id),
  url: text('url').notNull(),
  source: linkSource('source').notNull(),
  paidOrderId: text('paid_order_id'),
  /** Computed by relFor() in @launchautopilot/core; stored for audit. */
  rel: text('rel').notNull(),
  createdAt: createdAt(),
});

// ─── AI visibility engine ──────────────────────────────────────────────────

export const promptSets = pgTable('prompt_sets', {
  id: id(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  version: integer('version').notNull(),
  /** Set before any intervention; frozen sets are never edited. */
  frozenAt: timestamp('frozen_at', { withTimezone: true }),
  createdAt: createdAt(),
});

export const prompts = pgTable('prompts', {
  id: id(),
  promptSetId: uuid('prompt_set_id')
    .notNull()
    .references(() => promptSets.id),
  text: text('text').notNull(),
  intent: text('intent').notNull(),
  isControl: boolean('is_control').notNull().default(false),
});

export const channel = pgEnum('channel', ['api', 'licensed_ui']);

export const samples = pgTable(
  'samples',
  {
    id: id(),
    promptId: uuid('prompt_id')
      .notNull()
      .references(() => prompts.id),
    engine: text('engine').notNull(),
    channel: channel('channel').notNull(),
    model: text('model').notNull(),
    locale: text('locale').notNull(),
    /** Object-storage key for the raw answer. */
    rawAnswerRef: text('raw_answer_ref').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('samples_prompt_engine').on(t.promptId, t.engine, t.fetchedAt)],
);

export const mentions = pgTable('mentions', {
  id: id(),
  sampleId: uuid('sample_id')
    .notNull()
    .references(() => samples.id),
  brand: text('brand').notNull(),
  productId: uuid('product_id').references(() => products.id),
  position: integer('position'),
  sentiment: real('sentiment'),
  recommended: boolean('recommended').notNull().default(false),
});

export const citations = pgTable(
  'citations',
  {
    id: id(),
    sampleId: uuid('sample_id')
      .notNull()
      .references(() => samples.id),
    url: text('url').notNull(),
    domain: text('domain').notNull(),
  },
  (t) => [index('citations_domain').on(t.domain)],
);

export const metricSnapshots = pgTable('metric_snapshots', {
  id: id(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  engine: text('engine'),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  mentionRate: real('mention_rate').notNull(),
  ciLow: real('ci_low').notNull(),
  ciHigh: real('ci_high').notNull(),
  n: integer('n').notNull(),
  shareOfVoice: real('share_of_voice'),
});

export const interventions = pgTable('interventions', {
  id: id(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  type: text('type').notNull(),
  targetDomain: text('target_domain'),
  disclosed: boolean('disclosed').notNull().default(true),
  happenedAt: timestamp('happened_at', { withTimezone: true }).notNull(),
});

export const evidenceLevel = pgEnum('evidence_level', ['strong', 'moderate', 'hygiene']);

export const auditFindings = pgTable('audit_findings', {
  id: id(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  check: text('check').notNull(),
  passed: boolean('passed').notNull(),
  evidence: evidenceLevel('evidence').notNull(),
  detail: text('detail'),
  createdAt: createdAt(),
});

export const crawlerHits = pgTable('crawler_hits', {
  id: id(),
  productId: uuid('product_id').references(() => products.id),
  bot: text('bot').notNull(),
  verified: boolean('verified').notNull(),
  path: text('path').notNull(),
  hitAt: timestamp('hit_at', { withTimezone: true }).notNull(),
});

// ─── Reddit (maker-connected accounts) ─────────────────────────────────────

export const redditAccounts = pgTable('reddit_accounts', {
  id: id(),
  /** One connected account per maker: their own. */
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id),
  username: text('username').notNull(),
  /** Encrypted OAuth refresh token. */
  refreshTokenEnc: text('refresh_token_enc').notNull(),
  health: integer('health').notNull().default(100),
  pausedReason: text('paused_reason'),
  createdAt: createdAt(),
});

export const redditDraftState = pgEnum('reddit_draft_state', [
  'draft',
  'blocked',
  'approved',
  'scheduled',
  'published',
  'removed',
]);

export const redditDrafts = pgTable('reddit_drafts', {
  id: id(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => redditAccounts.id),
  productId: uuid('product_id').references(() => products.id),
  subreddit: text('subreddit').notNull(),
  threadId: text('thread_id'),
  kind: text('kind').notNull(),
  body: text('body').notNull(),
  state: redditDraftState('state').notNull().default('draft'),
  blockReasons: text('block_reasons').array(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  redditId: text('reddit_id'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type Launch = typeof launches.$inferSelect;
export type Sample = typeof samples.$inferSelect;
