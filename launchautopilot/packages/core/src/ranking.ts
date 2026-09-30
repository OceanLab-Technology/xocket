/**
 * Weekly cohort ranking. Weighted signals, shrunk toward the cohort mean so a
 * handful of lucky votes can't beat broad real support. Payment never enters.
 */

export interface Voter {
  accountAgeDays: number;
  verifiedIdentity: boolean;
  /** Distinct products this voter engaged with in the last 90 days. */
  engagementDiversity: number;
  /** Social-graph hops from the maker; 1 = direct connection. */
  graphDistanceToMaker: number;
  /** 0..1 from the anti-fraud service; 1 = certainly fraudulent. */
  fraudScore: number;
}

/** 0..1 weight for one vote. Suspicious votes silently count for nothing. */
export function voteWeight(v: Voter): number {
  if (v.fraudScore >= 0.7) return 0;
  const age = Math.min(1, v.accountAgeDays / 90);
  const identity = v.verifiedIdentity ? 1 : 0.4;
  const diversity = Math.min(1, v.engagementDiversity / 10);
  const distance = v.graphDistanceToMaker <= 1 ? 0.3 : v.graphDistanceToMaker === 2 ? 0.7 : 1;
  const w = (0.35 * age + 0.35 * identity + 0.3 * diversity) * distance * (1 - v.fraudScore);
  return Math.max(0, Math.min(1, w));
}

export interface LaunchSignals {
  voteWeights: number[];
  qualifiedComments: number;
  uniqueClicks: number;
  returnVisits: number;
}

export function rawScore(s: LaunchSignals): number {
  const votes = s.voteWeights.reduce((a, b) => a + b, 0);
  return (
    votes + 2 * s.qualifiedComments + 3 * Math.log1p(s.uniqueClicks) + Math.log1p(s.returnVisits)
  );
}

export interface Ranked<T> {
  item: T;
  score: number;
}

/**
 * Bayesian average: (sum + m*C) / (n + m), where n is the number of
 * engagements, C the cohort's mean score per engagement and m the prior
 * strength. Small launches are pulled toward the mean until evidence builds.
 */
export function rankCohort<T>(
  launches: { item: T; signals: LaunchSignals }[],
  priorStrength = 10,
): Ranked<T>[] {
  const withN = launches.map((l) => {
    const n = l.signals.voteWeights.length + l.signals.qualifiedComments;
    return { item: l.item, sum: rawScore(l.signals), n };
  });
  const totalN = withN.reduce((a, l) => a + l.n, 0);
  const cohortMean = totalN > 0 ? withN.reduce((a, l) => a + l.sum, 0) / totalN : 0;
  return withN
    .map((l) => ({
      item: l.item,
      score: ((l.sum + priorStrength * cohortMean) / (l.n + priorStrength)) * Math.log1p(l.n),
    }))
    .sort((a, b) => b.score - a.score);
}
