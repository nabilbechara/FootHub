/* FootHub Pro — Product Page
   =========================== */

(function() {
  const form = document.getElementById('product-form');
  const galleryMain = document.getElementById('gallery-main');
  const galleryMainImg = document.getElementById('gallery-main-img');
  const thumbs = document.querySelectorAll('.product-gallery__thumb');
  const variantBtns = document.querySelectorAll('.variant-btn');
  const colorBtns = document.querySelectorAll('.color-variant-btn');
  const priceEl = document.getElementById('product-price');
  const priceWasEl = document.getElementById('product-price-was');
  const priceSaveEl = document.getElementById('product-price-save');
  const availabilityEl = document.getElementById('product-availability');
  const atcBtn = document.getElementById('atc-btn');
  const stickyAtcBtn = document.getElementById('sticky-atc-btn');
  const stickyAtcPrice = document.getElementById('sticky-atc-price');
  const variantInput = document.getElementById('variant-id');
  const productJson = document.getElementById('product-json');

  if (!productJson) return;
  const product = JSON.parse(productJson.textContent);
  let currentVariant = product.variants.find(v => v.available) || product.variants[0];

  function formatMoney(cents) {
    return window.formatMoney ? window.formatMoney(cents) : `£${(cents / 100).toFixed(2)}`;
  }

  // Gallery
  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
      const imgUrl = thumb.dataset.src;
      if (galleryMainImg && imgUrl) {
        galleryMainImg.style.opacity = '0';
        setTimeout(() => {
          galleryMainImg.src = imgUrl;
          galleryMainImg.style.opacity = '1';
        }, 100);
      }
    });
  });

  // Gallery zoom on desktop
  if (galleryMain) {
    galleryMain.addEventListener('click', () => {
      const currentSrc = galleryMainImg?.src;
      if (!currentSrc) return;
      const modal = document.createElement('div');
      modal.className = 'gallery-zoom-modal';
      modal.innerHTML = `
        <div class="gallery-zoom-backdrop" onclick="this.parentElement.remove()"></div>
        <img class="gallery-zoom-img" src="${currentSrc.replace('_600x', '_1200x').replace('_medium', '_2048x2048')}" alt="">
        <button class="gallery-zoom-close" onclick="this.parentElement.remove()" aria-label="Close">✕</button>
      `;
      document.body.appendChild(modal);
      document.body.style.overflow = 'hidden';
      modal.querySelector('.gallery-zoom-backdrop').addEventListener('click', () => {
        modal.remove();
        document.body.style.overflow = '';
      });
    });
  }

  // Variant selection
  function selectVariant(options) {
    const variant = product.variants.find(v => {
      return options.every((opt, i) => v.options[i] === opt);
    });
    if (!variant) return;
    currentVariant = variant;
    updateUI(variant);
  }

  function updateUI(variant) {
    // Update price
    if (priceEl) priceEl.textContent = formatMoney(variant.price);
    if (priceWasEl) {
      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        priceWasEl.textContent = formatMoney(variant.compare_at_price);
        priceWasEl.style.display = 'inline';
        const savings = Math.round((1 - variant.price / variant.compare_at_price) * 100);
        if (priceSaveEl) { priceSaveEl.textContent = `${savings}% off`; priceSaveEl.style.display = 'inline'; }
      } else {
        priceWasEl.style.display = 'none';
        if (priceSaveEl) priceSaveEl.style.display = 'none';
      }
    }

    // Update availability
    if (availabilityEl) {
      if (variant.available) {
        availabilityEl.textContent = 'In Stock';
        availabilityEl.style.color = '#16a34a';
      } else {
        availabilityEl.textContent = 'Out of Stock';
        availabilityEl.style.color = 'var(--color-text-muted)';
      }
    }

    // Update ATC button
    if (atcBtn) {
      atcBtn.disabled = !variant.available;
      atcBtn.textContent = variant.available ? 'Add to Bag' : 'Sold Out';
    }
    if (stickyAtcBtn) {
      stickyAtcBtn.disabled = !variant.available;
      stickyAtcBtn.textContent = variant.available ? 'Add to Bag' : 'Sold Out';
    }
    if (stickyAtcPrice) stickyAtcPrice.textContent = formatMoney(variant.price);

    // Update variant input
    if (variantInput) variantInput.value = variant.id;

    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    history.replaceState({}, '', url.toString());

    // Update image if variant has one
    if (variant.featured_image) {
      const matchThumb = Array.from(thumbs).find(t => t.dataset.mediaId === String(variant.featured_image.id));
      matchThumb?.click();
    }
  }

  // Size/option buttons
  variantBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const optionIndex = parseInt(btn.dataset.optionIndex, 10);
      const value = btn.dataset.value;

      // Deactivate siblings
      document.querySelectorAll(`.variant-btn[data-option-index="${optionIndex}"]`)
        .forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      // Collect all current selections
      const options = [];
      product.options.forEach((_, i) => {
        const activeBtn = document.querySelector(`.variant-btn[data-option-index="${i}"].is-active`);
        options[i] = activeBtn ? activeBtn.dataset.value : product.variants[0].options[i];
      });

      selectVariant(options);
    });
  });

  // Color buttons
  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const optionIndex = parseInt(btn.dataset.optionIndex, 10);
      document.querySelectorAll(`.color-variant-btn[data-option-index="${optionIndex}"]`)
        .forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const options = [];
      product.options.forEach((_, i) => {
        const activeBtn = document.querySelector(`.variant-btn[data-option-index="${i}"].is-active`)
          || document.querySelector(`.color-variant-btn[data-option-index="${i}"].is-active`);
        options[i] = activeBtn ? activeBtn.dataset.value : product.variants[0].options[i];
      });
      selectVariant(options);
    });
  });

  // ATC form submit
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentVariant || !currentVariant.available) return;

    const btn = atcBtn;
    const originalText = btn?.textContent;
    if (btn) { btn.disabled = true; btn.textContent = 'Adding...'; }

    try {
      await window.addToCart(currentVariant.id, 1);
      if (btn) {
        btn.textContent = 'Added! ✓';
        btn.style.background = '#16a34a';
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = originalText;
          btn.style.background = '';
        }, 1800);
      }
      window.showToast?.('Added to your bag!', 'success');
    } catch {
      if (btn) { btn.disabled = false; btn.textContent = originalText; }
    }
  });

  // Sticky ATC
  stickyAtcBtn?.addEventListener('click', () => form?.dispatchEvent(new Event('submit')));

  // Quantity selector
  document.querySelectorAll('.quantity-selector__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.quantity-selector')?.querySelector('.quantity-selector__input');
      if (!input) return;
      const current = parseInt(input.value, 10);
      const newVal = btn.dataset.action === 'increase' ? current + 1 : Math.max(1, current - 1);
      input.value = newVal;
    });
  });

  // Initialise with first available variant
  updateUI(currentVariant);

})();
