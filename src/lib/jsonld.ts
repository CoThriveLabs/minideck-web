// MiniDeck LP 用 Schema.org JSON-LD ビルダー。
// FAQPage は Faq.astro の faqs 配列を単一の正本として参照する。

import { CONTACT_EMAIL } from './constants';

export type FaqItem = { q: string; a: string | string[] };

const ORG_NAME = 'Co-Thrive Labs';
const PRODUCT_NAME = 'MiniDeck';

export function organizationJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ORG_NAME,
    url: siteUrl,
    logo: `${siteUrl}/favicon.svg`,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: CONTACT_EMAIL,
        availableLanguage: ['ja'],
      },
    ],
  };
}

export function websiteJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: PRODUCT_NAME,
    url: siteUrl,
    inLanguage: 'ja',
  };
}

export function softwareApplicationJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: PRODUCT_NAME,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Windows 10, Windows 11',
    url: siteUrl,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY',
    },
    author: { '@type': 'Organization', name: ORG_NAME },
  };
}

/** 質問文中の <br> 等 HTML タグを取り除く（JSON-LD は純テキスト推奨）。 */
function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '');
}

export function faqPageJsonLd(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: stripHtml(f.q),
      acceptedAnswer: {
        '@type': 'Answer',
        text: Array.isArray(f.a) ? f.a.join('\n\n') : f.a,
      },
    })),
  };
}
