import { error } from '@sveltejs/kit';
import { dbQuery } from '../../../../lib/server/db';
import { mediaResponse } from '../../../../lib/server/media';
import type { RequestHandler } from './$types';

// Serves one product photo or video.
export const GET: RequestHandler = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) error(404);
  const result = await dbQuery<{ url: string }>('SELECT url FROM product_media WHERE id = $1', [
    id
  ]);
  return mediaResponse(result.rows[0]?.url);
};
