(() => {
    'use strict';

    const studio = document.querySelector('[data-floor-plan-studio]');
    const frame = studio?.querySelector('[data-floor-plan-studio-frame]');
    const mainContent = document.querySelector('.spaces-main-content');
    const homePage = document.querySelector('[data-home-page]');
    const allSpacesPage = document.querySelector('[data-all-spaces-page]');
    const fab = document.querySelector('[data-sparkles-fab]');
    const RETURN_KEY = 'planner5d-spaces-v2-floor-plan-return';

    if (!studio || !frame || !mainContent) return;

    let returnView = null;
    let closing = false;

    const isOpen = () => !studio.hidden && mainContent.classList.contains('is-floor-plan-studio-page');

    const captureReturnView = () => ({
        homePage: mainContent.classList.contains('is-home-page'),
        allSpacesPage: mainContent.classList.contains('is-all-spaces-page'),
        aiChatsPage: mainContent.classList.contains('is-ai-chats-page'),
        centeredChat: Boolean(homePage?.classList.contains('is-centered-chat')),
        homeHidden: Boolean(homePage?.hidden),
        chatSnapshot: window.SpacesListingChat?.isActive?.()
            ? window.SpacesListingChat.serialize()
            : null
    });

    const storeReturnView = view => {
        try {
            sessionStorage.setItem(RETURN_KEY, JSON.stringify(view || null));
        } catch {
            // Prototype keeps working without persistence.
        }
    };

    const readStoredReturnView = () => {
        try {
            const parsed = JSON.parse(sessionStorage.getItem(RETURN_KEY) || 'null');
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch {
            return null;
        }
    };

    const restoreReturnView = () => {
        const view = returnView || readStoredReturnView();
        storeReturnView(null);
        returnView = null;
        mainContent.classList.remove(
            'is-home-page',
            'is-all-spaces-page',
            'is-ai-chats-page',
            'is-listing-studio-page',
            'is-floor-plan-studio-page'
        );
        const aiChatsPage = document.querySelector('[data-ai-chats-page]');
        if (aiChatsPage) aiChatsPage.hidden = true;

        const restoreChat = () => {
            if (view?.chatSnapshot) {
                window.SpacesListingChat?.restore?.(view.chatSnapshot);
            }
            window.SpacesAiChats?.syncChatHeader?.();
        };

        if (view?.allSpacesPage) {
            mainContent.classList.add('is-all-spaces-page');
            if (homePage) homePage.hidden = true;
            if (allSpacesPage) allSpacesPage.hidden = false;
            restoreChat();
            return;
        }
        if (view?.aiChatsPage) {
            mainContent.classList.add('is-ai-chats-page');
            if (homePage) homePage.hidden = true;
            if (allSpacesPage) allSpacesPage.hidden = true;
            if (aiChatsPage) aiChatsPage.hidden = false;
            restoreChat();
            return;
        }

        mainContent.classList.add('is-home-page');
        document.body.classList.add('is-space-home-page');
        if (homePage) {
            homePage.hidden = false;
            homePage.classList.toggle('is-centered-chat', Boolean(view?.centeredChat ?? true));
        }
        if (allSpacesPage) allSpacesPage.hidden = true;
        restoreChat();
    };

    const editorUrl = (options = {}) => {
        const here = window.location.pathname || '';
        const base = here.includes('/spaces-chat-ai/')
            ? '/spaces-chat-ai/floor-plan-editor/index.html'
            : '/floor-plan-editor/index.html';
        const params = new URLSearchParams({
            from: 'spaces',
            t: String(Date.now())
        });
        if (options.project) params.set('project', options.project);
        return `${base}?${params.toString()}`;
    };

    const open = (options = {}) => {
        window.SpacesListingChat?.prepareOpen?.();
        returnView = captureReturnView();
        storeReturnView(returnView);
        mainContent.classList.remove('is-home-page', 'is-all-spaces-page', 'is-ai-chats-page', 'is-listing-studio-page');
        document.body.classList.remove('is-space-home-page', 'is-listing-studio-open');
        mainContent.classList.add('is-floor-plan-studio-page');
        document.body.classList.add('is-floor-plan-studio-open');
        if (homePage) homePage.hidden = true;
        if (allSpacesPage) allSpacesPage.hidden = true;
        const aiChatsPage = document.querySelector('[data-ai-chats-page]');
        if (aiChatsPage) aiChatsPage.hidden = true;
        const listingStudio = document.querySelector('[data-listing-studio]');
        if (listingStudio) listingStudio.hidden = true;
        studio.hidden = false;
        if (fab) fab.hidden = true;
        window.SpacesPrototypeNavigation?.closeCollection?.({ restoreScroll: false });
        window.SpacesCopilotPanel?.hide?.();
        frame.src = editorUrl(options);
    };

    const close = () => {
        if (closing) return;
        if (!mainContent.classList.contains('is-floor-plan-studio-page') && studio.hidden) return;
        closing = true;
        try {
            studio.hidden = true;
            frame.src = 'about:blank';
            sessionStorage.removeItem(RETURN_KEY);
            document.body.classList.remove('is-floor-plan-studio-open');
            mainContent.classList.remove('is-floor-plan-studio-page');
            restoreReturnView();
        } finally {
            window.setTimeout(() => {
                closing = false;
            }, 0);
        }
    };

    window.addEventListener('message', event => {
        if (event.data?.type !== 'floor-plan-spaces-close') return;
        const fromFrame = frame.contentWindow && event.source === frame.contentWindow;
        if (!fromFrame && !isOpen()) return;
        close();
    });

    document.addEventListener('spaces-navigation-start', () => {
        if (closing) return;
        if (studio.hidden && !mainContent.classList.contains('is-floor-plan-studio-page')) return;
        closing = true;
        studio.hidden = true;
        frame.src = 'about:blank';
        sessionStorage.removeItem(RETURN_KEY);
        storeReturnView(null);
        returnView = null;
        mainContent.classList.remove('is-floor-plan-studio-page');
        document.body.classList.remove('is-floor-plan-studio-open');
        window.setTimeout(() => {
            closing = false;
        }, 0);
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && isOpen()) {
            event.preventDefault();
            close();
        }
    });

    window.SpacesFloorPlanStudio = { open, close, isOpen };
})();
