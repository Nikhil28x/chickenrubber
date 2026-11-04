import { error, json } from '@sveltejs/kit';
import { dbQuery } from '../../../lib/server/db';
import {
  MAX_UPLOAD_BYTES,
  MEDIA_TABLES,
  isMediaField,
  mediaUrlSql
} from '../../../lib/server/media';
import type { RequestHandler } from './$types';

// Saves (or clears) one photo or video as soon as it is picked in the admin.
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.admin) error(401, 'Please sign in again.');

  const form = await request.formData();
  const kind = String(form.get('kind') ?? '');
  const field = String(form.get('field') ?? '');
  const id = Number(form.get('id'));
  if (!isMediaField(kind, field) || !Number.isInteger(id)) error(400, 'Unknown photo slot.');

  const file = form.get('file');
  let value = '';
  if (file instanceof File && file.size > 0) {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) return json({ error: 'Choose a photo or a video.' }, { status: 400 });
    if (file.size > MAX_UPLOAD_BYTES) {
      return json(
        {
          error: isVideo
            ? 'This video is too large. Please use a clip under 4 MB.'
            : 'This photo is too large. Please choose a smaller photo.'
        },
        { status: 413 }
      );
    }
    value = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}`;
  } else if (form.get('remove') !== '1') {
    return json({ error: 'No file was chosen.' }, { status: 400 });
  }

  const result = await dbQuery<{ url: string }>(
    `UPDATE ${MEDIA_TABLES[kind]} SET ${field} = $1, updated_at = NOW() WHERE id = $2
     RETURNING ${mediaUrlSql(kind, field)} AS url`,
    [value, id]
  );
  if (!result.rows[0]) error(404, 'That item no longer exists.');
  return json({ url: result.rows[0].url });
};
