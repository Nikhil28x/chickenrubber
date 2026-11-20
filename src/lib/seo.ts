// What search engines and AI assistants read about the business: the page
// title and description, and schema.org structured data (JSON-LD).
import type { Product } from './types';
import { INSTAGRAM_URL, YOUTUBE_URL } from './social';

export const SITE_URL = 'https://raghavchickenrubber.com';

export const SEO_TITLE_SUFFIX = 'Raghav Chicken Rubber, Mysore';

export const SEO_DESCRIPTION =
  'Raghav Kitchen Equipments (Raghav Chicken Rubber), Mysore, since 2004: chicken machine rubbers, chicken cutting machines, pulverisers, wet grinders, atta kneading machines, mixers, coconut scrapers and oil expellers. Cash on delivery across India.';

// Other names people search for the business.
const ALTERNATE_NAMES = [
  'Raghav Chicken Rubber',
  'Raghav Chicken Machine Rubber',
  'Raghav Kitchen Equipments Mysore',
  'Naazare Enterprises'
];

// Product terms customers search for, used as the business's areas of expertise.
const KNOWS_ABOUT = [
  'Commercial kitchen equipment',
  'Food processing machines',
  'Chicken feather cleaning machine',
  'Chicken plucker rubber fingers',
  'Chicken machine rubber and bushes',
  'Stainless steel chicken cutting machine',
  'Wet pulveriser',
  'Dry pulveriser',
  'Wet grinder',
  'Tilting wet grinder',
  'Idli dosa batter grinder',
  'Lakshmi wet grinder',
  'Dough kneading machine',
  'Atta kneading machine',
  'Chapati dough maker',
  'Atta ball making machine',
  'Whipping machine',
  'Heavy duty mixer grinder',
  'Stainless steel mixer',
  'Stainless steel grinder',
  'Coconut scraper',
  'Table top oil expeller'
];

type Settings = {
  business_name: string;
  phone: string;
  secondary_phone: string;
  email: string;
  address: string;
  hero_image_url: string;
};

function absolute(url: string) {
  return new URL(url, SITE_URL).href;
}

function indianPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? `+91${digits}` : undefined;
}

export function structuredData({
  settings,
  products,
  faqs,
  range
}: {
  settings: Settings;
  products: Product[];
  faqs: { question: string; answer: string }[];
  range: { title: string; body: string }[];
}) {
  const business = `${SITE_URL}/#business`;
  const postalCode = settings.address.match(/\b\d{6}\b/)?.[0] ?? '570011';
  const phones = [settings.phone, settings.secondary_phone].map(indianPhone).filter(Boolean);
  const images = [settings.hero_image_url, ...products.map((product) => product.image_url)]
    .filter((url) => url && !url.endsWith('.svg'))
    .slice(0, 6)
    .map(absolute);

  // Products with a price can be described as offers; the rest are "ask price".
  const priced = products.filter(
    (product) => product.price > 0 && product.media.some((item) => item.kind === 'image')
  );

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: settings.business_name,
      alternateName: ALTERNATE_NAMES,
      inLanguage: ['en', 'hi', 'kn', 'te', 'ta', 'ml', 'bn'],
      publisher: { '@id': business }
    },
    {
      '@type': 'Store',
      '@id': business,
      name: settings.business_name,
      alternateName: ALTERNATE_NAMES,
      description: SEO_DESCRIPTION,
      url: `${SITE_URL}/`,
      logo: absolute('/brand/rk-mark.svg'),
      image: images.length ? images : undefined,
      telephone: phones[0],
      email: settings.email || undefined,
      foundingDate: '2004',
      parentOrganization: { '@type': 'Organization', name: 'Naazare Enterprises' },
      address: {
        '@type': 'PostalAddress',
        streetAddress: settings.address || undefined,
        addressLocality: 'Mysuru',
        addressRegion: 'Karnataka',
        postalCode,
        addressCountry: 'IN'
      },
      areaServed: { '@type': 'Country', name: 'India' },
      currenciesAccepted: 'INR',
      paymentAccepted: 'Cash on delivery',
      contactPoint: phones.map((telephone) => ({
        '@type': 'ContactPoint',
        telephone,
        contactType: 'sales',
        areaServed: 'IN'
      })),
      sameAs: [INSTAGRAM_URL, YOUTUBE_URL],
      knowsAbout: KNOWS_ABOUT,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Commercial kitchen equipment and food processing machines',
        itemListElement: range.map((item) => ({
          '@type': 'OfferCatalog',
          name: item.title,
          description: item.body
        }))
      }
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer }
      }))
    }
  ];

  if (priced.length) {
    graph.push({
      '@type': 'ItemList',
      '@id': `${SITE_URL}/#products`,
      name: 'Products',
      itemListElement: priced.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          description: product.description || undefined,
          image: product.media
            .filter((item) => item.kind === 'image')
            .map((item) => absolute(item.url))
            .slice(0, 5),
          url: `${SITE_URL}/?product=${product.id}`,
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'INR',
            availability:
              product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            seller: { '@id': business }
          }
        }
      }))
    });
  }

  // "<" is escaped so text from admin can never close the script tag early.
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(
    /</g,
    '\\u003c'
  );
}
