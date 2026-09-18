(() => {
    'use strict';

    const dock = document.querySelector('[data-chat-placement-dock]');
    const dockInput = dock?.querySelector('[data-chat-placement-input]');
    const dockSendButton = dock?.querySelector('[data-chat-placement-send]');
    const dockSendIcon = dock?.querySelector('[data-chat-placement-send-icon]');
    const inlineForms = [...document.querySelectorAll('[data-inline-copilot]')];

    const voiceIconSrc = './assets/images/spaces-v2/home-composer/voice.svg';
    const sendIconSrc = './assets/images/spaces-v2/home-composer/send.svg';

    const isPlacementOption2 = () => document.body.classList.contains('is-new-chat-placement-option2');
    const isPlacementOption4 = () => document.body.classList.contains('is-new-chat-placement-option4');
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

    const bindComposer = ({ form, input, sendButton, sendIcon, canSubmit, onAfterSend }) => {
        const canSend = () => Boolean(input.value.trim());

        const syncSend = () => {
            const ready = canSend();
            sendButton.classList.toggle('is-ready', ready);
            sendButton.type = ready ? 'submit' : 'button';
            sendButton.setAttribute('aria-label', ready ? 'Send' : 'Voice');
            if (sendIcon) sendIcon.src = ready ? sendIconSrc : voiceIconSrc;
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

        return { syncSend, clear: () => { input.value = ''; syncSend(); } };
    };

    let dockApi = null;
    if (dock && dockInput && dockSendButton) {
        dockApi = bindComposer({
            form: dock,
            input: dockInput,
            sendButton: dockSendButton,
            sendIcon: dockSendIcon,
            canSubmit: () => isPlacementOption2() && !isInChat(),
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
        return {
            form,
            ...bindComposer({
                form,
                input,
                sendButton,
                sendIcon,
                canSubmit: () => isPlacementOption4() && !isBlocked()
            })
        };
    }).filter(Boolean);

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
    };

    document.addEventListener('spaces-new-chat-placement-changed', syncVisibility);
    document.addEventListener('spaces-navigation-start', syncVisibility);

    const observer = new MutationObserver(syncVisibility);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const home = document.querySelector('[data-home-page]');
    if (home) observer.observe(home, { attributes: true, attributeFilter: ['class', 'hidden'] });
    const main = document.querySelector('.spaces-main-content');
    if (main) observer.observe(main, { attributes: true, attributeFilter: ['class'] });

    dockApi?.syncSend();
    inlineApis.forEach(api => api.syncSend());
    syncVisibility();
})();
