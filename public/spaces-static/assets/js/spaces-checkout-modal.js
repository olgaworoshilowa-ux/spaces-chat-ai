(() => {
    'use strict';

    const modal = document.querySelector('[data-checkout-modal]');
    const dialog = modal?.querySelector('[data-checkout-dialog]');
    const cta = modal?.querySelector('[data-checkout-cta]');
    const planNameNode = modal?.querySelector('[data-checkout-plan-name]');
    const creditsLabel = modal?.querySelector('[data-checkout-credits-label]');
    const summaryCopy = modal?.querySelector('[data-checkout-summary-copy]');
    const subtotalNode = modal?.querySelector('[data-checkout-subtotal]');
    const trialLine = modal?.querySelector('[data-checkout-trial-line]');
    const trialDiscount = modal?.querySelector('[data-checkout-trial-discount]');
    const fromLabel = modal?.querySelector('[data-checkout-from-label]');
    const dueToday = modal?.querySelector('[data-checkout-due-today]');
    const saveBanner = modal?.querySelector('[data-checkout-save-banner]');
    const saveText = modal?.querySelector('[data-checkout-save-text]');
    const legalNode = modal?.querySelector('[data-checkout-legal]');
    const saveToggle = modal?.querySelector('[data-checkout-save]');
    if (!modal || !dialog) return;

    let lastFocus = null;
    let returnTo = 'buy-credits';
    let startMode = 'trial';
    let currentPack = {
        kind: 'credits',
        credits: 500,
        price: 27.99,
        summary: 'Enough for one flat, room by room. One-time top-up, no renewal.'
    };

    const money = value => `$${Number(value).toFixed(2)}`;
    const formatCredits = value => Number(value).toLocaleString('en-US');

    const trialEndDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const yearlySave = (monthly, annualMonthly) => {
        const save = (Number(monthly) - Number(annualMonthly)) * 12;
        return Math.max(0, Math.round(save));
    };

    const getDisplayState = () => {
        const isPlan = currentPack.kind === 'plan';
        const annual = Boolean(currentPack.annual);
        const useTrial = Boolean(currentPack.trialAvailable) && startMode === 'trial';
        const credits = formatCredits(currentPack.credits || 0);
        const unitPrice = Number(currentPack.price || 0);
        const subtotal = isPlan && annual ? unitPrice * 12 : unitPrice;
        const monthlyList = Number(currentPack.monthlyPrice || currentPack.price || 0);

        if (!isPlan) {
            return {
                isPlan: false,
                useTrial: false,
                showSaveBanner: false,
                planName: `${credits} credits`,
                creditsLabel: `${credits} credits`,
                summary: currentPack.summary || 'One-time top-up, no renewal.',
                subtotal: money(subtotal),
                trialDiscount: '',
                fromLabel: 'One-time payment · credits don’t expire',
                dueToday: money(subtotal),
                saveText: '',
                cta: `Buy ${credits} credits`,
                legal: 'Payment is encrypted. By continuing you agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.'
            };
        }

        if (useTrial) {
            return {
                isPlan: true,
                useTrial: true,
                showSaveBanner: annual,
                planName: currentPack.name || 'Professional',
                creditsLabel: `${credits} credits`,
                summary: currentPack.tagline || 'Maximum AI for client-ready interiors',
                subtotal: money(subtotal),
                trialDiscount: `-${money(subtotal)}`,
                fromLabel: annual
                    ? `Then ${money(subtotal)}/year from ${trialEndDate()}`
                    : `Then ${money(unitPrice)}/month from ${trialEndDate()}`,
                dueToday: '$0.00',
                saveText: annual
                    ? `You save $${yearlySave(monthlyList, unitPrice)} a year with yearly billing`
                    : '',
                cta: 'Start free trial',
                legal: 'You won’t be charged today. We’ll remind you 2 days before the trial ends. By continuing you agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.'
            };
        }

        return {
            isPlan: true,
            useTrial: false,
            showSaveBanner: annual,
            planName: currentPack.name || 'Professional',
            creditsLabel: `${credits} credits`,
            summary: currentPack.tagline
                || (currentPack.plan === 'premium'
                    ? 'Design faster with AI'
                    : 'Maximum AI for client-ready interiors'),
            subtotal: money(subtotal),
            trialDiscount: '',
            fromLabel: annual
                ? `Billed yearly · ${money(unitPrice)} a month`
                : 'Billed monthly',
            dueToday: money(subtotal),
            saveText: annual
                ? `You save $${yearlySave(monthlyList, unitPrice)} a year with yearly billing`
                : '',
            cta: currentPack.cta || `Get ${currentPack.name || 'plan'}`,
            legal: 'By continuing you agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.'
        };
    };

    const syncPack = () => {
        const display = getDisplayState();
        if (planNameNode) planNameNode.textContent = display.planName;
        if (creditsLabel) creditsLabel.textContent = display.creditsLabel;
        if (summaryCopy) summaryCopy.textContent = display.summary;
        if (subtotalNode) subtotalNode.textContent = display.subtotal;
        if (trialDiscount) trialDiscount.textContent = display.trialDiscount;
        if (fromLabel) fromLabel.textContent = display.fromLabel;
        if (dueToday) dueToday.textContent = display.dueToday;
        if (saveText) saveText.textContent = display.saveText;
        if (cta) cta.textContent = display.cta;
        if (legalNode) legalNode.innerHTML = display.legal;
        if (trialLine) trialLine.hidden = !display.useTrial;
        if (saveBanner) saveBanner.hidden = !display.showSaveBanner;

        modal.classList.toggle('is-plan-checkout', display.isPlan);
        modal.classList.toggle('is-credits-checkout', !display.isPlan);
        modal.classList.toggle('is-trial-start', display.useTrial);
        modal.classList.toggle('is-pay-now-start', display.isPlan && !display.useTrial);
        modal.classList.toggle('is-premium', currentPack.plan === 'premium');
        modal.classList.toggle('is-pro', currentPack.plan === 'pro');
    };

    const closeModal = ({ restoreFocus = true } = {}) => {
        if (modal.hidden) return;
        modal.hidden = true;
        document.body.classList.remove('is-checkout-modal-open');
        if (restoreFocus && lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
        if (restoreFocus) lastFocus = null;
    };

    const openModal = (pack, trigger, options = {}) => {
        lastFocus = trigger || document.activeElement;
        if (pack) currentPack = pack;
        returnTo = options.returnTo || (currentPack.kind === 'plan' ? 'upgrade' : 'buy-credits');
        startMode = currentPack.startMode
            || (currentPack.trialAvailable ? 'trial' : 'now');
        if (window.SpacesBuyCreditsModal?.close) {
            window.SpacesBuyCreditsModal.close({ restoreFocus: false });
        }
        if (window.SpacesUpgradeModal?.close) {
            window.SpacesUpgradeModal.close({ restoreFocus: false });
        }
        modal.hidden = false;
        document.body.classList.add('is-checkout-modal-open');
        syncPack();
        modal.querySelector('[data-checkout-back]')?.focus();
    };

    const applyCreditsToHeader = () => {
        const countNode = document.querySelector('[data-header-credits-count]');
        if (!countNode) return;
        const current = Number(String(countNode.textContent || '0').replace(/[^\d]/g, '')) || 0;
        const add = currentPack.kind === 'plan' && startMode === 'trial'
            ? 50
            : Number(currentPack.credits || 0);
        const next = current + add;
        countNode.textContent = String(next);
        window.SpacesHeaderCredits?.sync?.(next);
    };

    saveToggle?.addEventListener('click', () => {
        const pressed = saveToggle.getAttribute('aria-pressed') === 'true';
        saveToggle.setAttribute('aria-pressed', String(!pressed));
    });

    modal.querySelector('[data-checkout-back]')?.addEventListener('click', event => {
        event.preventDefault();
        closeModal({ restoreFocus: false });
        if (returnTo === 'upgrade') {
            window.SpacesUpgradeModal?.open(lastFocus);
            return;
        }
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

    window.SpacesCheckoutModal = { open: openModal, close: closeModal };
})();
