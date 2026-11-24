const searchDialog = document.querySelector("#search-dialog");
const searchInput = document.querySelector("#search-input");
const searchStatus = document.querySelector("#search-status");
const searchResults = document.querySelector("#search-results");
const mobileNav = document.querySelector("#mobile-nav");

const basePath = document.documentElement.dataset.base || "/";
const siteBase = new URL(basePath, window.location.origin);
const indexUrl = new URL("search-index.json", siteBase);

let indexPromise;
let searchTimer;
let searchSequence = 0;
let composing = false;

function normalize(value) {
  return value.trim().replace(/\s+/gu, " ").toLowerCase();
}

function loadSearchIndex() {
  if (!indexPromise) {
    indexPromise = fetch(indexUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Search index unavailable");
        return response.json();
      })
      .then(({ pages }) =>
        pages.map((page) => ({
          ...page,
          searchTitle: normalize(page.title),
          searchSection: normalize(page.section || ""),
          blocks: page.blocks.map((block) => ({
            ...block,
            searchHeading: normalize(block.heading || ""),
            searchText: normalize(block.text),
          })),
        })),
      )
      .catch((error) => {
        indexPromise = undefined;
        throw error;
      });
  }
  return indexPromise;
}

function findMatches(pages, query, terms) {
  const matches = [];
  for (const page of pages) {
    const { searchTitle, searchSection, blocks } = page;
    const allTermsPresent = terms.every(
      (term) =>
        searchTitle.includes(term) ||
        searchSection.includes(term) ||
        blocks.some(
          ({ searchHeading, searchText }) =>
            searchHeading.includes(term) || searchText.includes(term),
        ),
    );
    if (!allTermsPresent) continue;

    let blockScore = 0;
    let bestBlock = null;
    for (const block of blocks) {
      const { searchHeading, searchText } = block;
      const score =
        (searchHeading.includes(query) ? 16 : 0) +
        (searchText.includes(query) ? 9 : 0) +
        terms.reduce(
          (sum, term) =>
            sum +
            (searchHeading.includes(term) ? 7 : 0) +
            (searchText.includes(term) ? 4 : 0),
          0,
        );
      if (score > blockScore) {
        blockScore = score;
        bestBlock = block;
      }
    }
    const titleScore =
      (searchTitle.includes(query) ? 32 : 0) +
      terms.filter((term) => searchTitle.includes(term)).length * 12;
    matches.push({ page, block: bestBlock, score: titleScore + blockScore });
  }
  return matches.sort((left, right) => right.score - left.score);
}

function highlightPattern(terms) {
  const escaped = [...terms]
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&"));
  return new RegExp(escaped.join("|"), "giu");
}

function appendHighlighted(element, value, terms) {
  let previous = 0;
  for (const match of value.matchAll(highlightPattern(terms))) {
    element.append(value.slice(previous, match.index));
    const marked = document.createElement("mark");
    marked.textContent = match[0];
    element.append(marked);
    previous = match.index + match[0].length;
  }
  element.append(value.slice(previous));
}

function snippetAroundMatch(text, terms) {
  const value = text.replace(/\s+/gu, " ").trim();
  const match = value.search(highlightPattern(terms));
  const start = Math.max(0, match - 30);
  const snippet = Array.from(value.slice(start)).slice(0, 135).join("");
  const left = start > 0 ? "…" : "";
  const right = start + snippet.length < value.length ? "…" : "";
  return left + snippet + right;
}

function resultFor({ page, block }, terms) {
  const linkUrl = new URL(page.url, siteBase);
  if (linkUrl.origin !== siteBase.origin || !linkUrl.pathname.startsWith(siteBase.pathname)) {
    return null;
  }
  if (block?.id) linkUrl.hash = encodeURIComponent(block.id);
  const item = document.createElement("li");
  const link = document.createElement("a");
  link.className = "search-result";
  link.href = linkUrl.href;

  const title = document.createElement("span");
  title.className = "search-result-title";
  appendHighlighted(title, page.title, terms);
  link.append(title);

  const context = document.createElement("span");
  context.className = "search-result-section";
  appendHighlighted(context, [page.section, block?.heading].filter(Boolean).join(" · "), terms);
  if (context.textContent) link.append(context);

  if (block?.text) {
    const snippet = document.createElement("span");
    snippet.className = "search-result-snippet";
    appendHighlighted(snippet, snippetAroundMatch(block.text, terms), terms);
    link.append(snippet);
  }
  item.append(link);
  return item;
}

