(() => {
    'use strict';

    const home = document.querySelector('[data-home-page]');
    const form = home?.querySelector('[data-home-composer]');
    const input = home?.querySelector('[data-home-composer-input]');
    const placeholder = home?.querySelector('[data-home-composer-placeholder]');
    const chips = home?.querySelector('[data-home-composer-chips]');
    const modeButton = home?.querySelector('[data-home-composer-mode]');
    const modeValue = home?.querySelector('[data-home-composer-mode-value]');
    const modeMenu = home?.querySelector('[data-home-composer-mode-menu]');
    const scopeButton = home?.querySelector('[data-home-composer-scope]');
    const scopeIcon = home?.querySelector('[data-home-composer-scope-icon]');
    const scopeLabel = home?.querySelector('[data-home-composer-scope-label]');
    const scopeMenu = home?.querySelector('[data-home-composer-scope-menu]');
    const scopeClear = home?.querySelector('[data-home-composer-scope-clear]');
    const attachButton = home?.querySelector('[data-home-composer-attach]');
    const attachMenu = home?.querySelector('[data-home-composer-attach-menu]');
    const attachList = home?.querySelector('[data-home-composer-attach-list]');
    const attachSearch = home?.querySelector('[data-home-composer-attach-search]');
    const uploadInput = home?.querySelector('[data-home-composer-file]');
    const sendButton = home?.querySelector('[data-home-composer-send]');
    const sendIcon = home?.querySelector('[data-home-composer-send-icon]');
    const voiceIconSrc = '/spaces-static/assets/images/spaces-v2/home-composer/voice.svg';
    const sendIconSrc = '/spaces-static/assets/images/spaces-v2/home-composer/send.svg';
    const checkIcon = '/spaces-static/assets/images/sidebar/dropdown-check.svg';
    const fallbackPreview = '/spaces-static/assets/images/spaces-v2/collection-preview.png';
    const scopeStorageKey = 'planner5d-spaces-v2-home-composer-scope';
    const modeStorageKey = 'planner5d-spaces-v2-home-composer-mode';
    const modes = ['Lite', 'Pro'];
    let spaces = [];
    let files = [];
    let attachments = [];
    let selectedScopeId = 'all';
    let selectedMode = 'Lite';
    let mentionActive = false;

    if (!home || !form || !input) return;

    const normalize = value => String(value || '').trim().toLowerCase();

    const syncPlaceholder = () => {
        if (placeholder) placeholder.hidden = Boolean(input.value.trim()) || attachments.length > 0;
        syncSend();
    };

    const canSend = () => Boolean(input.value.trim()) || attachments.length > 0;

    const syncSend = () => {
        if (!sendButton) return;
        const ready = canSend();
        sendButton.classList.toggle('is-ready', ready);
        sendButton.type = ready ? 'submit' : 'button';
        sendButton.setAttribute('aria-label', ready ? 'Send' : 'Voice');
        if (sendIcon) sendIcon.src = ready ? sendIconSrc : voiceIconSrc;
    };

    const resizeInput = () => {
        input.style.height = 'auto';
        input.style.height = `${Math.max(24, input.scrollHeight)}px`;
    };

    const readStoredScope = () => {
        try {
            return localStorage.getItem(scopeStorageKey) || 'all';
        } catch {
            return 'all';
        }
    };

    const persistScope = value => {
        try {
            localStorage.setItem(scopeStorageKey, value);
        } catch {
            // The standalone lab continues without persisted preferences.
        }
    };

    const isChatUiOption1 = () => document.body.classList.contains('is-chat-ui-option1');

    const syncOption1Copy = () => {
        const space = selectedScopeId !== 'all' ? spaceById(selectedScopeId) : null;
        const name = space?.title || 'My Home';
        home.querySelectorAll('[data-home-option1-space-name]').forEach(node => {
            node.textContent = name;
        });
        home.querySelectorAll('[data-home-option1-with]').forEach(node => {
            node.hidden = !space;
        });
        if (scopeClear) scopeClear.hidden = !(isChatUiOption1() && space);
    };

    const spaceById = spaceId => spaces.find(space => String(space.id) === String(spaceId));

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
            scopeIcon.append(emptySpaceIcon());
            return;
        }
        scopeIcon.append(spaceInitial(space));
    };

    const emptySpaceIcon = () => {
        const icon = document.createElement('span');
        icon.className = 'spaces-no-space-icon';
        icon.setAttribute('aria-hidden', 'true');
        return icon;
    };

    const closeScopeMenu = () => {
        if (!scopeMenu || scopeMenu.hidden) return;
        scopeMenu.hidden = true;
        scopeButton?.setAttribute('aria-expanded', 'false');
    };

    const closeModeMenu = () => {
        if (!modeMenu || modeMenu.hidden) return;
        modeMenu.hidden = true;
        modeButton?.setAttribute('aria-expanded', 'false');
    };

    const persistMode = value => {
        try {
            localStorage.setItem(modeStorageKey, value);
        } catch {
            // The standalone lab continues without persisted preferences.
        }
    };

    const applyMode = (mode, options = {}) => {
        selectedMode = modes.includes(mode) ? mode : 'Lite';
        if (modeValue) modeValue.textContent = selectedMode;
        modeButton?.setAttribute('aria-label', `Mode: ${selectedMode}`);
        modeMenu?.querySelectorAll('[data-home-composer-mode-option]').forEach(option => {
            const isSelected = option.dataset.homeComposerModeOption === selectedMode;
            option.classList.toggle('is-selected', isSelected);
            option.setAttribute('aria-selected', String(isSelected));
        });
        if (options.persist !== false) persistMode(selectedMode);
        document.dispatchEvent(new CustomEvent('spaces-home-composer-mode-changed', {
            detail: { mode: selectedMode }
        }));
    };

    const openModeMenu = () => {
        if (!modeMenu) return;
        closeScopeMenu();
        closeAttachMenu();
        modeMenu.hidden = false;
        modeButton?.setAttribute('aria-expanded', 'true');
    };

    const closeAttachMenu = () => {
        if (!attachMenu || attachMenu.hidden) return;
        attachMenu.hidden = true;
        attachButton?.setAttribute('aria-expanded', 'false');
        mentionActive = false;
        if (attachSearch) attachSearch.value = '';
    };

    const scopedFiles = () => {
        const currentFiles = selectedScopeId === 'all'
            ? files
            : files.filter(file => String(file.spaceId) === String(selectedScopeId));
        return [...currentFiles].sort((first, second) => {
            const firstDate = new Date(String(first.udate || first.cdate || '').replace(' ', 'T')).getTime() || 0;
            const secondDate = new Date(String(second.udate || second.cdate || '').replace(' ', 'T')).getTime() || 0;
            return secondDate - firstDate;
        });
    };

    const fileMatchesQuery = (file, query) => {
        if (!query) return true;
        const space = spaceById(file.spaceId);
        return normalize(`${file.title} ${file.type} ${space?.title || ''}`).includes(query);
    };

    const mentionQuery = () => {
        const start = input.selectionStart ?? input.value.length;
        const before = input.value.slice(0, start);
        const match = before.match(/@([^\s@]*)$/);
        return match ? match[1] : null;
    };

    const clearMention = () => {
        const start = input.selectionStart ?? input.value.length;
        const before = input.value.slice(0, start);
        const after = input.value.slice(start);
        const nextBefore = before.replace(/@([^\s@]*)$/, '');
        input.value = `${nextBefore}${after}`;
        const cursor = nextBefore.length;
        input.setSelectionRange(cursor, cursor);
        resizeInput();
        syncPlaceholder();
    };

    const isAttached = id => attachments.some(item => String(item.id) === String(id));

    const renderChips = () => {
        if (!chips) return;
        chips.hidden = attachments.length === 0;
        chips.replaceChildren(...attachments.map(item => {
            const chip = document.createElement('span');
            chip.className = 'spaces-home-composer-chip';
            const preview = document.createElement('span');
            preview.className = 'spaces-home-composer-chip-preview';
            if (item.previewUrl) {
                const image = document.createElement('img');
                image.src = item.previewUrl;
                image.alt = '';
                image.width = 16;
                image.height = 16;
                image.onerror = () => {
                    image.onerror = null;
                    image.src = fallbackPreview;
                };
                preview.append(image);
            } else {
                preview.append(spaceInitial(spaceById(item.spaceId) || { title: item.title, initial: item.title.slice(0, 1) }));
            }
            const copy = document.createElement('span');
            copy.className = 'spaces-home-composer-chip-copy';
            const title = document.createElement('span');
            title.className = 'spaces-home-composer-chip-title';
            title.textContent = item.title;
            copy.append(title);
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'spaces-home-composer-chip-remove';
            remove.setAttribute('aria-label', `Remove ${item.title}`);
            remove.textContent = '×';
            remove.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                attachments = attachments.filter(attached => attached.id !== item.id);
                renderChips();
                renderAttachList();
                syncPlaceholder();
            });
            chip.append(preview, copy, remove);
            return chip;
        }));
        syncPlaceholder();
    };

    const attachItem = item => {
        if (!item?.id || isAttached(item.id)) return;
        attachments = [...attachments, item];
        if (mentionActive) clearMention();
        renderChips();
        renderAttachList();
        closeAttachMenu();
        input.focus();
    };

    const fileToAttachment = file => {
        const space = spaceById(file.spaceId);
        return {
            id: String(file.id),
            title: file.title,
            type: file.type,
            spaceId: String(file.spaceId || ''),
            spaceTitle: space?.title || '',
            previewUrl: file.previewUrl || fallbackPreview
        };
    };

    const renderAttachList = () => {
        if (!attachList) return;
        const query = normalize(attachSearch?.value || '');
        const visibleFiles = scopedFiles().filter(file => fileMatchesQuery(file, query));
        if (!visibleFiles.length) {
            const empty = document.createElement('p');
            empty.className = 'spaces-home-composer-attach-empty';
            empty.textContent = selectedScopeId === 'all'
                ? 'No files in your spaces yet'
                : 'No files in this space yet';
            attachList.replaceChildren(empty);
            return;
        }

        attachList.replaceChildren(...visibleFiles.map(file => {
            const space = spaceById(file.spaceId);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'spaces-home-composer-attach-item';
            button.classList.toggle('is-attached', isAttached(file.id));
            const thumb = document.createElement('span');
            thumb.className = 'spaces-home-composer-attach-thumb';
            const image = document.createElement('img');
            image.src = file.previewUrl || fallbackPreview;
            image.alt = '';
            image.width = 32;
            image.height = 32;
            image.onerror = () => {
                image.onerror = null;
                image.src = fallbackPreview;
            };
            thumb.append(image);
            const copy = document.createElement('span');
            copy.className = 'spaces-home-composer-attach-copy';
            const title = document.createElement('span');
            title.className = 'spaces-home-composer-attach-title';
            title.textContent = file.title;
            const meta = document.createElement('span');
            meta.className = 'spaces-home-composer-attach-meta';
            meta.textContent = [file.type, selectedScopeId === 'all' ? space?.title : '']
                .filter(Boolean)
                .join(' · ');
            copy.append(title, meta);
            button.append(thumb, copy);
            button.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                attachItem(fileToAttachment(file));
            });
            return button;
        }));
    };

    const openAttachMenu = (options = {}) => {
        if (!attachMenu) return;
        closeScopeMenu();
        closeModeMenu();
        mentionActive = Boolean(options.mention);
        if (attachSearch && !mentionActive) attachSearch.value = options.query || '';
        if (attachSearch && mentionActive) attachSearch.value = options.query || '';
        renderAttachList();
        attachMenu.hidden = false;
        attachButton?.setAttribute('aria-expanded', 'true');
        if (!mentionActive) attachSearch?.focus();
    };

    const applyScope = (scopeId, options = {}) => {
        const nextId = String(scopeId || 'all');
        const space = spaces.find(item => String(item.id) === nextId);
        selectedScopeId = space ? String(space.id) : 'all';
        const label = space?.title || 'No space';
        if (scopeLabel) scopeLabel.textContent = label;
        scopeButton?.setAttribute('aria-label', label);
        setScopeIcon(space || null);
        if (options.persist !== false) persistScope(selectedScopeId);
        renderScopeMenu();
        renderAttachList();
        document.dispatchEvent(new CustomEvent('spaces-home-composer-scope-changed', {
            detail: { scopeId: selectedScopeId, space: space || null }
        }));
        syncOption1Copy();
    };

    const isChatStarted = () => home.classList.contains('is-centered-chat');

    const syncScopeLock = () => {
        const locked = isChatStarted();
        closeScopeMenu();
        if (scopeButton) {
            scopeButton.disabled = locked;
            scopeButton.setAttribute('aria-disabled', String(locked));
            if (locked) scopeButton.setAttribute('aria-expanded', 'false');
        }
        if (locked && scopeClear) scopeClear.hidden = true;
        else syncOption1Copy();
    };

    const openScopeMenu = () => {
        if (!scopeMenu || isChatStarted()) return;
        closeAttachMenu();
        closeModeMenu();
        renderScopeMenu();
        scopeMenu.hidden = false;
        scopeButton?.setAttribute('aria-expanded', 'true');
    };

    const renderScopeMenu = () => {
        if (!scopeMenu) return;
        const options = [
            { id: 'all', title: 'No space' },
            ...spaces
        ];
        scopeMenu.replaceChildren(...options.map(option => {
            const isAll = option.id === 'all';
            const isSelected = String(selectedScopeId) === String(option.id);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'spaces-home-composer-scope-option';
            button.setAttribute('role', 'option');
            button.dataset.homeComposerScopeOption = String(option.id);
            button.setAttribute('aria-selected', String(isSelected));
            button.classList.toggle('is-selected', isSelected);

            if (isAll) {
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
                applyScope(option.id);
                closeScopeMenu();
                input.focus();
            });
            return button;
        }));
    };

    const loadAccount = account => {
        spaces = Array.isArray(account?.spaces) ? account.spaces : [];
        files = Array.isArray(account?.files) ? account.files : [];
        applyScope(readStoredScope(), { persist: false });
    };

    input.addEventListener('input', () => {
        syncPlaceholder();
        resizeInput();
        const query = mentionQuery();
        if (query === null) {
            if (mentionActive) closeAttachMenu();
            return;
        }
        openAttachMenu({ mention: true, query });
    });
    input.addEventListener('keydown', event => {
        if (event.key !== 'Enter' || event.shiftKey) return;
        if (!canSend()) return;
        event.preventDefault();
        form.requestSubmit();
    });
    placeholder?.addEventListener('click', () => input.focus());

    home.querySelectorAll('[data-home-composer-suggestion]').forEach(button => {
        button.addEventListener('click', () => {
            const text = button.dataset.homeComposerSuggestion || button.textContent.trim();
            // Suggestions only fill the composer. The user sends when ready.
            input.value = String(text || '').trim();
            syncPlaceholder();
            resizeInput();
            input.focus();
            // Move caret to the end so the user can edit before sending.
            const length = input.value.length;
            input.setSelectionRange?.(length, length);
        });
    });

    modeButton?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        if (modeMenu?.hidden === false) closeModeMenu();
        else openModeMenu();
    });

    modeMenu?.querySelectorAll('[data-home-composer-mode-option]').forEach(option => {
        option.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            applyMode(option.dataset.homeComposerModeOption);
            closeModeMenu();
            input.focus();
        });
    });

    scopeButton?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        if (isChatStarted()) return;
        if (event.target.closest('[data-home-composer-scope-clear]')) {
            applyScope('all');
            closeScopeMenu();
            input.focus();
            return;
        }
        if (scopeMenu?.hidden === false) closeScopeMenu();
        else openScopeMenu();
    });

    document.addEventListener('spaces-chat-ui-changed', syncOption1Copy);

    attachButton?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        if (attachMenu?.hidden === false) closeAttachMenu();
        else openAttachMenu();
    });

    attachSearch?.addEventListener('input', renderAttachList);
    attachSearch?.addEventListener('click', event => event.stopPropagation());

    uploadInput?.addEventListener('change', event => {
        const file = event.target.files?.[0];
        if (!file) return;
        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
        attachItem({
            id: `upload-${file.name}-${file.size}-${file.lastModified}`,
            title: file.name,
            type: 'Uploaded file',
            spaceId: '',
            spaceTitle: 'Computer',
            previewUrl
        });
        uploadInput.value = '';
    });

    document.addEventListener('click', event => {
        const inScope = scopeButton?.contains(event.target) || scopeMenu?.contains(event.target);
        const inAttach = attachButton?.contains(event.target)
            || attachMenu?.contains(event.target);
        const inMode = modeButton?.contains(event.target) || modeMenu?.contains(event.target);
        if (!inScope) closeScopeMenu();
        if (!inAttach) closeAttachMenu();
        if (!inMode) closeModeMenu();
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        closeScopeMenu();
        closeAttachMenu();
        closeModeMenu();
    });

    form.addEventListener('submit', event => {
        event.preventDefault();
        const text = input.value.trim();
        document.dispatchEvent(new CustomEvent('spaces-home-composer-submit', {
            detail: { text },
            cancelable: true
        }));
    });

    document.addEventListener('spaces-account-profile-ready', event => {
        loadAccount(event.detail?.account);
    });

    if (window.SpacesAccountData?.load) {
        window.SpacesAccountData.load().then(loadAccount).catch(() => {
            spaces = [];
            files = [];
            applyScope('all', { persist: false });
        });
    } else {
        applyScope('all', { persist: false });
    }

    try {
        applyMode(localStorage.getItem(modeStorageKey) || 'Lite', { persist: false });
    } catch {
        applyMode('Lite', { persist: false });
    }

    syncPlaceholder();

    new MutationObserver(syncScopeLock).observe(home, { attributes: true, attributeFilter: ['class'] });
    syncScopeLock();

    window.SpacesHomeComposer = {
        getAttachments() {
            return attachments.map(item => ({ ...item }));
        },
        addToNewChat(file) {
            if (!file) return;
            window.SpacesAiChats?.startNew?.();
            if (file.spaceId) applyScope(file.spaceId);
            attachItem(fileToAttachment(file));
        }
    };
})();
