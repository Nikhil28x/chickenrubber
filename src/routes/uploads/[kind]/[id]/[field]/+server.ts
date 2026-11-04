import { error } from '@sveltejs/kit';
import { dbQuery } from '../../../../../lib/server/db';
import { MEDIA_TABLES, isMediaField, mediaResponse } from '../../../../../lib/server/media';
import type { RequestHandler } from './$types';

// Serves the hero image or a homepage video uploaded from the admin.
export const GET: RequestHandler = async ({ params }) => {
  const { kind, field } = params;
  const id = Number(params.id);
  if (!isMediaField(kind, field) || !Number.isInteger(id)) error(404);

  const result = await dbQuery<{ value: string }>(
    `SELECT ${field} AS value FROM ${MEDIA_TABLES[kind]} WHERE id = $1`,
    [id]
  );
  return mediaResponse(result.rows[0]?.value);
};
