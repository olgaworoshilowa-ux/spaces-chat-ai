(() => {
    'use strict';

    const storageKey = 'planner5d-spaces-v2-chat-dock-edge';
    const edges = new Set(['left', 'right', 'bottom', 'float']);
    const buttons = [...document.querySelectorAll('[data-chat-dock-edge]')];
    const panel = document.querySelector('[data-copilot-panel]');

    const clearPanelStyle = () => {
        if (!panel) return;
        [
            'position','top','right','bottom','left','inset','width','min-width','max-width',
            'height','min-height','max-height','margin-top','border-radius','border','border-top',
            'border-left','border-right','box-shadow','z-index','order','overflow'
        ].forEach(name => panel.style.removeProperty(name));
    };

    const set = (name, value) => panel.style.setProperty(name, value, 'important');

    const stylePanel = () => {
        if (!panel || !isOption4()) {
            clearPanelStyle();
            return;
        }
        if (edge === 'bottom') {
            set('position', 'fixed');
            set('z-index', '60');
            set('left', document.querySelector('.spaces-sidebar-v2.is-hidden') ? '0' : '256px');
            set('right', '0');
            set('bottom', 'auto');
            set('top', 'calc(100vh - 380px)');
            set('height', '380px');
            set('min-height', '380px');
            set('max-height', '380px');
            set('margin-top', '0');
            set('border', '0');
            set('border-top', '1px solid #e9e9e9');
            set('border-radius', '16px 16px 0 0');
            set('box-shadow', '0 -8px 24px rgba(0,0,0,.12)');
            set('overflow', 'hidden');
            return;
        }
        if (edge === 'float') {
            set('position', 'fixed');
            set('z-index', '60');
            set('right', '16px');
            set('bottom', 'auto');
            set('top', 'calc(100vh - 656px)');
            set('left', 'auto');
            set('width', '380px');
            set('height', '640px');
            set('min-height', '320px');
            set('max-height', '72vh');
            set('margin-top', '0');
            set('border', '1px solid #e9e9e9');
            set('border-radius', '20px');
            set('box-shadow', '0 8px 28px rgba(0,0,0,.16)');
            set('overflow', 'hidden');
            return;
        }
        clearPanelStyle();
        if (edge === 'left') {
            set('order', '1');
            set('border-left', '0');
            set('border-right', '1px solid #e9e9e9');
            const main = document.querySelector('main.get-started-main');
            if (main) main.style.setProperty('order', '2');
        } else {
            const main = document.querySelector('main.get-started-main');
            if (main) main.style.order = '';
        }
    };


    const toggles = document.querySelector('[data-chat-dock-toggles]');
    const picker = document.querySelector('[data-chat-dock-picker]');

    const isOption4 = () => document.body.classList.contains('is-new-chat-placement-option4');

    const readEdge = () => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (edges.has(stored)) return stored;
        } catch {
            // Keep the default dock when storage is blocked.
        }
        return 'right';
    };

    let edge = readEdge();

    const applyEdge = (next, options = {}) => {
        const selected = edges.has(next) ? next : 'right';
        const sameDock = selected === edge && selected !== 'float' && options.toggleUndock;
        edge = sameDock ? 'float' : selected;
        document.body.classList.toggle('is-chat-dock-left', edge === 'left');
        document.body.classList.toggle('is-chat-dock-right', edge === 'right');
        document.body.classList.toggle('is-chat-dock-bottom', edge === 'bottom');
        document.body.classList.toggle('is-chat-dock-float', edge === 'float');
        buttons.forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.chatDockEdge === edge));
        });
        stylePanel();
        if (options.persist !== false) {
            try {
                localStorage.setItem(storageKey, edge);
            } catch {
                // The standalone lab continues without persisted preferences.
            }
        }
    };

    const syncOption4 = (options = {}) => {
        const on = isOption4();
        if (toggles) toggles.hidden = !on;
        if (picker) picker.hidden = !on;
        document.body.classList.toggle('is-chat-dock-enabled', on);
        if (on && options.openPanel && !document.body.classList.contains('is-listing-studio-open')) {
            window.SpacesCopilotPanel?.open?.();
        }
        stylePanel();
    };

    buttons.forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            applyEdge(button.dataset.chatDockEdge, { toggleUndock: true });
        });
    });

    document.addEventListener('spaces-new-chat-placement-changed', event => {
        syncOption4({ openPanel: event.detail?.placement === 'option4' });
    });

    applyEdge(edge, { persist: false });
    syncOption4();

    window.SpacesChatDock = {
        setEdge: applyEdge,
        getEdge: () => edge
    };
})();
