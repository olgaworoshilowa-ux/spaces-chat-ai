(() => {
    'use strict';

    const modal = document.querySelector('[data-usage-modal]');
    const dialog = modal?.querySelector('[data-usage-modal-dialog]');
    if (!modal || !dialog) return;

    let lastFocus = null;

    const closeProfileMenu = () => {
        document.querySelectorAll('[data-header-dropdown].is-open').forEach(item => {
            item.classList.remove('is-open');
            item.querySelector('[data-header-dropdown-trigger]')?.setAttribute('aria-expanded', 'false');
        });
    };

    // Free-plan state from Figma: subscription includes 0 credits.
    const syncFromHeader = () => {
        const leftEl = modal.querySelector('[data-usage-left]');
        const barEl = modal.querySelector('[data-usage-bar]');
        const barWrap = modal.querySelector('[data-usage-bar-wrap]');
        const periodEl = modal.querySelector('[data-usage-period-credits]');
        const messagesEl = modal.querySelector('[data-usage-messages]');

        if (leftEl) leftEl.textContent = '0';
        if (barEl) barEl.style.width = '0%';
        if (barWrap) barWrap.setAttribute('aria-valuenow', '0');
        if (periodEl) periodEl.textContent = '0';
        if (messagesEl) messagesEl.textContent = '0';
    };

    const closeModal = ({ restoreFocus = true } = {}) => {
        if (modal.hidden) return;
        modal.hidden = true;
        document.body.classList.remove('is-usage-modal-open');
        if (restoreFocus && lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
        if (restoreFocus) lastFocus = null;
    };

    const openModal = (trigger) => {
        lastFocus = trigger || document.activeElement;
        closeProfileMenu();
        if (window.SpacesUpgradeModal?.close) window.SpacesUpgradeModal.close({ restoreFocus: false });
        if (window.SpacesBuyCreditsModal?.close) window.SpacesBuyCreditsModal.close({ restoreFocus: false });
        if (window.SpacesCheckoutModal?.close) window.SpacesCheckoutModal.close({ restoreFocus: false });
        syncFromHeader();
        modal.hidden = false;
        document.body.classList.add('is-usage-modal-open');
        modal.querySelector('[data-usage-modal-close]')?.focus();
    };

    document.querySelectorAll('[data-usage-modal-open]').forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            openModal(button);
        });
    });

    modal.querySelectorAll('[data-usage-modal-close]').forEach(node => {
        node.addEventListener('click', event => {
            event.preventDefault();
            closeModal();
        });
    });

    modal.querySelector('[data-usage-buy-credits]')?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        closeModal({ restoreFocus: false });
        window.SpacesBuyCreditsModal?.open(lastFocus);
    });

    modal.querySelector('[data-usage-upgrade]')?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        closeModal({ restoreFocus: false });
        window.SpacesUpgradeModal?.open(lastFocus);
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !modal.hidden) {
            event.preventDefault();
            closeModal();
        }
    });

    window.SpacesUsageModal = { open: openModal, close: closeModal };
})();
