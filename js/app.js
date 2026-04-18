// app.js - SPA Router and Logic (GitHub Pages + Google Drive Edition)

const app = document.getElementById('app');

const BOOKS_DATA = [
  { slug: 'sombras-do-imperio', title: 'Sombras do Império', file: 'sombras-do-imperio.pdf', cover: 'sombras-do-imperio-livro.jpg', eraId: 4, eraName: 'O Império em Guerra', chronoOrder: 295 },
  { slug: 'herdeiros-do-imperio', title: 'Herdeiros do Império', file: 'herdeiros-do-imperio.pdf', cover: 'herdeiros-do-imperio-livro.jpg', eraId: 5, eraName: 'A Nova República', chronoOrder: 10 },
  { slug: 'o-despertar-da-forca-negra', title: 'O Despertar da Força Negra', file: 'o-despertar-da-forca-negra.pdf', cover: 'o-despertar-da-forca-negra-livro.jpg', eraId: 5, eraName: 'A Nova República', chronoOrder: 20 },
  { slug: 'a-ultima-ordem', title: 'A Última Ordem', file: 'a-ultima-ordem.pdf', cover: 'a-ultima-ordem-livro.jpg', eraId: 5, eraName: 'A Nova República', chronoOrder: 30 }
];

// PROTEÇÃO ANTI-CÓPIA EXTREMA
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('copy', e => e.preventDefault());
document.addEventListener('paste', e => e.preventDefault());
document.addEventListener('cut', e => e.preventDefault());
document.addEventListener('dragstart', e => e.preventDefault());

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    const k = e.key.toLowerCase();
    if (['c', 'v', 'x', 's', 'p', 'u'].includes(k)) {
        e.preventDefault();
    }
  }
});

// ============================================================
// Google Drive Helper Functions
// ============================================================

function getGDriveViewerUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

function getGDriveDownloadUrl(fileId) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

function getComicGDriveId(comicSlug) {
  if (typeof GDRIVE_COMICS !== 'undefined' && GDRIVE_COMICS[comicSlug]) {
    const id = GDRIVE_COMICS[comicSlug];
    return id !== 'COLOQUE_O_ID_AQUI' ? id : null;
  }
  return null;
}

function getBookGDriveId(bookSlug) {
  if (typeof GDRIVE_BOOKS !== 'undefined' && GDRIVE_BOOKS[bookSlug]) {
    const id = GDRIVE_BOOKS[bookSlug];
    return id !== 'COLOQUE_O_ID_AQUI' ? id : null;
  }
  return null;
}

function isGDriveConfigured() {
  return typeof GDRIVE_CONFIG !== 'undefined';
}

// ============================================================
// App Router
// ============================================================

function handleRoute() {
  const hash = window.location.hash || '#home';
  app.innerHTML = '';
  
  if (hash === '#home') {
    renderHome();
  } else if (hash.startsWith('#series/')) {
    const seriesSlug = hash.replace('#series/', '');
    renderSeries(seriesSlug);
  } else if (hash.startsWith('#read/')) {
    const parts = hash.replace('#read/', '').split('/');
    const seriesSlug = parts[0];
    const comicSlug = parts[1];
    renderReader(seriesSlug, comicSlug);
  } else if (hash.startsWith('#readbook/')) {
    const bookSlug = hash.replace('#readbook/', '');
    renderBookReader(bookSlug);
  } else {
    renderHome();
  }
}

window.addEventListener('hashchange', handleRoute);

// Search Toggle Logic
window.toggleSearch = function() {
  const input = document.getElementById('searchInput');
  if (input) {
    if(input.classList.contains('active')){
      input.classList.remove('active');
      input.value = '';
      if(window.filterSeries) window.filterSeries('');
    } else {
      input.classList.add('active');
      input.focus();
    }
  }
};

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    const input = document.getElementById('searchInput');
    if(input){
      input.classList.add('active');
      input.focus();
    }
  }
  if (e.key === 'Escape') {
     const input = document.getElementById('searchInput');
     if(input && input.classList.contains('active')) {
        input.classList.remove('active');
        input.blur();
     }
  }
});

// Build Combined Chronological Data
function getChronologicalData() {
    let allItems = [];
    Object.values(window.SERIES_DATA || {}).forEach(s => {
        allItems.push({ ...s, viewType: 'comic' });
    });
    BOOKS_DATA.forEach(b => {
        allItems.push({ ...b, viewType: 'book' });
    });

    const eras = {};
    allItems.forEach(item => {
        let e = item.eraId || 99;
        if(!eras[e]) eras[e] = { id: e, name: item.eraName || "Desconhecido", items: [] };
        eras[e].items.push(item);
    });

    const sortedEras = Object.values(eras).sort((a,b) => a.id - b.id);
    sortedEras.forEach(era => {
        era.items.sort((a,b) => (a.chronoOrder||999) - (b.chronoOrder||999));
    });
    
    return sortedEras;
}

