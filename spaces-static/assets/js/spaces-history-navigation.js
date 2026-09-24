(() => {
    'use strict';

    const stateKey = 'spaces-v2-navigation';
    const mainContent = document.querySelector('.spaces-main-content');
    const insideTitle = document.querySelector('[data-inside-title]');
    const getNavigation = () => window.SpacesPrototypeNavigation;
    const getSidebarNavigation = () => window.SpacesSidebarNavigation;
    let isRestoring = false;

    const readProfile = () => {
        try {
            return localStorage.getItem('planner5d-spaces-v2-user-profile') || 'many';
        } catch {
            return 'many';
        }
    };

    const normalize = value => String(value || '').trim().toLowerCase();

    const selectedSpaceTitle = () => {
        const active = document.querySelector('[data-space-tree] .spaces-space-main.is-active');
        return active?.querySelector(':scope > span:not(.spaces-space-avatar)')?.textContent?.trim()
            || document.body.dataset.activeSpaceTitle
            || null;
    };

    const selectedTabTitle = () => {
        const tab = document.querySelector('[data-space-tab][aria-selected="true"]');
        if (!tab) return null;
        return tab.querySelector('[data-space-tab-label]')?.textContent?.trim()
            || [...tab.childNodes]
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.replace(/\s+/g, ' ').trim())
                .find(Boolean)
            || tab.dataset.spaceTab
            || null;
    };

    const snapshot = () => ({
        key: stateKey,
        profile: readProfile(),
        page: mainContent?.classList.contains('is-home-page')
            ? 'home'
            : mainContent?.classList.contains('is-ai-chats-page')
                ? 'ai-chats'
            : mainContent?.classList.contains('is-all-spaces-page')
                ? (document.querySelector('[data-all-spaces-page]')?.dataset.allSpacesFilter === 'shared' ? 'shared' : 'all-spaces')
                : 'spaces',
        space: selectedSpaceTitle(),
        collection: mainContent?.classList.contains('is-collections-type-tabs')
            ? selectedTabTitle()
            : insideTitle?.textContent?.trim() || null,
        inside: Boolean(mainContent?.classList.contains('is-inside-section-open'))
    });

    const replaceCurrentState = () => {
        const current = history.state;
        if (current?.key === stateKey) return;
        history.replaceState(snapshot(), '', window.location.href);
    };

    const findSpace = title => getSidebarNavigation()?.getSpaceButtons?.()
        .find(button => normalize(button.querySelector(':scope > span:not(.spaces-space-avatar)')?.textContent) === normalize(title));

    const applyState = async state => {
        if (!state || state.key !== stateKey) return;
        isRestoring = true;

        try {
            const profile = readProfile();
            if (state.profile && state.profile !== profile) {
                const accountProfile = window.SpacesAccountProfile;
                if (accountProfile?.applyProfile) await accountProfile.applyProfile(state.profile, { history: false });
            }

            const navigation = getNavigation();
            const sidebarNavigation = getSidebarNavigation();
            if (!navigation || !sidebarNavigation) return;

            if (state.page === 'home') {
                sidebarNavigation.selectHome({ history: false });
                return;
            }

            if (state.page === 'ai-chats') {
                sidebarNavigation.selectAiChats?.({ history: false });
                return;
            }

            if (state.page === 'all-spaces' || state.page === 'shared') {
                if (state.page === 'shared') sidebarNavigation.selectSharedSpaces?.({ history: false });
                else sidebarNavigation.selectAllSpaces({ history: false });
                return;
            }

            navigation.showSpaces({ history: false });
            const space = findSpace(state.space) || sidebarNavigation.getSpaceButtons?.()[0];
            if (space) sidebarNavigation.selectSpace(space, { history: false });

            if (navigation.isTabsMode()) {
                if (state.collection) navigation.selectTab(state.collection, { history: false });
                return;
            }

            if (state.inside && state.collection) {
                navigation.openCollection(state.collection, { history: false });
            } else {
                navigation.closeCollection({ history: false });
            }
        } finally {
            isRestoring = false;
        }
    };

    document.addEventListener('spaces-history-navigate', () => {
        if (isRestoring) return;
        history.pushState(snapshot(), '', window.location.href);
    });

    document.addEventListener('spaces-account-profile-ready', () => {
        if (!history.state?.key || !history.state.space) {
            history.replaceState(snapshot(), '', window.location.href);
        }
    });

    window.addEventListener('popstate', event => {
        void applyState(event.state);
    });

    replaceCurrentState();
})();
