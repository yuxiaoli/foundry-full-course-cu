function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function icon(name) {
  const paths = {
    brand: '<path d="M12 2.8 21.2 8v8L12 21.2 2.8 16V8Z"/><path d="m3 8 9 5 9-5m-9 5v8m0-13.9L7.5 9.5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.2"/><path d="m15.2 15.2 4.5 4.5"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    right: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    left: '<path d="M20 12H5m6 6-6-6 6-6"/>',
    link: '<path d="M10 7.5h-2a4.5 4.5 0 0 0 0 9h2m4-9h2a4.5 4.5 0 0 1 0 9h-2M8 12h8"/>',
    external: '<path d="M13 5h6v6m0-6-9 9m7 0v5H5V7h5"/>',
  };
  return `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
}

function chapterNav(base, page, groups) {
  return `<nav class="chapter-nav" aria-label="全书目录">
    <a class="sidebar-home" href="${escapeHtml(base)}"${page.kind === "home" ? ' aria-current="page"' : ""}>全书目录</a>
    ${groups.map((group) => `<section class="nav-group">
      <h2 class="nav-group-title">${escapeHtml(group.title)}</h2>
      <ol class="nav-list">
        ${group.chapters.map((chapter) => `<li><a class="chapter-link" href="${escapeHtml(chapter.url)}"${chapter.url === page.url ? ' aria-current="page"' : ""}>
          <span class="chapter-number">${escapeHtml(chapter.number)}</span>
          <span class="chapter-label">${escapeHtml(chapter.title)}</span>
        </a></li>`).join("")}
      </ol>
    </section>`).join("")}
  </nav>`;
}

function tocList(toc) {
  return `<ol class="toc-list">${toc.map(({ id, level, title }) =>
    `<li class="toc-level-${Number(level)}"><a href="#${escapeHtml(id)}">${escapeHtml(title)}</a></li>`).join("")}</ol>`;
}

function chapterPager(previous, next) {
  function pagerLink(page, direction, label) {
    if (!page) return "";
    return `<a class="pager-link pager-${direction}" href="${escapeHtml(page.url)}" rel="${direction}">
      <span class="pager-direction">${icon(direction === "prev" ? "left" : "right")} ${label}</span>
      <span class="pager-title">${escapeHtml(page.number)} · ${escapeHtml(page.title)}</span>
    </a>`;
  }
  if (!previous && !next) return "";
  return `<nav class="page-navigation" aria-label="顺序阅读">
    ${pagerLink(previous, "prev", "上一章")}${pagerLink(next, "next", "下一章")}
  </nav>`;
}

export function renderPage({ base, bookTitle, page, groups, toc, content, previous, next, canonical }) {
  const isHome = page.kind === "home";
  const isChapter = page.kind === "chapter";
  const heading = isChapter ? `第 ${page.number} 章 · ${page.title}` : page.title;
  const first = groups[0]?.chapters[0];
  const title = isHome ? heading : `${heading}｜${bookTitle}`;
  const description = isHome
    ? "从比特币与共享账本学起，读懂以太坊交易、智能合约、链上资产与治理。"
    : `${heading}，《${bookTitle}》简体中文版。`;
  const nav = isHome ? "" : chapterNav(base, page, groups);
  const sectionLinks = tocList(toc);
  return `<!doctype html>
<html lang="zh-CN" data-base="${escapeHtml(base)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#0a1114">
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <title>${escapeHtml(title)}</title>
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" type="image/svg+xml" href="${escapeHtml(base)}assets/favicon.svg">
  <link rel="stylesheet" href="${escapeHtml(base)}assets/style.css">
  <script src="${escapeHtml(base)}assets/app.js" defer></script>
</head>
<body class="site-page page-${escapeHtml(page.kind)}">
  <a class="skip-link" href="#main-content">跳到正文</a>
  <header class="topbar">
    <div class="topbar-inner">
      <a class="brand" href="${escapeHtml(base)}"><span class="brand-icon">${icon("brand")}</span><span class="brand-text">${escapeHtml(bookTitle)}</span></a>
      <div class="top-actions">
        ${!isHome ? `<button type="button" class="nav-toggle" data-nav-open aria-controls="mobile-nav" aria-haspopup="dialog">${icon("menu")} <span>目录</span></button>` : ""}
        <button type="button" class="search-toggle" data-search-open aria-controls="search-dialog" aria-haspopup="dialog">${icon("search")} <span>搜索</span></button>
      </div>
    </div>
  </header>
  <div class="site-shell">
    ${!isHome ? `<aside class="site-sidebar" id="site-sidebar">${nav}</aside>` : ""}
    <main class="main-content" id="main-content" tabindex="-1">
      ${isHome ? `<header class="home-hero">
        <h1>${escapeHtml(heading)}</h1>
        <div class="hero-actions">${first ? `<a href="${escapeHtml(first.url)}">从第一章开始 ${icon("right")}</a>` : ""}</div>
      </header>` : `<header class="page-header">
        <div class="breadcrumb"><span>${escapeHtml(page.section)}</span></div>
        <h1>${escapeHtml(heading)}</h1>
        ${isChapter ? `<button type="button" class="copy-link" data-copy-link>${icon("link")} <span data-copy-label>复制链接</span></button>` : ""}
      </header>`}
      ${toc.length ? `<details class="inline-toc"><summary>本页目录</summary><nav aria-label="本页目录">${sectionLinks}</nav></details>` : ""}
      <article class="article-body">${content}</article>
      ${chapterPager(previous, next)}
      <footer class="site-footer"><span>Written by <a href="https://s.vectorindex.cloud/sean">Sean</a> with ❤️</span></footer>
    </main>
    ${toc.length ? `<aside class="page-toc"><nav class="toc-inner" aria-label="本页目录"><h2 class="toc-title">本页目录</h2>${sectionLinks}</nav></aside>` : ""}
  </div>
  ${!isHome ? `<dialog id="mobile-nav" class="mobile-nav" aria-labelledby="mobile-nav-title">
    <div class="mobile-nav-header"><h2 id="mobile-nav-title">阅读目录</h2><button type="button" class="dialog-close" data-nav-close aria-label="关闭目录">${icon("close")}</button></div>
    ${nav}
  </dialog>` : ""}
  <dialog id="search-dialog" class="search-dialog" aria-labelledby="search-title">
    <div class="search-header"><h2 id="search-title">全文搜索</h2><button type="button" class="dialog-close" data-search-close aria-label="关闭搜索">${icon("close")}</button></div>
    <label for="search-input">关键词</label>
    <input id="search-input" class="search-input" type="search" autocomplete="off" placeholder="例如：区块、nonce、时间锁">
    <p id="search-status" class="search-status" role="status">输入关键词开始搜索。</p>
    <ol id="search-results" class="search-results"></ol>
  </dialog>
</body>
</html>`;
}
