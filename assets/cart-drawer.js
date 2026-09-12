/* FootHub Pro — Cart Drawer
   ========================== */

const CartDrawer = (() => {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  const closeBtn = document.getElementById('cart-drawer-close');
  const itemsContainer = document.getElementById('cart-drawer-items');
  const footerContainer = document.getElementById('cart-drawer-footer');
  const countEl = document.getElementById('cart-drawer-count');

  const headerCartBtn = document.querySelectorAll('[data-cart-trigger]');
  const headerCartCounts = document.querySelectorAll('[data-cart-count]');

  let isOpen = false;
  let cartData = null;

  function open() {
    isOpen = true;
    drawer?.classList.add('is-open');
    drawer?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    fetchCart();
  }

  function close() {
    isOpen = false;
    drawer?.classList.remove('is-open');
    drawer?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  window.openCartDrawer = open;
  window.closeCartDrawer = close;

  async function fetchCart() {
    try {
      const res = await fetch('/cart.js');
      cartData = await res.json();
      renderCart(cartData);
    } catch (e) {
      console.error('Cart fetch error:', e);
    }
  }

  function formatMoney(cents) {
    return window.formatMoney ? window.formatMoney(cents) : `£${(cents / 100).toFixed(2)}`;
  }

  function renderCart(cart) {
    if (!itemsContainer || !footerContainer) return;

    const count = cart.item_count;
    if (countEl) countEl.textContent = count;

    // Update all header + bottom nav counts
    headerCartCounts.forEach(el => {
      el.textContent = count || '';
      if (count) el.classList.add('bump');
      setTimeout(() => el.classList.remove('bump'), 400);
    });
    document.querySelectorAll('[data-bottom-cart-count]').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: { count } }));

    if (count === 0) {
      itemsContainer.innerHTML = `
        <div class="cart-empty">
          <svg class="cart-empty__icon" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <h3 class="cart-empty__title">Your bag is empty</h3>
          <p class="cart-empty__text">Looks like you haven't added anything yet.</p>
          <button class="btn btn--primary" onclick="window.closeCartDrawer()">
            <a href="/collections/all" style="color:inherit;text-decoration:none">Shop Now</a>
          </button>
        </div>`;
      footerContainer.innerHTML = '';
      return;
    }

    const hasShopifyDiscount = (cart.cart_level_discount_applications?.length > 0) ||
      cart.items.some(item => item.line_level_discount_allocations?.length > 0);

    // Build variant→quantity map for per-bundle integrity validation
    const variantQtyMap = {};
    cart.items.forEach(item => {
      variantQtyMap[item.variant_id] = (variantQtyMap[item.variant_id] || 0) + item.quantity;
    });

    // Only count a boot's saving if all its bundle children are still in the cart
    const validatedItems = cart.items.map(item => {
      const saving = Number(item.properties?._bundle_saving || 0);
      if (!saving) return { ...item, _bundleValid: false };
      const childrenStr = item.properties?._bundle_children || '';
      const childIds = childrenStr ? childrenStr.split(',').map(Number).filter(Boolean) : [];
      const valid = childIds.length === 0 || childIds.every(id => variantQtyMap[id] >= 1);
      return { ...item, _bundleValid: valid };
    });

    const bundleSaving = !hasShopifyDiscount
      ? validatedItems.reduce((sum, item) => {
          if (!item._bundleValid) return sum;
          return sum + Number(item.properties?._bundle_saving || 0) * item.quantity;
        }, 0)
      : 0;

    const hasBrokenBundle = validatedItems.some(item =>
      Number(item.properties?._bundle_saving || 0) > 0 && !item._bundleValid
    );

    const displayTotal = bundleSaving > 0 ? Math.max(0, cart.total_price - bundleSaving) : cart.total_price;
    const lineItemCodes = cart.items.map(item => item.properties?._bundle_code?.trim()).filter(Boolean);
    const attrCodes = (cart.attributes?._bundle_discounts || '').split(',').filter(Boolean);
    const allBundleCodes = [...new Set([...lineItemCodes, ...attrCodes])];
    allBundleCodes.forEach(code => fetch(`/discount/${encodeURIComponent(code)}`, { method: 'GET' }).catch(() => {}));
    const hasAnyBundleCode = allBundleCodes.length > 0;
    const checkoutUrl = hasAnyBundleCode
      ? `/checkout?discount=${allBundleCodes.map(encodeURIComponent).join(',')}`
      : '/checkout';

    const itemsHtml = cart.items.map(item => `
      <div class="cart-item" data-line-key="${item.key}">
        <a class="cart-item__img-wrap" href="${item.url}">
          <img class="cart-item__img" src="${item.image ? item.image.replace('.jpg', '_120x.jpg') : ''}"
            alt="${item.product_title}" loading="lazy" width="80" height="96">
        </a>
        <div class="cart-item__info">
          <div class="cart-item__vendor">${item.vendor || ''}</div>
          <a class="cart-item__name" href="${item.url}">${item.product_title}</a>
          <div class="cart-item__variant">${item.variant_title !== 'Default Title' ? item.variant_title : ''}</div>
          <div class="cart-item__qty-row">
            <div class="cart-item__qty">
              <button class="cart-item__qty-btn" data-action="decrease" data-key="${item.key}" aria-label="Decrease quantity">−</button>
              <span class="cart-item__qty-num">${item.quantity}</span>
              <button class="cart-item__qty-btn" data-action="increase" data-key="${item.key}" aria-label="Increase quantity">+</button>
            </div>
            <button class="cart-item__remove" data-key="${item.key}" aria-label="Remove item">Remove</button>
          </div>
        </div>
        <div class="cart-item__price">${item.line_price !== item.original_line_price
          ? `<s style="color:var(--color-text-muted);font-size:0.8em">${formatMoney(item.original_line_price)}</s><br>${formatMoney(item.line_price)}`
          : formatMoney(item.line_price)
        }</div>
      </div>
    `).join('');

    itemsContainer.innerHTML = itemsHtml;

    footerContainer.innerHTML = `
      <div class="cart-subtotal">
        <span class="cart-subtotal__label">Subtotal</span>
        <span class="cart-subtotal__amount">${formatMoney(cart.total_price)}</span>
      </div>
      ${bundleSaving > 0 ? `
      <div class="cart-subtotal">
        <span class="cart-subtotal__label" style="color:#16a34a">Bundle Saving</span>
        <span class="cart-subtotal__amount" style="color:#16a34a">-${formatMoney(bundleSaving)}</span>
      </div>
      <div class="cart-subtotal" style="font-weight:700;border-top:1px solid var(--color-border);padding-top:0.5rem;margin-top:0.25rem">
        <span class="cart-subtotal__label">Total</span>
        <span class="cart-subtotal__amount">${formatMoney(displayTotal)}</span>
      </div>` : ''}
      ${hasBrokenBundle ? `<p class="cart-note-text" style="font-size:0.72rem;color:#cc0001;margin-bottom:0.5rem;">
        ⚠ A bundle item was removed — bundle price no longer applies.
      </p>` : hasAnyBundleCode ? `<p class="cart-note-text" style="font-size:0.72rem;color:#16a34a;margin-bottom:0.5rem;">
        ✓ Bundle saving applied at checkout
      </p>` : ''}
      ${displayTotal < 10000 ? `<p class="cart-note-text" style="font-size:0.75rem;color:var(--color-text-muted);margin-bottom:0.75rem;">
        Add <strong>${formatMoney(10000 - displayTotal)}</strong> more for free shipping
      </p>` : `<p class="cart-note-text" style="font-size:0.75rem;color:#16a34a;margin-bottom:0.75rem;">✓ You qualify for free shipping!</p>`}
      <a href="${checkoutUrl}" class="cart-checkout-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Checkout — ${formatMoney(displayTotal)}
      </a>
      <a class="cart-view-all" href="${hasAnyBundleCode ? `/cart?discount=${allBundleCodes.map(encodeURIComponent).join(',')}` : '/cart'}">View full bag</a>
      <div style="display:flex;justify-content:center;gap:0.5rem;margin-top:0.75rem;opacity:0.4">
        <svg width="32" height="20" viewBox="0 0 38 24" fill="none"><rect width="38" height="24" rx="3" fill="#eee"/><text x="19" y="16" text-anchor="middle" font-size="8" fill="#333">VISA</text></svg>
        <svg width="32" height="20" viewBox="0 0 38 24" fill="none"><rect width="38" height="24" rx="3" fill="#eee"/><text x="19" y="16" text-anchor="middle" font-size="7" fill="#333">MC</text></svg>
        <svg width="32" height="20" viewBox="0 0 38 24" fill="none"><rect width="38" height="24" rx="3" fill="#eee"/><text x="19" y="16" text-anchor="middle" font-size="7" fill="#333">AMEX</text></svg>
        <svg width="32" height="20" viewBox="0 0 38 24" fill="none"><rect width="38" height="24" rx="3" fill="#eee"/><text x="19" y="16" text-anchor="middle" font-size="7" fill="#333">PAYPAL</text></svg>
      </div>
    `;

    // Attach qty/remove events
    itemsContainer.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const item = cart.items.find(i => i.key === key);
        if (!item) return;
        const qty = btn.dataset.action === 'increase' ? item.quantity + 1 : item.quantity - 1;
        updateItem(key, qty);
      });
    });

    itemsContainer.querySelectorAll('.cart-item__remove').forEach(btn => {
      btn.addEventListener('click', () => updateItem(btn.dataset.key, 0));
    });
  }

  async function checkBundleIntegrity(cart) {
    const savedIds = cart.attributes?._bundle_item_ids;
    if (!savedIds) return;

    const bundleIds = savedIds.split(',').map(Number).filter(Boolean);
    const cartVariantIds = cart.items.map(i => i.variant_id);
    const allPresent = bundleIds.every(id => cartVariantIds.includes(id));
    if (allPresent) return;

    // Bundle is broken — clear attributes and void discount
    const discountCode = cart.attributes?._bundle_discount;
    window.showToast?.('Bundle discount removed — not all bundle items are in your bag', 'error');

    await fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attributes: { _bundle_item_ids: '', _bundle_discounts: '', _bundle_saving: '', _bundle_price: '' } })
    }).catch(() => {});

    // Clear the discount from the cart session by applying an empty one
    if (discountCode) {
      await fetch('/discount/', { credentials: 'include' }).catch(() => {});
    }
  }

  async function updateItem(key, qty) {
    itemsContainer.style.opacity = '0.5';
    itemsContainer.style.pointerEvents = 'none';
    try {
      await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity: qty })
      });
      const freshRes = await fetch('/cart.js');
      cartData = await freshRes.json();
      await checkBundleIntegrity(cartData);
      renderCart(cartData);
    } catch (e) {
      window.showToast?.('Something went wrong', 'error');
    } finally {
      itemsContainer.style.opacity = '';
      itemsContainer.style.pointerEvents = '';
    }
  }

  async function addToCart(variantId, qty = 1, properties = {}) {
    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: qty, properties })
      });
      if (!res.ok) throw new Error('Failed to add');
      open();
      return await res.json();
    } catch (e) {
      window.showToast?.('Could not add to bag', 'error');
      throw e;
    }
  }

  window.addToCart = addToCart;

  // Trigger buttons
  headerCartBtn.forEach(btn => btn.addEventListener('click', open));
  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);

  return { open, close, fetchCart, addToCart };
})();
