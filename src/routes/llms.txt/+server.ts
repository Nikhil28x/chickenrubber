import { getStorefront } from '../../lib/server/db';
import { SITE_URL } from '../../lib/seo';
import { translator } from '../../lib/i18n';
import { INSTAGRAM_URL, YOUTUBE_URL } from '../../lib/social';

// A plain-text summary of the business for AI assistants (llms.txt convention),
// built from the same details and products shown on the website.
export async function GET() {
  const { settings, frames } = await getStorefront();
  const t = translator('en');
  const phone = settings.phone.replace(/\D/g, '').slice(-10);
  const products = frames.flatMap((frame) => frame.products);
  const range = [1, 2, 3, 4, 5, 6, 7].map(
    (n) =>
      `- ${t(`cat${n}Title` as Parameters<typeof t>[0])}: ${t(`cat${n}Body` as Parameters<typeof t>[0])}`
  );
  const faqs = [1, 2, 3, 4, 5, 6].map(
    (n) =>
      `### ${t(`faq${n}Q` as Parameters<typeof t>[0])}\n${t(`faq${n}A` as Parameters<typeof t>[0], { phone: `+91 ${phone}` })}`
  );

  const text = `# ${settings.business_name} (Raghav Chicken Rubber)

> ${t('unit')}. Dealers in commercial kitchen equipment and food processing machines since 2004, based in Mysuru (Mysore), Karnataka, India. Cash on delivery across India.

Also known as: Raghav Chicken Rubber, Raghav Chicken Machine Rubber, Naazare Enterprises.

## Contact
- Website: ${SITE_URL}/
- Phone and WhatsApp: +91 ${phone}
- Email: ${settings.email}
- Address: ${settings.address}
- Instagram: ${INSTAGRAM_URL}
- YouTube: ${YOUTUBE_URL}

## Product range
${range.join('\n')}

## Products on the website
${products
  .map(
    (product) =>
      `- ${product.name}${product.price > 0 ? ` (₹${product.price})` : ' (ask for price)'}${product.description ? `: ${product.description}` : ''}`
  )
  .join('\n')}

## Frequently asked questions
${faqs.join('\n\n')}
`;
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
