# MVP spec (weeks 0–6)

Goal: 100 launched products, 40% of makers view their AI baseline, and the first
cohort re-measured at +30 days.

Strategy background: https://claude.ai/artifact/UqwPKD4o95z4w7eZDvpSBv

## 1. Maker flow

1. **Sign in** with GitHub, Google or LinkedIn (Supabase Auth). Sets `verified_identity`.
2. **Submit URL.** Worker fetches the site; an LLM drafts name, category, pricing,
   audience, competitors, aliases. Maker edits and confirms → `product_facts` v1.
3. **Free baseline starts immediately:** audit + 10 prompts × 3 engines × 5 runs.
4. **Pick a cohort week.** Queue is FIFO with a visible estimated date. Launch Pass
   ($49) picks any week with open capacity.
5. **Editorial review** (target 24 h). Approve → followed link; reject → reason shown.
6. **Launch week.** Listed on the board, eligible for the Monday newsletter.
7. **Cohort closes Sunday 23:59 UTC.** `rankCohort` sets ranks; badges issued.
8. **+30 days** (Launch Pass): re-measure and send the proof report.

## 2. Screens

| Screen           | Must show                                                                        |
| ---------------- | -------------------------------------------------------------------------------- |
| Home / this week | Cohort board by score, sponsored rows fixed and labelled, countdown to close     |
| Product page     | Visible facts, alternatives, reviews, comparison block, JSON-LD, outbound link   |
| Submit           | URL → prefilled form → confirm facts → pick week → pay (optional)                |
| Maker dashboard  | Baseline score with range, per-engine rates, cited-domain gap list, badge status |
| Proof report     | Treatment vs control, lift with interval, verdict in plain words                 |
| Editor queue     | Pending listings, facts diff, approve/reject with reason                         |
| Public stats     | Plausible embed, launches per week, enforcement log                              |

## 3. Engines at MVP

Three API channels, each an `EngineAdapter`: OpenAI (web search tool), Perplexity
Sonar, Gemini with Google Search grounding. Claude with web search and licensed
AI Overviews data come in v1. Budget cap per provider per day in env config.

## 4. Jobs

See `services/worker/src/jobs.ts`. MVP needs: `cohort.open`, `cohort.close`,
`samples.plan`, `samples.run`, `samples.extract`, `metrics.snapshot`, `proof.report`.
Reddit jobs ship in v1 after Reddit API approval.

## 5. Billing (Stripe)

- Launch Pass: $49 one-time → `launches.paid_order_id`. Never touches `review`.
- Sponsored slot: weekly, fixed position, `rel="sponsored"`.
- Subscriptions ($29 / $99) are v1.

## 6. Acceptance checks

- A paid listing renders `rel="noopener sponsored"`; an approved free one renders
  `rel="noopener"`; a pending one `rel="noopener nofollow"`.
- A launch with 3 votes cannot outrank one with 60 comparable votes.
- The dashboard never shows a single rank; below the data threshold it says
  "not enough data yet".
- Proof reports compare frozen prompts only, and include controls.
- robots.txt allows OAI-SearchBot, PerplexityBot, Bingbot, Googlebot.

## 7. Open questions before build

1. **Provider terms** for storing and publishing aggregated AI answers (legal review).
2. **Reddit Data API** approval for a commercial app posting on users' behalf.
3. **Final name and domain** (LaunchAutopilot is a working name).
4. **Editorial capacity** per week (sets cohort size).
