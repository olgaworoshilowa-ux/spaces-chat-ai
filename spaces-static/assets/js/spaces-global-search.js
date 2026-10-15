(() => {
    'use strict';

    const mainContent = document.querySelector('.spaces-main-content');
    const headerSearch = document.querySelector('[data-header-search]');
    const headerSearchControl = document.querySelector('[data-header-search-control]');
    const headerPopover = document.querySelector('[data-header-search-popover]');
    const headerFiles = document.querySelector('[data-header-search-files]');
    const headerCategories = document.querySelector('[data-header-search-categories]');
    const headerResults = document.querySelector('[data-header-search-results]');
    const headerEmpty = document.querySelector('[data-header-search-empty]');
    const headerClear = document.querySelector('[data-header-search-clear]');
    const headerHotkey = document.querySelector('[data-header-search-hotkey]');
    const headerAsk = document.querySelector('[data-header-search-ask]');
    const headerAskLabel = document.querySelector('[data-header-search-ask-label]');
    const headerCopilotHeading = document.querySelector('[data-header-search-copilot-heading]');
    const headerFooter = document.querySelector('[data-header-search-footer]');
    const headerRecent = document.querySelector('[data-header-search-recent]');
    const headerRecentList = document.querySelector('[data-header-search-recent-list]');
    const headerFilesHeading = document.querySelector('[data-header-search-files-heading]');
    const headerSuggestionItems = [...document.querySelectorAll('[data-header-search-suggestions] li')];
    const home = document.querySelector('[data-home-page]');
    const homeSearch = home?.querySelector('[data-home-search]');
    const globalPage = document.querySelector('[data-global-search-page]');
    const homeResults = home?.querySelector('[data-home-global-results]');
    const resultViews = [globalPage, homeResults].filter(Boolean);
    const fallbackPreview = './assets/images/spaces-v2/collection-preview.png';
    const moreIcon = './assets/images/spaces-v2/list-more.svg';
    const resultLimit = 6;
    const recentLimit = 3;
    const idlePromptLimit = 2;
    const fileTypeDefinitions = [
        { label: 'Floor Plans', aliases: ['floor plans', 'floor plan', 'projects', 'project', 'plans'] },
        { label: 'Renders', aliases: ['renders', 'render'] },
        { label: 'Documents', aliases: ['documents', 'document', 'docs', 'doc'] },
        { label: 'Moodboards', aliases: ['moodboards', 'moodboard'] },
        { label: 'AI Studio', aliases: ['ai studio', 'ai'] },
        { label: '360° Panorama', aliases: ['360 panorama', 'panorama', 'panoramas'] },
        { label: '360° Walkthrough', aliases: ['360 walkthrough', 'walkthrough', 'walkthroughs'] },
        { label: 'Generated with AI', aliases: ['generated with ai', 'generated', 'ai generated'] },
    ];

    if (!mainContent || !headerSearch || !headerSearchControl || !headerPopover || !headerFiles || !headerCategories || !headerResults || !headerEmpty || !headerClear || !headerAsk || !headerAskLabel || !headerCopilotHeading || !headerRecent || !headerRecentList || !home || !homeSearch || !globalPage || !homeResults || !window.SpacesAccountData?.load) return;

    const normalize = value => String(value || '').trim().toLowerCase();
    const normalizeType = value => normalize(value).replaceAll('°', '');
    const dateValue = item => String(item?.udate || item?.cdate || '').replace(' ', 'T');
    const timestamp = item => new Date(dateValue(item)).getTime() || 0;
    const compactDate = item => {
        const date = new Date(dateValue(item));
        if (Number.isNaN(date.getTime())) return 'Recently';
        const now = new Date();
        const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startYesterday = startToday - 86400000;
        const time = date.getTime();
        if (time >= startToday) return 'Today';
        if (time >= startYesterday) return 'Yesterday';
        return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(date);
    };
    const typeDefinitionFor = type => fileTypeDefinitions.find(definition => normalizeType(definition.label) === normalizeType(type));
    const typeSearchTerms = type => {
        const definition = typeDefinitionFor(type);
        return [type, ...(definition?.aliases || [])].map(normalize);
    };
    const typeKey = type => normalizeType(type);
    const escapeHtml = value => String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');

    const highlightMatch = (text, query) => {
        const raw = String(text || '');
        const needle = String(query || '').trim();
        if (!needle) return escapeHtml(raw);
        const lower = raw.toLowerCase();
        const index = lower.indexOf(needle.toLowerCase());
        if (index < 0) return escapeHtml(raw);
        const before = escapeHtml(raw.slice(0, index));
        const match = escapeHtml(raw.slice(index, index + needle.length));
        const after = escapeHtml(raw.slice(index + needle.length));
        return `${before}<mark>${match}</mark>${after}`;
    };

    const preview = (source, alt) => {
        const image = document.createElement('img');
        image.alt = alt;
        image.onerror = () => {
            image.onerror = null;
            image.src = fallbackPreview;
        };
        image.src = source || fallbackPreview;
        return image;
    };

    const spaceInitial = space => {
        const initial = document.createElement('span');
        initial.className = 'spaces-home-space-initial';
        initial.setAttribute('aria-hidden', 'true');
        initial.textContent = space?.initial || String(space?.title || 'S').slice(0, 1).toUpperCase();
        if (space?.avatarColor) initial.style.backgroundColor = space.avatarColor;
        return initial;
    };

    const buildResultView = container => {
        const target = container.querySelector('[data-global-result-view]');
        if (!target) return;
        const tabs = document.createElement('div');
        const scroll = document.createElement('div');
        const table = document.createElement('div');
        const head = document.createElement('div');
        const rows = document.createElement('div');
        const empty = document.createElement('p');

        tabs.className = 'spaces-global-result-tabs';
        tabs.dataset.globalResultTabs = '';
        tabs.setAttribute('role', 'tablist');
        tabs.setAttribute('aria-label', 'Filter search results by file type');
        tabs.hidden = container !== globalPage;
        scroll.className = 'spaces-files-table-scroll spaces-global-results-table';
        table.className = 'spaces-files-table';
        table.setAttribute('role', 'table');
        table.setAttribute('aria-label', 'Search results');
        head.className = 'spaces-files-table-row spaces-files-table-head';
        head.setAttribute('role', 'row');
        ['File name', 'Last update', 'Owner', 'File type', 'Location', ''].forEach((label, index) => {
            const cell = document.createElement('span');
            if (label) {
                cell.className = `spaces-files-table-heading${index === 0 ? ' spaces-files-table-heading-file' : ''}`;
                cell.setAttribute('role', 'columnheader');
                cell.textContent = label;
            } else {
                cell.setAttribute('aria-hidden', 'true');
            }
            head.append(cell);
        });
        rows.dataset.globalResultRows = '';
        empty.className = 'spaces-global-results-empty';
        empty.dataset.globalResultsEmpty = '';
        empty.textContent = 'No files found.';
        empty.hidden = true;
        table.append(head, rows);
        scroll.append(table);
        target.append(tabs, scroll, empty);
    };

    resultViews.forEach(buildResultView);

    let accountPromise;
    let activeGlobalType = 'all';
    let activeGlobalQuery = '';
    let latestHeaderRequest = 0;
    let activeOptionIndex = -1;
    let debounceTimer = 0;

    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');
    if (headerHotkey) {
        headerHotkey.innerHTML = isMac ? '<span>⌘</span> K' : '<span>Ctrl</span> K';
    }

    const account = () => {
        if (!accountPromise) accountPromise = window.SpacesAccountData.load();
        return accountPromise;
    };

    const createRow = (file, space) => {
        const row = document.createElement('div');
        const thumbnailCell = document.createElement('span');
        const thumbnail = document.createElement('span');
        const name = document.createElement('span');
        const updated = document.createElement('time');
        const owner = document.createElement('span');
        const fileType = document.createElement('span');
        const location = document.createElement('span');
        const actions = document.createElement('span');
        const more = document.createElement('button');
        const moreImage = document.createElement('img');

        row.className = 'spaces-files-table-row';
        row.setAttribute('role', 'row');
        row.dataset.globalResultRow = '';
        row.dataset.globalResultType = typeKey(file.type);

        thumbnailCell.className = 'spaces-file-preview';
        thumbnailCell.setAttribute('role', 'cell');
        thumbnailCell.setAttribute('aria-hidden', 'true');
        thumbnail.className = 'spaces-file-thumbnail spaces-file-thumbnail-photo';
        thumbnail.append(preview(file.previewUrl, ''));
        thumbnailCell.append(thumbnail);

        name.className = 'spaces-file-name';
        name.setAttribute('role', 'cell');
        name.textContent = file.title;

        updated.setAttribute('role', 'cell');
        updated.dateTime = dateValue(file);
        updated.textContent = compactDate(file);

        owner.setAttribute('role', 'cell');
        owner.textContent = file.owner || 'You';

        fileType.setAttribute('role', 'cell');
        fileType.textContent = file.type || 'Unknown';

        location.className = 'spaces-file-location spaces-global-result-location';
        location.setAttribute('role', 'cell');
        location.append(spaceInitial(space), document.createTextNode(space?.title || 'Unknown space'));

        actions.className = 'spaces-file-actions';
        actions.setAttribute('role', 'cell');
        more.type = 'button';
        more.setAttribute('aria-label', `More actions for ${file.title}`);
        moreImage.src = moreIcon;
        moreImage.alt = '';
        more.append(moreImage);
        actions.append(more);

        row.append(thumbnailCell, name, updated, owner, fileType, location, actions);
        return row;
    };

    const createCompactResult = (file, space, query) => {
        const result = document.createElement('button');
        const thumbnail = document.createElement('span');
        const content = document.createElement('span');
        const title = document.createElement('span');
        const meta = document.createElement('span');
        const updated = document.createElement('time');

        result.type = 'button';
        result.className = 'spaces-header-search-result';
        result.dataset.headerSearchResult = '';
        result.dataset.searchOption = 'result';
        result.id = `header-search-result-${file.id || Math.random().toString(36).slice(2, 8)}`;
        result.setAttribute('role', 'option');
        result.setAttribute('aria-label', `${file.title}, ${file.type || 'Unknown'}, ${space?.title || 'Unknown space'}`);
        thumbnail.className = 'spaces-header-search-result-thumbnail';
        thumbnail.append(preview(file.previewUrl, ''));
        content.className = 'spaces-header-search-result-content';
        title.className = 'spaces-header-search-result-title';
        title.innerHTML = highlightMatch(file.title, query);
        meta.className = 'spaces-header-search-result-meta';
        meta.textContent = `${file.type || 'Unknown'} · ${space?.title || 'Unknown space'}`;
        updated.className = 'spaces-header-search-result-date';
        updated.dateTime = dateValue(file);
        updated.textContent = compactDate(file);
        content.append(title, meta);
        result.append(thumbnail, content, updated);
        result.addEventListener('click', () => openFullResults(headerSearch.value));
        return result;
    };

    const collectRecentItems = data => {
        const spaces = (data?.spaces || []).map(space => ({
            kind: 'space',
            id: space.id,
            title: space.title || 'Untitled space',
            previewUrl: space.previewUrl,
            cdate: space.cdate,
            udate: space.udate || space.cdate
        }));
        const files = (data?.files || []).map(file => ({
            kind: 'file',
            id: file.id,
            title: file.title || 'Untitled file',
            previewUrl: file.previewUrl,
            cdate: file.cdate,
            udate: file.udate || file.cdate
        }));
        return [...spaces, ...files]
            .sort((first, second) => timestamp(second) - timestamp(first))
            .slice(0, recentLimit);
    };

    const createRecentItem = item => {
        const result = document.createElement('button');
        const thumbnail = document.createElement('span');
        const content = document.createElement('span');
        const title = document.createElement('span');
        const updated = document.createElement('time');

        result.type = 'button';
        result.className = 'spaces-header-search-result spaces-header-search-recent-item';
        result.dataset.headerSearchRecent = '';
        result.dataset.searchOption = 'recent';
        result.id = `header-search-recent-${item.kind}-${item.id || Math.random().toString(36).slice(2, 8)}`;
        result.setAttribute('role', 'option');
        result.setAttribute('aria-label', item.title);
        thumbnail.className = 'spaces-header-search-result-thumbnail';
        thumbnail.append(preview(item.previewUrl, ''));
        content.className = 'spaces-header-search-result-content';
        title.className = 'spaces-header-search-result-title';
        title.textContent = item.title;
        updated.className = 'spaces-header-search-result-date';
        updated.dateTime = dateValue(item);
        updated.textContent = compactDate(item);
        content.append(title);
        result.append(thumbnail, content, updated);
        result.addEventListener('click', () => {
            void openFullResults(item.title);
        });
        return result;
    };

    const renderRecentItems = async () => {
        const data = await account();
        const items = collectRecentItems(data);
        headerRecentList.replaceChildren(...items.map(createRecentItem));
        headerRecent.hidden = items.length === 0;
    };

    const collectMatches = (data, value) => {
        const query = normalize(value);
        const spacesById = new Map(data.spaces.map(space => [String(space.id), space]));
        const matches = [...data.files]
            .sort((first, second) => timestamp(second) - timestamp(first))
            .filter(file => {
                if (!query) return false;
                const space = spacesById.get(String(file.spaceId));
                const searchable = `${file.title} ${file.type} ${typeSearchTerms(file.type).join(' ')} ${space?.title} ${space?.address}`;
                return normalize(searchable).includes(query);
            });
        return { matches, spacesById };
    };

    const matchingTypes = matches => {
        const types = new Map();
        matches.forEach(file => {
            const label = file.type || 'Unknown';
            const key = typeKey(label);
            const entry = types.get(key) || { label, count: 0 };
            entry.count += 1;
            types.set(key, entry);
        });
        return [...types.entries()].map(([key, value]) => ({ key, ...value }));
    };

    const renderTabs = (container, matches, selectedType) => {
        const tabs = container.querySelector('[data-global-result-tabs]');
        if (!tabs || container !== globalPage) return;
        const availableTypes = matchingTypes(matches);
        const all = { key: 'all', label: 'All', count: matches.length };
        const options = [all, ...availableTypes];
        tabs.hidden = options.length <= 1;
        tabs.replaceChildren(...options.map(option => {
            const tab = document.createElement('button');
            const isSelected = option.key === selectedType;
            tab.type = 'button';
            tab.className = 'spaces-global-result-tab';
            tab.dataset.globalResultTab = option.key;
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-selected', String(isSelected));
            tab.textContent = `${option.label} (${option.count})`;
            tab.addEventListener('click', () => {
                activeGlobalType = option.key;
                void renderFullResults(activeGlobalQuery);
            });
            return tab;
        }));
    };

    const renderRows = (container, matches, spacesById, selectedType = 'all') => {
        const visibleMatches = selectedType === 'all'
            ? matches
            : matches.filter(file => typeKey(file.type) === selectedType);
        const rows = container.querySelector('[data-global-result-rows]');
        const empty = container.querySelector('[data-global-results-empty]');
        const count = container.querySelector('[data-global-result-count]');
        rows?.replaceChildren(...visibleMatches.map(file => createRow(file, spacesById.get(String(file.spaceId)))));
        if (empty) empty.hidden = visibleMatches.length !== 0;
        if (count) count.textContent = `${visibleMatches.length} ${visibleMatches.length === 1 ? 'file' : 'files'}`;
        return visibleMatches;
    };

    const renderFullResults = async value => {
        activeGlobalQuery = value;
        const data = await account();
        const { matches, spacesById } = collectMatches(data, value);
        const types = matchingTypes(matches);
        if (activeGlobalType !== 'all' && !types.some(type => type.key === activeGlobalType)) activeGlobalType = 'all';
        renderTabs(globalPage, matches, activeGlobalType);
        renderRows(globalPage, matches, spacesById, activeGlobalType);
    };

    const renderHomeResults = async value => {
        const data = await account();
        const { matches, spacesById } = collectMatches(data, value);
        renderRows(homeResults, matches, spacesById);
    };

    const renderHeaderCategories = matches => {
        const visibleTypes = matchingTypes(matches);
        headerCategories.hidden = visibleTypes.length === 0;
        headerCategories.replaceChildren(...visibleTypes.map(type => {
            const category = document.createElement('button');
            category.type = 'button';
            category.className = 'spaces-header-search-category';
            category.dataset.headerSearchCategory = type.key;
            category.textContent = `${type.label} (${type.count})`;
            category.addEventListener('click', () => {
                activeGlobalType = type.key;
                void openFullResults(headerSearch.value);
            });
            return category;
        }));
    };

    const askCopilot = (text) => {
        const value = String(text || '').trim();
        if (!value) return;
        closeHeaderPopover();
        headerSearch.value = '';
        syncClearButton();
        // Always open a full new centered chat from header search prompts / Ask.
        window.SpacesAiChats?.startNew?.();
        window.setTimeout(() => {
            if (window.SpacesListingChat?.send?.(value)) return;
            window.SpacesListingChat?.startGeneric?.(value, { surface: 'home' });
        }, 0);
    };

    const getSelectableOptions = () => {
        const options = [];
        if (headerAsk && !headerAsk.hidden) options.push(headerAsk);
        headerSuggestionItems.forEach(item => {
            if (item.hidden) return;
            const button = item.querySelector('[data-header-search-suggestion]');
            if (button) options.push(button);
        });
        if (!headerRecent.hidden) {
            headerRecentList.querySelectorAll('[data-header-search-recent]').forEach(button => options.push(button));
        }
        headerResults.querySelectorAll('[data-header-search-result]').forEach(button => options.push(button));
        return options;
    };

    const setActiveOption = index => {
        const options = getSelectableOptions();
        options.forEach(option => option.classList.remove('is-active'));
        if (!options.length) {
            activeOptionIndex = -1;
            headerSearch.removeAttribute('aria-activedescendant');
            return;
        }
        activeOptionIndex = ((index % options.length) + options.length) % options.length;
        const active = options[activeOptionIndex];
        active.classList.add('is-active');
        if (!active.id) active.id = `header-search-option-${activeOptionIndex}`;
        headerSearch.setAttribute('aria-activedescendant', active.id);
        active.scrollIntoView({ block: 'nearest' });
    };

    const activateOption = option => {
        if (!option) return;
        if (option === headerAsk) {
            askCopilot(headerSearch.value);
            return;
        }
        if (option.dataset.headerSearchSuggestion) {
            askCopilot(option.dataset.headerSearchSuggestion);
            return;
        }
        if (option.dataset.headerSearchRecent !== undefined) {
            option.click();
            return;
        }
        if (option.dataset.headerSearchResult !== undefined) {
            void openFullResults(headerSearch.value);
        }
    };

    const syncClearButton = () => {
        const hasValue = Boolean(headerSearch.value.trim());
        headerClear.hidden = !hasValue;
    };

    const renderCopilotSuggestions = value => {
        const query = normalize(value);
        const isRealtor = document.body.classList.contains('is-personalization-realtor');
        headerAsk.hidden = !query;
        headerAskLabel.textContent = query ? `Ask Copilot “${String(value).trim()}”` : 'Ask Copilot';
        if (headerFooter) headerFooter.hidden = true;

        let idleShown = 0;
        headerSuggestionItems.forEach(item => {
            const isExtra = item.hasAttribute('data-header-search-suggestion-extra');
            const isHomeOwnerOnly = item.hasAttribute('data-personalization-home-owner-only');
            const isRealtorOnly = item.hasAttribute('data-personalization-realtor-only');
            const personaMismatch = (isHomeOwnerOnly && isRealtor) || (isRealtorOnly && !isRealtor);

            if (isExtra || personaMismatch) {
                item.hidden = true;
                return;
            }

            const suggestion = item.querySelector('[data-header-search-suggestion]');
            const text = normalize(suggestion?.dataset.headerSearchSuggestion || suggestion?.textContent);

            if (!query) {
                if (idleShown >= idlePromptLimit) {
                    item.hidden = true;
                    return;
                }
                item.hidden = false;
                idleShown += 1;
                return;
            }

            item.hidden = !text.includes(query);
        });

        const visibleCount = headerSuggestionItems.filter(item => !item.hidden).length;

        headerCopilotHeading.hidden = visibleCount === 0;
        headerCopilotHeading.textContent = query ? 'Matching prompts' : 'Ask Copilot';
    };

    const renderHeaderPopover = async value => {
        const requestId = ++latestHeaderRequest;
        const query = String(value || '').trim();
        syncClearButton();
        renderCopilotSuggestions(query);

        if (!query) {
            headerFiles.hidden = true;
            headerCategories.hidden = true;
            headerCategories.replaceChildren();
            headerResults.replaceChildren();
            headerEmpty.hidden = true;
            if (headerFilesHeading) headerFilesHeading.hidden = true;
            await renderRecentItems();
            if (requestId !== latestHeaderRequest) return;
            setActiveOption(-1);
            return;
        }

        headerRecent.hidden = true;
        headerRecentList.replaceChildren();

        const data = await account();
        if (requestId !== latestHeaderRequest) return;
        const { matches, spacesById } = collectMatches(data, value);
        headerFiles.hidden = false;
        if (headerFilesHeading) {
            headerFilesHeading.hidden = false;
            headerFilesHeading.textContent = matches.length
                ? `Files · ${matches.length}`
                : 'Files';
        }
        renderHeaderCategories(matches);
        headerResults.replaceChildren(...matches.slice(0, resultLimit).map(file => (
            createCompactResult(file, spacesById.get(String(file.spaceId)), query)
        )));
        headerEmpty.hidden = matches.length !== 0;
        setActiveOption(query ? 0 : -1);
    };

    const openHeaderPopover = async value => {
        headerPopover.hidden = false;
        headerSearch.setAttribute('aria-expanded', 'true');
        await renderHeaderPopover(value);
    };

    const closeHeaderPopover = () => {
        headerPopover.hidden = true;
        headerSearch.setAttribute('aria-expanded', 'false');
        headerSearch.removeAttribute('aria-activedescendant');
        activeOptionIndex = -1;
        getSelectableOptions().forEach(option => option.classList.remove('is-active'));
    };

    const closeHeaderResults = () => {
        mainContent.classList.remove('is-global-search-page');
        globalPage.hidden = true;
        closeHeaderPopover();
    };

    const openFullResults = async value => {
        const query = value.trim();
        if (!query) return;
        closeHeaderPopover();
        window.SpacesSidebarNavigation?.selectGlobalSearch?.();
        mainContent.classList.add('is-global-search-page');
        globalPage.hidden = false;
        await renderFullResults(query);
    };

    const scheduleHeaderRender = value => {
        window.clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => {
            void openHeaderPopover(value);
        }, 90);
    };

    headerSearch.addEventListener('focus', () => {
        if (!globalPage.hidden) return;
        void openHeaderPopover(headerSearch.value);
    });

    headerSearch.addEventListener('input', async () => {
        const query = headerSearch.value;
        syncClearButton();
        if (!query.trim()) {
            activeGlobalType = 'all';
            if (!globalPage.hidden) closeHeaderResults();
            await openHeaderPopover('');
            return;
        }

        if (!globalPage.hidden) {
            activeGlobalType = 'all';
            await renderFullResults(query);
            return;
        }

        scheduleHeaderRender(query);
    });

    headerSearch.addEventListener('keydown', event => {
        const options = getSelectableOptions();
        if (event.key === 'ArrowDown') {
            if (headerPopover.hidden) void openHeaderPopover(headerSearch.value);
            event.preventDefault();
            setActiveOption(activeOptionIndex < 0 ? 0 : activeOptionIndex + 1);
            return;
        }
        if (event.key === 'ArrowUp') {
            if (headerPopover.hidden) return;
            event.preventDefault();
            setActiveOption(activeOptionIndex < 0 ? options.length - 1 : activeOptionIndex - 1);
            return;
        }
        if (event.key === 'Enter') {
            const query = headerSearch.value.trim();
            if (!query && activeOptionIndex < 0) return;
            event.preventDefault();
            if (activeOptionIndex >= 0 && options[activeOptionIndex]) {
                activateOption(options[activeOptionIndex]);
                return;
            }
            askCopilot(query);
            return;
        }
        if (event.key === 'Escape') {
            if (!headerPopover.hidden) {
                event.preventDefault();
                closeHeaderPopover();
                return;
            }
            if (headerSearch.value) {
                event.preventDefault();
                headerSearch.value = '';
                syncClearButton();
                void openHeaderPopover('');
                return;
            }
            headerSearch.blur();
        }
    });

    headerClear.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        headerSearch.value = '';
        syncClearButton();
        headerSearch.focus();
        activeGlobalType = 'all';
        if (!globalPage.hidden) closeHeaderResults();
        void openHeaderPopover('');
    });

    headerAsk.addEventListener('click', () => {
        askCopilot(headerSearch.value.trim());
    });

    headerSuggestionItems.forEach(item => {
        const button = item.querySelector('[data-header-search-suggestion]');
        if (!button) return;
        button.dataset.searchOption = 'suggestion';
        button.setAttribute('role', 'option');
        button.addEventListener('click', () => {
            askCopilot(button.dataset.headerSearchSuggestion || button.textContent.trim());
        });
    });

    headerAsk.dataset.searchOption = 'ask';
    headerAsk.setAttribute('role', 'option');

    document.addEventListener('pointerdown', event => {
        if (!headerSearchControl.contains(event.target)) closeHeaderPopover();
    });

    document.addEventListener('keydown', event => {
        const key = event.key?.toLowerCase();
        if (!(event.metaKey || event.ctrlKey) || key !== 'k') return;
        if (event.target?.closest('textarea, [contenteditable="true"]')) return;
        event.preventDefault();
        headerSearch.focus();
        headerSearch.select();
        void openHeaderPopover(headerSearch.value);
    });

    homeSearch.addEventListener('input', async () => {
        const query = homeSearch.value;
        const isSearching = Boolean(query.trim());
        home.classList.toggle('is-searching', isSearching);
        homeResults.hidden = !isSearching;
        if (isSearching) await renderHomeResults(query);
    });

    document.addEventListener('spaces-account-profile-ready', event => {
        if (!event.detail?.account) return;
        accountPromise = Promise.resolve(event.detail.account);
        if (!headerPopover.hidden) void renderHeaderPopover(headerSearch.value);
        if (!globalPage.hidden && headerSearch.value.trim()) void renderFullResults(headerSearch.value);
        if (!homeResults.hidden && homeSearch.value.trim()) void renderHomeResults(homeSearch.value);
    });

    document.addEventListener('spaces-personalization-changed', () => {
        if (!headerPopover.hidden) void renderHeaderPopover(headerSearch.value);
    });

    document.addEventListener('spaces-navigation-start', () => {
        closeHeaderResults();
        headerSearch.value = '';
        syncClearButton();
        home.classList.remove('is-searching');
        homeResults.hidden = true;
        homeSearch.value = '';
    });

    syncClearButton();
})();
