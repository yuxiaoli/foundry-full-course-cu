import { copyFile, lstat, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import hljs from 'highlight.js';
import registerSolidity from 'highlightjs-solidity';
import { parseHTML } from 'linkedom';
import MarkdownIt from 'markdown-it';
import { renderPage } from './template.mjs';

const site = await realpath(dirname(fileURLToPath(import.meta.url)));
const output = resolve(site, 'dist');
const book = resolve(site, '../notes/web3-basics');
const configuredBase = process.env.SITE_BASE_PATH ?? '/foundry-full-course-cu/';
const base = configuredBase.replace(/\/?$/, '/');
const origin = process.env.SITE_ORIGIN ?? 'https://yuxiaoli.github.io';
const canonicalOrigin = new URL(origin);

if (!/^(?:\/[a-z\d._-]+)*\/$/i.test(base) || /(?:^|\/)\.{1,2}\//.test(base)) {
  throw new Error('SITE_BASE_PATH must be "/" or a revision-stable path such as "/foundry-full-course-cu/".');
}
if (canonicalOrigin.origin !== origin || canonicalOrigin.protocol !== 'https:') {
  throw new Error('SITE_ORIGIN must be an HTTPS origin without a trailing slash.');
}

registerSolidity(hljs);
const markdown = new MarkdownIt({
  linkify: false,
  highlight(code, info) {
    const [language] = info.split(/\s+/);
    const value = hljs.getLanguage(language)
      ? hljs.highlight(code, { language, ignoreIllegals: true }).value
      : markdown.utils.escapeHtml(code);
    const cssClass = /^[a-z0-9_-]+$/i.test(language) ? ' language-' + language : '';
    return '<pre><code class="hljs' + cssClass + '">' + value + '</code></pre>';
  },
});

// Bilingual glossary labels end in full-width punctuation. Allow their
// closing delimiter before a Han word without changing Markdown or code spans.
markdown.inline.ruler.before('emphasis', 'bilingual_term', (state, silent) => {
  if (state.src.charCodeAt(state.pos) !== 0x2a) return false;
  const term = /^\*\*([\p{Script=Han}][\p{L}\p{N} -]*（[A-Za-z][A-Za-z0-9 ,_-]*）)\*\*/u
    .exec(state.src.slice(state.pos, state.posMax));
  if (!term) return false;
  if (!silent) {
    state.push('strong_open', 'strong', 1);
    state.push('text', '', 0).content = term[1];
    state.push('strong_close', 'strong', -1);
  }
  state.pos += term[0].length;
  return true;
});

function readBook(path) {
  return readFile(join(book, path), 'utf8');
}

function makeGroups(index) {
  const groups = [];
  let current;
  for (const line of index.split(/\r?\n/)) {
    if (line.startsWith('## ')) {
      current = { title: line.slice(3), chapters: [] };
      groups.push(current);
    }
    const row = /^- \[(\d{2}) · ([^\]]+)\]\(\.\/([a-z\d-]+\/[a-z\d-]+\.md)\)$/.exec(line);
    if (row) {
      const [, number, title, file] = row;
      if (!current) throw new Error('Chapter ' + number + ' must belong to a group.');
      const folder = file.slice(0, -3) + '/';
      current.chapters.push({
        kind: 'chapter', title, number, file, folder, url: base + folder, section: current.title,
      });
    }
  }
  return groups.filter(({ chapters }) => chapters.length);
}

