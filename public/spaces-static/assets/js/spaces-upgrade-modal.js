(() => {
    'use strict';

    const modal = document.querySelector('[data-upgrade-modal]');
    const dialog = modal?.querySelector('[data-upgrade-modal-dialog]');
    const toggle = modal?.querySelector('[data-upgrade-billing-toggle]');
    const range = modal?.querySelector('[data-upgrade-pro-range]');
    if (!modal || !dialog) return;

    const CREDIT_TIERS = [
        { credits: 3000, monthly: 44.99, annual: 33.99, save: 450 },
        { credits: 5000, monthly: 64.99, annual: 49.99, save: 600 },
        { credits: 8000, monthly: 94.99, annual: 72.99, save: 840 }
    ];

    const PREMIUM = {
        monthly: 19.99,
        annual: 4.99,
        save: 390
    };

    let annual = true;
    let proTier = 0;
    let lastFocus = null;

    const money = value => `$${Number(value).toFixed(2)}`;

    const syncPrices = () => {
        const premiumOld = modal.querySelector('[data-upgrade-premium-old]');
        const premiumPrice = modal.querySelector('[data-upgrade-premium-price]');
        const premiumPeriod = modal.querySelector('[data-upgrade-premium-period]');
        const premiumSave = modal.querySelector('[data-upgrade-premium-save]');
        const proOld = modal.querySelector('[data-upgrade-pro-old]');
        const proPrice = modal.querySelector('[data-upgrade-pro-price]');
        const proPeriod = modal.querySelector('[data-upgrade-pro-period]');
        const proSave = modal.querySelector('[data-upgrade-pro-save]');
        const proCredits = modal.querySelector('[data-upgrade-pro-credits]');
        const tier = CREDIT_TIERS[proTier] || CREDIT_TIERS[0];

        if (proCredits) proCredits.textContent = tier.credits.toLocaleString('en-US');

        if (annual) {
            if (premiumOld) {
                premiumOld.hidden = false;
                premiumOld.textContent = money(PREMIUM.monthly);
            }
            if (premiumPrice) premiumPrice.textContent = money(PREMIUM.annual);
            if (premiumPeriod) premiumPeriod.textContent = 'month/billed annually';
            if (premiumSave) {
                premiumSave.hidden = false;
                premiumSave.innerHTML = `<span>Save $${PREMIUM.save}</span> compared to monthly`;
            }
            if (proOld) {
                proOld.hidden = false;
                proOld.textContent = money(tier.monthly);
            }
            if (proPrice) proPrice.textContent = money(tier.annual);
            if (proPeriod) proPeriod.textContent = 'month/billed annually';
            if (proSave) {
                proSave.hidden = false;
                proSave.innerHTML = `<span>Save $${tier.save}</span> compared to monthly`;
            }
        } else {
            if (premiumOld) premiumOld.hidden = true;
            if (premiumPrice) premiumPrice.textContent = money(PREMIUM.monthly);
            if (premiumPeriod) premiumPeriod.textContent = 'month';
            if (premiumSave) premiumSave.hidden = true;
            if (proOld) proOld.hidden = true;
            if (proPrice) proPrice.textContent = money(tier.monthly);
            if (proPeriod) proPeriod.textContent = 'month';
            if (proSave) proSave.hidden = true;
        }

        modal.classList.toggle('is-annual', annual);
        modal.classList.toggle('is-monthly', !annual);
        toggle?.classList.toggle('is-annual', annual);
        toggle?.setAttribute('aria-pressed', String(annual));
        toggle?.setAttribute(
            'aria-label',
            annual ? 'Annually billing, save 20%' : 'Monthly billing'
        );
    };

    const closeModal = () => {
        if (modal.hidden) return;
        modal.hidden = true;
        document.body.classList.remove('is-upgrade-modal-open');
        if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
        lastFocus = null;
    };

    const openModal = (trigger) => {
        lastFocus = trigger || document.activeElement;
        modal.hidden = false;
        document.body.classList.add('is-upgrade-modal-open');
        // Close header credits popover if open.
        const creditsMenu = document.querySelector('[data-header-credits-menu]');
        const creditsTrigger = document.querySelector('[data-header-credits]');
        if (creditsMenu) creditsMenu.hidden = true;
        creditsTrigger?.setAttribute('aria-expanded', 'false');
        syncPrices();
        modal.querySelector('[data-upgrade-modal-close]')?.focus();
    };

    document.querySelectorAll('[data-upgrade-modal-open]').forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            openModal(button);
        });
    });

    modal.querySelectorAll('[data-upgrade-modal-close]').forEach(node => {
        node.addEventListener('click', event => {
            event.preventDefault();
            closeModal();
        });
    });

    toggle?.addEventListener('click', event => {
        event.preventDefault();
        annual = !annual;
        syncPrices();
    });

    range?.addEventListener('input', () => {
        proTier = Number(range.value) || 0;
        syncPrices();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !modal.hidden) {
            event.preventDefault();
            closeModal();
        }
    });

    syncPrices();
    window.SpacesUpgradeModal = { open: openModal, close: closeModal };
})();
