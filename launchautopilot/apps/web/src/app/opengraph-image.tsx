import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/seo';

export const dynamic = 'force-static';
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: '#fafafa',
        padding: 80,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: 68, fontWeight: 700, letterSpacing: '-0.03em' }}>{SITE_NAME}</div>
      <div style={{ fontSize: 32, color: '#a1a1aa', marginTop: 16 }}>{SITE_TAGLINE}</div>
    </div>,
    size,
  );
}
