(() => {
    'use strict';

    const modal = document.querySelector('[data-upgrade-modal]');
    const dialog = modal?.querySelector('[data-upgrade-modal-dialog]');
    const range = modal?.querySelector('[data-upgrade-pro-range]');
    const trialToggle = modal?.querySelector('[data-upgrade-trial-toggle]');
    if (!modal || !dialog) return;

    const CREDIT_TIERS = [
        { credits: 3000, label: '3,000', monthly: 44.99, annual: 33.99 },
        { credits: 5000, label: '5,000', monthly: 62.49, annual: 49.99 },
        { credits: 8000, label: '8,000', monthly: 87.49, annual: 69.99 }
    ];

    const PREMIUM = {
        credits: 1000,
        monthly: 19.99,
        annual: 4.99
    };

    let annual = true;
    let trialOn = true;
    let proTier = 0;
    let lastFocus = null;

    const money = value => `$${Number(value).toFixed(2)}`;

    const trialEndDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const syncSliderUi = () => {
        if (!range) return;
        const max = Number(range.max) || Math.max(CREDIT_TIERS.length - 1, 1);
        const pct = max > 0 ? (proTier / max) * 100 : 0;
        range.value = String(proTier);
        range.style.setProperty('--upgrade-slider-progress', `${pct}%`);
        range.setAttribute('aria-valuetext', `${(CREDIT_TIERS[proTier] || CREDIT_TIERS[0]).label} credits`);
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

    const setAnnual = (nextAnnual) => {
        annual = Boolean(nextAnnual);
        syncPrices();
    };

    const syncPrices = () => {
        const tier = CREDIT_TIERS[proTier] || CREDIT_TIERS[0];
        const premPrice = annual ? PREMIUM.annual : PREMIUM.monthly;
        const proPrice = annual ? tier.annual : tier.monthly;
        const proTotalShort = annual ? `${money(tier.annual * 12)}/year` : `${money(tier.monthly)}/month`;
        const proTotalBilled = annual
            ? `${money(tier.annual * 12)} billed yearly`
            : `${money(tier.monthly)} billed monthly`;

        const premiumOld = modal.querySelector('[data-upgrade-premium-old]');
        const premiumPriceEl = modal.querySelector('[data-upgrade-premium-price]');
        const premiumNote = modal.querySelector('[data-upgrade-premium-note]');
        const proOld = modal.querySelector('[data-upgrade-pro-old]');
        const proPriceEl = modal.querySelector('[data-upgrade-pro-price]');
        const proNote = modal.querySelector('[data-upgrade-pro-note]');
        const proCredits = modal.querySelector('[data-upgrade-pro-credits]');
        const proCopy = modal.querySelector('[data-upgrade-pro-copy]');
        const proCta = modal.querySelector('[data-upgrade-pro-cta]');
        const trialHint = modal.querySelector('[data-upgrade-trial-hint]');

        syncSliderUi();

        if (premiumOld) {
            premiumOld.hidden = !annual;
            premiumOld.textContent = money(PREMIUM.monthly);
        }
        if (premiumPriceEl) premiumPriceEl.textContent = money(premPrice);
        if (premiumNote) {
            premiumNote.textContent = annual
                ? `${money(PREMIUM.annual * 12)} billed yearly. Cancel anytime.`
                : `${money(PREMIUM.monthly)} billed monthly. Cancel anytime.`;
        }

        if (proCredits) proCredits.textContent = tier.label;
        if (proCopy) {
            const looks = Math.round(tier.credits / 25);
            const answers = (tier.credits / 5).toLocaleString('en-US');
            proCopy.textContent = `About ${looks} room looks or ${answers} Copilot replies a month.`;
        }
        if (proOld) {
            proOld.hidden = !annual;
            proOld.textContent = money(tier.monthly);
        }
        if (proPriceEl) proPriceEl.textContent = money(proPrice);
        if (proCta) proCta.textContent = trialOn ? 'Try free for 7 days' : 'Get Professional';
        if (trialHint) trialHint.textContent = 'Includes 50 credits to try';
        if (proNote) {
            proNote.textContent = trialOn
                ? `Free until ${trialEndDate()}, then ${proTotalShort}. Cancel anytime.`
                : `${proTotalBilled}. Cancel anytime.`;
        }

        modal.classList.toggle('is-annual', annual);
        modal.classList.toggle('is-monthly', !annual);
        modal.classList.toggle('is-trial-on', trialOn);

        modal.querySelectorAll('[data-upgrade-billing]').forEach(btn => {
            const isYearly = btn.getAttribute('data-upgrade-billing') === 'yearly';
            const active = isYearly ? annual : !annual;
            btn.classList.toggle('is-selected', active);
            btn.setAttribute('aria-pressed', String(active));
        });

        if (trialToggle) {
            trialToggle.classList.toggle('is-on', trialOn);
            trialToggle.setAttribute('aria-checked', String(trialOn));
        }
    };

    const closeModal = ({ restoreFocus = true } = {}) => {
        if (modal.hidden) return;
        modal.hidden = true;
        document.body.classList.remove('is-upgrade-modal-open');
        if (restoreFocus && lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
        if (restoreFocus) lastFocus = null;
    };

    const openModal = (trigger) => {
        lastFocus = trigger || document.activeElement;
        if (window.SpacesCheckoutModal?.close) window.SpacesCheckoutModal.close({ restoreFocus: false });
        if (window.SpacesBuyCreditsModal?.close) window.SpacesBuyCreditsModal.close({ restoreFocus: false });
        modal.hidden = false;
        document.body.classList.add('is-upgrade-modal-open');
        const creditsMenu = document.querySelector('[data-header-credits-menu]');
        const creditsTrigger = document.querySelector('[data-header-credits]');
        if (creditsMenu) creditsMenu.hidden = true;
        creditsTrigger?.setAttribute('aria-expanded', 'false');
        syncPrices();
        modal.querySelector('[data-upgrade-modal-close]')?.focus();
    };

    const buildCheckoutPack = (planKey) => {
        const tier = CREDIT_TIERS[proTier] || CREDIT_TIERS[0];
        const period = annual ? 'billed annually' : 'billed monthly';
        if (planKey === 'pro') {
            const price = annual ? tier.annual : tier.monthly;
            return {
                kind: 'plan',
                plan: 'pro',
                trialAvailable: trialOn,
                startMode: trialOn ? 'trial' : 'now',
                annual,
                name: 'Professional',
                cta: trialOn ? 'Start free trial' : 'Get Professional',
                label: `Professional · ${period}`,
                price,
                monthlyPrice: tier.monthly,
                credits: tier.credits,
                tagline: 'Maximum AI for client-ready interiors',
                intro: trialOn
                    ? '7 days free. Your card is saved now — you won’t be charged until the trial ends.'
                    : 'Your plan starts as soon as the payment goes through',
                summary: `${tier.label} credits/month for client-ready interiors with more Copilot and AI Studio.`
            };
        }
        const price = annual ? PREMIUM.annual : PREMIUM.monthly;
        return {
            kind: 'plan',
            plan: 'premium',
            trialAvailable: false,
            trial: false,
            annual,
            name: 'Premium',
            cta: 'Get Premium',
            label: `Premium · ${period}`,
            price,
            monthlyPrice: PREMIUM.monthly,
            credits: PREMIUM.credits,
            tagline: 'Design faster with AI',
            intro: 'Your plan starts as soon as the payment goes through',
            summary: '1,000 credits/month for daily Copilot help and AI Studio room looks.'
        };
    };

    modal.querySelectorAll('[data-upgrade-checkout]').forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            const planKey = button.getAttribute('data-upgrade-checkout') || 'premium';
            const pack = buildCheckoutPack(planKey);
            closeModal({ restoreFocus: false });
            window.SpacesCheckoutModal?.open(pack, button, { returnTo: 'upgrade' });
        });
    });

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

    modal.querySelectorAll('[data-upgrade-billing]').forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            setAnnual(button.getAttribute('data-upgrade-billing') === 'yearly');
        });
    });

    trialToggle?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        trialOn = !trialOn;
        syncPrices();
    });

    const onRangeInput = () => setProTier(range.value);
    range?.addEventListener('input', onRangeInput);
    range?.addEventListener('change', onRangeInput);

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

        const onMove = moveEvent => setProTier(tierFromClientX(moveEvent.clientX));
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
