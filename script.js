const API_URL = 'https://graphql.anilist.co';
const CATALOG_CAPACITY = 100000;
const PAGE_SIZE = 24;
const CACHE_TTL = 5 * 60 * 1000;
const SAVED_KEY = 'wa06-saved-v4';
const GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'];

const CATALOG_QUERY = `query ($page: Int, $perPage: Int, $search: String, $genre: String, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { currentPage hasNextPage }
    media(type: ANIME, isAdult: false, search: $search, genre: $genre, sort: $sort) {
      id title { romaji english } coverImage { large extraLarge }
      averageScore genres episodes format seasonYear
    }
  }
}`;

const DETAIL_QUERY = `query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id title { romaji english } coverImage { large extraLarge } bannerImage
    description(asHtml: false) averageScore genres episodes format seasonYear
    trailer { id site } externalLinks { site url type }
  }
}`;

const starterRows = [
  [16498, 'Attack on Titan', 2013, 25, ['Action', 'Drama', 'Fantasy'], '10/47347.jpg'],
  [1535, 'Death Note', 2006, 37, ['Mystery', 'Psychological', 'Thriller'], '9/9453.jpg'],
  [5114, 'Fullmetal Alchemist: Brotherhood', 2009, 64, ['Action', 'Adventure', 'Fantasy'], '1223/96541.jpg'],
  [21, 'One Piece', 1999, null, ['Action', 'Adventure', 'Comedy'], '6/73245.jpg'],
  [20, 'Naruto', 2002, 220, ['Action', 'Adventure'], '13/17405.jpg'],
  [1735, 'Naruto: Shippuden', 2007, 500, ['Action', 'Adventure'], '5/17407.jpg'],
  [113415, 'Jujutsu Kaisen', 2020, 24, ['Action', 'Drama', 'Supernatural'], '1171/109222.jpg'],
  [101922, 'Demon Slayer: Kimetsu no Yaiba', 2019, 26, ['Action', 'Adventure', 'Fantasy'], '1286/99889.jpg'],
  [127230, 'Chainsaw Man', 2022, 12, ['Action', 'Horror', 'Supernatural'], '1806/126216.jpg'],
  [11061, 'Hunter x Hunter', 2011, 148, ['Action', 'Adventure', 'Fantasy'], '1337/99013.jpg'],
  [21087, 'One Punch Man', 2015, 12, ['Action', 'Comedy', 'Sci-Fi'], '12/76049.jpg'],
  [21507, 'Mob Psycho 100', 2016, 12, ['Action', 'Comedy', 'Supernatural'], '8/80356.jpg'],
  [140960, 'Spy x Family', 2022, 12, ['Action', 'Comedy'], '1441/122795.jpg'],
  [21459, 'My Hero Academia', 2016, 13, ['Action', 'Adventure'], '10/78745.jpg'],
  [105333, 'Dr. Stone', 2019, 24, ['Adventure', 'Comedy', 'Sci-Fi'], '1613/102576.jpg'],
  [20464, 'Haikyu!!', 2014, 25, ['Comedy', 'Drama', 'Sports'], '7/76014.jpg'],
  [97940, 'Black Clover', 2017, 170, ['Action', 'Adventure', 'Fantasy'], '2/88336.jpg'],
  [101348, 'Vinland Saga', 2019, 24, ['Action', 'Adventure', 'Drama'], '1500/103005.jpg'],
  [9253, 'Steins;Gate', 2011, 24, ['Drama', 'Sci-Fi', 'Thriller'], '5/73199.jpg'],
  [1, 'Cowboy Bebop', 1998, 26, ['Action', 'Adventure', 'Sci-Fi'], '4/19644.jpg'],
  [21827, 'Violet Evergarden', 2018, 13, ['Drama', 'Fantasy', 'Slice of Life'], '1795/95088.jpg'],
  [20605, 'Tokyo Ghoul', 2014, 12, ['Action', 'Horror', 'Supernatural'], '5/64449.jpg'],
  [11757, 'Sword Art Online', 2012, 25, ['Action', 'Adventure', 'Fantasy'], '11/39717.jpg'],
  [269, 'Bleach', 2004, 366, ['Action', 'Adventure', 'Supernatural'], '3/40451.jpg'],
  [813, 'Dragon Ball Z', 1989, 291, ['Action', 'Adventure'], '6/20936.jpg'],
  [21519, 'Your Name.', 2016, 1, ['Drama', 'Romance', 'Supernatural'], '5/87048.jpg', 'MOVIE'],
  [199, 'Spirited Away', 2001, 1, ['Adventure', 'Fantasy'], '6/79597.jpg', 'MOVIE'],
  [20954, 'A Silent Voice', 2016, 1, ['Drama', 'Romance'], '1122/96435.jpg', 'MOVIE'],
  [431, "Howl's Moving Castle", 2004, 1, ['Adventure', 'Fantasy', 'Romance'], '5/75810.jpg', 'MOVIE'],
  [164, 'Princess Mononoke', 1997, 1, ['Action', 'Adventure', 'Fantasy'], '7/75919.jpg', 'MOVIE']
];

