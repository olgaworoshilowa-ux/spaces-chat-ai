(() => {
    'use strict';

    const FIRST_KEY = 'planner5d-spaces-v2-ask-copilot-promo-seen';
    const SECOND_KEY = 'planner5d-spaces-v2-space-copilot-promo-seen';
    const CARET = 8;
    const GAP = 10;

    const trigger = document.querySelector('[data-ask-copilot-item] [data-copilot-trigger]');
    const sidebar = document.querySelector('.spaces-wrap > aside.spaces-sidebar-v2');
    const mainContent = document.querySelector('.spaces-main-content');

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

    const isHomeOrDirectory = () => {
        if (!mainContent) return true;
        return mainContent.classList.contains('is-home-page')
            || mainContent.classList.contains('is-all-spaces-page')
            || mainContent.classList.contains('is-ai-chats-page')
            || mainContent.classList.contains('is-listing-studio-page')
            || document.body.classList.contains('is-listing-studio-open')
            || mainContent.classList.contains('is-floor-plan-studio-page')
            || document.body.classList.contains('is-floor-plan-studio-open');
    };

    const spaceField = () => document.querySelector('.spaces-space-copilot .spaces-inline-copilot-bar');

    const isSpaceCopilotVisible = () => {
        if (isHomeOrDirectory()) return false;
        const form = document.querySelector('[data-inline-copilot]');
        const bar = spaceField();
        if (!form || form.hidden || !bar) return false;
        const rect = bar.getBoundingClientRect();
        return rect.width > 8 && rect.height > 8;
    };

    const spaceName = () => {
        const label = document.querySelector('[data-space-name]')?.textContent?.trim();
        return label || 'this space';
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

    const firstPromo = trigger && storageGet(FIRST_KEY) !== '1'
        ? makeCard({
            id: 'spaces-ask-copilot-promo',
            titleId: 'spaces-ask-copilot-promo-title',
            bodyId: 'spaces-ask-copilot-promo-body',
            title: 'Ask copilot to build anything',
            body: 'Build, ideate with the help of the copilot'
        })
        : null;

    const secondPromo = makeCard({
        id: 'spaces-space-copilot-promo',
        titleId: 'spaces-space-copilot-promo-title',
        bodyId: 'spaces-space-copilot-promo-body',
        title: `AI that already knows ${spaceName()}`,
        body: 'ask it to redesign a room, render it or plan the space'
    });
    secondPromo.classList.add('is-below');

    const positionFirst = () => {
        if (!firstPromo || firstPromo.hidden || !trigger) return;
        if (sidebar?.classList.contains('is-hidden')) {
            firstPromo.hidden = true;
            return;
        }
        const caret = firstPromo.querySelector('.spaces-ask-copilot-promo-caret');
        const rect = trigger.getBoundingClientRect();
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

    const positionSecond = () => {
        if (secondPromo.hidden) return;
        const bar = spaceField();
        if (!bar || !isSpaceCopilotVisible()) {
            secondPromo.hidden = true;
            return;
        }
        const caret = secondPromo.querySelector('.spaces-ask-copilot-promo-caret');
        const title = secondPromo.querySelector('.spaces-ask-copilot-promo-title');
        if (title) title.textContent = `AI that already knows ${spaceName()}`;
        const rect = bar.getBoundingClientRect();
        const card = secondPromo.getBoundingClientRect();
        let top = rect.bottom + GAP;
        let placeBelow = true;
        if (top + card.height > window.innerHeight - 12) {
            top = Math.max(12, rect.top - GAP - card.height);
            placeBelow = false;
        }
        const left = Math.max(12, Math.min(window.innerWidth - card.width - 12, rect.left));
        secondPromo.classList.toggle('is-below', placeBelow);
        secondPromo.classList.toggle('is-above', !placeBelow);
        secondPromo.style.top = `${Math.round(top)}px`;
        secondPromo.style.left = `${Math.round(left)}px`;
        caret.style.top = '';
        caret.style.left = `${Math.min(card.width - 24, Math.max(20, rect.left + 28 - left))}px`;
    };

    const showFirst = () => {
        if (!firstPromo || storageGet(FIRST_KEY) === '1') return;
        if (sidebar?.classList.contains('is-hidden')) return;
        firstPromo.hidden = false;
        positionFirst();
        requestAnimationFrame(positionFirst);
    };

    const showSecond = () => {
        if (storageGet(SECOND_KEY) === '1') return;
        if (storageGet(FIRST_KEY) !== '1') return;
        if (firstPromo && !firstPromo.hidden) return;
        if (!isSpaceCopilotVisible()) return;
        secondPromo.hidden = false;
        positionSecond();
        requestAnimationFrame(positionSecond);
    };

    const dismissFirst = () => {
        if (!firstPromo) return;
        storageSet(FIRST_KEY, '1');
        firstPromo.hidden = true;
        requestAnimationFrame(showSecond);
    };

    const dismissSecond = () => {
        storageSet(SECOND_KEY, '1');
        secondPromo.hidden = true;
    };

    firstPromo?.querySelector('[data-ask-copilot-promo-dismiss]')
        ?.addEventListener('click', dismissFirst);
    trigger?.addEventListener('click', () => {
        if (firstPromo && !firstPromo.hidden) dismissFirst();
    });

    secondPromo.querySelector('[data-ask-copilot-promo-dismiss]')
        ?.addEventListener('click', dismissSecond);
    document.addEventListener('click', event => {
        if (secondPromo.hidden) return;
        if (event.target.closest('#spaces-space-copilot-promo')) return;
        if (event.target.closest('.spaces-space-copilot .spaces-inline-copilot-bar')) {
            dismissSecond();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        if (firstPromo && !firstPromo.hidden) {
            dismissFirst();
            return;
        }
        if (!secondPromo.hidden) dismissSecond();
    });

    const onLayout = () => {
        positionFirst();
        if (!secondPromo.hidden) positionSecond();
        else showSecond();
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
        if (firstPromo) showFirst();
        else showSecond();
    };

    if (document.readyState === 'complete') requestAnimationFrame(start);
    else window.addEventListener('load', () => requestAnimationFrame(start));
})();
