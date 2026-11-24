import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';

const folder = dirname(fileURLToPath(import.meta.url));
const dist = join(folder, 'dist');
const index = JSON.parse(await readFile(join(dist, 'search-index.json'), 'utf8'));
const base = index.pages[0].url;
const bookTitle = 'Web3 学习笔记';
assert.equal(index.pages[0].title, bookTitle, 'Search index homepage title');
const docs = new Map();
const chapterCount = 29;
const privateText = /资料与核查|配图索引与出处|验收记录|写作进度|原规划|逐章来源映射|(?:^|[/'"\s])(?:refs\/|planning\/|PROGRESS\.md|VALIDATION\.md|source-map\.md)/u;

function outputPath(url) {
  assert(url.startsWith(base), 'Local URL must stay inside the Pages project: ' + url);
  const path = decodeURIComponent(url.slice(base.length));
  assert(!path.split('/').includes('..'), 'Unexpected parent directory: ' + url);
  return path.endsWith('/') || !path ? path + 'index.html' : path;
}

for (const page of index.pages) {
  assert(!docs.has(page.url), 'Duplicate search page: ' + page.url);
  const html = await readFile(join(dist, outputPath(page.url)), 'utf8');
  const { document } = parseHTML(html);
  docs.set(page.url, document);
  assert.equal(document.documentElement.getAttribute('lang'), 'zh-CN');
  assert.equal(document.querySelectorAll('h1').length, 1, 'One page heading: ' + page.url);
  const heading = document.querySelector('h1').textContent;
  const title = page.url === base ? bookTitle : heading + '｜' + bookTitle;
  assert.equal(document.querySelector('.brand-text').textContent, bookTitle);
  assert.equal(document.title, title);
  assert.equal(document.querySelector('meta[property="og:title"]').getAttribute('content'), title);
  if (page.url === base) assert.equal(heading, bookTitle);
  else assert(document.querySelector('meta[name="description"]').getAttribute('content').includes(bookTitle));
  assert(!privateText.test(html), 'Internal material leaked into generated HTML: ' + page.url);
  const footer = document.querySelector('.site-footer');
  assert.equal(footer.textContent.trim(), 'Written by Sean with ❤️');
  assert.equal(footer.querySelectorAll('a').length, 1);
  assert.equal(footer.querySelector('a').getAttribute('href'), 'https://s.vectorindex.cloud/sean');
  const navigation = document.querySelectorAll('.chapter-nav');
  if (page.url === base) {
    assert.equal(navigation.length, 0, 'The homepage itself is the single book index');
    assert.equal(document.querySelectorAll('article a[href]').length, chapterCount + document.querySelectorAll('article a.heading-anchor').length);
  } else {
    assert(navigation.length, 'Sidebar missing: ' + page.url);
    for (const nav of navigation) {
      assert.equal(nav.querySelectorAll('a.chapter-link').length, chapterCount, 'Sidebar: ' + page.url);
    }
  }
  const canon = new URL(document.querySelector('link[rel=canonical]').getAttribute('href'));
  assert.equal(canon.pathname, page.url, 'Canonical: ' + page.url);
  const headings = new Set();
  for (const item of document.querySelectorAll('[id]')) {
    assert(!headings.has(item.id), 'Duplicate ID ' + item.id + ' in ' + page.url);
    headings.add(item.id);
  }
  for (const block of page.blocks) {
    assert(block.heading && typeof block.text === 'string', 'Malformed search block: ' + page.url);
    if (block.id) assert(document.getElementById(block.id), 'Missing search anchor: ' + block.id);
  }
}

const chapters = [...docs.keys()].filter(url => /\/\d{2}-[^/]+\/\d{2}[a-z]?-[^/]+\/$/.test(url));
assert.equal(chapters.length, chapterCount);
assert.equal(docs.size, chapterCount + 1);
assert(!privateText.test(JSON.stringify(index)), 'Internal material leaked into search');
let answers = 0;
let highlightedBlocks = 0;
let tables = 0;
for (const [i, url] of chapters.entries()) {
  const page = docs.get(url);
  const num = /\/(\d{2}[a-z]?)-[^/]+\/$/.exec(url)[1].toUpperCase();
  const prose = page.querySelector('.article-body').cloneNode(true);
  for (const code of prose.querySelectorAll('code')) code.remove();
  assert(!/\*\*[^*\r\n]{2,160}\*\*/u.test(prose.textContent), 'Unrendered Markdown emphasis: ' + url);

  assert(page.querySelector('h1').textContent.startsWith('第 ' + num + ' 章 ·'), 'Order: ' + url);
  assert.equal(page.querySelector('.chapter-link[aria-current=page]').getAttribute('href'), url);
  assert.equal(page.querySelector('.pager-prev')?.getAttribute('href'), chapters[i - 1]);
  assert.equal(page.querySelector('.pager-next')?.getAttribute('href'), chapters[i + 1]);
  const figure = page.querySelector('.article-body figure');
  const hasOriginalFigure = !['00', '02A', '14A'].includes(num);
  assert.equal(page.querySelectorAll('.article-body figure').length, hasOriginalFigure ? 1 : 0);
  if (hasOriginalFigure) {
    assert.equal(figure.querySelector('img').getAttribute('src'), base + 'figures/' + num + '.svg');
    assert(figure.querySelector('img').getAttribute('alt').trim());
    assert(figure.querySelector('figcaption').textContent.trim().startsWith('图 ' + num));
  }
  const details = page.querySelectorAll('.article-body details.answer');
  assert(details.length >= 2, 'Missing exercise list: ' + url);
  for (const answer of details) {
    assert(!answer.hasAttribute('open'), 'Answer should start closed in ' + url);
    assert.equal(answer.firstElementChild.tagName, 'SUMMARY');
    assert(answer.querySelector('.answer-content').textContent.trim());
  }
  answers += details.length;
  tables += page.querySelectorAll('.table-scroll > table').length;
  highlightedBlocks += page.querySelectorAll('pre > code.hljs > [class^=hljs-]').length;
}
assert.equal(answers, 88);
assert(tables > 20 && highlightedBlocks > 0, 'Tables and syntax highlighting must survive the build.');
const findChapter = slug => chapters.find(url => url.endsWith('/' + slug + '/'));
const accessUrl = findChapter('04-blocks-and-consensus');
const access = docs.get(accessUrl).getElementById('04-2-chain-access-and-governance');
assert(access?.textContent.includes('公链、私有链与联盟链'));
assert(index.pages.find(page => page.url === accessUrl).blocks.some(block => block.id === access.id && block.text.includes('白名单')));
const bitcoin = docs.get(findChapter('00-bitcoin-and-double-spending'));
assert(bitcoin.querySelector('article a[href="https://bitcoin.org/bitcoin.pdf"]'));
for (const [slug, term] of [['00-bitcoin-and-double-spending', 'UTXO'], ['02a-hashes-and-merkle-proofs', 'Merkle 根'], ['14a-coins-tokens-and-stablecoins', '脱锚']]) {
  const url = findChapter(slug);
  assert(docs.get(url).querySelector('article').textContent.includes(term));
  assert(index.pages.find(page => page.url === url).blocks.some(block => block.text.includes(term)));
}
const nftUrl = findChapter('16-nft-ownership-and-metadata');
const nft = docs.get(nftUrl);
assert(nft.querySelector('article a[href="https://eips.ethereum.org/EIPS/eip-721"]'));
assert(nft.querySelector('article a[href="https://eips.ethereum.org/EIPS/eip-1155"]'));
for (const term of ['ERC-1155', 'tokenURI', '版权', 'TransferBatch']) {
  assert(nft.querySelector('article').textContent.includes(term));
  assert(index.pages.find(page => page.url === nftUrl).blocks.some(block => block.text.includes(term)));
}
const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
assert(!privateText.test(sitemap));
assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname), [...docs.keys()]);

