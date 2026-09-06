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
