(() => {
    'use strict';

    const FIRST_KEY = 'planner5d-spaces-v2-ask-copilot-promo-seen';
    const SCOPE_KEY = 'planner5d-spaces-v2-home-scope-promo-seen';
    const SPACE_KEY = 'planner5d-spaces-v2-space-copilot-promo-seen';
    const ONBOARDING_KEY = 'planner5d-spaces-v2-onboarding-enabled';
    const CARET = 8;
    const GAP = 10;

    const trigger = document.querySelector('[data-ask-copilot-item] [data-copilot-trigger]');
    const sidebar = document.querySelector('.spaces-wrap > aside.spaces-sidebar-v2');
    const mainContent = document.querySelector('.spaces-main-content');
    const onboardingButtons = [...document.querySelectorAll('[data-onboarding-option]')];

    const storageGet = key => {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    };

    const storageSet = (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch {
            // Prototype keeps working without persistence.
        }
    };

    const storageRemove = key => {
        try {
            localStorage.removeItem(key);
        } catch {
            // ignore
        }
    };

    const isOnboardingOn = () => storageGet(ONBOARDING_KEY) === '1';

    const homeScopeButton = () => document.querySelector(
        '[data-home-page] [data-home-composer-scope], .spaces-home-composer [data-home-composer-scope]'
    );

    const spaceField = () => document.querySelector(
        '.spaces-space-copilot .spaces-inline-copilot-bar, [data-inline-copilot] .spaces-inline-copilot-bar'
    );

    const spaceName = () => {
        const label = document.querySelector('[data-space-name]')?.textContent?.trim();
        if (label) return label;
        const scope = homeScopeButton()
            ?.querySelector('[data-home-composer-scope-label]')
            ?.textContent
            ?.trim();
        if (scope && scope !== 'No space') return scope;
        return 'My Home';
    };

    const isHomeComposerVisible = () => {
        if (!mainContent?.classList.contains('is-home-page')) return false;
        if (document.body.classList.contains('is-listing-studio-open')) return false;
        if (document.body.classList.contains('is-floor-plan-studio-open')) return false;
        const home = document.querySelector('[data-home-page]');
        if (!home || home.hidden) return false;
        const scope = homeScopeButton();
        if (!scope) return false;
        const rect = scope.getBoundingClientRect();
        return rect.width > 8 && rect.height > 8;
    };

    const isSpaceCopilotVisible = () => {
        if (mainContent?.classList.contains('is-home-page')) return false;
        if (document.body.classList.contains('is-listing-studio-open')) return false;
        if (document.body.classList.contains('is-floor-plan-studio-open')) return false;
        const form = document.querySelector('[data-inline-copilot]');
        const bar = spaceField();
        if (!form || form.hidden || !bar) return false;
        const rect = bar.getBoundingClientRect();
        return rect.width > 8 && rect.height > 8;
    };

    const makeCard = ({ id, titleId, bodyId, title, body }) => {
        const promo = document.createElement('div');
        promo.id = id;
        promo.className = 'spaces-ask-copilot-promo';
        promo.setAttribute('role', 'dialog');
        promo.setAttribute('aria-labelledby', titleId);
        promo.setAttribute('aria-describedby', bodyId);
        promo.hidden = true;
        promo.innerHTML = `
            <div class="spaces-ask-copilot-promo-caret" aria-hidden="true"></div>
            <div class="spaces-ask-copilot-promo-copy">
                <p id="${titleId}" class="spaces-ask-copilot-promo-title"></p>
                <p id="${bodyId}" class="spaces-ask-copilot-promo-body"></p>
            </div>
            <div class="spaces-ask-copilot-promo-footer">
                <button type="button" class="spaces-ask-copilot-promo-got-it" data-ask-copilot-promo-dismiss>Got it</button>
            </div>
        `;
        promo.querySelector('.spaces-ask-copilot-promo-title').textContent = title;
        promo.querySelector('.spaces-ask-copilot-promo-body').textContent = body;
        document.body.appendChild(promo);
        return promo;
    };

    // 1) Sidebar Ask Copilot
    const firstPromo = trigger
        ? makeCard({
            id: 'spaces-ask-copilot-promo',
            titleId: 'spaces-ask-copilot-promo-title',
            bodyId: 'spaces-ask-copilot-promo-body',
            title: 'Your AI for every space',
            body: 'Plan, redesign and list your home, just by asking.'
        })
        : null;

    // 2) Home composer My Home scope — why switch spaces
    const scopePromo = makeCard({
        id: 'spaces-home-scope-promo',
        titleId: 'spaces-home-scope-promo-title',
        bodyId: 'spaces-home-scope-promo-body',
        title: 'Switch the space you’re working in',
        body: 'Pick another space so Copilot uses the right plans, photos and rooms.'
    });
    scopePromo.classList.add('is-above');

    // 3) Space page Copilot field
    const spacePromo = makeCard({
        id: 'spaces-space-copilot-promo',
        titleId: 'spaces-space-copilot-promo-title',
        bodyId: 'spaces-space-copilot-promo-body',
        title: `Copilot already knows ${spaceName()}`,
        body: 'It sees your plans, renders and files, so you can skip the explaining. Ask it to redesign a room, stage it or make a listing.'
    });
    spacePromo.classList.add('is-below');

    const firstSeen = () => storageGet(FIRST_KEY) === '1';
    const scopeSeen = () => storageGet(SCOPE_KEY) === '1';
    const spaceSeen = () => storageGet(SPACE_KEY) === '1';

    const shouldShowFirst = () => Boolean(firstPromo && trigger && !firstSeen());

    const shouldShowScope = () => {
        if (scopeSeen()) return false;
        if (firstPromo && !firstSeen()) return false;
        if (firstPromo && !firstPromo.hidden) return false;
        if (!spacePromo.hidden) return false;
        return true;
    };

    const shouldShowSpace = () => {
        if (spaceSeen()) return false;
        if (firstPromo && !firstSeen()) return false;
        if (firstPromo && !firstPromo.hidden) return false;
        if (!scopeSeen()) return false;
        if (!scopePromo.hidden) return false;
        return true;
    };

    const positionFirst = () => {
        if (!firstPromo || firstPromo.hidden || !trigger) return;
        if (sidebar?.classList.contains('is-hidden')) {
            firstPromo.hidden = true;
            return;
        }
        const rect = trigger.getBoundingClientRect();
        if (rect.width < 4 || rect.height < 4) return;
        const caret = firstPromo.querySelector('.spaces-ask-copilot-promo-caret');
        firstPromo.classList.remove('is-below', 'is-above');
        const card = firstPromo.getBoundingClientRect();
        const top = Math.max(12, Math.min(
            window.innerHeight - card.height - 12,
            rect.top + rect.height / 2 - card.height / 2
        ));
        const left = Math.min(window.innerWidth - card.width - 12, rect.right + GAP);
        firstPromo.style.top = `${Math.round(top)}px`;
        firstPromo.style.left = `${Math.round(left)}px`;
        caret.style.top = `${Math.round(rect.top + rect.height / 2 - top - CARET)}px`;
        caret.style.left = '';
    };

    const positionScope = () => {
        if (scopePromo.hidden) return;
        const btn = homeScopeButton();
        if (!btn || !isHomeComposerVisible()) {
            scopePromo.hidden = true;
            return;
        }
        const caret = scopePromo.querySelector('.spaces-ask-copilot-promo-caret');
        const rect = btn.getBoundingClientRect();
        const card = scopePromo.getBoundingClientRect();
        let top = rect.top - GAP - card.height;
        let placeAbove = true;
        if (top < 12) {
            top = rect.bottom + GAP;
            placeAbove = false;
        }
        const left = Math.max(12, Math.min(
            window.innerWidth - card.width - 12,
            rect.left + rect.width / 2 - card.width / 2
        ));
        scopePromo.classList.toggle('is-above', placeAbove);
        scopePromo.classList.toggle('is-below', !placeAbove);
        scopePromo.style.top = `${Math.round(top)}px`;
        scopePromo.style.left = `${Math.round(left)}px`;
        caret.style.top = '';
        caret.style.left = `${Math.min(card.width - 24, Math.max(20, rect.left + rect.width / 2 - left - CARET))}px`;
    };

    const positionSpace = () => {
        if (spacePromo.hidden) return;
        const bar = spaceField();
        if (!bar || !isSpaceCopilotVisible()) {
            spacePromo.hidden = true;
            return;
        }
        const caret = spacePromo.querySelector('.spaces-ask-copilot-promo-caret');
        const title = spacePromo.querySelector('.spaces-ask-copilot-promo-title');
        if (title) title.textContent = `Copilot already knows ${spaceName()}`;
        const rect = bar.getBoundingClientRect();
        const card = spacePromo.getBoundingClientRect();
        let top = rect.bottom + GAP;
        let placeBelow = true;
        if (top + card.height > window.innerHeight - 12) {
            top = Math.max(12, rect.top - GAP - card.height);
            placeBelow = false;
        }
        const left = Math.max(12, Math.min(window.innerWidth - card.width - 12, rect.left));
        spacePromo.classList.toggle('is-below', placeBelow);
        spacePromo.classList.toggle('is-above', !placeBelow);
        spacePromo.style.top = `${Math.round(top)}px`;
        spacePromo.style.left = `${Math.round(left)}px`;
        caret.style.top = '';
        caret.style.left = `${Math.min(card.width - 24, Math.max(20, rect.left + 28 - left))}px`;
    };

    const showFirst = () => {
        if (!shouldShowFirst()) return;
        if (sidebar?.classList.contains('is-hidden')) return;
        scopePromo.hidden = true;
        spacePromo.hidden = true;
        firstPromo.hidden = false;
        positionFirst();
        requestAnimationFrame(positionFirst);
    };

    const showScope = () => {
        if (!shouldShowScope()) return;
        if (!isHomeComposerVisible()) return;
        spacePromo.hidden = true;
        scopePromo.hidden = false;
        positionScope();
        requestAnimationFrame(positionScope);
    };

    const showSpace = () => {
        if (!shouldShowSpace()) return;
        if (!isSpaceCopilotVisible()) return;
        scopePromo.hidden = true;
        spacePromo.hidden = false;
        positionSpace();
        requestAnimationFrame(positionSpace);
    };

    const advanceAfterFirst = () => {
        requestAnimationFrame(() => {
            if (isHomeComposerVisible()) {
                showScope();
                return;
            }
            // Scope tip waits until Home; space tip only after scope is done.
            if (scopeSeen()) showSpace();
        });
    };

    // If user finishes Ask Copilot while already in a space (before seeing scope),
    // still require scope when they hit Home — but allow space tip only after scope.
    // Exception: if home isn't available and they're on space, wait for scope on next Home visit.
    const dismissFirst = () => {
        if (!firstPromo) return;
        storageSet(FIRST_KEY, '1');
        firstPromo.hidden = true;
        advanceAfterFirst();
    };

    const dismissScope = () => {
        storageSet(SCOPE_KEY, '1');
        scopePromo.hidden = true;
        requestAnimationFrame(showSpace);
    };

    const dismissSpace = () => {
        storageSet(SPACE_KEY, '1');
        spacePromo.hidden = true;
        if (isOnboardingOn()) setOnboarding(false);
    };

    const hideAll = () => {
        if (firstPromo) firstPromo.hidden = true;
        scopePromo.hidden = true;
        spacePromo.hidden = true;
    };

    const syncOnboardingButtons = enabled => {
        onboardingButtons.forEach(btn => {
            const on = btn.getAttribute('data-onboarding-option') === 'on';
            btn.setAttribute('aria-pressed', on === enabled ? 'true' : 'false');
        });
        document.body.classList.toggle('is-onboarding-enabled', enabled);
    };

    const setOnboarding = enabled => {
        if (enabled) {
            storageSet(ONBOARDING_KEY, '1');
            storageRemove(FIRST_KEY);
            storageRemove(SCOPE_KEY);
            storageRemove(SPACE_KEY);
            syncOnboardingButtons(true);
            hideAll();
            requestAnimationFrame(() => {
                showFirst();
                if (!firstPromo || firstPromo.hidden) {
                    showScope();
                    if (scopePromo.hidden) showSpace();
                }
            });
            return;
        }
        storageSet(ONBOARDING_KEY, '0');
        storageSet(FIRST_KEY, '1');
        storageSet(SCOPE_KEY, '1');
        storageSet(SPACE_KEY, '1');
        syncOnboardingButtons(false);
        hideAll();
    };

    firstPromo?.querySelector('[data-ask-copilot-promo-dismiss]')
        ?.addEventListener('click', dismissFirst);
    trigger?.addEventListener('click', () => {
        if (firstPromo && !firstPromo.hidden) dismissFirst();
    });

    scopePromo.querySelector('[data-ask-copilot-promo-dismiss]')
        ?.addEventListener('click', dismissScope);
    document.addEventListener('click', event => {
        if (!scopePromo.hidden) {
            if (event.target.closest('#spaces-home-scope-promo')) return;
            if (event.target.closest('[data-home-composer-scope]')) dismissScope();
            return;
        }
        if (!spacePromo.hidden) {
            if (event.target.closest('#spaces-space-copilot-promo')) return;
            if (event.target.closest('.spaces-space-copilot .spaces-inline-copilot-bar')) {
                dismissSpace();
            }
        }
    });

    spacePromo.querySelector('[data-ask-copilot-promo-dismiss]')
        ?.addEventListener('click', dismissSpace);

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        if (firstPromo && !firstPromo.hidden) {
            dismissFirst();
            return;
        }
        if (!scopePromo.hidden) {
            dismissScope();
            return;
        }
        if (!spacePromo.hidden) dismissSpace();
    });

    onboardingButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setOnboarding(btn.getAttribute('data-onboarding-option') === 'on');
        });
    });

    const onLayout = () => {
        if (firstPromo && !firstPromo.hidden) positionFirst();
        if (!scopePromo.hidden) positionScope();
        else if (!spacePromo.hidden) positionSpace();
        else {
            showScope();
            showSpace();
        }
    };

    window.addEventListener('resize', onLayout);
    window.addEventListener('scroll', onLayout, true);
    document.addEventListener('spaces-navigation-start', () => requestAnimationFrame(onLayout));
    document.addEventListener('spaces-home-surface-changed', () => requestAnimationFrame(onLayout));

    if (mainContent) {
        const observer = new MutationObserver(() => requestAnimationFrame(onLayout));
        observer.observe(mainContent, { attributes: true, attributeFilter: ['class'] });
        const form = document.querySelector('[data-inline-copilot]');
        if (form) observer.observe(form, { attributes: true, attributeFilter: ['hidden'] });
    }

    const start = () => {
        syncOnboardingButtons(isOnboardingOn());
        if (!isOnboardingOn()) {
            hideAll();
            return;
        }
        showFirst();
        if (!firstPromo || firstPromo.hidden) {
            showScope();
            if (scopePromo.hidden) showSpace();
        }
    };

    if (document.readyState === 'complete') requestAnimationFrame(start);
    else window.addEventListener('load', () => requestAnimationFrame(start));
})();