let links = 0;
const origin = 'https://site.test';
const available = new Set([
  '.nojekyll', 'assets/app.js', 'assets/style.css', 'assets/favicon.svg', 'search-index.json', 'sitemap.xml',
]);
for (const url of docs.keys()) available.add(outputPath(url));
for (let i = 1; i <= 26; i++) {
  const path = 'figures/' + String(i).padStart(2, '0') + '.svg';
  available.add(path);
  const original = await readFile(join(folder, '../notes/web3-basics', path));
  const served = await readFile(join(dist, path));
  assert(original.equals(served), 'Original figure differs from published figure: ' + path);
}
for (const [url, page] of docs) {
  for (const element of page.querySelectorAll('[href], [src]')) {
    const link = element.getAttribute('href') ?? element.getAttribute('src');
    if (!link || /^https?:\/\//i.test(link)) continue;
    assert(link.startsWith('#') || link.startsWith(base), 'Link missing Pages base: ' + link);
    const target = new URL(link, origin + url);
    assert(available.has(outputPath(target.pathname)), 'Missing target for ' + url + ': ' + link);
    if (target.hash && docs.has(target.pathname)) {
      assert(docs.get(target.pathname).getElementById(decodeURIComponent(target.hash.slice(1))), 'Missing fragment: ' + url + ' ' + link);
    }
    links++;
  }
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => {
    const file = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(file) : [relative(dist, file).replaceAll('\\', '/')];
  }))).flat();
}
assert.deepEqual((await listFiles(dist)).sort(), [...available].sort(), 'Only allowlisted book pages, figures, and site assets may be published.');
console.log('Checked 29 chapter routes, 88 answers, 26 original figures, ' + links + ' site links, sitemap, search and the publication allowlist.');
