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

// Sticky ATC visibility
const stickyAtc = document.querySelector('.sticky-atc');
const atcBtn = document.querySelector('.btn--atc');
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
