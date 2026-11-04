import { error, json } from '@sveltejs/kit';
import { dbQuery } from '../../../lib/server/db';
import { MAX_UPLOAD_BYTES, PRODUCT_MEDIA_COLUMNS } from '../../../lib/server/media';
import type { RequestHandler } from './$types';

// Adds, removes or reorders one product photo/video. Each change saves at once.
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.admin) error(401, 'Please sign in again.');
  const form = await request.formData();
  const action = String(form.get('action') ?? '');

  if (action === 'add') {
    const productId = Number(form.get('product_id'));
    const file = form.get('file');
    if (!Number.isInteger(productId)) error(400, 'Unknown product.');
    if (!(file instanceof File) || file.size === 0) {
      return json({ error: 'No file was chosen.' }, { status: 400 });
    }
    const kind = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
        ? 'video'
        : '';
    if (!kind) return json({ error: 'Choose a photo or a video.' }, { status: 400 });
    if (file.size > MAX_UPLOAD_BYTES) {
      return json(
        {
          error:
            kind === 'video'
              ? 'This video is too large. Please use a clip under 4 MB.'
              : 'This photo is too large. Please choose a smaller photo.'
        },
        { status: 413 }
      );
    }
    const url = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}`;
    const result = await dbQuery(
      `INSERT INTO product_media (product_id, kind, url, sort_order)
       SELECT $1, $2, $3, COALESCE(MAX(sort_order), 0) + 1 FROM product_media WHERE product_id = $1
       RETURNING ${PRODUCT_MEDIA_COLUMNS}`,
      [productId, kind, url]
    );
    return json(result.rows[0]);
  }

  const id = Number(form.get('id'));
  if (!Number.isInteger(id)) error(400, 'Unknown photo.');

  if (action === 'remove') {
    await dbQuery('DELETE FROM product_media WHERE id = $1', [id]);
    return json({ ok: true });
  }

  if (action === 'main') {
    // Moves this item to the front so it becomes the main photo.
    await dbQuery(
      `UPDATE product_media SET sort_order = (
         SELECT COALESCE(MIN(sort_order), 0) - 1 FROM product_media
         WHERE product_id = (SELECT product_id FROM product_media WHERE id = $1)
       ) WHERE id = $1`,
      [id]
    );
    return json({ ok: true });
  }

  error(400, 'Unknown action.');
};