const STARTER = starterRows.map(([id, title, seasonYear, episodes, genres, image, format = 'TV']) => ({
  id, title: { romaji: title }, seasonYear, episodes, genres, format,
  coverImage: { large: `https://cdn.myanimelist.net/images/anime/${image}` }
}));

const ICONS = {
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  x: '<path d="m18 6-12 12M6 6l12 12"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  arrowRight: '<path d="M5 12h14m-7-7 7 7-7 7"/>',
  arrowLeft: '<path d="M19 12H5m7 7-7-7 7-7"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  shuffle: '<path d="m18 2 4 4-4 4m0 4 4 4-4 4M2 6h2a4 4 0 0 1 3.3 1.8l5.4 8.4A4 4 0 0 0 16 18h6M2 18h2a4 4 0 0 0 3.3-1.8l5.4-8.4A4 4 0 0 1 16 6h6"/>',
  external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  film: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 8h4m10 0h4M3 16h4m10 0h4"/>'
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const titleOf = anime => anime.title?.english || anime.title?.romaji || 'Untitled anime';
const safeUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch { return ''; }
};
const posterOf = anime => safeUrl(anime.coverImage?.large || anime.coverImage?.extraLarge || '');
const stripHtml = value => {
  const doc = new DOMParser().parseFromString(String(value || ''), 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
};
const icon = (name, size = 18, filled = false) => `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

function hydrateIcons() {
  $$('i[data-icon]').forEach(element => {
    element.outerHTML = icon(element.dataset.icon, Number(element.dataset.size) || 18, element.dataset.fill === '1');
  });
}

function savedRecord(anime) {
  return {
    id: anime.id, title: anime.title, coverImage: anime.coverImage,
    seasonYear: anime.seasonYear, episodes: anime.episodes,
    genres: anime.genres || [], format: anime.format, averageScore: anime.averageScore
  };
}

function readSaved() {
  const saved = new Map();
  try {
    const records = JSON.parse(localStorage.getItem(SAVED_KEY) || 'null');
    if (Array.isArray(records)) {
      records.forEach(record => {
        if (Number.isInteger(record?.id) && record.id > 0 && record.title) saved.set(record.id, savedRecord(record));
      });
      return saved;
    }
    const oldIds = JSON.parse(localStorage.getItem('wa06-list') || '[]');
    const oldCache = JSON.parse(localStorage.getItem('wa06-catalog-v2') || 'null');
    if (Array.isArray(oldIds)) {
      oldIds.forEach(id => {
        const anime = STARTER.find(item => item.id === id) || oldCache?.items?.find(item => item.id === id);
        if (anime?.id > 0) saved.set(anime.id, savedRecord(anime));
      });
    }
  } catch { /* Browsing still works when browser storage is unavailable. */ }
  return saved;
}

const state = {
  view: 'browse', search: '', genre: '', sort: 'POPULARITY_DESC', page: 1,
  items: [], hasNext: false, loading: false, offline: false,
  requestVersion: 0, controller: null, saved: readSaved(), modal: null
};
const byId = new Map([...STARTER, ...state.saved.values()].map(anime => [anime.id, anime]));
const pageCache = new Map();
const detailCache = new Map();
let requestQueue = Promise.resolve();
let nextRequestAt = 0;
let toastTimer;
let searchTimer;
let modalCloseTimer;
let lastFocus;

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

// Requests are serialized and spaced for AniList's 30-request/minute limit.
function requestApi(query, variables, signal) {
  const task = requestQueue.catch(() => {}).then(async () => {
    await wait(Math.max(0, nextRequestAt - Date.now()), signal);
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    const timeout = setTimeout(() => controller.abort(), 14000);
    nextRequestAt = Date.now() + 2200;
    try {
      const response = await fetch(API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables }), signal: controller.signal
      });
      if (response.status === 429) {
        const retry = Number(response.headers.get('Retry-After')) || 60;
        nextRequestAt = Date.now() + Math.max(1, retry) * 1000;
        throw new Error(`The live catalog is busy. Try again in about ${retry} seconds.`);
      }
      if (!response.ok) throw new Error('The live catalog could not be reached.');
      const result = await response.json();
      if (result.errors || !result.data) throw new Error('The live catalog is temporarily unavailable.');
      return result.data;
    } catch (error) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      if (controller.signal.aborted) throw new Error('The live catalog took too long to respond.');
      throw error;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  });
  requestQueue = task.catch(() => {});
  return task;
}

function cachePut(cache, key, value, limit) {
  cache.delete(key);
  cache.set(key, { value, time: Date.now() });
  while (cache.size > limit) cache.delete(cache.keys().next().value);
}

function cacheGet(cache, key) {
  const entry = cache.get(key);
  if (!entry || Date.now() - entry.time > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function filteredLocal(items) {
  const search = state.search.trim().toLowerCase();
  let result = items.filter(anime => (!state.genre || anime.genres?.includes(state.genre)) &&
    (!search || `${anime.title?.romaji || ''} ${anime.title?.english || ''}`.toLowerCase().includes(search)));
  if (state.sort === 'SCORE_DESC') result.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
  if (state.sort === 'START_DATE_DESC') result.sort((a, b) => (b.seasonYear || 0) - (a.seasonYear || 0));
  if (state.sort === 'TITLE_ENGLISH') result.sort((a, b) => titleOf(a).localeCompare(titleOf(b)));
  return result;
}

function renderLocal() {
  const items = filteredLocal(state.view === 'saved' ? [...state.saved.values()] : STARTER);
  state.page = Math.min(state.page, Math.max(1, Math.ceil(items.length / PAGE_SIZE)));
  const offset = (state.page - 1) * PAGE_SIZE;
  state.items = items.slice(offset, offset + PAGE_SIZE);
  state.hasNext = offset + PAGE_SIZE < items.length;
  state.loading = false;
  renderCatalog();
}

function setStatus(text, offline = false) {
  $('#statusText').textContent = text;
  $('.catalog-status').classList.toggle('is-offline', offline);
}

async function refreshCatalog() {
  state.controller?.abort();
  const version = ++state.requestVersion;
  if (state.view === 'saved' || state.offline) {
    renderLocal();
    return;
  }
  const controller = new AbortController();
  state.controller = controller;
  const variables = {
    page: state.page, perPage: PAGE_SIZE,
    search: state.search.trim() || null, genre: state.genre || null,
    sort: [state.sort, 'ID']
  };
  const key = JSON.stringify(variables);
  const cached = cacheGet(pageCache, key);
  state.loading = true;
  updateNavigation();
  renderSkeletons();
  setStatus(state.search ? 'Searching the full anime catalog...' : 'Loading anime...');
  $('#retryButton').hidden = true;
  try {
    const result = cached || (await requestApi(CATALOG_QUERY, variables, controller.signal)).Page;
    if (version !== state.requestVersion) return;
    if (!Array.isArray(result?.media)) throw new Error('The catalog returned an incomplete response.');
    if (!cached) cachePut(pageCache, key, result, 12);
    const remaining = CATALOG_CAPACITY - (state.page - 1) * PAGE_SIZE;
    state.items = [...new Map(result.media.filter(anime => anime?.id && anime.title).map(anime => [anime.id, anime])).values()].slice(0, Math.min(PAGE_SIZE, remaining));
    state.items.forEach(anime => byId.set(anime.id, anime));
    state.hasNext = Boolean(result.pageInfo?.hasNextPage) && state.page * PAGE_SIZE < CATALOG_CAPACITY;
    state.loading = false;
    renderCatalog();
  } catch (error) {
    if (version !== state.requestVersion || error.name === 'AbortError') return;
    state.offline = true;
    state.page = 1;
    state.loading = false;
    renderLocal();
    setStatus(`${error.message} Showing a limited starter selection.`, true);
  }
}

function renderSkeletons() {
  const grid = $('#animeGrid');
  grid.setAttribute('aria-busy', 'true');
  grid.innerHTML = Array.from({ length: 12 }, () => '<div aria-hidden="true"><div class="skeleton-art"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>').join('');
  $('#emptyState').hidden = true;
  $('#pagination').hidden = true;
}

function posterHtml(anime, index) {
  const title = esc(titleOf(anime));
  const saved = state.saved.has(anime.id);
  const poster = posterOf(anime);
  const format = anime.format === 'MOVIE' ? 'Movie' : anime.format === 'TV' ? 'Series' : (anime.format || 'Anime').replaceAll('_', ' ');
  return `<article class="anime-item enter" style="--delay:${(index % 6) * 30}ms">
    <button class="anime-art" data-open="${anime.id}" aria-label="View ${title}">
      ${poster ? `<img src="${esc(poster)}" alt="${title} poster" loading="lazy" decoding="async" />` : `<div class="art-placeholder">${title}</div>`}
      <span class="art-play">${icon('play', 19, true)}</span>
    </button>
    <div class="anime-title-row">
      <button class="anime-title" data-open="${anime.id}" title="${title}">${title}</button>
      <button class="save-button ${saved ? 'is-saved' : ''}" data-save="${anime.id}" aria-label="${saved ? 'Remove from' : 'Add to'} my list: ${title}" aria-pressed="${saved}">${icon('bookmark', 15, saved)}</button>
    </div>
    <div class="anime-meta"><span>${esc(anime.seasonYear || format)}${anime.seasonYear ? ` / ${esc(format)}` : ''}</span>${anime.averageScore ? `<span class="anime-rating">${icon('star', 10, true)} ${(anime.averageScore / 10).toFixed(1)}</span>` : ''}</div>
  </article>`;
}

function updateNavigation() {
  $$('[data-view]').forEach(button => {
    const active = button.dataset.view === state.view;
    button.classList.toggle('nav-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const count = $('#savedCount');
  count.hidden = state.saved.size === 0;
  count.textContent = state.saved.size;
  $('#previousPage').disabled = state.loading || state.page <= 1;
  $('#nextPage').disabled = state.loading || !state.hasNext;
  $('#pageLabel').textContent = `Page ${state.page.toLocaleString()}`;
}

function renderCatalog() {
  const grid = $('#animeGrid');
  grid.setAttribute('aria-busy', 'false');
  grid.innerHTML = state.items.map(posterHtml).join('');
  $('#catalogTitle').textContent = state.view === 'saved' ? 'Your saved stories.' : state.search.trim() ? 'Search results.' : 'Find your next favorite.';
  $('#catalogCount').textContent = state.view === 'saved' ? `${state.saved.size.toLocaleString()} saved` : `${state.items.length} titles on this page`;
  $('#pagination').hidden = state.page <= 1 && !state.hasNext;
  $('#retryButton').hidden = !state.offline || state.view === 'saved';
  $('#emptyState').hidden = state.items.length > 0;
  if (!state.items.length) {
    const emptySaved = state.view === 'saved' && state.saved.size === 0;
    $('#emptyTitle').textContent = emptySaved ? 'Start your own collection.' : 'No matching anime.';
    $('#emptyText').textContent = emptySaved ? 'Tap the bookmark beside a title to save it here.' : state.offline && state.view !== 'saved' ? 'The live catalog is offline. This search only covers the starter selection.' : 'Try another title or choose a different genre.';
  }
  if (state.view === 'saved') setStatus('Your list is saved in this browser.');
  else if (state.offline) setStatus(`Live catalog unavailable. Browsing ${STARTER.length} starter titles only.`, true);
  else if (state.search.trim()) setStatus(`Results for "${state.search.trim()}" across AniList's catalog.`);
  else setStatus('Search the whole catalog, not just this page.');
  updateNavigation();
}