// Home View
function renderHome() {
  const searchIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

  const erasData = getChronologicalData();

  let erasHTML = erasData.map(era => {
      let cardsHTML = era.items.map(item => {
          if (item.viewType === 'book') {
              return `
              <a class="card book-card" href="#readbook/${item.slug}" data-title="${item.title.toLowerCase()}">
                <div class="cover">
                  <img src="book-covers/${item.cover}" loading="lazy" onerror="this.onerror=null; this.src='covers/placeholder.webp';">
                </div>
                <div class="card-info">
                  <div class="card-title">${item.title}</div>
                  <div class="card-meta">📖 Romance</div>
                </div>
              </a>`;
          } else {
              const sortedComics = item.comics.sort((a,b) => a.sortOrder - b.sortOrder);
              const firstComic = sortedComics[0];
              let coverSrc = firstComic ? (firstComic.coverPath || '').replace(/^[\/\\]/, '') : '';
              let fallbackSrc = firstComic ? `covers/${firstComic.slug}.webp` : '';
              let oldIndexFallback = `covers/${item.slug}-01.webp`;
              
              return `
              <a class="card serie-card" href="#series/${item.slug}" data-title="${item.title.toLowerCase()}">
                <div class="cover">
                  <img src="${coverSrc}" loading="lazy" onerror="this.onerror=null; this.src='${fallbackSrc}'; this.onerror=function(){this.src='${oldIndexFallback}';};">
                </div>
                <div class="card-info">
                  <div class="card-title">${item.title}</div>
                  <div class="card-meta">${item.comics.length} edições</div>
                </div>
              </a>`;
          }
      }).join('');

      return `
      <div class="era-section">
        <h3 class="section-title era-title">
           <span class="era-badge">Era</span> ${era.name}
        </h3>
        <div class="grid">${cardsHTML}</div>
      </div>
      `;
  }).join('');

  const html = `
    <header>
      <div class="brand" onclick="window.location.hash='#home'">
        <h1>HQ Star Wars</h1>
        <span>Acervo Master</span>
      </div>
      <div class="search-container">
        <button class="search-icon" onclick="toggleSearch()" title="Procurar (Ctrl+K)">
           ${searchIconSvg}
        </button>
        <input type="text" id="searchInput" class="search-input" placeholder="Buscar na galáxia..." oninput="filterSeries(this.value)">
        <span class="search-shortcut"></span>
      </div>
    </header>
    
    <main>
      <div id="chrono-container">
         ${erasHTML}
      </div>
      <div id="noResults" class="no-res">Nenhuma evidência encontrada nestes sistemas.</div>
    </main>
  `;
  app.innerHTML = html;
}

// Global filter
window.filterSeries = function(val) {
  val = val.toLowerCase();
  let cards = document.querySelectorAll('.card');
  let count = 0;
  cards.forEach(c => {
    if (c.dataset.title.includes(val)) {
      c.style.display = 'flex';
      count++;
    } else {
      c.style.display = 'none';
    }
  });
  
  // Ocultar Eras vazias
  document.querySelectorAll('.era-section').forEach(sec => {
      let visibleCards = sec.querySelectorAll('.card[style="display: flex;"], .card:not([style*="display: none"])');
      if (val && visibleCards.length === 0) {
          sec.style.display = 'none';
      } else {
          sec.style.display = 'block';
      }
  });

  const noRes = document.getElementById('noResults');
  if(noRes) noRes.style.display = count === 0 ? 'block' : 'none';
}

// Series List Detail
function renderSeries(slug) {
  const serie = Object.values(window.SERIES_DATA).find(s => s.slug === slug);
  if (!serie) return renderHome();
  
  const comics = serie.comics.sort((a,b) => a.sortOrder - b.sortOrder);
  
  const html = `
    <header>
      <div class="brand" onclick="window.location.hash='#home'">
        <h1>HQ Star Wars</h1>
        <span>Acervo Master</span>
      </div>
    </header>
    
    <main>
      <div class="view-header">
         <a href="#home" class="btn-back" title="Voltar">&#8592;</a>
         <h2 style="color: var(--text-primary); font-size:1.4rem">${serie.title}</h2>
      </div>
      
      <div class="grid">
        ${comics.map(c => `
          <a class="card" href="#read/${serie.slug}/${c.slug}">
            <div class="cover">
              <img src="${(c.coverPath || '').replace(/^[\/\\]/, '')}" loading="lazy" onerror="this.onerror=null; this.src='covers/${c.slug}.webp';">
            </div>
            <div class="card-info">
              <div class="card-title">${c.title}</div>
            </div>
          </a>
        `).join('')}
      </div>
    </main>
  `;
  app.innerHTML = html;
  window.scrollTo(0,0);
}

