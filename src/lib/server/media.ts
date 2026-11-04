// Uploaded photos and videos are stored in the database as data URLs.
// Pages never ship that data inline: queries swap it for a short, cacheable
// /uploads/... link, which the uploads route turns back into the file.

export const MEDIA_FIELDS = {
  settings: ['hero_image_url', 'video_1_url', 'video_2_url']
} as const;

export type MediaKind = keyof typeof MEDIA_FIELDS;

export const MEDIA_TABLES: Record<MediaKind, string> = {
  settings: 'site_settings'
};

// Vercel rejects request bodies over 4.5 MB, so one file must stay under that.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function isMediaField(kind: string, field: string): kind is MediaKind {
  return (
    kind in MEDIA_FIELDS && (MEDIA_FIELDS[kind as MediaKind] as readonly string[]).includes(field)
  );
}

// SQL that yields the public link for a media column.
export function mediaUrlSql(kind: MediaKind, field: string) {
  return `CASE WHEN ${field} LIKE 'data:%'
    THEN '/uploads/${kind}/' || id || '/${field}?v=' || left(md5(${field}), 10)
    ELSE ${field} END`;
}

function mediaColumn(kind: MediaKind, field: string) {
  return `${mediaUrlSql(kind, field)} AS ${field}`;
}

export const PRODUCT_COLUMNS = `id, frame_id, name, description, price::float8 AS price, stock,
  is_active, sort_order`;

// Product photos and videos live in product_media, one row per file.
export const PRODUCT_MEDIA_COLUMNS = `id, product_id, kind,
  CASE WHEN url LIKE 'data:%'
    THEN '/uploads/media/' || id || '?v=' || left(md5(url), 10)
    ELSE url END AS url`;

export const SETTINGS_COLUMNS = `business_name, phone, secondary_phone, email, whatsapp, address,
  ${MEDIA_FIELDS.settings.map((field) => mediaColumn('settings', field)).join(', ')},
  updated_at`;

// Turns a stored value back into a file response (or a redirect for plain links).
export function mediaResponse(value: string | undefined) {
  if (!value) return new Response('Not found', { status: 404 });
  if (!value.startsWith('data:')) {
    return new Response(null, { status: 302, headers: { Location: value } });
  }
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(value);
  if (!match) return new Response('Not found', { status: 404 });
  return new Response(Buffer.from(match[2], 'base64'), {
    headers: {
      'Content-Type': match[1],
      // Links carry a content hash, so a new upload always gets a new link.
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
