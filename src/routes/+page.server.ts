import type { PageServerLoad } from './$types';
import { getStorefront } from '../lib/server/db';

export const load: PageServerLoad = async () => getStorefront();
