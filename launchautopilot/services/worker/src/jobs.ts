/**
 * Every recurring job the MVP runs. The scheduler (pg-boss in the MVP) reads
 * this table; handlers live next to their domain and call @launchautopilot/core
 * for all scoring so the rules exist in exactly one place.
 */

export interface JobSpec {
  name: string;
  /** Cron in UTC. */
  cron: string;
  does: string;
}

export const JOBS: JobSpec[] = [
  {
    name: 'cohort.open',
    cron: '0 0 * * 1',
    does: 'Open the new ISO-week cohort with its editorial capacity',
  },
  {
    name: 'cohort.close',
    cron: '59 23 * * 0',
    does: 'rankCohort(), assign final ranks and achievement badges',
  },
  {
    name: 'votes.fraud',
    cron: '*/15 * * * *',
    does: 'Velocity and graph checks; set vote weight to 0 on fraud',
  },
  {
    name: 'samples.plan',
    cron: '0 2 * * *',
    does: 'planSamples() for every frozen prompt set due today',
  },
  {
    name: 'samples.run',
    cron: '*/5 * * * *',
    does: 'Drain sample jobs through engine adapters within budget',
  },
  {
    name: 'samples.extract',
    cron: '*/5 * * * *',
    does: 'Extract mentions and citations; alias-match products',
  },
  {
    name: 'metrics.snapshot',
    cron: '0 4 * * 1',
    does: 'Wilson intervals and visibilityScore() per product and engine',
  },
  {
    name: 'proof.report',
    cron: '0 6 * * *',
    does: 'differenceInDifferences() for launches at +30 and +90 days',
  },
  {
    name: 'badges.check',
    cron: '0 3 * * 3',
    does: 'Crawl maker sites for embedded badges (dashboard only)',
  },
  {
    name: 'reddit.rules',
    cron: '0 1 * * *',
    does: 'Refresh cached subreddit rules for active drafts',
  },
  {
    name: 'reddit.publish',
    cron: '* * * * *',
    does: 'Publish approved, due drafts that pass canPublish()',
  },
  {
    name: 'reddit.health',
    cron: '0 */6 * * *',
    does: 'accountHealth(); pause accounts below threshold and tell the maker',
  },
];