const index = await readBook('README.md');
const groups = makeGroups(index);
const chapters = groups.flatMap(group => group.chapters);
const expectedNumbers = Array.from({ length: 26 }, (_, i) => String(i + 1).padStart(2, '0')).join(',');
if (groups.length !== 5 || chapters.map(row => row.number).join(',') !== expectedNumbers
    || groups[4].chapters[0].number !== '22') {
  throw new Error('The index must list 21 main chapters and five optional chapters in learning order.');
}
const pages = [
  { kind: 'home', file: 'README.md', folder: '', url: base, section: '阅读索引' },
  ...chapters,
  { kind: 'reference', file: 'figures/README.md', folder: 'figures/', url: base + 'figures/', section: '资料与核查' },
  { kind: 'reference', file: 'VALIDATION.md', folder: 'validation/', url: base + 'validation/', section: '资料与核查' },
];
const pageByFile = new Map(pages.map(page => [page.file, page]));
if (pageByFile.size !== pages.length) throw new Error('Duplicate page in the Markdown index.');

const figureByFile = new Map();
for (const number of expectedNumbers.split(',')) {
  const file = 'figures/' + number + '.svg';
  const svg = await readBook(file);
  const tag = /<svg\b[^>]+>/i.exec(svg)?.[0] ?? '';
  const viewBox = /\bviewBox="0 0 (\d+) (\d+)"/.exec(tag);
  if (!viewBox || /<script\b|\bon[a-z]+\s*=|\bhref\s*=\s*["'](?!#)/i.test(svg)) {
    throw new Error('Unsafe or unsupported SVG: ' + file);
  }
  figureByFile.set(file, { url: base + file, width: viewBox[1], height: viewBox[2] });
}

function toFragment(text) {
  return text.normalize('NFKC').toLowerCase().trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/[\s-]+/gu, '-');
}

function annotateHeadings(article, anchors) {
  const used = new Set();
  const toc = [];
  for (const heading of article.querySelectorAll('h2, h3, h4, h5, h6')) {
    const title = heading.textContent;
    const stub = anchors.get(title) ?? toFragment(title) ?? 'section';
    let id = stub || 'section';
    let suffix = 2;
    while (used.has(id)) id = stub + '-' + suffix++;
    used.add(id);
    heading.id = id;
    const level = Number(heading.tagName.slice(1));
    if (level < 4) toc.push({ id, title, level });
  }
  return toc;
}

function attachHeadingLinks(article) {
  for (const heading of article.querySelectorAll('h2[id], h3[id], h4[id], h5[id], h6[id]')) {
    const link = article.ownerDocument.createElement('a');
    link.className = 'heading-anchor';
    link.href = '#' + encodeURIComponent(heading.id);
    link.setAttribute('aria-label', '链接到“' + heading.textContent + '”');
    link.textContent = '#';
    heading.append(' ', link);
  }
}

function addAnswer(item, filename) {
  const document = item.ownerDocument;
  const paragraph = [...item.children].find(element => element.tagName === 'P') ?? item;
  const nodes = [...paragraph.childNodes];
  let following;
  const explicit = nodes.findIndex(node => node.nodeName === 'STRONG' && /^(核对|答案)$/.test(node.textContent));
  if (explicit >= 0) {
    following = nodes.slice(explicit + 1);
    if (nodes[explicit - 2]?.nodeName === 'BR' && !nodes[explicit - 1].textContent.trim()) {
      nodes[explicit - 2].remove();
    }
    if (nodes[explicit - 1]?.nodeName === 'BR') nodes[explicit - 1].remove();
    nodes[explicit].remove();
  } else {
    const inline = nodes.findIndex(node => node.nodeType === 3 && node.textContent.includes('核对：'));
    if (inline >= 0) {
      const marker = '核对：';
      const value = nodes[inline].textContent;
      const boundary = value.indexOf(marker);
      nodes[inline].textContent = value.slice(0, boundary);
      following = [document.createTextNode(value.slice(boundary + marker.length)), ...nodes.slice(inline + 1)];
    } else {
      const question = nodes.findIndex(node => node.nodeType !== 3 || node.textContent.trim());
      if (nodes[question]?.nodeName !== 'STRONG') {
        throw new Error('Could not locate exercise answer in ' + filename + ': ' + item.textContent.trim());
      }
      following = nodes.slice(question + 1);
    }
  }
  if (following[0]?.nodeType === 3) following[0].textContent = following[0].textContent.trimStart();
  if (!following.some(node => node.textContent.trim())) {
    throw new Error('Empty exercise answer in ' + filename);
  }
  const details = document.createElement('details');
  details.className = 'answer';
  const summary = document.createElement('summary');
  summary.textContent = '查看答案';
  const answer = document.createElement('div');
  answer.className = 'answer-content';
  answer.append(...following);
  details.append(summary, answer);
  item.append(details);
}

