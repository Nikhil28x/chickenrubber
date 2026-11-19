import type { PageServerLoad } from './$types';
import { getStorefront } from '../lib/server/db';
import { isLang, LANG_COOKIE } from '../lib/i18n';

export const load: PageServerLoad = async ({ url, cookies }) => {
  const storefront = await getStorefront();
  const saved = cookies.get(LANG_COOKIE);
  const lang = isLang(saved) ? saved : 'en';
  // Which product a shared link points at, for its link preview.
  const share = {
    origin: url.origin,
    url: url.href,
    productId: Number(url.searchParams.get('product')) || 0,
    mediaIndex: Math.max(0, Number(url.searchParams.get('media')) || 0)
  };
  // Design preview on the local dev server until real reviews exist.
  // The build removes this branch and its data.
  if (import.meta.env.DEV && !storefront.reviews.length) {
    const { sampleReviews } = await import('../lib/sampleReviews');
    return { ...storefront, share, lang, reviews: sampleReviews, sampleReviews: true };
  }
  return { ...storefront, share, lang, sampleReviews: false };
};
