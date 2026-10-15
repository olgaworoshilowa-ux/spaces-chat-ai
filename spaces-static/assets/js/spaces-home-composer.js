(() => {
    'use strict';

    const home = document.querySelector('[data-home-page]');
    const homeForm = home?.querySelector('[data-home-composer]');
    const inlineForm = document.querySelector('[data-inline-copilot]');

    const voiceIconSrc = './assets/images/spaces-v2/home-composer/voice.svg?v=send-icon-fix-1';
    const sendIconSrc = './assets/images/spaces-v2/home-composer/send.svg?v=send-icon-fix-1';
    const checkIcon = './assets/images/sidebar/dropdown-check.svg';
    const fallbackPreview = './assets/images/spaces-v2/collection-preview.png';
    const scopeStorageKey = 'planner5d-spaces-v2-home-composer-scope';
    const modeStorageKey = 'planner5d-spaces-v2-home-composer-mode';
    const modes = ['Lite', 'Pro'];

    let spaces = [];
    let files = [];
    let attachments = [];
    let selectedScopeId = 'all';
    let selectedMode = 'Lite';
    let mentionActive = false;
    let activeSurface = null;

    const collectSurface = (root, options = {}) => {
        if (!root) return null;
        const form = options.form || root;
        const input = options.input || form.querySelector('[data-home-composer-input], [data-inline-copilot-input]');
        if (!form || !input) return null;
        return {
            id: options.id || 'composer',
            root,
            form,
            input,
            placeholder: form.querySelector('[data-home-composer-placeholder], [data-inline-copilot-placeholder]'),
            chips: form.querySelector('[data-home-composer-chips]'),
            modeButton: form.querySelector('[data-home-composer-mode]'),
            modeValue: form.querySelector('[data-home-composer-mode-value]'),
            modeMenu: form.querySelector('[data-home-composer-mode-menu]'),
            scopeButton: form.querySelector('[data-home-composer-scope]'),
            scopeIcon: form.querySelector('[data-home-composer-scope-icon]'),
            scopeLabel: form.querySelector('[data-home-composer-scope-label]'),
            scopeMenu: form.querySelector('[data-home-composer-scope-menu]'),
            scopeClear: form.querySelector('[data-home-composer-scope-clear]'),
            attachButton: form.querySelector('[data-home-composer-attach]'),
            attachMenu: form.querySelector('[data-home-composer-attach-menu]'),
            attachList: form.querySelector('[data-home-composer-attach-list]'),
            attachSearch: form.querySelector('[data-home-composer-attach-search]'),
            uploadInput: form.querySelector('[data-home-composer-file]'),
            sendButton: form.querySelector('[data-home-composer-send]'),
            sendIcon: form.querySelector('[data-home-composer-send-icon]'),
            ownsHomeSubmit: Boolean(options.ownsHomeSubmit),
            lockWithHomeChat: Boolean(options.lockWithHomeChat)
        };
    };

    const surfaces = [
        collectSurface(home, {
            id: 'home',
            form: homeForm,
            input: home?.querySelector('[data-home-composer-input]'),
            ownsHomeSubmit: true,
            lockWithHomeChat: true
        }),
        collectSurface(inlineForm, {
            id: 'inline',
            form: inlineForm,
            input: inlineForm?.querySelector('[data-inline-copilot-input]'),
            ownsHomeSubmit: false,
            lockWithHomeChat: false
        }),
        collectSurface(document.querySelector('[data-chat-placement-dock]'), {
            id: 'dock',
            form: document.querySelector('[data-chat-placement-dock]'),
            input: document.querySelector('[data-chat-placement-input]'),
            ownsHomeSubmit: false,
            lockWithHomeChat: false
        })
    ].filter(Boolean);

    if (!surfaces.length) return;

    activeSurface = surfaces[0];

    const TRY_PLACEHOLDERS = [
        'Try “Turn the spare room into a home office”',
        'Try “Make the kitchen feel bigger”',
        'Try “Furnish the bedroom in Scandi style”',
        'Try “Render the terrace at sunset”',
        'Try “What’s the total floor area?”',
        'Try “Find a sofa that fits this wall”'
    ];
    let tryPlaceholderIndex = 0;
    let tryPlaceholderTimer = 0;

    const normalize = value => String(value || '').trim().toLowerCase();

    const forEachSurface = fn => {
        surfaces.forEach(surface => fn(surface));
    };

    const setTryPlaceholder = (surface, index, animate) => {
        const node = surface?.placeholder?.querySelector('[data-home-composer-placeholder-rotate]');
        if (!node) return;
        const next = TRY_PLACEHOLDERS[index % TRY_PLACEHOLDERS.length];
        if (!animate) {
            node.textContent = next;
            node.classList.remove('is-fading');
            return;
        }
        node.classList.add('is-fading');
        window.setTimeout(() => {
            node.textContent = next;
            node.classList.remove('is-fading');
        }, 220);
    };

    const homeHasCenteredChat = () => Boolean(
        document.querySelector('.spaces-home.is-centered-chat')
    );

    const startTryPlaceholderRotation = () => {
        const rotating = surfaces.filter(surface =>
            surface.placeholder?.querySelector('[data-home-composer-placeholder-rotate]')
        );
        if (!rotating.length) return;
        rotating.forEach(surface => setTryPlaceholder(surface, tryPlaceholderIndex, false));
        window.clearInterval(tryPlaceholderTimer);
        tryPlaceholderTimer = window.setInterval(() => {
            // Home chat mode uses a static placeholder — never rotate there.
            if (homeHasCenteredChat()) return;
            const active = rotating.filter(surface =>
                !surface.placeholder?.hidden
                && !surface.input.value.trim()
                && !attachments.length
                && !surface.form?.closest('.spaces-home.is-centered-chat')
            );
            if (!active.length) return;
            tryPlaceholderIndex = (tryPlaceholderIndex + 1) % TRY_PLACEHOLDERS.length;
            active.forEach(surface => setTryPlaceholder(surface, tryPlaceholderIndex, true));
        }, 3200);
    };

    const syncPlaceholder = surface => {
        const target = surface || activeSurface;
        if (!target) return;
        if (target.placeholder) {
            target.placeholder.hidden = Boolean(target.input.value.trim()) || attachments.length > 0;
        }
        syncSend(target);
        syncHalo(target);
    };

    const haloHost = surface => {
        if (surface?.form?.classList.contains('spaces-home-composer')) return surface.form;
        return surface?.form?.querySelector('.spaces-inline-copilot-bar') || null;
    };

    const syncHalo = surface => {
        const host = haloHost(surface);
        if (!host) return;
        host.classList.toggle('is-halo-off', Boolean(surface.input.value.trim()));
    };

    const canSend = surface => Boolean(surface?.input.value.trim()) || attachments.length > 0;

    const syncSend = surface => {
        if (!surface?.sendButton) return;
        const ready = canSend(surface);
        surface.sendButton.classList.toggle('is-ready', ready);
        surface.sendButton.type = ready ? 'submit' : 'button';
        surface.sendButton.setAttribute('aria-label', ready ? 'Send' : 'Voice');
        if (surface.sendIcon) surface.sendIcon.src = ready ? sendIconSrc : voiceIconSrc;
    };

    const resizeInput = surface => {
        const target = surface || activeSurface;
        if (!target?.input) return;
        target.input.style.height = 'auto';
        target.input.style.height = `${Math.max(24, target.input.scrollHeight)}px`;
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
    const isPlacementOption4 = () => {
        if (
            document.body.classList.contains('is-new-chat-placement-option4')
            || document.body.classList.contains('is-new-chat-placement-option5')
        ) return true;
        try {
            const stored = localStorage.getItem('planner5d-spaces-v2-new-chat-placement');
            return stored === 'option4' || stored === 'option5' || stored === 'option5-1' || stored === 'option5-2';
        } catch {
            return false;
        }
    };

    const option4ScopeId = () => {
        const currentName = document.querySelector('[data-space-name]')?.textContent?.trim();
        const byName = currentName && spaces.find(space => space.title === currentName);
        return String(byName?.id || spaces[0]?.id || 'all');
    };

    const spaceById = spaceId => spaces.find(space => String(space.id) === String(spaceId));

    const resolveInitialScope = () => {
        const stored = readStoredScope();
        if (isPlacementOption4() && (stored === 'all' || !spaceById(stored))) return option4ScopeId();
        return stored;
    };

    const syncOption1Copy = () => {
        const space = selectedScopeId !== 'all' ? spaceById(selectedScopeId) : null;
        const name = space?.title || '';
        document.querySelectorAll('[data-home-option1-space-name]').forEach(node => {
            node.textContent = name || 'My Home';
        });
        document.querySelectorAll('[data-home-composer-placeholder] [data-home-option1-with]').forEach(node => {
            node.hidden = !space;
        });
        home?.querySelectorAll('h1 [data-home-option1-with]').forEach(node => {
            node.hidden = !space;
        });
        home?.querySelectorAll('[data-home-title-space]').forEach(node => {
            node.setAttribute('aria-label', space ? `Space: ${space.title}` : 'Choose a space');
        });
        forEachSurface(surface => {
            if (surface.scopeClear) surface.scopeClear.hidden = !(isChatUiOption1() && space);
        });
    };

    const clearTitleScopeAnchor = () => {
        forEachSurface(surface => {
            if (!surface.scopeMenu) return;
            surface.scopeMenu.classList.remove('is-title-anchored');
            surface.scopeMenu.style.top = '';
            surface.scopeMenu.style.left = '';
            surface.scopeMenu.style.right = '';
            surface.scopeMenu.style.bottom = '';
            surface.scopeMenu.style.position = '';
        });
        home?.querySelectorAll('[data-home-title-space]').forEach(node => {
            node.setAttribute('aria-expanded', 'false');
        });
    };

    const spaceInitial = space => {
        const initial = document.createElement('span');
        initial.className = 'spaces-home-space-initial';
        initial.setAttribute('aria-hidden', 'true');
        initial.textContent = space?.initial || String(space?.title || 'S').slice(0, 1).toUpperCase();
        if (space?.avatarColor) initial.style.backgroundColor = space.avatarColor;
        return initial;
    };

    const emptySpaceIcon = () => {
        const icon = document.createElement('span');
        icon.className = 'spaces-no-space-icon';
        icon.setAttribute('aria-hidden', 'true');
        return icon;
    };

    const setScopeIcon = (surface, space) => {
        if (!surface.scopeIcon) return;
        surface.scopeIcon.replaceChildren();
        if (!space) {
            surface.scopeIcon.append(emptySpaceIcon());
            return;
        }
        surface.scopeIcon.append(spaceInitial(space));
    };

    const closeScopeMenu = surface => {
        const targets = surface ? [surface] : surfaces;
        targets.forEach(item => {
            if (!item.scopeMenu || item.scopeMenu.hidden) return;
            item.scopeMenu.hidden = true;
            item.scopeButton?.setAttribute('aria-expanded', 'false');
        });
        clearTitleScopeAnchor();
    };

    const closeModeMenu = surface => {
        const targets = surface ? [surface] : surfaces;
        targets.forEach(item => {
            if (!item.modeMenu || item.modeMenu.hidden) return;
            item.modeMenu.hidden = true;
            item.modeButton?.setAttribute('aria-expanded', 'false');
        });
    };

    const closeAttachMenu = surface => {
        const targets = surface ? [surface] : surfaces;
        targets.forEach(item => {
            if (!item.attachMenu || item.attachMenu.hidden) return;
            item.attachMenu.hidden = true;
            item.attachButton?.setAttribute('aria-expanded', 'false');
            if (item.attachSearch) item.attachSearch.value = '';
        });
        mentionActive = false;
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
        forEachSurface(surface => {
            if (surface.modeValue) surface.modeValue.textContent = selectedMode;
            surface.modeButton?.setAttribute('aria-label', `Mode: ${selectedMode}`);
            surface.modeMenu?.querySelectorAll('[data-home-composer-mode-option]').forEach(option => {
                const isSelected = option.dataset.homeComposerModeOption === selectedMode;
                option.classList.toggle('is-selected', isSelected);
                option.setAttribute('aria-selected', String(isSelected));
            });
        });
        if (options.persist !== false) persistMode(selectedMode);
        document.dispatchEvent(new CustomEvent('spaces-home-composer-mode-changed', {
            detail: { mode: selectedMode }
        }));
    };

    const openModeMenu = surface => {
        if (!surface?.modeMenu) return;
        activeSurface = surface;
        closeScopeMenu();
        closeAttachMenu();
        closeModeMenu();
        surface.modeMenu.hidden = false;
        surface.modeButton?.setAttribute('aria-expanded', 'true');
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

    const mentionQuery = surface => {
        const input = surface?.input;
        if (!input) return null;
        const start = input.selectionStart ?? input.value.length;
        const before = input.value.slice(0, start);
        const match = before.match(/@([^\s@]*)$/);
        return match ? match[1] : null;
    };

    const clearMention = surface => {
        const target = surface || activeSurface;
        if (!target?.input) return;
        const start = target.input.selectionStart ?? target.input.value.length;
        const before = target.input.value.slice(0, start);
        const after = target.input.value.slice(start);
        const nextBefore = before.replace(/@([^\s@]*)$/, '');
        target.input.value = `${nextBefore}${after}`;
        const cursor = nextBefore.length;
        target.input.setSelectionRange(cursor, cursor);
        resizeInput(target);
        syncPlaceholder(target);
    };

    const isAttached = id => attachments.some(item => String(item.id) === String(id));

    const renderChipsForSurface = surface => {
        if (!surface.chips) return;
        surface.chips.hidden = attachments.length === 0;
        surface.chips.replaceChildren(...attachments.map(item => {
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
                forEachSurface(syncPlaceholder);
            });
            chip.append(preview, copy, remove);
            return chip;
        }));
        syncPlaceholder(surface);
    };

    const renderChips = () => {
        forEachSurface(renderChipsForSurface);
    };

    const renderAttachListForSurface = surface => {
        if (!surface.attachList) return;
        const query = normalize(surface.attachSearch?.value || '');
        const visibleFiles = scopedFiles().filter(file => fileMatchesQuery(file, query));
        if (!visibleFiles.length) {
            const empty = document.createElement('p');
            empty.className = 'spaces-home-composer-attach-empty';
            empty.textContent = selectedScopeId === 'all'
                ? 'No files in your spaces yet'
                : 'No files in this space yet';
            surface.attachList.replaceChildren(empty);
            return;
        }

        surface.attachList.replaceChildren(...visibleFiles.map(file => {
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
                activeSurface = surface;
                attachItem(fileToAttachment(file));
            });
            return button;
        }));
    };

    const renderAttachList = surface => {
        if (surface) renderAttachListForSurface(surface);
        else forEachSurface(renderAttachListForSurface);
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

    const attachItem = item => {
        if (!item?.id || isAttached(item.id)) return;
        attachments = [...attachments, item];
        if (mentionActive) clearMention(activeSurface);
        renderChips();
        renderAttachList();
        closeAttachMenu();
        activeSurface?.input.focus();
    };

    const openAttachMenu = (surface, options = {}) => {
        if (!surface?.attachMenu) return;
        activeSurface = surface;
        closeScopeMenu();
        closeModeMenu();
        closeAttachMenu();
        mentionActive = Boolean(options.mention);
        if (surface.attachSearch) surface.attachSearch.value = options.query || '';
        renderAttachListForSurface(surface);
        surface.attachMenu.hidden = false;
        surface.attachButton?.setAttribute('aria-expanded', 'true');
        if (!mentionActive) surface.attachSearch?.focus();
    };

    const plusIconSrc = './assets/images/spaces-v2/home-composer/plus.svg';

    const createNewSpace = () => {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const space = {
            id: `new-space-${Date.now()}`,
            title: 'New space',
            address: 'Fill Address',
            initial: 'N',
            avatarColor: '#a8d0ff',
            cdate: now,
            udate: now
        };
        spaces = [space, ...spaces];
        applyScope(space.id);
        document.dispatchEvent(new CustomEvent('spaces-home-new-space', { detail: { space } }));
    };

    const renderScopeMenuForSurface = surface => {
        if (!surface.scopeMenu) return;
        const options = [
            { id: 'all', title: 'No space' },
            ...spaces
        ];
        const nodes = options.map(option => {
            const isAll = option.id === 'all';
            const isSelected = String(selectedScopeId) === String(option.id);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'spaces-home-composer-scope-option';
            button.setAttribute('role', 'option');
            button.dataset.homeComposerScopeOption = String(option.id);
            button.setAttribute('aria-selected', String(isSelected));
            button.classList.toggle('is-selected', isSelected);

            if (isAll) button.append(emptySpaceIcon());
            else button.append(spaceInitial(option));

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
                surface.input.focus();
            });
            return button;
        });

        const divider = document.createElement('div');
        divider.className = 'spaces-home-composer-scope-divider';
        divider.setAttribute('aria-hidden', 'true');
        nodes.push(divider);

        const newSpace = document.createElement('button');
        newSpace.type = 'button';
        newSpace.className = 'spaces-home-composer-scope-option is-action';
        newSpace.setAttribute('role', 'option');
        newSpace.dataset.homeComposerScopeOption = 'new-space';
        newSpace.setAttribute('aria-selected', 'false');

        const plus = document.createElement('img');
        plus.src = plusIconSrc;
        plus.alt = '';
        plus.width = 20;
        plus.height = 20;
        plus.setAttribute('aria-hidden', 'true');
        newSpace.append(plus);

        const newLabel = document.createElement('span');
        newLabel.textContent = 'New space';
        newSpace.append(newLabel);

        // Prototype: looks active, but click does nothing yet.
        newSpace.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
        });
        nodes.push(newSpace);

        surface.scopeMenu.replaceChildren(...nodes);
    };

    const renderScopeMenu = surface => {
        if (surface) renderScopeMenuForSurface(surface);
        else forEachSurface(renderScopeMenuForSurface);
    };

    const applyScope = (scopeId, options = {}) => {
        const nextId = String(scopeId || 'all');
        const space = spaces.find(item => String(item.id) === nextId);
        selectedScopeId = space ? String(space.id) : 'all';
        const label = space?.title || 'No space';
        forEachSurface(surface => {
            if (surface.scopeLabel) surface.scopeLabel.textContent = label;
            surface.scopeButton?.setAttribute('aria-label', label);
            setScopeIcon(surface, space || null);
        });
        if (options.persist !== false) persistScope(selectedScopeId);
        renderScopeMenu();
        renderAttachList();
        document.dispatchEvent(new CustomEvent('spaces-home-composer-scope-changed', {
            detail: { scopeId: selectedScopeId, space: space || null }
        }));
        syncOption1Copy();
    };

    const isChatStarted = () => Boolean(home?.classList.contains('is-centered-chat'));

    const syncScopeLock = () => {
        const locked = isChatStarted();
        closeScopeMenu();
        forEachSurface(surface => {
            if (!surface.lockWithHomeChat || !surface.scopeButton) return;
            surface.scopeButton.disabled = locked;
            surface.scopeButton.setAttribute('aria-disabled', String(locked));
            if (locked) surface.scopeButton.setAttribute('aria-expanded', 'false');
            if (locked && surface.scopeClear) surface.scopeClear.hidden = true;
        });
        if (!locked) syncOption1Copy();
    };

    const openScopeMenu = (surface, options = {}) => {
        if (!surface?.scopeMenu) return;
        if (surface.lockWithHomeChat && isChatStarted()) return;
        activeSurface = surface;
        closeAttachMenu();
        closeModeMenu();
        closeScopeMenu();
        renderScopeMenuForSurface(surface);
        surface.scopeMenu.hidden = false;
        surface.scopeButton?.setAttribute('aria-expanded', 'true');
        const anchor = options.anchor;
        if (anchor) {
            const rect = anchor.getBoundingClientRect();
            const menuWidth = Math.max(280, surface.scopeMenu.offsetWidth || 280);
            const left = Math.min(
                Math.max(12, Math.round(rect.left + rect.width / 2 - menuWidth / 2)),
                window.innerWidth - menuWidth - 12
            );
            surface.scopeMenu.classList.add('is-title-anchored');
            surface.scopeMenu.style.position = 'fixed';
            surface.scopeMenu.style.top = `${Math.round(rect.bottom + 10)}px`;
            surface.scopeMenu.style.left = `${left}px`;
            surface.scopeMenu.style.right = 'auto';
            surface.scopeMenu.style.bottom = 'auto';
            surface.scopeMenu.style.zIndex = '40';
            anchor.setAttribute('aria-expanded', 'true');
        }
    };

    const loadAccount = account => {
        spaces = Array.isArray(account?.spaces) ? account.spaces : [];
        files = Array.isArray(account?.files) ? account.files : [];
        applyScope(resolveInitialScope(), { persist: false });
    };

    surfaces.forEach(surface => {
        surface.input.addEventListener('input', () => {
            activeSurface = surface;
            syncPlaceholder(surface);
            resizeInput(surface);
            const query = mentionQuery(surface);
            if (query === null) {
                if (mentionActive) closeAttachMenu(surface);
                return;
            }
            openAttachMenu(surface, { mention: true, query });
        });

        surface.input.addEventListener('keydown', event => {
            if (event.key !== 'Enter' || event.shiftKey) return;
            if (!canSend(surface)) return;
            if (!surface.ownsHomeSubmit) return;
            event.preventDefault();
            surface.form.requestSubmit();
        });

        surface.placeholder?.addEventListener('click', () => surface.input.focus());

        surface.modeButton?.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            if (surface.modeMenu?.hidden === false) closeModeMenu(surface);
            else openModeMenu(surface);
        });

        surface.modeMenu?.querySelectorAll('[data-home-composer-mode-option]').forEach(option => {
            option.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                applyMode(option.dataset.homeComposerModeOption);
                closeModeMenu();
                surface.input.focus();
            });
        });

        surface.scopeButton?.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            if (surface.lockWithHomeChat && isChatStarted()) return;
            if (event.target.closest('[data-home-composer-scope-clear]')) {
                applyScope('all');
                closeScopeMenu();
                surface.input.focus();
                return;
            }
            if (surface.scopeMenu?.hidden === false) closeScopeMenu(surface);
            else openScopeMenu(surface);
        });

        surface.attachButton?.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            if (surface.attachMenu?.hidden === false) closeAttachMenu(surface);
            else openAttachMenu(surface);
        });

        surface.attachSearch?.addEventListener('input', () => renderAttachListForSurface(surface));
        surface.attachSearch?.addEventListener('click', event => event.stopPropagation());

        surface.uploadInput?.addEventListener('change', event => {
            const file = event.target.files?.[0];
            if (!file) return;
            activeSurface = surface;
            const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
            attachItem({
                id: `upload-${file.name}-${file.size}-${file.lastModified}`,
                title: file.name,
                type: 'Uploaded file',
                spaceId: '',
                spaceTitle: 'Computer',
                previewUrl
            });
            surface.uploadInput.value = '';
        });

        if (surface.ownsHomeSubmit) {
            surface.form.addEventListener('submit', event => {
                event.preventDefault();
                const text = surface.input.value.trim();
                document.dispatchEvent(new CustomEvent('spaces-home-composer-submit', {
                    detail: { text },
                    cancelable: true
                }));
            });
        }
    });

    home?.querySelectorAll('[data-home-composer-suggestion]').forEach(button => {
        button.addEventListener('click', () => {
            const homeSurface = surfaces.find(item => item.id === 'home');
            if (!homeSurface) return;
            const text = button.dataset.homeComposerSuggestion || button.textContent.trim();
            homeSurface.input.value = String(text || '').trim();
            syncPlaceholder(homeSurface);
            resizeInput(homeSurface);
            homeSurface.input.focus();
            const length = homeSurface.input.value.length;
            homeSurface.input.setSelectionRange?.(length, length);
        });
    });

    home?.querySelectorAll('[data-home-title-space]').forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            const homeSurface = surfaces.find(item => item.id === 'home');
            if (!homeSurface) return;
            if (homeSurface.scopeMenu?.hidden === false && homeSurface.scopeMenu.classList.contains('is-title-anchored')) {
                closeScopeMenu(homeSurface);
                return;
            }
            openScopeMenu(homeSurface, { anchor: button });
        });
    });

    document.addEventListener('spaces-chat-ui-changed', syncOption1Copy);

    document.addEventListener('click', event => {
        const inTitleSpace = event.target.closest?.('[data-home-title-space]');
        forEachSurface(surface => {
            const inScope = inTitleSpace
                || surface.scopeButton?.contains(event.target)
                || surface.scopeMenu?.contains(event.target);
            const inAttach = surface.attachButton?.contains(event.target) || surface.attachMenu?.contains(event.target);
            const inMode = surface.modeButton?.contains(event.target) || surface.modeMenu?.contains(event.target);
            if (!inScope) closeScopeMenu(surface);
            if (!inAttach) closeAttachMenu(surface);
            if (!inMode) closeModeMenu(surface);
        });
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        closeScopeMenu();
        closeAttachMenu();
        closeModeMenu();
    });

    document.addEventListener('spaces-account-profile-ready', event => {
        loadAccount(event.detail?.account);
    });
    document.addEventListener('spaces-new-chat-placement-changed', () => {
        if (!isPlacementOption4()) return;
        if (selectedScopeId === 'all') applyScope(option4ScopeId());
    });
    document.addEventListener('spaces-navigation-start', () => {
        if (!isPlacementOption4()) return;
        applyScope(option4ScopeId());
    });
    const spaceTitleNode = document.querySelector('[data-space-name]');
    if (spaceTitleNode) {
        new MutationObserver(() => {
            if (!isPlacementOption4()) return;
            applyScope(option4ScopeId(), { persist: false });
        }).observe(spaceTitleNode, { childList: true, characterData: true, subtree: true });
    }

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

    forEachSurface(syncPlaceholder);
    startTryPlaceholderRotation();

    if (home) {
        new MutationObserver(syncScopeLock).observe(home, { attributes: true, attributeFilter: ['class'] });
        syncScopeLock();
    }

    window.SpacesHomeComposer = {
        getAttachments() {
            return attachments.map(item => ({ ...item }));
        },
        addToNewChat(file) {
            if (!file) return;
            window.SpacesAiChats?.startNew?.();
            if (file.spaceId) applyScope(file.spaceId);
            const homeSurface = surfaces.find(item => item.id === 'home');
            if (homeSurface) activeSurface = homeSurface;
            attachItem(fileToAttachment(file));
        }
    };
})();