// ============================================================
// Google Drive Iframe Reader (Comics - no CORS issues)
// ============================================================

function mountGDriveReader(fileId, displayName, backUrl, downloadUrl) {
  const viewerUrl = getGDriveViewerUrl(fileId);
  
  app.innerHTML = `
    <div id="reader-container">
      <div class="reader-toolbar" id="toolbar">
        <a href="${backUrl}" class="btn-back" title="Sair do modo leitura">&#8592;</a>
        <div class="reader-title">${displayName}</div>
        <div class="reader-controls">
          <a href="${downloadUrl}" target="_blank" class="reader-btn" title="Baixar PDF Original" style="text-decoration:none; display:flex; align-items:center;">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </a>
        </div>
      </div>
      
      <div class="gdrive-frame-container">
        <iframe src="${viewerUrl}" 
                allow="autoplay; fullscreen" 
                allowfullscreen 
                loading="lazy"
                class="gdrive-iframe">
        </iframe>
      </div>
    </div>
  `;
  
  window.scrollTo(0,0);
}

// ============================================================
// PDF.js Canvas Reader (for local/small PDFs like books)
// ============================================================

function mountPDFCanvas(pdfUrl, backUrl, displayName, hasNextCb) {
  app.innerHTML = `
    <div id="reader-container">
      <div class="reader-toolbar" id="toolbar">
        <a href="${backUrl}" class="btn-back" title="Sair do modo leitura">&#8592;</a>
        <div class="reader-title">${displayName}</div>
        <div class="reader-controls">
          <a href="${pdfUrl}" target="_blank" class="reader-btn" title="Acessar/Baixar PDF Original" style="text-decoration:none; display:flex; align-items:center;" download>
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </a>
          <button class="reader-btn" id="zoom_out">-</button>
          <button class="reader-btn" id="zoom_in">+</button>
        </div>
      </div>
      
      <div class="reader-canvas-container" id="canvas_container">
        <div class="loader" id="loader"></div>
        <canvas id="pdf_render"></canvas>
      </div>
      
      <div class="reader-footer" id="reader-footer">
        Página <span id="page_num">-</span>/<span id="page_count">-</span><br>
        <span style="opacity:0.6;font-size:0.75rem">Toque nas bordas laterais para virar. Toque no centro para exibir/recolher barras.</span>
      </div>
    </div>
  `;

  let pdfDoc = null,
      pageNum = 1,
      pageRendering = false,
      pageNumPending = null,
      scale = window.innerWidth < 640 ? 0.8 : 1.0,
      canvas = document.getElementById('pdf_render'),
      ctx = canvas.getContext('2d');

  const loader = document.getElementById('loader');
  loader.style.display = 'block';

  function renderPage(num) {
    pageRendering = true;
    loader.style.display = 'block';
    
    pdfDoc.getPage(num).then(function(page) {
      const container = document.getElementById('canvas_container');
      const cw = container.clientWidth;
      
      let unscaledViewport = page.getViewport({scale: 1.0});
      let calculatedScale = ((cw - 20) / unscaledViewport.width) * scale;
      if (calculatedScale > 3.0) calculatedScale = 3.0;
      
      let viewport = page.getViewport({ scale: calculatedScale });
      
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = viewport.width * pixelRatio;
      canvas.height = viewport.height * pixelRatio;
      canvas.style.width = viewport.width + 'px';
      canvas.style.height = viewport.height + 'px';
      
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      let renderContext = { canvasContext: ctx, viewport: viewport };
      
      let renderTask = page.render(renderContext);
      renderTask.promise.then(function() {
        pageRendering = false;
        loader.style.display = 'none';
        document.getElementById('canvas_container').scrollTo(0, 0);

        if (pageNumPending !== null) {
          renderPage(pageNumPending);
          pageNumPending = null;
        }
      });
    }).catch(err => {
        console.error(err);
        loader.style.display = 'none';
    });

    document.getElementById('page_num').textContent = num;
  }

  function queueRenderPage(num) {
    if (pageRendering) { pageNumPending = num; } else { renderPage(num); }
  }

  function onPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
  }

  function onNextPage() {
    if (pdfDoc && pageNum >= pdfDoc.numPages) {
       if (hasNextCb) hasNextCb();
       return;
    }
    pageNum++;
    queueRenderPage(pageNum);
  }

  // Keyboard Navigation
  function keyHandler(e) {
    if (!window.location.hash.startsWith('#read')) {
        document.removeEventListener('keydown', keyHandler);
        return;
    }
    if (e.key === 'ArrowLeft') onPrevPage();
    if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        onNextPage();
    }
  }
  document.addEventListener('keydown', keyHandler);

  document.getElementById('zoom_in').addEventListener('click', () => { scale += 0.2; queueRenderPage(pageNum); });
  document.getElementById('zoom_out').addEventListener('click', () => { scale = Math.max(0.4, scale - 0.2); queueRenderPage(pageNum); });

  // MANUAL EXPLICIT TOGGLE LOGIC
  let menusVisible = true;
  const toolbar = document.getElementById('toolbar');
  const rFooter = document.getElementById('reader-footer');
  
  function toggleMenus() {
      menusVisible = !menusVisible;
      if(menusVisible) {
          toolbar.classList.remove('hidden');
          rFooter.style.opacity = '1';
      } else {
          toolbar.classList.add('hidden');
          rFooter.style.opacity = '0';
      }
  }

  setTimeout(() => {
      if(menusVisible) toggleMenus();
  }, 2000);
  
  const container = document.getElementById('reader-container');
  
  container.addEventListener('click', function(e) {
     if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A' && e.target.closest('a') === null) {
         const rect = this.getBoundingClientRect();
         if (e.clientX > rect.width * 0.70) {
             onNextPage();
             if(menusVisible) toggleMenus();
         }
         else if (e.clientX < rect.width * 0.30) {
             onPrevPage();
             if(menusVisible) toggleMenus();
         }
         else {
             toggleMenus();
         }
     }
  });

  pdfjsLib.getDocument(pdfUrl).promise.then(function(pdfDoc_) {
    pdfDoc = pdfDoc_;
    document.getElementById('page_count').textContent = pdfDoc.numPages;
    renderPage(pageNum);
  }).catch(err => {
    loader.style.display = 'none';
    canvas.style.display = 'none';
    document.getElementById('canvas_container').innerHTML += `<div style="color:#ff2a2a;text-align:center;margin-top:20%;background:rgba(0,0,0,0.8);padding:2rem;"><b>Erro: Arquivo Inexistente</b><br><br>${pdfUrl}</div>`;
  });
}