function resetFilters() {
  clearTimeout(searchTimer);
  state.search = '';
  state.genre = '';
  state.sort = 'POPULARITY_DESC';
  state.page = 1;
  $('#searchInput').value = '';
  $('#genreSelect').value = '';
  $('#sortSelect').value = state.sort;
  $('#clearSearch').hidden = true;
}

function showCatalog(focusSearch = false) {
  $('#catalog').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  if (focusSearch) $('#searchInput').focus({ preventScroll: true });
}

function setView(view) {
  resetFilters();
  state.view = view;
  refreshCatalog();
  showCatalog();
}

function toast(message) {
  clearTimeout(toastTimer);
  const element = $('#toast');
  element.textContent = message;
  element.hidden = false;
  toastTimer = setTimeout(() => { element.hidden = true; }, 2700);
}

function toggleSave(id) {
  const anime = byId.get(id) || state.saved.get(id);
  if (!anime) return;
  const wasSaved = state.saved.has(id);
  if (wasSaved) state.saved.delete(id);
  else state.saved.set(id, savedRecord(anime));
  let persistent = true;
  try { localStorage.setItem(SAVED_KEY, JSON.stringify([...state.saved.values()])); }
  catch { persistent = false; }
  const saved = state.saved.has(id);
  $$(`.save-button[data-save="${id}"]`).forEach(button => {
    button.classList.toggle('is-saved', saved);
    button.innerHTML = icon('bookmark', 15, saved);
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', `${saved ? 'Remove from' : 'Add to'} my list: ${titleOf(anime)}`);
  });
  if (state.modal?.anime.id === id) updateDetailSave();
  if (state.view === 'saved') renderLocal();
  updateNavigation();
  toast(persistent ? saved ? 'Added to your list.' : 'Removed from your list.' : 'Updated for this visit. Browser storage is unavailable.');
}

