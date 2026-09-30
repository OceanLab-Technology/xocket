# LaunchAutopilot — contributor notes

## Rules that exist for a reason

1. **Scoring and policy live in `packages/core` only.** Link `rel`, vote weights,
   cohort ranking, visibility scores, proof verdicts and Reddit guardrails are pure
   functions with tests. Apps and jobs call them; they never re-implement them.
2. **Payment never changes review state or organic rank.** Anything paid renders
   `rel="sponsored"` (`relFor`). Followed links come only from editorial approval.
3. **No badge-for-link trades.** Badges are earned and optional; a listing's link
   never depends on whether the maker embeds one.
4. **Never show an AI "rank".** Show mention rates with intervals, and say
   "not enough data" when the interval is too wide.
5. **Prompt sets are frozen before any intervention** and include control prompts.
6. **Every sample records its channel** (`api` or `licensed_ui`), model and locale.
7. **Reddit: the maker's own account only, approval on every item.** No account
   pools, warming, vote activity, detection evasion, or two platform users in one
   thread. `canPublish` must pass right before publishing, not only at approval.
8. **llms.txt and schema are hygiene, not ranking levers.** Don't market them as such.