// ============================================================
// Reader Router - Decides which reader to use
// ============================================================

function renderReader(seriesSlug, comicSlug) {
  const serie = Object.values(window.SERIES_DATA || {}).find(s => s.slug === seriesSlug);
  const comic = serie ? serie.comics.find(c => c.slug === comicSlug) : null;
  const title = comic ? comic.title : "Carregando HQ...";
  const nextComic = serie ? serie.comics.find(c => c.sortOrder === (comic ? comic.sortOrder + 1 : 999)) : null;
  const backUrl = `#series/${seriesSlug}`;

  // Check if Google Drive mapping exists
  const gdriveId = getComicGDriveId(comicSlug);
  
  if (gdriveId) {
    // Use Google Drive viewer (iframe - no CORS issues)
    const downloadUrl = getGDriveDownloadUrl(gdriveId);
    mountGDriveReader(gdriveId, title, backUrl, downloadUrl);
  } else {
    // Fallback: try local PDF.js (only works if PDFs are local)
    const pdfUrl = `comics/${seriesSlug}/${comicSlug}.pdf`;
    mountPDFCanvas(pdfUrl, backUrl, title, () => {
        if (nextComic) window.location.hash = `#read/${seriesSlug}/${nextComic.slug}`;
    });
  }
}

function renderBookReader(bookSlug) {
  const book = BOOKS_DATA.find(b => b.slug === bookSlug);
  if(!book) return renderHome();
  
  // Check if Google Drive mapping exists for this book
  const gdriveId = getBookGDriveId(bookSlug);
  
  if (gdriveId) {
    // Use Google Drive viewer
    const downloadUrl = getGDriveDownloadUrl(gdriveId);
    mountGDriveReader(gdriveId, book.title, '#home', downloadUrl);
  } else {
    // Fallback: try local PDF.js (books are small enough for GitHub Pages)
    const pdfUrl = `livros/${book.file}`;
    mountPDFCanvas(pdfUrl, `#home`, book.title, null);
  }
}

handleRoute();
