// app.js - Versão Completa e Corrigida (Capas + Leitor PDF)

const app = document.getElementById('app');

// Dados dos Livros (Pasta: book-covers/)
const BOOKS_DATA = [
  { slug: 'sombras-do-imperio', title: 'Sombras do Império', file: 'sombras-do-imperio.pdf', cover: 'sombras-do-imperio-livro.jpg', eraId: 4, eraName: 'O Império em Guerra', chronoOrder: 295 },
  { slug: 'herdeiros-do-imperio', title: 'Herdeiros do Império', file: 'herdeiros-do-imperio.pdf', cover: 'herdeiros-do-imperio-livro.jpg', eraId: 5, eraName: 'A Nova República', chronoOrder: 10 },
  { slug: 'o-despertar-da-forca-negra', title: 'O Despertar da Força Negra', file: 'o-despertar-da-forca-negra.pdf', cover: 'o-despertar-da-forca-negra-livro.jpg', eraId: 5, eraName: 'A Nova República', chronoOrder: 20 },
  { slug: 'a-ultima-ordem', title: 'A Última Ordem', file: 'a-ultima-ordem.pdf', cover: 'a-ultima-ordem-livro.jpg', eraId: 5, eraName: 'A Nova República', chronoOrder: 30 }
];

// PROTEÇÃO ANTI-CÓPIA
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('copy', e => e.preventDefault());
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'u', 'p', 's'].includes(e.key.toLowerCase())) e.preventDefault();
});

// ============================================================
// Google Drive & Helpers
// ============================================================
function getGDriveViewerUrl(fileId) { return `https://drive.google.com/file/d/${fileId}/preview`; }
function getGDriveDownloadUrl(fileId) { return `https://drive.google.com/uc?export=download&id=${fileId}`; }

function getComicGDriveId(comicSlug) {
  return (typeof GDRIVE_COMICS !== 'undefined' && GDRIVE_COMICS[comicSlug] !== 'COLOQUE_O_ID_AQUI') ? GDRIVE_COMICS[comicSlug] : null;
}

function getBookGDriveId(bookSlug) {
  return (typeof GDRIVE_BOOKS !== 'undefined' && GDRIVE_BOOKS[bookSlug] !== 'COLOQUE_O_ID_AQUI') ? GDRIVE_BOOKS[bookSlug] : null;
}

// Organização Cronológica
function getChronologicalData() {
  let allItems = [];
  Object.values(window.SERIES_DATA || {}).forEach(s => allItems.push({ ...s, viewType: 'comic' }));
  BOOKS_DATA.forEach(b => allItems.push({ ...b, viewType: 'book' }));

  const eras = {};
  allItems.forEach(item => {
    let e = item.eraId || 99;
    if (!eras[e]) eras[e] = { id: e, name: item.eraName || "Outros", items: [] };
    eras[e].items.push(item);
  });

  const sortedEras = Object.values(eras).sort((a, b) => a.id - b.id);
  sortedEras.forEach(era => era.items.sort((a, b) => (a.chronoOrder || 999) - (b.chronoOrder || 999)));
  return sortedEras;
}

// ============================================================
// Renderização de Telas
// ============================================================

