/**
 * The AI / answer-engine crawler allowlist.
 *
 * Search engines are covered by the wildcard rule; these agents are named
 * explicitly because several of them ignore a bare `User-agent: *` allow and
 * because being explicit documents the intent — this site *wants* to be cited
 * by answer engines.
 */
export const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'GoogleOther',
  'Applebot',
  'Applebot-Extended',
  'Bytespider',
  'Amazonbot',
  'cohere-ai',
  'DeepSeekBot',
  'MistralAI-User',
  'meta-externalagent',
] as const;

/** Paths no crawler should index. */
export const DISALLOWED_PATHS = ['/api/', '/_next/', '/admin/', '/private/'] as const;