const modal = $('#modal');
const modalBody = $('#modalBody');

function setBackgroundInert(value) {
  $$('.site-header, #mainContent, .site-footer').forEach(element => { element.inert = value; });
}

function detailMetaHtml(anime) {
  return `${anime.averageScore ? `<span class="score">${icon('star', 12, true)} ${(anime.averageScore / 10).toFixed(1)}</span>` : ''}
    ${anime.seasonYear ? `<span>${esc(anime.seasonYear)}</span>` : ''}
    <span>${esc(anime.format === 'MOVIE' ? 'Movie' : (anime.format || 'Anime').replaceAll('_', ' '))}</span>
    ${anime.episodes ? `<span>${anime.episodes} episodes</span>` : ''}`;
}

function updateModalDetails() {
  if (!state.modal) return;
  const { anime, detailsLoading, detailsError } = state.modal;
  $('#detailTitle').textContent = titleOf(anime);
  $('#detailMeta').innerHTML = detailMetaHtml(anime);
  const description = stripHtml(anime.description);
  $('#detailDescription').textContent = description ? description.slice(0, 400) + (description.length > 400 ? '...' : '') : detailsLoading ? 'Loading the story...' : 'Explore this title with the player, trailer and viewing options below.';
  const background = safeUrl(anime.bannerImage) || posterOf(anime) || '/images/hero-anime.jpg';
  $('.detail-visual', modalBody).style.backgroundImage = `linear-gradient(90deg, #111018ee, #1110187a), linear-gradient(0deg, #111018, transparent), url(${JSON.stringify(background)})`;
  $('#detailStatusText').textContent = detailsLoading ? 'Loading extra details...' : detailsError ? 'Extra details could not be loaded. You can still explore viewing options.' : (anime.genres || []).slice(0, 3).join(' / ');
  $('#retryDetails').hidden = !detailsError;
  updateDetailSave();
}

