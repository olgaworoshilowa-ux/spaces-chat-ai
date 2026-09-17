(() => {
    'use strict';

    const PREVIEW_IMAGES = [
        '/spaces-chat-ai/spaces-static/assets/images/spaces-v2/all-spaces/space-1.png',
        '/spaces-chat-ai/spaces-static/assets/images/spaces-v2/all-spaces/space-2.png',
        '/spaces-chat-ai/spaces-static/assets/images/spaces-v2/all-spaces/space-3.png'
    ];
    const SHARED_ICON = '/spaces-chat-ai/spaces-static/assets/images/spaces-v2/all-spaces/shared.svg';
    const page = document.querySelector('[data-all-spaces-page]');
    const grid = page?.querySelector('[data-all-spaces-grid]');
    const title = page?.querySelector('[data-all-spaces-title]');
    const empty = page?.querySelector('[data-all-spaces-empty]');

    const spaceTitle = button => button?.querySelector(':scope > span:not(.spaces-space-avatar)')?.textContent?.trim() || 'Space';

    const render = (filter = 'all') => {
        if (!page || !grid) return;

        const isShared = filter === 'shared';
        page.dataset.allSpacesFilter = isShared ? 'shared' : 'all';
        if (title) title.textContent = isShared ? 'Shared with me' : 'Spaces';

        const buttons = window.SpacesSidebarNavigation?.getSpaceButtons?.()
            || [...document.querySelectorAll('[data-space-tree] .spaces-space-main')];
        const spaces = buttons.filter(button => {
            const tree = button.closest('[data-space-tree]');
            if (tree?.dataset.accountHidden === 'true') return false;
            return !isShared || button.querySelector('.spaces-space-shared');
        });

        grid.replaceChildren();
        if (empty) {
            empty.hidden = spaces.length > 0;
            empty.textContent = isShared ? 'No shared spaces yet.' : 'No spaces yet.';
        }

        spaces.forEach((button, index) => {
            const card = document.createElement('button');
            const top = document.createElement('span');
            const name = document.createElement('span');
            const preview = document.createElement('span');
            const image = document.createElement('img');
            const avatar = button.querySelector('.spaces-space-avatar')?.cloneNode(true);

            card.type = 'button';
            card.className = 'spaces-all-spaces-card';
            card.setAttribute('aria-label', `Open ${spaceTitle(button)}`);

            top.className = 'spaces-all-spaces-card-top';
            if (avatar) {
                avatar.classList.add('spaces-all-spaces-card-letter');
                avatar.removeAttribute('aria-hidden');
                top.append(avatar);
            }

            name.className = 'spaces-all-spaces-card-name';
            name.textContent = spaceTitle(button);
            top.append(name);

            if (button.querySelector('.spaces-space-shared')) {
                const badge = document.createElement('span');
                const badgeIcon = document.createElement('img');
                badge.className = 'spaces-all-spaces-card-shared';
                badgeIcon.src = SHARED_ICON;
                badgeIcon.width = 20;
                badgeIcon.height = 20;
                badgeIcon.alt = '';
                badgeIcon.setAttribute('aria-hidden', 'true');
                badge.append(badgeIcon, document.createTextNode('Shared'));
                top.append(badge);
            }

            preview.className = 'spaces-all-spaces-card-preview';
            image.src = PREVIEW_IMAGES[index % PREVIEW_IMAGES.length];
            image.alt = '';
            image.setAttribute('aria-hidden', 'true');
            preview.append(image);

            card.append(top, preview);
            card.addEventListener('click', () => {
                window.SpacesSidebarNavigation?.selectSpace(button, { history: true });
            });
            grid.append(card);
        });
    };

    page?.querySelector('[data-all-spaces-create]')?.addEventListener('click', () => {
        document.querySelector('.header-create-button')?.click();
    });

    document.addEventListener('spaces-account-sidebar-rendered', () => {
        if (!page || page.hidden) return;
        render(page.dataset.allSpacesFilter === 'shared' ? 'shared' : 'all');
    });

    window.SpacesAllSpaces = { render };
})();
