import type { Handle } from '@sveltejs/kit/hooks';
import { verifyAdminToken } from './lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.admin = verifyAdminToken(event.cookies.get('raghav_admin'));
  return resolve(event);
};
