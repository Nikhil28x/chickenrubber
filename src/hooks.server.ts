import type { RequestEvent } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { verifyAdminToken } from './lib/server/auth';
import { closeDb } from './lib/server/db';
import { waitUntil } from 'cloudflare:workers';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.admin = verifyAdminToken(event.cookies.get('naazare_admin'));

  // Uploaded photos and videos never change at the same link, so Cloudflare keeps
  // a copy near each visitor and only the first request reads the database.
  const cache = mediaCache(event);
  const cached = await cache?.match(event.request);
  if (cached) return cached;

  try {
    const response = await resolve(event);
    if (cache && response.status === 200) {
      waitUntil(cache.put(event.request, response.clone()));
    }
    return response;
  } finally {
    closeDb(event.locals);
  }
};

function mediaCache(event: RequestEvent) {
  const { pathname, searchParams } = event.url;
  if (event.request.method !== 'GET' || !pathname.startsWith('/uploads/')) return undefined;
  if (!searchParams.has('v')) return undefined;
  // Only on Cloudflare; the local dev server has no edge cache.
  return typeof caches === 'undefined'
    ? undefined
    : (caches as CacheStorage & { default?: Cache }).default;
}
