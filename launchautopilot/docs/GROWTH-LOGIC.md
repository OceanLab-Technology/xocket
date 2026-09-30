# Growth logic

Full visual version: https://claude.ai/artifact/WfaAfuUVqpxdyfWnAeisQS (private to the
owner until shared). Code: `packages/core/src`.

| Scoreboard                 | Logic                                                                                     | Code                                         |
| -------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------- |
| Our domain rating          | Earned, optional achievement badges; Index citations; proof reports; our own launches     | `JOBS: cohort.close, badges.check`           |
| Our AI visibility          | We track ourselves on "where to launch" prompts with the same engine; close citation gaps | `planSamples`, `visibilityScore`             |
| Listed products: Google/DR | Editorially approved listings get a followed link; paid = sponsored; brand-search pages   | `relFor`                                     |
| Listed products: AI score  | Engine-weighted mention rate with Wilson range; diff-in-diff proof vs control prompts     | `visibilityScore`, `differenceInDifferences` |
| Reddit autopilot           | Own OAuth account, approval per item, rules/cooldowns/ratio/similarity/one-per-thread     | `canPublish`, `accountHealth`                |
| Launch ranking             | Trust-weighted votes, comments, clicks, returns, Bayesian shrinkage                       | `voteWeight`, `rankCohort`                   |
