(() => {
    'use strict';

    const home = document.querySelector('[data-home-page]');
    const homeThread = home?.querySelector('[data-home-thread]');
    const homeDock = home?.querySelector('[data-home-widget-dock]');
    const input = home?.querySelector('[data-home-composer-input]');
    const placeholder = home?.querySelector('[data-home-composer-placeholder]');
    const panel = document.querySelector('[data-copilot-panel]');
    const panelThread = panel?.querySelector('[data-copilot-thread]');
    const panelDock = panel?.querySelector('[data-copilot-widget-dock]');
    const panelEmpty = panel?.querySelector('[data-copilot-empty]');
    const panelInput = panel?.querySelector('[data-copilot-input]');
    const includeOptions = [
        { id: 'photos', label: 'Photos from this home' },
        { id: 'floor-plan', label: 'Floor plan' },
        { id: 'tour', label: 'Home tour' },
        { id: 'branding', label: 'Branding' },
        { id: 'deal', label: 'Price and deal' }
    ];
    const dealOptions = [
        { id: 'For sale', label: 'For sale' },
        { id: 'For rent', label: 'For rent' }
    ];
    const DEFAULT_DESCRIPTION =
        'A quiet, light-filled home — four bedrooms, a south garden, and a kitchen that actually gets used.';
    const defaultPlaceholder = placeholder?.innerHTML || '';
    let listingNeedsSpace = false;
    let listingStep = 'idle';
    let listingInclude = [];
    let listingDeal = 'For sale';
    let listingNote = '';
    let listingDescription = '';
    let listingPhotos = [];
    let listingSourceUrl = '';
    let listingSourceSite = '';
    let listingSpaceId = '';
    let listingSpaceTitle = '';
    let listingSpaceIsNew = false;
    let availableSpaces = [];
    let availableFloorPlans = [];
    let listingFromTemplate = false;
    let furnishStyle = '';
    let furnishBudget = '';
    let furnishPlanId = '';
    let furnishPlanTitle = '';
    let furnishPlanIsNew = false;
    let starting = false;
    let skipNavEnd = false;
    let chatSurface = 'home';

    if (!home || !homeThread || !homeDock) return;

    const isListingJob = text => String(text || '').trim().toLowerCase() === 'turn this home into a listing';
    const isFurnishJob = text => /furnish|plan a living room/i.test(String(text || ''));
    const FURNISH_PLAN_IMAGE = './assets/images/spaces-v2/inside-section-file.webp';
    const styleOptions = [
        { id: 'scandinavian', label: 'Scandinavian' },
        { id: 'modern', label: 'Modern' },
        { id: 'minimal', label: 'Minimal' },
        { id: 'japandi', label: 'Japandi' },
        { id: 'classic', label: 'Classic' }
    ];
    const budgetOptions = [
        { id: 'under-2k', label: 'Under $2,000' },
        { id: '2-5k', label: '$2,000 – $5,000' },
        { id: '5-10k', label: '$5,000 – $10,000' },
        { id: '10k-plus', label: '$10,000+' }
    ];
    const isPanelSurface = () => chatSurface === 'panel';
    const thread = () => (isPanelSurface() ? panelThread : homeThread);
    const dock = () => (isPanelSurface() ? panelDock : homeDock);
    const isActive = () => {
        if (isPanelSurface()) return Boolean(panel && !panel.hidden && listingStep !== 'idle');
        return home.classList.contains('is-centered-chat');
    };
    const prepareOpen = () => {
        skipNavEnd = true;
    };
    const activeWidget = () => dock()?.querySelector('.spaces-home-widget:not(.is-complete)');
    const syncPanelShell = () => {
        if (!isPanelSurface()) return;
        if (panelEmpty) panelEmpty.hidden = true;
        if (panelThread) panelThread.hidden = false;
        if (panelDock) panelDock.hidden = !panelDock.children.length;
    };

    const clearSurface = (surfaceNode, dockNode, { hide = true } = {}) => {
        if (surfaceNode) {
            surfaceNode.replaceChildren();
            surfaceNode.hidden = hide;
        }
        if (dockNode) {
            dockNode.replaceChildren();
            dockNode.hidden = true;
        }
    };

    const activateSurface = surface => {
        chatSurface = surface === 'panel' ? 'panel' : 'home';
        const homeVisible = Boolean(home && !home.hidden);
        if (isPanelSurface() && homeVisible) {
            chatSurface = 'home';
        }
        if (isPanelSurface()) {
            home.classList.remove('is-centered-chat');
            clearSurface(homeThread, homeDock, { hide: true });
            window.SpacesCopilotPanel?.open?.();
            clearSurface(panelThread, panelDock, { hide: false });
            syncPanelShell();
            return;
        }
        window.SpacesCopilotPanel?.hide?.();
        home.classList.add('is-centered-chat');
        clearSurface(homeThread, homeDock, { hide: false });
        if (panelThread) {
            panelThread.replaceChildren();
            panelThread.hidden = true;
        }
        if (panelDock) {
            panelDock.replaceChildren();
            panelDock.hidden = true;
        }
        if (panelEmpty) panelEmpty.hidden = false;
    };


    const svg = html => {
        const wrap = document.createElement('span');
        wrap.className = 'spaces-home-widget-icon';
        wrap.setAttribute('aria-hidden', 'true');
        wrap.innerHTML = html;
        return wrap;
    };

    const backIcon = () => svg(
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3.5L5 8l5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    );
    const closeIcon = () => svg(
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
    );
    const arrowIcon = () => svg(
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3.5L11 8l-5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    );
    const pencilIcon = () => svg(
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.4 2.1l2.5 2.5-7.2 7.2H2.2V9.3L9.4 2.1z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8.3 3.2l2.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'
    );
    const checkIcon = () => svg(
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7.2l2.6 2.6L11 4.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    );

    const scrollThread = () => {
        const node = thread();
        if (!node) return;
        node.scrollTop = node.scrollHeight;
        if (isPanelSurface()) {
            const body = panel?.querySelector('.spaces-copilot-panel-body');
            if (body) body.scrollTop = body.scrollHeight;
        }
    };

    const syncDock = () => {
        const node = dock();
        if (!node) return;
        node.hidden = !node.children.length;
    };

    const restorePlaceholder = () => {
        if (placeholder) placeholder.innerHTML = defaultPlaceholder;
    };

    const messageActions = (text, role) => {
        const bar = document.createElement('div');
        bar.className = 'spaces-home-message-actions';
        const items = role === 'user'
            ? [
                ['copy', 'Copy', 'copy.svg'],
                ['edit', 'Edit', 'edit.svg']
            ]
            : [
                ['copy', 'Copy', 'copy.svg'],
                ['down', 'Bad response', 'thumbs-down.svg'],
                ['up', 'Good response', 'thumbs-up.svg'],
                ['repeat', 'Try again', 'repeat.svg']
            ];
        items.forEach(([name, label, file]) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'spaces-home-message-action';
            button.dataset.action = name;
            button.setAttribute('aria-label', label);
            if (name === 'up' || name === 'down') button.setAttribute('aria-pressed', 'false');
            const icon = document.createElement('img');
            icon.src = `./assets/images/spaces-v2/chat-actions/${file}`;
            icon.width = 12;
            icon.height = 12;
            icon.alt = '';
            icon.setAttribute('aria-hidden', 'true');
            button.append(icon);
            bar.append(button);
        });
        bar.addEventListener('click', event => {
            const button = event.target.closest('[data-action]');
            if (!button) return;
            const action = button.dataset.action;
            if (action === 'copy') {
                const done = () => {
                    button.classList.add('is-active');
                    window.setTimeout(() => button.classList.remove('is-active'), 1200);
                };
                if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
                else done();
                return;
            }
            if (action === 'up' || action === 'down') {
                const turnOn = !button.classList.contains('is-active');
                bar.querySelectorAll('[data-action="up"], [data-action="down"]').forEach(el => {
                    const active = turnOn && el === button;
                    el.classList.toggle('is-active', active);
                    el.setAttribute('aria-pressed', active ? 'true' : 'false');
                });
                return;
            }
            if (action === 'edit') {
                const bubble = bar.closest('.spaces-home-message, .spaces-copilot-message');
                const prompt = bubble?.querySelector(':scope > p')?.textContent?.trim() || text;
                const target = isPanelSurface() ? panelInput : input;
                if (!target || !prompt) return;
                target.value = prompt;
                target.dispatchEvent(new Event('input', { bubbles: true }));
                target.focus();
                const end = target.value.length;
                target.setSelectionRange?.(end, end);
                return;
            }
            if (action === 'repeat') {
                const bubble = bar.closest('.spaces-home-message, .spaces-copilot-message');
                let sibling = bubble?.previousElementSibling;
                while (sibling && !sibling.matches('.is-user')) sibling = sibling.previousElementSibling;
                const prompt = sibling?.querySelector('p')?.textContent?.trim();
                const target = isPanelSurface() ? panelInput : input;
                if (!target || !prompt) return;
                target.value = prompt;
                target.dispatchEvent(new Event('input', { bubbles: true }));
                target.focus();
            }
        });
        return bar;
    };

    const markLatestActions = () => {
        const node = thread();
        if (!node) return;
        const rows = [...node.querySelectorAll('.spaces-home-message.is-assistant, .spaces-copilot-message.is-assistant')]
            .filter(el => el.querySelector('.spaces-home-message-actions'));
        rows.forEach(el => el.classList.remove('is-actions-visible'));
        rows.at(-1)?.classList.add('is-actions-visible');
    };

    const appendMessage = (role, text) => {
        const node = thread();
        if (!node) return null;
        const bubble = document.createElement('div');
        bubble.className = isPanelSurface()
            ? `spaces-copilot-message is-${role}`
            : `spaces-home-message is-${role}`;
        if (text) {
            const body = document.createElement('p');
            body.textContent = text;
            bubble.append(body);
            bubble.append(messageActions(text, role));
        }
        node.append(bubble);
        node.hidden = false;
        markLatestActions();
        syncPanelShell();
        scrollThread();
        window.SpacesAiChats?.syncFromListing?.();
        return bubble;
    };

    const clearInput = () => {
        const target = isPanelSurface() ? panelInput : input;
        if (!target) return;
        target.value = '';
        target.style.height = 'auto';
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.focus();
    };

    const includeSummary = () => {
        if (listingNote) return listingNote;
        const labels = listingInclude
            .map(id => includeOptions.find(option => option.id === id)?.label)
            .filter(Boolean);
        return labels.length ? labels.join(', ') : 'Photos from this home';
    };

    const clearListingPhotos = () => {
        listingPhotos.forEach(photo => {
            if (photo.url) URL.revokeObjectURL(photo.url);
        });
        listingPhotos = [];
    };

    const photosSummary = () => {
        if (!listingPhotos.length) return 'No photos yet';
        if (listingPhotos.length === 1) return listingPhotos[0].name || '1 photo';
        return `${listingPhotos.length} photos`;
    };

    const settleWidget = (widget, answer) => {
        widget.classList.add('is-complete');
        widget.querySelectorAll('button, input').forEach(el => {
            el.disabled = true;
        });
        const answerLine = document.createElement('p');
        answerLine.className = 'spaces-home-widget-answer';
        answerLine.textContent = answer;
        widget.append(answerLine);
        const bubble = document.createElement('div');
        bubble.className = isPanelSurface()
            ? 'spaces-copilot-message is-assistant'
            : 'spaces-home-message is-assistant';
        bubble.append(widget);
        thread()?.append(bubble);
        restorePlaceholder();
        syncDock();
        syncPanelShell();
        scrollThread();
        window.SpacesAiChats?.syncFromListing?.();
    };

    const createWidget = ({ index, title, subtitle, multi, withContinue, otherLabel, otherPlaceholder, onPick, onSkip, onClose, onBack, showOther = true, showSkip = true, showProgress = Boolean(index), progressTotal }) => {
        const widget = document.createElement('div');
        widget.className = 'spaces-home-widget';
        if (multi) widget.classList.add('is-multi');

        const header = document.createElement('div');
        header.className = 'spaces-home-widget-header';
        const headingGroup = document.createElement('div');
        headingGroup.className = 'spaces-home-widget-heading';
        if (onBack) {
            const back = document.createElement('button');
            back.type = 'button';
            back.className = 'spaces-home-widget-back';
            back.setAttribute('aria-label', 'Back');
            back.append(backIcon());
            back.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                onBack(widget);
            });
            headingGroup.append(back);
        }
        const heading = document.createElement('p');
        heading.className = 'spaces-home-widget-title';
        heading.textContent = title;
        const headingCopy = document.createElement('div');
        headingCopy.className = 'spaces-home-widget-heading-copy';
        headingCopy.append(heading);
        if (subtitle) {
            const note = document.createElement('p');
            note.className = 'spaces-home-widget-subtitle';
            note.textContent = subtitle;
            headingCopy.append(note);
        }
        headingGroup.append(headingCopy);
        const meta = document.createElement('div');
        meta.className = 'spaces-home-widget-meta';
        if (showProgress) {
            const progress = document.createElement('span');
            progress.className = 'spaces-home-widget-progress';
            progress.textContent = `${index} of ${progressTotal || (listingNeedsSpace ? 5 : 4)}`;
            meta.append(progress);
        }
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'spaces-home-widget-close';
        close.setAttribute('aria-label', 'Close');
        close.append(closeIcon());
        close.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            onClose(widget);
        });
        meta.append(close);
        header.append(headingGroup, meta);

        const list = document.createElement('div');
        list.className = 'spaces-home-widget-options';

        let other = null;
        if (showOther) {
            other = document.createElement('label');
            other.className = 'spaces-home-widget-option is-other';
            const otherBadge = document.createElement('span');
            otherBadge.className = 'spaces-home-widget-index is-icon';
            otherBadge.append(pencilIcon());
            const otherCopy = document.createElement('span');
            otherCopy.className = 'spaces-home-widget-copy';
            const otherTitle = document.createElement('span');
            otherTitle.className = 'spaces-home-widget-option-title';
            otherTitle.textContent = otherLabel || 'Something else';
            const otherField = document.createElement('input');
            otherField.type = 'text';
            otherField.className = 'spaces-home-widget-other-input';
            otherField.placeholder = otherPlaceholder || 'Type your own answer';
            otherField.autocomplete = 'off';
            otherCopy.append(otherTitle, otherField);
            other.append(otherBadge, otherCopy, arrowIcon());
            other.addEventListener('click', event => {
                if (event.target === otherField) return;
                event.preventDefault();
                other.classList.add('is-editing');
                otherField.focus();
            });
            otherField.addEventListener('keydown', event => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                event.stopPropagation();
                const value = otherField.value.trim();
                if (!value) return;
                onPick(widget, { other: value });
            });
        }

        const skip = document.createElement('button');
        skip.type = 'button';
        skip.className = 'spaces-home-widget-skip';
        skip.textContent = 'Skip';
        skip.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            onSkip(widget);
        });

        const actions = document.createElement('div');
        actions.className = 'spaces-home-widget-actions';
        if (showSkip !== false) actions.append(skip);

        let submit = null;
        if (multi || withContinue) {
            submit = document.createElement('button');
            submit.type = 'button';
            submit.className = 'spaces-home-widget-continue';
            submit.textContent = 'Continue';
            submit.disabled = true;
            submit.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                onPick(widget, {
                    other: other?.querySelector('.spaces-home-widget-other-input')?.value.trim() || ''
                });
            });
            actions.append(submit);
        }

        widget.append(header, list, actions);
        return { widget, list, other, submit };
    };

    const optionButton = (option, index, onClick, { multi } = {}) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'spaces-home-widget-option';
        button.setAttribute('aria-pressed', 'false');
        const badge = document.createElement('span');
        badge.className = 'spaces-home-widget-index';
        badge.textContent = String(index);
        const title = document.createElement('span');
        title.className = 'spaces-home-widget-option-title';
        title.textContent = option.label;
        button.append(badge, title, multi ? checkIcon() : arrowIcon());
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            onClick(button);
        });
        return button;
    };

    const showWidget = widget => {
        const node = dock();
        if (!node) return;
        node.append(widget);
        node.hidden = false;
        restorePlaceholder();
        syncPanelShell();
        scrollThread();
    };

    const hasListingInput = () => Boolean(
        listingPhotos.length || listingDescription.trim() || listingInclude.length || listingNote
    );

    const useFilledTemplate = () => {
        listingFromTemplate = true;
        listingInclude = includeOptions.map(option => option.id);
        listingDeal = listingDeal || 'For sale';
        if (!listingDescription.trim()) listingDescription = DEFAULT_DESCRIPTION;
    };

    const openListingDraft = (options = {}) => {
        const include = listingFromTemplate || listingInclude.length
            ? listingInclude
            : ['photos', 'floor-plan', 'tour', 'branding', 'deal'];
        if (listingPhotos.length && !include.includes('photos')) include.push('photos');
        window.SpacesListingStudio?.open({
            copilot: false,
            photos: listingPhotos.length || (include.includes('photos') ? 8 : 0),
            deal: listingDeal,
            include,
            template: listingFromTemplate,
            sourceUrl: listingSourceUrl,
            sourceSite: listingSourceSite,
            spaceId: listingSpaceId,
            spaceTitle: listingSpaceTitle,
            spaceIsNew: listingSpaceIsNew,
            description: listingDescription || DEFAULT_DESCRIPTION,
            mode: options.mode === 'preview' ? 'preview' : 'edit'
        });
    };

    const escapeAttr = value => String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');

    const nextActionList = () => listingFromTemplate
        ? [
            { id: 'edit', label: 'Edit this listing' },
            { id: 'photos', label: 'Add photos from this home' },
            { id: 'tour', label: 'Create a home tour' }
        ]
        : [
            { id: 'edit', label: 'Edit this listing' },
            { id: 'tour', label: 'Create a home tour' },
            { id: 'stage', label: 'Stage the living room for buyers' }
        ];

    const nextActionFromText = value => {
        const text = String(value || '').toLowerCase();
        if (/edit/.test(text)) return 'edit';
        if (/photo/.test(text)) return 'photos';
        if (/tour/.test(text)) return 'tour';
        if (/stage/.test(text)) return 'stage';
        return '';
    };

    const applyNextAction = (id, extra = {}) => {
        if (listingStep !== 'ready' && listingStep !== 'followup') return;
        const action = nextActionList().find(item => item.id === id);
        const label = action?.label || extra.other || 'Continue';
        const card = extra.card || activeWidget();
        if (card) settleWidget(card, label);
        listingStep = 'followup';
        if (id === 'edit' || id === 'photos') {
            if (id === 'photos' && !listingInclude.includes('photos')) {
                listingInclude = [...listingInclude, 'photos'];
            }
            appendMessage(
                'assistant',
                id === 'photos'
                    ? 'I’ll open the listing so you can add this home’s real photos in place of the template shots.'
                    : listingFromTemplate
                        ? 'Opening the listing so you can replace the template details.'
                        : 'Opening the listing so you can review and edit the draft.'
            );
            openListingDraft();
            return;
        }
        if (id === 'tour') {
            appendMessage('assistant', 'I can turn the listing photos into a walkthrough. Open Edit to start the tour, or send room photos and I’ll place them in order.');
            return;
        }
        if (id === 'stage') {
            appendMessage('assistant', 'I’ll stage the living room for buyers — brighter seating, less clutter, and a clear path to the garden. Add a living-room photo and I’ll apply it.');
            return;
        }
        appendMessage('assistant', extra.other
            ? `I’ll work on that next: ${extra.other}`
            : 'I added that to the listing draft. Open Edit whenever you want to review the page.');
    };

    const appendNextSteps = () => {
        listingStep = 'ready';
        const { widget, list } = createWidget({
            title: listingFromTemplate
                ? 'This is still a template. Here’s what I’d do next:'
                : 'The draft is ready. Here’s what I’d do next:',
            showOther: false,
            showProgress: false,
            onPick: () => {},
            onSkip: widgetNode => {
                settleWidget(widgetNode, 'Skipped');
                listingStep = 'followup';
            },
            onClose: widgetNode => {
                settleWidget(widgetNode, 'Skipped');
                listingStep = 'followup';
            }
        });
        nextActionList().forEach((action, index) => {
            list.append(optionButton(action, index + 1, () => {
                if (listingStep !== 'ready' || widget.classList.contains('is-complete')) return;
                applyNextAction(action.id, { card: widget });
            }));
        });
        showWidget(widget);
    };

    const appendListingPreview = () => {
        listingStep = 'ready';
        const isTemplate = listingFromTemplate;
        appendMessage(
            'assistant',
            isTemplate
                ? 'You skipped the questions, so I filled an example listing. This is a template — not this home’s real details yet.'
                : 'Here’s a draft listing you can open and edit.'
        );
        const card = document.createElement('article');
        card.className = 'spaces-home-listing-card';
        if (isTemplate) card.classList.add('is-template');
        card.innerHTML = `
            <div class="spaces-home-listing-card-media">
                <figure class="is-hero"><img src="../listings-final/photos/villa.jpg" alt=""></figure>
                <figure class="is-top"><img src="../listings-final/photos/facade.jpg" alt=""></figure>
                <figure class="is-bottom"><img src="../listings-final/photos/kitchen.jpg" alt=""></figure>
            </div>
            <div class="spaces-home-listing-card-body">
                ${isTemplate ? '<p class="spaces-home-listing-card-template">This is a template</p>' : ''}
                <p class="spaces-home-listing-card-deal"></p>
                <h2>23 Ann Politkovskaya Street</h2>
                <p class="spaces-home-listing-card-meta">23 Ann Politkovskaya Street, Dublin · ${listingDeal === 'For rent' ? '$4,000' : '$1,250,000'}</p>
                <p class="spaces-home-listing-card-copy"></p>
                ${listingSourceUrl ? `<a class="spaces-home-listing-card-source" href="${escapeAttr(listingSourceUrl)}" target="_blank" rel="noopener noreferrer">From ${escapeAttr(listingSourceSite || 'existing listing')}</a>` : ''}
                <div class="spaces-home-listing-card-actions">
                    <button type="button" class="spaces-home-listing-link" data-listing-action="edit">Edit</button>
                    <button type="button" class="spaces-home-listing-link is-secondary" data-listing-action="preview">Preview</button>
                </div>
            </div>
        `;
        card.querySelector('.spaces-home-listing-card-deal').textContent = listingDeal;
        card.querySelector('.spaces-home-listing-card-copy').textContent =
            listingDescription.trim() || DEFAULT_DESCRIPTION;
        const bubble = document.createElement('div');
        bubble.className = isPanelSurface()
            ? 'spaces-copilot-message is-assistant'
            : 'spaces-home-message is-assistant';
        bubble.append(card);
        thread()?.append(bubble);
        syncDock();
        syncPanelShell();
        scrollThread();
        window.SpacesAiChats?.syncFromListing?.();
        window.SpacesAiChats?.syncChatHeader?.();
        window.setTimeout(appendNextSteps, 180);
    };

    const finishPhotos = (widget, { skipped } = {}) => {
        if (listingStep !== 'photos') return;
        listingFromTemplate = false;
        if (listingPhotos.length) {
            if (!listingInclude.includes('photos')) listingInclude = [...listingInclude, 'photos'];
            settleWidget(widget, photosSummary());
        } else {
            settleWidget(widget, skipped ? 'Skipped' : 'No photos yet');
        }
        window.setTimeout(appendDescriptionWidget, 180);
    };

    const finishDescription = (widget, extra = {}) => {
        if (listingStep !== 'description') return;
        const value = String(extra.other || listingDescription || '').trim();
        if (!value) {
            appendMessage('assistant', 'Add a short description — a few sentences about the home is enough.');
            return;
        }
        listingDescription = value;
        listingFromTemplate = false;
        settleWidget(widget, value.length > 72 ? `${value.slice(0, 71)}…` : value);
        window.setTimeout(appendDealWidget, 180);
    };

    const skipDescription = widget => {
        if (listingStep !== 'description') return;
        listingDescription = listingDescription.trim() || DEFAULT_DESCRIPTION;
        settleWidget(widget, 'Skipped');
        window.setTimeout(appendDealWidget, 180);
    };

    const finishDeal = (widget, extra = {}) => {
        if (listingStep !== 'deal') return;
        if (extra.other) {
            listingDeal = /\brent/.test(extra.other.toLowerCase()) ? 'For rent' : extra.other;
        } else {
            listingDeal = listingDeal || 'For sale';
        }
        listingFromTemplate = false;
        settleWidget(widget, listingDeal);
        window.setTimeout(appendListingPreview, 180);
    };

    const skipToTemplate = widget => {
        useFilledTemplate();
        settleWidget(widget, 'Skipped');
        window.setTimeout(appendListingPreview, 180);
    };

    const skipAll = widget => {
        if (listingStep === 'furnish-plan') {
            finishFurnishPlan(widget, { skipped: true });
            return;
        }
        if (listingStep === 'furnish-style') {
            finishFurnishStyle(widget, { skipped: true });
            return;
        }
        if (listingStep === 'furnish-budget') {
            finishFurnishBudget(widget, { skipped: true });
            return;
        }
        skipToTemplate(widget);
    };

    const furnishProjectTitle = () => {
        const prompt = firstUserTitle();
        const match = /in (?:the )?(.+)$/i.exec(prompt);
        return match?.[1]?.trim() || scopedSpaceTitle() || 'New Project 1';
    };

    const furnishRoomLabel = () => {
        const prompt = firstUserTitle();
        if (/living room/i.test(prompt)) return 'living room';
        if (/bedroom/i.test(prompt)) return 'bedroom';
        return 'room';
    };

    const furnishRoomTitle = () => {
        const room = furnishRoomLabel();
        return room.charAt(0).toUpperCase() + room.slice(1);
    };

    const floorPlansForScope = () => {
        const spaceId = scopedSpaceId();
        const spaceTitle = (scopedSpaceTitle() || furnishProjectTitle()).toLowerCase();
        let plans = availableFloorPlans.slice();
        if (spaceId) {
            plans = plans.filter(file => String(file.spaceId) === String(spaceId));
        } else if (spaceTitle) {
            const space = availableSpaces.find(item => String(item.title || '').toLowerCase() === spaceTitle);
            if (space) {
                plans = plans.filter(file => String(file.spaceId) === String(space.id));
            }
        }
        if (!plans.length) plans = availableFloorPlans.slice();
        return plans.slice(0, 6);
    };

    const finishFurnishPlan = (widget, extra = {}) => {
        if (listingStep !== 'furnish-plan') return;
        if (extra.createNew || extra.other || extra.skipped) {
            furnishPlanIsNew = true;
            furnishPlanId = '';
            furnishPlanTitle = String(extra.other || '').trim()
                || (extra.skipped ? `New ${furnishRoomTitle()} plan` : '');
            if (!furnishPlanTitle) {
                appendMessage('assistant', 'Name the new floor plan, or pick an existing one.');
                return;
            }
        } else {
            furnishPlanIsNew = false;
            furnishPlanId = String(extra.id || furnishPlanId || '');
            furnishPlanTitle = String(extra.title || furnishPlanTitle || 'Floor plan');
        }
        settleWidget(
            widget,
            furnishPlanIsNew ? `Create new · ${furnishPlanTitle}` : furnishPlanTitle
        );
        window.setTimeout(appendFurnishStyleWidget, 180);
    };

    const appendFurnishPlanWidget = ({ restore } = {}) => {
        listingStep = 'furnish-plan';
        if (!restore) {
            furnishPlanId = '';
            furnishPlanTitle = '';
            furnishPlanIsNew = false;
        }
        const room = furnishRoomLabel();
        const { widget, list, other, submit } = createWidget({
            index: 1,
            progressTotal: 3,
            title: 'Where to add a living room',
            subtitle: `Pick a floor plan in ${furnishProjectTitle()}, or create a new one for this ${room}.`,
            withContinue: true,
            otherLabel: 'Create a new floor plan',
            otherPlaceholder: 'Name your new floor plan',
            onPick: (node, extra = {}) => finishFurnishPlan(node, { createNew: true, other: extra.other }),
            onSkip: node => finishFurnishPlan(node, { skipped: true }),
            onClose: skipAll,
            showSkip: true
        });

        const plans = floorPlansForScope();
        const buttons = plans.map(plan => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'spaces-home-widget-option is-space';
            button.setAttribute('aria-pressed', 'false');
            button.dataset.planId = plan.id;
            const badge = document.createElement('span');
            badge.className = 'spaces-home-widget-plan-thumb';
            badge.setAttribute('aria-hidden', 'true');
            if (plan.previewUrl) {
                const img = document.createElement('img');
                img.src = plan.previewUrl;
                img.alt = '';
                badge.append(img);
            } else {
                badge.textContent = 'P';
            }
            const title = document.createElement('span');
            title.className = 'spaces-home-widget-option-title';
            title.textContent = plan.title || 'Floor plan';
            button.append(badge, title, arrowIcon());
            button.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                finishFurnishPlan(widget, { id: plan.id, title: plan.title });
            });
            if (restore && !furnishPlanIsNew && String(furnishPlanId) === String(plan.id)) {
                button.classList.add('is-selected');
                button.setAttribute('aria-pressed', 'true');
            }
            return button;
        });

        if (other) {
            const field = other.querySelector('.spaces-home-widget-other-input');
            if (restore && furnishPlanIsNew) {
                other.classList.add('is-editing', 'is-selected');
                if (field && furnishPlanTitle && !/^New .+ plan$/i.test(furnishPlanTitle)) {
                    field.value = furnishPlanTitle;
                }
            }
        }

        list.append(...buttons, other);
        const nameField = other?.querySelector('.spaces-home-widget-other-input');
        const syncContinue = () => {
            if (submit) submit.disabled = !String(nameField?.value || '').trim();
        };
        nameField?.addEventListener('input', syncContinue);
        syncContinue();
        showWidget(widget);
    };

    const appendFurnishStyleWidget = ({ restore } = {}) => {
        listingStep = 'furnish-style';
        if (!restore) furnishStyle = '';
        const room = furnishRoomLabel();
        const planLabel = furnishPlanTitle || furnishProjectTitle();
        const { widget, list } = createWidget({
            index: 2,
            progressTotal: 3,
            title: '2. Choose a style',
            subtitle: `I’ll plan the ${room} in ${planLabel} in this look.`,
            showOther: false,
            onPick: finishFurnishStyle,
            onSkip: node => finishFurnishStyle(node, { skipped: true }),
            onClose: skipAll,
            onBack: goBackToPrevious
        });
        list.append(...styleOptions.map((option, index) => optionButton(option, index + 1, () => {
            furnishStyle = option.label;
            finishFurnishStyle(widget);
        })));
        if (restore && furnishStyle) {
            [...list.querySelectorAll('.spaces-home-widget-option')].forEach(button => {
                const selected = button.querySelector('.spaces-home-widget-option-title')?.textContent === furnishStyle;
                button.classList.toggle('is-selected', selected);
                button.setAttribute('aria-pressed', String(selected));
            });
        }
        showWidget(widget);
    };

    const finishFurnishStyle = (widget, extra = {}) => {
        if (listingStep !== 'furnish-style') return;
        if (extra.skipped && !furnishStyle) furnishStyle = 'Modern';
        if (extra.other) furnishStyle = String(extra.other).trim() || furnishStyle;
        if (!furnishStyle) {
            appendMessage('assistant', 'Pick a style, or Skip to use Modern.');
            return;
        }
        settleWidget(widget, furnishStyle);
        window.setTimeout(appendFurnishBudgetWidget, 180);
    };

    const appendFurnishBudgetWidget = ({ restore } = {}) => {
        listingStep = 'furnish-budget';
        if (!restore) furnishBudget = '';
        const { widget, list } = createWidget({
            index: 3,
            progressTotal: 3,
            title: '3. Choose a budget',
            subtitle: 'I’ll keep the pieces in this range.',
            showOther: false,
            onPick: finishFurnishBudget,
            onSkip: node => finishFurnishBudget(node, { skipped: true }),
            onClose: skipAll,
            onBack: goBackToPrevious
        });
        list.append(...budgetOptions.map((option, index) => optionButton(option, index + 1, () => {
            furnishBudget = option.label;
            finishFurnishBudget(widget);
        })));
        if (restore && furnishBudget) {
            [...list.querySelectorAll('.spaces-home-widget-option')].forEach(button => {
                const selected = button.querySelector('.spaces-home-widget-option-title')?.textContent === furnishBudget;
                button.classList.toggle('is-selected', selected);
                button.setAttribute('aria-pressed', String(selected));
            });
        }
        showWidget(widget);
    };

    const finishFurnishBudget = (widget, extra = {}) => {
        if (listingStep !== 'furnish-budget') return;
        if (extra.skipped && !furnishBudget) furnishBudget = '$2,000 – $5,000';
        if (extra.other) furnishBudget = String(extra.other).trim() || furnishBudget;
        if (!furnishBudget) {
            appendMessage('assistant', 'Pick a budget, or Skip to use $2,000 – $5,000.');
            return;
        }
        settleWidget(widget, furnishBudget);
        window.setTimeout(appendFurnishPlan, 180);
    };

    const appendFurnishNextSteps = () => {
        listingStep = 'furnish-ready';
        const room = furnishRoomLabel();
        const { widget, list } = createWidget({
            title: 'What would you like to refine next?',
            showOther: false,
            showProgress: false,
            onPick: () => {},
            onSkip: widgetNode => {
                settleWidget(widgetNode, 'Skipped');
                listingStep = 'furnish-followup';
            },
            onClose: widgetNode => {
                settleWidget(widgetNode, 'Skipped');
                listingStep = 'furnish-followup';
            }
        });
        const actions = [
            { id: 'layout', label: 'Move the furniture layout' },
            { id: 'style', label: 'Try a different style' },
            { id: 'pieces', label: 'Swap furniture pieces' },
            { id: 'lighting', label: `Add lighting to the ${room}` },
            { id: 'edit', label: 'Open in the floor plan editor' }
        ];
        actions.forEach((action, index) => {
            list.append(optionButton(action, index + 1, () => {
                if (listingStep !== 'furnish-ready' || widget.classList.contains('is-complete')) return;
                settleWidget(widget, action.label);
                listingStep = 'furnish-followup';
                if (action.id === 'edit') {
                    appendMessage('assistant', 'Opening the floor plan editor so you can move furniture around.');
                    openFloorPlanEditor();
                    return;
                }
                if (action.id === 'style') {
                    appendMessage('assistant', 'Sure — pick a new style and I’ll restyle the room.');
                    window.setTimeout(appendFurnishStyleWidget, 180);
                    return;
                }
                if (action.id === 'layout') {
                    appendMessage(
                        'assistant',
                        'Tell me what to move — sofa closer to the window, larger rug, clearer walkway — and I’ll adjust the layout here.'
                    );
                    return;
                }
                if (action.id === 'pieces') {
                    appendMessage(
                        'assistant',
                        'Which pieces should change? Sofa, coffee table, shelving, or something else?'
                    );
                    return;
                }
                appendMessage(
                    'assistant',
                    `I can add warm floor lamps and softer accent light to the ${room}. Tell me bright, cozy, or both.`
                );
            }));
        });
        showWidget(widget);
    };

    const appendFurnishPlan = () => {
        listingStep = 'furnish-ready';
        const project = furnishPlanTitle || furnishProjectTitle();
        const room = furnishRoomLabel();
        const roomTitle = furnishRoomTitle();
        appendMessage(
            'assistant',
            `Here’s a ${room} layout for ${project} — ${furnishStyle.toLowerCase()} pieces within ${furnishBudget}. Open the editor when you want to fine-tune placement.`
        );
        const card = document.createElement('article');
        card.className = 'spaces-home-listing-card spaces-home-plan-card';
        card.innerHTML = `
            <div class="spaces-home-plan-card-media">
                <img src="${FURNISH_PLAN_IMAGE}" alt="${roomTitle} floor plan">
            </div>
            <div class="spaces-home-listing-card-body">
                <p class="spaces-home-listing-card-deal">Floor plan</p>
                <h2>${roomTitle} · ${project}</h2>
                <p class="spaces-home-listing-card-meta">${furnishStyle} · ${furnishBudget}</p>
                <div class="spaces-home-listing-card-actions">
                    <button type="button" class="spaces-home-listing-link" data-furnish-action="edit">Edit in editor</button>
                </div>
            </div>
        `;
        const bubble = document.createElement('div');
        bubble.className = isPanelSurface()
            ? 'spaces-copilot-message is-assistant'
            : 'spaces-home-message is-assistant';
        bubble.append(card);
        thread()?.append(bubble);
        syncDock();
        syncPanelShell();
        scrollThread();
        window.SpacesAiChats?.syncFromListing?.();
        window.SpacesAiChats?.syncChatHeader?.();
        window.setTimeout(appendFurnishNextSteps, 180);
    };

    const openFloorPlanEditor = () => {
        prepareOpen();
        const project = furnishPlanTitle || furnishProjectTitle() || scopedSpaceTitle() || 'My Awesome project';
        if (window.SpacesFloorPlanStudio?.open) {
            window.SpacesFloorPlanStudio.open({ project });
            return;
        }
        const spaceButton = window.SpacesSidebarNavigation?.getSelectedSpace?.()
            || window.SpacesSidebarNavigation?.getSpaceButtons?.()?.[0];
        const tree = spaceButton?.closest('[data-space-tree]');
        const floorPlans = [...(tree?.querySelectorAll('.spaces-tree-item') || [])]
            .find(item => /floor plans/i.test(item.textContent || ''));
        if (floorPlans) {
            window.SpacesSidebarNavigation.selectCollection(floorPlans, { history: true });
            return;
        }
        window.SpacesSidebarNavigation?.selectHome?.({ history: true });
    };

    const beginFurnish = text => {
        activateSurface(chatSurface);
        listingStep = 'furnish-plan';
        furnishStyle = '';
        furnishBudget = '';
        furnishPlanId = '';
        furnishPlanTitle = '';
        furnishPlanIsNew = false;
        restorePlaceholder();
        window.SpacesAiChats?.beginSession?.({
            title: titleFromFurnish(text),
            listing: false,
            spaceTitle: scopedSpaceTitle(),
            spaceId: scopedSpaceId(),
            prompt: text
        });
        appendMessage('user', text);
        appendMessage(
            'assistant',
            `A couple of details before I plan the ${furnishRoomLabel()}.`
        );
        clearInput();
        window.setTimeout(appendFurnishPlanWidget, 180);
    };

    const titleFromFurnish = text => {
        const value = String(text || '').trim();
        if (/plan a living room/i.test(value)) return 'Living room plan';
        return value.length > 42 ? `${value.slice(0, 40)}…` : (value || 'Furnish bedroom');
    };

    const startFurnish = (text, options = {}) => {
        window.SpacesAiChats?.captureCurrent?.();
        starting = true;
        chatSurface = options.surface === 'panel' ? 'panel' : 'home';
        if (!isPanelSurface()) {
            window.SpacesCopilotPanel?.close();
            const main = document.querySelector('.spaces-main-content');
            if (!main?.classList.contains('is-home-page')) {
                window.SpacesSidebarNavigation?.selectHome({ history: true });
            }
        }
        beginFurnish(text || 'Plan a living room in New Project 1');
        window.setTimeout(() => {
            starting = false;
        }, 0);
    };

    const normalizeListingUrl = value => {
        const raw = String(value || '').trim();
        if (!raw) return '';
        try {
            const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
            if (!url.hostname.includes('.')) return '';
            return url.href;
        } catch {
            return '';
        }
    };

    const siteFromUrl = href => {
        try {
            const host = new URL(href).hostname.replace(/^www\./, '').toLowerCase();
            if (host.includes('zillow')) return 'Zillow';
            if (host.includes('realtor')) return 'Realtor.com';
            if (host.includes('daft')) return 'Daft';
            if (host.includes('myhome')) return 'MyHome';
            if (host.includes('rightmove')) return 'Rightmove';
            if (host.includes('redfin')) return 'Redfin';
            return host;
        } catch {
            return '';
        }
    };

    const finishLink = (widget, extra = {}) => {
        if (listingStep !== 'link') return;
        const href = normalizeListingUrl(extra.other || listingSourceUrl);
        if (!href) {
            appendMessage('assistant', 'Paste a full listing link, like a Zillow, Realtor, or Daft URL.');
            return;
        }
        listingSourceUrl = href;
        listingSourceSite = listingSourceSite || siteFromUrl(href);
        listingFromTemplate = false;
        settleWidget(widget, `${listingSourceSite} · ${href}`);
        continueAfterLink();
    };

    const skipLink = widget => {
        if (listingStep !== 'link') return;
        listingSourceUrl = '';
        listingSourceSite = '';
        settleWidget(widget, 'Skipped');
        continueAfterLink();
    };

    const continueAfterLink = () => {
        if (applyCurrentSpace()) {
            listingNeedsSpace = false;
            window.setTimeout(appendPhotosWidget, 180);
            return;
        }
        listingNeedsSpace = true;
        window.setTimeout(appendSpaceWidget, 180);
    };

    const spaceInitial = space => {
        const initial = document.createElement('span');
        initial.className = 'spaces-home-space-initial spaces-home-widget-space-avatar';
        initial.setAttribute('aria-hidden', 'true');
        initial.textContent = space?.initial || String(space?.title || 'S').slice(0, 1).toUpperCase();
        if (space?.avatarColor) initial.style.backgroundColor = space.avatarColor;
        return initial;
    };

    const finishSpace = (widget, extra = {}) => {
        if (listingStep !== 'space') return;
        if (extra.createNew || extra.other) {
            listingSpaceIsNew = true;
            listingSpaceId = '';
            listingSpaceTitle = String(extra.other || '').trim();
            if (!listingSpaceTitle) {
                appendMessage('assistant', 'Name the new space, or pick an existing one.');
                return;
            }
        } else {
            listingSpaceIsNew = false;
            listingSpaceId = String(extra.id || listingSpaceId || '');
            listingSpaceTitle = String(extra.title || listingSpaceTitle || 'Space');
        }
        settleWidget(
            widget,
            listingSpaceIsNew ? `Create new · ${listingSpaceTitle}` : listingSpaceTitle
        );
        window.setTimeout(appendPhotosWidget, 180);
    };

    const skipSpace = widget => {
        if (listingStep !== 'space') return;
        listingSpaceIsNew = true;
        listingSpaceId = '';
        listingSpaceTitle = 'New space';
        settleWidget(widget, 'Skipped');
        window.setTimeout(appendPhotosWidget, 180);
    };

    const appendSpaceWidget = ({ restore } = {}) => {
        listingStep = 'space';
        if (!restore) {
            listingSpaceId = '';
            listingSpaceTitle = '';
            listingSpaceIsNew = false;
        }
        const { widget, list, other, submit } = createWidget({
            index: 2,
            title: 'Choose a space or create a new one',
            subtitle: 'This chat isn’t attached to a space yet. Pick an existing space, or type a name to create one for this listing.',
            withContinue: true,
            otherLabel: 'Create a new space',
            otherPlaceholder: 'Name your new space',
            onPick: (node, extra = {}) => finishSpace(node, { createNew: true, other: extra.other }),
            onSkip: skipSpace,
            onClose: skipAll,
            onBack: goBackToPrevious,
            showSkip: false
        });

        const spaces = availableSpaces.slice(0, 6);
        const buttons = spaces.map(space => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'spaces-home-widget-option is-space';
            button.setAttribute('aria-pressed', 'false');
            button.dataset.spaceId = space.id;
            const badge = spaceInitial(space);
            const title = document.createElement('span');
            title.className = 'spaces-home-widget-option-title';
            title.textContent = space.title;
            button.append(badge, title, arrowIcon());
            button.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                finishSpace(widget, { id: space.id, title: space.title });
            });
            if (restore && !listingSpaceIsNew && String(listingSpaceId) === String(space.id)) {
                button.classList.add('is-selected');
                button.setAttribute('aria-pressed', 'true');
            }
            return button;
        });

        if (other) {
            const field = other.querySelector('.spaces-home-widget-other-input');
            if (restore && listingSpaceIsNew) {
                other.classList.add('is-editing', 'is-selected');
                if (field && listingSpaceTitle && listingSpaceTitle !== 'New space') {
                    field.value = listingSpaceTitle;
                }
            }
        }

        list.append(...buttons, other);
        const nameField = other?.querySelector('.spaces-home-widget-other-input');
        const syncContinue = () => {
            if (submit) submit.disabled = !String(nameField?.value || '').trim();
        };
        nameField?.addEventListener('input', syncContinue);
        syncContinue();
        showWidget(widget);
    };

    const appendLinkWidget = ({ restore } = {}) => {
        listingStep = 'link';
        if (!restore) {
            listingSourceUrl = '';
            listingSourceSite = '';
            appendMessage('assistant', 'A few details before I draft the listing.');
        }
        const { widget, list, other, submit } = createWidget({
            index: 1,
            title: 'Paste a listing link',
            subtitle: 'A public URL from Zillow, Realtor, Daft, or another listing site. I’ll use it to prefill the draft. Skip if you don’t have one.',
            withContinue: true,
            otherLabel: 'Listing URL',
            otherPlaceholder: 'https://…',
            onPick: finishLink,
            onSkip: skipLink,
            onClose: skipAll
        });
        widget.classList.add('is-link-only');
        const field = other.querySelector('.spaces-home-widget-other-input');
        const syncContinue = () => {
            if (submit) submit.disabled = !normalizeListingUrl(field?.value);
        };
        field?.addEventListener('input', syncContinue);
        list.append(other);
        other.classList.add('is-editing');
        if (restore && listingSourceUrl && field) field.value = listingSourceUrl;
        showWidget(widget);
        field?.focus();
        syncContinue();
    };

    const appendDealWidget = ({ restore } = {}) => {
        listingStep = 'deal';
        listingDeal = listingDeal || 'For sale';
        const { widget, list, other } = createWidget({
            index: listingNeedsSpace ? 5 : 4,
            title: 'Is this listing for sale or for rent?',
            onPick: finishDeal,
            onSkip: widgetNode => {
                listingDeal = listingDeal || 'For sale';
                finishDeal(widgetNode);
            },
            onClose: skipAll,
            onBack: goBackToPrevious
        });
        const buttons = dealOptions.map((option, index) => optionButton(option, index + 1, () => {
            listingDeal = option.id;
            finishDeal(widget);
        }));
        if (restore && listingDeal) {
            buttons.forEach((button, index) => {
                const selected = dealOptions[index]?.id === listingDeal;
                button.classList.toggle('is-selected', selected);
                button.setAttribute('aria-pressed', String(selected));
            });
        }
        list.append(...buttons, other);
        showWidget(widget);
    };

    const appendDescriptionWidget = ({ restore } = {}) => {
        listingStep = 'description';
        const { widget, list, submit } = createWidget({
            index: listingNeedsSpace ? 4 : 3,
            title: 'Write a short description of this listing',
            withContinue: true,
            showOther: false,
            onPick: finishDescription,
            onSkip: skipDescription,
            onClose: skipAll,
            onBack: goBackToPrevious
        });
        const fieldWrap = document.createElement('label');
        fieldWrap.className = 'spaces-home-widget-textarea-wrap';
        const field = document.createElement('textarea');
        field.className = 'spaces-home-widget-textarea';
        field.rows = 4;
        field.placeholder = 'Bright 4-bed home with a south garden, open kitchen, and easy commute…';
        field.autocomplete = 'off';
        if (restore && listingDescription) field.value = listingDescription;
        fieldWrap.append(field);
        list.append(fieldWrap);
        const continueButton = submit
            ? (() => {
                const next = submit.cloneNode(true);
                submit.replaceWith(next);
                return next;
            })()
            : null;
        const syncContinue = () => {
            if (continueButton) continueButton.disabled = !field.value.trim();
        };
        field.addEventListener('input', () => {
            listingDescription = field.value;
            syncContinue();
        });
        continueButton?.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            finishDescription(widget, { other: field.value.trim() });
        });
        showWidget(widget);
        syncContinue();
        if (!restore) field.focus();
    };

    const appendPhotosWidget = ({ restore } = {}) => {
        listingStep = 'photos';
        if (!restore) {
            clearListingPhotos();
            listingInclude = [];
            listingNote = '';
            listingDescription = '';
            listingFromTemplate = false;
        }
        const { widget, list, submit } = createWidget({
            index: listingNeedsSpace ? 3 : 2,
            withContinue: true,
            showOther: false,
            onPick: () => finishPhotos(widget),
            onSkip: widgetNode => finishPhotos(widgetNode, { skipped: true }),
            onClose: skipAll,
            onBack: goBackToPrevious
        });

        const upload = document.createElement('div');
        upload.className = 'spaces-home-widget-upload';
        const subtitle = document.createElement('p');
        subtitle.className = 'spaces-home-widget-upload-subtitle';
        subtitle.textContent = 'The shots you want on the page';
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.multiple = true;
        fileInput.hidden = true;
        const dropzone = document.createElement('button');
        dropzone.type = 'button';
        dropzone.className = 'spaces-home-widget-upload-dropzone';
        dropzone.innerHTML = `
            <span class="spaces-home-widget-upload-mark" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <rect x="3.5" y="5.5" width="21" height="17" rx="3" stroke="currentColor" stroke-width="1.6"/>
                    <circle cx="10" cy="11.5" r="1.8" fill="currentColor"/>
                    <path d="M5.5 18.5l5.2-5.2a1.5 1.5 0 012.1 0L17 17.5l1.7-1.7a1.5 1.5 0 012.1 0l3.2 3.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="spaces-home-widget-upload-plus">+</span>
            </span>
            <span class="spaces-home-widget-upload-label">Drop photos here or click to upload</span>
        `;
        const status = document.createElement('p');
        status.className = 'spaces-home-widget-upload-status';
        status.hidden = true;
        const preview = document.createElement('div');
        preview.className = 'spaces-home-widget-upload-preview';

        const addFiles = files => {
            [...files].forEach(file => {
                if (!file.type.startsWith('image/')) return;
                listingPhotos.push({
                    name: file.name,
                    url: URL.createObjectURL(file)
                });
            });
        };

        const continueButton = submit
            ? (() => {
                const next = submit.cloneNode(true);
                submit.replaceWith(next);
                next.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    finishPhotos(widget);
                });
                return next;
            })()
            : null;

        const syncContinue = () => {
            if (continueButton) continueButton.disabled = listingPhotos.length === 0;
            if (listingPhotos.length) {
                status.hidden = false;
                status.textContent = `${listingPhotos.length} photo${listingPhotos.length === 1 ? '' : 's'} ready`;
            } else {
                status.hidden = true;
                status.textContent = '';
            }
        };

        const renderPreview = () => {
            preview.replaceChildren(...listingPhotos.map((photo, index) => {
                const item = document.createElement('figure');
                item.className = 'spaces-home-widget-upload-thumb';
                const img = document.createElement('img');
                img.src = photo.url;
                img.alt = photo.name || `Photo ${index + 1}`;
                const remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'spaces-home-widget-upload-remove';
                remove.setAttribute('aria-label', 'Remove photo');
                remove.textContent = '×';
                remove.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (photo.url) URL.revokeObjectURL(photo.url);
                    listingPhotos = listingPhotos.filter(entry => entry !== photo);
                    renderPreview();
                    syncContinue();
                });
                item.append(img, remove);
                return item;
            }));
            preview.hidden = listingPhotos.length === 0;
        };

        dropzone.addEventListener('click', event => {
            event.preventDefault();
            fileInput.click();
        });
        dropzone.addEventListener('dragenter', event => {
            event.preventDefault();
            dropzone.classList.add('is-dragging');
        });
        dropzone.addEventListener('dragover', event => {
            event.preventDefault();
            dropzone.classList.add('is-dragging');
        });
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('is-dragging');
        });
        dropzone.addEventListener('drop', event => {
            event.preventDefault();
            dropzone.classList.remove('is-dragging');
            addFiles(event.dataTransfer?.files || []);
            renderPreview();
            syncContinue();
        });
        fileInput.addEventListener('change', () => {
            addFiles(fileInput.files || []);
            fileInput.value = '';
            renderPreview();
            syncContinue();
        });

        upload.append(subtitle, dropzone, status, preview, fileInput);
        list.append(upload);
        if (restore) renderPreview();
        else preview.hidden = true;
        showWidget(widget);
        syncContinue();
    };

    const lastSettledBubble = () => [...(thread()?.querySelectorAll('.spaces-home-message.is-assistant, .spaces-copilot-message.is-assistant') || [])]
        .reverse()
        .find(bubble => bubble.querySelector('.spaces-home-widget.is-complete'));

    const reopenLastSettledWidget = () => {
        const bubble = lastSettledBubble();
        const widget = bubble?.querySelector('.spaces-home-widget.is-complete');
        const node = dock();
        if (!bubble || !widget || !node) return false;
        widget.classList.remove('is-complete');
        widget.querySelector('.spaces-home-widget-answer')?.remove();
        widget.querySelectorAll('button, input, textarea, select').forEach(el => {
            el.disabled = false;
        });
        bubble.remove();
        node.append(widget);
        node.hidden = false;
        if (thread()) thread().hidden = false;
        restorePlaceholder();
        syncDock();
        syncPanelShell();
        scrollThread();
        return true;
    };

    const goBackToPrevious = () => {
        const step = listingStep;
        activeWidget()?.remove();
        const reopened = reopenLastSettledWidget();
        if (step === 'photos') listingStep = listingNeedsSpace ? 'space' : 'link';
        else if (step === 'space') listingStep = 'link';
        else if (step === 'description') listingStep = 'photos';
        else if (step === 'deal') listingStep = 'description';
        else if (step === 'furnish-style') listingStep = 'furnish-plan';
        else if (step === 'furnish-budget') listingStep = 'furnish-style';
        if (reopened) {
            window.SpacesAiChats?.syncFromListing?.();
            return;
        }
        if (thread()) thread().hidden = false;
        if (step === 'photos') {
            if (listingNeedsSpace) appendSpaceWidget({ restore: true });
            else appendLinkWidget({ restore: true });
        } else if (step === 'space') appendLinkWidget({ restore: true });
        else if (step === 'description') appendPhotosWidget({ restore: true });
        else if (step === 'deal') appendDescriptionWidget({ restore: true });
        else if (step === 'furnish-style') appendFurnishPlanWidget({ restore: true });
        else if (step === 'furnish-budget') appendFurnishStyleWidget({ restore: true });
    };

    const parseInclude = text => {
        const value = String(text || '').toLowerCase();
        const picked = includeOptions.filter(option => {
            if (option.id === 'photos' && /photo/.test(value)) return true;
            if (option.id === 'floor-plan' && /floor|plan/.test(value)) return true;
            if (option.id === 'tour' && /tour|walkthrough|3d/.test(value)) return true;
            if (option.id === 'branding' && /brand/.test(value)) return true;
            if (option.id === 'deal' && /price|deal/.test(value)) return true;
            return false;
        }).map(option => option.id);
        if (/all|everything/.test(value) || !picked.length) {
            return includeOptions.map(option => option.id);
        }
        return picked;
    };

    const firstUserTitle = () => thread()?.querySelector('.spaces-home-message.is-user p, .spaces-copilot-message.is-user p')?.textContent?.trim() || 'New chat';

    const applyCurrentSpace = () => {
        const id = composerScopeId();
        const title = composerScopeTitle();
        if (!id && !title) {
            listingSpaceId = '';
            listingSpaceTitle = '';
            listingSpaceIsNew = false;
            return false;
        }
        listingSpaceIsNew = false;
        listingSpaceId = id;
        listingSpaceTitle = title || availableSpaces.find(space => String(space.id) === String(id))?.title || '';
        return true;
    };

    const composerScopeTitle = () => {
        const panelOpen = document.body.classList.contains('is-copilot-panel-open');
        const label = (panelOpen
            ? document.querySelector('[data-copilot-scope-label]')
            : home?.querySelector('[data-home-composer-scope-label]')
        )?.textContent?.trim() || '';
        return !label || /^all spaces$/i.test(label) || /^no space$/i.test(label) ? '' : label;
    };

    const composerScopeId = () => {
        try {
            const stored = localStorage.getItem('planner5d-spaces-v2-home-composer-scope');
            return !stored || stored === 'all' ? '' : stored;
        } catch {
            return '';
        }
    };

    const scopedSpaceTitle = () => listingSpaceTitle || composerScopeTitle();

    const scopedSpaceId = () => listingSpaceId || composerScopeId();

    const serialize = () => ({
        title: firstUserTitle(),
        listingStep,
        listingInclude: [...listingInclude],
        listingDeal,
        listingNote,
        listingDescription,
        listingPhotoNames: listingPhotos.map(photo => photo.name),
        listingSourceUrl,
        listingSourceSite,
        listingSpaceId,
        listingSpaceTitle,
        listingSpaceIsNew,
        listingFromTemplate,
        listingNeedsSpace,
        furnishStyle,
        furnishBudget,
        furnishPlanId,
        furnishPlanTitle,
        furnishPlanIsNew,
        contextSpaceTitle: listingSpaceTitle || scopedSpaceTitle(),
        contextSpaceId: listingSpaceId || scopedSpaceId(),
        surface: chatSurface,
        threadHTML: thread()?.innerHTML || '',
        dockHTML: dock()?.innerHTML || '',
        dockHidden: dock()?.hidden !== false
    });

    const restore = snapshot => {
        if (!snapshot) return;
        activateSurface(snapshot.surface === 'panel' ? 'panel' : 'home');
        listingStep = snapshot.listingStep || 'generic';
        listingInclude = Array.isArray(snapshot.listingInclude) ? [...snapshot.listingInclude] : [];
        listingDeal = snapshot.listingDeal || 'For sale';
        listingNote = snapshot.listingNote || '';
        listingDescription = snapshot.listingDescription || '';
        listingSourceUrl = snapshot.listingSourceUrl || '';
        listingSourceSite = snapshot.listingSourceSite || '';
        listingSpaceId = snapshot.listingSpaceId || '';
        listingSpaceTitle = snapshot.listingSpaceTitle || '';
        listingSpaceIsNew = snapshot.listingSpaceIsNew === true;
        listingFromTemplate = snapshot.listingFromTemplate === true;
        listingNeedsSpace = snapshot.listingNeedsSpace === true || snapshot.listingStep === 'space';
        furnishStyle = snapshot.furnishStyle || '';
        furnishBudget = snapshot.furnishBudget || '';
        furnishPlanId = snapshot.furnishPlanId || '';
        furnishPlanTitle = snapshot.furnishPlanTitle || '';
        furnishPlanIsNew = snapshot.furnishPlanIsNew === true;
        if (!listingPhotos.length && Array.isArray(snapshot.listingPhotoNames)) {
            listingPhotos = snapshot.listingPhotoNames.map(name => ({ name, url: '' }));
        }
        const threadNode = thread();
        const dockNode = dock();
        if (threadNode) {
            threadNode.innerHTML = snapshot.threadHTML || '';
            threadNode.hidden = !threadNode.innerHTML;
        }
        if (dockNode) {
            dockNode.replaceChildren();
            dockNode.hidden = true;
        }
        syncPanelShell();
        if (listingStep === 'link') {
            window.setTimeout(() => appendLinkWidget({ restore: true }), 0);
        } else if (listingStep === 'space') {
            listingNeedsSpace = true;
            window.setTimeout(() => appendSpaceWidget({ restore: true }), 0);
        } else if (listingStep === 'photos' || listingStep === 'include') {
            window.setTimeout(() => appendPhotosWidget({ restore: true }), 0);
        } else if (listingStep === 'description') {
            window.setTimeout(() => appendDescriptionWidget({ restore: true }), 0);
        } else if (listingStep === 'deal') {
            window.setTimeout(() => appendDealWidget({ restore: true }), 0);
        } else if (listingStep === 'furnish-plan') {
            window.setTimeout(() => appendFurnishPlanWidget({ restore: true }), 0);
        } else if (listingStep === 'furnish-style' || listingStep === 'furnish') {
            window.setTimeout(() => appendFurnishStyleWidget({ restore: true }), 0);
        } else if (listingStep === 'furnish-budget') {
            window.setTimeout(() => appendFurnishBudgetWidget({ restore: true }), 0);
        } else if (listingStep === 'furnish-ready') {
            // Plan card is already in the restored thread HTML.
            const hasOpenChoices = Boolean(dock()?.querySelector('.spaces-home-widget:not(.is-complete)'));
            if (!hasOpenChoices) window.setTimeout(appendFurnishNextSteps, 0);
        } else if (listingStep === 'ready') {
            const hasOpenChoices = Boolean(
                dock()?.querySelector('.spaces-home-widget:not(.is-complete)')
                || thread()?.querySelector('.spaces-home-widget:not(.is-complete), .spaces-home-choices:not(.is-complete)')
            );
            thread()?.querySelectorAll('.spaces-home-next-steps, .spaces-home-choices').forEach(node => node.remove());
            if (!hasOpenChoices) window.setTimeout(appendNextSteps, 0);
        } else if (dockNode) {
            dockNode.innerHTML = snapshot.dockHTML || '';
            dockNode.hidden = snapshot.dockHidden !== false && !dockNode.innerHTML;
        }
        restorePlaceholder();
        scrollThread();
        window.SpacesAiChats?.syncChatHeader?.();
    };

    const end = () => {
        listingStep = 'idle';
        listingInclude = [];
        listingDeal = 'For sale';
        listingNote = '';
        listingDescription = '';
        clearListingPhotos();
        listingSourceUrl = '';
        listingSourceSite = '';
        listingSpaceId = '';
        listingSpaceTitle = '';
        listingSpaceIsNew = false;
        listingFromTemplate = false;
        listingNeedsSpace = false;
        furnishStyle = '';
        furnishBudget = '';
        furnishPlanId = '';
        furnishPlanTitle = '';
        furnishPlanIsNew = false;
        home.classList.remove('is-centered-chat');
        clearSurface(homeThread, homeDock, { hide: true });
        clearSurface(panelThread, panelDock, { hide: true });
        if (panelEmpty) panelEmpty.hidden = false;
        chatSurface = 'home';
        restorePlaceholder();
        window.SpacesAiChats?.markIdle?.();
        window.SpacesAiChats?.syncChatHeader?.();
    };

    const begin = () => {
        activateSurface(chatSurface);
        listingStep = 'link';
        listingInclude = [];
        listingDeal = 'For sale';
        listingNote = '';
        listingDescription = '';
        clearListingPhotos();
        listingSourceUrl = '';
        listingSourceSite = '';
        listingSpaceId = '';
        listingSpaceTitle = '';
        listingSpaceIsNew = false;
        listingFromTemplate = false;
        listingNeedsSpace = !composerScopeId() && !composerScopeTitle();
        restorePlaceholder();
        window.SpacesAiChats?.beginSession?.({
            title: 'Listing',
            listing: true,
            spaceTitle: scopedSpaceTitle(),
            spaceId: scopedSpaceId(),
            prompt: 'Turn this home into a listing'
        });
        appendMessage('user', 'Turn this home into a listing');
        clearInput();
        window.setTimeout(appendLinkWidget, 180);
    };

    const beginGeneric = text => {
        activateSurface(chatSurface);
        listingStep = 'generic';
        listingInclude = [];
        listingDeal = 'For sale';
        listingNote = '';
        listingDescription = '';
        clearListingPhotos();
        listingSourceUrl = '';
        listingSourceSite = '';
        listingSpaceId = '';
        listingSpaceTitle = '';
        listingSpaceIsNew = false;
        listingFromTemplate = false;
        listingNeedsSpace = false;
        restorePlaceholder();
        window.SpacesAiChats?.beginSession?.({
            title: text,
            listing: /listing|stage |home tour/i.test(text),
            spaceTitle: scopedSpaceTitle(),
            spaceId: scopedSpaceId(),
            prompt: text
        });
        appendMessage('user', text);
        appendMessage('assistant', 'I’ll help with that. Ask a follow-up, or pick another job from the composer.');
        clearInput();
        window.SpacesAiChats?.syncChatHeader?.();
    };

    const start = (options = {}) => {
        window.SpacesAiChats?.captureCurrent?.();
        starting = true;
        chatSurface = options.surface === 'panel' ? 'panel' : 'home';
        if (!isPanelSurface()) {
            window.SpacesCopilotPanel?.close();
            const main = document.querySelector('.spaces-main-content');
            if (!main?.classList.contains('is-home-page')) {
                window.SpacesSidebarNavigation?.selectHome({ history: true });
            }
        }
        begin();
        window.setTimeout(() => {
            starting = false;
        }, 0);
    };

    const startGeneric = (text, options = {}) => {
        window.SpacesAiChats?.captureCurrent?.();
        starting = true;
        chatSurface = options.surface === 'panel' ? 'panel' : 'home';
        if (!isPanelSurface()) {
            window.SpacesCopilotPanel?.close();
            const main = document.querySelector('.spaces-main-content');
            if (!main?.classList.contains('is-home-page')) {
                window.SpacesSidebarNavigation?.selectHome({ history: true });
            }
        }
        beginGeneric(text);
        window.setTimeout(() => {
            starting = false;
        }, 0);
    };

    const expandToHome = () => {
        if (!isPanelSurface()) return;
        const snapshot = serialize();
        skipNavEnd = true;
        starting = true;
        window.SpacesCopilotPanel?.hide?.();
        const main = document.querySelector('.spaces-main-content');
        if (!main?.classList.contains('is-home-page')) {
            window.SpacesSidebarNavigation?.selectHome({ history: true });
        }
        restore({ ...snapshot, surface: 'home' });
        window.setTimeout(() => {
            starting = false;
            skipNavEnd = false;
        }, 0);
    };

    const send = text => {
        const value = String(text || '').trim();
        if (!value) return false;
        if (!isActive()) {
            if (isListingJob(value)) {
                start();
                return true;
            }
            if (isFurnishJob(value)) {
                startFurnish(value);
                return true;
            }
            startGeneric(value);
            return true;
        }
        if (isListingJob(value) && listingStep === 'idle') {
            begin();
            return true;
        }
        if (isFurnishJob(value) && (listingStep === 'idle' || listingStep === 'generic')) {
            beginFurnish(value);
            return true;
        }
        appendMessage('user', value);
        clearInput();
        const widget = activeWidget();
        if (listingStep === 'furnish-plan') {
            if (widget) finishFurnishPlan(widget, { createNew: true, other: value });
            else window.setTimeout(appendFurnishStyleWidget, 180);
            return true;
        }
        if (listingStep === 'furnish-style') {
            const style = styleOptions.find(option => value.toLowerCase().includes(option.label.toLowerCase()));
            if (style) furnishStyle = style.label;
            else if (value) furnishStyle = value;
            if (widget && furnishStyle) finishFurnishStyle(widget);
            else appendMessage('assistant', 'Pick a style in the card, or type one.');
            return true;
        }
        if (listingStep === 'furnish-budget') {
            const lowered = value.toLowerCase();
            const budget = budgetOptions.find(option =>
                lowered.includes(option.label.toLowerCase())
                || lowered.includes(option.id.replace(/-/g, ''))
            );
            if (budget) furnishBudget = budget.label;
            else if (value) furnishBudget = value;
            if (widget && furnishBudget) finishFurnishBudget(widget);
            else appendMessage('assistant', 'Pick a budget in the card, or type one.');
            return true;
        }
        if (listingStep === 'furnish-ready' || listingStep === 'furnish-followup') {
            if (/edit|editor|floor plan/i.test(value)) {
                appendMessage('assistant', 'Opening the floor plan editor so you can move furniture around.');
                openFloorPlanEditor();
                return true;
            }
            appendMessage(
                'assistant',
                'Got it. Tell me what to change in this layout, or say “Edit in editor” to open the floor plan.'
            );
            listingStep = 'furnish-followup';
            return true;
        }
        if (listingStep === 'link') {
            if (widget) finishLink(widget, { other: value });
            else continueAfterLink();
            return true;
        }
        if (listingStep === 'space') {
            if (widget) finishSpace(widget, { createNew: true, other: value });
            else window.setTimeout(appendPhotosWidget, 180);
            return true;
        }
        if (listingStep === 'photos') {
            if (widget) finishPhotos(widget, { skipped: true });
            else window.setTimeout(appendDescriptionWidget, 180);
            return true;
        }
        if (listingStep === 'description') {
            if (widget) finishDescription(widget, { other: value });
            else window.setTimeout(appendDealWidget, 180);
            return true;
        }
        if (listingStep === 'deal') {
            if (widget) finishDeal(widget, { other: value });
            else window.setTimeout(appendListingPreview, 180);
            return true;
        }
        if (listingStep === 'ready') {
            const action = nextActionFromText(value);
            applyNextAction(action, { other: action ? '' : value, fromComposer: true });
            return true;
        }
        appendMessage(
            'assistant',
            listingStep === 'generic'
                ? 'Got it. Tell me what to change, or pick another job from the composer.'
                : 'I added that to the listing draft. Open Edit listing whenever you want to review the page.'
        );
        return true;
    };

    const onThreadClick = event => {
        const furnishButton = event.target.closest('[data-furnish-action]');
        if (furnishButton) {
            event.preventDefault();
            event.stopPropagation();
            openFloorPlanEditor();
            return;
        }
        const actionButton = event.target.closest('[data-listing-action]');
        if (actionButton) {
            event.preventDefault();
            event.stopPropagation();
            openListingDraft({
                mode: actionButton.dataset.listingAction === 'preview' ? 'preview' : 'edit'
            });
            return;
        }
        const link = event.target.closest('.spaces-home-listing-link');
        if (!link) return;
        event.preventDefault();
        event.stopPropagation();
        openListingDraft();
    };
    homeThread.addEventListener('click', onThreadClick);
    panelThread?.addEventListener('click', onThreadClick);

    document.addEventListener('spaces-home-composer-submit', event => {
        const text = event.detail?.text;
        if (send(text)) event.preventDefault();
    });

    document.addEventListener('spaces-navigation-start', () => {
        if (starting || skipNavEnd) {
            skipNavEnd = false;
            return;
        }
        window.SpacesAiChats?.captureCurrent?.();
        end();
    });


    const loadSpaces = account => {
        availableSpaces = Array.isArray(account?.spaces) ? account.spaces : [];
        availableFloorPlans = Array.isArray(account?.files)
            ? account.files.filter(file => file.type === 'Floor Plans')
            : [];
    };
    document.addEventListener('spaces-account-profile-ready', event => {
        loadSpaces(event.detail?.account);
    });
    if (window.SpacesAccountData?.load) {
        window.SpacesAccountData.load().then(loadSpaces).catch(() => {
            availableSpaces = [];
            availableFloorPlans = [];
        });
    }

    window.SpacesListingChat = { start, startFurnish, send, startGeneric, end, isActive, serialize, restore, prepareOpen, expandToHome, openDraft: openListingDraft, openFloorPlan: openFloorPlanEditor };
})();
