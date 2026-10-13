import { AppError } from './errors';

export function normalizePostUrl(raw: string, platform: string): string {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.username || url.password || url.port) {
    throw new AppError(400, 'INVALID_POST_URL', 'Use an HTTPS link to a public post.');
  }
  const host = url.hostname
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/^m\./, '');
  if (platform === 'instagram' && host === 'instagram.com') {
    const match = url.pathname.match(/^\/(p|reel|reels|tv)\/([a-zA-Z0-9_-]+)\/?$/);
    if (match) return `https://www.instagram.com/p/${match[2]}/`;
  }
  if (platform === 'youtube' && (host === 'youtube.com' || host === 'youtu.be')) {
    const id =
      host === 'youtu.be'
        ? url.pathname.slice(1).replace(/\/$/, '')
        : url.pathname === '/watch'
          ? url.searchParams.get('v')
          : url.pathname.match(/^\/(shorts|embed)\/([a-zA-Z0-9_-]+)\/?$/)?.[2];
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return `https://www.youtube.com/watch?v=${id}`;
  }
  throw new AppError(
    400,
    'INVALID_POST_URL',
    `Add a valid ${platform === 'instagram' ? 'Instagram post or reel' : 'YouTube video or Short'} link for this campaign.`,
  );
}