function renderHome() {
  const erasData = getChronologicalData();
  const searchIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

  let erasHTML = erasData.map(era => {
    let cardsHTML = era.items.map(item => {
      if (item.viewType === 'book') {
        return `
              <a class="card book-card" href="#readbook/${item.slug}" data-title="${item.title.toLowerCase()}">
                <div class="cover"><img src="book-covers/${item.cover}" loading="lazy" onerror="this.src='covers/placeholder.webp';"></div>
                <div class="card-info"><div class="card-title">${item.title}</div><div class="card-meta">📖 Romance</div></div>
              </a>`;
      } else {
        const firstComic = item.comics.sort((a, b) => a.sortOrder - b.sortOrder)[0];
        const coverUrl = firstComic ? `covers/${firstComic.slug}.webp` : 'covers/placeholder.webp';
        return `
              <a class="card serie-card" href="#series/${item.slug}" data-title="${item.title.toLowerCase()}">
                <div class="cover"><img src="${coverUrl}" loading="lazy" onerror="this.src='covers/placeholder.webp';"></div>
                <div class="card-info"><div class="card-title">${item.title}</div><div class="card-meta">${item.comics.length} edições</div></div>
              </a>`;
      }
    }).join('');
    return `<div class="era-section"><h3 class="section-title era-title"><span class="era-badge">Era</span> ${era.name}</h3><div class="grid">${cardsHTML}</div></div>`;
  }).join('');

  app.innerHTML = `
    <header><div class="brand" onclick="window.location.hash='#home'"><h1>HQ Star Wars</h1><span>Acervo Master</span></div>
    <div class="search-container">
      <button class="search-icon" onclick="toggleSearch()">${searchIconSvg}</button>
      <input type="text" id="searchInput" class="search-input" placeholder="Buscar..." oninput="filterSeries(this.value)">
    </div></header>
    <main><div id="chrono-container">${erasHTML}</div><div id="noResults" class="no-res" style="display:none">Nenhum resultado.</div></main>`;
}

function renderSeries(slug) {
  const serie = Object.values(window.SERIES_DATA || {}).find(s => s.slug === slug);
  if (!serie) return (window.location.hash = '#home');

  const comics = serie.comics.sort((a, b) => a.sortOrder - b.sortOrder);
  app.innerHTML = `
    <header><div class="brand" onclick="window.location.hash='#home'"><h1>HQ Star Wars</h1><span>Acervo Master</span></div></header>
    <main>
      <div class="view-header"><a href="#home" class="btn-back">&#8592;</a><h2 style="color:var(--text-primary)">${serie.title}</h2></div>
      <div class="grid">
        ${comics.map(c => `
          <a class="card" href="#read/${serie.slug}/${c.slug}">
            <div class="cover"><img src="covers/${c.slug}.webp" loading="lazy" onerror="this.src='covers/placeholder.webp';"></div>
            <div class="card-info"><div class="card-title">${c.title}</div></div>
          </a>`).join('')}
      </div>
    </main>`;
  window.scrollTo(0, 0);
}

// ============================================================
// Leitores de Arquivos (PDF / GDrive)
// ============================================================

function mountGDriveReader(fileId, displayName, backUrl, downloadUrl) {
  app.innerHTML = `
    <div id="reader-container">
      <div class="reader-toolbar" id="toolbar">
        <a href="${backUrl}" class="btn-back">&#8592;</a>
        <div class="reader-title">${displayName}</div>
        <div class="reader-controls">
          <a href="${downloadUrl}" target="_blank" class="reader-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></a>
        </div>
      </div>
      <div class="gdrive-frame-container"><iframe src="${getGDriveViewerUrl(fileId)}" allow="autoplay; fullscreen" class="gdrive-iframe"></iframe></div>
    </div>`;
}

