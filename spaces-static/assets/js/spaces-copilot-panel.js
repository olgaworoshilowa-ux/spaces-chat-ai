(() => {
    'use strict';

    const panel = document.querySelector('[data-copilot-panel]');
    const fab = document.querySelector('[data-sparkles-fab]');
    const newButton = panel?.querySelector('[data-copilot-new]');
    const layoutWrap = panel?.querySelector('[data-copilot-layout]');
    const layoutMenu = panel?.querySelector('[data-copilot-layout-menu]');
    const closeButton = panel?.querySelector('[data-copilot-close]');
    const collapseButton = panel?.querySelector('[data-copilot-collapse]');
    const expandButton = panel?.querySelector('[data-copilot-expand]');
    const empty = panel?.querySelector('[data-copilot-empty]');
    const thread = panel?.querySelector('[data-copilot-thread]');
    const form = panel?.querySelector('[data-copilot-composer]');
    const input = panel?.querySelector('[data-copilot-input]');
    const placeholder = panel?.querySelector('[data-copilot-placeholder]');
    const modeButton = panel?.querySelector('[data-copilot-mode]');
    const modeValue = panel?.querySelector('[data-copilot-mode-value]');
    const modeMenu = panel?.querySelector('[data-copilot-mode-menu]');
    const sendButton = panel?.querySelector('[data-copilot-send]');
    const sendIcon = panel?.querySelector('[data-copilot-send-icon]');
    const attachButton = panel?.querySelector('[data-copilot-attach]');
    const fileInput = panel?.querySelector('[data-copilot-file]');
    const scopeButton = panel?.querySelector('[data-copilot-scope]');
    const scopeIcon = panel?.querySelector('[data-copilot-scope-icon]');
    const scopeLabel = panel?.querySelector('[data-copilot-scope-label]');
    const scopeMenu = panel?.querySelector('[data-copilot-scope-menu]');
    const voiceSrc = './assets/images/spaces-v2/home-composer/voice.svg';
    const sendSrc = './assets/images/spaces-v2/home-composer/send.svg';
    const allSpacesIcon = './assets/images/spaces-v2/home-composer/space.svg';
    const checkIcon = './assets/images/sidebar/dropdown-check.svg';
    const modeStorageKey = 'planner5d-spaces-v2-home-composer-mode';
    const scopeStorageKey = 'planner5d-spaces-v2-home-composer-scope';
    let selectedMode = 'Lite';
    let selectedScopeId = 'all';
    let spaces = [];

    if (!panel) return;

    const isOpen = () => !panel.hidden;

    const syncPlaceholder = () => {
        if (placeholder) placeholder.hidden = Boolean(input?.value.trim());
        const ready = Boolean(input?.value.trim());
        sendButton?.classList.toggle('is-ready', ready);
        if (sendButton) {
            sendButton.type = ready ? 'submit' : 'button';
            sendButton.setAttribute('aria-label', ready ? 'Send' : 'Voice');
        }
        if (sendIcon) sendIcon.src = ready ? sendSrc : voiceSrc;
    };

    const setMode = mode => {
        selectedMode = mode === 'Pro' ? 'Pro' : 'Lite';
        if (modeValue) modeValue.textContent = selectedMode;
        modeButton?.setAttribute('aria-label', `Mode: ${selectedMode}`);
        panel.querySelectorAll('[data-copilot-mode-option]').forEach(option => {
            const selected = option.dataset.copilotModeOption === selectedMode;
            option.classList.toggle('is-selected', selected);
            option.setAttribute('aria-selected', String(selected));
        });
        try {
            localStorage.setItem(modeStorageKey, selectedMode);
        } catch {
            // The standalone lab continues without persisted preferences.
        }
    };

    const closeMode = () => {
        if (!modeMenu) return;
        modeMenu.hidden = true;
        modeButton?.setAttribute('aria-expanded', 'false');
    };

    const closeScope = () => {
        if (!scopeMenu) return;
        scopeMenu.hidden = true;
        scopeButton?.setAttribute('aria-expanded', 'false');
    };

    const spaceInitial = space => {
        const initial = document.createElement('span');
        initial.className = 'spaces-home-space-initial';
        initial.setAttribute('aria-hidden', 'true');
        initial.textContent = space?.initial || String(space?.title || 'S').slice(0, 1).toUpperCase();
        if (space?.avatarColor) initial.style.backgroundColor = space.avatarColor;
        return initial;
    };

    const setScopeIcon = space => {
        if (!scopeIcon) return;
        scopeIcon.replaceChildren();
        if (!space) {
            const image = document.createElement('img');
            image.src = allSpacesIcon;
            image.width = 24;
            image.height = 24;
            image.alt = '';
            image.setAttribute('aria-hidden', 'true');
            scopeIcon.append(image);
            return;
        }
        scopeIcon.append(spaceInitial(space));
    };

    const applyScope = (scopeId, options = {}) => {
        const space = spaces.find(item => String(item.id) === String(scopeId));
        selectedScopeId = space ? String(space.id) : 'all';
        const label = space?.title || 'All spaces';
        if (scopeLabel) scopeLabel.textContent = label;
        scopeButton?.setAttribute('aria-label', label);
        setScopeIcon(space || null);
        if (options.persist !== false) {
            try {
                localStorage.setItem(scopeStorageKey, selectedScopeId);
            } catch {
                // The standalone lab continues without persisted preferences.
            }
        }
        renderScopeMenu();
    };

    const renderScopeMenu = () => {
        if (!scopeMenu) return;
        const options = [{ id: 'all', title: 'All spaces' }, ...spaces];
        scopeMenu.replaceChildren(...options.map(option => {
            const isSelected = String(selectedScopeId) === String(option.id);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'spaces-home-composer-scope-option';
            button.setAttribute('role', 'option');
            button.setAttribute('aria-selected', String(isSelected));
            button.classList.toggle('is-selected', isSelected);
            if (option.id === 'all') {
                const icon = document.createElement('img');
                icon.src = allSpacesIcon;
                icon.width = 20;
                icon.height = 20;
                icon.alt = '';
                icon.setAttribute('aria-hidden', 'true');
                button.append(icon);
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
                applyScope(option.id);
                closeScope();
                input?.focus();
            });
            return button;
        }));
    };

    const fillComposer = text => {
        if (!input) return;
        input.value = String(text || '');
        input.style.height = 'auto';
        input.style.height = `${Math.max(20, input.scrollHeight)}px`;
        syncPlaceholder();
        input.focus();
    };

    const appendMessage = (role, text) => {
        if (!thread) return;
        const bubble = document.createElement('p');
        bubble.className = `spaces-copilot-message is-${role}`;
        bubble.textContent = text;
        thread.append(bubble);
        thread.hidden = false;
        if (empty) empty.hidden = true;
        thread.scrollTop = thread.scrollHeight;
    };

    const isListingJob = text => String(text || '').trim().toLowerCase() === 'turn this home into a listing';
    const isFurnishJob = text => /furnish/i.test(String(text || ''));

    const clearComposer = () => {
        if (!input) return;
        input.value = '';
        input.style.height = 'auto';
        syncPlaceholder();
    };

    const isHomeOpen = () => {
        const homePage = document.querySelector('[data-home-page]');
        return Boolean(homePage && !homePage.hidden) || document.body.classList.contains('is-space-home-page');
    };

    const fillHomeComposer = (text, options = {}) => {
        hidePanel();
        const homeInput = document.querySelector('[data-home-composer-input]');
        const homeForm = document.querySelector('[data-home-composer]');
        if (!homeInput) return false;
        if (text) {
            homeInput.value = String(text);
            homeInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        homeInput.focus();
        if (options.send && text) homeForm?.requestSubmit();
        return true;
    };

    const sendMessage = text => {
        const value = String(text || '').trim();
        if (!value) return;
        if (isHomeOpen() && !window.SpacesListingChat?.isActive?.()) {
            if (isListingJob(value)) {
                window.SpacesListingChat?.start({ surface: 'home' });
                return;
            }
            fillHomeComposer(value, { send: true });
            return;
        }
        // FAB chat always stays in the side panel — never expand to full-screen Home.
        if (window.SpacesListingChat?.isActive?.()) {
            if (window.SpacesListingChat.send(value)) {
                clearComposer();
                return;
            }
        }
        if (isListingJob(value)) {
            clearComposer();
            window.SpacesListingChat?.start({ surface: 'panel' });
            return;
        }
        if (isFurnishJob(value)) {
            clearComposer();
            window.SpacesListingChat?.startFurnish(value, { surface: 'panel' });
            return;
        }
        appendMessage('user', value);
        clearComposer();
        window.setTimeout(() => {
            appendMessage('assistant', `I’ll help with “${value}”. Attach a floor plan or pick a space to continue.`);
        }, 280);
    };

    const ask = text => {
        const value = String(text || '').trim();
        if (!value) return;
        if (isHomeOpen()) {
            if (isListingJob(value)) {
                window.SpacesListingChat?.start({ surface: 'home' });
                return;
            }
            fillHomeComposer(value);
            return;
        }
        open();
        if (isListingJob(value)) {
            clearComposer();
            window.SpacesListingChat?.start({ surface: 'panel' });
            return;
        }
        if (isFurnishJob(value)) {
            clearComposer();
            window.SpacesListingChat?.startFurnish(value, { surface: 'panel' });
            return;
        }
        fillComposer(value);
    };

    const open = () => {
        if (isHomeOpen() && !document.body.classList.contains('is-new-chat-placement-option4')) {
            hidePanel();
            document.querySelector('[data-home-composer-input]')?.focus();
            return;
        }
        panel.hidden = false;
        document.body.classList.add('is-copilot-panel-open');
        closeButton?.classList.remove('is-active');
        fab?.setAttribute('aria-expanded', 'true');
        input?.focus();
    };

    const startNewChat = () => {
        if (window.SpacesListingChat?.isActive?.()) {
            window.SpacesListingChat.end();
        }
        if (thread) {
            thread.replaceChildren();
            thread.hidden = true;
        }
        const dock = panel.querySelector('[data-copilot-widget-dock]');
        if (dock) {
            dock.replaceChildren();
            dock.hidden = true;
        }
        if (empty) empty.hidden = false;
        clearComposer();
        closeMode();
        closeScope();
        input?.focus();
    };

    const hidePanel = () => {
        panel.hidden = true;
        document.body.classList.remove('is-copilot-panel-open');
        closeButton?.classList.remove('is-active');
        layoutWrap?.classList.remove('is-open');
        closeButton?.setAttribute('aria-expanded', 'false');
        fab?.setAttribute('aria-expanded', 'false');
        closeMode();
        closeScope();
        window.requestAnimationFrame(() => closeButton?.classList.remove('is-active'));
    };

    const close = () => {
        if (window.SpacesListingChat?.isActive?.()) {
            window.SpacesAiChats?.captureCurrent?.();
            window.SpacesListingChat.end();
        }
        hidePanel();
    };

    const expandToPage = () => {
        layoutWrap?.classList.remove('is-open');
        closeButton?.setAttribute('aria-expanded', 'false');
        if (window.SpacesListingChat?.isActive?.()) {
            window.SpacesListingChat.expandToHome();
            return;
        }
        const messages = [...(thread?.querySelectorAll('.spaces-copilot-message') || [])].map(node => ({
            role: node.classList.contains('is-user') ? 'user' : 'assistant',
            text: node.textContent.trim()
        })).filter(item => item.text);
        hidePanel();
        if (!messages.length) {
            window.SpacesAiChats?.startNew?.();
            const home = document.querySelector('[data-home-page]');
            home?.classList.remove('is-centered-chat');
            const homeThread = home?.querySelector('[data-home-thread]');
            if (homeThread) {
                homeThread.replaceChildren();
                homeThread.hidden = true;
            }
            window.SpacesSidebarNavigation?.selectHome({ history: true });
            document.querySelector('[data-home-composer-input]')?.focus();
            return;
        }
        window.SpacesSidebarNavigation?.selectHome({ history: true });
        const home = document.querySelector('[data-home-page]');
        const homeThread = home?.querySelector('[data-home-thread]');
        if (!home || !homeThread) return;
        home.classList.add('is-centered-chat');
        const lastUser = [...messages].reverse().find(item => item.role === 'user');
        if (lastUser) window.SpacesListingChat?.startGeneric?.(lastUser.text);
        else {
            homeThread.hidden = false;
            homeThread.replaceChildren(...messages.map(item => {
                const bubble = document.createElement('div');
                bubble.className = `spaces-home-message is-${item.role}`;
                const body = document.createElement('p');
                body.textContent = item.text;
                bubble.append(body);
                return bubble;
            }));
            window.SpacesAiChats?.syncChatHeader?.();
        }
    };

    const toggle = () => {
        if (isOpen()) close();
        else open();
    };

    try {
        selectedMode = localStorage.getItem(modeStorageKey) === 'Pro' ? 'Pro' : 'Lite';
    } catch {
        selectedMode = 'Lite';
    }
    setMode(selectedMode);
    syncPlaceholder();

    fab?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        toggle();
    });

    newButton?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        startNewChat();
    });

    closeButton?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const shouldOpen = !layoutWrap?.classList.contains('is-open');
        layoutWrap?.classList.toggle('is-open', shouldOpen);
        closeButton.setAttribute('aria-expanded', String(shouldOpen));
    }, true);

    collapseButton?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        close();
    }, true);

    expandButton?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        expandToPage();
    }, true);

    modeButton?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        if (!modeMenu) return;
        closeScope();
        const shouldOpen = modeMenu.hidden;
        modeMenu.hidden = !shouldOpen;
        modeButton.setAttribute('aria-expanded', String(shouldOpen));
    });

    scopeButton?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        if (!scopeMenu) return;
        closeMode();
        const shouldOpen = scopeMenu.hidden;
        if (shouldOpen) renderScopeMenu();
        scopeMenu.hidden = !shouldOpen;
        scopeButton.setAttribute('aria-expanded', String(shouldOpen));
    });

    panel.querySelectorAll('[data-copilot-mode-option]').forEach(option => {
        option.addEventListener('click', () => {
            setMode(option.dataset.copilotModeOption);
            closeMode();
        });
    });

    panel.querySelectorAll('[data-copilot-suggestion]').forEach(button => {
        button.addEventListener('click', () => {
            ask(button.dataset.copilotSuggestion || button.textContent.trim());
        });
    });

    placeholder?.addEventListener('click', () => input?.focus());

    attachButton?.addEventListener('click', () => fileInput?.click());

    input?.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = `${Math.max(20, input.scrollHeight)}px`;
        syncPlaceholder();
    });

    input?.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (input.value.trim()) sendMessage(input.value);
        }
    });

    form?.addEventListener('submit', event => {
        event.preventDefault();
        sendMessage(input?.value);
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || !isOpen()) return;
        if (modeMenu && !modeMenu.hidden) {
            closeMode();
            return;
        }
        if (scopeMenu && !scopeMenu.hidden) {
            closeScope();
            return;
        }
        close();
    });

    document.addEventListener('click', event => {
        const inMode = event.target.closest('[data-copilot-mode], [data-copilot-mode-menu]');
        const inScope = event.target.closest('[data-copilot-scope], [data-copilot-scope-menu]');
        const inLayout = event.target.closest('[data-copilot-layout]');
        if (!inMode) closeMode();
        if (!inScope) closeScope();
        if (!inLayout) {
            layoutWrap?.classList.remove('is-open');
            closeButton?.setAttribute('aria-expanded', 'false');
        }
    });

    const loadAccount = account => {
        spaces = Array.isArray(account?.spaces) ? account.spaces : [];
        try {
            applyScope(localStorage.getItem(scopeStorageKey) || 'all', { persist: false });
        } catch {
            applyScope('all', { persist: false });
        }
    };

    document.addEventListener('spaces-account-profile-ready', event => {
        loadAccount(event.detail?.account);
    });

    if (window.SpacesAccountData?.load) {
        window.SpacesAccountData.load().then(loadAccount).catch(() => applyScope('all', { persist: false }));
    } else {
        applyScope('all', { persist: false });
    }

    window.SpacesCopilotPanel = { open, close, hide: hidePanel, toggle, ask, send: sendMessage, expand: expandToPage };
})();
