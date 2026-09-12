/* FootHub Pro — Global JS
   ========================= */

// Scroll-reveal animations
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-up, .scale-in').forEach(el => revealObserver.observe(el));

// Header scroll behavior
const header = document.querySelector('.site-header');
if (header) {
  let lastScroll = 0;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const currentScroll = window.scrollY;
        header.classList.toggle('is-scrolled', currentScroll > 10);
        if (currentScroll > 120) {
          header.classList.toggle('is-hidden', currentScroll > lastScroll && currentScroll > 200);
        } else {
          header.classList.remove('is-hidden');
        }
        lastScroll = currentScroll;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// Mobile drawer
const mobileBtn = document.getElementById('mobile-menu-btn');
const mobileDrawer = document.getElementById('mobile-drawer');
const mobileClose = document.getElementById('mobile-drawer-close');
const mobileOverlay = document.getElementById('mobile-drawer-overlay');

function openMobileMenu() {
  mobileDrawer?.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  mobileBtn?.classList.add('is-open');
  mobileBtn?.setAttribute('aria-expanded', 'true');
}

function closeMobileMenu() {
  mobileDrawer?.classList.remove('is-open');
  document.body.style.overflow = '';
  mobileBtn?.classList.remove('is-open');
  mobileBtn?.setAttribute('aria-expanded', 'false');
}

mobileBtn?.addEventListener('click', () => {
  mobileDrawer?.classList.contains('is-open') ? closeMobileMenu() : openMobileMenu();
});
mobileClose?.addEventListener('click', closeMobileMenu);
mobileOverlay?.addEventListener('click', closeMobileMenu);

// Mobile nav sub-menus
document.querySelectorAll('.mobile-nav__link[data-has-sub]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const subList = link.nextElementSibling;
    const isOpen = subList?.classList.contains('is-open');
    document.querySelectorAll('.mobile-nav__sub-list.is-open').forEach(l => l.classList.remove('is-open'));
    if (!isOpen && subList) subList.classList.add('is-open');
  });
});

// Accordion
document.querySelectorAll('.accordion-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const item = trigger.closest('.accordion-item');
    const isOpen = item.classList.contains('is-open');
    item.classList.toggle('is-open', !isOpen);
    trigger.setAttribute('aria-expanded', String(!isOpen));
  });
});

// Sticky ATC visibility — observe bundle tier btn if present, else main ATC
const stickyAtc = document.querySelector('.sticky-atc');
const atcBtn = document.querySelector('.bundle-tier-add-btn') || document.querySelector('.btn--atc');
if (stickyAtc && atcBtn) {
  const atcObserver = new IntersectionObserver(([entry]) => {
    stickyAtc.classList.toggle('is-visible', !entry.isIntersecting);
  }, { threshold: 0, rootMargin: '-80px 0px 0px 0px' });
  atcObserver.observe(atcBtn);
}

// Format money
function formatMoney(cents, format) {
  if (!format) format = window.__FOOTHUB__?.moneyFormat || '£{{amount}}';
  const amount = (cents / 100).toFixed(2);
  return format.replace('{{amount}}', amount).replace('{{amount_no_decimals}}', Math.floor(cents / 100));
}
window.formatMoney = formatMoney;

