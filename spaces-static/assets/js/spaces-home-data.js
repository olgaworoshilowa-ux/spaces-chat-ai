(() => {
    'use strict';

    const home = document.querySelector('[data-home-page]');
    const recentList = home?.querySelector('[data-home-recent-list]');
    const recentShowAll = home?.querySelector('[data-home-recent-show-all]');
    const spacesList = home?.querySelector('[data-home-spaces-list]');
    const forYouSection = home?.querySelector('[data-home-for-you]');
    const forYouToggle = home?.querySelector('[data-home-for-you-toggle]');
    const forYouContent = home?.querySelector('[data-home-for-you-content]');
    const fallbackPreview = '/spaces-chat-ai/spaces-static/assets/images/spaces-v2/collection-preview.png';
    const fallbackSpacePreview = '/spaces-chat-ai/spaces-static/assets/images/spaces/card-image-1.webp';
    const moreIcon = '/spaces-chat-ai/spaces-static/assets/images/spaces-v2/list-more.svg';
    const collapsedRecentLimit = 5;

    if (!home || !recentList || !spacesList || !window.SpacesAccountData?.load) return;

    const syncForYou = () => {
        if (!forYouSection) return;
        const show = document.body.classList.contains('is-new-chat-placement-option3')
            && document.body.classList.contains('is-home-feed')
            && !home.classList.contains('is-centered-chat');
        forYouSection.hidden = !show;
    };

    if (forYouToggle && forYouContent) {
        forYouToggle.addEventListener('click', () => {
            const expanded = forYouToggle.getAttribute('aria-expanded') !== 'false';
            forYouToggle.setAttribute('aria-expanded', String(!expanded));
            forYouContent.hidden = expanded;
        });
    }

    document.addEventListener('spaces-new-chat-placement-changed', syncForYou);
    document.addEventListener('spaces-home-surface-changed', syncForYou);
    new MutationObserver(syncForYou).observe(home, { attributes: true, attributeFilter: ['class'] });
    syncForYou();

    const normalize = value => String(value || '').trim().toLowerCase();
    const timestamp = item => new Date(String(item?.udate || item?.cdate || '').replace(' ', 'T')).getTime() || 0;
    const sortByUpdated = items => [...items].sort((first, second) => timestamp(second) - timestamp(first));
    const compactDate = item => {
        const value = item?.udate || item?.cdate;
        const date = new Date(String(value || '').replace(' ', 'T'));
        if (Number.isNaN(date.getTime())) return 'Recently';
        return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(date);
    };
    const dateTime = item => String(item?.udate || item?.cdate || '').replace(' ', 'T');
    const fileTypeKey = type => normalize(type)
        .replaceAll('°', '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const preview = (source, alt, className, fallback = fallbackPreview, rejectTinyPreview = false) => {
        const image = document.createElement('img');
        image.className = className;
        image.alt = alt;
        const showFallback = () => {
            if (image.getAttribute('src') === fallback) {
                image.onerror = null;
                image.onload = null;
                return;
            }
            image.src = fallback;
        };
        image.onerror = showFallback;
        image.onload = () => {
            if (
                rejectTinyPreview
                && image.getAttribute('src') !== fallback
                && image.naturalWidth <= 16
                && image.naturalHeight <= 16
            ) {
                showFallback();
            }
        };
        image.src = source || fallback;
        return image;
    };

    const spaceInitial = space => {
        const initial = document.createElement('span');
        initial.className = 'spaces-home-space-initial';
        initial.setAttribute('aria-hidden', 'true');
        initial.textContent = space?.initial || String(space?.title || 'S').slice(0, 1).toUpperCase();
        if (space?.avatarColor) initial.style.backgroundColor = space.avatarColor;
        return initial;
    };

    const setForYouExpanded = expanded => {
        if (!forYouToggle || !forYouContent) return;
        forYouToggle.setAttribute('aria-expanded', String(expanded));
        forYouContent.hidden = !expanded;
    };

    forYouToggle?.addEventListener('click', () => {
        setForYouExpanded(forYouToggle.getAttribute('aria-expanded') !== 'true');
    });

    const emptyMessage = text => {
        const message = document.createElement('p');
        message.className = 'spaces-home-data-message';
        message.textContent = text;
        return message;
    };

    const uniqueRecentFiles = files => {
        const floorPlansByHash = new Map();
        files
            .filter(file => file.type === 'Floor Plans')
            .forEach(file => {
                if (file.hash) floorPlansByHash.set(file.hash, file);
                if (file.sourceHash) floorPlansByHash.set(file.sourceHash, file);
            });

        const groups = new Map();
        sortByUpdated(files).forEach(file => {
            const floorPlan = floorPlansByHash.get(file.hash);
            const key = floorPlan
                ? `project:${floorPlan.id}`
                : `file:${file.hash || file.id}`;
            const existing = groups.get(key);
            if (!existing) {
                groups.set(key, { latest: file, preferred: floorPlan || file });
            } else if (floorPlan) {
                existing.preferred = floorPlan;
            }
        });

        return [...groups.values()].map(({ latest, preferred }) => ({
            ...preferred,
            cdate: latest.cdate || preferred.cdate,
            udate: latest.udate || latest.cdate || preferred.udate || preferred.cdate,
            updated: latest.updated || preferred.updated
        }));
    };

    const renderRecentRows = account => {
        const spacesById = new Map(account.spaces.map(space => [String(space.id), space]));
        const recentFiles = uniqueRecentFiles(account.files);
        const visibleRecentFiles = recentFiles.slice(0, collapsedRecentLimit);
        recentList.replaceChildren();

        if (!visibleRecentFiles.length) {
            recentList.append(emptyMessage('No recent files yet'));
            if (recentShowAll) recentShowAll.hidden = true;
            return;
        }

        visibleRecentFiles.forEach(file => {
            const space = spacesById.get(String(file.spaceId)) || {
                title: 'Unknown space',
                initial: 'S'
            };
            const row = document.createElement('div');
            const thumbnail = document.createElement('span');
            const name = document.createElement('span');
            const updated = document.createElement('time');
            const spaceLabel = document.createElement('span');
            const more = document.createElement('button');
            const moreImage = document.createElement('img');

            row.className = 'spaces-home-recent-row';
            row.setAttribute('role', 'listitem');
            row.dataset.homeFileType = fileTypeKey(file.type);
            row.dataset.homeFileSearch = normalize(`${file.title} ${file.type} ${file.updated} ${space.title}`);

            thumbnail.className = 'spaces-home-recent-thumbnail spaces-home-recent-thumbnail-photo';
            thumbnail.setAttribute('aria-hidden', 'true');
            thumbnail.append(preview(file.previewUrl, '', ''));

            name.className = 'spaces-home-recent-name';
            name.textContent = file.title;

            updated.dateTime = dateTime(file);
            updated.textContent = compactDate(file);

            spaceLabel.className = 'spaces-home-recent-space';
            spaceLabel.append(spaceInitial(space), document.createTextNode(space.title));

            more.type = 'button';
            more.setAttribute('aria-label', `More actions for ${file.title}`);
            moreImage.src = moreIcon;
            moreImage.alt = '';
            more.append(moreImage);

            row.append(thumbnail, name, updated, spaceLabel, more);
            recentList.append(row);
        });

        if (recentShowAll) {
            const hasOverflow = recentFiles.length > collapsedRecentLimit;
            recentShowAll.hidden = !hasOverflow;
            recentShowAll.textContent = 'Show All';
            recentShowAll.setAttribute('aria-expanded', 'false');
        }
    };

    const renderRecent = account => {
        renderRecentRows(account);
    };

    const renderSpaces = account => {
        spacesList.replaceChildren();

        if (!account.spaces.length) {
            spacesList.append(emptyMessage('No spaces yet'));
            return;
        }

        account.spaces.forEach(space => {
            const spaceFiles = sortByUpdated(account.files.filter(file => String(file.spaceId) === String(space.id)));
            const latestFile = spaceFiles[0];
            const latestActivity = timestamp(latestFile) > timestamp(space) ? latestFile : space;
            const card = document.createElement('button');
            const spacePreview = normalize(space.title) === 'new space'
                ? fallbackSpacePreview
                : space.previewUrl || latestFile?.previewUrl;
            const image = preview(
                spacePreview,
                `${space.title} preview`,
                'spaces-home-space-image',
                fallbackSpacePreview,
                true
            );
            const copy = document.createElement('span');
            const name = document.createElement('span');
            const address = document.createElement('span');
            const updated = document.createElement('time');

            card.type = 'button';
            card.className = 'spaces-home-space-card';
            card.dataset.homeSpaceCard = '';
            card.dataset.homeSpaceId = String(space.id);
            card.dataset.homeSpaceSearch = normalize(`${space.title} ${space.address} ${compactDate(latestActivity)}`);

            copy.className = 'spaces-home-space-copy';
            name.className = 'spaces-home-space-name';
            name.append(spaceInitial(space), document.createTextNode(space.title));
            address.className = 'spaces-home-space-address';
            address.textContent = space.address || 'Fill Address';
            copy.append(name, address);

            updated.dateTime = dateTime(latestActivity);
            updated.textContent = compactDate(latestActivity);

            card.append(image, copy, updated);
            card.addEventListener('click', async () => {
                await window.SpacesAccountProfile?.applyProfile(account.id);
                const spaceButton = window.SpacesSidebarNavigation
                    ?.getSpaceButtons()
                    .find(button => String(button.closest('[data-space-tree]')?.dataset.accountSpaceId) === String(space.id));

                if (spaceButton) {
                    window.SpacesSidebarNavigation.selectSpace(spaceButton, { history: true });
                    return;
                }

                window.SpacesAccountProfile?.selectSpace(space.title);
                window.SpacesPrototypeNavigation?.showSpaces({ history: true });
            });
            spacesList.append(card);
        });
    };

    const renderAccount = account => {
        renderRecent(account);
        renderSpaces(account);
        home.dataset.homeDataState = 'ready';
        document.dispatchEvent(new CustomEvent('spaces-home-data-rendered', { detail: { account } }));
    };

    const render = async () => {
        try {
            const account = await window.SpacesAccountData.load();
            renderAccount(account);
        } catch (error) {
            console.error('Unable to load Home data.', error);
            recentList.replaceChildren(emptyMessage('Recent files could not be loaded'));
            spacesList.replaceChildren(emptyMessage('Spaces could not be loaded'));
            home.dataset.homeDataState = 'error';
        }
    };

    document.addEventListener('spaces-account-profile-ready', event => {
        if (event.detail?.account) renderAccount(event.detail.account);
    });

    render();
})();
