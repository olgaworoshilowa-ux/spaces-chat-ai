(() => {
    'use strict';

    const STORAGE_KEY = 'planner5d-spaces-v2-ai-chats';
    const SIDEBAR_LIMIT = 3;
    const ALL_CHATS_MIN = 1;
    const section = document.querySelector('[data-ai-chats-section]');
    const list = section?.querySelector('[data-ai-chats-list]');
    const allButton = section?.querySelector('[data-ai-chats-all]');
    const newWrap = section?.querySelector('[data-ai-chats-new-wrap]');
    const newButton = section?.querySelector('[data-ai-chats-new]');
    const sidebarFilter = section?.querySelector('[data-ai-chats-sidebar-filter]');
    const sidebarFilterIcon = section?.querySelector('[data-ai-chats-sidebar-filter-icon]');
    const sidebarFilterLabel = section?.querySelector('[data-ai-chats-sidebar-filter-label]');
    const sidebarFilterMenu = section?.querySelector('[data-ai-chats-sidebar-filter-menu]');
    const sidebarFilterWrap = section?.querySelector('.spaces-ai-chats-heading-filter-wrap');
    const page = document.querySelector('[data-ai-chats-page]');
    const pageList = page?.querySelector('[data-ai-chats-page-list]');
    const pageEmpty = page?.querySelector('[data-ai-chats-page-empty]');
    const pageNew = page?.querySelector('[data-ai-chats-page-new]');
    const pageFilter = page?.querySelector('[data-ai-chats-space-filter]');
    const pageFilterIcon = page?.querySelector('[data-ai-chats-space-filter-icon]');
    const pageFilterLabel = page?.querySelector('[data-ai-chats-space-filter-label]');
    const pageFilterMenu = page?.querySelector('[data-ai-chats-space-filter-menu]');
    const FILTER_STORAGE_KEY = 'planner5d-spaces-v2-ai-chats-space-filter';
    const checkIcon = './assets/images/sidebar/dropdown-check.svg';
    const allSpacesIcon = './assets/images/spaces-v2/home-composer/space.svg';
    const homeButton = document.querySelector('[data-home-page-trigger]');
    const askItem = homeButton?.closest('[data-ask-copilot-item], li');
    const chatTitleNode = document.querySelector('[data-home-chat-title]');
    const chatMenuButton = document.querySelector('[data-home-chat-menu-button]');
    const chatMenu = document.querySelector('[data-home-chat-menu]');
    const artifactsRoot = document.querySelector('[data-home-chat-artifacts]');
    const artifactsButton = document.querySelector('[data-home-chat-artifacts-button]');
    const artifactsMenu = document.querySelector('[data-home-chat-artifacts-menu]');
    const artifactsCount = document.querySelector('[data-home-chat-artifacts-count]');
    const artifactPreview = document.querySelector('[data-home-artifact-preview]');
    const artifactPreviewTitle = document.querySelector('[data-home-artifact-preview-title]');
    const artifactPreviewImage = document.querySelector('[data-home-artifact-preview-image]');
    const artifactPreviewClose = document.querySelector('[data-home-artifact-preview-close]');
    const homeThread = document.querySelector('[data-home-thread]');
    const bubbleIcon = './assets/images/sidebar/layout-aa/ai-chat-bubble.svg';
    const moreIcon = './assets/images/sidebar/more.svg';

    if (!section || !list) return;

    let knownSpaces = [];
    let chats = [];
    let currentId = null;
    let openMenuId = null;
    let renamingId = null;
    let pageSpaceFilter = 'all';

    const isCombinedNewChatEntry = () => document.body.classList.contains('is-new-chat-entry-combined');

    const readStore = () => {
        try {
            const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
            if (!Array.isArray(parsed)) return [];
            return parsed.map(chat => {
                if (!chat) return chat;
                const spaceTitle = chat.spaceTitle
                    || chat.snapshot?.listingSpaceTitle
                    || chat.snapshot?.contextSpaceTitle
                    || '';
                const spaceId = chat.spaceId
                    || chat.snapshot?.listingSpaceId
                    || chat.snapshot?.contextSpaceId
                    || '';
                const prompt = chat.prompt || promptFromSnapshot(chat.snapshot);
                if (chat.customTitle) {
                    return { ...chat, spaceTitle, spaceId, prompt, pinned: Boolean(chat.pinned) };
                }
                return {
                    ...chat,
                    spaceTitle,
                    spaceId,
                    prompt,
                    pinned: Boolean(chat.pinned),
                    title: titleFrom(chat.title, {
                        spaceTitle,
                        listing: isListingChat(chat.snapshot)
                    })
                };
            });
        } catch {
            return [];
        }
    };

    const writeStore = () => {
        sortChats();
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
        } catch {
            // The standalone lab continues without persisted chats.
        }
    };

    const sortChats = () => {
        chats = [...chats].sort((a, b) => {
            const pin = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
            if (pin) return pin;
            return (b.updatedAt || 0) - (a.updatedAt || 0);
        });
    };

    const TITLE_HINTS = [
        [/turn this home into a listing/i, 'Listing'],
        [/create a floor plan from my image/i, 'Floor plan'],
        [/furnish the bedroom/i, 'Bedroom furniture'],
        [/without lightn/i, 'Lighting check'],
        [/stage the living room/i, 'Living room staging'],
        [/create a home tour/i, 'Home tour']
    ];

    const titleFrom = (text, extra = {}) => {
        const spaceTitle = String(extra.spaceTitle || extra.listingSpaceTitle || '').trim();
        const listingLike = Boolean(extra.listing || extra.listingSpaceTitle)
            || /listing|stage |home tour|for buyers/i.test(String(text || ''));
        if (spaceTitle && listingLike) return `Listing: ${spaceTitle}`;
        if (spaceTitle) return spaceTitle;
        const value = String(text || '').replace(/\s+/g, ' ').trim();
        if (!value) return 'New chat';
        const hint = TITLE_HINTS.find(([pattern]) => pattern.test(value));
        if (hint) return hint[1];
        const cleaned = value
            .replace(/^(please|can you|could you|help me|i want to)\s+/i, '')
            .replace(/[.?!]+$/, '');
        if (cleaned.length <= 32) {
            return cleaned.replace(/^./, letter => letter.toUpperCase());
        }
        return `${cleaned.slice(0, 31)}…`;
    };

    const isListingChat = snapshot => {
        const step = snapshot?.listingStep;
        return Boolean(step && step !== 'generic');
    };

    const visibleChats = () => filteredChats().slice(0, SIDEBAR_LIMIT);

    const isAllChatsPage = () => document.querySelector('.spaces-main-content')?.classList.contains('is-ai-chats-page');

    const promptFromSnapshot = snapshot => {
        const html = snapshot?.threadHTML;
        if (html) {
            const wrap = document.createElement('div');
            wrap.innerHTML = html;
            const text = wrap.querySelector('.spaces-home-message.is-user p, .spaces-copilot-message.is-user p')?.textContent?.trim();
            if (text) return text;
        }
        return String(snapshot?.title || '').replace(/\s+/g, ' ').trim();
    };

    const chatSpaceTitle = chat => {
        const value = String(
            chat?.spaceTitle
            || chat?.snapshot?.listingSpaceTitle
            || chat?.snapshot?.contextSpaceTitle
            || ''
        ).trim();
        return !value || /^all spaces$/i.test(value) || /^no space$/i.test(value) ? '' : value;
    };

    const chatSpace = chat => {
        const title = chatSpaceTitle(chat);
        const id = String(chat?.spaceId || chat?.snapshot?.listingSpaceId || chat?.snapshot?.contextSpaceId || '');
        if (id) {
            const byId = knownSpaces.find(space => String(space.id) === id);
            if (byId) return byId;
        }
        if (title) {
            const byTitle = knownSpaces.find(space => String(space.title) === title);
            if (byTitle) return byTitle;
            return {
                title,
                initial: title.slice(0, 1).toUpperCase(),
                avatarColor: '#6BA6F5'
            };
        }
        return null;
    };

    const NONE_FILTER = 'none';

    const emptySpaceIcon = () => {
        const icon = document.createElement('span');
        icon.className = 'spaces-no-space-icon';
        icon.setAttribute('aria-hidden', 'true');
        return icon;
    };

    const spaceInitial = space => {
        const initial = document.createElement('span');
        initial.className = 'spaces-home-space-initial';
        initial.setAttribute('aria-hidden', 'true');
        initial.textContent = space?.initial || String(space?.title || 'S').slice(0, 1).toUpperCase();
        if (space?.avatarColor) initial.style.backgroundColor = space.avatarColor;
        return initial;
    };

    const spaceFilterValue = space => {
        if (!space) return NONE_FILTER;
        if (space.id) return String(space.id);
        return `title:${space.title}`;
    };

    const readSpaceFilter = () => {
        try {
            return sessionStorage.getItem(FILTER_STORAGE_KEY) || 'all';
        } catch {
            return 'all';
        }
    };

    const persistSpaceFilter = value => {
        try {
            sessionStorage.setItem(FILTER_STORAGE_KEY, value);
        } catch {
            // The standalone lab continues without persisted filters.
        }
    };

    const chatMatchesSpaceFilter = (chat, filterId = pageSpaceFilter) => {
        if (!filterId || filterId === 'all') return true;
        return spaceFilterValue(chatSpace(chat)) === String(filterId);
    };

    const filteredChats = () => chats.filter(chat => chatMatchesSpaceFilter(chat));

    const spaceFilterOptions = () => {
        const seen = new Set();
        const spaces = [];
        const add = space => {
            if (!space) return;
            const id = spaceFilterValue(space);
            if (!id || seen.has(id)) return;
            seen.add(id);
            spaces.push(space);
        };
        knownSpaces.forEach(add);
        chats.forEach(chat => add(chatSpace(chat)));
        return [
            { id: 'all', title: 'All spaces' },
            ...spaces.filter(Boolean),
            { id: NONE_FILTER, title: 'No space' }
        ];
    };

    const closeSpaceFilterMenu = () => {
        filterSlots().forEach(slot => {
            if (!slot.menu || slot.menu.hidden) return;
            slot.menu.hidden = true;
            slot.button?.setAttribute('aria-expanded', 'false');
            if (slot.wrap && slot.menu.parentElement !== slot.wrap) slot.wrap.append(slot.menu);
            slot.menu.style.position = '';
            slot.menu.style.top = '';
            slot.menu.style.left = '';
            slot.menu.style.right = '';
            slot.menu.style.minWidth = '';
        });
    };

    const optionFilterId = option => {
        if (!option) return 'all';
        if (option.id === 'all' || option.id === NONE_FILTER) return String(option.id);
        return spaceFilterValue(option);
    };

    const filterSlots = () => [
        {
            button: pageFilter,
            icon: pageFilterIcon,
            label: pageFilterLabel,
            menu: pageFilterMenu,
            wrap: pageFilter?.closest('.spaces-ai-chats-page-filter-wrap'),
            iconSize: 20
        },
        {
            button: sidebarFilter,
            icon: sidebarFilterIcon,
            label: sidebarFilterLabel,
            menu: sidebarFilterMenu,
            wrap: sidebarFilterWrap,
            iconSize: 16
        }
    ].filter(slot => slot.button || slot.menu);

    const setFilterIcon = (slot, selected) => {
        if (!slot.icon) return;
        const size = slot.iconSize || 20;
        slot.icon.replaceChildren();
        if (pageSpaceFilter === 'all') {
            const img = document.createElement('img');
            img.src = allSpacesIcon;
            img.width = size;
            img.height = size;
            img.alt = '';
            img.setAttribute('aria-hidden', 'true');
            slot.icon.append(img);
            return;
        }
        if (pageSpaceFilter === NONE_FILTER) {
            slot.icon.append(emptySpaceIcon());
            return;
        }
        slot.icon.append(spaceInitial(selected));
    };

    const applySpaceFilter = (value, { persist = true, renderLists = true } = {}) => {
        pageSpaceFilter = String(value || 'all');
        const options = spaceFilterOptions();
        if (!options.some(option => optionFilterId(option) === pageSpaceFilter)) {
            pageSpaceFilter = 'all';
        }
        if (persist) persistSpaceFilter(pageSpaceFilter);
        const selected = options.find(option => optionFilterId(option) === pageSpaceFilter) || options[0];
        const title = selected?.title || 'All spaces';
        filterSlots().forEach(slot => {
            if (slot.label) slot.label.textContent = title;
            slot.button?.setAttribute('aria-label', `Filter chats by space: ${title}`);
            setFilterIcon(slot, selected);
        });
        renderSpaceFilterMenu();
        if (renderLists) render();
    };

    const fillFilterMenu = menu => {
        if (!menu) return;
        menu.replaceChildren(...spaceFilterOptions().map(option => {
            const id = optionFilterId(option);
            const isSelected = id === String(pageSpaceFilter);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'spaces-home-composer-scope-option';
            button.setAttribute('role', 'option');
            button.dataset.aiChatsSpaceFilterOption = id;
            button.setAttribute('aria-selected', String(isSelected));
            button.setAttribute('aria-label', option.title);
            button.classList.toggle('is-selected', isSelected);
            if (id === 'all') {
                const img = document.createElement('img');
                img.src = allSpacesIcon;
                img.width = 20;
                img.height = 20;
                img.alt = '';
                img.setAttribute('aria-hidden', 'true');
                button.append(img);
            } else if (id === NONE_FILTER) {
                button.append(emptySpaceIcon());
            } else {
                button.append(spaceInitial(option));
            }
            const label = document.createElement('span');
            label.textContent = option.title;
            button.append(label);
            const check = document.createElement('img');
            check.className = 'spaces-home-composer-scope-check';
            check.src = checkIcon;
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

    const renderSpaceFilterMenu = () => {
        filterSlots().forEach(slot => fillFilterMenu(slot.menu));
    };

    const openSpaceFilterMenu = slot => {
        closeSpaceFilterMenu();
        if (!slot?.menu) return;
        fillFilterMenu(slot.menu);
        if (slot.button) {
            const rect = slot.button.getBoundingClientRect();
            document.body.append(slot.menu);
            slot.menu.style.position = 'fixed';
            slot.menu.style.top = `${Math.round(rect.bottom + 6)}px`;
            slot.menu.style.left = `${Math.round(Math.min(rect.left, window.innerWidth - 228))}px`;
            slot.menu.style.right = 'auto';
            slot.menu.style.minWidth = `${Math.max(220, Math.round(rect.width))}px`;
        }
        slot.menu.hidden = false;
        slot.button?.setAttribute('aria-expanded', 'true');
    };

    const spaceBadge = space => {
        const badge = document.createElement('span');
        if (!space) {
            badge.className = 'spaces-ai-chats-page-item-badge is-space is-empty';
            const icon = document.createElement('span');
            icon.className = 'spaces-ai-chats-page-item-empty-space';
            icon.setAttribute('aria-hidden', 'true');
            const name = document.createElement('span');
            name.textContent = 'No space';
            badge.append(icon, name);
            return badge;
        }
        badge.className = 'spaces-ai-chats-page-item-badge is-space';
        const initial = document.createElement('span');
        initial.className = 'spaces-home-space-initial';
        initial.setAttribute('aria-hidden', 'true');
        initial.textContent = space.initial || String(space.title || 'S').slice(0, 1).toUpperCase();
        if (space.avatarColor) initial.style.backgroundColor = space.avatarColor;
        const name = document.createElement('span');
        name.textContent = space.title;
        badge.append(initial, name);
        return badge;
    };

    const formatChatDate = timestamp => {
        const date = new Date(Number(timestamp) || Date.now());
        if (Number.isNaN(date.getTime())) return 'Today';
        const startOfDay = value => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
        const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
        if (diffDays <= 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
    };

    const formatChatTime = timestamp => {
        const date = new Date(Number(timestamp) || Date.now());
        if (Number.isNaN(date.getTime())) return '';
        if (formatChatDate(timestamp) !== 'Today') return '';
        return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(date);
    };

    const chatsByDate = () => {
        const groups = [];
        filteredChats().forEach(chat => {
            const label = formatChatDate(chat.updatedAt);
            const last = groups[groups.length - 1];
            if (last && last.label === label) {
                last.items.push(chat);
                return;
            }
            groups.push({ label, items: [chat] });
        });
        return groups;
    };

    const closeChatMenu = () => {
        if (!chatMenu || chatMenu.hidden) return;
        chatMenu.hidden = true;
        chatMenu.classList.remove('is-active');
        chatMenuButton?.setAttribute('aria-expanded', 'false');
    };

    const closeArtifactsMenu = () => {
        if (!artifactsMenu || artifactsMenu.hidden) return;
        artifactsMenu.hidden = true;
        artifactsButton?.setAttribute('aria-expanded', 'false');
    };

    const closeArtifactPreview = () => {
        if (!artifactPreview || artifactPreview.hidden) return;
        artifactPreview.hidden = true;
        if (artifactPreviewImage) artifactPreviewImage.removeAttribute('src');
    };

    const DEMO_ARTIFACTS = [
        {
            test: /floor plan/i,
            id: 'demo-floor-plan',
            title: 'Generated floor plan',
            type: 'Floor plan',
            previewUrl: './assets/images/spaces-v2/inside-section-file.webp'
        },
        {
            test: /stage the living room|staging/i,
            id: 'demo-staging',
            title: 'Living room staging',
            type: 'Render',
            previewUrl: './assets/images/spaces/card-image-1.webp'
        },
        {
            test: /home tour|walkthrough/i,
            id: 'demo-tour',
            title: 'Home tour',
            type: '360° walkthrough',
            previewUrl: './assets/images/spaces-v2/collection-preview.png'
        },
        {
            test: /furnish the bedroom/i,
            id: 'demo-bedroom',
            title: 'Bedroom furniture',
            type: 'Render',
            previewUrl: './assets/images/spaces/card-image-1.webp'
        },
        {
            test: /without lightn/i,
            id: 'demo-lighting',
            title: 'Lighting check',
            type: 'Note',
            previewUrl: './assets/images/spaces-v2/inside-section-file.webp'
        }
    ];

    const collectArtifacts = () => {
        const items = [];
        const seen = new Set();
        const add = item => {
            if (!item?.id || seen.has(item.id)) return;
            seen.add(item.id);
            items.push(item);
        };

        const snapshot = window.SpacesListingChat?.serialize?.();
        const listingReady = ['ready', 'followup'].includes(snapshot?.listingStep)
            || Boolean(homeThread?.querySelector('.spaces-home-listing-card'));
        if (listingReady && snapshot?.listingStep !== 'furnish-ready') {
            const spaceTitle = snapshot?.listingSpaceTitle || snapshot?.contextSpaceTitle || '';
            add({
                id: 'listing-draft',
                kind: 'listing',
                title: spaceTitle ? `Listing: ${spaceTitle}` : 'Listing draft',
                type: 'Listing',
                previewUrl: '../listings-final/photos/villa.jpg'
            });
            const include = snapshot?.listingInclude || [];
            if (include.includes('floor-plan')) {
                add({
                    id: 'listing-floor-plan',
                    kind: 'file',
                    title: 'Floor plan',
                    type: 'Floor plan',
                    previewUrl: './assets/images/spaces-v2/inside-section-file.webp'
                });
            }
            if (include.includes('tour')) {
                add({
                    id: 'listing-tour',
                    kind: 'file',
                    title: 'Home tour',
                    type: '360° walkthrough',
                    previewUrl: './assets/images/spaces-v2/collection-preview.png'
                });
            }
        }

        if (snapshot?.listingStep === 'furnish-ready' || homeThread?.querySelector('.spaces-home-plan-card')) {
            add({
                id: 'furnish-floor-plan',
                kind: 'floor-plan',
                title: snapshot?.furnishStyle
                    ? `Bedroom · ${snapshot.furnishStyle}`
                    : 'Bedroom floor plan',
                type: 'Floor plan',
                previewUrl: './assets/images/spaces-v2/inside-section-file.webp'
            });
        }

        (window.SpacesHomeComposer?.getAttachments?.() || []).forEach(file => {
            add({
                id: `file-${file.id}`,
                kind: 'file',
                title: file.title || 'File',
                type: file.type || 'File',
                previewUrl: file.previewUrl || ''
            });
        });

        const chat = chats.find(item => item.id === currentId);
        const prompt = `${chat?.title || ''} ${chat?.prompt || ''} ${snapshot?.title || ''}`;
        DEMO_ARTIFACTS.forEach(demo => {
            if (demo.test.test(prompt)) add({ ...demo, kind: 'file' });
        });

        (chat?.artifacts || []).forEach(item => add(item));
        return items;
    };

    const persistArtifacts = items => {
        const chat = chats.find(item => item.id === currentId);
        if (!chat) return;
        chat.artifacts = items.map(item => ({
            id: item.id,
            kind: item.kind,
            title: item.title,
            type: item.type,
            previewUrl: item.previewUrl || ''
        }));
        writeStore();
    };

    const openArtifact = item => {
        closeArtifactsMenu();
        if (item.kind === 'listing') {
            window.SpacesListingChat?.openDraft?.({ mode: 'edit' });
            return;
        }
        if (item.kind === 'floor-plan') {
            window.SpacesListingChat?.openFloorPlan?.();
            return;
        }
        if (!artifactPreview || !item.previewUrl) return;
        if (artifactPreviewTitle) artifactPreviewTitle.textContent = item.title || 'Artifact';
        if (artifactPreviewImage) {
            artifactPreviewImage.src = item.previewUrl;
            artifactPreviewImage.alt = item.title || '';
        }
        artifactPreview.hidden = false;
    };

    const renderArtifacts = () => {
        if (!artifactsMenu || !artifactsButton) return;
        const items = collectArtifacts();
        persistArtifacts(items);
        if (artifactsRoot) artifactsRoot.hidden = items.length === 0;
        if (artifactsCount) {
            artifactsCount.textContent = String(items.length);
            artifactsCount.hidden = items.length === 0;
        }
        artifactsButton.setAttribute('aria-label', items.length
            ? `Artifacts, ${items.length}`
            : 'Artifacts');
        if (!items.length) {
            artifactsMenu.replaceChildren();
            closeArtifactsMenu();
            return;
        }
        const heading = document.createElement('p');
        heading.className = 'spaces-home-chat-artifacts-heading';
        heading.textContent = 'Artifacts';
        artifactsMenu.replaceChildren(heading, ...items.map(item => {
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('role', 'menuitem');
            button.className = 'spaces-home-chat-artifacts-item';
            const thumb = document.createElement('span');
            thumb.className = 'spaces-home-chat-artifacts-thumb';
            if (item.previewUrl) {
                const image = document.createElement('img');
                image.src = item.previewUrl;
                image.alt = '';
                thumb.append(image);
            }
            const copy = document.createElement('span');
            copy.className = 'spaces-home-chat-artifacts-copy';
            const title = document.createElement('span');
            title.className = 'spaces-home-chat-artifacts-title';
            title.textContent = item.title;
            const meta = document.createElement('span');
            meta.className = 'spaces-home-chat-artifacts-meta';
            meta.textContent = 'Made with AI';
            copy.append(title, meta);
            button.append(thumb, copy);
            button.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                openArtifact(item);
            });
            return button;
        }));
    };

    const isCenteredChat = () => document.querySelector('[data-home-page]')?.classList.contains('is-centered-chat');

    const ensureCurrentChatId = () => {
        if (currentId && chats.some(item => item.id === currentId)) return currentId;
        if (!isCenteredChat()) return null;
        if (chats[0]?.id) {
            currentId = chats[0].id;
            return currentId;
        }
        const title = chatTitleNode?.textContent?.trim() || 'New chat';
        return beginSession({ title, prompt: title })?.id || currentId;
    };

    const addHeaderMenuItem = (label, onClick, extraClass = '') => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('role', 'menuitem');
        button.className = extraClass
            ? `spaces-home-chat-header-menu-item ${extraClass}`
            : 'spaces-home-chat-header-menu-item';
        button.textContent = label;
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            closeChatMenu();
            onClick();
        });
        return button;
    };

    const renderChatMenu = () => {
        if (!chatMenu) return;
        const chatId = currentId || (isCenteredChat() ? chats[0]?.id : null);
        const nodes = [];
        if (chatId || isCenteredChat()) {
            nodes.push(
                addHeaderMenuItem('Rename', () => {
                    const id = ensureCurrentChatId();
                    if (id) beginRename(id);
                }),
                addHeaderMenuItem('Delete', () => {
                    const id = ensureCurrentChatId();
                    if (id) deleteChat(id);
                    else {
                        window.SpacesListingChat?.end?.();
                        startNew();
                    }
                }, 'is-danger')
            );
        }
        chatMenu.replaceChildren(...nodes);
    };

    const syncChatHeader = () => {
        if (!chatTitleNode) return;
        const chat = chats.find(item => item.id === currentId);
        if (chat?.title) {
            chatTitleNode.textContent = chat.title;
        } else {
            const fromThread = document.querySelector('[data-home-thread] .spaces-home-message.is-user p')?.textContent?.trim();
            chatTitleNode.textContent = fromThread
                ? titleFrom(fromThread)
                : 'New chat';
        }
        renderChatMenu();
        renderArtifacts();
    };

    const chatMeta = chat => {
        const space = chatSpaceTitle(chat);
        const date = formatChatDate(chat?.updatedAt);
        return space ? `${space} · ${date}` : date;
    };

    const closeMenus = () => {
        openMenuId = null;
        document.querySelectorAll('.spaces-ai-chats-row, .spaces-ai-chats-page-row').forEach(row => {
            row.classList.remove('is-menu-open');
            const more = row.querySelector('[data-ai-chat-more]');
            const menu = row.querySelector('[data-ai-chat-menu]');
            if (more) more.setAttribute('aria-expanded', 'false');
            if (menu) menu.hidden = true;
        });
    };

    const setActiveChat = id => {
        currentId = id || null;
        homeButton?.classList.toggle('is-active', !currentId && document.querySelector('.spaces-main-content')?.classList.contains('is-home-page'));
        if (currentId) {
            homeButton?.classList.remove('is-active');
            homeButton?.removeAttribute('aria-current');
        }
        list.querySelectorAll('[data-ai-chat-item]').forEach(button => {
            const active = button.dataset.aiChatItem === currentId;
            button.classList.toggle('is-active', active);
            button.closest('.spaces-ai-chats-row')?.classList.toggle('is-active', active);
            if (active) button.setAttribute('aria-current', 'page');
            else button.removeAttribute('aria-current');
        });
        syncChatHeader();
    };

    const renameChat = (id, row) => {
        const chat = chats.find(item => item.id === id);
        if (!chat) return;
        closeMenus();
        closeChatMenu();
        renamingId = id;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = String(chat.title || '').replace(/…$/, '');
        input.setAttribute('aria-label', 'Rename chat');
        input.maxLength = 80;

        let done = false;
        const finish = save => {
            if (done) return;
            done = true;
            const next = String(input.value || '').replace(/\s+/g, ' ').trim();
            if (save && next) {
                chat.title = next;
                chat.customTitle = true;
                chat.updatedAt = Date.now();
                writeStore();
            }
            renamingId = null;
            row?.classList.remove('is-renaming');
            input.remove();
            if (chatTitleNode) chatTitleNode.hidden = false;
            if (chatMenuButton) chatMenuButton.hidden = false;
            render();
            setActiveChat(currentId);
        };

        ['pointerdown', 'mousedown', 'click'].forEach(type => {
            input.addEventListener(type, event => event.stopPropagation());
        });
        input.addEventListener('keydown', event => {
            event.stopPropagation();
            if (event.key === 'Enter') {
                event.preventDefault();
                finish(true);
            } else if (event.key === 'Escape') {
                event.preventDefault();
                finish(false);
            }
        });

        if (row) {
            input.className = row.classList.contains('spaces-ai-chats-page-row')
                ? 'spaces-ai-chats-page-rename'
                : 'spaces-ai-chats-rename-input';
            const button = row.querySelector('[data-ai-chat-item]');
            const more = row.querySelector('[data-ai-chat-more]');
            if (!button) {
                renamingId = null;
                return;
            }
            row.classList.add('is-renaming');
            button.hidden = true;
            row.insertBefore(input, more || null);
        } else if (chatMenuButton && chatTitleNode) {
            input.className = 'spaces-home-chat-header-rename';
            chatMenuButton.hidden = true;
            chatTitleNode.hidden = true;
            chatMenuButton.parentElement?.insertBefore(input, chatMenuButton);
        } else {
            renamingId = null;
            return;
        }

        window.requestAnimationFrame(() => {
            input.focus();
            input.select();
            input.addEventListener('blur', () => finish(true));
        });
    };

    const beginRename = id => {
        if (isAllChatsPage()) {
            const pageRow = pageList?.querySelector(`[data-ai-chat-page="${id}"]`);
            renameChat(id, pageRow);
            return;
        }
        const inChatView = document.querySelector('[data-home-page]')?.classList.contains('is-centered-chat');
        if (inChatView) {
            renameChat(id);
            return;
        }
        const row = list.querySelector(`[data-ai-chat-item="${id}"]`)?.closest('.spaces-ai-chats-row');
        renameChat(id, row);
    };

    const deleteChat = id => {
        const chat = chats.find(item => item.id === id);
        if (!chat) return;
        closeMenus();
        closeChatMenu();
        const wasCurrent = currentId === id;
        const stayOnAllPage = isAllChatsPage();
        chats = chats.filter(item => item.id !== id);
        writeStore();
        if (wasCurrent) {
            currentId = null;
            window.SpacesListingChat?.end?.();
            window.SpacesCopilotPanel?.close?.();
            if (stayOnAllPage) {
                render();
                window.SpacesSidebarNavigation?.selectAiChats?.({ history: false });
                return;
            }
            if (chats[0]) openChat(chats[0].id);
            else {
                window.SpacesSidebarNavigation?.selectHome?.({ history: true, surface: 'chat' });
                setActiveChat(null);
                homeButton?.classList.add('is-active');
                homeButton?.setAttribute('aria-current', 'page');
                document.querySelector('[data-all-spaces-trigger]')?.classList.remove('is-active');
                document.querySelector('[data-all-spaces-trigger]')?.removeAttribute('aria-current');
            }
        }
        render();
        if (!wasCurrent) setActiveChat(currentId);
    };

    const attachChatActions = (row, chat) => {
        const more = document.createElement('button');
        more.type = 'button';
        more.className = 'spaces-ai-chats-more';
        more.dataset.aiChatMore = chat.id;
        more.setAttribute('aria-label', `Actions for ${chat.title}`);
        more.setAttribute('aria-haspopup', 'menu');
        more.setAttribute('aria-expanded', String(chat.id === openMenuId));
        const moreImg = document.createElement('img');
        moreImg.src = moreIcon;
        moreImg.width = 16;
        moreImg.height = 16;
        moreImg.alt = '';
        moreImg.setAttribute('aria-hidden', 'true');
        more.append(moreImg);

        const menu = document.createElement('div');
        menu.className = 'spaces-ai-chats-menu';
        menu.dataset.aiChatMenu = chat.id;
        menu.setAttribute('role', 'menu');
        menu.hidden = chat.id !== openMenuId;

        const renameBtn = document.createElement('button');
        renameBtn.type = 'button';
        renameBtn.className = 'spaces-ai-chats-menu-item';
        renameBtn.setAttribute('role', 'menuitem');
        renameBtn.textContent = 'Rename';
        renameBtn.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            renameChat(chat.id, row);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'spaces-ai-chats-menu-item is-danger';
        deleteBtn.setAttribute('role', 'menuitem');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            deleteChat(chat.id);
        });

        menu.append(renameBtn, deleteBtn);
        more.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            const willOpen = openMenuId !== chat.id;
            closeMenus();
            if (!willOpen) return;
            openMenuId = chat.id;
            row.classList.add('is-menu-open');
            more.setAttribute('aria-expanded', 'true');
            menu.hidden = false;
        });
        row.append(more, menu);
    };

    const render = () => {
        if (renamingId) return;
        const hasChats = chats.length > 0;
        const combined = isCombinedNewChatEntry();
        section.hidden = !hasChats;

        if (askItem) {
            // Separate: always keep Ask Copilot in the primary nav.
            // Combined: once AI chats exist, New chat lives inside the AI chats section.
            askItem.hidden = Boolean(hasChats && combined);
        }
        homeButton?.removeAttribute('hidden');

        if (newWrap) {
            newWrap.hidden = !(hasChats && combined);
        }

        if (!hasChats) {
            currentId = null;
            if (allButton) {
                allButton.hidden = true;
                allButton.classList.remove('is-active');
                allButton.removeAttribute('aria-current');
            }
            list.replaceChildren();
            renderAllPage();
            renderContinue();
            return;
        }

        list.replaceChildren(...visibleChats().map(chat => {
            const item = document.createElement('li');
            item.className = 'spaces-ai-chats-row';
            if (chat.id === currentId) item.classList.add('is-active');
            if (chat.id === openMenuId) item.classList.add('is-menu-open');

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'spaces-sidebar-item spaces-ai-chats-item';
            button.dataset.aiChatItem = chat.id;
            button.title = chat.title;
            const icon = document.createElement('img');
            icon.src = bubbleIcon;
            icon.width = 20;
            icon.height = 20;
            icon.alt = '';
            icon.setAttribute('aria-hidden', 'true');
            const label = document.createElement('span');
            label.dataset.aiChatLabel = '';
            label.textContent = chat.title;
            button.append(icon, label);
            button.addEventListener('click', event => {
                event.preventDefault();
                closeMenus();
                openChat(chat.id);
            });

            item.append(button);
            attachChatActions(item, chat);
            return item;
        }));

        if (allButton) {
            const showAllChats = chats.length >= ALL_CHATS_MIN;
            allButton.hidden = !showAllChats;
            allButton.textContent = 'View all chats';
            const onAllPage = isAllChatsPage();
            allButton.classList.toggle('is-active', showAllChats && onAllPage);
            if (showAllChats && onAllPage) allButton.setAttribute('aria-current', 'page');
            else allButton.removeAttribute('aria-current');
        }
        setActiveChat(currentId);
        renderAllPage();
        renderContinue();
    };

    const renderAllPage = () => {
        if (!pageList) return;
        pageList.replaceChildren();
        const visible = filteredChats();
        if (pageEmpty) {
            pageEmpty.hidden = visible.length > 0;
            pageEmpty.textContent = chats.length === 0
                ? 'No chats yet.'
                : 'No chats in this space.';
        }
        chatsByDate().forEach(group => {
            const section = document.createElement('section');
            section.className = 'spaces-ai-chats-page-group';
            const heading = document.createElement('h2');
            heading.textContent = group.label;
            const rows = document.createElement('ul');
            rows.className = 'spaces-ai-chats-page-group-list';
            group.items.forEach(chat => {
                const item = document.createElement('li');
                const button = document.createElement('button');
                const icon = document.createElement('img');
                const copy = document.createElement('span');
                const title = document.createElement('span');
                const space = chatSpace(chat);
                const spaceTitle = space?.title || '';
                const time = formatChatTime(chat.updatedAt) || formatChatDate(chat.updatedAt);
                item.className = 'spaces-ai-chats-page-row';
                item.dataset.aiChatPage = chat.id;
                if (chat.id === openMenuId) item.classList.add('is-menu-open');
                button.type = 'button';
                button.className = 'spaces-ai-chats-page-item';
                button.dataset.aiChatItem = chat.id;
                button.setAttribute('aria-label', spaceTitle ? `Open ${chat.title} in ${spaceTitle}` : `Open ${chat.title}`);
                icon.src = bubbleIcon;
                icon.width = 20;
                icon.height = 20;
                icon.alt = '';
                icon.setAttribute('aria-hidden', 'true');
                copy.className = 'spaces-ai-chats-page-item-copy';
                title.className = 'spaces-ai-chats-page-item-title';
                title.textContent = chat.title || 'New chat';
                copy.append(title, spaceBadge(space));
                const meta = document.createElement('span');
                meta.className = 'spaces-ai-chats-page-item-meta';
                meta.textContent = time;
                button.append(icon, copy, meta);
                button.addEventListener('click', event => {
                    event.preventDefault();
                    closeMenus();
                    openChat(chat.id);
                });
                item.append(button);
                attachChatActions(item, chat);
                rows.append(item);
            });
            section.append(heading, rows);
            pageList.append(section);
        });
    };

    const applySnapshotMeta = (chat, snapshot) => {
        if (!chat || !snapshot) return;
        chat.snapshot = snapshot;
        const spaceTitle = snapshot.listingSpaceTitle || snapshot.contextSpaceTitle || chat.spaceTitle;
        if (spaceTitle) chat.spaceTitle = spaceTitle;
        if (snapshot.listingSpaceId || snapshot.contextSpaceId) {
            chat.spaceId = snapshot.listingSpaceId || snapshot.contextSpaceId;
        }
        if (!chat.prompt) chat.prompt = snapshot.title || promptFromSnapshot(snapshot);
        if (!chat.customTitle) {
            chat.title = titleFrom(snapshot.title || chat.title, {
                spaceTitle: chat.spaceTitle,
                listing: isListingChat(snapshot)
            });
        }
        chat.updatedAt = Date.now();
    };

    const captureCurrent = () => {
        const listing = window.SpacesListingChat;
        if (!listing?.isActive?.() || !currentId) return;
        const snapshot = listing.serialize?.();
        if (!snapshot) return;
        const chat = chats.find(item => item.id === currentId);
        if (!chat) return;
        applySnapshotMeta(chat, snapshot);
        chats = [chat, ...chats.filter(item => item.id !== chat.id)];
        writeStore();
        render();
    };

    const beginSession = (options = {}) => {
        const chat = {
            id: `chat-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            title: titleFrom(options.title, {
                spaceTitle: options.spaceTitle,
                listing: options.listing
            }),
            spaceTitle: options.spaceTitle || '',
            spaceId: options.spaceId || '',
            prompt: String(options.prompt || options.title || '').replace(/\s+/g, ' ').trim(),
            snapshot: null,
            updatedAt: Date.now()
        };
        currentId = chat.id;
        chats = [chat, ...chats];
        writeStore();
        render();
        setActiveChat(chat.id);
        return chat;
    };

    const markIdle = () => {
        currentId = null;
        setActiveChat(null);
    };

    const continueSection = document.querySelector('[data-home-continue]');
    const continueList = continueSection?.querySelector('[data-home-continue-list]');
    const SCOPE_STORAGE_KEY = 'planner5d-spaces-v2-home-composer-scope';

    const continueScope = () => {
        try {
            const stored = localStorage.getItem(SCOPE_STORAGE_KEY);
            if (!stored || stored === 'all') return { id: '', title: '' };
            const space = knownSpaces.find(item => String(item.id) === String(stored));
            const label = document.querySelector('[data-home-composer-scope-label]')?.textContent?.trim() || '';
            const title = space?.title
                || (!label || /^no space$/i.test(label) || /^all spaces$/i.test(label) ? '' : label);
            return { id: String(stored), title };
        } catch {
            return { id: '', title: '' };
        }
    };

    const chatMatchesContinueScope = (chat, scope) => {
        if (!scope.id && !scope.title) return true;
        const chatId = String(chat.spaceId || chat.snapshot?.listingSpaceId || chat.snapshot?.contextSpaceId || '');
        if (scope.id && chatId && String(chatId) === String(scope.id)) return true;
        const chatTitle = chatSpaceTitle(chat);
        if (scope.title && chatTitle && chatTitle.toLowerCase() === scope.title.toLowerCase()) return true;
        if (scope.title && String(chat.title || '').toLowerCase().includes(scope.title.toLowerCase())) return true;
        return false;
    };

    const renderContinue = () => {
        if (!continueSection || !continueList) return;
        const scope = continueScope();
        const items = chats.filter(chat => chatMatchesContinueScope(chat, scope)).slice(0, 5);
        continueSection.hidden = items.length === 0;
        continueList.replaceChildren(...items.map(chat => {
            const item = document.createElement('li');
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'spaces-home-continue-item';
            const titleWrap = document.createElement('span');
            titleWrap.className = 'spaces-home-continue-title';
            const icon = document.createElement('img');
            icon.src = bubbleIcon;
            icon.width = 20;
            icon.height = 20;
            icon.alt = '';
            icon.setAttribute('aria-hidden', 'true');
            const title = document.createElement('span');
            title.textContent = chat.title;
            titleWrap.append(icon, title);
            const date = document.createElement('span');
            date.className = 'spaces-home-continue-date';
            date.textContent = formatChatDate(chat.updatedAt);
            button.append(titleWrap, date);
            button.addEventListener('click', () => openChat(chat.id));
            item.append(button);
            return item;
        }));
    };

    const openChat = id => {
        const chat = chats.find(item => item.id === id);
        if (!chat) return;
        if (currentId && currentId !== id) captureCurrent();
        currentId = chat.id;
        const listing = window.SpacesListingChat;
        const main = document.querySelector('.spaces-main-content');
        if (!main?.classList.contains('is-home-page')) {
            listing?.prepareOpen?.();
            window.SpacesSidebarNavigation?.selectHome({ history: true, surface: 'chat' });
        }
        listing?.restore?.(chat.snapshot);
        setActiveChat(chat.id);
    };

    const startNew = () => {
        captureCurrent();
        currentId = null;
        window.SpacesListingChat?.end?.();
        window.SpacesCopilotPanel?.hide?.();
        window.SpacesSidebarNavigation?.selectHome({ history: true, surface: 'chat' });
        const input = document.querySelector('[data-home-composer-input]');
        input?.focus();
        render();
        setActiveChat(null);
        homeButton?.classList.add('is-active');
        homeButton?.setAttribute('aria-current', 'page');
        document.querySelector('[data-all-spaces-trigger]')?.classList.remove('is-active');
        document.querySelector('[data-all-spaces-trigger]')?.removeAttribute('aria-current');
    };

    const syncFromListing = () => {
        const listing = window.SpacesListingChat;
        if (!listing?.isActive?.()) return;
        const snapshot = listing.serialize?.();
        if (!snapshot) return;
        if (!currentId) beginSession({
            title: snapshot.title,
            spaceTitle: snapshot.listingSpaceTitle || snapshot.contextSpaceTitle,
            prompt: snapshot.title,
            listing: isListingChat(snapshot)
        });
        const chat = chats.find(item => item.id === currentId);
        if (!chat) return;
        applySnapshotMeta(chat, snapshot);
        writeStore();
        render();
        setActiveChat(currentId);
    };

    newButton?.addEventListener('click', event => {
        event.preventDefault();
        startNew();
    });

    homeButton?.addEventListener('click', () => {
        startNew();
    });

    allButton?.addEventListener('click', event => {
        event.preventDefault();
        window.SpacesSidebarNavigation?.selectAiChats?.({ history: true });
    });

    pageNew?.addEventListener('click', event => {
        event.preventDefault();
        startNew();
    });

    pageFilter?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const slot = filterSlots().find(item => item.button === pageFilter);
        if (pageFilterMenu?.hidden === false) closeSpaceFilterMenu();
        else openSpaceFilterMenu(slot);
    });

    sidebarFilter?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const slot = filterSlots().find(item => item.button === sidebarFilter);
        if (sidebarFilterMenu?.hidden === false) closeSpaceFilterMenu();
        else openSpaceFilterMenu(slot);
    });

    pageFilterMenu?.addEventListener('click', event => event.stopPropagation());
    sidebarFilterMenu?.addEventListener('click', event => event.stopPropagation());

    chatMenuButton?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        closeMenus();
        closeArtifactsMenu();
        if (!chatMenu) return;
        const willOpen = chatMenu.hidden;
        if (willOpen) {
            renderChatMenu();
            chatMenu.hidden = false;
            chatMenu.classList.add('is-active');
            chatMenuButton.setAttribute('aria-expanded', 'true');
            return;
        }
        closeChatMenu();
    });

    artifactsButton?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        closeMenus();
        closeChatMenu();
        if (!artifactsMenu) return;
        renderArtifacts();
        if (!collectArtifacts().length) return;
        const willOpen = artifactsMenu.hidden;
        if (willOpen) {
            artifactsMenu.hidden = false;
            artifactsButton.setAttribute('aria-expanded', 'true');
            return;
        }
        closeArtifactsMenu();
    });

    artifactPreviewClose?.addEventListener('click', event => {
        event.preventDefault();
        closeArtifactPreview();
    });

    artifactPreview?.addEventListener('click', event => {
        if (event.target === artifactPreview) closeArtifactPreview();
    });

    if (homeThread) {
        new MutationObserver(() => renderArtifacts()).observe(homeThread, { childList: true, subtree: true });
    }

    document.addEventListener('click', event => {
        if (!event.target.closest('.spaces-home-chat-header-start')) closeChatMenu();
        if (!event.target.closest('[data-home-chat-artifacts]')) closeArtifactsMenu();
        if (event.target.closest('.spaces-ai-chats-row, .spaces-ai-chats-page-row, .spaces-ai-chats-page-filter-wrap, .spaces-ai-chats-heading-filter-wrap, .spaces-ai-chats-heading-filter-menu, .spaces-ai-chats-page-filter-menu')) return;
        closeMenus();
        closeSpaceFilterMenu();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeMenus();
            closeChatMenu();
            closeArtifactsMenu();
            closeArtifactPreview();
            closeSpaceFilterMenu();
        }
        if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'n') return;
        if (event.target?.closest('input, textarea, [contenteditable="true"]')) return;
        if (document.body.classList.contains('is-listing-studio-open')) return;
        event.preventDefault();
        startNew();
    });

    document.addEventListener('spaces-new-chat-placement-changed', () => {
        render();
    });

    document.addEventListener('spaces-new-chat-entry-changed', () => {
        render();
    });

    document.addEventListener('spaces-home-composer-scope-changed', () => {
        renderContinue();
    });

    document.addEventListener('spaces-account-profile-ready', event => {
        knownSpaces = event.detail?.account?.spaces || [];
        if (isAllChatsPage()) renderAllPage();
        renderContinue();
        applySpaceFilter(pageSpaceFilter, { persist: false, renderLists: false });
    });

    if (window.SpacesAccountData?.load) {
        window.SpacesAccountData.load().then(account => {
            knownSpaces = account?.spaces || [];
            if (isAllChatsPage()) renderAllPage();
            renderContinue();
            applySpaceFilter(pageSpaceFilter, { persist: false, renderLists: false });
        }).catch(() => {});
    }

    chats = readStore();
    pageSpaceFilter = readSpaceFilter();
    render();
    applySpaceFilter(pageSpaceFilter, { persist: false, renderLists: false });

    window.SpacesAiChats = {
        captureCurrent,
        beginSession,
        syncFromListing,
        syncChatHeader,
        renderArtifacts,
        startNew,
        markIdle,
        open: openChat,
        render,
        renderAllPage
    };
})();
