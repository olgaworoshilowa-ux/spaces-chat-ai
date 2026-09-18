(() => {
    'use strict';

    const dock = document.querySelector('[data-chat-placement-dock]');
    const dockInput = dock?.querySelector('[data-chat-placement-input]');
    const dockSendButton = dock?.querySelector('[data-chat-placement-send]');
    const dockSendIcon = dock?.querySelector('[data-chat-placement-send-icon]');
    const inlineForms = [...document.querySelectorAll('[data-inline-copilot]')];
    const chipsRoot = document.querySelector('[data-inline-copilot-chips]');
    const homeChipsRoot = document.querySelector('[data-home-option4-chips]');
    const editor = document.querySelector('[data-inline-copilot-editor]');
    const editorList = document.querySelector('[data-inline-copilot-editor-list]');
    const placeholder = document.querySelector('[data-inline-copilot-placeholder]');
    const spaceLetter = document.querySelector('[data-inline-copilot-space-letter]');
    const spaceName = document.querySelector('[data-inline-copilot-space-name]');

    const SUGGESTION_KEY = 'planner5d-spaces-v2-option4-suggestions';
    const TONES = ['rose', 'lilac', 'lime'];
    const TONE_ICONS = {
        rose: './assets/images/spaces-v2/inline-copilot/rooms.svg',
        lilac: './assets/images/spaces-v2/inline-copilot/color.svg',
        lime: './assets/images/spaces-v2/inline-copilot/lighting.svg'
    };
    const DEFAULT_SUGGESTIONS = [
        { id: 'plan-room', title: 'Plan my room', prompt: 'Plan my room', tone: 'rose' },
        { id: 'moodboard', title: 'Generate moodboard', prompt: 'Generate moodboard', tone: 'lilac' },
        { id: 'lighting', title: 'Add lightning in my New Project', prompt: 'Add lightning in my New Project', tone: 'lime' }
    ];

    const dockVoiceIconSrc = './assets/images/spaces-v2/home-composer/voice.svg';
    const dockSendIconSrc = './assets/images/spaces-v2/home-composer/send.svg';
    const inlineVoiceIconSrc = './assets/images/spaces-v2/inline-copilot/send.svg';
    const inlineSendIconSrc = './assets/images/spaces-v2/home-composer/send.svg';

    const isPlacementOption2 = () => document.body.classList.contains('is-new-chat-placement-option2');
    const isPlacementOption4 = () => (
        document.body.classList.contains('is-new-chat-placement-option4')
        || document.body.classList.contains('is-new-chat-placement-option5')
    );
    const isInChat = () => Boolean(document.querySelector('.spaces-home.is-centered-chat'));
    const isNewChatHome = () => {
        const main = document.querySelector('.spaces-main-content');
        const home = document.querySelector('[data-home-page]');
        return Boolean(
            main?.classList.contains('is-home-page')
            && home
            && !home.hidden
            && !home.classList.contains('is-centered-chat')
        );
    };
    const isBlocked = () => (
        document.body.classList.contains('is-listing-studio-open')
        || document.body.classList.contains('is-copilot-panel-open')
    );

    const sendPrompt = (text) => {
        if (window.SpacesListingChat?.send?.(text)) return;
        window.SpacesListingChat?.startGeneric?.(text);
    };

    const cloneDefaults = () => DEFAULT_SUGGESTIONS.map(item => ({ ...item }));

    const readSuggestions = () => {
        try {
            const stored = JSON.parse(localStorage.getItem(SUGGESTION_KEY) || 'null');
            if (!Array.isArray(stored) || !stored.length) return cloneDefaults();
            return stored
                .map((item, index) => ({
                    id: String(item.id || `custom-${index}`),
                    title: String(item.title || '').trim(),
                    prompt: String(item.prompt || item.title || '').trim(),
                    tone: TONES.includes(item.tone) ? item.tone : TONES[index % TONES.length]
                }))
                .filter(item => item.title);
        } catch {
            return cloneDefaults();
        }
    };

    const writeSuggestions = list => {
        try {
            localStorage.setItem(SUGGESTION_KEY, JSON.stringify(list));
        } catch {
            // Prototype keeps working without persistence.
        }
    };

    const bindComposer = ({ form, input, sendButton, sendIcon, canSubmit, voiceSrc, sendSrc, onAfterSend }) => {
        const canSend = () => Boolean(input.value.trim());

        const syncSend = () => {
            const ready = canSend();
            sendButton.classList.toggle('is-ready', ready);
            sendButton.type = ready ? 'submit' : 'button';
            sendButton.setAttribute('aria-label', ready ? 'Send' : 'Voice');
            if (sendIcon) sendIcon.src = ready ? sendSrc : voiceSrc;
            if (placeholder && form.hasAttribute('data-inline-copilot')) {
                placeholder.hidden = ready;
            }
        };

        const submit = () => {
            const text = input.value.trim();
            if (!text || !canSubmit()) return;
            input.value = '';
            syncSend();
            onAfterSend?.();
            sendPrompt(text);
        };

        form.addEventListener('submit', event => {
            event.preventDefault();
            submit();
        });

        sendButton.addEventListener('click', event => {
            if (canSend()) return;
            event.preventDefault();
        });

        input.addEventListener('input', syncSend);

        input.addEventListener('keydown', event => {
            if (event.key !== 'Enter' || event.shiftKey) return;
            if (!canSend()) return;
            event.preventDefault();
            submit();
        });

        return { syncSend, clear: () => { input.value = ''; syncSend(); }, fill: (text) => { input.value = text; syncSend(); input.focus(); } };
    };

    let dockApi = null;
    if (dock && dockInput && dockSendButton) {
        dockApi = bindComposer({
            form: dock,
            input: dockInput,
            sendButton: dockSendButton,
            sendIcon: dockSendIcon,
            canSubmit: () => isPlacementOption2() && !isInChat(),
            voiceSrc: dockVoiceIconSrc,
            sendSrc: dockSendIconSrc,
            onAfterSend: () => {
                dockInput.style.height = 'auto';
                dockInput.style.height = `${Math.min(Math.max(20, dockInput.scrollHeight), 88)}px`;
            }
        });

        dockInput.addEventListener('input', () => {
            dockInput.style.height = 'auto';
            dockInput.style.height = `${Math.min(Math.max(20, dockInput.scrollHeight), 88)}px`;
        });
    }

    const inlineApis = inlineForms.map(form => {
        const input = form.querySelector('[data-inline-copilot-input]');
        const sendButton = form.querySelector('[data-inline-copilot-send]');
        const sendIcon = form.querySelector('[data-inline-copilot-send-icon]');
        if (!input || !sendButton) return null;
        const api = {
            form,
            input,
            ...bindComposer({
                form,
                input,
                sendButton,
                sendIcon,
                canSubmit: () => isPlacementOption4() && !isBlocked(),
                voiceSrc: inlineVoiceIconSrc,
                sendSrc: inlineSendIconSrc,
                onAfterSend: () => {
                    input.style.height = 'auto';
                    input.style.height = `${Math.min(Math.max(24, input.scrollHeight), 96)}px`;
                }
            })
        };
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = `${Math.min(Math.max(24, input.scrollHeight), 96)}px`;
        });
        form.querySelector('[data-inline-copilot-attach]')?.addEventListener('click', () => {
            const next = input.value.includes('@') ? input.value : `${input.value} @`.replace(/^\s+/, '');
            api.fill(next);
        });
        return api;
    }).filter(Boolean);

    const fillComposer = (text) => {
        inlineApis[0]?.fill(text);
    };

    const fillHomeComposer = (text) => {
        const homeInput = document.querySelector('[data-home-composer-input]');
        if (!homeInput) return;
        homeInput.value = text;
        homeInput.dispatchEvent(new Event('input', { bubbles: true }));
        homeInput.focus();
        const length = homeInput.value.length;
        homeInput.setSelectionRange?.(length, length);
    };

    const chipRoots = () => [chipsRoot, homeChipsRoot].filter(Boolean);

    const renderChips = () => {
        chipRoots().forEach(root => {
            root.replaceChildren();
            readSuggestions().forEach(item => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'spaces-inline-copilot-chip';
                const icon = document.createElement('span');
                icon.className = `spaces-inline-copilot-chip-icon is-${item.tone}`;
                const img = document.createElement('img');
                img.src = TONE_ICONS[item.tone];
                img.width = 16;
                img.height = 16;
                img.alt = '';
                icon.append(img);
                const label = document.createElement('span');
                label.textContent = item.title;
                button.append(icon, label);
                button.addEventListener('click', () => {
                    if (root === homeChipsRoot) fillHomeComposer(item.prompt);
                    else fillComposer(item.prompt);
                });
                root.append(button);
            });
        });
    };

    const editorState = { draft: cloneDefaults() };

    const renderEditorRows = () => {
        if (!editorList) return;
        editorList.replaceChildren();
        editorState.draft.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'spaces-inline-copilot-editor-row';
            row.innerHTML = `
                <input type="text" data-field="title" maxlength="80" placeholder="Chip title" value="${item.title.replace(/"/g, '&quot;')}">
                <input type="text" data-field="prompt" maxlength="200" placeholder="Prompt to send" value="${item.prompt.replace(/"/g, '&quot;')}">
                <select data-field="tone">
                    ${TONES.map(tone => `<option value="${tone}" ${tone === item.tone ? 'selected' : ''}>${tone}</option>`).join('')}
                </select>
                <button type="button" data-remove>×</button>
            `;
            row.querySelectorAll('[data-field]').forEach(field => {
                field.addEventListener('input', () => {
                    editorState.draft[index][field.dataset.field] = field.value;
                });
                field.addEventListener('change', () => {
                    editorState.draft[index][field.dataset.field] = field.value;
                });
            });
            row.querySelector('[data-remove]').addEventListener('click', () => {
                editorState.draft.splice(index, 1);
                renderEditorRows();
            });
            editorList.append(row);
        });
    };

    const openEditor = () => {
        if (!editor) return;
        editorState.draft = readSuggestions().map(item => ({ ...item }));
        renderEditorRows();
        editor.hidden = false;
    };

    const closeEditor = () => {
        if (editor) editor.hidden = true;
    };

    const syncSpace = () => {
        const title = document.querySelector('[data-space-name]')?.textContent?.trim() || 'My Home';
        if (spaceName) spaceName.textContent = title;
        if (spaceLetter) spaceLetter.textContent = (title.match(/[A-Za-z0-9]/) || ['M'])[0].toUpperCase();
    };

    const syncVisibility = () => {
        const showDock = Boolean(dock) && isPlacementOption2() && !isInChat() && !isNewChatHome() && !isBlocked();
        if (dock) {
            dock.hidden = !showDock;
            document.body.classList.toggle('is-chat-placement-dock-visible', showDock);
            if (!showDock) dockApi?.clear();
        }

        const showInline = isPlacementOption4() && !isBlocked();
        inlineApis.forEach(api => {
            api.form.hidden = !showInline;
            if (!showInline) api.clear();
        });
        if (homeChipsRoot) {
            homeChipsRoot.hidden = !(isPlacementOption4() && isNewChatHome() && !isBlocked());
        }
        syncSpace();
    };

    document.querySelectorAll('[data-inline-copilot-customize]').forEach(button => {
        button.addEventListener('click', openEditor);
    });
    editor?.querySelector('[data-inline-copilot-editor-close]')?.addEventListener('click', closeEditor);
    editor?.querySelector('[data-inline-copilot-editor-add]')?.addEventListener('click', () => {
        editorState.draft.push({
            id: `custom-${Date.now()}`,
            title: 'New suggestion',
            prompt: 'New suggestion',
            tone: TONES[editorState.draft.length % TONES.length]
        });
        renderEditorRows();
    });
    editor?.querySelector('[data-inline-copilot-editor-reset]')?.addEventListener('click', () => {
        editorState.draft = cloneDefaults();
        renderEditorRows();
    });
    editor?.querySelector('[data-inline-copilot-editor-save]')?.addEventListener('click', () => {
        const next = editorState.draft
            .map(item => ({ ...item, title: item.title.trim(), prompt: (item.prompt || item.title).trim() }))
            .filter(item => item.title);
        writeSuggestions(next.length ? next : cloneDefaults());
        renderChips();
        closeEditor();
    });
    editor?.addEventListener('click', event => {
        if (event.target === editor) closeEditor();
    });

    document.addEventListener('spaces-new-chat-placement-changed', syncVisibility);
    document.addEventListener('spaces-navigation-start', syncVisibility);
    document.addEventListener('click', event => {
        if (event.target.closest('[data-home-page-trigger], [data-home-page-profile-option], [data-copilot-trigger]')) {
            requestAnimationFrame(syncVisibility);
        }
    });

    const observer = new MutationObserver(() => {
        syncVisibility();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const home = document.querySelector('[data-home-page]');
    if (home) observer.observe(home, { attributes: true, attributeFilter: ['class', 'hidden'] });
    const main = document.querySelector('.spaces-main-content');
    if (main) observer.observe(main, { attributes: true, attributeFilter: ['class'] });
    const spaceTitleNode = document.querySelector('[data-space-name]');
    if (spaceTitleNode) observer.observe(spaceTitleNode, { childList: true, characterData: true, subtree: true });

    renderChips();
    dockApi?.syncSend();
    inlineApis.forEach(api => api.syncSend());
    syncVisibility();
})();