function updateDetailSave() {
  const button = $('.detail-save', modalBody);
  if (!button || !state.modal) return;
  const saved = state.saved.has(state.modal.anime.id);
  button.classList.toggle('is-saved', saved);
  button.setAttribute('aria-pressed', String(saved));
  button.innerHTML = `${icon(saved ? 'check' : 'bookmark', 15)} ${saved ? 'Saved' : 'Save to my list'}`;
}

async function loadDetails() {
  const current = state.modal;
  if (!current) return;
  current.detailsLoading = true;
  current.detailsError = false;
  updateModalDetails();
  const cached = cacheGet(detailCache, current.anime.id);
  try {
    const details = cached || (await requestApi(DETAIL_QUERY, { id: current.anime.id }, current.controller.signal)).Media;
    if (state.modal !== current) return;
    if (!details?.id) throw new Error('Extra details are unavailable.');
    cachePut(detailCache, details.id, details, 20);
    current.anime = { ...current.anime, ...details };
    current.detailsLoading = false;
    byId.set(details.id, current.anime);
    updateModalDetails();
    if (current.tab !== 'episodes' || !current.started) renderPlayer();
    else {
      const episodeInput = $('#episodeInput');
      if (episodeInput) episodeInput.max = String(current.anime.episodes || 99999);
    }
  } catch (error) {
    if (state.modal !== current || error.name === 'AbortError') return;
    current.detailsLoading = false;
    current.detailsError = true;
    updateModalDetails();
    if (current.tab !== 'episodes') renderPlayer();
  }
}

