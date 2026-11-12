import type { PageServerLoad } from './$types';
import { getStorefront } from '../lib/server/db';

export const load: PageServerLoad = async ({ url }) => {
  const storefront = await getStorefront();
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
    return { ...storefront, share, reviews: sampleReviews, sampleReviews: true };
  }
  return { ...storefront, share, sampleReviews: false };
};
