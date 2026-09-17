(() => {
    'use strict';

    const SESSION_KEY = 'listings-final-session-v2';
    const EMBEDDED_KEY = 'listings-spaces-embedded';
    const RETURN_KEY = 'listings-spaces-return';
    const RETURN_VIEW_KEY = 'listings-spaces-return-view';
    const LISTING_ID = 'spaces-draft';
    const PHOTO_BASE = '/listings-final/photos';
    const studio = document.querySelector('[data-listing-studio]');
    const frame = studio?.querySelector('[data-listing-studio-frame]');
    const mainContent = document.querySelector('.spaces-main-content');
    const homePage = document.querySelector('[data-home-page]');
    const allSpacesPage = document.querySelector('[data-all-spaces-page]');
    const fab = document.querySelector('[data-sparkles-fab]');

    if (!studio || !frame || !mainContent) return;

    const PHOTO_FILES = [
        { file: 'villa.jpg', room: 'Exterior' },
        { file: 'facade.jpg', room: 'Exterior' },
        { file: 'kitchen.jpg', room: 'Kitchen' },
        { file: 'bedroom.jpg', room: 'Bedroom' },
        { file: 'lounge.jpg', room: 'Living room' },
        { file: 'interior.jpg', room: 'Living room' },
        { file: 'pool.jpg', room: 'Garden' },
        { file: 'night.jpg', room: 'Exterior' }
    ];

    const KEY_FACTS = [
        { label: 'Bedrooms', value: '4' },
        { label: 'Bathrooms', value: '3' },
        { label: 'Floor area', value: '186 m²' },
        { label: 'Year built', value: '2019' },
        { label: 'BER', value: 'B2' },
        { label: 'Parking', value: '2 spaces' }
    ];

    const FEATURES = [
        'South-facing garden',
        'Underfloor heating',
        'Smart home wiring',
        'Dual aspect living room',
        'Fitted kitchen',
        'Walk-in wardrobe',
        'EV charger',
        'Alarm system'
    ];

    const DESCRIPTION =
        'A quiet, light-filled home — four bedrooms, a south garden, and a kitchen that actually gets used. The living room opens straight onto the terrace, so summer evenings don’t need a plan. Built in 2019, BER B2, and finished with the kind of detail you don’t have to explain to a buyer.';

    const isOpen = () => !studio.hidden && mainContent.classList.contains('is-listing-studio-page');

    let returnView = null;

    const captureReturnView = () => ({
        homePage: mainContent.classList.contains('is-home-page'),
        allSpacesPage: mainContent.classList.contains('is-all-spaces-page'),
        aiChatsPage: mainContent.classList.contains('is-ai-chats-page'),
        spaceHome: document.body.classList.contains('is-space-home-page'),
        centeredChat: Boolean(homePage?.classList.contains('is-centered-chat')),
        homeSurface: homePage?.dataset.homeSurface || '',
        homeFeed: document.body.classList.contains('is-home-feed'),
        fabHidden: Boolean(fab?.hidden),
        chatSnapshot: window.SpacesListingChat?.isActive?.()
            ? window.SpacesListingChat.serialize()
            : null
    });

    const readStoredReturnView = () => {
        try {
            const raw = sessionStorage.getItem(RETURN_VIEW_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    };

    const storeReturnView = view => {
        try {
            if (view) sessionStorage.setItem(RETURN_VIEW_KEY, JSON.stringify(view));
            else sessionStorage.removeItem(RETURN_VIEW_KEY);
        } catch {
            // sessionStorage may be unavailable in private mode
        }
    };

    const restoreReturnView = () => {
        const view = returnView || readStoredReturnView();
        returnView = null;
        storeReturnView(null);
        mainContent.classList.remove('is-home-page', 'is-all-spaces-page', 'is-ai-chats-page', 'is-listing-studio-page');
        document.body.classList.remove('is-space-home-page', 'is-home-feed');
        if (homePage) {
            homePage.hidden = true;
            homePage.classList.remove('is-centered-chat');
            if (view?.homeSurface) homePage.dataset.homeSurface = view.homeSurface;
            else homePage.dataset.homeSurface = '';
        }
        if (allSpacesPage) allSpacesPage.hidden = true;
        const aiChatsPage = document.querySelector('[data-ai-chats-page]');
        if (aiChatsPage) aiChatsPage.hidden = true;

        const restoreChat = () => {
            if (view?.chatSnapshot) {
                window.SpacesListingChat?.restore?.(view.chatSnapshot);
            }
            window.SpacesAiChats?.syncChatHeader?.();
        };

        if (!view || view.homePage) {
            mainContent.classList.add('is-home-page');
            if (view?.spaceHome) document.body.classList.add('is-space-home-page');
            if (view?.homeFeed) document.body.classList.add('is-home-feed');
            if (homePage) {
                homePage.hidden = false;
                homePage.classList.toggle('is-centered-chat', Boolean(view?.centeredChat ?? true));
            }
            if (fab) fab.hidden = true;
            restoreChat();
            return;
        }

        if (view.allSpacesPage) {
            mainContent.classList.add('is-all-spaces-page');
            if (allSpacesPage) allSpacesPage.hidden = false;
            if (fab) fab.hidden = Boolean(view.fabHidden);
            return;
        }

        if (view.aiChatsPage) {
            mainContent.classList.add('is-ai-chats-page');
            if (aiChatsPage) aiChatsPage.hidden = false;
            if (fab) fab.hidden = true;
            window.SpacesAiChats?.renderAllPage?.();
            return;
        }

        // Default: return to the active Space collections view.
        if (fab) fab.hidden = Boolean(view.fabHidden);
        const spaceButton = window.SpacesSidebarNavigation?.getSelectedSpace?.();
        if (spaceButton) {
            window.SpacesSidebarNavigation.selectSpace(spaceButton);
            return;
        }
        mainContent.classList.add('is-home-page');
        if (homePage) {
            homePage.hidden = false;
            homePage.classList.add('is-centered-chat');
        }
        if (fab) fab.hidden = true;
        restoreChat();
    };

    const photoUrl = file => `${PHOTO_BASE}/${file}`;

    const createSections = include => {
        const picked = new Set(include || []);
        const hasFilter = picked.size > 0;
        const on = id => !hasFilter || picked.has(id);
        return [
            {
                id: 'photos',
                type: 'photos',
                title: 'Photos',
                order: 0,
                enabled: on('photos'),
                required: true,
                hasContent: true,
                locked: false,
                status: 'ready',
                source: 'From your camera roll'
            },
            {
                id: 'keyFacts',
                type: 'keyFacts',
                title: 'Key facts',
                order: 1,
                enabled: true,
                required: false,
                hasContent: true,
                locked: false,
                status: 'ready',
                source: 'From developer PDF'
            },
            {
                id: 'floorPlan',
                type: 'floorPlan',
                title: 'Floor plan',
                order: 2,
                enabled: on('floor-plan'),
                required: false,
                hasContent: true,
                locked: false,
                status: 'ready',
                source: 'Generated floor plan'
            },
            {
                id: 'tour3d',
                type: 'tour3d',
                title: 'Tour & 3D',
                order: 3,
                enabled: on('tour'),
                required: false,
                hasContent: true,
                locked: false,
                status: 'ready'
            },
            {
                id: 'homeFeatures',
                type: 'homeFeatures',
                title: 'Home features',
                order: 4,
                enabled: true,
                required: false,
                hasContent: true,
                locked: false,
                status: 'ready'
            },
            {
                id: 'agentContacts',
                type: 'agentContacts',
                title: 'Agent contacts',
                order: 5,
                enabled: true,
                required: true,
                hasContent: true,
                locked: false,
                status: 'ready'
            }
        ];
    };

    const createListing = options => {
        const deal = options.deal === 'For rent' ? 'For rent' : 'For sale';
        const include = Array.isArray(options.include) ? options.include : [];
        const price = deal === 'For rent' ? '$4,000' : '$1,250,000';
        const now = Date.now();
        const photos = PHOTO_FILES.map((item, index) => {
            const url = photoUrl(item.file);
            return {
                id: `photo-${index + 1}`,
                url,
                originalUrl: url,
                room: item.room,
                cleaned: true,
                cleaning: false
            };
        });
        const brandingOn = !include.length || include.includes('branding');
        const showPrice = !include.length || include.includes('deal');

        return {
            id: LISTING_ID,
            address: '23 Ann Politkovskaya Street, Dublin',
            title: '23 Ann Politkovskaya Street',
            description: DESCRIPTION,
            price,
            dealType: deal,
            status: 'draft',
            thumbnail: photos[0].url,
            photos,
            sections: createSections(include),
            keyFacts: KEY_FACTS,
            homeFeatures: FEATURES,
            agent: {
                name: 'Sarah O’Connell',
                role: 'Senior negotiator',
                phone: '+353 1 234 5678',
                email: 'sarah@planner5d.ie',
                photo: photoUrl('agent.jpg')
            },
            tourUrl: 'https://planner5d.com/tour/demo',
            floorPlanUrl: 'auto',
            layout: 'classic',
            brandingKind: brandingOn ? 'planner' : 'none',
            brandingRemoved: !brandingOn,
            agencyBrandingUnlocked: false,
            publishSettings: {
                visibility: 'public',
                showPrice,
                showExactAddress: true,
                listOnWebsite: true,
                listOnPortals: false
            },
            createdAt: now - 1000 * 60 * 40,
            updatedAt: now - 7000
        };
    };

    const seedSession = listing => {
        const slice = {
            listings: [
                {
                    id: listing.id,
                    address: listing.address,
                    price: listing.price,
                    dealType: listing.dealType,
                    status: listing.status,
                    thumbnail: listing.thumbnail
                }
            ],
            currentListing: listing,
            messages: [
                {
                    id: 'seed',
                    role: 'user',
                    content: `Open ${listing.address}`,
                    attachments: []
                }
            ],
            editorOption: 'option2',
            option2Panel: 'chat',
            credits: 80,
            generatedPayload: null,
            briefPending: false
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(slice));
        sessionStorage.setItem(EMBEDDED_KEY, '1');
        sessionStorage.setItem(RETURN_KEY, `${window.location.pathname}${window.location.search}${window.location.hash}`);
    };

    const listingsFinalUrl = (hash = '') => {
        const here = window.location.pathname || '';
        // GitHub project pages live under /spaces-chat-ai/…
        const base = here.includes('/spaces-chat-ai/')
            ? '/spaces-chat-ai/listings-final/index.html'
            : '/listings-final/index.html';
        return `${base}?from=spaces&t=${Date.now()}${hash}`;
    };

    const open = (options = {}) => {
        // Keep the Spaces listing chat alive while the editor is open.
        window.SpacesListingChat?.prepareOpen?.();
        returnView = captureReturnView();
        storeReturnView(returnView);
        mainContent.classList.remove('is-home-page', 'is-all-spaces-page', 'is-ai-chats-page');
        document.body.classList.remove('is-space-home-page');
        mainContent.classList.add('is-listing-studio-page');
        document.body.classList.add('is-listing-studio-open');
        if (homePage) homePage.hidden = true;
        if (allSpacesPage) allSpacesPage.hidden = true;
        const aiChatsPage = document.querySelector('[data-ai-chats-page]');
        if (aiChatsPage) aiChatsPage.hidden = true;
        studio.hidden = false;
        if (fab) fab.hidden = true;
        window.SpacesPrototypeNavigation?.closeCollection?.({ restoreScroll: false });
        // hide() only collapses the panel — close() would wipe the listing chat.
        window.SpacesCopilotPanel?.hide?.();
        seedSession(createListing(options));
        const mode = options.mode === 'preview' ? 'preview' : 'edit';
        const hash = mode === 'preview'
            ? `#/listing/${LISTING_ID}/preview`
            : `#/listing/${LISTING_ID}`;
        frame.src = listingsFinalUrl(hash);
    };

    let closing = false;
    const close = () => {
        if (closing) return;
        if (!mainContent.classList.contains('is-listing-studio-page') && studio.hidden) return;
        closing = true;
        try {
            studio.hidden = true;
            frame.src = 'about:blank';
            sessionStorage.removeItem(EMBEDDED_KEY);
            sessionStorage.removeItem(RETURN_KEY);
            document.body.classList.remove('is-listing-studio-open');
            mainContent.classList.remove('is-listing-studio-page');
            restoreReturnView();
        } finally {
            window.setTimeout(() => {
                closing = false;
            }, 0);
        }
    };

    window.addEventListener('message', event => {
        if (event.data?.type !== 'listings-spaces-close') return;
        // Accept close from the studio iframe or same-site origins.
        const fromFrame = frame.contentWindow && event.source === frame.contentWindow;
        const sameSite = (() => {
            try {
                const host = new URL(event.origin).hostname;
                const here = window.location.hostname;
                const isLocal = value => value === 'localhost' || value === '127.0.0.1';
                return host === here || (isLocal(host) && isLocal(here));
            } catch {
                return false;
            }
        })();
        if (!fromFrame && event.origin !== window.location.origin && !sameSite && event.origin !== '*') {
            // Still close if studio is open — Back must never trap users on the wizard.
            if (!isOpen()) return;
        }
        close();
    });

    // If the iframe leaves the listing route (e.g. lands on Start wizard),
    // exit the studio instead of trapping the user there.
    frame.addEventListener('load', () => {
        if (!isOpen() || closing) return;
        try {
            const win = frame.contentWindow;
            if (!win || win.location.href === 'about:blank') return;
            const hash = String(win.location.hash || '');
            const path = String(win.location.pathname || '');
            const onListing = hash.includes('/listing/');
            const onListingsApp = path.includes('listings-final');
            if (onListingsApp && !onListing) close();
        } catch {
            // Cross-origin — ignore
        }
    });

    document.addEventListener('spaces-navigation-start', () => {
        if (closing) return;
        if (studio.hidden && !mainContent.classList.contains('is-listing-studio-page')) return;
        // Sidebar navigation while studio is open: leave without restoring chat.
        closing = true;
        studio.hidden = true;
        frame.src = 'about:blank';
        sessionStorage.removeItem(EMBEDDED_KEY);
        sessionStorage.removeItem(RETURN_KEY);
        storeReturnView(null);
        returnView = null;
        mainContent.classList.remove('is-listing-studio-page');
        document.body.classList.remove('is-listing-studio-open');
        window.setTimeout(() => {
            closing = false;
        }, 0);
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && isOpen()) {
            event.preventDefault();
            close();
        }
    });

    window.SpacesListingStudio = { open, close, isOpen };
})();
