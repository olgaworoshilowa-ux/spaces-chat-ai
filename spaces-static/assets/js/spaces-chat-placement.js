(() => {
    'use strict';

    const dock = document.querySelector('[data-chat-placement-dock]');
    const input = dock?.querySelector('[data-chat-placement-input]');
    const sendButton = dock?.querySelector('[data-chat-placement-send]');
    const sendIcon = dock?.querySelector('[data-chat-placement-send-icon]');
    if (!dock || !input || !sendButton) return;

    const voiceIconSrc = '/spaces-static/assets/images/spaces-v2/home-composer/voice.svg';
    const sendIconSrc = '/spaces-static/assets/images/spaces-v2/home-composer/send.svg';

    const isPlacementOption2 = () => document.body.classList.contains('is-new-chat-placement-option2');
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
    const canSend = () => Boolean(input.value.trim());

    const syncSend = () => {
        const ready = canSend();
        sendButton.classList.toggle('is-ready', ready);
        sendButton.type = ready ? 'submit' : 'button';
        sendButton.setAttribute('aria-label', ready ? 'Send' : 'Voice');
        if (sendIcon) sendIcon.src = ready ? sendIconSrc : voiceIconSrc;
    };

    const syncVisibility = () => {
        const show = isPlacementOption2() && !isInChat() && !isNewChatHome() && !isBlocked();
        dock.hidden = !show;
        document.body.classList.toggle('is-chat-placement-dock-visible', show);
        if (!show) {
            input.value = '';
            syncSend();
        }
    };

    const resizeInput = () => {
        input.style.height = 'auto';
        input.style.height = `${Math.min(Math.max(20, input.scrollHeight), 88)}px`;
    };

    const submit = () => {
        const text = input.value.trim();
        if (!text || !isPlacementOption2() || isInChat()) return;
        input.value = '';
        syncSend();
        resizeInput();
        if (window.SpacesListingChat?.send?.(text)) return;
        window.SpacesListingChat?.startGeneric?.(text);
    };

    dock.addEventListener('submit', event => {
        event.preventDefault();
        submit();
    });

    sendButton.addEventListener('click', event => {
        if (canSend()) return;
        event.preventDefault();
    });

    input.addEventListener('input', () => {
        syncSend();
        resizeInput();
    });

    input.addEventListener('keydown', event => {
        if (event.key !== 'Enter' || event.shiftKey) return;
        if (!canSend()) return;
        event.preventDefault();
        submit();
    });

    document.addEventListener('spaces-new-chat-placement-changed', syncVisibility);
    document.addEventListener('spaces-navigation-start', syncVisibility);

    const observer = new MutationObserver(syncVisibility);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const home = document.querySelector('[data-home-page]');
    if (home) observer.observe(home, { attributes: true, attributeFilter: ['class', 'hidden'] });
    const main = document.querySelector('.spaces-main-content');
    if (main) observer.observe(main, { attributes: true, attributeFilter: ['class'] });

    syncSend();
    syncVisibility();
})();
