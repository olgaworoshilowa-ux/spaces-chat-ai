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
    let keepChatAlive = false;

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

    const clearSplitChat = () => {
        document.body.classList.remove('is-floor-plan-with-chat', 'is-floor-plan-chat-collapsed', 'is-editor-with-chat');
        mainContent.classList.remove('is-floor-plan-with-chat', 'is-floor-plan-chat-collapsed', 'is-editor-with-chat');
        homePage?.classList.remove('is-editor-split-chat');
    };

    const setChatCollapsed = collapsed => {
        const on = Boolean(collapsed);
        document.body.classList.toggle('is-floor-plan-chat-collapsed', on);
        mainContent.classList.toggle('is-floor-plan-chat-collapsed', on);
        const collapseBtn = document.querySelector('[data-editor-chat-collapse]');
        if (collapseBtn) {
            collapseBtn.hidden = on;
            collapseBtn.setAttribute('aria-expanded', on ? 'false' : 'true');
        }
        // Never show the floating "Chat" expand chip — AI Mode restores the left chat.
        document.querySelectorAll('[data-editor-chat-expand]').forEach(btn => {
            btn.hidden = true;
        });
    };

    const ensureLeftChat = () => {
        if (!isOpen()) return;
        if (!homePage) return;
        document.body.classList.add('is-floor-plan-with-chat', 'is-editor-with-chat');
        mainContent.classList.add('is-floor-plan-with-chat', 'is-editor-with-chat', 'is-home-page');
        homePage.hidden = false;
        homePage.classList.add('is-centered-chat', 'is-editor-split-chat');
        keepChatAlive = true;
        setChatCollapsed(false);
        window.SpacesAiChats?.syncChatHeader?.();
        window.SpacesListingChat?.showListingDetails?.({ mode: 'plan' });
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
        clearSplitChat();
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
            t: String(Date.now()),
            v: 'history-outside-close-1'
        });
        if (options.project) params.set('project', options.project);
        if (options.withChat) params.set('spacesChat', '1');
        return `${base}?${params.toString()}`;
    };

    const open = (options = {}) => {
        window.SpacesListingChat?.prepareOpen?.();
        const keepChat = options.withChat === true || (
            options.withChat !== false && Boolean(
                window.SpacesListingChat?.isActive?.()
                || homePage?.classList.contains('is-centered-chat')
            )
        );
        keepChatAlive = keepChat;
        returnView = captureReturnView();
        storeReturnView(returnView);
        mainContent.classList.remove('is-home-page', 'is-all-spaces-page', 'is-ai-chats-page', 'is-listing-studio-page');
        document.body.classList.remove('is-space-home-page', 'is-listing-studio-open');
        mainContent.classList.add('is-floor-plan-studio-page');
        document.body.classList.add('is-floor-plan-studio-open');
        if (allSpacesPage) allSpacesPage.hidden = true;
        const aiChatsPage = document.querySelector('[data-ai-chats-page]');
        if (aiChatsPage) aiChatsPage.hidden = true;
        const listingStudio = document.querySelector('[data-listing-studio]');
        if (listingStudio) listingStudio.hidden = true;
        studio.hidden = false;
        if (fab) fab.hidden = true;
        window.SpacesPrototypeNavigation?.closeCollection?.({ restoreScroll: false });
        window.SpacesCopilotPanel?.hide?.();

        if (keepChat && homePage) {
            document.body.classList.add('is-floor-plan-with-chat', 'is-editor-with-chat');
            mainContent.classList.add('is-floor-plan-with-chat', 'is-editor-with-chat');
            homePage.hidden = false;
            homePage.classList.add('is-centered-chat', 'is-editor-split-chat');
            mainContent.classList.add('is-home-page');
            window.SpacesAiChats?.syncChatHeader?.();
            window.SpacesAiChats?.markFloorPlanContext?.();
            const collapseBtn = document.querySelector('[data-editor-chat-collapse]');
            if (collapseBtn) collapseBtn.hidden = false;
            setChatCollapsed(false);
            // Replace full chat thread with details accordion (same pattern as listing).
            window.SpacesListingChat?.showListingDetails?.({ mode: 'plan' });
            window.setTimeout(() => {
                homePage.querySelector('[data-listing-details-body]')?.scrollTo?.({ top: 0 });
            }, 0);
        } else {
            clearSplitChat();
            if (homePage) homePage.hidden = true;
            window.SpacesListingChat?.hideListingDetails?.();
        }

        frame.src = editorUrl({ ...options, withChat: keepChat });
    };

    const close = () => {
        if (closing) return;
        if (!mainContent.classList.contains('is-floor-plan-studio-page') && studio.hidden) return;
        closing = true;
        try {
            const kept = keepChatAlive;
            studio.hidden = true;
            frame.src = 'about:blank';
            sessionStorage.removeItem(RETURN_KEY);
            document.body.classList.remove('is-floor-plan-studio-open');
            mainContent.classList.remove('is-floor-plan-studio-page');
            if (kept) {
                keepChatAlive = false;
                clearSplitChat();
                window.SpacesListingChat?.hideListingDetails?.();
                mainContent.classList.add('is-home-page');
                document.body.classList.add('is-space-home-page');
                if (homePage) {
                    homePage.hidden = false;
                    homePage.classList.add('is-centered-chat');
                }
                if (allSpacesPage) allSpacesPage.hidden = true;
                storeReturnView(null);
                returnView = null;
                window.SpacesAiChats?.syncChatHeader?.();
                return;
            }
            clearSplitChat();
            window.SpacesListingChat?.hideListingDetails?.();
            restoreReturnView();
        } finally {
            window.setTimeout(() => {
                closing = false;
            }, 0);
        }
    };

    window.addEventListener('message', event => {
        const fromFrame = frame.contentWindow && event.source === frame.contentWindow;
        if (event.data?.type === 'floor-plan-spaces-chat-open') {
            if (!fromFrame && !isOpen()) return;
            ensureLeftChat();
            return;
        }
        if (event.data?.type === 'floor-plan-spaces-pointer') {
            window.SpacesAiChats?.closeEditorHistory?.();
            return;
        }
        if (event.data?.type !== 'floor-plan-spaces-close') return;
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
        keepChatAlive = false;
        mainContent.classList.remove('is-floor-plan-studio-page');
        document.body.classList.remove('is-floor-plan-studio-open');
        clearSplitChat();
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

    document.querySelector('[data-editor-chat-new]')?.addEventListener('click', event => {
        event.preventDefault();
        // Floor-plan split: + is visual only (Figma), does not start a new chat.
        if (document.body.classList.contains('is-floor-plan-with-chat') || isOpen()) return;
        window.SpacesListingStudio?.close?.();
        window.SpacesAiChats?.startNew?.();
    });

    document.querySelector('[data-editor-chat-collapse]')?.addEventListener('click', event => {
        event.preventDefault();
        if (!document.body.classList.contains('is-editor-with-chat')) return;
        setChatCollapsed(true);
    });

    document.querySelectorAll('[data-editor-chat-expand]').forEach(btn => {
        btn.addEventListener('click', event => {
            event.preventDefault();
            // Floating Chat chip removed — keep as invisible no-op.
        });
        btn.hidden = true;
    });

    window.SpacesFloorPlanStudio = { open, close, isOpen, setChatCollapsed, ensureLeftChat };
})();