# CodeHype (codehype.ai) — competitor profile

Research date: 2026-09-30. The site was fetched directly: homepage, /pricing, /about, /directories, /guidelines, /product-hunt-alternative, product pages, one blog post, robots.txt, sitemap.xml, llms.txt, llms-full.txt, ai.txt, /api/ai, /.well-known/mcp.json and the public REST API /v1/products (all pages). Third-party coverage is very thin: a Product Hunt mirror, Launch Llama, the founder's own DEV.to post and Tracxn. I found no Reddit, IndieHackers or X discussion and no public Ahrefs or Similarweb numbers.

## 1. What the product is and the user journey

### Takeaway
CodeHype is a Product Hunt–style launch board and directory for AI and SaaS products, about 6 weeks old. A founder submits a product. The team reviews it by hand and publishes it at /product/{slug}, where it ranks by upvotes on daily and weekly boards. The real product being sold is backlinks (dofollow if you install a badge, or permanent if you pay), plus ad slots and a done-for-you service that submits your product to other directories.

### Cited Findings
- Self-description: "an AI and SaaS product directory and launch platform. Founders submit AI tools, agents, APIs, and startups; listings are human-reviewed before they appear." — [llms.txt](https://www.codehype.ai/llms.txt)
- The About page describes a 4-step flow: Submit → Review ("Public launches are reviewed by the CodeHype team before publication") → Launch ("Approved products receive a dedicated public CodeHype product page indexed for search and AI discovery") → Discover (upvote, visit website). — [About](https://www.codehype.ai/about)
- Discovery surfaces: the homepage and /explore rank launches "by votes, comments, and recency". There is also a weekly board (/launches), /winners, 12 category pages, and 3 "focused catalogs" (/saas-directory, /ai-tools-directory, /startup-directory). — [llms.txt](https://www.codehype.ai/llms.txt)
- Guidelines: the review target is "about 24 hours… not automatic approval". Products need a working HTTPS site and an honest tagline. Spam, duplicates, scams and similar are rejected. On votes: "don't buy votes, run bot farms, or game rankings." — [Guidelines](https://www.codehype.ai/guidelines)
- Each product page has Overview, Screenshots, Pricing, Discussion/comments, "Meet the maker", a category rank (e.g. "#1 / 104" in AI Agents), an overall "Most upvoted" rank, "More [category] products", "Products similar to…", and Compare/Save/Follow buttons. — [Find AI Credits product page](https://www.codehype.ai/product/find-ai-credits)
- There are 12 categories, heavily skewed: AI Agents has 104 products, Developer Tools 51, AI Productivity 35, AI Marketing 31, and AI Coding only 2. — [llms.txt](https://www.codehype.ai/llms.txt)
- Tech stack (founder's own account): Next.js, Supabase, Vercel, Cloudflare R2, Dodo Payments, Resend, GA/GTM, Beehiiv newsletter. — [DEV.to, Haris Ahmad](https://dev.to/harisahmad59/how-i-built-a-saas-launch-directory-with-nextjs-supabase-and-vercel-2mn)
- The pricing page mentions a weekly newsletter digest, "highlights products that moved". — [Pricing](https://www.codehype.ai/pricing)

### Inferences
- Functionally this is a clone of the "PH alternative" pattern (TinyLaunch, MicroLaunch and others): a scheduled launch date, upvotes, weekly winners, and a badge-for-backlink trade. What sets it apart is the machine-readable/agent layer (see §4) and the founder's existing social audience.

### Gaps
- I could not verify how the free queue works (waiting period, daily slot count). The PH-alternative page says "limited daily slots and a waiting period" but gives no numbers, and /guidelines does not mention it.
- I could not verify how weekly winners are chosen beyond upvotes.

## 2. Pricing, tiers and paid "boost" mechanics

### Takeaway
There are three one-time launch tiers ($0 / $15 / $25), weekly homepage ads ($15–$20/week), Instagram promos (from $250) and directory-submission packages ($49 / $99 / $149). No subscription exists. Almost every paid lever is framed around dofollow links.

### Cited Findings
- **Free Launch, $0.** Standard listing queue, public product page, "dofollow while the badge stays on your site". Instant publish, top-of-home placement and the premium badge are not included. — [Pricing](https://www.codehype.ai/pricing)
- **How the badge works:** "Embed a CodeHype badge on your product website, then click Verify… While the badge stays verified, your CodeHype product page links to your site as dofollow. We re-check automatically every 3 days." — [Pricing FAQ](https://www.codehype.ai/pricing)
- **Plus, $15 one-time per product ("Most popular").** Launch on a chosen date, instant publish, no waiting period, no badge required, "Permanent dofollow backlink", premium badge, priority placement. — [Pricing](https://www.codehype.ai/pricing)
- **Pro, $25 one-time.** Everything in Plus, plus "7 days on homepage", featured placement, "2 additional backlinks", "1500 word dedicated blog" and priority support. — [Pricing](https://www.codehype.ai/pricing)
- Paying does not skip review: "Every launch still goes through human review. Paid plans let you choose your launch date and remove the badge requirement." — [Pricing FAQ](https://www.codehype.ai/pricing)
- **Homepage Center Ad, $20/week.** Up to 6 weeks per checkout, 3 slots per week, a sponsored row above Today's Launches. Live inventory on the fetch date showed Week 40 at 2/3 open and Weeks 41–42 at 3/3 open. — [Pricing](https://www.codehype.ai/pricing)
- **Homepage Sidebar Ad, $15/week.** 2 slots per week, a promoted card "on every page", "Dofollow link to your website". All slots were open for Weeks 40–42. — [Pricing](https://www.codehype.ai/pricing)
- **Featured on Instagram, "From $250 per campaign".** Promises the "100K+ follower Instagram page", "Part of our 5M+ monthly organic reach", and cross-posting to YouTube and LinkedIn. — [Pricing](https://www.codehype.ai/pricing)
- **Directory Submission (one-time):** Launch List $49 (20+ directories), Growth List $99 (60+), Ultimate List $149 (100+). It is "100% manual", starts within 24h, and includes a live-link report. — [Directories](https://www.codehype.ai/directories). The same page's hero also says "From $4", which is inconsistent with the $49 minimum and is probably a typo.
- A third-party listing summarised pricing as "Standard listings are free; featured listings cost $15." — [Launch Llama](https://tools.launchllama.co/products/codehype)
- Payments go through Dodo Payments. — [DEV.to](https://dev.to/harisahmad59/how-i-built-a-saas-launch-directory-with-nextjs-supabase-and-vercel-2mn). CodeHype is also listed on [Index by Dodo Payments](https://index.dodopayments.com/codehype).
- Through the public API, 40 of 279 products carry `featured: true`. — [/v1/products](https://www.codehype.ai/v1/products)

### Inferences
- Revenue per customer is tiny ($15–$25 one-time). The higher-ticket items are the directory service ($49–$149) and Instagram ($250+). Unsold ad inventory (most slots open) suggests ad demand is still low.
- The "1500 word dedicated blog" in Pro is where most of the blog comes from (see §3). It is paid, product-specific content.

### Gaps
- I could not see what share of launches are Free, Plus or Pro; the API does not expose the tier. The 40 "featured" products are a lower bound on paid placements.
- No revenue figures are public.

## 3. How CodeHype gets its own domain ranked and trafficked

### Takeaway
The site is very young: the earliest product is dated 2026-08-19, and it has about 370 URLs. Its SEO playbook is modest and standard: programmatic product pages titled "{Product} Review 2026: Features, Pricing and Alternatives", "X alternative(s)" landing pages targeting competitor brand names, "launch platform" keyword pages, three backlink-listicle blog posts, and paid product blogs. Its own backlinks come mostly from the badges customers embed on their sites and from submitting itself to other directories. I found no independent traffic or DR data, and its own traction claims contradict each other.

### Cited Findings
- The sitemap has 372 URLs: 278 /product/, 32 /blog/, 12 /category/, 8 /launches/. It also has pairs of competitor-alternative pages (product-hunt-alternative(s), tinylaunch-, microlaunch-, scrolllaunch-, startupbase-alternative(s)) plus /product-launch-platform, /saas-launch-platform, /launch-saas, /launch-ai-tool, /submit-saas and /compare. — [sitemap.xml](https://www.codehype.ai/sitemap.xml)
- Earliest sitemap lastmod is 2026-08-19. By launch month the API shows 82 products in Aug 2026 and 197 in Sep 2026. — [sitemap.xml](https://www.codehype.ai/sitemap.xml); [/v1/products](https://www.codehype.ai/v1/products). Launch Llama says it "launched in August 2026". — [Launch Llama](https://tools.launchllama.co/products/codehype)
- Product page `<title>` pattern: "Find AI Credits Review 2026: Features, Pricing and Alternatives". The page has canonical and `index, follow` tags. Its JSON-LD is only `WebPage` + `BreadcrumbList`, with no `SoftwareApplication`, `Product`, `Offer`, `AggregateRating` or `Review` schema. — [product page](https://www.codehype.ai/product/find-ai-credits) (raw HTML inspected)
- Of 32 blog slugs, 26 are single-product posts (e.g. "easeclaw-ai-linkedin-outreach-agent", "competescan-ai-visibility-checker"), which fits the Pro tier's "1500 word dedicated blog". Three are backlink listicles: "list-of-free-saas-directories-for-backlinks-2026", "7-free-saas-directories-for-backlinks-2026" and "top-3-saas-directories-2026". — [sitemap.xml](https://www.codehype.ai/sitemap.xml)
- The listicle "List of Free SaaS Directories for Backlinks 2026" (Sep 5, 2026, about 1,400 words) lists Product Hunt, CodeHype, G2, AlternativeTo and BetaList, placing itself among them. — [Blog post](https://www.codehype.ai/blog/list-of-free-saas-directories-for-backlinks-2026)
- The Product Hunt alternative page has a feature-comparison table. It positions "scheduled launches" and "discovery after launch" against PH's daily format, and "Dofollow backlink (badge on Free; permanent on Plus/Pro)". — [PH alternative](https://www.codehype.ai/product-hunt-alternative)
- The founder's SEO notes: dynamic sitemap, structured data "with selective removal of inaccurate schema", internal linking. Quote: "SEO isn't about adding as much markup as possible. The markup needs to accurately describe the content on the page." Challenges he names: duplicate content, low-quality submissions, indexing. — [DEV.to](https://dev.to/harisahmad59/how-i-built-a-saas-launch-directory-with-nextjs-supabase-and-vercel-2mn)
- CodeHype lists itself as #24 in its own directory-submission catalog ("Index by Dodo Payments", DR 79); it is also present on that index. — [Directories](https://www.codehype.ai/directories); [Dodo index](https://index.dodopayments.com/codehype)
- Its own traction claims are inconsistent:
  - Homepage: "100,000 visitors this month", "117 online", "45+ products launching this week". — [Homepage](https://www.codehype.ai/)
  - llms.txt: "Get your startup in front of 100K+ users". — [llms.txt](https://www.codehype.ai/llms.txt)
  - About page: "5M+ Organic reach every month on social media", "250K+ Audience across channels", "447+ Products listed". — [About](https://www.codehype.ai/about)
  - The API and llms.txt count only 279 products. — [llms.txt](https://www.codehype.ai/llms.txt); [/v1/products](https://www.codehype.ai/v1/products)
  - The Product Hunt submission claimed "100K+ audience and 2M+ monthly reach". — [hunted.space](https://hunted.space/product/codehype)
- Engagement is low. Across all 279 products the median is 3 upvotes, the maximum 59, and the total 1,757. — [/v1/products](https://www.codehype.ai/v1/products)

### Inferences
- The "100,000 visitors this month" figure is very unlikely to be organic search traffic for a 6-week-old domain with about 370 URLs. More likely it is social-driven, loosely counted, or aspirational. Treat it as unverified.
- The big social numbers (100K Instagram, 250K–5M reach) most likely come from the founder's earlier coding-education content brand, also named "CodeHype" (see §5), not from a launch-platform audience.
- The "{Product} Review 2026: Features, Pricing and Alternatives" titles target long-tail "[product] review / alternatives" searches for the listed products. That traffic is inherently tiny for unknown indie products.

### Gaps
- I could not get Ahrefs DR/UR, referring domains, organic keywords or a Similarweb traffic estimate. The Ahrefs public page returned a redirect, and no public SEO snippet exists in search results. Treat all traffic figures as unverified.
- I could not confirm the Instagram follower count (Instagram returned HTTP 429).

## 4. How it claims to make listed products rank in Google and AI answer engines

### Takeaway
The claim is general ("get discovered across Google, AI search, and LLMs") and rests on four things:
1. A dofollow backlink from an indexed product page.
2. A done-for-you submission service to other directories.
3. A very complete machine-readable layer: llms.txt, llms-full.txt, ai.txt, a JSON index, an OpenAPI REST API and an unauthenticated MCP server.
4. Share/"ask AI" icons for ChatGPT, Claude, Perplexity and Grok.

The only "proof" offered is a Domain Rating (DR) case study on a domain the founder appears to own. No evidence is offered that any listed product appears in ChatGPT, Perplexity, Gemini or AI Overviews answers.

### Cited Findings
- Core claim: "Launch your startup for free, earn a quality backlink, and get discovered across Google, AI search, and LLMs." — [/api/ai](https://www.codehype.ai/api/ai); the same line is in the site footer.
- **Backlink mechanics.** Free listings are dofollow only while a badge on the customer's site stays verified (re-checked every 3 days). Plus/Pro give a "permanent dofollow backlink", Pro adds "2 additional backlinks", and the sidebar ad is dofollow. — [Pricing](https://www.codehype.ai/pricing). The outbound "Visit" links I checked on product pages carry `rel="noopener noreferrer"` with no `nofollow`, so they are dofollow. — [product page raw HTML](https://www.codehype.ai/product/find-ai-credits)
- **Directory service claim:** "Build high-quality backlinks, boost your online visibility, improve your Google rankings, and get discovered by AI search." — [Directories](https://www.codehype.ai/directories)
- **Case study:** "findaicredits.com went from DR 2 to DR 21… Ahrefs Rank climbed from 54.6M to 3.5M" after a 100+ directory campaign. — [Directories](https://www.codehype.ai/directories). The same product (Find AI Credits) is listed on CodeHype "By Haris Ahmad", who is CodeHype's founder, and the founder's own comment on the listing reads "Find AI Credits is free for everyone. Take a look!" It holds a Plus badge and is ranked #1 in AI Agents. — [Find AI Credits page](https://www.codehype.ai/product/find-ai-credits)
- **Directory catalog:** a "transparent list of vetted high-authority directories… ranked by DR". Top entries: SourceForge 93, Capterra 91, DEV Community 91, G2 91, n8n Integrations 90, Software Advice 87, GetApp 85, BetaList 76, Indie Hackers 79 (marked Nofollow). Only 25 rows appeared in the server-rendered HTML (24 marked Dofollow, 1 Nofollow), despite the "100+" claim. — [Directories](https://www.codehype.ai/directories)
- **Machine-readable / GEO layer.** robots.txt allows everything (`Allow: /`), explicitly lists the AI files and blocks /api/ except the AI endpoints. It exposes:
  - llms.txt and llms-full.txt (a 175KB full index of products)
  - ai.txt
  - /api/ai (JSON index)
  - /api/products/catalog
  - /api/md/_catalog (markdown content catalog)
  - /.well-known/api-catalog (RFC 9727 linkset)
  - /v1 REST API with OpenAPI 3.1
  - an MCP server at /mcp (JSON-RPC, protocol 2025-03-26, no auth, 40 req/min), whose tools include search_products, search_ai_tools, get_product_details, get_trending_products and get_stats

  — [robots.txt](https://www.codehype.ai/robots.txt); [llms.txt](https://www.codehype.ai/llms.txt); [ai.txt](https://www.codehype.ai/ai.txt); [mcp.json](https://www.codehype.ai/.well-known/mcp.json)
- ai.txt asks agents: "Attribution: link to the canonical CodeHype product URL when citing a listing." — [ai.txt](https://www.codehype.ai/ai.txt)
- The product page includes icon links titled OpenAI, Claude, Perplexity and Grok (alongside social icons). — [product page raw HTML](https://www.codehype.ai/product/find-ai-credits)
- **Schema:** product pages only emit WebPage + BreadcrumbList JSON-LD, with no SoftwareApplication or Product entity. — [product page raw HTML](https://www.codehype.ai/product/find-ai-credits)
- The PH submission framed it this way: "While most SaaS directories are built around selling backlinks… When you list on CodeHype, you're not just getting a backlink—you're getting distribution, visibility, and a chance to reach real users." — [hunted.space](https://hunted.space/product/codehype)

### Inferences
- The only DR case study appears to be the founder's own site. That makes it self-referential, not independent proof. It also measures Ahrefs DR, which is a third-party proxy, not rankings or traffic.
- The AI-engine layer (llms.txt, MCP, OpenAPI) makes CodeHype's own catalog easy for agents to read. It does nothing to put a customer's product into ChatGPT or Perplexity answers, unless those engines actually retrieve CodeHype pages. No evidence of that is offered.
- The ChatGPT/Claude/Perplexity/Grok icons are most likely "ask AI about this page" prefill links (a common GEO gimmick). They are not distribution into those engines. I could not confirm the exact link targets.
- The "LaunchRanked" mention on the homepage ("Rank on Google and get cited by AI") appears to be a sponsored ad or listing for a separate product (launchranked is a listed product and has a paid blog post). It is not a CodeHype feature.

### Gaps
- There is no case study, screenshot or data showing any listed product cited by ChatGPT, Perplexity, Gemini, Claude or AI Overviews.
- I could not verify the full 100+ directory list (only 25 rendered server-side) or how many submissions actually go live or are indexed.
- I could not confirm whether CodeHype product pages themselves are indexed or ranking in Google.

## 5. Founder, launch date, traction and sentiment

### Takeaway
It is a solo-founder project by Haris Ahmad Kaboo (X: @harisahmad59), who reuses the "CodeHype" name from an earlier coding-education and content brand. The launch platform went live around 19 Aug 2026 and has had a weak reception: 3 upvotes on Product Hunt, a handful of third-party listings, and no organic community discussion found.

### Cited Findings
- Founder: "Haris Ahmad Kaboo, Founder & Builder, CodeHype". — [About](https://www.codehype.ai/about). Contact: haris@codehype.ai. — [llms.txt](https://www.codehype.ai/llms.txt)
- Social handles: Instagram @codehype_, X @harisahmad59, LinkedIn, YouTube. — [Homepage](https://www.codehype.ai/)
- An earlier CodeHype entity appears with a separate domain [codehype.in](https://codehype.in/about-us/) and a [Medium post "Elevate Your Coding Game with CodeHype"](https://medium.com/@harismushtaq59/from-novice-to-ninja-elevate-your-coding-game-with-codehype-fe7511f8c05c). A Tracxn profile exists. — [Tracxn](https://tracxn.com/d/companies/codehype/__2XTEqHonTLUlGhWPL7atHBjNMo_7l7J41oE1AYzzPzg). A search summary described that earlier brand as founded Jan 2023 as a tech-learning platform with the founder having "200,000 followers across platforms". I did not open these pages, so that summary is unverified.
- The founder's DEV.to post (Sep 16, 2026) says: "Within the first 10 days, more than 200 products had been submitted/listed" and "hundreds of registered users". — [DEV.to](https://dev.to/harisahmad59/how-i-built-a-saas-launch-directory-with-nextjs-supabase-and-vercel-2mn)
- Product Hunt: 3 upvotes, 1 comment, #61 of the day, hunted by the founder, tagline "Discover AI Tools, SaaS & Startup Launches". — [hunted.space](https://hunted.space/product/codehype)
- Launch Llama: 122 upvotes, #239 of 1,210 SaaS tools, one 5.0 review, and a comment "Just launched my saas on codehype" (Aug 31). — [Launch Llama](https://tools.launchllama.co/products/codehype)
- On-site engagement: median 3 upvotes per product, top product 59. — [/v1/products](https://www.codehype.ai/v1/products)
- Several listings are themselves SEO/GEO tools or launch directories, including Refine AI ("monitors ChatGPT, Claude, Gemini, Perplexity and Google AI Overviews"), Rankcow, CompeteScan (an AI visibility checker), LaunchRanked, IndieTools, Free SEO Tools and ToolSift. — [product page sidebar](https://www.codehype.ai/product/find-ai-credits); [sitemap.xml](https://www.codehype.ai/sitemap.xml)

### Inferences
- The customer base is largely indie makers chasing backlinks. Many are other directory or SEO builders swapping listings, which is typical of the "launch directory" niche.

### Gaps
- I found no Reddit, IndieHackers or X threads reviewing CodeHype, so there is no organic user sentiment or criticism available. The absence is itself a signal of low awareness.
- I could not verify the Instagram and YouTube follower counts.

## 6. Strengths, weaknesses and gaps a competitor could exploit

### Takeaway
CodeHype's real strengths are cheap pricing, fast human review, an unusually thorough agent/LLM-readable layer (MCP + OpenAPI + llms.txt) and a founder with an existing social audience. Its weaknesses are a young, low-authority domain, unproven and contradictory claims, a self-referential case study, thin schema, low engagement, and no measurement of AI-answer visibility at all.

### Cited Findings
- Strengths:
  - $0 to $25 one-time launches with a dofollow link option. — [Pricing](https://www.codehype.ai/pricing)
  - A full agent stack: MCP, OpenAPI, llms.txt, an RFC 9727 api-catalog. — [ai.txt](https://www.codehype.ai/ai.txt)
  - A 24h human review target. — [Guidelines](https://www.codehype.ai/guidelines)
  - A done-for-you directory service with a transparent DR-ranked catalog. — [Directories](https://www.codehype.ai/directories)
- Weaknesses:
  - The product count claim (447) contradicts the API (279). — [About](https://www.codehype.ai/about) vs [llms.txt](https://www.codehype.ai/llms.txt)
  - Social reach is claimed variously as 2M+ and 5M+. — [hunted.space](https://hunted.space/product/codehype) vs [Pricing](https://www.codehype.ai/pricing)
  - The DR case study is the founder's own product. — [Directories](https://www.codehype.ai/directories); [Find AI Credits](https://www.codehype.ai/product/find-ai-credits)
  - Product schema is minimal. — [product page](https://www.codehype.ai/product/find-ai-credits)
  - The blog is mostly paid single-product posts. — [sitemap.xml](https://www.codehype.ai/sitemap.xml)
  - The free backlink is conditional on a reciprocal badge. — [Pricing](https://www.codehype.ai/pricing)
  - Ad inventory is largely unsold. — [Pricing](https://www.codehype.ai/pricing)

### Inferences
Openings for a competitor:
- **Measurable AI visibility.** Nobody in this tier shows before/after citation tracking in ChatGPT, Perplexity, Gemini or AI Overviews. A platform that runs prompt panels per listing and reports share-of-answer would beat "DR went up" proof.
- **Richer entity data.** Full `SoftwareApplication`/`Organization` schema with `sameAs`, pricing `Offer`, FAQ and comparison data per product. That data is what AI engines extract, and CodeHype omits it.
- **Honest, audited metrics.** A public traffic dashboard (e.g. Plausible), and case studies on customers not owned by the founder.
- **Differentiated editorial content.** Category "best X for Y" comparison pages built from real listing data. CodeHype's alternative and review pages are templated.
- **Remove the reciprocal-badge dependency,** or be explicit about link attributes. Google treats paid dofollow links as a link-scheme risk. CodeHype openly sells "permanent dofollow" and dofollow sponsored slots, which could become a liability if Google acts on it. This is my inference about risk; I found no evidence of a penalty.
- **Cheap to clone.** The whole stack (Next.js/Supabase/Vercel) and the feature set are easy to copy. The defensible assets would be audience, domain authority and verified AI-citation outcomes.

### Gaps
- There is no independent SEO data (DR, referring domains, organic traffic) to size CodeHype's actual authority. That needs a paid Ahrefs/Semrush lookup.
