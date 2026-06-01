import { DialogComponent, DialogOpenEvent } from '@theme/dialog';
import { CartAddEvent } from '@theme/events';

class CartDrawerComponent extends DialogComponent {
  #summaryThreshold = 0.5;

  connectedCallback() {
    super.connectedCallback();

    // Normal Dwell add-to-cart
    document.addEventListener(CartAddEvent.eventName, this.#handleCartAdd);

    // Bundle add: wait for cart, THEN open
    document.addEventListener('bundle:added', this.#handleBundleAdd);

    this.addEventListener(DialogOpenEvent.eventName, this.#updateStickyState);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener(CartAddEvent.eventName, this.#handleCartAdd);
    document.removeEventListener('bundle:added', this.#handleBundleAdd);
    this.removeEventListener(DialogOpenEvent.eventName, this.#updateStickyState);
  }

  #handleCartAdd = () => {
    if (this.hasAttribute('auto-open')) {
      this.showDialog();
    }
  };

  #handleBundleAdd = async () => {
    if (!this.hasAttribute('auto-open')) return;

    // 🔑 Force a clean cart state before rendering
    await fetch('/cart.js').then(r => r.json());

    // Now it is SAFE to open the drawer
    this.showDialog();
  };

  open() {
    this.showDialog();
  }

  close() {
    this.closeDialog();
  }

  #updateStickyState() {
    const { dialog } = this.refs;
    if (!dialog) return;

    const content = dialog.querySelector('.cart-drawer__content');
    const summary = dialog.querySelector('.cart-drawer__summary');

    if (!content || !summary) {
      dialog.setAttribute('cart-summary-sticky', 'false');
      return;
    }

    const ratio =
      summary.getBoundingClientRect().height /
      dialog.getBoundingClientRect().height;

    dialog.setAttribute(
      'cart-summary-sticky',
      ratio > this.#summaryThreshold ? 'false' : 'true'
    );
  }
}

if (!customElements.get('cart-drawer-component')) {
  customElements.define('cart-drawer-component', CartDrawerComponent);
}