function foldExercises(article, page) {
  if (page.kind !== 'chapter') return 0;
  const heading = [...article.children].find(element => element.textContent === '练习与核对');
  if (!heading) throw new Error('Missing exercises in ' + page.file);
  let exercises = 0;
  for (let element = heading.nextElementSibling; element && element.tagName !== 'H2'; element = element.nextElementSibling) {
    if (element.tagName !== 'OL') continue;
    for (const item of element.children) {
      addAnswer(item, page.file);
      exercises++;
    }
  }
  return exercises;
}

function noteCitation(link, reference, hash) {
  const citation = link.ownerDocument.createElement('span');
  citation.className = 'local-citation';
  citation.title = '仓库资料 · ' + reference + hash;
  citation.append(...link.childNodes);
  link.replaceWith(citation);
}

function rewriteLinks(article, page) {
  for (const element of article.querySelectorAll('a[href], img[src]')) {
    const attribute = element.tagName === 'IMG' ? 'src' : 'href';
    const value = element.getAttribute(attribute);
    if (!value) continue;
    if (/^https?:\/\//i.test(value) && attribute === 'href') continue;
    if (value.startsWith('#') && attribute === 'href') continue;
    if (value.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(value)) {
      throw new Error('Unexpected link in ' + page.file + ': ' + value);
    }
    const [path, ...fragment] = value.split('#');
    const hash = fragment.length ? '#' + fragment.join('#') : '';
    const target = posix.normalize(posix.join(posix.dirname(page.file), decodeURIComponent(path)));
    const asset = figureByFile.get(target);
    if (attribute === 'src') {
      if (!asset) throw new Error('Image is outside the published figures in ' + page.file + ': ' + target);
      element.setAttribute('src', asset.url);
      element.setAttribute('width', asset.width);
      element.setAttribute('height', asset.height);
      element.setAttribute('loading', 'lazy');
      element.setAttribute('decoding', 'async');
      continue;
    }
    const targetUrl = pageByFile.get(target)?.url ?? asset?.url;
    if (targetUrl) {
      element.setAttribute('href', targetUrl + hash);
      continue;
    }
    if (/^\.\.\/\.\.\/(?:refs|planning)\//.test(target) || target === 'PROGRESS.md') {
      const reference = target === 'PROGRESS.md' ? 'notes/web3-basics/PROGRESS.md' : target.slice(6);
      noteCitation(element, reference, hash);
      continue;
    }
    throw new Error('Unmapped link in ' + page.file + ': ' + value);
  }
}

function annotateFigures(article) {
  const document = article.ownerDocument;
  for (const image of article.querySelectorAll('p > img')) {
    const paragraph = image.parentElement;
    const caption = paragraph.nextElementSibling;
    if (caption?.tagName !== 'P' || !/^图\s*\d{2}/.test(caption.textContent.trim())) {
      throw new Error('Figure caption missing for ' + image.getAttribute('src'));
    }
    const figure = document.createElement('figure');
    const original = document.createElement('a');
    original.className = 'figure-original';
    original.href = image.getAttribute('src');
    original.setAttribute('aria-label', '查看原图 · ' + image.getAttribute('alt'));
    const figcaption = document.createElement('figcaption');
    figcaption.append(...caption.childNodes);
    original.append(image);
    figure.append(original, figcaption);
    paragraph.replaceWith(figure);
    caption.remove();
  }
}

function wrapTables(article) {
  for (const table of article.querySelectorAll('table')) {
    const container = article.ownerDocument.createElement('div');
    container.className = 'table-scroll';
    container.setAttribute('tabindex', '0');
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', '数据表格');
    table.replaceWith(container);
    container.append(table);
  }
}

function textForSearch(node) {
  return node.textContent.replace(/\s+/gu, ' ').trim();
}

function searchBlocks(article, title) {
  const blocks = [{ heading: title, id: '', parts: [] }];
  for (const node of article.children) {
    if (/^H[2-6]$/.test(node.tagName)) {
      blocks.push({ heading: node.textContent, id: node.id, parts: [] });
    } else {
      const text = textForSearch(node);
      if (text) blocks.at(-1).parts.push(text);
    }
  }
  return blocks.map(({ heading, id, parts }) => ({ heading, id, text: parts.join(' ') }));
}

async function compile(page) {
  const anchors = new Map();
  const input = (await readBook(page.file)).replace(
    /^<a id="([a-z\d-]+)"><\/a>\s*\r?\n(?=#{2,6} (.+)$)/gim,
    (_, id, heading) => {
      anchors.set(heading.trim(), id);
      return '';
    },
  );
  const { document } = parseHTML('<html><body><article>' + markdown.render(input) + '</article></body></html>');
  const article = document.querySelector('article');
  const heading = article.querySelector('h1');
  if (!heading || page.kind === 'chapter' && heading.textContent !== '第 ' + page.number + ' 章 · ' + page.title) {
    throw new Error('Unexpected chapter title in ' + page.file);
  }
  page.title ??= heading.textContent;
  heading.remove();
  const exercises = foldExercises(article, page);
  const toc = annotateHeadings(article, anchors);
  rewriteLinks(article, page);
  annotateFigures(article);
  wrapTables(article);
  const blocks = searchBlocks(article, page.title);
  attachHeadingLinks(article);
  return { page, toc, content: article.innerHTML, exercises, blocks };
}

const compiled = await Promise.all(pages.map(compile));
const exerciseCount = compiled.reduce((sum, item) => sum + item.exercises, 0);
if (exerciseCount !== 79) throw new Error('Expected 79 exercises, found ' + exerciseCount);

const existingOutput = await lstat(output).catch(error => {
  if (error.code !== 'ENOENT') throw error;
});
if (existingOutput) {
  if (!existingOutput.isDirectory() || await realpath(output) !== output) {
    throw new Error('The output location must be the site/dist directory.');
  }
  await rm(output, { recursive: true, force: true });
}
await mkdir(join(output, 'assets'), { recursive: true });
await mkdir(join(output, 'figures'), { recursive: true });
for (const asset of ['style.css', 'app.js', 'favicon.svg']) {
  await copyFile(join(site, 'assets', asset), join(output, 'assets', asset));
}
for (const file of figureByFile.keys()) {
  await copyFile(join(book, file), join(output, file));
}
for (const { page, toc, content } of compiled) {
  const number = chapters.indexOf(page);
  const previous = number > 0 ? chapters[number - 1] : undefined;
  const next = page.kind === 'home' ? chapters[0] : number >= 0 ? chapters[number + 1] : undefined;
  const canonical = new URL(page.url, canonicalOrigin).href;
  const html = renderPage({ base, page, groups, toc, content, previous, next, canonical });
  const dir = join(output, page.folder);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), html, 'utf8');
}
await writeFile(join(output, 'search-index.json'), JSON.stringify({
  pages: compiled.map(({ page, blocks }) => ({
    title: page.title, url: page.url, section: page.section, blocks,
  })),
}), 'utf8');
await writeFile(join(output, '.nojekyll'), '');
console.log('Built ' + chapters.length + ' chapters, ' + exerciseCount + ' answers and ' + figureByFile.size + ' figures for ' + base + '.');