// Toast notification
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast is-visible${type ? ' is-' + type : ''}`;
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('is-visible'), 3200);
}
window.showToast = showToast;

// Escape key handler
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeMobileMenu();
    window.closeCartDrawer?.();
    window.closeSearchOverlay?.();
  }
});

// Hero slider
const heroSlider = document.querySelector('.hero-slider');
if (heroSlider) {
  const slides = heroSlider.querySelectorAll('.hero-slider__slide');
  const dots = heroSlider.querySelectorAll('.hero-slider__dot');
  let current = 0;
  let timer;

  function goToSlide(n) {
    slides[current].classList.remove('is-active');
    dots[current]?.classList.remove('is-active');
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    dots[current]?.classList.add('is-active');
  }

  function startTimer() {
    timer = setInterval(() => goToSlide(current + 1), 5500);
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { clearInterval(timer); goToSlide(i); startTimer(); });
  });

  if (slides.length > 1) startTimer();
}

// Smooth anchor scrolling
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── Quick-size chips on product cards ──
document.addEventListener('click', e => {
  const chip = e.target.closest('.qs-chip[data-variant-id]');
  if (!chip) return;
  e.preventDefault();
  e.stopPropagation();
  const variantId = chip.dataset.variantId;
  const title = chip.dataset.productTitle || 'Item';
  if (!variantId) return;
  chip.disabled = true;
  chip.textContent = '✓';
  window.addToCart
    ? window.addToCart(variantId, 1)
        .then(() => { setTimeout(() => { chip.disabled = false; chip.textContent = chip.dataset.origText || chip.textContent; }, 1200); })
        .catch(() => { chip.disabled = false; })
    : fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: 1 })
      }).then(r => r.json()).then(() => {
        window.showToast?.(`Added to bag`, 'success');
        window.openCartDrawer?.();
        setTimeout(() => { chip.disabled = false; }, 1200);
      }).catch(() => { chip.disabled = false; });
});

// ── Bundle Tier Picker ──

// ── Bundle Tier Picker ──

function updateBundlePrice(body) {
  const discount      = Number(body.dataset.discount || 0);
  const priceOverride = Number(body.dataset.priceOverride || 0);
  const basePrice     = Number(body.dataset.basePrice || 0);
  const fixedTotal    = Number(body.dataset.fixedTotal || 0);

  // Choice price: from selected jersey size, legacy radio, or the first jersey
  // price from Liquid (so the initial JS render matches the Liquid-rendered price)
  const selectedSizeBtn    = body.querySelector('.bundle-size-btn.is-selected');
  const selectedRadio      = body.querySelector('.bundle-picker__radio:checked');
  const firstChoicePrice   = Number(body.dataset.firstChoicePrice || 0);
  const choicePrice = selectedSizeBtn
    ? Number(selectedSizeBtn.dataset.price || 0)
    : selectedRadio
      ? Number(selectedRadio.closest('.bundle-picker__option')?.dataset.price || 0)
      : firstChoicePrice;

  const discountCode        = body.dataset.discountCode?.trim();
  const discountFixedAmount = Number(body.dataset.discountFixedAmount || 0);
  const original    = basePrice + fixedTotal + choicePrice;
  const bundlePrice = priceOverride > 0
    ? priceOverride
    : discountFixedAmount > 0
      ? original - discountFixedAmount
      : discountCode
        ? original - Math.round(choicePrice * discount / 100)
        : original - Math.round(original * discount / 100);

  const fmt = p => window.formatMoney ? window.formatMoney(p) : `£${(p / 100).toFixed(2)}`;
  const wasEl = body.querySelector('[data-bundle-original]');
  const nowEl = body.querySelector('[data-bundle-price]');
  if (wasEl) wasEl.textContent = fmt(original);
  if (nowEl) nowEl.textContent = fmt(bundlePrice);

  const badgeEl = body.closest('.bundle-tier-option')?.querySelector('.bundle-tier-option__badge');
  if (badgeEl && original > 0) {
    const pct = Math.round((original - bundlePrice) * 100 / original);
    badgeEl.textContent = pct > 0 ? `Save ${pct}%` : '';
    badgeEl.style.display = pct > 0 ? '' : 'none';
  }
}

document.querySelectorAll('.bundle-tier-option__body[data-bundle-block]').forEach(updateBundlePrice);

// Init sticky ATC label to match the pre-selected tier
(function() {
  const picker = document.querySelector('.bundle-tier-picker');
  const preChecked = picker?.querySelector('.bundle-tier-radio:checked');
  const stickyBtn = document.getElementById('sticky-atc-btn');
  if (stickyBtn && preChecked && preChecked.value !== 'solo') {
    stickyBtn.textContent = 'Add Bundle to Bag';
  }
})();

// Tier radio change (shoes-only vs bundle)
document.addEventListener('change', e => {
  const radio = e.target.closest('.bundle-tier-radio');
  if (!radio) return;
  const picker = radio.closest('.bundle-tier-picker');
  if (!picker) return;
  picker.querySelectorAll('.bundle-tier-option').forEach(opt => opt.classList.remove('is-selected'));
  radio.closest('.bundle-tier-option')?.classList.add('is-selected');
  // Clear all jersey picker hints on tier switch
  picker.querySelectorAll('.bundle-jersey-picker__hint').forEach(h => h.textContent = '');
  const stickyBtn = document.getElementById('sticky-atc-btn');
  if (stickyBtn) stickyBtn.textContent = radio.value === 'solo' ? 'Add to Bag' : 'Add Bundle to Bag';
});

// Jersey card click — show its size panel
document.addEventListener('click', e => {
  const card = e.target.closest('.bundle-jersey-card');
  if (!card) return;
  const jerseyPicker = card.closest('.bundle-jersey-picker');
  if (!jerseyPicker) return;

  const idx = card.dataset.productIdx;

  // Highlight card
  jerseyPicker.querySelectorAll('.bundle-jersey-card').forEach(c => {
    c.classList.remove('is-selected');
    c.setAttribute('aria-pressed', 'false');
  });
  card.classList.add('is-selected');
  card.setAttribute('aria-pressed', 'true');

  // Show matching size panel, hide others
  jerseyPicker.querySelectorAll('.bundle-size-panel').forEach(p => p.hidden = true);
  const panel = jerseyPicker.querySelector(`.bundle-size-panel[data-for-idx="${idx}"]`);
  if (panel) panel.hidden = false;

  // Clear previous size selection
  jerseyPicker.querySelector('.bundle-choice-variant').value = '';
  panel?.querySelectorAll('.bundle-size-btn').forEach(b => b.classList.remove('is-selected'));

  const hint = jerseyPicker.querySelector('.bundle-jersey-picker__hint');
  if (hint) hint.textContent = 'Now select your size below';
});

// Size button click — store variant and update price
document.addEventListener('click', e => {
  const sizeBtn = e.target.closest('.bundle-size-btn');
  if (!sizeBtn || sizeBtn.disabled) return;
  const panel = sizeBtn.closest('.bundle-size-panel');
  const jerseyPicker = panel?.closest('.bundle-jersey-picker');
  if (!jerseyPicker) return;

  panel.querySelectorAll('.bundle-size-btn').forEach(b => b.classList.remove('is-selected'));
  sizeBtn.classList.add('is-selected');
  jerseyPicker.querySelector('.bundle-choice-variant').value = sizeBtn.dataset.variantId;

  const hint = jerseyPicker.querySelector('.bundle-jersey-picker__hint');
  if (hint) hint.textContent = '';

  const body = jerseyPicker.closest('.bundle-tier-option__body[data-bundle-block]');
  if (body) updateBundlePrice(body);
});

// Unified Add to Bag
document.addEventListener('click', e => {
  const btn = e.target.closest('.bundle-tier-add-btn');
  if (!btn) return;
  const picker = btn.closest('.bundle-tier-picker');
  if (!picker) return;

  const selectedRadio = picker.querySelector('.bundle-tier-radio:checked');
  const isSolo = !selectedRadio || selectedRadio.value === 'solo';
  const mainVariantId = Number(document.getElementById('variant-id')?.value || picker.dataset.mainVariant);
  if (!mainVariantId) return;

  // Bundle mode — validate jersey + size if picker is present
  if (!isSolo) {
    const body = picker.querySelector(`.bundle-tier-option__body[data-bundle-block="${selectedRadio.value}"]`);
    const jerseyPicker = body?.querySelector('.bundle-jersey-picker');
    if (jerseyPicker) {
      const choiceVal = jerseyPicker.querySelector('.bundle-choice-variant')?.value;
      if (!choiceVal) {
        const hint = jerseyPicker.querySelector('.bundle-jersey-picker__hint');
        if (hint) hint.textContent = !jerseyPicker.querySelector('.bundle-jersey-card.is-selected')
          ? 'Please select a jersey first'
          : 'Please select a size';
        jerseyPicker.querySelector('.bundle-jersey-picker__grid')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
    }
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;margin:0 auto"></span>';

  if (isSolo) {
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: mainVariantId, quantity: 1 })
    }).then(r => r.json()).then(() => {
      btn.innerHTML = '✓ Added!';
      window.showToast?.('Added to bag', 'success');
      window.openCartDrawer?.();
      setTimeout(() => { btn.disabled = false; btn.innerHTML = 'Add to Bag'; }, 2500);
    }).catch(() => {
      btn.disabled = false; btn.innerHTML = 'Add to Bag';
      window.showToast?.('Could not add — try again', 'error');
    });
    return;
  }

  const body = picker.querySelector(`.bundle-tier-option__body[data-bundle-block="${selectedRadio.value}"]`);
  if (!body) return;

  const discountCode        = body.dataset.discountCode?.trim();
  const discountFixedAmount = Number(body.dataset.discountFixedAmount || 0);

  const priceOverride = Number(body.dataset.priceOverride || 0);
  const basePrice = Number(body.dataset.basePrice || 0);
  const fixedTotal = Number(body.dataset.fixedTotal || 0);
  const discount = Number(body.dataset.discount || 0);
  const firstChoicePrice = Number(body.dataset.firstChoicePrice || 0);
  const selectedSizeBtn = body.querySelector('.bundle-size-btn.is-selected');
  const choicePrice = selectedSizeBtn ? Number(selectedSizeBtn.dataset.price || 0) : firstChoicePrice;
  const baseTotalCents = basePrice + fixedTotal + choicePrice;
  const bundlePriceCents = priceOverride > 0
    ? priceOverride
    : discountFixedAmount > 0
      ? baseTotalCents - discountFixedAmount
      : discountCode
        ? baseTotalCents - Math.round(choicePrice * discount / 100)
        : baseTotalCents - Math.round(baseTotalCents * discount / 100);
  const savingCents = Math.max(0, baseTotalCents - bundlePriceCents);

  const mainProps = {};
  if (savingCents > 0) mainProps['_bundle_saving'] = savingCents;
  if (bundlePriceCents > 0) mainProps['_bundle_price'] = bundlePriceCents;
  if (discountCode) mainProps['_bundle_code'] = discountCode;
  // Build child items first so we can store their IDs on the main boot
  const childItems = [];
  body.querySelectorAll('.bundle-fixed-variant').forEach(input => {
    const id = Number(input.value);
    if (id) childItems.push({ id, quantity: 1, properties: { _bundle_parent: String(mainVariantId) } });
  });
  const choiceInput = body.querySelector('.bundle-choice-variant');
  if (choiceInput?.value) {
    childItems.push({ id: Number(choiceInput.value), quantity: 1, properties: { _bundle_parent: String(mainVariantId) } });
  }

  if (childItems.length) mainProps['_bundle_children'] = childItems.map(i => i.id).join(',');
  const items = [{ id: mainVariantId, quantity: 1, properties: mainProps }, ...childItems];

  fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items })
  }).then(r => r.json()).then(() => {
    const applyDiscount = discountCode
      ? fetch(`/discount/${encodeURIComponent(discountCode)}`, { method: 'GET' }).catch(() => {})
      : Promise.resolve();
    return applyDiscount;
  }).then(() => {
    return fetch('/cart.js').then(r => r.json()).catch(() => ({ attributes: {} }));
  }).then(currentCart => {
    const existingCodes = currentCart.attributes?._bundle_discounts || '';
    const codeSet = new Set([...existingCodes.split(','), ...(discountCode ? [discountCode] : [])].filter(Boolean));
    const existingSaving = Number(currentCart.attributes?._bundle_saving || 0);
    return fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attributes: {
          _bundle_discounts: [...codeSet].join(','),
          _bundle_saving: String(existingSaving + savingCents)
        }
      })
    }).catch(() => {});
  }).then(() => {
    btn.innerHTML = '✓ Bundle Added!';
    window.showToast?.('Bundle added to bag!', 'success');
    window.openCartDrawer?.();
    setTimeout(() => { btn.disabled = false; btn.innerHTML = 'Add to Bag'; }, 2500);
  }).catch(() => {
    btn.disabled = false; btn.innerHTML = 'Add to Bag';
    window.showToast?.('Could not add bundle — try again', 'error');
  });
});

// Sticky ATC should also use tier picker if present
document.getElementById('sticky-atc-btn')?.addEventListener('click', () => {
  const tierBtn = document.querySelector('.bundle-tier-add-btn');
  if (tierBtn) tierBtn.click();
});

// ── Mobile gallery: build from product-gallery thumbnails ──
function initMobileGallery() {
  const gallery = document.querySelector('.mobile-gallery');
  if (!gallery) return;

  const track = gallery.querySelector('.mobile-gallery__track');
  const dotsContainer = gallery.querySelector('.mobile-gallery__dots');
  const counter = gallery.querySelector('.mobile-gallery__counter');
  if (!track) return;

  const slides = track.querySelectorAll('.mobile-gallery__slide');
  const total = slides.length;
  if (total === 0) return;

  let current = 0;
  let startX = 0;
  let startY = 0;
  let isDragging = false;
  let diffX = 0;

  // Build dots
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'mobile-gallery__dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', `View image ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    });
  }

  function updateCounter() {
    if (counter) counter.textContent = `${current + 1} / ${total}`;
  }

  function goTo(index) {
    current = Math.max(0, Math.min(index, total - 1));
    track.style.transition = 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)';
    track.style.transform = `translateX(-${current * 100}%)`;
    dotsContainer?.querySelectorAll('.mobile-gallery__dot').forEach((d, i) => {
      d.classList.toggle('is-active', i === current);
    });
    updateCounter();
  }

  // Touch swipe
  track.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
    diffX = 0;
    track.style.transition = 'none';
  }, { passive: true });

  track.addEventListener('touchmove', e => {
    if (!isDragging) return;
    diffX = e.touches[0].clientX - startX;
    const diffY = e.touches[0].clientY - startY;
    if (Math.abs(diffX) < Math.abs(diffY)) return;
    track.style.transform = `translateX(calc(-${current * 100}% + ${diffX}px))`;
  }, { passive: true });

  track.addEventListener('touchend', () => {
    isDragging = false;
    if (Math.abs(diffX) > 50) {
      goTo(diffX < 0 ? current + 1 : current - 1);
    } else {
      goTo(current);
    }
  });

  updateCounter();
}
initMobileGallery();

