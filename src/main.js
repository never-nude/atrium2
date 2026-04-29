import './style.css';
import Box from 'lucide/dist/esm/icons/box.mjs';
import CircleGauge from 'lucide/dist/esm/icons/circle-gauge.mjs';
import Grid2X2 from 'lucide/dist/esm/icons/grid-2x2.mjs';
import LoaderCircle from 'lucide/dist/esm/icons/loader-circle.mjs';
import Search from 'lucide/dist/esm/icons/search.mjs';
import SlidersHorizontal from 'lucide/dist/esm/icons/sliders-horizontal.mjs';
import X from 'lucide/dist/esm/icons/x.mjs';
import catalog from './data/catalog.json';
import previews from './data/previews.json';

const app = document.querySelector('#app');
const heroSlug = 'michelangelo/david';
const pageSize = 48;

const filters = [
  { id: 'all', label: 'All' },
  { id: 'ancient', label: 'Ancient' },
  { id: 'renaissance', label: 'Renaissance' },
  { id: 'americas', label: 'Americas' },
  { id: 'africa', label: 'Africa' },
  { id: 'asia', label: 'Asia' },
];

const state = {
  query: '',
  filter: 'all',
  shown: pageSize,
  modalViewer: null,
};

function icon(nodes, className = 'icon') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const [tag, attrs] of nodes) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attrs)) child.setAttribute(key, value);
    svg.appendChild(child);
  }
  return svg;
}

