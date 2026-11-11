import type { Handle } from '@sveltejs/kit/hooks';
import { verifyAdminToken } from './lib/server/auth';
import { closeDb } from './lib/server/db';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.admin = verifyAdminToken(event.cookies.get('naazare_admin'));
  try {
    return await resolve(event);
  } finally {
    closeDb(event.locals);
  }
};
