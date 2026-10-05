(() => {
    'use strict';

    const modal = document.querySelector('[data-checkout-modal]');
    const dialog = modal?.querySelector('[data-checkout-dialog]');
    const cta = modal?.querySelector('[data-checkout-cta]');
    const planNameNode = modal?.querySelector('[data-checkout-plan-name]');
    const summaryCopy = modal?.querySelector('[data-checkout-summary-copy]');
    const subtotalNode = modal?.querySelector('[data-checkout-subtotal]');
    const discountLine = modal?.querySelector('[data-checkout-discount-line]');
    const discountLabel = modal?.querySelector('[data-checkout-discount-label]');
    const discountBadge = modal?.querySelector('[data-checkout-discount-badge]');
    const discountAmount = modal?.querySelector('[data-checkout-discount-amount]');
    const trialLine = modal?.querySelector('[data-checkout-trial-line]');
    const trialDiscount = modal?.querySelector('[data-checkout-trial-discount]');
    const totalLabel = modal?.querySelector('[data-checkout-total-label]');
    const dueToday = modal?.querySelector('[data-checkout-due-today]');
    const fromLabel = modal?.querySelector('[data-checkout-from-label]');
    const legalNode = modal?.querySelector('[data-checkout-legal]');
    const saveToggle = modal?.querySelector('[data-checkout-save]');
    const businessToggle = modal?.querySelector('[data-checkout-business]');
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
    const moneyPlain = value => Number(value).toFixed(2);
    const formatCredits = value => Number(value).toLocaleString('en-US');

    const trialEndDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const legalEncrypted = 'Payment is encrypted. By continuing you agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.';

    const getDisplayState = () => {
        const isPlan = currentPack.kind === 'plan';
        const annual = Boolean(currentPack.annual);
        const useTrial = Boolean(currentPack.trialAvailable) && startMode === 'trial';
        const credits = formatCredits(currentPack.credits || 0);
        const unitPrice = Number(currentPack.price || 0);
        const monthlyList = Number(currentPack.monthlyPrice || currentPack.price || 0);
        const billedTotal = isPlan && annual ? unitPrice * 12 : unitPrice;
        const listTotal = isPlan && annual ? monthlyList * 12 : monthlyList;
        const discount = Math.max(0, listTotal - billedTotal);
        const offPct = monthlyList > 0
            ? Math.round((1 - unitPrice / monthlyList) * 100)
            : 0;

        if (!isPlan) {
            return {
                isPlan: false,
                useTrial: false,
                showDiscount: false,
                planName: `${credits} credits`,
                summary: currentPack.summary || 'One-time top-up, no renewal.',
                subtotal: money(billedTotal),
                discountLabel: '',
                discountBadge: '',
                discountAmount: '',
                trialDiscount: '',
                totalLabel: 'Total',
                dueToday: money(billedTotal),
                fromLabel: 'One-time payment · credits don’t expire',
                cta: `Buy ${credits} credits`,
                legal: legalEncrypted
            };
        }

        if (useTrial) {
            return {
                isPlan: true,
                useTrial: true,
                showDiscount: false,
                planName: currentPack.name || 'Professional',
                summary: currentPack.tagline || 'Maximum AI for client-ready interiors',
                subtotal: money(billedTotal),
                discountLabel: '',
                discountBadge: '',
                discountAmount: '',
                trialDiscount: `–${money(billedTotal)}`,
                totalLabel: 'Due today',
                dueToday: '$0.00',
                fromLabel: annual
                    ? `Free until ${trialEndDate()}, then ${money(billedTotal)}/year`
                    : `Free until ${trialEndDate()}, then ${money(unitPrice)}/month`,
                cta: 'Try Pro for 7 days',
                legal: 'You won’t be charged today. We’ll remind you 2 days before the trial ends. By continuing you agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.'
            };
        }

        return {
            isPlan: true,
            useTrial: false,
            showDiscount: annual && discount > 0,
            planName: currentPack.name || 'Professional',
            summary: currentPack.tagline
                || (currentPack.plan === 'premium'
                    ? 'Design faster with AI'
                    : 'Maximum AI for client-ready interiors'),
            subtotal: money(annual ? listTotal : billedTotal),
            discountLabel: 'Annual discount',
            discountBadge: offPct > 0 ? `${offPct}% OFF` : '33% OFF',
            discountAmount: discount > 0 ? `–$${moneyPlain(discount).replace(/\.00$/, '')}` : '',
            trialDiscount: '',
            totalLabel: 'Total',
            dueToday: money(billedTotal),
            fromLabel: annual
                ? `Billed yearly · ${money(unitPrice)} a month`
                : 'Billed monthly',
            cta: currentPack.cta || `Get ${currentPack.name || 'plan'}`,
            legal: legalEncrypted
        };
    };

    const syncPack = () => {
        const display = getDisplayState();
        if (planNameNode) planNameNode.textContent = display.planName;
        if (summaryCopy) summaryCopy.textContent = display.summary;
        if (subtotalNode) subtotalNode.textContent = display.subtotal;
        if (discountLabel) discountLabel.textContent = display.discountLabel;
        if (discountBadge) discountBadge.textContent = display.discountBadge;
        if (discountAmount) discountAmount.textContent = display.discountAmount;
        if (trialDiscount) trialDiscount.textContent = display.trialDiscount;
        if (totalLabel) totalLabel.textContent = display.totalLabel;
        if (fromLabel) fromLabel.textContent = display.fromLabel;
        if (dueToday) dueToday.textContent = display.dueToday;
        if (cta) cta.textContent = display.cta;
        if (legalNode) legalNode.innerHTML = display.legal;
        if (discountLine) discountLine.hidden = !display.showDiscount;
        if (trialLine) trialLine.hidden = !display.useTrial;

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

    const wireToggle = (button) => {
        button?.addEventListener('click', () => {
            const pressed = button.getAttribute('aria-pressed') === 'true';
            button.setAttribute('aria-pressed', String(!pressed));
        });
    };

    wireToggle(saveToggle);
    wireToggle(businessToggle);

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
