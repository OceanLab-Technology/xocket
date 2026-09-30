# GEO / AEO Mechanics: How Products Get Cited by AI Answer Engines (as of Sep 2026)

Note on evidence quality: most "studies" in this field are published by vendors that sell AI-visibility or SEO tools (Ahrefs, Semrush, Profound, Peec, Otterly, Surfer). They are large-sample observational datasets, mostly correlational, and methodology changes shift results a lot (see the Ahrefs AIO overlap finding). The only peer-reviewed controlled experiment found is the 2023 GEO paper (KDD 2024). Google's own documentation is primary evidence for Google surfaces only. Aggregator "index" pages (everything-pr / 5W, authoritytech, quickseo) mostly repackage vendor data and are PR material; treat them as secondary.

## 1. What research says about citation sources (third-party vs own-site; Reddit, Wikipedia, G2, YouTube, listicles)

### Takeaway

Each engine has a different source preference, and those preferences move a lot from month to month. ChatGPT leans toward Wikipedia and established media. Perplexity and Google AI surfaces lean toward Reddit, YouTube and LinkedIn (UGC and community content). Even so, no single domain has a dominant share of all citations. The strongest correlate of brand visibility in AI answers is off-site brand mentions (web and YouTube), not backlinks. The most solid content-level lever is still the 2023 GEO finding: adding quotations, statistics and cited sources helps, and keyword stuffing hurts.

### Cited Findings

**Academic (2023, labelled older, still the main controlled evidence)**

