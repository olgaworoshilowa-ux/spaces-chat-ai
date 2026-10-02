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

    const syncSliderUi = () => {
        if (!range) return;
        const max = Number(range.max) || Math.max(CREDIT_TIERS.length - 1, 1);
        const pct = max > 0 ? (proTier / max) * 100 : 0;
        range.value = String(proTier);
        range.style.setProperty('--upgrade-slider-progress', `${pct}%`);
        range.setAttribute('aria-valuetext', `${(CREDIT_TIERS[proTier] || CREDIT_TIERS[0]).credits} credits`);
        const slider = range.closest('[data-upgrade-pro-slider]');
        slider?.style.setProperty('--upgrade-slider-progress', `${pct}%`);
        slider?.querySelectorAll('.spaces-upgrade-slider-labels > span').forEach((label, index) => {
            label.classList.toggle('is-active', index === proTier);
        });
    };

    const setProTier = (nextTier) => {
        const max = CREDIT_TIERS.length - 1;
        proTier = Math.max(0, Math.min(max, Number(nextTier) || 0));
        syncPrices();
    };

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

        syncSliderUi();
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
                premiumSave.innerHTML = `Save $${PREMIUM.save}/year`;
            }
            if (proOld) {
                proOld.hidden = false;
                proOld.textContent = money(tier.monthly);
            }
            if (proPrice) proPrice.textContent = money(tier.annual);
            if (proPeriod) proPeriod.textContent = 'month/billed annually';
            if (proSave) {
                proSave.hidden = false;
                proSave.innerHTML = `Save $${tier.save}/year`;
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

    const onRangeInput = () => setProTier(range.value);
    range?.addEventListener('input', onRangeInput);
    range?.addEventListener('change', onRangeInput);

    // Drag/click on the track even if the native thumb is hard to grab.
    const sliderRoot = range?.closest('[data-upgrade-pro-slider]');
    const tierFromClientX = clientX => {
        if (!range) return 0;
        const rect = range.getBoundingClientRect();
        if (!rect.width) return proTier;
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        const max = Number(range.max) || CREDIT_TIERS.length - 1;
        return Math.round(ratio * max);
    };

    const startSliderPointer = event => {
        if (!range || event.button != null && event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        range.focus({ preventScroll: true });
        range.setPointerCapture?.(event.pointerId);
        setProTier(tierFromClientX(event.clientX));

        const onMove = moveEvent => {
            setProTier(tierFromClientX(moveEvent.clientX));
        };
        const onUp = () => {
            range.releasePointerCapture?.(event.pointerId);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
    };

    range?.addEventListener('pointerdown', startSliderPointer);
    sliderRoot?.addEventListener('pointerdown', event => {
        if (event.target === range) return;
        if (event.target.closest('.spaces-upgrade-slider-labels')) return;
        startSliderPointer(event);
    });

    sliderRoot?.querySelectorAll('.spaces-upgrade-slider-labels > span').forEach((label, index) => {
        label.setAttribute('role', 'button');
        label.tabIndex = 0;
        const pick = event => {
            event.preventDefault();
            setProTier(index);
        };
        label.addEventListener('click', pick);
        label.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') pick(event);
        });
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
