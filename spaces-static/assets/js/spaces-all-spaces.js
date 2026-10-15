(() => {
    'use strict';

    const MORE_ICON = './assets/images/spaces-v2/centered-chat/more-h.svg';
    const SHARED_BADGE = './assets/images/spaces-v2/recents/user-group.svg';
    const ALL_SPACES_ICON = './assets/images/spaces-v2/home-composer/space.svg';
    const CHECK_ICON = './assets/images/sidebar/dropdown-check.svg';
    const SPACE_FILTER_KEY = 'planner5d-spaces-v2-recents-space-filter';
    const NONE_FILTER = 'none';
    const IMG = {
        living: './assets/images/spaces-v2/recents/preview-1.png',
        vacation: './assets/images/spaces-v2/recents/preview-2.png',
        apartment: './assets/images/spaces-v2/recents/preview-3.png',
        plan: './assets/images/spaces-v2/recents/preview-4.png',
        mosaic: [
            './assets/images/spaces-v2/recents/mosaic-1.png',
            './assets/images/spaces-v2/recents/mosaic-2.png',
            './assets/images/spaces-v2/recents/mosaic-3.png',
            './assets/images/spaces-v2/recents/mosaic-4.png'
        ]
    };

    const FILES_DEMO = {
        today: [
            { id: 'file-1', title: 'Project Name', type: 'Floor plan', image: IMG.living, spaceTitle: 'My Home' }
        ],
        older: [
            { id: 'file-3', title: 'File name', type: 'Floor plan', image: IMG.living, spaceTitle: 'My Home' },
            { id: 'design-1', title: 'Living room', type: 'Design generator', mosaic: IMG.mosaic, spaceTitle: 'My Home' }
        ]
    };

    // Shared tab uses live sidebar shared spaces only — no fake multi-space demos.
    const SHARED_DEMO = {
        today: [],
        older: []
    };

    const page = document.querySelector('[data-all-spaces-page]');
    const body = page?.querySelector('[data-all-spaces-body]');
    const empty = page?.querySelector('[data-all-spaces-empty]');
    const viewButton = page?.querySelector('[data-all-spaces-view]');
    const chips = [...document.querySelectorAll('[data-all-spaces-chip]')];
    const spaceFilterButton = page?.querySelector('[data-all-spaces-space-filter]');
    const spaceFilterIcon = page?.querySelector('[data-all-spaces-space-filter-icon]');
    const spaceFilterLabel = page?.querySelector('[data-all-spaces-space-filter-label]');
    const spaceFilterMenu = page?.querySelector('[data-all-spaces-space-filter-menu]');
    const spaceFilterWrap = page?.querySelector('[data-all-spaces-space-filter-wrap]');

    let spaceFilter = 'all';

    const normalizeFilter = filter => {
        if (filter === 'shared') return 'shared';
        if (filter === 'chats') return 'chats';
        if (filter === 'files' || filter === 'all') return 'files';
        return 'files';
    };

    const spaceTitle = button => (
        button?.querySelector(':scope > span:not(.spaces-space-avatar)')?.textContent?.trim() || 'Space'
    );

    const spaceFilterValue = space => {
        if (!space) return NONE_FILTER;
        if (space.id) return String(space.id);
        if (space.title) return `title:${space.title}`;
        return NONE_FILTER;
    };

    const readSpaceFilter = () => {
        try {
            return sessionStorage.getItem(SPACE_FILTER_KEY) || 'all';
        } catch {
            return 'all';
        }
    };

    const persistSpaceFilter = value => {
        try {
            sessionStorage.setItem(SPACE_FILTER_KEY, value);
        } catch {
            // Standalone lab continues without persistence.
        }
    };

    const spacesFromSidebar = () => {
        const buttons = window.SpacesSidebarNavigation?.getSpaceButtons?.()
            || [...document.querySelectorAll('[data-space-tree] .spaces-space-main')];
        return buttons
            .filter(button => button.closest('[data-space-tree]')?.dataset.accountHidden !== 'true')
            .map((button, index) => {
                const avatar = button.querySelector('.spaces-space-avatar');
                const color = avatar ? getComputedStyle(avatar).backgroundColor : '#d3aaff';
                const letter = avatar?.textContent?.trim()?.charAt(0) || 'S';
                const title = spaceTitle(button);
                const tree = button.closest('[data-space-tree]');
                const id = tree?.dataset.spaceOrder || tree?.id || `sidebar-space-${index}`;
                return {
                    id,
                    title,
                    initial: letter,
                    avatarColor: color,
                    spaceButton: button
                };
            });
    };

    const sharedSpacesFromSidebar = () => {
        return spacesFromSidebar()
            .filter(space => Boolean(space.spaceButton?.querySelector('.spaces-space-shared')))
            .map((space, index) => ({
                id: `sidebar-shared-${index}`,
                title: space.title,
                type: 'Space',
                image: [IMG.vacation, IMG.apartment, IMG.living][index % 3],
                letter: { text: space.initial, color: space.avatarColor },
                shared: true,
                spaceTitle: space.title,
                spaceId: space.id,
                spaceButton: space.spaceButton
            }));
    };

    const itemSpaceKey = item => {
        if (!item) return NONE_FILTER;
        if (item.spaceId) return String(item.spaceId);
        const title = item.spaceTitle || (item.type === 'Space' ? item.title : '');
        if (title) {
            const match = spacesFromSidebar().find(space => space.title === title);
            if (match) return spaceFilterValue(match);
            return `title:${title}`;
        }
        return NONE_FILTER;
    };

    const itemMatchesSpaceFilter = item => {
        if (!spaceFilter || spaceFilter === 'all') return true;
        return itemSpaceKey(item) === String(spaceFilter);
    };

    const filterGroups = groups => ({
        today: (groups.today || []).filter(itemMatchesSpaceFilter),
        older: (groups.older || []).filter(itemMatchesSpaceFilter)
    });

    const spaceFilterOptions = () => {
        const seen = new Set();
        const spaces = [];
        const add = space => {
            if (!space) return;
            const id = space.id === 'all' || space.id === NONE_FILTER
                ? String(space.id)
                : spaceFilterValue(space);
            if (!id || seen.has(id)) return;
            if (space.id !== 'all' && space.id !== NONE_FILTER && !space.title) return;
            seen.add(id);
            spaces.push({ ...space, id });
        };
        add({ id: 'all', title: 'All spaces' });
        // Only real sidebar spaces — never invent options from demo file titles.
        spacesFromSidebar().forEach(add);
        return spaces;
    };

    const emptySpaceIcon = () => {
        const icon = document.createElement('span');
        icon.className = 'spaces-no-space-icon';
        icon.setAttribute('aria-hidden', 'true');
        return icon;
    };

    const spaceInitialNode = space => {
        const initial = document.createElement('span');
        initial.className = 'spaces-home-space-initial';
        initial.setAttribute('aria-hidden', 'true');
        initial.textContent = space?.initial || String(space?.title || 'S').slice(0, 1).toUpperCase();
        if (space?.avatarColor) initial.style.backgroundColor = space.avatarColor;
        return initial;
    };

    const setSpaceFilterIcon = selected => {
        if (!spaceFilterIcon) return;
        spaceFilterIcon.replaceChildren();
        if (spaceFilter === 'all') {
            const img = document.createElement('img');
            img.src = ALL_SPACES_ICON;
            img.width = 16;
            img.height = 16;
            img.alt = '';
            img.setAttribute('aria-hidden', 'true');
            spaceFilterIcon.append(img);
            return;
        }
        if (spaceFilter === NONE_FILTER) {
            spaceFilterIcon.append(emptySpaceIcon());
            return;
        }
        spaceFilterIcon.append(spaceInitialNode(selected));
    };

    const closeSpaceFilterMenu = () => {
        if (!spaceFilterMenu || spaceFilterMenu.hidden) return;
        spaceFilterMenu.hidden = true;
        spaceFilterButton?.setAttribute('aria-expanded', 'false');
        if (spaceFilterWrap && spaceFilterMenu.parentElement !== spaceFilterWrap) {
            spaceFilterWrap.append(spaceFilterMenu);
        }
        spaceFilterMenu.style.position = '';
        spaceFilterMenu.style.top = '';
        spaceFilterMenu.style.left = '';
        spaceFilterMenu.style.right = '';
        spaceFilterMenu.style.minWidth = '';
    };

    const fillSpaceFilterMenu = () => {
        if (!spaceFilterMenu) return;
        spaceFilterMenu.replaceChildren(...spaceFilterOptions().map(option => {
            const id = String(option.id);
            const isSelected = id === String(spaceFilter);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'spaces-home-composer-scope-option';
            button.setAttribute('role', 'option');
            button.setAttribute('aria-selected', String(isSelected));
            button.setAttribute('aria-label', option.title);
            button.classList.toggle('is-selected', isSelected);
            if (id === 'all') {
                const img = document.createElement('img');
                img.src = ALL_SPACES_ICON;
                img.width = 20;
                img.height = 20;
                img.alt = '';
                img.setAttribute('aria-hidden', 'true');
                button.append(img);
            } else if (id === NONE_FILTER) {
                button.append(emptySpaceIcon());
            } else {
                button.append(spaceInitialNode(option));
            }
            const label = document.createElement('span');
            label.textContent = option.title;
            button.append(label);
            const check = document.createElement('img');
            check.className = 'spaces-home-composer-scope-check';
            check.src = CHECK_ICON;
            check.alt = '';
            check.setAttribute('aria-hidden', 'true');
            button.append(check);
            button.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                applySpaceFilter(id);
                closeSpaceFilterMenu();
            });
            return button;
        }));
    };

    const openSpaceFilterMenu = () => {
        if (!spaceFilterMenu || !spaceFilterButton) return;
        closeSpaceFilterMenu();
        fillSpaceFilterMenu();
        const rect = spaceFilterButton.getBoundingClientRect();
        document.body.append(spaceFilterMenu);
        spaceFilterMenu.style.position = 'fixed';
        spaceFilterMenu.style.top = `${Math.round(rect.bottom + 6)}px`;
        spaceFilterMenu.style.left = 'auto';
        spaceFilterMenu.style.right = `${Math.round(window.innerWidth - rect.right)}px`;
        spaceFilterMenu.style.minWidth = `${Math.max(220, Math.round(rect.width))}px`;
        spaceFilterMenu.hidden = false;
        spaceFilterButton.setAttribute('aria-expanded', 'true');
    };

    const syncChips = filter => {
        chips.forEach(chip => {
            const active = chip.dataset.allSpacesChip === filter;
            chip.classList.toggle('is-active', active);
            chip.setAttribute('aria-pressed', String(active));
        });
    };

    const syncSpaceFilterUi = () => {
        const options = spaceFilterOptions();
        if (!options.some(option => String(option.id) === String(spaceFilter))) {
            spaceFilter = 'all';
        }
        const selected = options.find(option => String(option.id) === String(spaceFilter)) || options[0];
        const title = selected?.title || 'All spaces';
        if (spaceFilterLabel) spaceFilterLabel.textContent = title;
        spaceFilterButton?.setAttribute('aria-label', `Filter by space: ${title}`);
        spaceFilterWrap?.classList.toggle('is-filtered', spaceFilter !== 'all');
        setSpaceFilterIcon(selected);
        fillSpaceFilterMenu();
    };

    const applySpaceFilter = (value, { persist = true } = {}) => {
        spaceFilter = String(value || 'all');
        if (persist) persistSpaceFilter(spaceFilter);
        syncSpaceFilterUi();
        render(page?.dataset.allSpacesFilter || 'files');
    };

    const createCard = item => {
        const card = document.createElement('article');
        card.className = 'spaces-all-spaces-card';
        card.dataset.allSpacesCard = item.id;

        const media = document.createElement('button');
        media.type = 'button';
        media.className = 'spaces-all-spaces-card-media';
        media.setAttribute('aria-label', `Open ${item.title}`);

        if (item.mosaic) {
            const mosaic = document.createElement('span');
            mosaic.className = 'spaces-all-spaces-card-mosaic';
            item.mosaic.forEach((src, index) => {
                const cell = document.createElement('span');
                cell.className = `spaces-all-spaces-card-mosaic-cell is-${index + 1}`;
                const img = document.createElement('img');
                img.src = src;
                img.alt = '';
                img.setAttribute('aria-hidden', 'true');
                cell.append(img);
                mosaic.append(cell);
            });
            media.append(mosaic);
        } else {
            const img = document.createElement('img');
            img.className = 'spaces-all-spaces-card-image';
            img.src = item.image;
            img.alt = '';
            img.setAttribute('aria-hidden', 'true');
            media.append(img);
        }

        if (item.shared) {
            const badge = document.createElement('span');
            badge.className = 'spaces-all-spaces-card-shared-badge';
            const badgeImg = document.createElement('img');
            badgeImg.src = SHARED_BADGE;
            badgeImg.width = 20;
            badgeImg.height = 20;
            badgeImg.alt = '';
            badgeImg.setAttribute('aria-hidden', 'true');
            badge.append(badgeImg);
            media.append(badge);
        }

        const meta = document.createElement('div');
        meta.className = 'spaces-all-spaces-card-meta';

        const text = document.createElement('div');
        text.className = 'spaces-all-spaces-card-text';

        const titleRow = document.createElement('div');
        titleRow.className = 'spaces-all-spaces-card-title-row';

        if (item.letter) {
            const letter = document.createElement('span');
            letter.className = 'spaces-all-spaces-card-letter';
            letter.style.background = item.letter.color;
            letter.textContent = item.letter.text;
            titleRow.append(letter);
        }

        const title = document.createElement('p');
        title.className = 'spaces-all-spaces-card-name';
        title.textContent = item.title;
        titleRow.append(title);

        const type = document.createElement('p');
        type.className = 'spaces-all-spaces-card-type';
        type.textContent = item.type;

        text.append(titleRow, type);

        const more = document.createElement('button');
        more.type = 'button';
        more.className = 'spaces-all-spaces-card-more';
        more.setAttribute('aria-label', `More actions for ${item.title}`);
        const moreImg = document.createElement('img');
        moreImg.src = MORE_ICON;
        moreImg.width = 24;
        moreImg.height = 24;
        moreImg.alt = '';
        moreImg.setAttribute('aria-hidden', 'true');
        more.append(moreImg);
        more.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
        });

        meta.append(text, more);
        card.append(media, meta);

        const open = () => {
            if (item.spaceButton) {
                window.SpacesSidebarNavigation?.selectSpace(item.spaceButton, { history: true });
            }
        };
        media.addEventListener('click', open);

        return card;
    };

    const appendSection = (root, label, items) => {
        if (!items.length) return;
        const section = document.createElement('section');
        section.className = 'spaces-all-spaces-section';
        const heading = document.createElement('h2');
        heading.className = 'spaces-all-spaces-section-title';
        heading.textContent = label;
        const grid = document.createElement('div');
        grid.className = 'spaces-all-spaces-grid';
        items.forEach(item => grid.append(createCard(item)));
        section.append(heading, grid);
        root.append(section);
    };

    const filterByType = (groups, predicate) => ({
        today: (groups.today || []).filter(predicate),
        older: (groups.older || []).filter(predicate)
    });

    const itemsForFilter = filter => {
        if (filter === 'chats') return { today: [], older: [] };
        if (filter === 'shared') {
            const live = sharedSpacesFromSidebar();
            if (live.length) {
                return { today: live, older: [] };
            }
            return SHARED_DEMO;
        }
        return filterByType(FILES_DEMO, item => item.type !== 'Space');
    };

    const emptyCopy = filter => {
        if (filter === 'shared') {
            return {
                title: 'Nothing shared yet',
                body: spaceFilter !== 'all'
                    ? 'No shared items in this space yet.'
                    : 'When someone shares a file, project or space with you, it will appear here.',
                illustration: true
            };
        }
        if (filter === 'chats') {
            return {
                title: spaceFilter !== 'all' ? 'No chats in this space' : 'No chats yet',
                body: spaceFilter !== 'all'
                    ? 'Try another space or start a new chat.'
                    : 'Start a chat to see it here.',
                illustration: false
            };
        }
        return {
            title: spaceFilter !== 'all' ? 'No files in this space' : 'No files yet',
            body: spaceFilter !== 'all'
                ? 'Try another space or open a file.'
                : 'Files you open will appear here.',
            illustration: false
        };
    };

    const syncEmptyState = (filter, isEmpty) => {
        if (empty) {
            empty.hidden = !isEmpty;
            if (isEmpty) {
                const copy = emptyCopy(filter);
                const title = empty.querySelector('[data-all-spaces-empty-title]');
                const bodyText = empty.querySelector('[data-all-spaces-empty-body]');
                const illustration = empty.querySelector('[data-all-spaces-empty-illustration]');
                if (title) title.textContent = copy.title;
                if (bodyText) bodyText.textContent = copy.body;
                if (illustration) illustration.hidden = !copy.illustration;
                empty.classList.toggle('is-illustrated', Boolean(copy.illustration));
            }
        }
        // View toggle only makes sense when there are items to display.
        if (viewButton) viewButton.hidden = isEmpty || filter === 'chats';
    };

    const render = (filter = 'files') => {
        if (!page || !body) return;
        const selected = normalizeFilter(filter);
        page.dataset.allSpacesFilter = selected;
        syncChips(selected);
        syncSpaceFilterUi();
        body.classList.toggle('is-chats-list', selected === 'chats');

        if (selected === 'chats') {
            body.replaceChildren();
            const selectedSpace = spaceFilterOptions().find(option => String(option.id) === String(spaceFilter));
            const count = window.SpacesAiChats?.renderListInto?.(body, null, {
                spaceFilter,
                spaceTitle: selectedSpace?.id === 'all' || selectedSpace?.id === NONE_FILTER
                    ? ''
                    : (selectedSpace?.title || '')
            }) ?? 0;
            syncEmptyState(selected, count === 0);
            return;
        }

        const groups = filterGroups(itemsForFilter(selected));
        body.replaceChildren();
        appendSection(body, 'Today', groups.today);
        appendSection(body, 'Older', groups.older);

        const total = groups.today.length + groups.older.length;
        syncEmptyState(selected, total === 0);
    };

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            render(normalizeFilter(chip.dataset.allSpacesChip));
        });
    });

    spaceFilterButton?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        if (spaceFilterMenu && !spaceFilterMenu.hidden) closeSpaceFilterMenu();
        else openSpaceFilterMenu();
    });

    document.addEventListener('click', event => {
        if (!spaceFilterMenu || spaceFilterMenu.hidden) return;
        if (spaceFilterWrap?.contains(event.target) || spaceFilterMenu.contains(event.target)) return;
        closeSpaceFilterMenu();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeSpaceFilterMenu();
    });

    document.addEventListener('spaces-account-sidebar-rendered', () => {
        if (!page || page.hidden) return;
        render(page.dataset.allSpacesFilter || 'files');
    });

    spaceFilter = readSpaceFilter();
    window.SpacesAllSpaces = { render, applySpaceFilter };
})();
