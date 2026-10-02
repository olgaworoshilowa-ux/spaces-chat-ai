(() => {
    'use strict';

    const modal = document.querySelector('[data-checkout-modal]');
    const dialog = modal?.querySelector('[data-checkout-dialog]');
    const cta = modal?.querySelector('[data-checkout-cta]');
    const priceNode = modal?.querySelector('[data-checkout-price]');
    const creditsLabel = modal?.querySelector('[data-checkout-credits-label]');
    const summaryCopy = modal?.querySelector('[data-checkout-summary-copy]');
    const companyToggle = modal?.querySelector('[data-checkout-company-toggle]');
    if (!modal || !dialog) return;

    let lastFocus = null;
    let currentPack = { credits: 500, price: 27.99, summary: 'Enough for one flat, room by room. One-time top-up, no renewal.' };
    let payment = 'card';

    const money = value => `$${Number(value).toFixed(2)}`;
    const formatCredits = value => Number(value).toLocaleString('en-US');

    const syncPack = () => {
        if (priceNode) priceNode.textContent = money(currentPack.price);
        if (creditsLabel) creditsLabel.textContent = `${formatCredits(currentPack.credits)} credits`;
        if (summaryCopy) summaryCopy.textContent = currentPack.summary || currentPack.copy || '';
        if (cta) cta.textContent = `Buy ${formatCredits(currentPack.credits)} credits`;
    };

    const syncPayment = () => {
        modal.querySelectorAll('[data-checkout-pay]').forEach(button => {
            const active = button.getAttribute('data-checkout-pay') === payment;
            button.classList.toggle('is-selected', active);
            button.setAttribute('aria-pressed', String(active));
            const radio = button.querySelector('[data-checkout-pay-radio]');
            if (radio) {
                radio.src = active
                    ? './assets/images/spaces-v2/checkout/radio-on.svg'
                    : './assets/images/spaces-v2/checkout/radio-off.svg';
            }
        });
        const fields = modal.querySelector('[data-checkout-card-fields]');
        if (fields) fields.hidden = payment !== 'card';
    };

    const closeModal = ({ restoreFocus = true } = {}) => {
        if (modal.hidden) return;
        modal.hidden = true;
        document.body.classList.remove('is-checkout-modal-open');
        if (restoreFocus && lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
        if (restoreFocus) lastFocus = null;
    };

    const openModal = (pack, trigger) => {
        lastFocus = trigger || document.activeElement;
        if (pack) currentPack = pack;
        if (window.SpacesBuyCreditsModal?.close) {
            window.SpacesBuyCreditsModal.close({ restoreFocus: false });
        }
        modal.hidden = false;
        document.body.classList.add('is-checkout-modal-open');
        syncPack();
        syncPayment();
        modal.querySelector('[data-checkout-back]')?.focus();
    };

    const applyCreditsToHeader = () => {
        const countNode = document.querySelector('[data-header-credits-count]');
        if (!countNode) return;
        const current = Number(String(countNode.textContent || '0').replace(/[^\d]/g, '')) || 0;
        const next = current + Number(currentPack.credits || 0);
        countNode.textContent = String(next);
        const trigger = document.querySelector('[data-header-credits]');
        if (trigger) trigger.setAttribute('aria-label', `${next} credits left`);
    };

    modal.querySelectorAll('[data-checkout-pay]').forEach(button => {
        button.addEventListener('click', () => {
            payment = button.getAttribute('data-checkout-pay') || 'card';
            syncPayment();
        });
    });

    companyToggle?.addEventListener('click', () => {
        const pressed = companyToggle.getAttribute('aria-pressed') === 'true';
        companyToggle.setAttribute('aria-pressed', String(!pressed));
        companyToggle.classList.toggle('is-on', !pressed);
    });

    modal.querySelector('[data-checkout-back]')?.addEventListener('click', event => {
        event.preventDefault();
        closeModal({ restoreFocus: false });
        window.SpacesBuyCreditsModal?.open(lastFocus);
    });

    cta?.addEventListener('click', event => {
        event.preventDefault();
        applyCreditsToHeader();
        closeModal();
    });

    modal.querySelectorAll('[data-checkout-close]').forEach(node => {
        node.addEventListener('click', event => {
            event.preventDefault();
            closeModal();
        });
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !modal.hidden) {
            event.preventDefault();
            closeModal();
        }
    });

    syncPayment();
    window.SpacesCheckoutModal = { open: openModal, close: closeModal };
})();