function openModal(id) {
  const anime = byId.get(id) || state.saved.get(id);
  if (!anime) return;
  clearTimeout(modalCloseTimer);
  state.modal?.controller.abort();
  lastFocus = document.activeElement;
  state.modal = { anime, tab: 'episodes', episode: 1, audio: 'sub', started: false, detailsLoading: true, detailsError: false, controller: new AbortController() };
  modalBody.setAttribute('aria-label', titleOf(anime));
  modalBody.innerHTML = `<button class="modal-close" data-close aria-label="Close anime details">${icon('x', 19)}</button>
    <div class="detail-visual"><div><h2 id="detailTitle"></h2><div class="detail-meta" id="detailMeta"></div></div></div>
    <div class="detail-body">
      <div class="detail-copy"><p class="detail-description" id="detailDescription"></p><button class="detail-save" data-save="${anime.id}"></button></div>
      <div class="detail-status"><span id="detailStatusText"></span><button id="retryDetails" class="text-button" hidden>Retry</button></div>
      <div id="playerSection"></div>
    </div>`;
  updateModalDetails();
  renderPlayer();
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  setBackgroundInert(true);
  requestAnimationFrame(() => { modal.classList.add('open'); $('.modal-close', modalBody).focus(); });
  loadDetails();
}

function closeModal() {
  if (!state.modal) return;
  state.modal.controller.abort();
  state.modal = null;
  $$('iframe', modalBody).forEach(iframe => { iframe.src = 'about:blank'; });
  modal.classList.remove('open');
  document.body.style.overflow = '';
  setBackgroundInert(false);
  if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  else $('#browseButton').focus({ preventScroll: true });
  modalCloseTimer = setTimeout(() => { modal.hidden = true; modalBody.innerHTML = ''; }, 230);
}

