(() => {
    'use strict';

    const modal = document.querySelector('[data-checkout-modal]');
    const dialog = modal?.querySelector('[data-checkout-dialog]');
    const cta = modal?.querySelector('[data-checkout-cta]');
    const planNameNode = modal?.querySelector('[data-checkout-plan-name]');
    const trialPill = modal?.querySelector('[data-checkout-trial-pill]');
    const summaryCopy = modal?.querySelector('[data-checkout-summary-copy]');
    const subtotalNode = modal?.querySelector('[data-checkout-subtotal]');
    const discountLine = modal?.querySelector('[data-checkout-discount-line]');
    const discountLabel = modal?.querySelector('[data-checkout-discount-label]');
    const discountBadge = modal?.querySelector('[data-checkout-discount-badge]');
    const discountAmount = modal?.querySelector('[data-checkout-discount-amount]');
    const afterTrialLine = modal?.querySelector('[data-checkout-after-trial-line]');
    const afterTrialNode = modal?.querySelector('[data-checkout-after-trial]');
    const trialLine = modal?.querySelector('[data-checkout-trial-line]');
    const trialToday = modal?.querySelector('[data-checkout-trial-today]');
    const totalLabel = modal?.querySelector('[data-checkout-total-label]');
    const dueToday = modal?.querySelector('[data-checkout-due-today]');
    const fromLabel = modal?.querySelector('[data-checkout-from-label]');
    const cancelNote = modal?.querySelector('[data-checkout-cancel-note]');
    const legalNode = modal?.querySelector('[data-checkout-legal]');
    const saveToggle = modal?.querySelector('[data-checkout-save]');
    const businessToggle = modal?.querySelector('[data-checkout-business]');
    const currencyRoot = modal?.querySelector('[data-checkout-currency]');
    const currencyInputs = currencyRoot
        ? Array.from(currencyRoot.querySelectorAll('[data-checkout-currency-option]'))
        : [];
    if (!modal || !dialog) return;

    const CURRENCIES = {
        gel: { code: 'GEL', symbol: '₾', rate: 2.7045, prefix: false },
        usd: { code: 'USD', symbol: '$', rate: 1, prefix: true }
    };
    const currencyRateNode = currencyRoot?.querySelector('[data-checkout-currency-rate-text]');

    let lastFocus = null;
    let returnTo = 'buy-credits';
    let startMode = 'trial';
    let selectedCurrency = currencyRoot?.querySelector('[data-checkout-currency-option]:checked')?.value || 'gel';
    let currentPack = {
        kind: 'credits',
        credits: 500,
        price: 27.99,
        summary: 'Enough for one flat, room by room. One-time top-up, no renewal.'
    };

    const convert = (usdValue) => Number(usdValue) * (CURRENCIES[selectedCurrency]?.rate || 1);

    const money = (usdValue) => {
        const currency = CURRENCIES[selectedCurrency] || CURRENCIES.usd;
        const amount = convert(usdValue).toFixed(2);
        if (currency.prefix) return `${currency.symbol}${amount}`;
        return `${amount} ${currency.code}`;
    };

    const formatCredits = value => Number(value).toLocaleString('en-US');

    const trialEndDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date;
    };

    const formatTrialDate = (date) => date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).replace(/ ([A-Za-z]{3}) /, ' $1, ');

    const legalEncrypted = 'Payment is encrypted. By continuing you agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.';

    const getUsdTotals = () => {
        const isPlan = currentPack.kind === 'plan';
        const annual = Boolean(currentPack.annual);
        const unitPrice = Number(currentPack.price || 0);
        const monthlyList = Number(currentPack.monthlyPrice || currentPack.price || 0);
        const billedTotal = isPlan && annual ? unitPrice * 12 : unitPrice;
        const listTotal = isPlan && annual ? monthlyList * 12 : monthlyList;
        return { isPlan, annual, unitPrice, monthlyList, billedTotal, listTotal };
    };

    const getDisplayState = () => {
        const { isPlan, annual, unitPrice, monthlyList, billedTotal, listTotal } = getUsdTotals();
        const useTrial = Boolean(currentPack.trialAvailable) && startMode === 'trial';
        const credits = formatCredits(currentPack.credits || 0);
        const discount = Math.max(0, listTotal - billedTotal);
        const offPct = monthlyList > 0
            ? Math.round((1 - unitPrice / monthlyList) * 100)
            : 0;
        const end = trialEndDate();
        const endLabel = formatTrialDate(end);

        if (!isPlan) {
            return {
                isPlan: false,
                useTrial: false,
                showDiscount: false,
                showAfterTrial: false,
                showTrialPill: false,
                showCancel: false,
                planName: `${credits} credits`,
                summary: currentPack.summary || 'One-time top-up, no renewal.',
                subtotal: money(billedTotal),
                discountLabel: '',
                discountBadge: '',
                discountAmount: '',
                afterTrial: '',
                trialToday: '',
                totalLabel: 'Total',
                dueToday: money(billedTotal),
                fromLabel: 'One-time payment · credits don’t expire',
                cancelLabel: '',
                cta: `Buy ${credits} credits`,
                legal: legalEncrypted,
                selectorTotalUsd: billedTotal
            };
        }

        if (useTrial) {
            return {
                isPlan: true,
                useTrial: true,
                showDiscount: annual && discount > 0,
                showAfterTrial: true,
                showTrialPill: true,
                showCancel: true,
                planName: currentPack.name || 'Professional',
                summary: currentPack.tagline || 'Maximum AI for client-ready interiors',
                subtotal: money(annual ? listTotal : billedTotal),
                discountLabel: 'Annual discount',
                discountBadge: offPct > 0 ? `${offPct}% OFF` : '33% OFF',
                discountAmount: discount > 0 ? `–${money(discount)}` : '',
                afterTrial: money(billedTotal),
                trialToday: selectedCurrency === 'usd' ? '$0 today' : `0.00 ${CURRENCIES[selectedCurrency].code} today`,
                totalLabel: 'Due today',
                dueToday: money(0),
                fromLabel: annual
                    ? `From ${endLabel}, billed yearly · ${money(unitPrice)} a month`
                    : `From ${endLabel}, billed monthly`,
                cancelLabel: `Cancel anytime before ${endLabel}`,
                cta: 'Start trial',
                legal: `Payment is encrypted. After the trial, ${money(billedTotal)} is charged ${annual ? 'yearly' : 'monthly'} until you cancel. By continuing you agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.`,
                selectorTotalUsd: billedTotal
            };
        }

        return {
            isPlan: true,
            useTrial: false,
            showDiscount: annual && discount > 0,
            showAfterTrial: false,
            showTrialPill: false,
            showCancel: false,
            planName: currentPack.name || 'Professional',
            summary: currentPack.tagline
                || (currentPack.plan === 'premium'
                    ? 'Design faster with AI'
                    : 'Maximum AI for client-ready interiors'),
            subtotal: money(annual ? listTotal : billedTotal),
            discountLabel: 'Annual discount',
            discountBadge: offPct > 0 ? `${offPct}% OFF` : '33% OFF',
            discountAmount: discount > 0 ? `–${money(discount)}` : '',
            afterTrial: '',
            trialToday: '',
            totalLabel: 'Total',
            dueToday: money(billedTotal),
            fromLabel: annual
                ? `Billed yearly · ${money(unitPrice)} a month`
                : 'Billed monthly',
            cancelLabel: '',
            cta: currentPack.cta || `Get ${currentPack.name || 'plan'}`,
            legal: legalEncrypted,
            selectorTotalUsd: billedTotal
        };
    };

    const syncCurrencyToggle = () => {
        currencyInputs.forEach(input => {
            const code = input.value || 'gel';
            const label = input.closest('.spaces-checkout-toggle-item');
            const active = code === selectedCurrency;
            input.checked = active;
            label?.classList.toggle('is-selected', active);
        });
        if (currencyRateNode) {
            currencyRateNode.textContent = selectedCurrency === 'usd'
                ? `1 GEL = ${(1 / CURRENCIES.gel.rate).toFixed(4)} USD`
                : `1 USD = ${CURRENCIES.gel.rate} GEL`;
        }
    };

    const syncPack = () => {
        const display = getDisplayState();
        if (planNameNode) planNameNode.textContent = display.planName;
        if (summaryCopy) summaryCopy.textContent = display.summary;
        if (subtotalNode) subtotalNode.textContent = display.subtotal;
        if (discountLabel) discountLabel.textContent = display.discountLabel;
        if (discountBadge) {
            discountBadge.textContent = display.discountBadge;
            discountBadge.classList.toggle('is-dark', display.useTrial && currentPack.plan === 'pro');
        }
        if (discountAmount) discountAmount.textContent = display.discountAmount;
        if (afterTrialNode) afterTrialNode.textContent = display.afterTrial;
        if (trialToday) trialToday.textContent = display.trialToday;
        if (totalLabel) totalLabel.textContent = display.totalLabel;
        if (fromLabel) fromLabel.textContent = display.fromLabel;
        if (cancelNote) cancelNote.textContent = display.cancelLabel;
        if (dueToday) dueToday.textContent = display.dueToday;
        if (cta) cta.textContent = display.cta;
        if (legalNode) legalNode.innerHTML = display.legal;

        if (trialPill) trialPill.hidden = !display.showTrialPill;
        if (discountLine) discountLine.hidden = !display.showDiscount;
        if (afterTrialLine) afterTrialLine.hidden = !display.showAfterTrial;
        if (trialLine) trialLine.hidden = !display.useTrial;
        if (cancelNote) cancelNote.hidden = !display.showCancel;

        syncCurrencyToggle();

        modal.classList.toggle('is-plan-checkout', display.isPlan);
        modal.classList.toggle('is-credits-checkout', !display.isPlan);
        modal.classList.toggle('is-trial-start', display.useTrial);
        modal.classList.toggle('is-pay-now-start', display.isPlan && !display.useTrial);
        modal.classList.toggle('is-premium', currentPack.plan === 'premium');
        modal.classList.toggle('is-pro', currentPack.plan === 'pro');
        modal.dataset.checkoutCurrency = selectedCurrency;
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

    currencyInputs.forEach(input => {
        input.addEventListener('change', () => {
            selectedCurrency = input.value || 'gel';
            syncPack();
        });
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
