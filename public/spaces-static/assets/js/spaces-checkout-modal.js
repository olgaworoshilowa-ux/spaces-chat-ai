(() => {
    'use strict';

    const modal = document.querySelector('[data-checkout-modal]');
    const dialog = modal?.querySelector('[data-checkout-dialog]');
    const cta = modal?.querySelector('[data-checkout-cta]');
    const priceNode = modal?.querySelector('[data-checkout-price]');
    const creditsLabel = modal?.querySelector('[data-checkout-credits-label]');
    const summaryCopy = modal?.querySelector('[data-checkout-summary-copy]');
    const introNode = modal?.querySelector('[data-checkout-intro]');
    const receiveList = modal?.querySelector('[data-checkout-receive]');
    const companyToggle = modal?.querySelector('[data-checkout-company-toggle]');
    const planHeading = modal?.querySelector('[data-checkout-plan-heading]');
    const creditsHeading = modal?.querySelector('[data-checkout-credits-heading]');
    const dueBox = modal?.querySelector('[data-checkout-due-box]');
    const remindNode = modal?.querySelector('[data-checkout-remind]');
    const planNameNode = modal?.querySelector('[data-checkout-plan-name]');
    const trialBadge = modal?.querySelector('[data-checkout-trial-badge]');
    const planMeta = modal?.querySelector('[data-checkout-plan-meta]');
    const dueToday = modal?.querySelector('[data-checkout-due-today]');
    const fromLabel = modal?.querySelector('[data-checkout-from-label]');
    const fromPrice = modal?.querySelector('[data-checkout-from-price]');
    const monthRow = modal?.querySelector('[data-checkout-month-row]');
    const monthEquiv = modal?.querySelector('[data-checkout-month-equiv]');
    const artImg = modal?.querySelector('[data-checkout-summary-art]');
    if (!modal || !dialog) return;

    const CHECK_ICON = `
        <span class="spaces-checkout-receive-check" aria-hidden="true">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8EE07A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"></path></svg>
        </span>
    `;

    const DEFAULT_CREDITS_RECEIVE = [
        'One-time credits added to this account',
        'Works in Copilot and everywhere in AI Studio',
        'No subscription, no renewal',
        'Your paused task continues right away'
    ];

    const ART = {
        credits: './assets/images/spaces-v2/checkout/order-card.png',
        plan: './assets/images/spaces-v2/checkout/order-card.png'
    };

    let lastFocus = null;
    let returnTo = 'buy-credits';
    let startMode = 'trial';
    let currentPack = {
        kind: 'credits',
        credits: 500,
        price: 27.99,
        summary: 'Enough for one flat, room by room. One-time top-up, no renewal.',
        receive: DEFAULT_CREDITS_RECEIVE
    };
    let payment = 'card';

    const money = value => `$${Number(value).toFixed(2)}`;
    const formatCredits = value => Number(value).toLocaleString('en-US');

    const trialEndDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const renderReceive = items => {
        if (!receiveList) return;
        const list = Array.isArray(items) && items.length ? items : DEFAULT_CREDITS_RECEIVE;
        receiveList.innerHTML = list.map(text => `
            <li>
                ${CHECK_ICON}
                <span>${text}</span>
            </li>
        `).join('');
    };

    const getDisplayState = () => {
        const isPlan = currentPack.kind === 'plan';
        const trialAvailable = Boolean(currentPack.trialAvailable);
        const useTrial = trialAvailable && startMode === 'trial';
        const annual = Boolean(currentPack.annual);
        const credits = formatCredits(currentPack.credits || 0);
        const monthlyPrice = Number(currentPack.price || 0);
        const yearlyTotal = monthlyPrice * 12;
        const billingLabel = annual ? 'billed yearly' : 'billed monthly';

        if (!isPlan) {
            return {
                isPlan: false,
                trialAvailable: false,
                useTrial: false,
                price: money(currentPack.price),
                label: `${formatCredits(currentPack.credits)} credits`,
                summary: currentPack.summary || currentPack.copy || '',
                intro: 'Credits are added to your balance as soon as the payment goes through',
                cta: `Buy ${formatCredits(currentPack.credits)} credits`,
                receive: currentPack.receive || DEFAULT_CREDITS_RECEIVE,
                planName: '',
                planMeta: '',
                dueToday: money(currentPack.price),
                fromLabel: '',
                fromPrice: '',
                monthEquiv: '',
                showMonthEquiv: false
            };
        }

        const planMetaText = `${credits} AI credits a month · ${billingLabel}`;

        if (useTrial) {
            return {
                isPlan: true,
                trialAvailable: true,
                useTrial: true,
                price: '$0',
                label: `${currentPack.name} · 7 days free`,
                summary: planMetaText,
                intro: '7 days free. Your card is saved now — you won’t be charged until the trial ends.',
                cta: 'Start 7-day free trial',
                receive: [
                    `50 AI credits to try, then ${credits} a month`,
                    'More AI Copilot and AI Studio',
                    'Unlimited 4K renders and your own 3D models',
                    'Mood boards, 360° panoramas, branded profile'
                ],
                planName: currentPack.name || 'Professional',
                planMeta: planMetaText,
                dueToday: '$0.00',
                fromLabel: `From ${trialEndDate()}`,
                fromPrice: annual ? `${money(yearlyTotal)} / year` : `${money(monthlyPrice)} / month`,
                monthEquiv: annual ? `${money(monthlyPrice)} a month` : '',
                showMonthEquiv: annual
            };
        }

        return {
            isPlan: true,
            trialAvailable,
            useTrial: false,
            price: money(monthlyPrice),
            label: `${currentPack.name} · ${billingLabel}`,
            summary: planMetaText,
            intro: 'Your plan starts as soon as the payment goes through',
            cta: `Get ${currentPack.name || 'plan'}`,
            receive: [
                `${credits} credits every month`,
                'More AI Copilot and AI Studio',
                'Unlimited 4K renders and your own 3D models',
                'Mood boards, 360° panoramas, branded profile'
            ],
            planName: currentPack.name || 'Professional',
            planMeta: planMetaText,
            dueToday: annual ? money(yearlyTotal) : money(monthlyPrice),
            fromLabel: annual ? 'Billed yearly' : 'Billed monthly',
            fromPrice: annual ? `${money(yearlyTotal)} / year` : `${money(monthlyPrice)} / month`,
            monthEquiv: annual ? `${money(monthlyPrice)} a month` : '',
            showMonthEquiv: annual
        };
    };

    const syncPack = () => {
        const display = getDisplayState();

        if (priceNode) priceNode.textContent = display.price;
        if (creditsLabel) creditsLabel.textContent = display.label;
        if (summaryCopy) summaryCopy.textContent = display.summary;
        if (introNode) introNode.textContent = display.intro;
        if (cta) cta.textContent = display.cta;
        if (planNameNode) planNameNode.textContent = display.planName;
        if (planMeta) planMeta.textContent = display.planMeta;
        if (dueToday) dueToday.textContent = display.dueToday;
        if (fromLabel) fromLabel.textContent = display.fromLabel;
        if (fromPrice) fromPrice.textContent = display.fromPrice;
        if (monthEquiv) monthEquiv.textContent = display.monthEquiv;

        if (planHeading) planHeading.hidden = !display.isPlan;
        if (creditsHeading) creditsHeading.hidden = display.isPlan;
        if (dueBox) dueBox.hidden = !display.isPlan;
        if (trialBadge) trialBadge.hidden = !display.useTrial;
        if (monthRow) monthRow.hidden = !display.showMonthEquiv;
        if (remindNode) remindNode.hidden = !display.useTrial;
        if (artImg) artImg.src = display.isPlan ? ART.plan : ART.credits;

        renderReceive(display.receive);

        modal.classList.toggle('is-plan-checkout', display.isPlan);
        modal.classList.toggle('is-credits-checkout', !display.isPlan);
        modal.classList.toggle('is-trial-start', Boolean(display.useTrial));
        modal.classList.toggle('is-pay-now-start', Boolean(display.isPlan && !display.useTrial));
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

    const openModal = (pack, trigger, options = {}) => {
        lastFocus = trigger || document.activeElement;
        if (pack) currentPack = pack;
        returnTo = options.returnTo || (currentPack.kind === 'plan' ? 'upgrade' : 'buy-credits');
        // Trial vs pay-now is chosen on the Upgrade modal switch.
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
        syncPayment();
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

    syncPayment();
    window.SpacesCheckoutModal = { open: openModal, close: closeModal };
})();