// ── Bottom nav: highlight current section ──
function initBottomNav() {
  const nav = document.querySelector('.bottom-nav');
  if (!nav) return;
  const path = window.location.pathname;
  nav.querySelectorAll('.bottom-nav__item[href]').forEach(item => {
    const href = item.getAttribute('href');
    if (!href) return;
    if (href === path || (href !== '/' && path.startsWith(href))) {
      item.classList.add('is-active');
    }
  });

  // Keep cart count in sync
  const cartBadge = nav.querySelector('[data-bottom-cart-count]');
  if (cartBadge) {
    const sync = () => {
      const count = document.querySelector('[data-cart-count]')?.textContent?.trim() || '0';
      cartBadge.textContent = count;
      cartBadge.style.display = count === '0' ? 'none' : 'flex';
    };
    sync();
    document.addEventListener('cart:updated', sync);
  }
}
initBottomNav();

// ── Filter bottom sheet ──
function initFilterSheet() {
  const sheet = document.getElementById('filter-sheet');
  if (!sheet) return;
  const overlay = sheet.querySelector('.filter-sheet__overlay');
  const closeBtn = sheet.querySelector('.filter-sheet__close');
  const openBtns = document.querySelectorAll('[data-filter-open]');

  function open() {
    sheet.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    sheet.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  openBtns.forEach(btn => btn.addEventListener('click', open));
  overlay?.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);

  // Panel drag to dismiss
  const panel = sheet.querySelector('.filter-sheet__panel');
  if (panel) {
    let startY = 0;
    panel.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
    panel.addEventListener('touchend', e => {
      if (e.changedTouches[0].clientY - startY > 80) close();
    });
  }
}
initFilterSheet();

// ── Hero slider: add touch swipe ──
const heroSliderEl = document.querySelector('.hero-slider');
if (heroSliderEl) {
  let hStartX = 0;
  heroSliderEl.addEventListener('touchstart', e => { hStartX = e.touches[0].clientX; }, { passive: true });
  heroSliderEl.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].clientX - hStartX;
    if (Math.abs(diff) > 60) {
      const slides = heroSliderEl.querySelectorAll('.hero-slider__slide');
      if (slides.length > 1) {
        const evt = new CustomEvent('hero:swipe', { detail: { direction: diff < 0 ? 'next' : 'prev' } });
        heroSliderEl.dispatchEvent(evt);
      }
    }
  });
}
