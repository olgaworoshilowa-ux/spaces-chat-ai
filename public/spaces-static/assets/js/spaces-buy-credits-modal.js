(() => {
    'use strict';

    const PACKS = [
        { credits: 100, price: 5.99, copy: 'Enough for designing a one flat', summary: 'Enough for one flat, room by room. One-time top-up, no renewal.' },
        { credits: 500, price: 27.99, copy: 'Enough for designing a one flat', summary: 'Enough for one flat, room by room. One-time top-up, no renewal.', popular: true },
        { credits: 1000, price: 54.99, copy: 'Enough for the whole home with retries', summary: 'Enough for the whole home with retries. One-time top-up, no renewal.' },
        { credits: 2500, price: 129.99, copy: 'Months of ongoing work with several houses', summary: 'Months of ongoing work with several houses. One-time top-up, no renewal.' },
        { credits: 5000, price: 249.99, copy: 'Enough to design anything every day', summary: 'Enough to design anything every day. One-time top-up, no renewal.' }
    ];

    const modal = document.querySelector('[data-buy-credits-modal]');
    const dialog = modal?.querySelector('[data-buy-credits-dialog]');
    const list = modal?.querySelector('[data-buy-credits-list]');
    const cta = modal?.querySelector('[data-buy-credits-cta]');
    if (!modal || !dialog || !list) return;

    let selected = 1;
    let lastFocus = null;

    const formatCredits = value => Number(value).toLocaleString('en-US');
    const getSelectedPack = () => PACKS[selected] || PACKS[1];

    const syncSelection = () => {
        const pack = getSelectedPack();
        list.querySelectorAll('[data-buy-credits-option]').forEach((option, index) => {
            const active = index === selected;
            option.classList.toggle('is-selected', active);
            option.setAttribute('aria-checked', String(active));
            const radio = option.querySelector('[data-buy-credits-radio]');
            if (radio) {
                radio.src = active
                    ? './assets/images/spaces-v2/buy-credits/radio-on.svg'
                    : './assets/images/spaces-v2/buy-credits/radio-off.svg';
            }
        });
        if (cta) cta.textContent = `Buy ${formatCredits(pack.credits)} credits`;
    };

    const closeModal = ({ restoreFocus = true } = {}) => {
        if (modal.hidden) return;
        modal.hidden = true;
        document.body.classList.remove('is-buy-credits-modal-open');
        if (restoreFocus && lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
        if (restoreFocus) lastFocus = null;
    };

    const openModal = (trigger) => {
        lastFocus = trigger || document.activeElement;
        if (window.SpacesUpgradeModal?.close) window.SpacesUpgradeModal.close();
        if (window.SpacesCheckoutModal?.close) window.SpacesCheckoutModal.close({ restoreFocus: false });
        modal.hidden = false;
        document.body.classList.add('is-buy-credits-modal-open');
        syncSelection();
        modal.querySelector('[data-buy-credits-close]')?.focus();
    };

    list.querySelectorAll('[data-buy-credits-option]').forEach((option, index) => {
        option.addEventListener('click', () => {
            selected = index;
            syncSelection();
        });
        option.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selected = index;
                syncSelection();
            }
        });
    });

    cta?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const pack = getSelectedPack();
        closeModal({ restoreFocus: false });
        window.SpacesCheckoutModal?.open(pack, cta);
    });

    document.querySelectorAll('[data-buy-credits-open]').forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            openModal(button);
        });
    });

    modal.querySelectorAll('[data-buy-credits-close]').forEach(node => {
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

    syncSelection();
    window.SpacesBuyCreditsModal = {
        open: openModal,
        close: closeModal,
        getSelectedPack
    };
})();
