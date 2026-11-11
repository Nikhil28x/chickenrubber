import type { PageServerLoad } from './$types';
import { getStorefront } from '../lib/server/db';

export const load: PageServerLoad = async () => {
  const storefront = await getStorefront();
  // Design preview on the local dev server until real reviews exist.
  // The build removes this branch and its data.
  if (import.meta.env.DEV && !storefront.reviews.length) {
    const { sampleReviews } = await import('../lib/sampleReviews');
    return { ...storefront, reviews: sampleReviews, sampleReviews: true };
  }
  return { ...storefront, sampleReviews: false };
};