- GEO paper (Aggarwal, Murahari, Rajpurohit, Kalyan, Narasimhan, Deshpande; Princeton / Georgia Tech / AI2 / IIT Delhi; KDD 2024). It introduces GEO-bench and reports that optimization "can boost visibility by up to 40%", with efficacy varying by domain. — [arXiv 2311.09735](https://arxiv.org/abs/2311.09735)
- GEO Table 1, relative gain in position-adjusted word count: Quotation Addition +41%, Statistics Addition +33%, Fluency Optimization +29%, Cite Sources +28%, Technical Terms +18%, Easy-to-Understand +14%, Authoritative tone +12%, Unique Words +6%, **Keyword Stuffing −9%**. — [arXiv HTML v3](https://arxiv.org/html/2311.09735v3)
- Lower-ranked sources gain the most. "Cite Sources" gave +115.1% visibility for rank-5 sites and −30.3% for rank-1 sites. — [arXiv HTML v3](https://arxiv.org/html/2311.09735v3)
- Real-world check on Perplexity.ai: Quotation Addition +22% (PAWC), Statistics Addition +37% (subjective impression), Keyword Stuffing −9%. — [arXiv HTML v3](https://arxiv.org/html/2311.09735v3)

**Domain-level citation share (industry, 2024–2026)**

- Profound analysed 680M citations (Aug 2024–Jun 2025). ChatGPT: Wikipedia 7.8% of all citations, Reddit 1.8%, Forbes 1.1%, **G2 1.1%**. Google AI Overviews: Reddit 2.2%, YouTube 1.9%, Quora 1.5%, LinkedIn 1.3%. Perplexity: Reddit 6.6%, YouTube 2.0%, Gartner 1.0%, Yelp 0.8%. Wikipedia makes up 47.9% of ChatGPT's _top-10-source_ share. .com domains account for 80.4% of all citations. — [Profound](https://www.tryprofound.com/blog/ai-platform-citation-patterns)
- Semrush tracked 230k+ prompts and 100M+ citations (Jul 14–Oct 12, 2025) across ChatGPT Search, Google AI Mode and Perplexity. ChatGPT's Reddit share fell from about 60% to about 10% and Wikipedia's from about 55% to about 20% (share of responses citing the domain) in mid-September 2025, though both remained ChatGPT's top two domains. Winners on ChatGPT after the shift were PRNewswire, Forbes and Medium. On AI Mode, LinkedIn was about 15%, YouTube, Reddit and Google properties were strong, and Wikipedia was only about 2%. Perplexity was the most stable. The shift coincided with Google removing the `num=100` parameter, but Semrush says the cause is disputed. — [Semrush](https://www.semrush.com/blog/most-cited-domains-ai/)
- Aggregated "index" claims: Reddit is cited most across ChatGPT, AI Mode, Gemini, Perplexity and AIO (attributed to Peec's 30M-source analysis), and the top 15 domains take 68% of citation share. An Evertune analysis of 200M prompts is quoted saying the top domain on any platform "rarely exceeds 5 percent" of citations. These two claims conflict with each other, and the everything-pr/5W page is a PR release that synthesises other studies. — [everything-pr / 5W index](https://everything-pr.com/ai-platform-citation-source-index-2026), [PR Newswire release](https://www.prnewswire.com/news-releases/5w-releases-ai-platform-citation-source-index-2026-the-50-websites-that-now-decide-what-brands-are-visible-inside-chatgpt-claude-perplexity-gemini-and-google-ai-overviews-302759804.html)

**Third-party mentions vs own site / links (Ahrefs, 2025)**

- Ahrefs studied 75k brands in AI Overviews. The top Spearman correlates were branded web mentions (0.664), branded anchors (0.527) and branded search volume (0.392), all off-site. Backlinks correlated at only 0.218. YouTube mentions came in at about 0.737 according to a secondary summary. Brands in the top quartile for web mentions got up to 10x more AIO mentions. Ahrefs notes correlation is not causation. — [Ahrefs](https://ahrefs.com/blog/ai-overview-brand-correlation/) (numbers as relayed by search summary; YouTube figure via [authoritytech summary](https://authoritytech.io/curated/ahrefs-brand-mentions-backlinks-ai-search-2026))

**Relationship to classic rankings**

- Ahrefs, mid-2025: 76% of AIO citations ranked in the top 10, with a median position of 2 for top-cited URLs. — [Ahrefs](https://ahrefs.com/blog/ai-overview-brand-correlation/)
- Ahrefs, Feb 2026, 863k keywords: overlap fell to 38%. About 31% of citations came from positions 11–100 and about 31% from beyond 100. Part of the drop comes from improved citation parsing, and part is attributed to query fan-out. — reported via [SEJ](https://www.searchenginejournal.com/google-ai-overview/518427/) and [secondary summaries](https://authoritytech.io/curated/ranking-citation-gap-ai-search-2026)
- Google says AI Overviews and AI Mode use "query fan-out", which issues "multiple related searches across subtopics and data sources". — [Google Search Central](https://developers.google.com/search/docs/appearance/ai-features)

### Inferences

- For a "rank your product on AI" engine, the biggest levers are off-site. The product needs to appear in the pages engines already retrieve for "best X for Y" fan-out sub-queries: listicles and comparison articles, Reddit threads, YouTube reviews, G2/Capterra-style review sites, Wikipedia (where notable), LinkedIn and press releases (PRNewswire rose on ChatGPT). Own-site work (quotes, stats, cited sources, clear comparison pages) is necessary but secondary.
- Recommendations should be engine-specific: Wikipedia and media for ChatGPT, Reddit, YouTube and LinkedIn for Perplexity and AI Mode. Source mix should be re-measured continuously, because a single engine change moved ChatGPT's Reddit share by roughly 50 points in a week.
- GEO's finding that lower-ranked pages benefit most supports offering content-rewrite features (adding stats, quotes and citations) for smaller brands.

### Gaps

- No peer-reviewed replication of the GEO results on 2025–2026 production engines was found. The mechanism studied (a 2023 GPT-3.5-era generative engine) is dated.
- No independent source was found that quantifies listicle / "best X" article share specifically. Industry claims about listicles dominating were not verified here.
- Data for Claude, Copilot and Gemini (the app, not AI Mode) is thin in the primary studies reviewed.

## 2. Retrieval mechanics: indexes, crawlers, robots.txt, llms.txt, schema, freshness, structure

### Takeaway

Each engine retrieves from a different index. Google surfaces use Google's index. ChatGPT uses Bing plus a growing proprietary index and its own crawler. Perplexity runs its own crawler and index. Claude's web search strongly overlaps with Brave Search. Being crawlable by each engine's bot matters. llms.txt is not used by any major answer engine for ranking. Schema has no demonstrated causal citation uplift. Freshness has a measurable correlation for most assistants except AI Overviews.

### Cited Findings

**Google (AI Overviews / AI Mode / Gemini-in-Search)**

- "There are no additional requirements to appear in AI Overviews or AI Mode, nor other special optimizations necessary." "You don't need to create new machine readable files, AI text files, or markup." Snippet controls (`nosnippet`, `data-nosnippet`, `max-snippet`, `noindex`) govern appearance. `Google-Extended` covers AI training opt-out. AI-feature traffic is folded into Search Console "Web" totals. — [Google: AI features](https://developers.google.com/search/docs/appearance/ai-features)
- Google published an official generative-AI search optimization guide (reported date May 15, 2026). It states there is no separate optimization layer. It recommends non-commodity, first-hand content, crawlability, images/video, Business Profile and Merchant Center. It states that chunking, AI-specific rewrites, llms.txt/Markdown files and special schema are **not** needed ("Structured data isn't required for generative AI search, and there's no special schema.org markup you need to add") and that inauthentic mentions won't meaningfully help. — [Google AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide); date via [TechWyse](https://www.techwyse.com/news/ai-search/google-ai-search-optimization-guide-llms-txt-lighthouse-audit)

**llms.txt**

- John Mueller: "FWIW no AI system currently uses llms.txt", comparing it to the keywords meta tag. Gary Illyes said Google does not support it and has no plans to. — [Search Engine Land](https://searchengineland.com/google-says-normal-seo-works-for-ranking-in-ai-overviews-and-llms-txt-wont-be-used-459422), [TechWyse](https://www.techwyse.com/news/ai-search/google-john-mueller-llms-txt-speculative-webmcp-ai-agents)
- Counterpoint: Chrome Lighthouse 13.3.0 (May 7, 2026) added an "Agentic Browsing" audit that checks for llms.txt (a 404 is "Not applicable"). This concerns agent readability, not search ranking. — [TechWyse](https://www.techwyse.com/news/ai-search/google-ai-search-optimization-guide-llms-txt-lighthouse-audit)

**OpenAI / ChatGPT**

- OpenAI documents separate bots: OAI-SearchBot (search inclusion), ChatGPT-User (user-triggered fetches) and GPTBot (training). The official page (developers.openai.com/api/docs/bots) returned 403 to my fetch, so exact wording was not verified. — [OpenAI bots doc](https://developers.openai.com/api/docs/bots)
- Peec AI reports (May–Jul 2026 observations) that ChatGPT runs an internal retrieval system called "Labrador" with vertical indexes (web, PDF, YouTube, news, Wikipedia, shopping, and others), serves cached pages, and crawls about 35k pages per hour. It also uses external providers (Bing / Microsoft "Web IQ", Bright Data, Oxylabs, Yelp, TripAdvisor). These are vendor reverse-engineering claims, not OpenAI statements. — [Peec AI](https://peec.ai/blog/chatgpt-built-its-own-search-index)
- Claim that ChatGPT results overlap only 12% with Google's SERP and 26% with Bing's. This comes from a secondary summary and the original study was not identified. — [search summary of aiplusautomation / algoblueprints](https://aiplusautomation.com/blog/chatgpt-bing-or-google)

**Perplexity**

- Runs its own crawler and index. Its declared agents are PerplexityBot and Perplexity-User. Cloudflare (Aug 2025) documented that when blocked, Perplexity switched to a generic Chrome UA and different ASNs and did not fetch robots.txt, across tens of thousands of domains. Cloudflare de-listed it as a verified bot. — [Cloudflare blog](https://blog.cloudflare.com/perplexity-is-using-stealth-undeclared-crawlers-to-evade-website-no-crawl-directives/)
- Index size "approaching 100B" and 1.2–1.5B queries per month by mid-2026 are secondary, unverified estimates. — [index.dev](https://www.index.dev/blog/perplexity-ai-features-statistics)

**Claude**

- Claude's web search results overlapped 86.7% (13/15) with Brave's top non-sponsored results, so Brave Search is the likely backend. This comes from a small third-party test. — [Profound](https://www.tryprofound.com/blog/what-is-claude-web-search-explained)

**Copilot**

- Copilot is Bing-based, so Bing Webmaster Tools and IndexNow matter. Only a secondary source was found. — [everything-pr](https://everything-pr.com/bing-copilot-vs-chatgpt-search-2026)

**Schema / structured data**

- Ahrefs tracked 1,885 pages that added JSON-LD (Aug 2025–Mar 2026) against 4,000 matched controls, using difference-in-differences. Results: AIO −4.6% (small but significant), AI Mode +2.4% and ChatGPT +2.2% (both no meaningful effect). "Adding schema produced no major uplift in citations on any platform." Caveat: the sample only included pages that already had 100+ AIO citations. — [Ahrefs](https://ahrefs.com/blog/schema-ai-citations/)
- searchVIU experiment (secondary report): ChatGPT, Claude, Perplexity, Gemini and AI Mode extracted only visible HTML at retrieval, and JSON-LD was not visible to them. — via [search summary](https://otterly.ai/blog/schema-markup-real-impact-ai-search/) (original not fetched)

**Freshness**

- Ahrefs analysed 17M citations across ChatGPT, Perplexity, Gemini, Copilot and AIO (2025). Cited content was 25.7% fresher on average than Google's top results. ChatGPT had the strongest freshness preference. AIO was the exception, citing pages about 16 days _older_ than its organic results. — [Ahrefs](https://ahrefs.com/blog/do-ai-assistants-prefer-to-cite-fresh-content)

### Inferences

- Technical checklist for the platform's audit module:
  1. robots.txt should allow OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Bingbot and Googlebot. GPTBot and Google-Extended can be blocked independently if the owner wants to opt out of training without losing search inclusion. Also check that the CDN/WAF (Cloudflare "AI bot" blocking) isn't silently blocking search bots.
  2. Indexing in Google **and** Bing (IndexNow), since Bing feeds ChatGPT and Copilot.
  3. Key facts should be in server-rendered visible HTML.
  4. Refresh "updated" content genuinely, for ChatGPT and Perplexity.
  5. Treat llms.txt and schema as low-priority hygiene, not ranking levers. Don't sell them as ranking levers.
- Brave index coverage is a distinct check for Claude visibility.

### Gaps

- OpenAI's bot doc text could not be fetched (403), so precise wording on OAI-SearchBot and robots.txt behaviour is unverified here.
- No public documentation was found on Gemini-app retrieval beyond Google Search, or on Microsoft Copilot ranking internals.
- The origin of the 12%/26% ChatGPT–Google/Bing overlap figure is unverified.

## 3. How AI-visibility tracking tools are built; pricing; API access and ToS

### Takeaway

Tools run a curated prompt set on a schedule across engines. They repeat each prompt several times because outputs are highly non-deterministic, then parse the answers for brand mentions, position, sentiment and cited URLs, and aggregate these into share-of-voice. The main design choice is **UI scraping vs API**, and it changes results dramatically. Ranking position is mostly noise. Mention frequency across many samples is the stable metric.

### Cited Findings

- SparkToro and Gumshoe ran 2,961 prompts (12 prompts, hundreds of volunteers, Nov–Dec 2025) across ChatGPT, Claude and Google AIO. There was less than a 1-in-100 chance of an identical brand list across runs and less than 0.1% chance of the same list in the same order. Claude was slightly more consistent. Brand _appearance frequency_ was far more stable than rank, and the authors recommend "% of responses mentioning brand" as the metric. — [Search Engine Journal](https://www.searchenginejournal.com/ai-recommendations-change-with-nearly-every-query-sparktoro/566242), [SparkToro](https://sparktoro.com/blog/2026/01/)
- Surfer compared 1,000 ChatGPT runs, scraped UI against API. API answers averaged 406 words vs 743 for UI, with 7 sources vs 16. The API returned no sources in about 25% of cases. Only 24% of brands overlapped between the two. On Perplexity, source overlap between API and UI was only 8%. — [Surfer](https://surferseo.com/blog/llm-scraped-ai-answers-vs-api-results)
- Many trackers scrape logged-out sessions, which may use different or legacy models than logged-in users see. Vendors should disclose method per channel, model version, frequency and how they handle non-determinism. — [metehan.ai](https://metehan.ai/articles/how-ai-visibility-tools-collect-data/), [Conductor](https://www.conductor.com/academy/scraping-vs-api/)
- Pricing from third-party comparisons (verify on vendor pages): Profound from $499/mo (enterprise; "Agent Analytics", "Prompt Volumes"). Otterly Lite $29/mo (15 prompts, 6 engines). Peec AI Starter about €/$95–100/mo (50 prompts, 3 models, unlimited seats). AthenaHQ about $295/mo (YC-backed, 2025). — [ecommercefastlane](https://ecommercefastlane.com/best-ai-visibility-tools-complete-comparison/), [dupple](https://dupple.com/blog/best-ai-search-visibility-tools-2026)
- Google publishes no separate AIO/AI Mode report. That traffic is merged into Search Console "Web". — [Google](https://developers.google.com/search/docs/appearance/ai-features)

### Inferences

- A reference architecture looks like this:
  - **Prompt set:** category, "best X for Y", comparison and alternative prompts, generated from keyword and persona data, ideally weighted by estimated prompt volume.
  - **Sampling:** N≥5–10 runs per prompt, per engine, per locale, per cadence.
  - **Collection:** a UI-faithful channel (browser automation or third-party SERP/answer APIs) for customer-facing truth, plus the official API for cheap, high-volume, ToS-clean sampling. Label which channel produced each metric.
  - **Parsing:** LLM-based entity extraction plus fuzzy brand matching. Store answer text, brand list and order, sentiment, and cited URLs and domains.
  - **Metrics:** mention rate with confidence intervals, share of voice vs competitors, citation share by domain (to drive "get listed on these sources" recommendations), sentiment.
  - **Agent analytics:** log-based AI-bot crawl monitoring.
- Report confidence intervals and avoid presenting "rank #3 in ChatGPT" as a fixed fact.

### Gaps

- I could not verify the current OpenAI, Google, Anthropic or Perplexity consumer-terms language on automated scraping of UIs within the call budget. From background knowledge (unverified here), OpenAI's Terms prohibit programmatic extraction of output except via the API. Legal review is required before building on UI scraping. Commercial SERP/answer-scraping providers (e.g., Bright Data, Oxylabs, which Peec says ChatGPT itself uses) shift but do not remove that risk.
- Vendor pricing was not verified on the vendors' own pages (Semrush AI Toolkit pricing was not found).

## 4. Do launch directories and their backlinks still help SEO/GEO in 2026? Google's stance

### Takeaway

Google's spam policy explicitly lists "low-quality directory or bookmark site links" as link spam. Paid links must carry `rel="sponsored"` or `rel="nofollow"`. Big launch platforms (Product Hunt, HN, Reddit) mostly nofollow. Direct PageRank value from directories is therefore small or risky. Their value comes through discovery, brand mentions, secondary press and listicle coverage, and being a crawlable third-party page that answer engines may retrieve. That fits the Ahrefs finding that mentions beat backlinks.

### Cited Findings

- Google spam policies list "Low-quality directory or bookmark site links" as link spam. Buying or selling links for ranking, excessive exchanges and automated link creation are prohibited. Optimized-anchor links in articles, guest posts or press releases and paid or sponsored links must be qualified with `rel="nofollow"` or `rel="sponsored"`. — [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- Product Hunt gives a nofollow link and badge, so direct SEO value is modest. The indirect upside is branded search, journalist/curator discovery and follow-on DR40–80 links. — [seojuice glossary](https://seojuice.com/glossary/growth/product-led-growth/product-hunt-launch/), [dev.to](https://dev.to/alexcloudstar/why-dofollow-backlinks-still-matter-for-indie-startups-1jn8) (practitioner opinion)
- Practitioner guidance: 10–20 relevant, quality directories rather than mass submission to hundreds. — [dev.to](https://dev.to/alexcloudstar/why-dofollow-backlinks-still-matter-for-indie-startups-1jn8) (opinion)
- Google's AI guide says inauthentic mentions won't meaningfully help generative AI visibility. — [Google AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)

### Inferences

- If the new platform is itself a launch directory, it should:
  1. Mark paid or featured listings `rel="sponsored"`, and ideally nofollow or UGC all submitted listings unless they are editorially reviewed.
  2. Avoid thin, templated listing pages at scale. Unique editorial content per listing, reviews and comparisons are needed, or the site risks scaled content abuse.
  3. Market the value as AI-retrievable third-party mentions and category/listicle inclusion, not "dofollow backlinks". Selling dofollow link juice is a link-scheme risk for both the platform and its customers.
- A well-curated, genuinely useful category page ("best X tools") is the page type answer engines cite for fan-out sub-queries, which is a real GEO benefit.

### Gaps

- No controlled study was found that measures whether directory listings specifically increase LLM citations or mentions.

## 5. Risks: tactics that get penalized

### Takeaway

Classic spam policies apply fully to AI surfaces, because Google AI features draw on the same index and ranking systems. The highest-risk "GEO hacks" are:

- mass AI-generated pages (scaled content abuse)
- paying third-party high-authority sites to host your listicles (site reputation abuse)
- paid dofollow links or directory spam (link schemes)
- expired-domain plays
- fake reviews and astroturfed Reddit mentions ("inauthentic mentions")
- keyword stuffing, which the GEO paper shows reduces generative visibility

### Cited Findings

- **Site reputation abuse:** third-party content published on a host site "mainly because of that host site's already-established ranking signals" is a violation and gets manual actions outside the EEA. Inside the EEA, such pages are handled differently and rank on their own merit. — [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- **Scaled content abuse:** "generating many pages without adding value for users", including via AI tools, scraping/transforming, or stitching sources. — [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- **Expired domain abuse:** buying expired domains to host low-value content. — [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- **Link spam:** paid links without sponsored or nofollow, excessive exchanges, automated links, low-quality directories. — [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- **Keyword stuffing:** −9% visibility in generative engines. — [GEO paper](https://arxiv.org/html/2311.09735v3)
- **Inauthentic mentions:** Google states that pursuing inauthentic mentions won't meaningfully help. — [Google AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- **Crawler/ethics risk on the engine side:** Cloudflare de-listed Perplexity as a verified bot over stealth crawling. Sites using CDN AI-bot blocking may be invisible to some engines. — [Cloudflare](https://blog.cloudflare.com/perplexity-is-using-stealth-undeclared-crawlers-to-evade-website-no-crawl-directives/)

### Inferences

- Myths to call out in the product:
  - "llms.txt improves AI rankings": not used by Google, no evidence for others.
  - "Schema gets you cited": no causal uplift in Ahrefs' controlled test.
  - "Chunk content for AI": Google says it is unnecessary.
  - "You rank #N in ChatGPT": rank is unstable, so use mention rate.
  - "Top-10 Google rank ≈ AIO citation": overlap fell to about 38% in the 2026 measurement.
  - "Backlinks drive AI visibility": mentions correlate about 3x more strongly.
- Evidence-backed levers, strongest first:
  1. Earned third-party mentions on the domains each engine favours: reviews, Reddit/community participation done authentically, YouTube, listicles, press, Wikipedia where notable.
  2. Classic crawlability and indexing in Google, Bing and Brave, plus bot access.
  3. Content enrichment with statistics, quotations and cited sources (GEO paper).
  4. Genuine freshness.
  5. First-hand, non-commodity content (Google guide).
- Platform features that automate Reddit posting, review generation or mass listicle placement would expose customers (and the platform) to spam-policy and community-ToS enforcement.

### Gaps

- No public data was found on OpenAI, Perplexity or Anthropic penalties or filters for manipulated content, beyond Google's policies. Whether ChatGPT's September 2025 Reddit/Wikipedia de-weighting was an anti-manipulation measure is speculative.
- No documented enforcement cases specific to "GEO spam" in AI answers were found.
