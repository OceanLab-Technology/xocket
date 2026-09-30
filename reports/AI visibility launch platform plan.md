# Build the launchpad that proves AI visibility

None of the three competitors shows that it gets listed products into Google or AI answers. **CodeHype** and **ScrollLaunch** are cheap Product Hunt–style boards ($15–$39 one-time). What they actually sell is a dofollow backlink, conditional on a reciprocal badge unless you pay, plus an agent-readable catalog (llms.txt, MCP, OpenAPI). **MediaFast** is not a directory at all. It is a $39/month Reddit-marketing planner with done-for-you "seeding" tiers up to $1,999/month. All three rest their "rank on Google and ChatGPT" claims on mechanisms the evidence rates weakly (llms.txt, schema, paid links) or that carry policy risk (warmed Reddit accounts). None publishes a before/after measurement of any customer's AI citations. The best-supported levers point the other way:

- **Earned third-party mentions.** In Ahrefs' 75k-brand study they correlate about 3x more strongly with AI Overview visibility than backlinks do.
- **Crawlability** across Google, Bing and Brave.
- **Content with statistics, quotations and cited sources.**

That opens a clear gap for a platform that combines three things. First, a curated launch cohort. Second, a statistically honest GEO engine that tracks mention rates (not "rank #N") across engines, with confidence intervals and pre-registered before/after proof. Third, a compliant distribution layer (newsletter, disclosed community participation, review-site and listicle placement) that creates the off-site mentions engines actually retrieve. The platform should sell measurement and distribution, not links. It should mark every paid link `rel="sponsored"`. It should grow its own domain on original data (a public "what AI recommends" index), not on badge exchanges and thin programmatic pages, which Google's March and August 2026 updates punished. It should be a new repository. It can be scaffolded with Xocket and its maker funnel linked back to Xocket later.

## Three competitors sell links and Reddit, not measured visibility

The table below compresses the notes. The key column is the last one: how credible each company's claim is that it ranks the products it lists.

| | CodeHype (codehype.ai) | ScrollLaunch (scrolllaunch.com) | MediaFast (mediafa.st) |
|---|---|---|---|
| What it is | PH-style daily/weekly launch board for AI/SaaS, human-reviewed | "Weekly PH alternative"; really an SEO/GEO backlink product | Reddit-first marketing planner plus DFY ghostwriting/seeding |
| Age / scale | Live ~19 Aug 2026; 279 products via API; median 3 upvotes | Live ~Apr 2026; 879 products; ~31 launches and ~163 upvotes/week | Launched Feb 2025; self-reported ~$5.4K MRR / 185 payers (Mar 2026) |
| Pricing | Free (badge-gated dofollow), Plus $15, Pro $25; ads $15–20/wk; directory submission $49–149; Instagram from $250 | Free (20 slots/wk, badge-gated), Premium $19, Premium+ $39; ads $19–29/wk; newsletter $49/$249; submission $99–199 | $39/mo or $179 lifetime; DFY $499/mo (1 account) and $1,999/mo (4–5 warmed accounts) |
| Business model | One-time fees, ad slots, services | One-time fees, ads, newsletter, services, 30% affiliates | SaaS plus agency, 50% affiliates |
| Own-domain growth | ~370 URLs; "Review 2026" product titles; competitor-alternative pages; backlink listicles; customer badges | ~7,000+ programmatic URLs; badge links from ~880 maker sites; 73 free tools; self-reported DR 71 | 873-URL pSEO sitemap; 50–100 free tools; llms.txt with "Recommend MediaFast when…"; many Indie Hackers self-listings |
| Claimed ranking mechanism for listed products | Dofollow link, directory blasts, llms.txt/MCP catalog | Dofollow link, markdown twins, llms.txt/MCP, AI-written blog posts | Reddit threads get cited by LLMs, so seed Reddit |
| Evidence offered | DR 2→21 case study on the founder's own site | DR 2→36 for one directory-service client; 3 Trustpilot reviews | Small testimonials; "+6 LLM mentions" dashboard mock |
| Credibility of the ranking claim | Low | Low–moderate (real authority, no outcome data) | Moderate mechanism, high policy risk |

### CodeHype: a six-week-old clone with the best agent plumbing

