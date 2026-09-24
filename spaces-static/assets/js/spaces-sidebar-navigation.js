(() => {
    'use strict';

    const storageKey = 'planner5d-spaces-v2-active-space-order';
    const mainContent = document.querySelector('.spaces-main-content');
    const homeButton = document.querySelector('[data-home-page-trigger]');
    const allSpacesButton = document.querySelector('[data-all-spaces-trigger]');
    const sharedSpacesButton = document.querySelector('[data-shared-spaces-trigger]');
    const directoryStorageKey = 'planner5d-spaces-v2-spaces-directory';
    const homeLogo = document.querySelector('.header-logo');

    const normalized = value => String(value || '').trim().toLowerCase();

    const getSpaceButtons = () => [...document.querySelectorAll('[data-space-tree] .spaces-space-main')];
    const getTreeItems = () => [...document.querySelectorAll('[data-space-tree] .spaces-tree-item, [data-space-tree] .spaces-folder-item')];

    const getSpaceTitle = button => button?.querySelector(':scope > span:not(.spaces-space-avatar)')?.textContent?.trim() || 'Space';

    const setPageTitle = title => {
        document.querySelectorAll('[data-space-name]').forEach(element => {
            element.textContent = title;
        });
    };

    const clearActiveItems = () => {
        homeButton?.classList.remove('is-active');
        homeButton?.removeAttribute('aria-current');
        allSpacesButton?.classList.remove('is-active');
        allSpacesButton?.removeAttribute('aria-current');
        sharedSpacesButton?.classList.remove('is-active');
        sharedSpacesButton?.removeAttribute('aria-current');
        document.querySelector('[data-ai-chats-all]')?.classList.remove('is-active');
        document.querySelector('[data-ai-chats-all]')?.removeAttribute('aria-current');
        getSpaceButtons().forEach(button => {
            button.classList.remove('is-active');
            button.removeAttribute('aria-current');
        });
        getTreeItems().forEach(button => {
            button.classList.remove('is-active');
            button.removeAttribute('aria-current');
        });
        document.querySelectorAll('[data-ai-chat-item]').forEach(button => {
            button.classList.remove('is-active');
            button.removeAttribute('aria-current');
        });
    };

    const setActiveItem = button => {
        if (!button) return;
        button.classList.add('is-active');
        button.setAttribute('aria-current', 'page');
    };

    const isChatPlacementOption3 = () => document.body.classList.contains('is-new-chat-placement-option3');
    const homePage = document.querySelector('[data-home-page]');

    const setHomeSurface = surface => {
        const next = surface === 'feed' ? 'feed' : 'chat';
        if (homePage) homePage.dataset.homeSurface = next;
        document.body.classList.toggle('is-home-feed', next === 'feed');
        document.dispatchEvent(new CustomEvent('spaces-home-surface-changed', {
            detail: { surface: next }
        }));
    };

    const clearHomeSurface = () => {
        document.body.classList.remove('is-home-feed');
        if (homePage) homePage.dataset.homeSurface = '';
    };

    const setNavigationSelection = ({ home = false, spaceButton, treeItem, surface } = {}) => {
        clearActiveItems();

        if (home) {
            const homeSurface = surface
                || homePage?.dataset.homeSurface
                || 'chat';
            // Option 3: Home tab and New chat / Ask Copilot are separate pages.
            if (isChatPlacementOption3() && homeSurface === 'feed') {
                setActiveItem(allSpacesButton);
            } else {
                setActiveItem(homeButton);
            }
            return;
        }

        setActiveItem(spaceButton);
        setActiveItem(treeItem);
    };

    const getFloorPlansFor = spaceButton => {
        const tree = spaceButton?.closest('[data-space-tree]');
        return [...(tree?.querySelectorAll('.spaces-tree-item') || [])]
            .find(item => normalized(item.textContent) === 'floor plans');
    };

    const getCollectionFor = (spaceButton, collection) => {
        const tree = spaceButton?.closest('[data-space-tree]');
        return [...(tree?.querySelectorAll('.spaces-tree-item') || [])]
            .find(item => normalized(item.textContent) === normalized(collection));
    };

    const saveSelectedSpace = spaceButton => {
        const order = spaceButton?.closest('[data-space-tree]')?.dataset.spaceOrder;
        if (order === undefined) return;
        try {
            window.localStorage.setItem(storageKey, order);
        } catch {
            // The standalone lab continues without persisted preferences.
        }
    };

    const getSavedSpace = () => {
        try {
            const order = window.localStorage.getItem(storageKey);
            return getSpaceButtons().find(button => button.closest('[data-space-tree]')?.dataset.spaceOrder === order) || getSpaceButtons()[0];
        } catch {
            return getSpaceButtons()[0];
        }
    };

    const saveDirectory = filter => {
        try {
            if (filter) window.localStorage.setItem(directoryStorageKey, filter);
            else window.localStorage.removeItem(directoryStorageKey);
        } catch {
            // The standalone lab continues without persisted preferences.
        }
    };

    const getSavedDirectory = () => {
        try {
            const value = window.localStorage.getItem(directoryStorageKey);
            return value === 'shared' || value === 'all' ? value : '';
        } catch {
            return '';
        }
    };

    const applySpaceSelection = (spaceButton, options = {}) => {
        if (!spaceButton) return;
        document.dispatchEvent(new CustomEvent('spaces-navigation-start'));

        const navigation = window.SpacesPrototypeNavigation;
        clearHomeSurface();
        navigation?.showSpaces();
        saveDirectory('');
        // A click on a Space always opens its root page. Never carry the
        // collection currently open in another Space into the new Space.
        navigation?.closeCollection?.({ restoreScroll: false });
        window.SpacesAccountProfile?.selectSpace(getSpaceTitle(spaceButton));
        saveSelectedSpace(spaceButton);

        if (navigation?.isTabsMode()) {
            const floorPlans = getFloorPlansFor(spaceButton);
            setNavigationSelection({ spaceButton, treeItem: floorPlans });
            navigation.selectTab?.('floor plans');
        } else {
            setNavigationSelection({ spaceButton });
        }

        setPageTitle(getSpaceTitle(spaceButton));
        document.body.dataset.activeSpaceTitle = getSpaceTitle(spaceButton);

        if (options.history) document.dispatchEvent(new CustomEvent('spaces-history-navigate'));
    };

    const applyTreeSelection = (treeItem, options = {}) => {
        const spaceButton = treeItem.closest('[data-space-tree]')?.querySelector('.spaces-space-main');
        if (!spaceButton) return;
        document.dispatchEvent(new CustomEvent('spaces-navigation-start'));

        const navigation = window.SpacesPrototypeNavigation;
        clearHomeSurface();
        navigation?.showSpaces();
        saveDirectory('');
        window.SpacesAccountProfile?.selectSpace(getSpaceTitle(spaceButton));
        saveSelectedSpace(spaceButton);

        if (navigation?.isTabsMode()) {
            setNavigationSelection({ spaceButton, treeItem });
            navigation.selectTab?.(normalized(treeItem.textContent), { history: options.history });
        } else {
            setNavigationSelection({ spaceButton, treeItem });
            navigation?.openCollection?.(treeItem.textContent.trim(), { history: options.history });
        }

        setPageTitle(getSpaceTitle(spaceButton));
        document.body.dataset.activeSpaceTitle = getSpaceTitle(spaceButton);
    };

    const applyDirectorySelection = (filter, options = {}) => {
        const selectedFilter = filter === 'shared' ? 'shared' : 'all';
        document.dispatchEvent(new CustomEvent('spaces-navigation-start'));
        const navigation = window.SpacesPrototypeNavigation;
        clearHomeSurface();
        navigation?.showAllSpaces({ filter: selectedFilter });
        navigation?.closeCollection?.({ restoreScroll: false });
        clearActiveItems();
        setActiveItem(selectedFilter === 'shared' ? sharedSpacesButton : allSpacesButton);
        saveDirectory(selectedFilter);
        if (options.history) document.dispatchEvent(new CustomEvent('spaces-history-navigate'));
    };

    const applyAllSpacesSelection = (options = {}) => {
        applyDirectorySelection('all', options);
    };

    const applySharedSpacesSelection = (options = {}) => {
        applyDirectorySelection('shared', options);
    };

    const applyAiChatsSelection = (options = {}) => {
        document.dispatchEvent(new CustomEvent('spaces-navigation-start'));
        saveDirectory('');
        clearHomeSurface();
        window.SpacesPrototypeNavigation?.showAiChats?.();
        clearActiveItems();
        const allChatsButton = document.querySelector('[data-ai-chats-all]');
        setActiveItem(allChatsButton);
        if (options.history) document.dispatchEvent(new CustomEvent('spaces-history-navigate'));
    };

    const applyHomeSelection = (options = {}) => {
        document.dispatchEvent(new CustomEvent('spaces-navigation-start'));
        saveDirectory('');
        // Default is New chat. Only the Option 3 Home tab opens the feed page.
        const surface = options.surface === 'feed' ? 'feed' : 'chat';
        setHomeSurface(surface);
        if (surface === 'feed') {
            window.SpacesListingChat?.end?.();
            window.SpacesAiChats?.markIdle?.();
            homePage?.classList.remove('is-centered-chat');
        }
        window.SpacesPrototypeNavigation?.showHome(options);
        setNavigationSelection({ home: true, surface });
    };

    const applyGlobalSearchSelection = () => {
        const navigation = window.SpacesPrototypeNavigation;
        navigation?.showSpaces();
        saveDirectory('');
        navigation?.closeCollection?.({ restoreScroll: false });
        setNavigationSelection();
    };

    const syncSelection = () => {
        if (mainContent?.classList.contains('is-home-page')) {
            setNavigationSelection({ home: true });
            return;
        }
        if (mainContent?.classList.contains('is-ai-chats-page')) {
            applyAiChatsSelection();
            return;
        }
        if (isChatPlacementOption3()) {
            // Option 3 has no All Spaces page — open the separate Home feed instead.
            if (mainContent?.classList.contains('is-all-spaces-page') || getSavedDirectory() === 'all') {
                applyHomeSelection({ surface: 'feed' });
                return;
            }
        }
        const directory = getSavedDirectory();
        if (directory) {
            applyDirectorySelection(directory);
            return;
        }
        applySpaceSelection(getSavedSpace());
    };

    homeButton?.addEventListener('click', event => {
        event.preventDefault();
        applyHomeSelection({ history: true, surface: 'chat' });
    }, true);

    allSpacesButton?.addEventListener('click', event => {
        event.preventDefault();
        if (isChatPlacementOption3()) {
            applyHomeSelection({ history: true, surface: 'feed' });
            return;
        }
        applyAllSpacesSelection({ history: true });
    }, true);

    sharedSpacesButton?.addEventListener('click', event => {
        event.preventDefault();
        applySharedSpacesSelection({ history: true });
    }, true);

    homeLogo?.addEventListener('click', event => {
        event.preventDefault();
        applyHomeSelection({
            history: true,
            surface: isChatPlacementOption3() ? 'feed' : 'chat'
        });
    });

    document.addEventListener('click', event => {
        const spaceButton = event.target.closest('.spaces-space-main');
        if (spaceButton) {
            event.preventDefault();
            event.stopImmediatePropagation();
            applySpaceSelection(spaceButton, { history: true });
            return;
        }

        const treeItem = event.target.closest('.spaces-tree-item');
        if (treeItem) {
            event.preventDefault();
            applyTreeSelection(treeItem, { history: true });
        }
    }, true);

    document.addEventListener('spaces-account-profile-ready', event => {
        if (mainContent?.classList.contains('is-home-page')) return;
        if (mainContent?.classList.contains('is-ai-chats-page')) return;
        if (isChatPlacementOption3() && (
            mainContent?.classList.contains('is-all-spaces-page') || getSavedDirectory() === 'all'
        )) {
            applyHomeSelection({ surface: 'feed' });
            return;
        }
        if (mainContent?.classList.contains('is-all-spaces-page') || getSavedDirectory()) {
            applyDirectorySelection(getSavedDirectory() || 'all');
            return;
        }
        const activeSpaceId = String(event.detail?.account?.activeSpace?.id || '');
        const activeSpace = getSpaceButtons().find(button => (
            String(button.closest('[data-space-tree]')?.dataset.accountSpaceId || '') === activeSpaceId
        ));
        applySpaceSelection(activeSpace || getSavedSpace());
    });

    document.addEventListener('spaces-collection-opened', event => {
        const navigation = window.SpacesPrototypeNavigation;
        if (navigation?.isTabsMode()) return;
        const selectedSpace = getSavedSpace();
        const collectionItem = getCollectionFor(selectedSpace, event.detail?.title);
        setNavigationSelection({ spaceButton: selectedSpace, treeItem: collectionItem });
    });

    document.addEventListener('spaces-collection-closed', () => {
        const navigation = window.SpacesPrototypeNavigation;
        if (navigation?.isTabsMode()) return;
        setNavigationSelection({ spaceButton: getSavedSpace() });
    });

    document.addEventListener('spaces-tab-changed', event => {
        if (!window.SpacesPrototypeNavigation?.isTabsMode()) return;
        const selectedSpace = getSavedSpace();
        const collectionItem = getCollectionFor(selectedSpace, event.detail?.title);
        if (!collectionItem) return;
        setNavigationSelection({ spaceButton: selectedSpace, treeItem: collectionItem });
    });

    document.addEventListener('spaces-new-chat-placement-changed', () => {
        if (mainContent?.classList.contains('is-home-page')) {
            setNavigationSelection({ home: true });
        }
    });

    window.SpacesSidebarNavigation = {
        selectSpace: applySpaceSelection,
        selectCollection: applyTreeSelection,
        selectHome: applyHomeSelection,
        selectAllSpaces: applyAllSpacesSelection,
        selectSharedSpaces: applySharedSpacesSelection,
        selectAiChats: applyAiChatsSelection,
        selectGlobalSearch: applyGlobalSearchSelection,
        getSelectedSpace: getSavedSpace,
        getSpaceButtons
    };

    syncSelection();
})();
