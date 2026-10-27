import { fail, redirect } from '@sveltejs/kit';
import { createAdminToken, verifyAdmin } from '../../../lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.admin) redirect(303, '/admin');
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const form = await request.formData();
    const username = String(form.get('username') || '');
    const password = String(form.get('password') || '');

    if (!verifyAdmin(username, password)) {
      return fail(400, { error: 'Incorrect username or password', username });
    }

    cookies.set('raghav_admin', createAdminToken(), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 12
    });
    redirect(303, '/admin');
  }
};
