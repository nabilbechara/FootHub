/* FootHub Pro — Search Overlay
   ============================== */

const SearchOverlay = (() => {
  const overlay = document.getElementById('search-overlay');
  const backdrop = document.getElementById('search-overlay-backdrop');
  const closeBtn = document.getElementById('search-overlay-close');
  const input = document.getElementById('search-overlay-input');
  const clearBtn = document.getElementById('search-overlay-clear');
  const resultsEl = document.getElementById('search-overlay-results');
  const searchTriggers = document.querySelectorAll('[data-search-trigger]');

  let searchTimer;

  function open() {
    overlay?.classList.add('is-open');
    overlay?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input?.focus(), 60);
  }

  function close() {
    overlay?.classList.remove('is-open');
    overlay?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    showTrending();
  }

  window.closeSearchOverlay = close;

  function showTrending() {
    if (!resultsEl) return;
    resultsEl.innerHTML = `
      <div class="search-overlay__trending" style="max-width:var(--page-width);margin-inline:auto">
        <p class="search-overlay__label">Trending Searches</p>
        <div class="search-overlay__tags">
          <a href="/search?q=football+boots&type=product" class="search-tag">Football Boots</a>
          <a href="/search?q=jerseys&type=product" class="search-tag">Jerseys</a>
          <a href="/search?q=goalkeeper&type=product" class="search-tag">Goalkeeper</a>
          <a href="/search?q=training&type=product" class="search-tag">Training Gear</a>
          <a href="/search?q=new+arrivals&type=product" class="search-tag">New Arrivals</a>
          <a href="/search?q=sale&type=product" class="search-tag">Sale</a>
        </div>
      </div>`;
  }

  async function search(query) {
    if (!query || query.length < 2) { showTrending(); return; }

    resultsEl.innerHTML = '<div style="padding:2rem;text-align:center"><div class="spinner"></div></div>';

    try {
      const res = await fetch(`/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=6&resources[options][fields]=title,product_type,variants.title`);
      const data = await res.json();
      const products = data?.resources?.results?.products || [];
      renderResults(products, query);
    } catch {
      resultsEl.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:2rem">No results found</p>';
    }
  }

  function renderResults(products, query) {
    if (!products.length) {
      resultsEl.innerHTML = `
        <div style="max-width:var(--page-width);margin-inline:auto">
          <p style="color:var(--color-text-muted);font-size:0.875rem;margin-bottom:1.5rem">No products found for "<strong>${query}</strong>"</p>
          <a href="/search?q=${encodeURIComponent(query)}&type=product" class="btn btn--outline">View All Results</a>
        </div>`;
      return;
    }

    const html = `
      <div style="max-width:var(--page-width);margin-inline:auto">
        <p class="search-overlay__label" style="margin-bottom:1rem">Products</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem">
          ${products.map(p => `
            <a href="${p.url}" class="search-result-item" onclick="window.closeSearchOverlay()">
              <img class="search-result-img" src="${p.featured_image?.url ? p.featured_image.url.replace('.jpg', '_120x.jpg') : ''}"
                alt="${p.title}" loading="lazy" width="56" height="56">
              <div class="search-result-info">
                <div class="search-result-title">${p.title}</div>
                <div class="search-result-price">${window.formatMoney ? window.formatMoney(p.price) : '£' + (p.price / 100).toFixed(2)}</div>
              </div>
            </a>
          `).join('')}
        </div>
        <a href="/search?q=${encodeURIComponent(query)}&type=product" class="btn btn--ghost" style="margin-top:1.5rem;font-size:0.875rem" onclick="window.closeSearchOverlay()">
          See all results for "${query}" →
        </a>
      </div>`;
    resultsEl.innerHTML = html;
  }

  // Events
  searchTriggers.forEach(btn => btn.addEventListener('click', open));
  closeBtn?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);

  input?.addEventListener('input', e => {
    const val = e.target.value.trim();
    if (clearBtn) clearBtn.style.display = val ? 'flex' : 'none';
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => search(val), 280);
  });

  clearBtn?.addEventListener('click', () => {
    if (input) input.value = '';
    clearBtn.style.display = 'none';
    input?.focus();
    showTrending();
  });

  showTrending();

  return { open, close };
})();