async function runSearch(value, sequence) {
  const query = normalize(value);
  const terms = [...new Set(query.split(" "))];
  searchStatus.textContent = "正在读取搜索索引…";
  try {
    const pages = await loadSearchIndex();
    if (sequence !== searchSequence || !searchDialog.open) return;
    const matches = findMatches(pages, query, terms);
    const results = matches.map((match) => resultFor(match, terms)).filter(Boolean);
    searchResults.replaceChildren(...results);
    searchStatus.textContent = results.length
      ? "找到 " + results.length + " 篇相关内容"
      : "没有匹配的内容。试试其他关键词。";
  } catch {
    if (sequence !== searchSequence || !searchDialog.open) return;
    searchStatus.textContent = "搜索索引暂时无法加载。请重输关键词重试。";
  }
}

function queueSearch() {
  window.clearTimeout(searchTimer);
  const sequence = ++searchSequence;
  const value = searchInput.value;
  searchResults.replaceChildren();
  if (!value.trim()) {
    searchStatus.textContent = "输入关键词搜索章节正文和练习。";
    return;
  }
  searchStatus.textContent = "正在搜索…";
  searchTimer = window.setTimeout(() => runSearch(value, sequence), 110);
}

function openSearch() {
  if (searchDialog.open) return;
  if (mobileNav?.open) mobileNav.close();
  searchDialog.showModal();
  searchInput.focus();
  searchInput.select();
  if (searchInput.value.trim() && !searchResults.childElementCount) queueSearch();
}

function bindBackdrop(dialog) {
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog || event.detail === 0) return;
    const { left, right, top, bottom } = dialog.getBoundingClientRect();
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
      dialog.close();
    }
  });
}

if (searchDialog && searchInput && searchStatus && searchResults) {
  for (const button of document.querySelectorAll("[data-search-open]")) {
    button.addEventListener("click", openSearch);
  }
  searchDialog.querySelector("[data-search-close]")?.addEventListener("click", () => searchDialog.close());
  searchDialog.addEventListener("close", () => {
    window.clearTimeout(searchTimer);
    ++searchSequence;
  });
  searchInput.addEventListener("input", (event) => {
    if (!event.isComposing && !composing) queueSearch();
  });
  searchInput.addEventListener("compositionstart", () => {
    composing = true;
    window.clearTimeout(searchTimer);
    ++searchSequence;
    searchResults.replaceChildren();
  });
  searchInput.addEventListener("compositionend", () => {
    composing = false;
    queueSearch();
  });
  searchResults.addEventListener("click", (event) => {
    if (event.target.closest("a.search-result")) searchDialog.close();
  });
  searchDialog.addEventListener("keydown", (event) => {
    if (composing || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Escape") {
      event.preventDefault();
      searchDialog.close();
      return;
    }
    const results = [...searchResults.querySelectorAll("a.search-result")];
    if (!results.length) return;
    const active = document.activeElement;
    if (event.key === "Enter" && active === searchInput && !event.shiftKey) {
      event.preventDefault();
      results[0].click();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const current = results.indexOf(active);
    if (current < 0 && active !== searchInput) return;
    event.preventDefault();
    if (active === searchInput) {
      (event.key === "ArrowDown" ? results[0] : results.at(-1)).focus();
      return;
    }
    const next = current + (event.key === "ArrowDown" ? 1 : -1);
    (results[next] || searchInput).focus();
  });
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openSearch();
    }
  });
  bindBackdrop(searchDialog);
}

if (mobileNav) {
  for (const button of document.querySelectorAll("[data-nav-open]")) {
    button.addEventListener("click", () => {
      if (mobileNav.open || searchDialog?.open) return;
      mobileNav.showModal();
      mobileNav.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
    });
  }
  mobileNav.querySelector("[data-nav-close]")?.addEventListener("click", () => mobileNav.close());
  mobileNav.addEventListener("click", (event) => {
    if (event.target.closest("a[href]")) mobileNav.close();
  });
  bindBackdrop(mobileNav);
}

for (const button of document.querySelectorAll("[data-copy-link]")) {
  const label = button.querySelector("[data-copy-label]");
  if (!label) continue;
  const original = label.textContent;
  let restoreTimer;
  label.setAttribute("aria-live", "polite");
  button.addEventListener("click", async () => {
    window.clearTimeout(restoreTimer);
    try {
      await navigator.clipboard.writeText(window.location.href);
      label.textContent = "已复制";
    } catch {
      label.textContent = "请从地址栏复制";
    }
    restoreTimer = window.setTimeout(() => {
      label.textContent = original;
    }, 2200);
  });
}