function formatBytes(bytes = 0) {
  if (!bytes) return 'unknown';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function periodName(work) {
  if (work.period) return work.period;
  const year = Number(work.year_sort);
  if (Number.isFinite(year) && year < 500) return 'Ancient';
  if (Number.isFinite(year) && year < 1700) return 'Renaissance';
  return 'Modern';
}

function matchesFilter(work) {
  if (state.filter === 'all') return true;
  if (state.filter === 'ancient') return periodName(work).toLowerCase() === 'ancient';
  if (state.filter === 'renaissance') return periodName(work).toLowerCase() === 'renaissance';
  if (state.filter === 'americas') return work.collection?.startsWith('americas');
  if (state.filter === 'africa') return work.collection?.startsWith('sub-saharan-africa');
  if (state.filter === 'asia') return work.collection?.startsWith('asia');
  return true;
}

function filteredWorks() {
  const query = state.query.trim().toLowerCase();
  return catalog.filter((work) => {
    if (!matchesFilter(work)) return false;
    if (!query) return true;
    return work.search.includes(query);
  });
}

function previewFor(work) {
  return previews[work.slug] || null;
}

async function loadViewer(container, options) {
  const { attachViewer } = await import('./viewer.js');
  return attachViewer(container, options);
}

function renderShell() {
  app.innerHTML = `
    <header class="site-header">
      <a class="brand" href="/" aria-label="atrium home">
        <span class="brand-mark"></span>
        <span>atrium</span>
      </a>
      <nav class="top-nav" aria-label="Primary">
        <a href="#collection">Collection</a>
        <a href="#process">Process</a>
      </nav>
    </header>

    <main>
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow">A digital sculpture museum</p>
          <h1 id="hero-title">Open-access sculpture, built for a faster web.</h1>
          <p class="hero-lede">Atrium collects public 3D scans into a focused study room: light index pages, deliberate 3D loading, and source-aware records for every work.</p>
          <div class="hero-actions">
            <a class="button button-primary" href="#collection">Explore collection</a>
            <button class="button button-quiet" type="button" data-load-hero>Load David preview</button>
          </div>
        </div>

        <div class="hero-stage" aria-label="Featured preview area">
          <div class="hero-stage__poster" data-hero-poster>
            <span class="poster-kicker">Michelangelo</span>
            <span class="poster-title">David</span>
            <span class="poster-year">1501-1504</span>
          </div>
          <div class="viewer hero-viewer" data-hero-viewer hidden></div>
          <p class="hero-stage__caption">Preview assets are generated from the archival scans and loaded only on request.</p>
        </div>
      </section>

      <section class="metrics" aria-label="Collection metrics">
        <div class="metric">
          <span class="metric__value">${catalog.length}</span>
          <span class="metric__label">works cataloged</span>
        </div>
        <div class="metric">
          <span class="metric__value">${Object.keys(previews).length}</span>
          <span class="metric__label">web previews ready</span>
        </div>
        <div class="metric">
          <span class="metric__value">0</span>
          <span class="metric__label">index models loaded by default</span>
        </div>
      </section>

      <section id="collection" class="collection" aria-labelledby="collection-title">
        <div class="section-head">
          <div>
            <p class="eyebrow">The collection</p>
            <h2 id="collection-title">Browse without the weight.</h2>
          </div>
          <div class="search-wrap">
            <label class="sr-only" for="search">Search works</label>
            <div class="search-box">
              <span data-search-icon></span>
              <input id="search" type="search" placeholder="Search title, artist, period" autocomplete="off" />
            </div>
          </div>
        </div>

        <div class="toolbar" aria-label="Collection filters">
          <div class="toolbar-label"><span data-filter-icon></span><span>View</span></div>
          <div class="segments" role="list" data-filters></div>
        </div>

        <div class="result-line" data-result-line></div>
        <div class="grid" data-grid></div>
        <div class="more-row">
          <button class="button button-quiet" type="button" data-show-more>Show more</button>
        </div>
      </section>

      <section id="process" class="process" aria-labelledby="process-title">
        <div class="section-head">
          <div>
            <p class="eyebrow">Pipeline</p>
            <h2 id="process-title">The archival mesh stays archival.</h2>
          </div>
        </div>
        <div class="process-grid">
          <article>
            <span data-process-icon-a></span>
            <h3>Index</h3>
            <p>Cards render from JSON and poster treatments. No WebGL grid tax.</p>
          </article>
          <article>
            <span data-process-icon-b></span>
            <h3>Preview</h3>
            <p>Selected scans become low-poly GLB derivatives for browser study.</p>
          </article>
          <article>
            <span data-process-icon-c></span>
            <h3>Source</h3>
            <p>The original STL and GLB files remain referenced for provenance.</p>
          </article>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <span>atrium.earth</span>
      <span>static, source-aware, fast first</span>
    </footer>

    <div class="modal" data-modal hidden>
      <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
        <button class="icon-button modal-close" type="button" data-close-modal aria-label="Close preview"></button>
        <div class="modal-viewer-wrap">
          <div class="viewer modal-viewer" data-modal-viewer></div>
          <div class="modal-loading" data-modal-loading></div>
        </div>
        <aside class="modal-copy">
          <p class="eyebrow" data-modal-period></p>
          <h2 id="modal-title" data-modal-title></h2>
          <dl class="detail-list">
            <div><dt>Artist</dt><dd data-modal-artist></dd></div>
            <div><dt>Date</dt><dd data-modal-year></dd></div>
            <div><dt>Source</dt><dd data-modal-source></dd></div>
            <div><dt>Preview</dt><dd data-modal-preview></dd></div>
          </dl>
        </aside>
      </div>
    </div>
  `;

  app.querySelector('[data-search-icon]').append(icon(Search));
  app.querySelector('[data-filter-icon]').append(icon(SlidersHorizontal));
  app.querySelector('[data-process-icon-a]').append(icon(Grid2X2, 'process-icon'));
  app.querySelector('[data-process-icon-b]').append(icon(CircleGauge, 'process-icon'));
  app.querySelector('[data-process-icon-c]').append(icon(Box, 'process-icon'));
  app.querySelector('[data-close-modal]').append(icon(X));
  app.querySelector('[data-modal-loading]').append(icon(LoaderCircle, 'loader-icon'));

  const filterWrap = app.querySelector('[data-filters]');
  for (const filter of filters) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = filter.label;
    button.dataset.filter = filter.id;
    button.className = filter.id === state.filter ? 'segment is-active' : 'segment';
    filterWrap.append(button);
  }
}

function posterVars(work) {
  const seed = [...work.slug].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const palettes = [
    ['#8c4a30', '#e4bd89', '#284d63'],
    ['#4e6255', '#d9a55a', '#5b3b54'],
    ['#255b6b', '#e5b68b', '#893f35'],
    ['#665c36', '#d7c9a1', '#315a7a'],
    ['#7a3f42', '#d2a164', '#496a5c'],
  ];
  const p = palettes[seed % palettes.length];
  return `--poster-a:${p[0]};--poster-b:${p[1]};--poster-c:${p[2]};`;
}

function renderCard(work) {
  const ready = previewFor(work);
  const card = document.createElement('article');
  card.className = 'work-card';
  card.style.cssText = posterVars(work);

  const period = periodName(work);
  card.innerHTML = `
    <button class="work-card__poster" type="button" data-open-work="${work.slug}">
      <span class="work-card__index">${String(work.index).padStart(3, '0')}</span>
      <span class="work-card__glyph">${work.title.slice(0, 1)}</span>
      <span class="work-card__period">${period}</span>
    </button>
    <div class="work-card__body">
      <div>
        <h3>${work.title}</h3>
        <p>${work.artist || work.source_institution || 'Open collection'}${work.year ? ` · ${work.year}` : ''}</p>
      </div>
      <div class="work-card__meta">
        <span>${work.model.format.toUpperCase()}</span>
        <span>${formatBytes(work.model.sizeBytes)}</span>
        ${ready ? '<span class="ready">preview</span>' : '<span>source</span>'}
      </div>
    </div>
  `;
  return card;
}

