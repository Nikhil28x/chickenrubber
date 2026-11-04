import { json } from '@sveltejs/kit';
import { dbQuery } from '../../../lib/server/db';
import type { RequestHandler } from './$types';

// Reviews sent from the website wait for approval in the admin before they show.
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const text = (name: string, max: number) =>
      String(body[name] ?? '')
        .trim()
        .slice(0, max);

    // Hidden from people, so only bots fill it in. Pretend it worked and keep nothing.
    if (text('website', 200)) return json({ ok: true });

    const name = text('customer_name', 80);
    if (!name) return json({ error: 'Please enter your name' }, { status: 400 });

    const mobile = text('mobile', 20).replace(/\D/g, '').slice(-10);
    if (mobile.length !== 10)
      return json({ error: 'Enter a valid 10-digit mobile number' }, { status: 400 });

    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      return json({ error: 'Please choose a star rating' }, { status: 400 });

    const comment = text('comment', 300);
    if (!comment) return json({ error: 'Please write your review' }, { status: 400 });

    await dbQuery(
      `INSERT INTO reviews (customer_name, location, mobile, rating, comment)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, text('location', 80), mobile, rating, comment]
    );
    return json({ ok: true });
  } catch (error) {
    console.error('Review could not be saved', error);
    return json({ error: 'Could not send your review. Please try again.' }, { status: 500 });
  }
};
