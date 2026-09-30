/**
 * The one rule for every outbound link we render: payment makes a link
 * sponsored, editorial approval makes it followed. Never a badge condition.
 */

export type Rel = '' | 'sponsored' | 'ugc' | 'nofollow';

export interface OutboundLink {
  paidOrderId: string | null;
  source: 'listing' | 'comment' | 'review' | 'placement';
  listing?: {
    review: 'pending' | 'approved' | 'rejected';
    factsVerified: boolean;
  };
}

export function relFor(link: OutboundLink): Rel {
  if (link.paidOrderId) return 'sponsored';
  if (link.source === 'comment' || link.source === 'review') return 'ugc';
  if (link.source === 'placement') return 'sponsored';
  if (link.listing?.review === 'approved' && link.listing.factsVerified) return '';
  return 'nofollow';
}

/** The `rel` attribute string to render, including the safety defaults. */
export function relAttribute(link: OutboundLink): string {
  const rel = relFor(link);
  return ['noopener', rel].filter(Boolean).join(' ');
}