function mountPDFCanvas(pdfUrl, backUrl, displayName, hasNextCb) {
  app.innerHTML = `
    <div id="reader-container">
      <div class="reader-toolbar" id="toolbar">
        <a href="${backUrl}" class="btn-back">&#8592;</a>
        <div class="reader-title">${displayName}</div>
        <div class="reader-controls">
          <button class="reader-btn" id="zoom_out">-</button>
          <button class="reader-btn" id="zoom_in">+</button>
        </div>
      </div>
      <div class="reader-canvas-container" id="canvas_container">
        <div class="loader" id="loader"></div>
        <canvas id="pdf_render"></canvas>
      </div>
      <div class="reader-footer" id="reader-footer">Página <span id="page_num">-</span>/<span id="page_count">-</span></div>
    </div>`;

  let pdfDoc = null, pageNum = 1, pageRendering = false, pageNumPending = null, scale = 1.2;
  const canvas = document.getElementById('pdf_render'), ctx = canvas.getContext('2d'), loader = document.getElementById('loader');

  function renderPage(num) {
    pageRendering = true; loader.style.display = 'block';
    pdfDoc.getPage(num).then(page => {
      const viewport = page.getViewport({ scale: scale * (window.innerWidth < 700 ? 0.7 : 1) });
      canvas.height = viewport.height; canvas.width = viewport.width;
      const renderContext = { canvasContext: ctx, viewport: viewport };
      page.render(renderContext).promise.then(() => {
        pageRendering = false; loader.style.display = 'none';
        if (pageNumPending !== null) { renderPage(pageNumPending); pageNumPending = null; }
      });
    });
    document.getElementById('page_num').textContent = num;
  }

  function queueRenderPage(num) { if (pageRendering) pageNumPending = num; else renderPage(num); }
  function onPrev() { if (pageNum <= 1) return; pageNum--; queueRenderPage(pageNum); }
  function onNext() {
    if (pageNum >= pdfDoc.numPages) { if (hasNextCb) hasNextCb(); return; }
    pageNum++; queueRenderPage(pageNum);
  }

  // Navegação
  document.getElementById('zoom_in').addEventListener('click', () => { scale += 0.2; renderPage(pageNum); });
  document.getElementById('zoom_out').addEventListener('click', () => { scale = Math.max(0.5, scale - 0.2); renderPage(pageNum); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') onNext();
    if (e.key === 'ArrowLeft') onPrev();
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > rect.width * 0.7) onNext();
    else if (x < rect.width * 0.3) onPrev();
  });

  pdfjsLib.getDocument(pdfUrl).promise.then(doc => {
    pdfDoc = doc; document.getElementById('page_count').textContent = doc.numPages; renderPage(pageNum);
  }).catch(err => {
    loader.style.display = 'none';
    document.getElementById('canvas_container').innerHTML = `<div class="no-res" style="display:block">Erro ao carregar PDF:<br>${pdfUrl}</div>`;
  });
}

// ============================================================
// Router Logic
// ============================================================

function renderReader(seriesSlug, comicSlug) {
  const serie = Object.values(window.SERIES_DATA).find(s => s.slug === seriesSlug);
  const comic = serie ? serie.comics.find(c => c.slug === comicSlug) : null;
  const nextComic = serie ? serie.comics.find(c => c.sortOrder === comic.sortOrder + 1) : null;
  const gdriveId = getComicGDriveId(comicSlug);

  if (gdriveId) {
    mountGDriveReader(gdriveId, comic.title, `#series/${seriesSlug}`, getGDriveDownloadUrl(gdriveId));
  } else {
    mountPDFCanvas(`comics/${seriesSlug}/${comicSlug}.pdf`, `#series/${seriesSlug}`, comic.title, () => {
      if (nextComic) window.location.hash = `#read/${seriesSlug}/${nextComic.slug}`;
    });
  }
}

function renderBookReader(bookSlug) {
  const book = BOOKS_DATA.find(b => b.slug === bookSlug);
  const gdriveId = getBookGDriveId(bookSlug);
  if (gdriveId) mountGDriveReader(gdriveId, book.title, '#home', getGDriveDownloadUrl(gdriveId));
  else mountPDFCanvas(`livros/${book.file}`, '#home', book.title);
}

function handleRoute() {
  const hash = window.location.hash || '#home';
  if (hash === '#home') renderHome();
  else if (hash.startsWith('#series/')) renderSeries(hash.replace('#series/', ''));
  else if (hash.startsWith('#read/')) {
    const p = hash.replace('#read/', '').split('/');
    renderReader(p[0], p[1]);
  } else if (hash.startsWith('#readbook/')) {
    renderBookReader(hash.replace('#readbook/', ''));
  }
}

window.toggleSearch = function () {
  const input = document.getElementById('searchInput');
  if (input) { input.classList.toggle('active'); input.focus(); }
};

window.filterSeries = function (val) {
  val = val.toLowerCase();
  let count = 0;
  document.querySelectorAll('.card').forEach(c => {
    const match = c.dataset.title.includes(val);
    c.style.display = match ? 'flex' : 'none';
    if (match) count++;
  });
  document.getElementById('noResults').style.display = count === 0 ? 'block' : 'none';
};

window.addEventListener('hashchange', handleRoute);
handleRoute();