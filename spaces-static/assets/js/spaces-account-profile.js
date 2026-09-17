(() => {
    'use strict';

    const storageKey = 'planner5d-spaces-v2-user-profile';
    const defaultProfileVersionKey = 'planner5d-spaces-v2-user-profile-default-version';
    const defaultProfileVersion = 'demo-2026-07-24';
    const assetUrl = path => `/spaces-chat-ai/spaces-static/assets/${path}`;
    const fallbackImage = assetUrl('images/spaces-v2/collection-preview.png');
    const fallbackSpaceImage = assetUrl('images/spaces/card-image-1.webp');
    const emptyCollectionIcons = {
        'Floor Plans': 'card-floor-plans.svg',
        Renders: 'card-renders.svg',
        Documents: 'card-documents.svg',
        'Generated with AI': 'card-generated-ai.svg',
        Moodboards: 'card-moodboards.svg',
        'AI Studio': 'card-ai-studio.svg',
        '360° Panorama': 'card-panorama.svg',
        '360° Walkthrough': 'card-walkthrough.svg'
    };
    const emptyInsideContent = {
        'Floor Plans': { icon: 'card-floor-plans.svg', body: 'No projects here yet.', action: 'Create project' },
        Renders: { icon: 'card-renders.svg', body: 'No renders here yet.', action: 'Create render' },
        Documents: { icon: 'card-documents.svg', body: 'No documents here yet.', action: 'Upload document' },
        'Generated with AI': { icon: 'card-generated-ai.svg', body: 'No generated designs here yet.', action: 'Generate design' },
        Moodboards: { icon: 'card-moodboards.svg', body: 'No moodboards here yet.', action: 'Create moodboard' },
        'AI Studio': { icon: 'card-ai-studio.svg', body: 'No AI Studio files here yet.', action: 'Open AI Studio' },
        '360° Panorama': { icon: 'card-panorama.svg', body: 'No panoramas here yet.', action: 'Create panorama' },
        '360° Walkthrough': { icon: 'card-walkthrough.svg', body: 'No walkthroughs here yet.', action: 'Create walkthrough' }
    };
    const profileOptions = [...document.querySelectorAll('[data-user-profile-option]')];
    const description = document.querySelector('[data-user-profile-description]');
    const allowedRenderResolutions = new Set(['4K', '2K', 'FHD']);
    let activeAccount = null;
    let selectedSpaceId = null;

    const safeStore = value => {
        try { localStorage.setItem(storageKey, value); } catch { /* local persistence is optional */ }
    };

    const knownProfiles = ['one', 'many', 'demo', 'evelina', 'vanessa', 'natalia'];

    const toUiProfile = profile => {
        if (profile === 'one' || profile === 'natalia') return 'one';
        return 'many';
    };

    const initializeDefaultProfile = () => {
        try {
            if (localStorage.getItem(defaultProfileVersionKey) === defaultProfileVersion) return;
            localStorage.setItem(storageKey, 'many');
            localStorage.setItem(defaultProfileVersionKey, defaultProfileVersion);
        } catch {
            // The prototype can continue with the in-memory Demo fallback.
        }
    };

    const storedProfile = () => {
        try { return localStorage.getItem(storageKey) || 'many'; } catch { return 'many'; }
    };

    const setPreview = (image, file, fallback = fallbackImage, rejectTinyPreview = false) => {
        if (!image || !file) return;
        image.alt = file.title;
        const showFallback = () => {
            if (image.getAttribute('src') === fallback) {
                image.onerror = null;
                image.onload = null;
                return;
            }
            image.src = fallback;
        };
        image.onerror = showFallback;
        image.onload = () => {
            if (
                rejectTinyPreview
                && image.getAttribute('src') !== fallback
                && image.naturalWidth <= 16
                && image.naturalHeight <= 16
            ) {
                showFallback();
            }
        };
        image.src = file.previewUrl || fallback;
    };

    const setText = (element, value) => {
        if (element) element.textContent = value;
    };

    const setRenderResolutionBadge = (preview, file) => {
        if (!preview || !file) return;
        const resolution = file.type === 'Renders' && allowedRenderResolutions.has(file.resolution)
            ? file.resolution
            : '';
        let badge = preview.querySelector('.spaces-render-resolution-badge');

        if (!resolution) {
            badge?.remove();
            return;
        }

        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'spaces-render-resolution-badge';
            preview.append(badge);
        }
        badge.textContent = resolution;
        badge.setAttribute('aria-label', `${resolution} render`);
    };

    const setAiGeneratedBadge = (preview, file) => {
        if (!preview || !file) return;
        let badge = preview.querySelector('.spaces-ai-generated-badge');
        const host = preview.closest('.space-section-item, .spaces-tabs-file, .spaces-files-table-row');
        if (!file.generatedWithAi) {
            badge?.remove();
            host?.classList.remove('is-ai-generated');
            return;
        }

        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'spaces-ai-generated-badge';
            const label = document.createElement('span');
            label.textContent = 'Made with AI';
            badge.append(label);
            preview.append(badge);
        } else {
            badge.querySelector('img')?.remove();
            const label = badge.querySelector('span');
            if (label) label.textContent = 'Made with AI';
            else badge.textContent = 'Made with AI';
        }
        badge.title = 'Made with AI';
        badge.setAttribute('aria-label', 'Made with AI');
        host?.classList.add('is-ai-generated');
    };

    const setSidebarLabel = (button, value) => {
        if (!button) return;
        const label = document.createElement('span');
        label.className = 'spaces-tree-item-label';
        label.textContent = value;
        button.replaceChildren(label);
    };

    const sortByUpdated = files => [...files].sort((first, second) => {
        const firstDate = new Date((first.udate || first.cdate || '').replace(' ', 'T')).getTime() || 0;
        const secondDate = new Date((second.udate || second.cdate || '').replace(' ', 'T')).getTime() || 0;
        return secondDate - firstDate;
    });

    const filesById = new Map();

    const rememberFile = file => {
        if (file?.id) filesById.set(String(file.id), file);
    };

    const fillFileRow = (row, file) => {
        if (!row || !file) return;
        row.hidden = false;
        rememberFile(file);
        row.dataset.fileId = String(file.id);
        row.dataset.fileSearch = `${file.title} ${file.type} ${file.updated}`.toLowerCase();
        const cells = [...row.children];
        setText(row.querySelector('.spaces-file-name'), file.title);
        setText(cells[2], file.updated);
        setText(cells[3], file.owner || activeAccount?.label || 'You');
        setText(cells[4], file.updated);
        setText(row.querySelector('.spaces-file-location span'), file.type);
        row.querySelector('button[aria-label^="More actions"]')?.setAttribute('aria-label', `More actions for ${file.title}`);
        const thumbnail = row.querySelector('.spaces-file-thumbnail');
        if (thumbnail) {
            thumbnail.classList.add('spaces-file-thumbnail-photo');
            let image = thumbnail.querySelector('img');
            if (!image) {
                image = document.createElement('img');
                thumbnail.replaceChildren(image);
            }
            setPreview(image, file);
        }
        setAiGeneratedBadge(row.querySelector('.spaces-file-preview'), file);
    };

    const fillInsideCard = (card, file) => {
        if (!card || !file) return;
        card.hidden = false;
        rememberFile(file);
        card.dataset.fileId = String(file.id);
        card.dataset.insideFileSearch = `${file.title} ${file.type}`.toLowerCase();
        const previewLink = card.querySelector(':scope > a');
        setPreview(previewLink?.querySelector('img'), file);
        setRenderResolutionBadge(previewLink, file);
        setAiGeneratedBadge(previewLink, file);
        previewLink?.setAttribute('aria-label', file.generatedWithAi
            ? `Open ${file.title}, generated with AI`
            : `Open ${file.title}`);
        setText(card.querySelector(':scope > div > a'), file.title);
        setText(card.querySelector(':scope > div > span'), file.updated);
        card.querySelector('button[aria-label^="More actions"]')?.setAttribute('aria-label', `More actions for ${file.title}`);
    };

    const fillTabCard = (card, file) => {
        if (!card || !file) return;
        card.hidden = false;
        rememberFile(file);
        card.dataset.fileId = String(file.id);
        card.dataset.spaceTabsFile = `${normalize(file.type)} ${normalize(file.title)}`;
        card.dataset.spaceTabsCollection = collectionKey(file.type);
        card.dataset.spaceTabsSearch = collectionKey(`${file.type} ${file.title}`);
        const previewLink = card.querySelector('.spaces-tabs-file-preview');
        setPreview(previewLink?.querySelector('img'), file);
        setRenderResolutionBadge(previewLink, file);
        setAiGeneratedBadge(previewLink, file);
        previewLink?.setAttribute('aria-label', file.generatedWithAi
            ? `Open ${file.title}, generated with AI`
            : `Open ${file.title}`);
        setText(card.querySelector('.spaces-tabs-file-meta > a'), file.title);
        setText(card.querySelector('.spaces-tabs-file-project'), file.type === 'Renders'
            ? file.projectTitle || file.title
            : '—');
        setText(card.querySelector('.spaces-tabs-file-resolution'), file.type === 'Renders'
            ? file.resolution || '—'
            : '—');
        setText(card.querySelector('.spaces-tabs-file-date'), file.updated);
        card.querySelector('button[aria-label^="More actions"]')?.setAttribute('aria-label', `More actions for ${file.title}`);
    };

    const normalize = value => String(value || '').trim().toLowerCase();
    const collectionKey = value => normalize(value)
        .normalize('NFKD')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
    const collectionName = value => {
        const normalized = normalize(value);
        if (normalized === 'projects' || normalized === 'floor plans') return 'Floor Plans';
        if (normalized === 'renders') return 'Renders';
        if (normalized === 'documents') return 'Documents';
        if (normalized === 'generated with ai') return 'Generated with AI';
        if (normalized === 'moodboards') return 'Moodboards';
        if (normalized === 'ai studio') return 'AI Studio';
        if (normalized === '360 panorama' || normalized === '360° panorama') return '360° Panorama';
        if (normalized === '360 walkthrough' || normalized === '360° walkthrough') return '360° Walkthrough';
        return String(value || '').trim();
    };

    const sidebarCollections = [
        'Floor Plans',
        'Renders',
        'AI Studio',
        'Moodboards',
        '360° Panorama',
        '360° Walkthrough',
        'Documents',
        'Generated with AI'
    ];

    const collectionsGridOrder = [
        'Floor Plans',
        'Renders',
        'Documents',
        'Generated with AI',
        'Moodboards',
        'AI Studio',
        '360° Panorama',
        '360° Walkthrough'
    ];

    const folderId = folder => String(folder?.id || '').replace(/^(?:folder|document-folder)-/, '');

    const foldersForCollection = (account, space, collection) => account.folders.filter(folder => (
        folder.spaceId === space?.id
        && String(folder.parentId || '0') === '0'
        && collectionName(folder.type) === collection
    ));

    const renderSidebarTree = (node, account, space) => {
        const tree = node.querySelector('.spaces-space-tree');
        if (!tree || !space) return;

        const currentFiles = account.files.filter(file => file.spaceId === space.id);
        const expandedCollections = new Set(
            [...tree.querySelectorAll('[data-sidebar-collection].is-open')]
                .map(collection => collection.dataset.sidebarCollection)
        );

        tree.replaceChildren();

        sidebarCollections.forEach(collection => {
            const files = currentFiles.filter(file => collectionName(file.type) === collection);
            const folders = foldersForCollection(account, space, collection);
            const item = document.createElement('li');

            if (!folders.length) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'spaces-tree-item';
                setSidebarLabel(button, collection);
                if (files.length) button.dataset.fileCount = String(files.length);
                item.append(button);
                tree.append(item);
                return;
            }

            const folderTreeId = `sidebar-${space.id}-${normalize(collection).replace(/[^a-z0-9]+/g, '-')}-folders`;
            const isExpanded = expandedCollections.has(collection);
            const folderGroup = document.createElement('div');
            folderGroup.className = 'spaces-tree-collection';
            folderGroup.dataset.sidebarCollection = collection;
            folderGroup.classList.toggle('is-open', isExpanded);

            const row = document.createElement('div');
            row.className = 'spaces-tree-collection-row';
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'spaces-tree-item spaces-tree-collection-main';
            setSidebarLabel(button, collection);
            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'spaces-tree-collection-chevron';
            toggle.setAttribute('aria-controls', folderTreeId);
            toggle.setAttribute('aria-label', `${isExpanded ? 'Collapse' : 'Expand'} ${collection} folders`);
            toggle.setAttribute('aria-expanded', String(isExpanded));
            const toggleIcon = document.createElement('img');
            toggleIcon.src = '/spaces-chat-ai/spaces-static/assets/images/sidebar/chevron-down.svg';
            toggleIcon.alt = '';
            toggleIcon.setAttribute('aria-hidden', 'true');
            toggle.append(toggleIcon);

            const folderList = document.createElement('ul');
            folderList.id = folderTreeId;
            folderList.className = 'spaces-tree-folder-list';
            folderList.setAttribute('role', 'list');
            folders.forEach(folder => {
                const folderItem = document.createElement('li');
                const folderButton = document.createElement('button');
                const folderFiles = files.filter(file => String(file.folderId || '') === folderId(folder));
                folderButton.type = 'button';
                folderButton.className = 'spaces-folder-item';
                setSidebarLabel(folderButton, folder.title);
                if (folderFiles.length) folderButton.dataset.fileCount = String(folderFiles.length);
                folderItem.append(folderButton);
                folderList.append(folderItem);
            });

            toggle.addEventListener('click', event => {
                event.preventDefault();
                const isOpen = folderGroup.classList.toggle('is-open');
                toggle.setAttribute('aria-expanded', String(isOpen));
                toggle.setAttribute('aria-label', `${isOpen ? 'Collapse' : 'Expand'} ${collection} folders`);
            });
            row.append(button, toggle);
            folderGroup.append(row, folderList);
            item.append(folderGroup);
            tree.append(item);
        });
    };

    const fillCollection = (card, title, files) => {
        if (!card) return;
        card.hidden = false;
        card.dataset.collection = normalize(title);
        setText(card.querySelector('.spaces-item-name'), title);
        const previewGrid = card.querySelector('.spaces-item-file-previews');
        const visual = card.querySelector('.spaces-item-visual');
        const sortedFiles = sortByUpdated(files);
        const hasFiles = sortedFiles.length > 0;
        card.classList.toggle('is-empty-collection', !hasFiles);
        if (previewGrid) {
            previewGrid.hidden = !hasFiles;
            previewGrid.setAttribute('aria-label', `${sortedFiles.length} ${sortedFiles.length === 1 ? 'file' : 'files'}`);
            previewGrid.replaceChildren();

            sortedFiles.slice(0, 3).forEach(file => {
                const preview = document.createElement('span');
                const image = document.createElement('img');
                preview.className = 'spaces-item-file-preview';
                preview.dataset.fileName = file.title;
                preview.append(image);
                setPreview(image, file);
                previewGrid.append(preview);
            });

            if (sortedFiles.length > 3) {
                const more = document.createElement('span');
                more.className = 'spaces-item-file-preview-more';
                more.textContent = `+${sortedFiles.length - 3}`;
                previewGrid.append(more);
            }

            while (previewGrid.children.length < 4) {
                const empty = document.createElement('span');
                empty.className = 'spaces-item-file-preview-empty';
                previewGrid.append(empty);
            }
        }
        if (visual) {
            let emptyIcon = visual.querySelector('.spaces-item-product-img-empty');
            const emptyIconName = emptyCollectionIcons[title];
            if (!emptyIcon && !hasFiles && emptyIconName) {
                emptyIcon = document.createElement('img');
                emptyIcon.className = 'spaces-item-product-img-empty';
                emptyIcon.src = assetUrl(`images/spaces-v2/${emptyIconName}`);
                emptyIcon.alt = '';
                visual.append(emptyIcon);
            }
            if (emptyIcon) {
                emptyIcon.hidden = hasFiles;
                if (!hasFiles && emptyIconName) emptyIcon.src = assetUrl(`images/spaces-v2/${emptyIconName}`);
            }
        }
        const updated = card.querySelector('.spaces-item-updated');
        if (updated) updated.textContent = sortedFiles[0]?.updated || '';
    };

    const ensureFileSlots = (container, selector, files, fill) => {
        if (!container) return;
        const slots = [...container.querySelectorAll(selector)]
            .filter(slot => slot.dataset.insideStatusFile !== 'true');
        const template = slots[0];
        if (!template) return;

        while (slots.length < files.length) {
            const clone = template.cloneNode(true);
            clone.hidden = true;
            container.append(clone);
            slots.push(clone);
        }

        slots.forEach((slot, index) => {
            const file = files[index];
            slot.dataset.accountFile = String(Boolean(file));
            slot.hidden = !file;
            if (file) fill(slot, file);
        });
    };

    const createFolderCard = (account, currentSpace, currentCollection, folder, className) => {
            const button = document.createElement('button');
            const icon = document.createElement('img');
            const title = document.createElement('span');
            const matchingFiles = account.files.filter(file => (
                file.spaceId === currentSpace?.id
                && collectionName(file.type) === currentCollection
                && String(file.folderId || '') === folderId(folder)
            ));

            button.type = 'button';
            button.className = className;
            button.setAttribute('aria-label', `Open ${folder.title} folder`);
            icon.src = './icons/ic-folder.svg';
            icon.alt = '';
            icon.setAttribute('aria-hidden', 'true');
            title.textContent = folder.title;
            button.append(icon, title);

            if (matchingFiles.length) {
                const count = document.createElement('span');
                count.className = 'space-section-folder-count';
                count.textContent = String(matchingFiles.length);
                count.setAttribute('aria-label', `${matchingFiles.length} files`);
                button.append(count);
            }
            return button;
    };

    const renderFolders = (account, currentSpace, currentCollection) => {
        const section = document.querySelector('[data-inside-folders]');
        const list = section?.querySelector('[data-inside-folder-list]');
        if (!section || !list) return;

        const folders = foldersForCollection(account, currentSpace, currentCollection);
        section.hidden = folders.length === 0;
        list.replaceChildren();

        folders.forEach(folder => {
            list.append(createFolderCard(account, currentSpace, currentCollection, folder, 'space-section-folder-card'));
        });
    };

    const renderTabsFolders = collection => {
        const section = document.querySelector('[data-space-tabs-folders]');
        const list = section?.querySelector('[data-space-tabs-folder-row]');
        if (!section || !list || !activeAccount) return;

        const currentSpace = activeAccount.spaces.find(space => space.id === selectedSpaceId)
            || activeAccount.activeSpace
            || activeAccount.spaces[0];
        const currentCollection = collectionName(collection || 'Floor Plans');
        const folders = foldersForCollection(activeAccount, currentSpace, currentCollection);

        list.replaceChildren();
        folders.forEach(folder => {
            list.append(createFolderCard(activeAccount, currentSpace, currentCollection, folder, 'spaces-tabs-folder-card'));
        });
        section.hidden = folders.length === 0;
        document.dispatchEvent(new CustomEvent('spaces-tabs-folders-rendered', {
            detail: { count: folders.length }
        }));
    };

    const updateInsideEmptyState = (collection, files, folders) => {
        const emptyState = document.querySelector('[data-inside-empty]');
        const projectsHeader = document.querySelector('[data-inside-projects-header]');
        const grid = document.querySelector('[data-inside-grid]');
        const filesTable = document.querySelector('[data-inside-files-table]');
        const viewToggle = document.querySelector('[data-inside-view-toggle]');
        const isEmpty = files.length === 0 && folders.length === 0;
        if (emptyState) emptyState.hidden = !isEmpty;
        if (projectsHeader) projectsHeader.hidden = isEmpty;

        if (isEmpty) {
            if (grid) grid.hidden = true;
            if (filesTable) filesTable.hidden = true;
        } else {
            const isListView = viewToggle?.getAttribute('aria-pressed') === 'true';
            if (grid) grid.hidden = isListView;
            if (filesTable) filesTable.hidden = !isListView;
        }

        const content = emptyInsideContent[collection] || {
            icon: 'card-documents.svg',
            body: 'No files here yet.',
            action: 'Add file'
        };
        setText(emptyState?.querySelector('[data-inside-empty-title]'), content.title || collection);
        setText(emptyState?.querySelector('[data-inside-empty-body]'), content.body);
        setText(emptyState?.querySelector('[data-inside-empty-action-label]'), content.action);
        const icon = emptyState?.querySelector('[data-inside-empty-icon]');
        if (icon) icon.src = assetUrl(`images/spaces-v2/${content.icon}`);
    };

    const renderAccount = account => {
        document.body.dataset.userProfile = account.id;
        document.body.classList.toggle('spaces-single-space-profile', account.spaces.length === 1);
        setText(document.querySelector('.header-avatar-letter'), account.label.slice(0, 1).toUpperCase());
        const canPinSpaces = account.spaces.length > 1;
        const spaceNodes = [...document.querySelectorAll('[data-space-tree]')];
        spaceNodes.forEach((node, index) => {
            const storedSpaceId = String(node.dataset.accountSpaceId || '');
            const originalOrder = Number.parseInt(node.dataset.spaceOrder || '', 10);
            const fallbackSpace = Number.isInteger(originalOrder) && originalOrder >= 0
                ? account.spaces[originalOrder]
                : account.spaces[index];
            const space = account.spaces.find(candidate => String(candidate.id) === storedSpaceId)
                || fallbackSpace;
            node.dataset.accountHidden = String(!space);
            node.hidden = !space;
            if (!space) return;
            node.dataset.accountSpaceId = String(space.id);
            setText(node.querySelector('.spaces-space-main > span:not(.spaces-space-avatar)'), space.title);
            setText(node.querySelector('.spaces-space-avatar-letter'), space.initial);
            const spaceAvatar = node.querySelector('.spaces-space-avatar');
            if (spaceAvatar) {
                if (space.avatarColor) {
                    spaceAvatar.style.backgroundColor = space.avatarColor;
                } else {
                    spaceAvatar.style.removeProperty('background-color');
                }
            }
            const pin = node.querySelector('[data-space-pin]');
            const pinTooltip = pin?.nextElementSibling?.classList.contains('spaces-space-pin-tooltip')
                ? pin.nextElementSibling
                : null;
            if (pin) {
                pin.hidden = !canPinSpaces;
                pin.setAttribute('aria-label', `Pin ${space.title}`);
            }
            if (pinTooltip) pinTooltip.hidden = !canPinSpaces;
            node.querySelector('.spaces-space-chevron')?.setAttribute('aria-label', `Expand ${space.title}`);
            renderSidebarTree(node, account, space);
        });
        const showAllSpacesButton = document.querySelector('[data-spaces-show-all]');
        if (showAllSpacesButton) showAllSpacesButton.hidden = account.spaces.length <= 5;

        const currentSpace = account.spaces.find(space => space.id === selectedSpaceId)
            || account.activeSpace
            || account.spaces[0];
        selectedSpaceId = currentSpace?.id || null;
        const currentFiles = sortByUpdated(account.files.filter(file => file.spaceId === currentSpace?.id));
        const fallbackSpaceName = `${account.label}’s Space`;
        setText(document.querySelector('[data-space-name]'), currentSpace?.title || fallbackSpaceName);
        setText(document.querySelector('[data-space-menu-name]'), currentSpace?.title || fallbackSpaceName);
        setText(document.querySelector('[data-space-address]'), currentSpace?.address || 'Fill Address');
        setPreview(document.querySelector('.spaces-info-img img'), {
            title: currentSpace?.title ? `${currentSpace.title} preview` : `${fallbackSpaceName} preview`,
            previewUrl: currentSpace?.previewUrl
        }, fallbackSpaceImage, true);
        const input = document.querySelector('[data-space-input]');
        if (input && currentSpace) input.value = currentSpace.title;
        setText(document.querySelector('[data-inside-back]'), currentSpace?.title || fallbackSpaceName);

        const collectionSlots = [...document.querySelectorAll('[data-collections-grid] [data-collection]')];
        const collectionGrid = document.querySelector('[data-collections-grid]');
        const orderedCollectionSlots = collectionSlots
            .map(card => ({
                card,
                title: collectionName(card.querySelector('.spaces-item-name')?.textContent)
            }))
            .sort((left, right) => {
                const leftIndex = collectionsGridOrder.indexOf(left.title);
                const rightIndex = collectionsGridOrder.indexOf(right.title);
                return (leftIndex < 0 ? 999 : leftIndex) - (rightIndex < 0 ? 999 : rightIndex);
            });

        orderedCollectionSlots.forEach(({ card, title }) => {
            fillCollection(card, title, currentFiles.filter(file => collectionName(file.type) === title));
            collectionGrid?.append(card);
        });

        ensureFileSlots(document.querySelector('[data-files-table] .spaces-files-table'), '[data-file-row]', currentFiles, fillFileRow);
        ensureFileSlots(document.querySelector('[data-space-tabs-files]'), '[data-space-tabs-file]', currentFiles, fillTabCard);

        const insideCollection = collectionName(document.querySelector('[data-inside-title]')?.textContent || 'Floor Plans');
        setText(document.querySelector('[data-inside-projects-title]'), insideCollection);
        const insideFiles = currentFiles.filter(file => collectionName(file.type) === insideCollection);
        const insideFolders = foldersForCollection(account, currentSpace, insideCollection);
        renderFolders(account, currentSpace, insideCollection);
        ensureFileSlots(document.querySelector('[data-inside-grid]'), '[data-inside-file-search]', insideFiles, fillInsideCard);
        ensureFileSlots(document.querySelector('[data-inside-files-table] .spaces-files-table'), '[data-inside-file-row]', insideFiles, fillFileRow);
        updateInsideEmptyState(insideCollection, insideFiles, insideFolders);
        document.dispatchEvent(new CustomEvent('spaces-account-sidebar-rendered'));
        document.dispatchEvent(new CustomEvent('spaces-account-files-rendered'));
    };

    const selectSpace = title => {
        if (!activeAccount) return;
        const space = activeAccount.spaces.find(candidate => normalize(candidate.title) === normalize(title));
        if (!space) return;
        selectedSpaceId = space.id;
        renderAccount(activeAccount);
    };

    const refreshCurrentSpace = () => {
        if (activeAccount) renderAccount(activeAccount);
    };

    const updateUi = profile => {
        const uiProfile = toUiProfile(profile);
        profileOptions.forEach(option => option.setAttribute('aria-pressed', String(option.dataset.userProfile === uiProfile)));
        const selectedOption = profileOptions.find(option => option.dataset.userProfile === uiProfile);
        setText(document.querySelector('[data-home-profile-name]'), selectedOption?.dataset.userProfileName || 'Demo');
        if (description) {
            const descriptions = {
                one: 'Show a single space in the sidebar.',
                many: 'Show multiple spaces in the sidebar.',
                evelina: 'Evelina’s local CSV data and public hash previews.',
                vanessa: 'Vanessa’s local CSV export, folders, files, and public hash previews.',
                natalia: 'Natalia’s local CSV export, folders, files, and public hash previews.',
                demo: 'Show multiple spaces in the sidebar.'
            };
            description.textContent = descriptions[profile] || descriptions.many;
        }
    };

    const applyProfile = async (profile, options = {}) => {
        safeStore(profile);
        updateUi(profile);
        try {
            const account = await window.SpacesAccountData.load(profile);
            activeAccount = account;
            selectedSpaceId = account.activeSpace?.id || account.spaces[0]?.id || null;
            setText(document.querySelector('[data-home-profile-name]'), account.label || profile);
            renderAccount(account);
            document.dispatchEvent(new CustomEvent('spaces-account-profile-ready', { detail: { account } }));
            if (options.history) document.dispatchEvent(new CustomEvent('spaces-history-navigate'));
        } catch (error) {
            console.error(`Unable to load the ${profile} profile.`, error);
            if (description) description.textContent = `${profile} local data could not be loaded.`;
        }
    };

    const openItemMenus = new Map();

    const restoreItemMenu = dropdown => {
        const saved = openItemMenus.get(dropdown);
        if (!saved) return;
        const { menu, placeholder } = saved;
        menu.classList.remove('is-spaces-item-menu-portal');
        menu.style.removeProperty('position');
        menu.style.removeProperty('top');
        menu.style.removeProperty('left');
        menu.style.removeProperty('right');
        menu.style.removeProperty('bottom');
        menu.style.removeProperty('width');
        menu.style.removeProperty('z-index');
        if (placeholder?.parentNode) {
            placeholder.parentNode.insertBefore(menu, placeholder);
            placeholder.remove();
        }
        openItemMenus.delete(dropdown);
    };

    const closeItemDropdowns = (except = null) => {
        document.querySelectorAll('.spaces-item-dropdown.is-open').forEach(node => {
            if (except && node === except) return;
            node.classList.remove('is-open');
            restoreItemMenu(node);
        });
    };

    const positionItemDropdown = dropdown => {
        const trigger = dropdown?.querySelector(':scope > button');
        let menu = openItemMenus.get(dropdown)?.menu || dropdown?.querySelector(':scope > div');
        if (!trigger || !menu) return;

        if (!openItemMenus.has(dropdown)) {
            const placeholder = document.createComment('spaces-item-dropdown-slot');
            menu.parentNode?.insertBefore(placeholder, menu);
            menu.classList.add('is-spaces-item-menu-portal');
            document.body.appendChild(menu);
            openItemMenus.set(dropdown, { menu, placeholder });
        }

        const place = () => {
            const rect = trigger.getBoundingClientRect();
            const gap = 4;
            menu.style.setProperty('display', 'block', 'important');
            menu.style.setProperty('position', 'fixed', 'important');
            menu.style.setProperty('right', 'auto', 'important');
            menu.style.setProperty('bottom', 'auto', 'important');
            menu.style.setProperty('z-index', '2147483000', 'important');
            menu.style.setProperty('transform', 'none', 'important');
            // Provisional place so we can measure real height.
            menu.style.setProperty('top', `${Math.round(rect.bottom + gap)}px`, 'important');
            menu.style.setProperty('left', '0px', 'important');
            const menuWidth = Math.max(Math.round(menu.getBoundingClientRect().width) || 240, 240);
            const menuHeight = Math.round(menu.getBoundingClientRect().height) || 0;
            let left = rect.right - menuWidth;
            left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));
            let top = rect.bottom + gap;
            if (menuHeight > 0 && top + menuHeight > window.innerHeight - 8) {
                const above = rect.top - menuHeight - gap;
                if (above >= 8) top = above;
            }
            menu.style.setProperty('left', `${Math.round(left)}px`, 'important');
            menu.style.setProperty('top', `${Math.round(top)}px`, 'important');
        };

        place();
        requestAnimationFrame(place);
    };

    document.addEventListener('click', event => {
        const addButton = event.target.closest('[data-add-to-new-chat]');
        if (addButton) {
            event.preventDefault();
            event.stopPropagation();
            const host = addButton.closest('[data-file-id]');
            const file = filesById.get(String(host?.dataset.fileId || ''));
            window.SpacesHomeComposer?.addToNewChat(file);
            closeItemDropdowns();
            return;
        }

        const trigger = event.target.closest('.spaces-item-dropdown > button');
        if (trigger) {
            event.preventDefault();
            event.stopPropagation();
            const dropdown = trigger.closest('.spaces-item-dropdown');
            const willOpen = !dropdown?.classList.contains('is-open');
            closeItemDropdowns(willOpen ? dropdown : null);
            if (!dropdown) return;
            dropdown.classList.toggle('is-open', willOpen);
            if (willOpen) {
                requestAnimationFrame(() => positionItemDropdown(dropdown));
            } else {
                closeItemDropdowns();
            }
            return;
        }

        if (!event.target.closest('.spaces-item-dropdown') && !event.target.closest('.is-spaces-item-menu-portal')) {
            closeItemDropdowns();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        closeItemDropdowns();
    });

    window.addEventListener('resize', () => closeItemDropdowns());
    document.querySelector('main.get-started-main')?.addEventListener('scroll', () => closeItemDropdowns(), { passive: true });

    profileOptions.forEach(option => option.addEventListener('click', () => applyProfile(option.dataset.userProfile, { history: true })));
    document.querySelector('[data-inside-empty-action]')?.addEventListener('click', () => {
        document.querySelector('[data-inside-new]')?.click();
    });
    initializeDefaultProfile();
    const initialProfile = toUiProfile(storedProfile());
    updateUi(initialProfile);
    if (knownProfiles.includes(initialProfile)) applyProfile(initialProfile);
    window.SpacesAccountProfile = {
        applyProfile,
        selectSpace,
        refreshCurrentSpace,
        renderTabsFolders
    };
})();
