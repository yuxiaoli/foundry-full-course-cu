import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';

const folder = dirname(fileURLToPath(import.meta.url));
const dist = join(folder, 'dist');
const index = JSON.parse(await readFile(join(dist, 'search-index.json'), 'utf8'));
const base = index.pages[0].url;
const docs = new Map();

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
  const navigation = document.querySelectorAll('.chapter-nav');
  assert(navigation.length, 'Sidebar missing: ' + page.url);
  for (const nav of navigation) {
    assert.equal(nav.querySelectorAll('a.chapter-link').length, 26, 'Sidebar: ' + page.url);
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

const chapters = [...docs.keys()].filter(url => /\/\d{2}-[^/]+\/\d{2}-[^/]+\/$/.test(url));
assert.equal(chapters.length, 26);
assert.equal(docs.size, 29);
let answers = 0;
let highlightedBlocks = 0;
let tables = 0;
for (const [i, url] of chapters.entries()) {
  const page = docs.get(url);
  const num = String(i + 1).padStart(2, '0');
  const prose = page.querySelector('.article-body').cloneNode(true);
  for (const code of prose.querySelectorAll('code')) code.remove();
  assert(!/\*\*[^*\r\n]{2,160}\*\*/u.test(prose.textContent), 'Unrendered Markdown emphasis: ' + url);

  assert(page.querySelector('h1').textContent.startsWith('第 ' + num + ' 章 ·'), 'Order: ' + url);
  assert.equal(page.querySelector('.chapter-link[aria-current=page]').getAttribute('href'), url);
  assert.equal(page.querySelector('.pager-prev')?.getAttribute('href'), chapters[i - 1]);
  assert.equal(page.querySelector('.pager-next')?.getAttribute('href'), chapters[i + 1]);
  const figure = page.querySelector('.article-body figure');
  assert.equal(page.querySelectorAll('.article-body figure').length, 1);
  assert.equal(figure.querySelector('img').getAttribute('src'), base + 'figures/' + num + '.svg');
  assert(figure.querySelector('img').getAttribute('alt').trim());
  assert(figure.querySelector('figcaption').textContent.trim().startsWith('图 ' + num));
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
assert.equal(answers, 79);
assert(tables > 20 && highlightedBlocks > 0, 'Tables and syntax highlighting must survive the build.');
const access = docs.get(chapters[3]).getElementById('04-2-chain-access-and-governance');
assert(access?.textContent.includes('公链、私有链与联盟链'));
assert(index.pages.at(4).blocks.some(block => block.id === access.id && block.text.includes('白名单')));

let links = 0;
const origin = 'https://site.test';
const available = new Set([
  '.nojekyll', 'assets/app.js', 'assets/style.css', 'assets/favicon.svg', 'search-index.json',
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
console.log('Checked 26 chapter routes, 79 answers, 26 original figures, ' + links + ' site links and the output allowlist.');