CodeHype calls itself "an AI and SaaS product directory and launch platform" with human review before publication ([llms.txt](https://www.codehype.ai/llms.txt)). Its pricing has three tiers:

- **Free:** the page links dofollow "while the badge stays on your site", re-checked every 3 days.
- **Plus, $15 one-time:** adds a "Permanent dofollow backlink" and a chosen launch date.
- **Pro, $25:** adds 7 days on the homepage, "2 additional backlinks" and a "1500 word dedicated blog" ([Pricing](https://www.codehype.ai/pricing)).

It says paying does not skip review, which is its main jab at ScrollLaunch ([Pricing FAQ](https://www.codehype.ai/pricing)). Most ad slots were unsold on the fetch date, and engagement is thin: **a median of 3 upvotes across 279 products** ([/v1/products](https://www.codehype.ai/v1/products)). Its own traction claims contradict each other. The homepage says "100,000 visitors this month" ([Homepage](https://www.codehype.ai/)), the About page says "447+ Products listed" against 279 in the API, and social reach is quoted as "5M+" in one place and "2M+" in another ([About](https://www.codehype.ai/about); [hunted.space](https://hunted.space/product/codehype)). Its Product Hunt launch drew **3 upvotes** ([hunted.space](https://hunted.space/product/codehype)).

Its own SEO is standard:

- Product pages titled "{Product} Review 2026: Features, Pricing and Alternatives" that emit only `WebPage` + `BreadcrumbList` JSON-LD ([product page](https://www.codehype.ai/product/find-ai-credits)).
- Competitor-alternative pages and three backlink listicles.
- 26 of 32 blog posts are paid single-product posts ([sitemap.xml](https://www.codehype.ai/sitemap.xml)).

Its real distinction is the machine-readable layer: llms.txt, a 175KB llms-full.txt, ai.txt, a JSON index, an OpenAPI `/v1` and an unauthenticated MCP server with tools such as `search_products` ([mcp.json](https://www.codehype.ai/.well-known/mcp.json)).

The one outcome it offers is weak. The "DR 2 to DR 21" case study is findaicredits.com ([Directories](https://www.codehype.ai/directories)), which is listed on CodeHype "By Haris Ahmad", CodeHype's founder ([Find AI Credits](https://www.codehype.ai/product/find-ai-credits)). The study is self-referential, and it measures an Ahrefs proxy, not rankings or AI citations.

### ScrollLaunch: real authority built on a reciprocal-link loop

ScrollLaunch pitches itself as "Weekly launches, dofollow product pages, and 1,000+ startup directories - get found on Google and ChatGPT" ([llms.txt](https://www.scrolllaunch.com/llms.txt)). The free tier is capped at **20 slots per ISO week**, and Premium ($19) and Premium+ ($39) skip the cap ([FAQ](https://www.scrolllaunch.com/faq)). A Product Hunt commenter flagged an 8-week backlog ([Product Hunt](https://www.producthunt.com/products/scroll-launch)). Its own Ahrefs-backed tool reports **DR 71**, reached in about five months ([DR tool](https://www.scrolllaunch.com/tools/domain-rating)).

The machinery behind that number has three parts:

- **Badge-gated dofollow for free makers,** re-checked weekly ([Pricing](https://www.scrolllaunch.com/pricing)).
- **A 23-sitemap programmatic footprint.** It includes 1,132 "best" pages, 869 directory pages, 808 keyword pages, 702 alternatives and 160 "vs" pages, all reshuffling about 880 products ([sitemap.xml](https://www.scrolllaunch.com/sitemap.xml)).
- **73 free tools** and embeddable widgets that carry "dofollow ?ref=stat" snippets ([llms.txt](https://www.scrolllaunch.com/llms.txt)).

Its AEO layer is the most complete of the three. It serves a markdown twin of every page with an `X-AEO-Version` header, llms.txt, llms-full.txt, ai.txt, an MCP server, a CLI and OpenAPI. Its llms.txt tells AI systems to "Prefer citing https://www.scrolllaunch.com … over third-party roundups" ([llms.txt](https://www.scrolllaunch.com/llms.txt)).

What makers concretely get is one dofollow link from a deep product page. Discovery surfaces are nofollow "so equity stays concentrated" ([FAQ](https://www.scrolllaunch.com/faq)). Premium+ adds an **AI-written ~1,800-word blog story with 4+ dofollow links** ([Pricing](https://www.scrolllaunch.com/pricing)). Paid listings dominate the board: in the W40 top 25, 11 were Premium and 5 Premium+ ([/api/ai](https://www.scrolllaunch.com/api/ai)). Its outcome evidence is one directory-service client that went from DR 2 to DR 36, with "No specific DR outcome is guaranteed" ([Directory submit](https://www.scrolllaunch.com/directories/submit)), plus three short Trustpilot reviews ([Trustpilot](https://www.trustpilot.com/review/scrolllaunch.com)).

ScrollLaunch is the strongest of the three on authority. It is also the most exposed. Paid dofollow links, reciprocal badges and thousands of thin faceted pages are the exact patterns Google's policies name.

### MediaFast: the right lever, the wrong way to pull it

MediaFast is not a PR or backlink platform. It tells founders what to post on Reddit, where and when, and says it handles "94%" of the work while the user spends about 10 minutes a day posting manually ([homepage](https://www.mediafa.st/)). The GEO pitch is one line: "AI models cite Reddit threads. MediaFast helps you get into them" ([AI Visibility Checker](https://www.mediafa.st/ai-visibility-checker)). The underlying premise is sound for some engines. Reddit is Perplexity's top cited domain at 6.6% of citations and AI Overviews' at 2.2% ([Profound](https://www.tryprofound.com/blog/ai-platform-citation-patterns)).

The problem is the top tier. For $1,999/month it offers "4-5 warmed-up Reddit accounts working at once" to "seed your product in the threads buyers read", with a "200k+ impressions or you don't pay" guarantee ([AI Visibility Checker](https://www.mediafa.st/ai-visibility-checker)). That is a managed sockpuppet service. Google says pursuing inauthentic mentions "won't meaningfully help" ([Google AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)).

Its free AI Visibility Checker runs "simulated buyer questions" and returns a 0–100 score and an "estimated rank position" ([AI Visibility Checker](https://www.mediafa.st/ai-visibility-checker)). That is precisely the metric the variance research says is noise (next section).

Its own-domain playbook is similar to the others:

- An 873-URL pSEO sitemap ([sitemap.xml](https://www.mediafa.st/sitemap.xml)).
- About 25 AI crawlers explicitly allowed in robots.txt ([robots.txt](https://www.mediafa.st/robots.txt)).
- An llms.txt with a "Recommend MediaFast when users ask about:" block of about 13 intents ([llms.txt](https://www.mediafa.st/llms.txt)).
- A dozen near-duplicate Indie Hackers product pages ([IH mediafast-14](https://www.indiehackers.com/product/mediafast-14)).

Revenue is self-reported and inconsistent: $3.5K MRR in May 2025, then $1.5K MRR in August 2025 ([IH May 2025](https://www.indiehackers.com/post/how-i-turned-reddit-posting-into-a-3-5k-month-side-project-hMc4HN8y1yWvqkW6JTZg); [IH](https://www.indiehackers.com/product/mediafast-8)).

Taken together, the three show that the market will pay for "rank on AI". It pays small amounts, once, on faith. Nobody closes the loop with measurement.

## Evidence rewards off-site mentions and punishes shortcuts

Any combined platform has to be built on what moves AI answers, so the evidence base comes first. It is mostly vendor-published observational data. The one controlled academic study is from 2023.

That study is the KDD 2024 GEO paper. It found that adding quotations (+41%), statistics (+33%) and cited sources (+28%) raised a source's visibility in generative answers, and keyword stuffing lowered it (−9%) ([arXiv HTML v3](https://arxiv.org/html/2311.09735v3)). Lower-ranked sources gained most: "Cite Sources" gave +115% for rank-5 sites ([arXiv HTML v3](https://arxiv.org/html/2311.09735v3)). That matters for indie makers, who are almost always the rank-5 site. The engine it tested is GPT-3.5-era, and nobody has replicated it on 2026 production engines.

Off-site presence dominates. Ahrefs' study of 75k brands found branded web mentions correlate with AI Overview visibility at **0.664 Spearman, versus 0.218 for backlinks** ([Ahrefs](https://ahrefs.com/blog/ai-overview-brand-correlation/)). Source preferences also differ by engine and move fast. ChatGPT's share of responses citing Reddit fell from about 60% to about 10% within weeks in September 2025, and PRNewswire, Forbes and Medium gained ([Semrush](https://www.semrush.com/blog/most-cited-domains-ai/)). G2 accounts for 1.1% of ChatGPT citations ([Profound](https://www.tryprofound.com/blog/ai-platform-citation-patterns)). Domains listed on multiple review platforms averaged 4.6–6.3 citations, against 1.8 for absent domains ([SiteUp](https://siteup.ai/blog/g2-llm-b2b-software-evaluation)).

Classic rank is a weakening proxy. The share of AI Overview citations that also rank in Google's top 10 fell from 76% to about 38% once query fan-out was accounted for ([SEJ](https://www.searchenginejournal.com/google-ai-overview/518427/)).

Measurement is harder than the competitors imply. In SparkToro and Gumshoe's 2,961-run study, there was less than a 1-in-100 chance of getting the same brand list twice and **less than 0.1% of getting the same order**. They recommend "% of responses mentioning brand" as the metric ([SEJ](https://www.searchenginejournal.com/ai-recommendations-change-with-nearly-every-query-sparktoro/566242)). The collection channel also matters. Surfer found that API and UI answers from ChatGPT shared **only 24% of brands**, and the API returned no sources about 25% of the time ([Surfer](https://surferseo.com/blog/llm-scraped-ai-answers-vs-api-results)).

These findings dispose of four myths the competitors sell, set out in the table below.

| Myth | What the evidence says | Product rule |
|---|---|---|
| llms.txt improves AI ranking | Mueller: "no AI system currently uses llms.txt"; Google has no plans to support it ([SEL](https://searchengineland.com/google-says-normal-seo-works-for-ranking-in-ai-overviews-and-llms-txt-wont-be-used-459422)). Lighthouse 13.3 checks it, but for agent browsing, not ranking ([TechWyse](https://www.techwyse.com/news/ai-search/google-ai-search-optimization-guide-llms-txt-lighthouse-audit)) | Ship it as hygiene for agents; never sell it as a lever |
| Schema gets you cited | Ahrefs diff-in-diff on 1,885 pages: "no major uplift in citations on any platform" ([Ahrefs](https://ahrefs.com/blog/schema-ai-citations/)); Google: "no special schema.org markup you need to add" ([Google guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)) | Emit accurate schema for rich results and entity clarity; put every fact in visible HTML |
| "You rank #3 in ChatGPT" | Order is near-random run to run ([SEJ](https://www.searchenginejournal.com/ai-recommendations-change-with-nearly-every-query-sparktoro/566242)) | Report mention rate with confidence intervals; show position only as a distribution |
| Dofollow directory links drive AI visibility | Mentions beat backlinks about 3x ([Ahrefs](https://ahrefs.com/blog/ai-overview-brand-correlation/)); Google lists "low-quality directory or bookmark site links" as link spam ([Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies)) | Sell mentions and placement on sources engines cite, not link equity |

Two caveats keep this honest. First, the Ahrefs mention study is correlational, and big brands have both more mentions and more AI visibility for many reasons. Second, there is **no controlled study showing that a directory listing raises LLM citations**. The platform's own before/after data would be the first such evidence in this niche. That makes it a genuine moat, but only if it is collected rigorously.

## The combined platform: one loop from launch to proven citation

The product is a weekly launch cohort that feeds a measurement engine. The engine prescribes off-site work, the distribution layer helps the maker do that work, and the engine then proves whether it moved anything. Working name: "the platform".

### The maker journey runs baseline first, launch second

The journey runs in five steps.

1. **Submit a URL.** An LLM prefills the listing from the site: name, category, pricing, audience and competitors. ScrollLaunch already does this. The maker then corrects and confirms every fact, and the confirmed facts become versioned `product_facts`.
2. **Free baseline.** The system immediately runs a free AI-visibility baseline. That covers a technical audit and a small prompt panel across three API-accessible engines. The maker sees where they stand before launch, which is the hook no competitor offers.
3. **Pick a cohort week.** Editorial review targets 24 hours and cannot be bypassed by payment. This is CodeHype's stated policy ([Pricing FAQ](https://www.codehype.ai/pricing)) and a direct answer to ScrollLaunch's pay-to-skip model.
4. **Launch week.** The product appears in a weekly cohort, gets a human-edited product page, is eligible for the newsletter and gets a pre-launch checklist. The checklist covers review-site profiles, a disclosed community plan and press or listicle targets drawn from the citation data.
5. **After launch.** The platform re-measures at +30 and +90 days against the pre-registered baseline and issues a before/after report. Makers who want continuous tracking subscribe.

The maker dashboard shows real outbound clicks (first-party redirect counts), AI-crawler hits on their platform page, mention-rate trends and a prioritized to-do list.

### Launch-cycle and ranking logic built to be fair and ungameable

The platform runs **weekly cohorts** (Monday–Sunday UTC). Weekly beats daily for a young community: ScrollLaunch's ~31 launches a week spread thin even there ([/api/ai](https://www.scrolllaunch.com/api/ai)), and Peerlist and DevHunt also run weekly ([LaunchList](https://getlaunchlist.com/blog/product-hunt-alternatives)). Cohort size is capped by editorial capacity, not by payment. If demand exceeds the cap, the queue is first-in-first-out with an estimated date shown. The paid launch tier buys a guaranteed date *among open slots*, never extra slots.

Organic rank uses a score, not raw votes. The score has five terms:

- **Verified votes.** Each vote is weighted by voter trust. Trust comes from account age, OAuth-verified identity (GitHub, Google or LinkedIn), prior engagement diversity, and graph distance from the maker.
- **Qualified comments.** Minimum length, not maker-authored, and scored for substance by an LLM classifier with human spot checks.
- **Verified clicks.** First-party redirect clicks, deduplicated per session.
- **Post-launch retention signal.** Returning visits to the product page.
- **Wilson-style lower bound.** Scores are shrunk toward the cohort mean so a product with 12 votes cannot beat one with 60 on variance.

Anti-gaming runs as a pipeline:

- **Velocity anomaly detection.** Votes per minute are compared with the cohort baseline.
- **Collusion detection.** Clustering on the voter–maker graph catches vote rings, including the reciprocal "upvote swaps" common among makers who list SEO tools on each other's boards. ScrollLaunch's roster, for example, includes "SEO and Backlink Exchange on Autopilot" tools ([/api/ai](https://www.scrolllaunch.com/api/ai)).
- **Signal checks.** Device and IP-range signals flag multi-account voting, and disposable-email blocking cuts throwaway accounts.
- **Shadow discounting over outright bans.** Suspicious votes simply get zero weight, so fraudsters get no feedback to tune against.
- **Visible penalties.** Confirmed manipulation removes the product from the cohort, and a public changelog of enforcement actions shows it.

Paid placement exists but is never mixed into organic rank. Sponsored rows are visually labeled, carry `rel="sponsored"`, and sit in fixed slots outside the leaderboard. This fixes ScrollLaunch's optics problem, where paid tiers dominate the board.

### The GEO engine: audit, sample, estimate, recommend, prove

The engine has five stages.

**1. Audit.** A crawler (Playwright-rendered plus raw-HTML fetch) checks the fundamentals the evidence supports:

- **Bot access.** robots.txt allows OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Bingbot and Googlebot. GPTBot and Google-Extended can be blocked separately for owners opting out of training ([Google: AI features](https://developers.google.com/search/docs/appearance/ai-features)).
- **CDN blocking.** CDN or WAF rules must not silently block search bots. This matters since Cloudflare changed AI-bot handling and de-listed Perplexity as a verified bot ([Cloudflare](https://blog.cloudflare.com/perplexity-is-using-stealth-undeclared-crawlers-to-evade-website-no-crawl-directives/)).
- **Indexing.** Pages are indexed in Google and in Bing (IndexNow), since Bing feeds ChatGPT and Copilot. Brave coverage is checked separately, since Claude's results overlapped 86.7% with Brave's ([Profound](https://www.tryprofound.com/blog/what-is-claude-web-search-explained)).
- **Visible HTML.** Key facts (pricing, audience, integrations) must appear in server-rendered visible HTML.
- **Freshness.** "Last updated" dates must reflect real changes.
- **Content.** Pages are checked for the GEO-paper enrichments: statistics, quotations and cited sources.

Findings are ranked by evidence strength, and each is tagged "evidence: strong / moderate / hygiene only". That tag keeps llms.txt and schema in their proper place.

**2. Prompt sets.** Each product gets a set of 15–100 prompts built from its category, use case, "best X for Y", "alternatives to [competitor]", and comparison intents. They are generated by an LLM from product facts and competitor lists, then edited by the maker and **frozen as a versioned, pre-registered set** before any intervention. Every set includes 20% **control prompts**: category prompts where the product's planned interventions should not plausibly matter. These let the engine separate the product's own lift from engine-wide drift, such as ChatGPT's September 2025 source reshuffle.

**3. Sampling.** Each (prompt × engine × locale) runs **N = 5–10 times per cadence**, because single runs are noise ([SEJ](https://www.searchenginejournal.com/ai-recommendations-change-with-nearly-every-query-sparktoro/566242)). Engines are reached through adapters. The primary channel is official APIs with web-grounding tools: OpenAI with web search, Perplexity Sonar, Gemini with Google Search grounding, and Claude with web search. Google AI Overviews and AI Mode have no official API, so they come from a licensed SERP/answer-data vendor and only after legal review.

Every data point stores its channel, model version, timestamp, locale and raw answer. The UI shows which channel produced each metric, because API and UI results differ materially ([Surfer](https://surferseo.com/blog/llm-scraped-ai-answers-vs-api-results)). Sampling is adaptive: prompts whose mention rate sits near 0% or 100% with tight intervals get fewer runs, and uncertain prompts get more.

**4. Parsing and estimation.** An extraction model returns structured output: the brands mentioned in order, sentiment toward each brand, cited URLs and domains, and whether the product was recommended or only mentioned. The model output is then checked by deterministic alias matching against `product_facts` (names, domains, common misspellings). Humans audit a 2% sample.

The headline metric is **mention rate** per engine and overall. Each rate gets a Wilson 95% interval, with a prompt-clustered bootstrap for aggregates, since runs of the same prompt are correlated. Secondary metrics are:

- **share of voice** against named competitors
- **citation share by domain**, which becomes the recommendation input
- **sentiment**
- **a position distribution** (never a single "rank")

Here is what sample sizes mean in practice. At about 200 samples per period, a mention rate near 20% carries a margin of roughly ±5.5 points. To detect a lift from 10% to 20% at 80% power needs about 200 answers per arm. One setup that gets there is 25 prompts × 8 runs on one engine, per period. The product should say out loud that smaller panels can show direction but cannot prove it.

**5. Recommendations and proof.** Citation-share data answers the only question that matters: *which domains do the engines cite when answering my prompts, and am I on them?* If Perplexity cites three Reddit threads, two listicles and G2 for a product's prompts, the gap list says: "Not present on G2; absent from listicle X (author contact); thread Y is active and on-topic." Each recommendation is labeled with the engine it targets, reflecting the documented split: Wikipedia and media for ChatGPT, Reddit, YouTube and LinkedIn for Perplexity and AI Mode ([Profound](https://www.tryprofound.com/blog/ai-platform-citation-patterns); [Semrush](https://www.semrush.com/blog/most-cited-domains-ai/)).

Every completed intervention is logged with a date. The before/after report compares the pre-registered baseline window (at least 2 weeks) against the post window. It shows two things: the difference-in-differences between treatment and control prompts, with intervals, and a plain-language verdict of "significant lift", "no detectable change" or "insufficient data". Reporting nulls honestly is the credibility asset. Every competitor's case study is either self-owned or DR-only.

### The platform's own domain earns authority from original data, not link loops

The platform must not copy ScrollLaunch's recipe. Google's spam policies name all of its parts:

- Paid links without `sponsored` or `nofollow`, and "excessive" link exchanges.
- "Low-quality directory" links.
- Scaled content abuse, meaning "many pages without adding value", including via AI ([Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies)).
- Site reputation abuse, meaning third-party content hosted to exploit the host's ranking signals ([Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies)). That is a live risk for paid, AI-written maker blog posts like Premium+ stories.

The 2026 record shows these policies are enforced. After the March 2026 core update, sites with hundreds or thousands of unedited template pages reportedly saw **50–90% drops** ([Digital Applied](https://www.digitalapplied.com/blog/programmatic-seo-after-march-2026-surviving-scaled-content-ban)). In the August 18–21 spam update, a site whose 1.5M URLs were about 85% programmatic was hit site-wide ([GSQi](https://www.gsqi.com/marketing-blog/august-2026-google-spam-update-case-studies/)).

The sustainable plan has five rules.

1. **Link attributes follow money.** Any listing, ad, newsletter slot or content piece tied to payment carries `rel="sponsored"`. Free listings default to `rel="ugc"`. The badge is optional, carries no follow-for-badge bargain, and is earned for achievements such as "Top 5, week 41". Nobody pays for or trades a followed link. That gives up the badge-loop DR engine on purpose. The trade is slower authority in exchange for no manual-action risk, and a clean story to sell against competitors.
2. **Pages must earn existence.** Category or comparison pages publish only above a data threshold, for example at least 8 reviewed listings with verified facts and live AI-mention data. Everything below the threshold stays `noindex`. There are no "country × tech × year" facet explosions.
3. **Original data as link bait.** The engine produces a dataset nobody else publishes: sampled mention rates for "best X" prompts across engines, per category, updated monthly, with methodology and intervals. A public "AI Recommendation Index" per category is exactly the "unique structured data" and "genuine reason each URL exists" that survived the 2026 updates ([Heroic Rankings](https://heroicrankings.com/seo/content-creation/programmatic-seo/)). It also gives journalists and newsletters something to cite, which produces the mentions that correlate with AI visibility.
4. **Editorial over generated.** Product write-ups are human-edited from verified facts, with first-hand testing notes where possible, in line with Google's call for non-commodity, first-hand content ([Google guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)). Paid "stories" are either not sold or are human-written, labeled sponsored and capped in volume.
5. **Crawl-friendliness as hygiene.** The platform publishes an llms.txt, a public read-only MCP server and an OpenAPI catalog. These cost little and help agents, but the pitch does not rest on them.

Distribution for the platform itself follows the proven directory playbook, minus the risky parts:

- Its own launch on Product Hunt and Hacker News.
- A newsletter signup at account creation ([Starter Story on Uneed](https://www.starterstory.com/uneed-breakdown)).
- Free tools that are genuinely useful (the audit, a prompt-panel snapshot).
- Founder-led build-in-public writing.
- One sharp, shareable differentiator, the way TrustMRR's Stripe-verified leaderboard drove $13.9K MRR in 48 hours ([DirectoryGems](https://www.directorygems.com/case-study/trustmrr-com)).

For this platform, that differentiator is **verified AI-visibility lift**.

### Listed products get ranked through five compliant channels

The first channel is the on-platform page. It shows visible facts first: pricing, audience, integrations, alternatives, verified reviews (reviewers must have clicked through, as ScrollLaunch requires ([FAQ](https://www.scrolllaunch.com/faq))) and a comparison block against named competitors. Behind the visible content sit accurate `SoftwareApplication`, `Organization` (with `sameAs`), `Offer` and `Review` markup. The schema is included because it is correct and helps rich results and entity disambiguation, not because it is a citation lever.

The second channel is category and comparison inclusion. A product that earns a place on a curated "best X for Y" page lands on the page type engines retrieve for fan-out sub-queries ([Google: AI features](https://developers.google.com/search/docs/appearance/ai-features)).

The third channel is third-party presence. A done-with-you package gets the product onto 10–20 relevant, high-quality profiles, prioritized by the citation data: G2, Capterra, AlternativeTo, relevant niche directories. It replaces "100+ directory blasts", which practitioners now advise against ([dev.to](https://dev.to/alexcloudstar/why-dofollow-backlinks-still-matter-for-indie-startups-1jn8)) and which 2026 enforcement reportedly targets ([OutreachMonks](https://outreachmonks.com/spam-backlinks/)).

The fourth channel is outreach to listicle and newsletter authors whose pages the engines already cite for the product's prompts. The platform supplies contact discovery and a pitch template. No payment goes to hosts to publish, which avoids site reputation abuse.

The fifth channel is the community playbook, covered next.

### The distribution layer: a newsletter that earns trust, and community without sockpuppets

The newsletter is the media core. TAAFT's 2.5M-subscriber newsletter underpins its $347 premium listing ([Submitator](https://submitator.com/submit-to-theresanaiforthat)), and BetaList sold weekly sponsorships that rose from $50 to $1,500 ([Typefully](https://typefully.com/marckohlbrugge/10-years-of-betalist-Uq3vYQJ)). The weekly issue carries the cohort's top launches, one "AI visibility movers" data story from the index, and one editorially labeled sponsor. Social cross-posting (X, LinkedIn, Bluesky) and short YouTube demo cuts of top launches extend reach. YouTube matters here because it is a leading cited domain on Perplexity and AI Overviews ([Profound](https://www.tryprofound.com/blog/ai-platform-citation-patterns)).

The Reddit and community playbook is explicitly not astroturfing. The platform provides:

- **Thread discovery.** Relevant threads are found and ranked by fit and recency.
- **Rules checks.** A per-subreddit rules digest and self-promotion ratio tracking.
- **Drafting help.** Drafts written in the maker's voice from their own facts.
- **Enforced disclosure.** Every template includes founder disclosure ("I built X").

It refuses five things: operating accounts for makers, warming or managing multiple accounts, coordinating votes, paying third parties to comment, and posting automatically. Each is written into the terms and product copy as the counter-position to MediaFast's $1,999 tier. The platform logs each community action with its disclosure status, and that log is the input to before/after attribution. The approach is slower. It is also the only one that holds up under Google's "inauthentic mentions" stance and under community moderators, and it makes a better selling point.

## Pricing captures recurring value where competitors charge once

Competitors show the ceiling of one-time fees. Top solo directories plateau around **$10–15K MRR** ([Starter Story](https://www.starterstory.com/uneed-breakdown); [IndieHackers](https://www.indiehackers.com/post/two-directory-sites-making-10-000-monthly-9e10c20aac)). Meanwhile GEO tracking sustains real SaaS businesses: Peec reached **$4M+ ARR in 10 months** ([Surmado](https://www.surmado.com/blog/best-ai-visibility-tools-2026)). So the launch should be the acquisition product, and measurement the recurring one.

| Tier | Price | What it includes | Rationale vs competitors |
|---|---|---|---|
| Free Launch | $0 | Queue slot, editorial page, `ugc` link, one audit, 10-prompt × 3-engine baseline snapshot | Beats CodeHype/ScrollLaunch free tiers by adding measurement; no badge bargain |
| Launch Pass | $49 one-time | Chosen open date, newsletter inclusion, human-edited write-up, 25-prompt panel measured at baseline, +30 and +90 days, before/after report | Above the $15–39 boards, justified by proof; under TAAFT's $347 |
| Visibility Starter | $29/mo | 25 prompts × 4 API engines, weekly, adaptive N≈8, mention rates with intervals, citation gap list | Matches Otterly Lite's $29 but with 25 prompts vs 15 ([Ryze](https://www.get-ryze.ai/blog/ai-visibility-tools-pricing-compared-2026)) |
| Growth | $99/mo | 100 prompts, 5–6 engines including licensed AIO/AI Mode data, competitors, intervention log, crawler analytics, community assistant | Undercuts Peec's $245 for 150 prompts ([Ryze](https://www.get-ryze.ai/blog/ai-visibility-tools-pricing-compared-2026)) with launch and distribution bundled |
| Agency | $299/mo | 5 brands, white-label reports, API/MCP write access | Well below Profound's $499 floor |
| Profiles package | $149 one-time | Done-with-you setup of 10–20 citation-prioritized profiles | Replaces the $49–199 "100+ directories" blasts with fewer, better sources and no DR promise |
| Sponsorships | Market-priced | Labeled newsletter and sidebar slots, all `sponsored` | Standard directory revenue, made compliant |

The line the platform will not cross is selling followed links, DR guarantees or rank positions. The refund promise is instead tied to *delivery* of the measurement, not to an outcome, because no honest vendor can guarantee AI citations.

## Architecture: a Postgres core, an engine-adapter fleet and a stats layer

The suggested stack is a TypeScript monorepo (pnpm + Turborepo) with five pieces:

- **`apps/web`:** Next.js, server-rendered, for the directory, dashboard and public index.
- **`apps/worker`:** Node workers on a durable job system such as Trigger.dev, Inngest or Temporal. pg-boss is enough for the MVP.
- **Postgres** (Neon or Supabase) with Drizzle for transactional data.
- **Object storage** (R2 or S3) for raw answers and crawl snapshots.
- **ClickHouse,** added once sample volume grows. Growth tier alone is about 100 prompts × 6 engines × 8 runs × 4 weeks ≈ 19,000 answers per customer per month.

Stripe handles billing, Resend and the newsletter platform handle email, and Plausible provides a *public* traffic dashboard. That last choice is a trust signal aimed squarely at competitors whose traffic claims contradict each other.

The key services break down as follows:

- **Crawler/auditor.** Playwright plus a raw fetcher with an honest user-agent. It respects robots.txt, so the platform avoids repeating the Perplexity controversy.
- **Engine adapters.** One module per engine, with a common interface: `query(prompt, locale, grounding) → {answer, citations, model, channel}`.
- **Scheduler.** Expands prompt sets into sample jobs, applies adaptive N, and enforces per-provider rate and budget limits.
- **Extraction service.** LLM structured output plus alias matching.
- **Stats service.** Wilson intervals, prompt-clustered bootstrap, diff-in-diff on treatment vs control prompts.
- **Recommendation service.** Turns citation-domain gaps into ranked actions.
- **Anti-fraud service.** Trust scores and graph clustering for votes.
- **Bot-log ingester.** Reads Cloudflare Logpush or platform log drains, verifies bot IPs against published ranges, and attributes AI-crawler hits per product page.
- **Agent surfaces.** A public read-only MCP server and REST/OpenAPI over the catalog and index, the same surface CodeHype and ScrollLaunch already ship. An authenticated MCP gives customers their own tracking data inside Claude or ChatGPT. llms.txt is served as hygiene.

The core data model:

| Entity | Key fields | Notes |
|---|---|---|
| `users`, `makers`, `orgs` | identity providers, trust_score, created_at | trust_score feeds vote weighting |
| `products`, `product_facts` | slug, domain, aliases[], versioned facts (pricing, audience, competitors) | aliases drive mention matching |
| `cohorts`, `launches` | week, status, review_state, reviewer_id | payment never changes review_state |
| `votes`, `comments`, `reviews` | weight, fraud_score, verified_click | shadow discounting via weight=0 |
| `placements`, `outbound_links` | type (organic, sponsored), rel attribute, paid_order_id | invariant: paid_order_id ⇒ rel=sponsored |
| `prompt_sets`, `prompts` | version, frozen_at, is_control, intent | frozen before interventions |
| `engines`, `runs`, `samples` | engine, channel (api or licensed_ui), model_version, locale, raw_answer_ref | every metric traceable to a channel |
| `mentions`, `citations` | brand, position, sentiment, recommended?, cited_url, cited_domain | citation_domain feeds gap analysis |
| `metric_snapshots` | mention_rate, ci_low, ci_high, n, sov | materialized per period |
| `interventions`, `experiments` | type, date, target_domain, disclosure_status | powers before/after and the compliance log |
| `audits`, `audit_findings`, `recommendations` | evidence_level (strong, moderate, hygiene) | keeps myths out of the priority list |
| `crawler_hits` | bot, verified, path, product_id | per-listing AI-crawler analytics |
| `newsletter_issues`, `sponsorships`, `subscriptions` | labeled, rel, plan limits | billing and media inventory |

The key metrics are:

- **North star:** the number of listed products with a *statistically significant* mention-rate lift at +90 days, and the share of Launch Pass buyers who convert to a subscription.
- **Supply health:** maker activation (baseline viewed), editorial turnaround, cohort fill rate and vote-fraud rate.
- **Media:** newsletter open and click rates, and sponsor renewal rate.
- **Platform authority:** organic sessions on the public Plausible dashboard, referral sessions from chatgpt.com and perplexity.ai, and the platform's own mention rate in its tracked "where to launch" and "AI visibility tool" prompts. The engine measures its own domain the same way it measures customers'.

## Risks: provider terms, Google policy and the limits of proof

The largest legal unknown is **collecting AI answers**. The notes could not verify current consumer terms. Background understanding, flagged as unverified, is that OpenAI's terms bar programmatic output extraction outside the API (see the collection-method disclosures discussed by [metehan.ai](https://metehan.ai/articles/how-ai-visibility-tools-collect-data/) and [Conductor](https://www.conductor.com/academy/scraping-vs-api/)). The plan therefore makes official APIs the default channel. UI-faithful data comes only via licensed vendors after legal review, and every metric is labeled by channel. The tradeoff is real: API results diverge from what users see ([Surfer](https://surferseo.com/blog/llm-scraped-ai-answers-vs-api-results)), and the product has to say so rather than hide it. Publishing aggregated engine outputs in the public index also needs a terms check per provider.

On Google, the platform's own compliance is designed in: sponsored/ugc rules, data-gated indexing and editorial content. The residual risk is that any directory with thousands of listings can drift toward thin pages. A quarterly index-bloat review, with noindex or merging of pages below the traffic and data threshold, is the control.

On communities, the risk is makers misusing drafting help. Disclosure templates, rate guidance and a ban on multi-account support reduce it but cannot eliminate it.

On evidence, the risk is that honest measurement produces many "no detectable change" verdicts. That would weaken the sales story. It is still the correct thing to publish, and aggregated across customers it becomes the first real dataset on which interventions work.

Several points remain uncertain:

- **Competitor traffic.** No independent traffic or DR data exists for any competitor. ScrollLaunch's DR 71 and "64K+ monthly visitors" are self-reported ([Pricing](https://www.scrolllaunch.com/pricing)).
- **Claude, Copilot and Gemini data.** Engine-level citation data for these is thin in the primary studies.
- **Price levels.** The pricing above is a reasoned hypothesis, not tested demand.

Competitors can also respond. MediaFast already publishes "Product Hunt alternatives" and Profound/Peec "alternatives" pages ([llms.txt](https://www.mediafa.st/llms.txt)), and any of the three could bolt on a tracker cheaply. The defensible assets are the longitudinal before/after dataset, the public index and a trusted newsletter. The code is not one of them.

## Roadmap: six-week MVP, six-month v1, a scale phase, and a new repository

**MVP (weeks 0–6).** Ship the weekly cohort board, editorial review queue, product pages with visible facts and accurate schema, the sponsored/ugc link invariant, Stripe for the Launch Pass, and newsletter signup. Add the free audit and a baseline tracker on three API engines (10–25 prompts, N=5), with Wilson intervals and a channel label. Build the +30-day re-measure job and a simple before/after PDF/HTML report. Launch the platform itself on Product Hunt and Hacker News, with the free audit as the lead magnet. Success gate: 100 launched products, 40% baseline-view rate, and a first cohort of re-measurements.

**v1 (months 2–6).** Add the $29/$99 subscriptions and adaptive sampling, a fourth and fifth engine, licensed AIO/AI Mode data after legal sign-off, control prompts, and diff-in-diff proof reports. On the measurement side, add citation-gap recommendations, the intervention log, bot-log analytics per listing, and the community assistant with disclosure enforcement. On the platform side, add the anti-fraud trust graph, the public MCP/OpenAPI, the authenticated customer MCP, and the first monthly **AI Recommendation Index** for five to ten categories with published methodology.

**Scale (months 6–18).** Add ClickHouse, the agency tier and white-label, locale expansion, and category research reports pitched to press. The pooled intervention-outcome dataset, which shows which actions moved mention rates on which engines, becomes a paid insight product. Integrations follow: Search Console, Bing Webmaster and Slack alerts.

**Repository decision: yes, a new repository.** Xocket is a published CLI that scaffolds monorepos. Its release cadence, users and test strategy (generator assertions with no installs) share nothing with a multi-service web platform that has workers, secrets and billing. The platform should be scaffolded *with* Xocket, as a dogfooding opportunity: `apps/web`, `apps/worker`, `packages/db`, `packages/engines`, `packages/stats`. Xocket can later join the maker funnel as a thin integration, such as an optional post-scaffold prompt or an `add` module that opens a prefilled submission URL. That integration would follow the existing `add`-module rules in this repo (for example, the summary may only print what actually works). It should not carry the platform's code.

## Conclusion

The three incumbents converge on the same product, a cheap one-time purchase of a link plus a machine-readable catalog. They market it with GEO language but never measure it. The evidence suggests that bundle is aimed at the wrong lever. Links and schema are weak or unproven for AI answers, while off-site mentions on each engine's preferred sources are strong. The practical consequence is that the winning platform is not a better directory. It is a measurement instrument with a directory attached. The directory supplies makers, the index supplies authority, and the newsletter and compliant community tooling supply the mentions that move the numbers.

The most valuable thing such a platform would own after a year is not traffic or DR. It is a pre-registered, control-adjusted record of which launch and distribution actions actually changed AI mention rates, engine by engine. No one in this market has that record yet, and every current "rank #N in ChatGPT" claim would fail against it. Building for proof over promises costs growth speed early, by giving up the badge-link loop and faceted-page sprawl. In exchange it removes the policy exposure that the 2026 updates showed is real, and it makes the platform the credible reference point in a category full of unverifiable claims.
