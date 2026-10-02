(() => {
    'use strict';

    const modal = document.querySelector('[data-buy-credits-modal]');
    const dialog = modal?.querySelector('[data-buy-credits-dialog]');
    const list = modal?.querySelector('[data-buy-credits-list]');
    const cta = modal?.querySelector('[data-buy-credits-cta]');
    if (!modal || !dialog || !list) return;

    const PACKS = [
        { credits: 100, price: 5.99, copy: 'Enough for designing a one flat' },
        { credits: 500, price: 27.99, copy: 'Enough for designing a one flat', popular: true },
        { credits: 1000, price: 54.99, copy: 'Enough for the whole home with retries' },
        { credits: 2500, price: 129.99, copy: 'Months of ongoing work with several houses' },
        { credits: 5000, price: 249.99, copy: 'Enough to design anything every day' }
    ];

    let selected = 1;
    let lastFocus = null;

    const money = value => `$${Number(value).toFixed(2)}`;
    const formatCredits = value => Number(value).toLocaleString('en-US');

    const syncSelection = () => {
        const pack = PACKS[selected] || PACKS[1];
        list.querySelectorAll('[data-buy-credits-option]').forEach((option, index) => {
            const active = index === selected;
            option.classList.toggle('is-selected', active);
            option.setAttribute('aria-checked', String(active));
            const radio = option.querySelector('[data-buy-credits-radio]');
            if (radio) {
                radio.src = active
                    ? './assets/images/spaces-v2/buy-credits/radio-on.svg'
                    : './assets/images/spaces-v2/buy-credits/radio-off.svg';
                radio.alt = active ? 'Selected' : '';
            }
        });
        if (cta) cta.textContent = `Buy ${formatCredits(pack.credits)} credits`;
    };

    const closeModal = () => {
        if (modal.hidden) return;
        modal.hidden = true;
        document.body.classList.remove('is-buy-credits-modal-open');
        if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
        lastFocus = null;
    };

    const openModal = (trigger) => {
        lastFocus = trigger || document.activeElement;
        // Close upgrade modal if it is open underneath.
        if (window.SpacesUpgradeModal?.close) window.SpacesUpgradeModal.close();
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
    window.SpacesBuyCreditsModal = { open: openModal, close: closeModal };
})();