function playerHtml() {
  const current = state.modal;
  const { anime, tab, episode, audio, started } = current;
  const title = esc(titleOf(anime));
  let content = '';
  if (tab === 'episodes') {
    content = `<div class="episode-toolbar">
      <label class="episode-picker">Episode <input id="episodeInput" type="number" min="1" max="${anime.episodes || 99999}" value="${episode}" aria-label="Choose episode" />${anime.episodes ? `<span>of ${anime.episodes}</span>` : ''}</label>
      <div class="audio-switch" aria-label="Audio version"><button data-audio="sub" class="${audio === 'sub' ? 'active' : ''}" aria-pressed="${audio === 'sub'}">SUB</button><button data-audio="dub" class="${audio === 'dub' ? 'active' : ''}" aria-pressed="${audio === 'dub'}">DUB</button></div>
    </div>
    <div class="video-frame">${started ? `<iframe src="https://megavid.buzz/ani/${anime.id}/${episode}/${audio}?color=%239370e4" title="${title}, episode ${episode}, ${audio}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen referrerpolicy="no-referrer"></iframe>` : `<div class="video-empty">${icon('play', 26)}<strong>Ready when you are.</strong><p>Episode ${episode} / ${audio === 'sub' ? 'Subtitled' : 'Dubbed'}</p><button class="button button-primary" data-play>Load episode ${icon('play', 14, true)}</button></div>`}</div>
    <div class="episode-navigation"><button data-episode="-1" ${episode === 1 ? 'disabled' : ''}>${icon('arrowLeft', 14)} Previous episode</button><button data-episode="1" ${anime.episodes && episode >= anime.episodes ? 'disabled' : ''}>Next episode ${icon('arrowRight', 14)}</button></div>
    <p class="player-note">This player is provided by an independent third party. Playback and sub/dub availability are not guaranteed. If it does not work, try the trailer or where-to-watch links.</p>`;
  } else if (tab === 'trailer') {
    const trailer = anime.trailer?.site?.toLowerCase() === 'youtube' ? anime.trailer.id : null;
    content = `<div class="video-frame">${trailer ? `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer)}?rel=0" title="${title} trailer" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>` : `<div class="video-empty">${icon('film', 28)}<strong>${current.detailsLoading ? 'Loading the trailer...' : 'No trailer listed.'}</strong><p>Try viewing options for this title.</p><button class="button button-quiet" data-tab="providers">Where to watch ${icon('arrowRight', 14)}</button></div>`}</div>`;
  } else {
    const links = (anime.externalLinks || []).filter(link => safeUrl(link.url) && (link.type === 'STREAMING' || /crunchyroll|netflix|hulu|disney|youtube|hidive|tubi|bilibili|prime video/i.test(link.site)));
    const unique = [...new Map(links.map(link => [link.url, link])).values()];
    content = `<p class="provider-intro">Watch on a provider's website. Availability and subscriptions vary by country.</p><div class="provider-list">${unique.map(link => `<a href="${esc(safeUrl(link.url))}" target="_blank" rel="noopener noreferrer"><span>${icon('play', 13)} ${esc(link.site)}</span>${icon('external', 14)}</a>`).join('')}
      <a href="https://www.justwatch.com/in/search?q=${encodeURIComponent(titleOf(anime))}" target="_blank" rel="noopener noreferrer"><span>Find availability on JustWatch India</span>${icon('external', 14)}</a>
    </div>${current.detailsLoading ? '<p class="player-note">Loading listed providers...</p>' : !unique.length ? '<p class="player-note">No specific streaming provider is listed. You can search JustWatch above.</p>' : ''}`;
  }
  return `<div class="player-tabs" role="tablist" aria-label="Viewing options">${[['episodes', 'Episodes'], ['trailer', 'Trailer'], ['providers', 'Where to watch']].map(([value, label]) => `<button role="tab" data-tab="${value}" class="${tab === value ? 'active' : ''}" aria-selected="${tab === value}">${label}</button>`).join('')}</div><div class="player-content" role="tabpanel">${content}</div>`;
}

function renderPlayer() {
  if (!state.modal) return;
  $('#playerSection').innerHTML = playerHtml();
}

function setEpisode(value) {
  if (!state.modal) return;
  state.modal.episode = Math.max(1, Math.min(state.modal.anime.episodes || 99999, Math.floor(Number(value)) || 1));
  renderPlayer();
}

document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  const open = target.closest('[data-open]');
  if (open) return openModal(Number(open.dataset.open));
  const save = target.closest('[data-save]');
  if (save) return toggleSave(Number(save.dataset.save));
  const view = target.closest('[data-view]');
  if (view) return setView(view.dataset.view);
  if (target === modal || target.closest('[data-close]')) return closeModal();
  const tab = target.closest('[data-tab]');
  if (tab && state.modal) { state.modal.tab = tab.dataset.tab; return renderPlayer(); }
  const audio = target.closest('[data-audio]');
  if (audio && state.modal) { state.modal.audio = audio.dataset.audio; return renderPlayer(); }
  const episode = target.closest('[data-episode]');
  if (episode && state.modal) return setEpisode(state.modal.episode + Number(episode.dataset.episode));
  if (target.closest('[data-play]') && state.modal) { state.modal.started = true; return renderPlayer(); }
  if (target.closest('#retryDetails') && state.modal) return loadDetails();
});

$('#searchInput').addEventListener('input', event => {
  state.search = event.target.value;
  state.page = 1;
  $('#clearSearch').hidden = !state.search;
  state.controller?.abort();
  state.requestVersion++;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(refreshCatalog, 480);
});
$('#searchForm').addEventListener('submit', event => {
  event.preventDefault();
  clearTimeout(searchTimer);
  refreshCatalog();
});
$('#clearSearch').addEventListener('click', () => {
  clearTimeout(searchTimer);
  state.search = '';
  state.page = 1;
  $('#searchInput').value = '';
  $('#clearSearch').hidden = true;
  refreshCatalog();
  $('#searchInput').focus();
});
$('#genreSelect').addEventListener('change', event => {
  clearTimeout(searchTimer);
  state.genre = event.target.value;
  state.page = 1;
  refreshCatalog();
});
$('#sortSelect').addEventListener('change', event => {
  clearTimeout(searchTimer);
  state.sort = event.target.value;
  state.page = 1;
  refreshCatalog();
});

function changePage(direction) {
  if (state.loading || (direction < 0 && state.page <= 1) || (direction > 0 && !state.hasNext)) return;
  state.page += direction;
  refreshCatalog();
  showCatalog();
}

$('#previousPage').addEventListener('click', () => changePage(-1));
$('#nextPage').addEventListener('click', () => changePage(1));
$('#exploreButton').addEventListener('click', () => {
  if (state.view !== 'browse') setView('browse');
  showCatalog();
});
$('#randomButton').addEventListener('click', () => {
  const selection = state.items.length ? state.items : STARTER;
  openModal(selection[Math.floor(Math.random() * selection.length)].id);
});
$('#resetButton').addEventListener('click', () => {
  if (state.view === 'saved' && state.saved.size === 0) setView('browse');
  else { resetFilters(); refreshCatalog(); }
});
$('#retryButton').addEventListener('click', () => {
  state.offline = false;
  state.page = 1;
  refreshCatalog();
});

document.addEventListener('change', event => {
  if (event.target.id === 'episodeInput') setEpisode(event.target.value);
});

document.addEventListener('error', event => {
  const image = event.target;
  if (image instanceof HTMLImageElement && image.closest('.anime-art')) {
    const fallback = document.createElement('div');
    fallback.className = 'art-placeholder';
    fallback.textContent = image.alt.replace(/ poster$/, '');
    image.replaceWith(fallback);
  }
}, true);

document.addEventListener('keydown', event => {
  if (state.modal) {
    if (event.key === 'Escape') { event.preventDefault(); closeModal(); }
    if (event.key === 'Tab') {
      const focusable = $$('button:not([disabled]), a[href], input:not([disabled]), iframe', modalBody).filter(element => element.getClientRects().length);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    return;
  }
  if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
    event.preventDefault();
    showCatalog(true);
  }
});

hydrateIcons();
$('#genreSelect').insertAdjacentHTML('beforeend', GENRES.map(genre => `<option value="${esc(genre)}">${esc(genre)}</option>`).join(''));
updateNavigation();
refreshCatalog();