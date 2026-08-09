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

function getStoreRegion(store: { area?: string; address?: string; name?: string }): string {
  const text = `${store.area || ''} ${store.address || ''} ${store.name || ''}`;
  if (/港島|中西區|灣仔|東區|南區|銅鑼灣|中環|上環|金鐘|西環|堅尼地城|鰂魚涌|太古|柴灣|北角|鴨脷洲|黃竹坑|西營盤|跑馬地/.test(text)) return '港島';
  if (/九龍|油尖旺|深水埗|黃大仙|觀塘|旺角|尖沙咀|油麻地|佐敦|太子|荔枝角|長沙灣|石硤尾|紅磡|土瓜灣|樂富|慈雲山|九龍灣|牛頭角|藍田|黃埔|九龍城|啟德|新蒲崗|美孚|九龍塘/.test(text)) return '九龍';
  return '新界';
}

function generateHomepageSEOContent(stores: Store[]): string {
  const regions: Record<string, Store[]> = { '港島': [], '九龍': [], '新界': [] };
  for (const s of stores) {
    const region = getStoreRegion(s);
    regions[region].push(s);
  }

  const regionLabels: Record<string, string> = { '港島': '港島', '九龍': '九龍', '新界': '新界' };

  let tablesHtml = '';
  for (const [region, regionStores] of Object.entries(regions)) {
    if (regionStores.length === 0) continue;
    const rows = regionStores
      .sort((a, b) => a.wait - b.wait)
      .map((s) => {
        const waitText = s.storeStatus === 'OPEN' ? `${s.wait} 分鐘` : '已收爐';
        return `      <tr>
        <td><a href="/store/${s.id}">${escapeHtml(s.name)}</a></td>
        <td>${escapeHtml(s.area)}</td>
        <td>${s.waitingGroup} 組</td>
        <td>${waitText}</td>
      </tr>`;
      }).join('\n');

    tablesHtml += `
    <h2>${regionLabels[region]}壽司郎即時排隊</h2>
    <table>
      <thead>
        <tr><th>分店</th><th>地區</th><th>輪候組數</th><th>預計等候</th></tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>\n`;
  }

  return `
    <noscript>
    <h1>香港壽司郎即時排隊及等候時間</h1>
    <p>即時查看香港壽司郎各分店排隊情況、籌號及預計等候時間。比較港九新界不同分店，出發前先睇邊間最快入座。</p>
    <h2>各分店即時等候時間</h2>
    <p>以下為香港壽司郎各分店最新排隊及等候資訊。資料會定期更新，你可以比較不同分店目前的等候時間，選擇較快可以入座的分店。</p>
${tablesHtml}
    <h2>邊間壽司郎最少人？</h2>
    <p>比較各分店即時等候時間，選擇最快可以入座的分店。按分店名稱查看即時籌號及輪候詳情。</p>
    <p><a href="/store/${stores.sort((a, b) => a.wait - b.wait)[0]?.id || 1}">查看等候時間最短的分店</a></p>
    </noscript>`;
}

function generateStoreHTML(baseHTML: string, store: Store): string {
  // Inject meta tags into <head>
  const title = `${store.name}｜壽司郎即時等候時間｜籌號 | 壽司郎 HK Live`;
  const description = `查看${store.name}壽司郎目前等候時間、即時籌號及排隊情況。${store.wait} 分鐘等候，${store.waitingGroup} 組輪候中。地址：${store.address}`;
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

  // Inject SEO content into homepage
  console.log('Injecting homepage SEO content...');
  const seoContent = generateHomepageSEOContent(stores);
  const updatedHomepage = baseHTML.replace(
    '<div id="root"></div>',
    `<div id="root">${seoContent}</div>`
  );
  writeFileSync(INDEX_HTML, updatedHomepage, 'utf-8');
  console.log('Homepage SEO content injected');

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
