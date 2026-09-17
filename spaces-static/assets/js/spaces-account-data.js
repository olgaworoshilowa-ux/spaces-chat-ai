(() => {
    'use strict';

    const PREVIEW_ROOT = 'https://storage.planner5d.com/thumbs.600';
    const profileStorageKey = 'planner5d-spaces-v2-user-profile';
    const accountConfigs = {
        one: {
            id: 'one',
            label: 'Demo',
            spaceCount: 1
        },
        many: {
            id: 'many',
            label: 'Demo'
        },
        demo: {
            id: 'demo',
            label: 'Demo'
        },
        evelina: {
            id: 'evelina',
            label: 'Evelina',
            root: '/evelinas_data',
            floorplans: 'products',
            screenshots: 'screenshots',
            documents: null,
            documentFolders: 'space_documents_folders'
        },
        vanessa: {
            id: 'vanessa',
            label: 'Vanessa',
            root: '/vanessas_data',
            floorplans: 'floorplans',
            screenshots: 'renders and 360 pano and walkthough',
            documents: 'spaces_documents',
            documentFolders: 'spaces_documents_folders'
        },
        natalia: {
            id: 'natalia',
            label: 'Natalia',
            root: '/natalias_data',
            floorplans: 'projects',
            screenshots: 'screenshots',
            documents: 'spaces_documents',
            documentFolders: 'spaces_documents_folders',
            strictSpaceIds: true
        }
    };

    const parseCsv = source => {
        const rows = [];
        let row = [];
        let value = '';
        let quoted = false;

        for (let index = 0; index < source.length; index += 1) {
            const character = source[index];
            const nextCharacter = source[index + 1];

            if (character === '"' && quoted && nextCharacter === '"') {
                value += '"';
                index += 1;
            } else if (character === '"') {
                quoted = !quoted;
            } else if (character === ',' && !quoted) {
                row.push(value);
                value = '';
            } else if ((character === '\n' || character === '\r') && !quoted) {
                if (character === '\r' && nextCharacter === '\n') index += 1;
                row.push(value);
                if (row.some(cell => cell.length)) rows.push(row);
                row = [];
                value = '';
            } else {
                value += character;
            }
        }

        row.push(value);
        if (row.some(cell => cell.length)) rows.push(row);

        const [rawHeaders = [], ...data] = rows;
        const occurrences = new Map();
        const headers = rawHeaders.map(header => {
            const occurrence = occurrences.get(header) || 0;
            occurrences.set(header, occurrence + 1);
            return occurrence === 0 ? header : `${header}_${occurrence + 1}`;
        });

        return data.map(cells => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ''])));
    };

    const readCsv = async (root, name) => {
        if (!name) return [];
        const response = await fetch(`${root}/${name}.csv`);
        if (!response.ok) throw new Error(`Unable to read ${name}.csv`);
        return parseCsv(await response.text());
    };

    const readableDate = value => {
        if (!value) return 'Recently';
        const date = new Date(value.replace(' ', 'T'));
        if (Number.isNaN(date.getTime())) return 'Recently';
        return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    };

    const previewUrl = (hash, collection, previewNumber) => {
        const normalizedHash = String(hash || '').trim();
        if (!normalizedHash) return '';

        const normalizedCollection = String(collection || '').trim().toLowerCase();
        const encodedHash = encodeURIComponent(normalizedHash);
        const normalizedPreviewNumber = String(previewNumber || '').trim();

        if (normalizedCollection === 'moodboards') {
            return `https://storage.planner5d.com/moodboards_thumbs.600/${encodedHash}.webp`;
        }

        if (
            normalizedCollection === 'renders'
            || normalizedCollection === '360° panorama'
            || normalizedCollection === '360° walkthrough'
        ) {
            if (!normalizedPreviewNumber) return '';
            return `https://storage.planner5d.com/s/${encodedHash}_${encodeURIComponent(normalizedPreviewNumber)}`;
        }

        if (normalizedCollection === 'documents') return '';
        return `${PREVIEW_ROOT}/${encodedHash}.webp`;
    };

    const spacePreviewUrl = hash => {
        const normalizedHash = String(hash || '').trim();
        if (!normalizedHash) return '';
        return `https://storage.planner5d.com/space/${encodeURIComponent(normalizedHash)}`;
    };

    const avatarColor = value => {
        const numericColor = Number.parseInt(String(value || ''), 10);
        if (!Number.isInteger(numericColor) || numericColor < 0 || numericColor > 0xffffff) return '';
        // White is the legacy "no custom color" value. Returning an empty
        // color keeps the shared CSS fallback visible instead of overriding it.
        if (numericColor === 0xffffff) return '';
        return `#${numericColor.toString(16).padStart(6, '0')}`;
    };

    const activeRows = rows => rows.filter(row => row.deleted !== '1');
    const uniqueBy = (items, key) => [...new Map(items.map(item => [item[key], item])).values()];
    const screenshotCollection = type => {
        const normalizedType = String(type || '').trim().toLowerCase();
        if (normalizedType === 'regular') return 'Renders';
        if (normalizedType === 'panoramic') return '360° Panorama';
        if (normalizedType === 'walkthrough360') return '360° Walkthrough';
        return 'Renders';
    };
    const folderCollection = type => {
        const normalizedType = String(type || '').trim().toLowerCase();
        if (normalizedType === 'projects') return 'Floor Plans';
        if (normalizedType === 'snapshots') return 'Renders';
        return '';
    };

    const renderResolution = (width, height, draft) => {
        if (String(draft || '') === '1') return 'Draft';

        const numericWidth = Number.parseInt(String(width || ''), 10);
        const numericHeight = Number.parseInt(String(height || ''), 10);
        if (!Number.isFinite(numericWidth) || !Number.isFinite(numericHeight)) return '';

        const pixels = numericWidth * numericHeight;
        if (pixels >= 8_000_000) return '4K';
        if (pixels >= 3_500_000) return '2K';
        if (pixels >= 2_000_000) return 'FHD';
        if (pixels >= 900_000) return 'HD';
        return '';
    };

    const withPresentation = (file, owner) => ({
        ...file,
        owner,
        previewUrl: previewUrl(file.hash, file.type, file.previewNumber),
        updated: readableDate(file.udate || file.cdate)
    });

    const loadDemoAccount = (config = accountConfigs.many) => {
        const allSpaces = [
            { id: 'demo-river-house', title: 'My Home', address: '120 River Road, Portland, OR', cdate: '2026-07-24 09:00:00', udate: '2026-07-24 09:00:00', active: true, initial: 'M', avatarColor: '#6BA6F5', previewUrl: '/spaces-chat-ai/spaces-static/assets/images/spaces/card-image-1.webp' },
            { id: 'demo-apartment', title: 'Apartment', address: '45 Green Street, New York, NY', cdate: '2026-07-23 12:00:00', udate: '2026-07-23 12:00:00', initial: 'A', avatarColor: '#ffb290', previewUrl: '/spaces-chat-ai/spaces-static/assets/images/spaces-v2/collection-preview.png' },
            { id: 'demo-white-house', title: 'The White House', address: '1600 Pennsylvania Avenue, Washington, DC', cdate: '2026-07-22 12:00:00', udate: '2026-07-22 12:00:00', initial: 'T', avatarColor: '#dcb4f8', previewUrl: '/spaces-chat-ai/spaces-static/assets/images/spaces-v2/inside-section-file.webp' },
            { id: 'demo-smith-residence', title: 'Smith Residence', address: '8 Maple Avenue, Austin, TX', cdate: '2026-07-21 12:00:00', udate: '2026-07-21 12:00:00', initial: 'S', avatarColor: '#fedc69', previewUrl: '/spaces-chat-ai/spaces-static/assets/images/spaces/card-image-1.webp' },
            { id: 'demo-country-cottage', title: 'Country Cottage', address: '71 Meadow Lane, Aspen, CO', cdate: '2026-07-20 12:00:00', udate: '2026-07-20 12:00:00', initial: 'C', avatarColor: '#dedede', previewUrl: '/spaces-chat-ai/spaces-static/assets/images/spaces-v2/collection-preview.png' },
            { id: 'demo-lake-house', title: 'Lake House', address: '18 Shoreline Drive, Seattle, WA', cdate: '2026-07-19 12:00:00', udate: '2026-07-19 12:00:00', initial: 'L', avatarColor: '#a8e5c6', previewUrl: '/spaces-chat-ai/spaces-static/assets/images/spaces-v2/inside-section-file.webp' },
            { id: 'demo-modern-villa', title: 'Modern Villa', address: '265 Palm Avenue, Miami, FL', cdate: '2026-07-18 12:00:00', udate: '2026-07-18 12:00:00', initial: 'M', avatarColor: '#a8dff2', previewUrl: '/spaces-chat-ai/spaces-static/assets/images/spaces/card-image-1.webp' },
            { id: 'demo-cozy-loft', title: 'Cozy Loft', address: '89 Market Street, San Francisco, CA', cdate: '2026-07-17 12:00:00', udate: '2026-07-17 12:00:00', initial: 'C', avatarColor: '#a8d0ff', previewUrl: '/spaces-chat-ai/spaces-static/assets/images/spaces-v2/collection-preview.png' },
            { id: 'demo-forest-cabin', title: 'Forest Cabin', address: '14 Pine Trail, Bend, OR', cdate: '2026-07-16 12:00:00', udate: '2026-07-16 12:00:00', initial: 'F', avatarColor: '#f3afd8', previewUrl: '/spaces-chat-ai/spaces-static/assets/images/spaces-v2/inside-section-file.webp' },
            { id: 'demo-city-apartment', title: 'City Apartment', address: '501 Central Avenue, Chicago, IL', cdate: '2026-07-15 12:00:00', udate: '2026-07-15 12:00:00', initial: 'C', avatarColor: '#ffb290', previewUrl: '/spaces-chat-ai/spaces-static/assets/images/spaces/card-image-1.webp' }
        ];
        const spaceCount = Number.isInteger(config.spaceCount) ? config.spaceCount : allSpaces.length;
        const spaces = allSpaces.slice(0, spaceCount);
        const spaceIds = new Set(spaces.map(space => String(space.id)));
        const files = [
            { id: 'demo-river-plan', type: 'Floor Plans', title: 'River house floor plan', spaceId: 'demo-river-house', folderId: '0', cdate: '2026-07-24 09:30:00', udate: '2026-07-24 09:30:00', previewUrl: '/spaces-chat-ai/spaces-static/assets/images/spaces-v2/inside-section-file.webp', generatedWithAi: true },
            { id: 'demo-river-render', type: 'Renders', title: 'Living room render', projectTitle: 'River house floor plan', resolution: '4K', spaceId: 'demo-river-house', folderId: '0', cdate: '2026-07-24 09:20:00', udate: '2026-07-24 09:20:00', previewUrl: '/spaces-chat-ai/spaces-static/assets/images/spaces/card-image-1.webp' },
            { id: 'demo-river-doc', type: 'Documents', title: 'River house renovation notes', spaceId: 'demo-river-house', folderId: 'demo-documents', cdate: '2026-07-24 08:45:00', udate: '2026-07-24 08:45:00', previewUrl: '' },
            { id: 'demo-apartment-plan', type: 'Floor Plans', title: 'Apartment layout', spaceId: 'demo-apartment', folderId: '0', cdate: '2026-07-23 16:10:00', udate: '2026-07-23 16:10:00', previewUrl: '/spaces-chat-ai/spaces-static/assets/images/spaces-v2/collection-preview.png' },
            { id: 'demo-apartment-render', type: 'Renders', title: 'Apartment kitchen render', projectTitle: 'Apartment layout', resolution: 'FHD', spaceId: 'demo-apartment', folderId: '0', cdate: '2026-07-23 15:40:00', udate: '2026-07-23 15:40:00', previewUrl: '/spaces-chat-ai/spaces-static/assets/images/spaces/card-image-1.webp' },
            { id: 'demo-white-plan', type: 'Floor Plans', title: 'White House concept', spaceId: 'demo-white-house', folderId: '0', cdate: '2026-07-22 14:15:00', udate: '2026-07-22 14:15:00', previewUrl: '/spaces-chat-ai/spaces-static/assets/images/spaces-v2/inside-section-file.webp' },
            { id: 'demo-smith-plan', type: 'Floor Plans', title: 'Smith Residence plan', spaceId: 'demo-smith-residence', folderId: '0', cdate: '2026-07-21 10:30:00', udate: '2026-07-21 10:30:00', previewUrl: '/spaces-chat-ai/spaces-static/assets/images/spaces-v2/collection-preview.png' },
            { id: 'demo-cottage-plan', type: 'Floor Plans', title: 'Country Cottage plan', spaceId: 'demo-country-cottage', folderId: '0', cdate: '2026-07-20 11:20:00', udate: '2026-07-20 11:20:00', previewUrl: '/spaces-chat-ai/spaces-static/assets/images/spaces/card-image-1.webp' }
        ]
            .filter(file => spaceIds.has(String(file.spaceId)))
            .map(file => withPresentation(file, 'Demo'));
        const folders = [
            { id: 'document-folder-demo-documents', type: 'Documents', title: 'Renovation', spaceId: 'demo-river-house', parentId: '0' }
        ].filter(folder => spaceIds.has(String(folder.spaceId)));

        return {
            id: config.id,
            label: config.label,
            spaces,
            activeSpace: spaces[0],
            files,
            folders
        };
    };

    const loadAccount = async config => {
        const [
            spacesRows,
            floorplanRows,
            screenshotRows,
            moodboardRows,
            aiSheetRows,
            documentRows,
            documentFolderRows,
            folderRows
        ] = await Promise.all([
            readCsv(config.root, 'spaces'),
            readCsv(config.root, config.floorplans),
            readCsv(config.root, config.screenshots),
            readCsv(config.root, 'moodboards'),
            readCsv(config.root, 'ai_studio_sheets'),
            readCsv(config.root, config.documents),
            readCsv(config.root, config.documentFolders),
            readCsv(config.root, 'folders')
        ]);

        const spaces = uniqueBy(activeRows(spacesRows), 'id').map(row => ({
            id: row.id,
            hash: row.hash,
            title: row.title || row.name || 'Untitled Space',
            address: row.address || 'Fill Address',
            cdate: row.cdate,
            udate: row.udate,
            active: row.active === '1',
            previewUrl: spacePreviewUrl(row.hash),
            avatarColor: avatarColor(row.color),
            initial: (row.title || row.name || 'S').trim().slice(0, 1).toUpperCase()
        }));

        const spaceIds = new Set(spaces.map(space => String(space.id)));
        const floorplans = activeRows(floorplanRows).map(row => ({
            id: `project-${row.id}`,
            type: 'Floor Plans',
            title: row.name || 'Untitled project',
            hash: row.hash,
            sourceHash: row.from,
            spaceId: row.space_id,
            folderId: row.folder,
            cdate: row.cdate,
            udate: row.udate
        }));
        const floorplanByRelatedHash = new Map();
        floorplans.forEach(file => {
            if (file.hash) floorplanByRelatedHash.set(file.hash, file);
            if (file.sourceHash) floorplanByRelatedHash.set(file.sourceHash, file);
        });

        const screenshots = activeRows(screenshotRows)
            .filter(row => row.hash)
            .map(row => {
                const relatedFloorplan = floorplanByRelatedHash.get(row.hash);
                const collection = screenshotCollection(row.type);
                const exportedSpaceId = row.space_id || row.space_id_2 || '';
                const spaceId = spaceIds.has(String(exportedSpaceId))
                    ? exportedSpaceId
                    : relatedFloorplan?.spaceId || exportedSpaceId;
                return {
                    id: `screenshot-${row.id}`,
                    type: collection,
                    title: row.title || relatedFloorplan?.title || 'Screenshot',
                    hash: row.hash,
                    previewNumber: row.number,
                    projectTitle: relatedFloorplan?.title || row.title || 'Untitled project',
                    spaceId,
                    folderId: row.folder,
                    cdate: row.cdate,
                    udate: row.udate,
                    status: row.status || '',
                    resolution: collection === 'Renders'
                        ? renderResolution(row.width, row.height, row.draft)
                        : ''
                };
            });

        let files = [
            ...floorplans,
            ...screenshots,
            ...activeRows(moodboardRows).map(row => ({
                id: `moodboard-${row.id}`,
                type: 'Moodboards',
                title: row.title || 'Moodboard',
                hash: row.hash,
                spaceId: row.space_id,
                cdate: row.cdate,
                udate: row.udate
            })),
            ...activeRows(aiSheetRows).map(row => ({
                id: `ai-${row.id}`,
                type: 'AI Studio',
                title: row.title || 'AI Studio Sheet',
                hash: row.hash,
                spaceId: row.space_id,
                cdate: row.cdate,
                udate: row.udate
            })),
            ...activeRows(documentRows).map(row => ({
                id: `document-${row.id}`,
                type: 'Documents',
                title: row.name || 'Document',
                hash: row.hash,
                spaceId: row.space_id,
                folderId: row.folder_id,
                cdate: row.cdate,
                udate: row.udate,
                status: row.processing_status || ''
            }))
        ].map(file => withPresentation(file, config.label));

        const fallbackSpaceId = spaces.find(space => space.active)?.id || spaces[0]?.id || '';
        if (config.strictSpaceIds) {
            files = files.filter(file => spaceIds.has(String(file.spaceId)));
        }
        const folderSpaceById = new Map(
            files
                .filter(file => String(file.folderId || '0') !== '0')
                .map(file => [String(file.folderId), file.spaceId])
        );
        let folders = [
            ...activeRows(folderRows)
                .map(row => ({ row, type: folderCollection(row.type) }))
                .filter(item => item.type)
                .map(({ row, type }) => ({
                    id: `folder-${row.id}`,
                    type,
                    title: row.name || 'Untitled folder',
                    spaceId: row.space_id || folderSpaceById.get(String(row.id)) || fallbackSpaceId,
                    parentId: row.pid || '0',
                    color: row.color || ''
                })),
            ...activeRows(documentFolderRows).map(row => ({
                id: `document-folder-${row.id}`,
                type: 'Documents',
                title: row.name || 'Untitled folder',
                spaceId: row.space_id || fallbackSpaceId,
                parentId: row.parent_id || '0',
                tags: row.tags || ''
            }))
        ];
        if (config.strictSpaceIds) {
            folders = folders.filter(folder => spaceIds.has(String(folder.spaceId)));
        }
        const projectFolderIds = new Set(
            folders
                .filter(folder => folder.type === 'Floor Plans')
                .map(folder => folder.id.replace('folder-', ''))
        );
        const renderFolderIds = new Set(
            folders
                .filter(folder => folder.type === 'Renders')
                .map(folder => folder.id.replace('folder-', ''))
        );
        const documentFolderIds = new Set(
            folders
                .filter(folder => folder.type === 'Documents')
                .map(folder => folder.id.replace('document-folder-', ''))
        );
        files = files.map(file => {
            const currentFolderId = String(file.folderId || '0');
            const hasMissingProjectFolder = file.type === 'Floor Plans'
                && currentFolderId !== '0'
                && !projectFolderIds.has(currentFolderId);
            const hasMissingRenderFolder = file.type === 'Renders'
                && currentFolderId !== '0'
                && !renderFolderIds.has(currentFolderId);
            const hasMissingDocumentFolder = file.type === 'Documents'
                && currentFolderId !== '0'
                && !documentFolderIds.has(currentFolderId);
            return hasMissingProjectFolder || hasMissingRenderFolder || hasMissingDocumentFolder
                ? { ...file, folderId: '0' }
                : file;
        });

        const activeSpace = spaces.find(space => space.active)
            || spaces.reduce((selected, space) => {
                const selectedCount = files.filter(file => file.spaceId === selected?.id).length;
                const currentCount = files.filter(file => file.spaceId === space.id).length;
                return currentCount > selectedCount ? space : selected;
            }, spaces[0]);

        return {
            id: config.id,
            label: config.label,
            spaces,
            activeSpace,
            files,
            folders
        };
    };

    const accountPromises = new Map();
    const storedProfile = () => {
        try {
            const profile = localStorage.getItem(profileStorageKey);
            return accountConfigs[profile] ? profile : 'many';
        } catch {
            return 'many';
        }
    };

    const isDemoProfile = accountId => accountId === 'demo' || accountId === 'many' || accountId === 'one';

    const load = profile => {
        const accountId = accountConfigs[profile] ? profile : storedProfile();
        if (!accountPromises.has(accountId)) {
            const promise = (isDemoProfile(accountId)
                ? Promise.resolve(loadDemoAccount(accountConfigs[accountId]))
                : loadAccount(accountConfigs[accountId])).catch(error => {
                accountPromises.delete(accountId);
                throw error;
            });
            accountPromises.set(accountId, promise);
        }
        return accountPromises.get(accountId);
    };

    window.SpacesAccountData = { load };
})();
