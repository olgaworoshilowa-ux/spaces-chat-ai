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
    const startSection = modal?.querySelector('[data-checkout-start-section]');
    const companyToggle = modal?.querySelector('[data-checkout-company-toggle]');
    if (!modal || !dialog) return;

    const DEFAULT_CREDITS_RECEIVE = [
        'One-time credits added to this account',
        'Works in Copilot and everywhere in AI Studio',
        'No subscription, no renewal',
        'Your paused task continues right away'
    ];

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

    const renderReceive = items => {
        if (!receiveList) return;
        const list = Array.isArray(items) && items.length ? items : DEFAULT_CREDITS_RECEIVE;
        receiveList.innerHTML = list.map(text => `
            <li>
                <img src="./assets/images/spaces-v2/checkout/check.svg" width="24" height="24" alt="" aria-hidden="true">
                <span>${text}</span>
            </li>
        `).join('');
    };

    const getDisplayState = () => {
        const isPlan = currentPack.kind === 'plan';
        const trialAvailable = Boolean(currentPack.trialAvailable);
        const useTrial = trialAvailable && startMode === 'trial';
        const period = currentPack.annual ? 'billed annually' : 'billed monthly';
        const credits = formatCredits(currentPack.credits || 0);
        const price = money(currentPack.price);

        if (!isPlan) {
            return {
                isPlan: false,
                trialAvailable: false,
                price: money(currentPack.price),
                label: `${formatCredits(currentPack.credits)} credits`,
                summary: currentPack.summary || currentPack.copy || '',
                intro: 'Credits are added to your balance as soon as the payment goes through',
                cta: `Buy ${formatCredits(currentPack.credits)} credits`,
                receive: currentPack.receive || DEFAULT_CREDITS_RECEIVE
            };
        }

        if (useTrial) {
            return {
                isPlan: true,
                trialAvailable: true,
                price: '$0',
                label: `${currentPack.name} · 7 days free`,
                summary: `Then ${price}/month, ${period}. ${credits} credits/month for client-ready interiors.`,
                intro: '7 days free. Your card is saved now — you won’t be charged until the trial ends.',
                cta: 'Start 7-day free trial',
                receive: [
                    '7 days free to try Professional',
                    `${credits} credits every month after the trial`,
                    'Everything in Premium, plus more AI for client work',
                    'Cancel anytime before the trial ends — no charge'
                ]
            };
        }

        return {
            isPlan: true,
            trialAvailable,
            price,
            label: `${currentPack.name} · ${period}`,
            summary: currentPack.summary
                || `${credits} credits/month. Your plan starts today.`,
            intro: currentPack.intro
                || 'Your plan starts as soon as the payment goes through',
            cta: currentPack.cta || `Get ${currentPack.name || 'plan'}`,
            receive: currentPack.receive || [
                `${credits} credits every month`,
                'Everything in Premium, plus more AI for client work',
                'Unlimited 4K renders and custom 3D uploads',
                'Cancel anytime'
            ]
        };
    };

    const syncStartOptions = () => {
        const trialAvailable = Boolean(currentPack.trialAvailable);
        if (startSection) startSection.hidden = !trialAvailable;
        modal.querySelectorAll('[data-checkout-start-options] [data-checkout-start]').forEach(button => {
            const mode = button.getAttribute('data-checkout-start');
            const active = trialAvailable && mode === startMode;
            button.classList.toggle('is-selected', active);
            button.setAttribute('aria-pressed', String(active));
            const radio = button.querySelector('[data-checkout-start-radio]');
            if (radio) {
                radio.src = active
                    ? './assets/images/spaces-v2/checkout/radio-on.svg'
                    : './assets/images/spaces-v2/checkout/radio-off.svg';
            }
        });
    };

    const syncPack = () => {
        const display = getDisplayState();
        if (priceNode) priceNode.textContent = display.price;
        if (creditsLabel) creditsLabel.textContent = display.label;
        if (summaryCopy) summaryCopy.textContent = display.summary;
        if (introNode) introNode.textContent = display.intro;
        if (cta) cta.textContent = display.cta;
        renderReceive(display.receive);
        syncStartOptions();
        modal.classList.toggle('is-plan-checkout', display.isPlan);
        modal.classList.toggle('is-credits-checkout', !display.isPlan);
        modal.classList.toggle('is-trial-start', Boolean(display.trialAvailable && startMode === 'trial'));
        modal.classList.toggle('is-pay-now-start', Boolean(display.trialAvailable && startMode === 'now'));
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
        startMode = currentPack.trialAvailable ? 'trial' : 'now';
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
        const add = Number(currentPack.credits || 0);
        const next = current + add;
        countNode.textContent = String(next);
        const trigger = document.querySelector('[data-header-credits]');
        if (trigger) trigger.setAttribute('aria-label', `${next} credits left`);
    };

    modal.querySelectorAll('[data-checkout-start-options] [data-checkout-start]').forEach(button => {
        button.addEventListener('click', () => {
            if (!currentPack.trialAvailable) return;
            startMode = button.getAttribute('data-checkout-start') || 'trial';
            syncPack();
        });
    });

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
