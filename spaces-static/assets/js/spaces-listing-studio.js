(() => {
    'use strict';

    const SESSION_KEY = 'listings-final-session-v2';
    const EMBEDDED_KEY = 'listings-spaces-embedded';
    const RETURN_KEY = 'listings-spaces-return';
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
        fabHidden: Boolean(fab?.hidden)
    });

    const restoreReturnView = () => {
        const view = returnView;
        returnView = null;
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

        if (!view || view.homePage) {
            mainContent.classList.add('is-home-page');
            if (view?.spaceHome) document.body.classList.add('is-space-home-page');
            if (view?.homeFeed) document.body.classList.add('is-home-feed');
            if (homePage) {
                homePage.hidden = false;
                homePage.classList.toggle('is-centered-chat', Boolean(view?.centeredChat ?? true));
            }
            if (fab) fab.hidden = true;
            window.SpacesAiChats?.syncChatHeader?.();
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
        window.SpacesAiChats?.syncChatHeader?.();
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
            option2Panel: 'content',
            credits: 80,
            generatedPayload: null,
            briefPending: false
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(slice));
        sessionStorage.setItem(EMBEDDED_KEY, '1');
        sessionStorage.setItem(RETURN_KEY, `${window.location.pathname}${window.location.search}${window.location.hash}`);
    };

    const open = (options = {}) => {
        returnView = captureReturnView();
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
        window.SpacesCopilotPanel?.close();
        seedSession(createListing(options));
        const mode = options.mode === 'preview' ? 'preview' : 'edit';
        const hash = mode === 'preview'
            ? `#/listing/${LISTING_ID}/preview`
            : `#/listing/${LISTING_ID}`;
        frame.src = `/listings-final/index.html?from=spaces&t=${Date.now()}${hash}`;
    };

    const close = () => {
        if (!mainContent.classList.contains('is-listing-studio-page') && studio.hidden) return;
        studio.hidden = true;
        frame.src = 'about:blank';
        sessionStorage.removeItem(EMBEDDED_KEY);
        sessionStorage.removeItem(RETURN_KEY);
        document.body.classList.remove('is-listing-studio-open');
        restoreReturnView();
    };

    window.addEventListener('message', event => {
        if (event.data?.type !== 'listings-spaces-close') return;
        // Prefer the studio iframe as source; also accept same-site origins
        // (localhost vs 127.0.0.1) so Back always returns to Spaces.
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
        if (!fromFrame && event.origin !== window.location.origin && !sameSite) return;
        close();
    });

    document.addEventListener('spaces-navigation-start', () => {
        studio.hidden = true;
        frame.src = 'about:blank';
        sessionStorage.removeItem(EMBEDDED_KEY);
        sessionStorage.removeItem(RETURN_KEY);
        returnView = null;
        mainContent.classList.remove('is-listing-studio-page');
        document.body.classList.remove('is-listing-studio-open');
    });

    window.SpacesListingStudio = { open, close, isOpen };
})();