function renderGrid() {
  const works = filteredWorks();
  const shownWorks = works.slice(0, state.shown);
  const grid = app.querySelector('[data-grid]');
  const resultLine = app.querySelector('[data-result-line]');
  const more = app.querySelector('[data-show-more]');

  grid.innerHTML = '';
  resultLine.textContent = `${works.length} works`;
  for (const work of shownWorks) grid.append(renderCard(work));

  more.hidden = works.length <= state.shown;
}

async function loadHero() {
  const work = catalog.find((item) => item.slug === heroSlug);
  const preview = work && previewFor(work);
  const poster = app.querySelector('[data-hero-poster]');
  const viewer = app.querySelector('[data-hero-viewer]');
  const button = app.querySelector('[data-load-hero]');

  if (!preview || viewer.dataset.loaded) return;
  button.disabled = true;
  button.textContent = 'Loading preview';
  viewer.hidden = false;
  poster.hidden = true;
  await loadViewer(viewer, {
    modelUrl: preview.url,
    spin: true,
    interactive: false,
    spinSpeed: 0.004,
    cameraPadding: 2.65,
    verticalBias: -0.35,
  });
  viewer.dataset.loaded = 'true';
  button.textContent = 'Preview loaded';
}

async function openWork(slug) {
  const work = catalog.find((item) => item.slug === slug);
  if (!work) return;
  const preview = previewFor(work);
  const modal = app.querySelector('[data-modal]');
  const panel = app.querySelector('.modal-panel');
  const viewer = app.querySelector('[data-modal-viewer]');
  const loading = app.querySelector('[data-modal-loading]');

  app.querySelector('[data-modal-period]').textContent = periodName(work);
  app.querySelector('[data-modal-title]').textContent = work.title;
  app.querySelector('[data-modal-artist]').textContent = work.artist || 'unknown';
  app.querySelector('[data-modal-year]').textContent = work.year || 'undated';
  app.querySelector('[data-modal-source]').textContent = work.source_institution || 'open source record';
  app.querySelector('[data-modal-preview]').textContent = preview
    ? `${formatBytes(preview.bytes)} optimized from ${formatBytes(preview.sourceBytes)}`
    : 'queued';

  modal.hidden = false;
  panel.focus();
  viewer.innerHTML = '';
  loading.hidden = !preview;

  if (state.modalViewer?.dispose) state.modalViewer.dispose();
  state.modalViewer = null;

  if (preview) {
    state.modalViewer = await loadViewer(viewer, {
      modelUrl: preview.url,
      spin: true,
      interactive: true,
      spinSpeed: 0.0025,
      cameraPadding: 3.8,
      verticalBias: -0.28,
    });
  } else {
    viewer.innerHTML = '<div class="modal-placeholder">Preview asset queued</div>';
  }
  loading.hidden = true;
}

function closeModal() {
  const modal = app.querySelector('[data-modal]');
  if (state.modalViewer?.dispose) state.modalViewer.dispose();
  state.modalViewer = null;
  modal.hidden = true;
}

function bindEvents() {
  app.querySelector('#search').addEventListener('input', (event) => {
    state.query = event.currentTarget.value;
    state.shown = pageSize;
    renderGrid();
  });

  app.querySelector('[data-filters]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    state.filter = button.dataset.filter;
    state.shown = pageSize;
    for (const segment of app.querySelectorAll('.segment')) {
      segment.classList.toggle('is-active', segment.dataset.filter === state.filter);
    }
    renderGrid();
  });

  app.querySelector('[data-grid]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-open-work]');
    if (!button) return;
    openWork(button.dataset.openWork);
  });

  app.querySelector('[data-show-more]').addEventListener('click', () => {
    state.shown += pageSize;
    renderGrid();
  });

  app.querySelector('[data-load-hero]').addEventListener('click', loadHero);
  app.querySelector('[data-close-modal]').addEventListener('click', closeModal);
  app.querySelector('[data-modal]').addEventListener('click', (event) => {
    if (event.target.matches('[data-modal]')) closeModal();
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });
}

renderShell();
renderGrid();
bindEvents();
