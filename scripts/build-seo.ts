import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SITE_URL = 'https://sushiro-hk-live.vercel.app';
const UPSTREAM_API = 'https://sushipass.sushiro.com.hk/api/2.0/info/storelist?latitude=22&longitude=114&numresults=100&region=HK';
const DIST_DIR = join(import.meta.dirname, '..', 'dist');
const INDEX_HTML = join(DIST_DIR, 'index.html');

interface Store {
  id: number;
  name: string;
  nameEn: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  wait: number;
  waitingGroup: number;
  storeStatus: string;
  netTicketStatus: string;
  localTicketingStatus: string;
  waitTimeCap: number;
}

async function fetchStores(): Promise<Store[]> {
  const res = await fetch(UPSTREAM_API);
  if (!res.ok) throw new Error(`Upstream API error: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.stores || []);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateStoreHTML(baseHTML: string, store: Store): string {
  // Inject meta tags into <head>
  const title = `壽司郎 ${store.name} - 即時等候時間 | 壽司郎 HK Live`;
  const description = `壽司郎 ${store.name} (${store.nameEn}) 即時等候時間：${store.wait} 分鐘，${store.waitingGroup} 組輪候中。地址：${store.address}`;
  const url = `${SITE_URL}/store/${store.id}`;

  const metaTags = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${url}" />`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: store.name,
    alternateName: store.nameEn,
    address: {
      '@type': 'PostalAddress',
      streetAddress: store.address,
      addressLocality: 'Hong Kong',
      addressRegion: store.area,
      addressCountry: 'HK',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: store.latitude,
      longitude: store.longitude,
    },
    url,
    sameAs: 'https://www.sushiro.com.hk/',
    servesCuisine: 'Japanese',
    priceRange: '$$',
  };

  const dataScript = `<script>window.__STORE_DATA__ = ${JSON.stringify({ store })};</script>`;
  const structuredScript = `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;

  // Insert meta tags and scripts before </head>
  const html = baseHTML
    .replace(/<title>.*?<\/title>/s, '')
    .replace(/<meta name="description".*?\/>/s, '')
    .replace(/<link rel="canonical".*?\/>/s, '')
    .replace(/<meta property="og:title".*?\/>/s, '')
    .replace(/<meta property="og:description".*?\/>/s, '')
    .replace(/<meta property="og:url".*?\/>/s, '')
    .replace('</head>', `${metaTags}\n    ${structuredScript}\n    ${dataScript}\n  </head>`);

  return html;
}

function generateSitemap(stores: Store[]): string {
  const today = new Date().toISOString().split('T')[0];
  const urls = stores.map((s) => `  <url>
    <loc>${SITE_URL}/store/${s.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>always</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
${urls}
</urlset>`;
}

async function main() {
  console.log('Fetching store list from upstream API...');
  const stores = await fetchStores();
  console.log(`Fetched ${stores.length} stores`);

  // Read base index.html from dist (after Vite build)
  if (!existsSync(INDEX_HTML)) {
    console.error('dist/index.html not found. Run `npm run build` first.');
    process.exit(1);
  }
  const baseHTML = readFileSync(INDEX_HTML, 'utf-8');

  // Generate store pages
  console.log('Generating store pages...');
  const storeDir = join(DIST_DIR, 'store');
  mkdirSync(storeDir, { recursive: true });

  for (const store of stores) {
    const html = generateStoreHTML(baseHTML, store);
    writeFileSync(join(storeDir, `${store.id}.html`), html, 'utf-8');
  }
  console.log(`Generated ${stores.length} store pages`);

  // Generate sitemap
  console.log('Generating sitemap...');
  const sitemap = generateSitemap(stores);
  writeFileSync(join(DIST_DIR, 'sitemap.xml'), sitemap, 'utf-8');
  console.log('Sitemap generated');

  // Also update public/sitemap.xml as source
  const publicDir = join(import.meta.dirname, '..', 'public');
  writeFileSync(join(publicDir, 'sitemap.xml'), sitemap, 'utf-8');
  console.log('Updated public/sitemap.xml');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
