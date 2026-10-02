import { expect, test, type Page } from "@playwright/test";

const forbiddenRuntimePaths = [
  "/assets/home-funnel/",
  "spaces-onboarding-state.js",
  "spaces-paywall-flow.js",
];

async function openStandaloneSpaces(page: Page) {
  const forbiddenRequests: string[] = [];

  page.on("request", (request) => {
    if (forbiddenRuntimePaths.some((path) => request.url().includes(path))) {
      forbiddenRequests.push(request.url());
    }
  });

  await page.goto("/");
  await page.waitForLoadState("load");

  expect(forbiddenRequests).toEqual([]);
  await expect
    .poll(() => page.locator("[data-space-menu-item]").count())
    .toBeGreaterThan(0);

  const funnelStorage = await page.evaluate(() => ({
    onboarding: localStorage.getItem("planner5d.home.onboarding.v1"),
    paywall: sessionStorage.getItem("planner5d.home.showPaywallAfterSpaces"),
  }));

  expect(funnelStorage).toEqual({ onboarding: null, paywall: null });
}

test("desktop baseline", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openStandaloneSpaces(page);
  await expect(page).toHaveScreenshot("spaces-desktop.png", {
    animations: "disabled",
  });
});

test("mobile viewport preserves the source fixed-width layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStandaloneSpaces(page);

  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(pageWidth).toBe(1200);

  await expect(page).toHaveScreenshot("spaces-mobile.png", {
    animations: "disabled",
  });
});

test("Many spaces is the default profile after the profile-default migration", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("planner5d-spaces-v2-user-profile", "natalia");
  });
  await openStandaloneSpaces(page);

  const manyOption = page.locator('[data-user-profile-option][data-user-profile="many"]');
  const oneOption = page.locator('[data-user-profile-option][data-user-profile="one"]');

  await expect(manyOption).toHaveAttribute("aria-pressed", "true");
  await expect(oneOption).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".header-avatar-letter")).toHaveText("D");
  await expect(page.locator('[data-space-tree] .spaces-space-main').first()).toContainText("My Home");
  await expect(page.getByRole("button", { name: "Show all" })).toBeVisible();
  await expect(page.locator('[data-spaces-list] > [data-space-tree]:not([hidden])')).toHaveCount(5);
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("planner5d-spaces-v2-user-profile")),
    )
    .toBe("many");
});

test("dragging Spaces selects Manual sorting and supports dropping into Pinned", async ({ page }) => {
  await openStandaloneSpaces(page);

  const result = await page.evaluate(() => {
    const createPointerEvent = (type: string, coordinates: { x: number; y: number }, pointerId = 7) => new PointerEvent(type, {
      bubbles: true,
      button: 0,
      pointerId,
      clientX: coordinates.x,
      clientY: coordinates.y,
    });
    const pointFor = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.left + 12, y: rect.top + rect.height / 2 };
    };
    const spacesList = document.querySelector('[data-spaces-list]');
    const source = spacesList?.querySelector('[data-space-order="1"]') as HTMLElement | null;
    const destination = spacesList?.querySelector('[data-space-order="0"]') as HTMLElement | null;
    const sourceRow = source?.querySelector('.spaces-space-row') as HTMLElement | null;
    const destinationRow = destination?.querySelector('.spaces-space-row') as HTMLElement | null;
    if (!source || !destination || !sourceRow || !destinationRow) throw new Error('Demo Space rows are unavailable');

    const sourceStartPoint = pointFor(sourceRow);
    sourceRow.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true,
      button: 0,
      pointerId: 7,
      clientX: sourceStartPoint.x,
      clientY: sourceStartPoint.y,
    }));
    const sourcePoint = pointFor(sourceRow);
    document.dispatchEvent(createPointerEvent('pointermove', { x: sourcePoint.x, y: sourcePoint.y + 12 }));
    document.dispatchEvent(createPointerEvent('pointermove', pointFor(destinationRow)));
    document.dispatchEvent(createPointerEvent('pointerup', pointFor(destinationRow)));

    const pinSource = spacesList?.querySelector('[data-space-order="2"]') as HTMLElement | null;
    const pinSourceRow = pinSource?.querySelector('.spaces-space-row') as HTMLElement | null;
    if (!pinSource || !pinSourceRow) throw new Error('Demo pin source is unavailable');
    const pinSourceStartPoint = pointFor(pinSourceRow);
    pinSourceRow.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true,
      button: 0,
      pointerId: 8,
      clientX: pinSourceStartPoint.x,
      clientY: pinSourceStartPoint.y,
    }));
    const pinSourcePoint = pointFor(pinSourceRow);
    document.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true,
      button: 0,
      pointerId: 8,
      clientX: pinSourcePoint.x,
      clientY: pinSourcePoint.y + 12,
    }));
    const pinnedList = document.querySelector('[data-pinned-list]');
    const pinnedSection = document.querySelector('[data-pinned-section]');
    if (!pinnedList || !pinnedSection) throw new Error('Pinned list is unavailable');
    document.dispatchEvent(createPointerEvent('pointermove', pointFor(pinnedSection), 8));
    document.dispatchEvent(createPointerEvent('pointerup', pointFor(pinnedSection), 8));

    const pinnedRow = pinSource.querySelector('.spaces-space-row') as HTMLElement | null;
    if (!pinnedRow) throw new Error('Pinned Space row is unavailable');
    const pinnedStartPoint = pointFor(pinnedRow);
    pinnedRow.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true,
      button: 0,
      pointerId: 9,
      clientX: pinnedStartPoint.x,
      clientY: pinnedStartPoint.y,
    }));
    document.dispatchEvent(createPointerEvent('pointermove', { x: pinnedStartPoint.x, y: pinnedStartPoint.y + 12 }, 9));
    document.dispatchEvent(createPointerEvent('pointermove', pointFor(destinationRow), 9));
    document.dispatchEvent(createPointerEvent('pointerup', pointFor(destinationRow), 9));

    return {
      manualSelected: document.querySelector('[data-spaces-sort="manual"]')?.getAttribute('aria-checked'),
      topSpaceOrder: spacesList?.querySelector(':scope > [data-space-tree]')?.getAttribute('data-space-order'),
      pinnedOrders: [...pinnedList.querySelectorAll(':scope > [data-space-tree]')]
        .map(space => space.getAttribute('data-space-order')),
      restoredToSpaces: spacesList?.contains(pinSource),
    };
  });

  expect(result.manualSelected).toBe("true");
  expect(result.topSpaceOrder).toBe("1");
  expect(result.pinnedOrders).toEqual([]);
  expect(result.restoredToSpaces).toBe(true);
});

test("home profile shows the personalized two-column library", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openStandaloneSpaces(page);

  await page.getByRole("button", { name: "Profile settings" }).click();
  await page
    .getByRole("group", { name: "Page profile" })
    .getByRole("button", { name: "Home", exact: true })
    .click();

  await expect(page.getByRole("heading", { name: "Hi, Demo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Spaces" })).toBeVisible();
  await expect(page.locator("[data-home-page] .spaces-home-actions")).toHaveCount(0);

  const homePage = page.locator("[data-home-page]");
  const homeSearch = homePage.locator(".spaces-home-search");
  await expect(homeSearch).toHaveCSS("max-width", "480px");
  await expect(homeSearch).toHaveCSS("height", "56px");
  const [homeBox, searchBox] = await Promise.all([
    homePage.boundingBox(),
    homeSearch.boundingBox(),
  ]);
  expect(homeBox).not.toBeNull();
  expect(searchBox).not.toBeNull();
  expect(Math.abs((searchBox!.x + searchBox!.width / 2) - (homeBox!.x + homeBox!.width / 2))).toBeLessThan(1);

  const mainScroll = page.locator("main.get-started-main");
  const mainHeader = page.locator(".header-spaces");
  await mainScroll.evaluate((element) => {
    element.scrollTop = 400;
    element.dispatchEvent(new Event("scroll"));
  });
  await expect(mainHeader).toHaveClass(/scrolled/);
  await mainScroll.evaluate((element) => {
    element.scrollTop = 0;
    element.dispatchEvent(new Event("scroll"));
  });
  await expect(mainHeader).not.toHaveClass(/scrolled/);

  await expect(homePage).toHaveAttribute("data-home-data-state", "ready");
  await expect
    .poll(() => homePage.locator("[data-home-file-search]").count())
    .toBeGreaterThan(0);
  await expect(homePage.locator("[data-home-file-search]")).toHaveCount(5);
  const showAllRecent = homePage.getByRole("button", { name: "Show All" });
  await expect(showAllRecent).toBeVisible();
  await showAllRecent.click();
  await expect(homePage.locator("[data-home-file-search]")).toHaveCount(5);
  await expect(showAllRecent).toBeVisible();
  await expect
    .poll(() => homePage.locator("[data-home-space-card]").count())
    .toBeGreaterThan(0);

  const spaceAvatars = homePage.locator(".spaces-home-space-card .spaces-home-space-initial");
  await expect(spaceAvatars.first()).toHaveCSS("width", "20px");
  await expect(spaceAvatars.first()).toHaveCSS("height", "20px");
  await expect(spaceAvatars.first()).toHaveCSS("background-color", "rgb(168, 208, 255)");
  await expect(spaceAvatars.nth(1)).toHaveCSS("background-color", "rgb(255, 178, 144)");

  const secondSpacePreview = homePage.locator(".spaces-home-space-image").nth(1);
  await expect(secondSpacePreview).toHaveAttribute(
    "src",
    "/spaces-static/assets/images/spaces-v2/collection-preview.png",
  );
  await expect
    .poll(() => secondSpacePreview.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);

  const forYouToggle = page.getByRole("button", { name: "For you" });
  const forYouContent = homePage.locator("[data-home-for-you-content]");
  await forYouToggle.click();
  await expect(forYouToggle).toHaveAttribute("aria-expanded", "false");
  await expect(forYouContent).toBeHidden();
  await forYouToggle.click();
  await expect(forYouToggle).toHaveAttribute("aria-expanded", "true");
  await expect(forYouContent).toBeVisible();

  const recommendation = homePage.locator(".spaces-home-recommendation").first();
  await recommendation.hover();
  await expect(recommendation).toHaveCSS("background-color", "rgba(0, 0, 0, 0.02)");
  await expect(recommendation).toHaveCSS("box-shadow", "none");

  const firstSpaceCard = homePage.locator("[data-home-space-card]").first();
  await firstSpaceCard.hover();
  await expect(firstSpaceCard).toHaveCSS("background-color", "rgba(0, 0, 0, 0.02)");
  await expect(firstSpaceCard).toHaveCSS("box-shadow", "none");

  const firstRecentRow = homePage.locator("[data-home-file-search]").first();
  await firstRecentRow.hover();
  await expect(firstRecentRow).toHaveCSS("background-color", "rgba(0, 0, 0, 0.02)");
  await expect(firstRecentRow).toHaveCSS("box-shadow", "none");

  await page.evaluate(async () => {
    await (window as typeof window & {
      SpacesAccountProfile: { applyProfile: (profile: string) => Promise<void> };
    }).SpacesAccountProfile.applyProfile("evelina");
  });
  await expect(page.getByRole("heading", { name: "Hi, Evelina" })).toBeVisible();
  const firstSpaceId = await firstSpaceCard.getAttribute("data-home-space-id");
  const firstSidebarSpace = page.locator(
    `[data-space-tree][data-account-space-id="${firstSpaceId}"] .spaces-space-main`,
  );
  await expect(firstSidebarSpace.locator(".spaces-space-avatar")).toHaveCSS(
    "background-color",
    "rgb(220, 180, 248)",
  );
  const secondSpaceId = await homePage
    .locator("[data-home-space-card]")
    .nth(1)
    .getAttribute("data-home-space-id");
  const secondSidebarSpace = page.locator(
    `[data-space-tree][data-account-space-id="${secondSpaceId}"] .spaces-space-main`,
  );
  await expect(secondSidebarSpace.locator(".spaces-space-avatar")).toHaveCSS(
    "background-color",
    "rgb(163, 205, 226)",
  );

  await page
    .getByRole("combobox", { name: "Filter recent files by type" })
    .selectOption("floor-plans");
  await expect
    .poll(() => homePage.locator('[data-home-file-type="floor-plans"]:not([hidden])').count())
    .toBeGreaterThan(0);
  await expect(homePage.locator('[data-home-file-search]:not([data-home-file-type="floor-plans"]):not([hidden])')).toHaveCount(0);

  await page
    .getByRole("combobox", { name: "Filter recent files by type" })
    .selectOption("all");

  await homePage.locator("[data-home-space-card]").first().click();
  await expect(homePage).toBeHidden();
  await expect(firstSidebarSpace).toHaveClass(/is-active/);
  await expect(firstSidebarSpace).toHaveAttribute("aria-current", "page");
});

test("header and Home searches show global results without opening a Space", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openStandaloneSpaces(page);

  await page.evaluate(async () => {
    await (window as typeof window & {
      SpacesAccountProfile: { applyProfile: (profile: string) => Promise<void> };
    }).SpacesAccountProfile.applyProfile("evelina");
  });

  const headerSearch = page.locator("[data-header-search]");
  const headerPopover = page.locator("[data-header-search-popover]");
  await headerSearch.fill("Renders");
  await expect(headerPopover).toBeVisible();
  await expect(headerPopover.locator('[data-header-search-category="renders"]')).toBeVisible();

  // A query can match a file name while the result set contains several file
  // types. Every matching type must remain available as a popover filter.
  await headerSearch.fill("DS");
  await expect(headerPopover.locator('[data-header-search-category="renders"]')).toBeVisible();
  await expect(headerPopover.locator('[data-header-search-category="floor plans"]')).toBeVisible();
  await expect(headerPopover.locator('[data-header-search-category="moodboards"]')).toBeVisible();

  await headerSearch.fill("Cozy");
  const globalPage = page.locator("[data-global-search-page]");
  await expect(headerPopover).toBeVisible();
  await expect(globalPage).toBeHidden();
  await expect(page.locator(".spaces-info-wrap")).toBeVisible();
  await expect(page.locator(".spaces-quick-actions")).toBeVisible();
  await expect
    .poll(() => headerPopover.locator("[data-header-search-result]").count())
    .toBeGreaterThan(0);
  expect(await headerPopover.locator("[data-header-search-result]").count()).toBeLessThanOrEqual(5);
  await expect(headerPopover.locator(".spaces-header-search-result-date").first()).toHaveText("Jul 17");
  await headerPopover.locator("[data-header-search-all]").click();

  await expect(globalPage).toBeVisible();
  await expect(page.locator(".spaces-info-wrap")).toBeHidden();
  await expect(page.locator(".spaces-quick-actions")).toBeHidden();
  await expect(page.locator(".spaces-space-main.is-active")).toHaveCount(0);
  await expect
    .poll(() => globalPage.locator("[data-global-result-row]").count())
    .toBeGreaterThan(0);
  await expect
    .poll(() => globalPage.locator("[data-global-result-tab]").count())
    .toBeGreaterThan(1);
  await expect(globalPage.getByRole("columnheader", { name: "File type" })).toBeVisible();
  await expect(
    globalPage.locator("[data-global-result-row]").first().locator('[role="cell"]').nth(4),
  ).toHaveText("Renders");
  await expect(globalPage.locator(".spaces-global-result-location").first()).toContainText(
    "New Space",
  );

  await headerSearch.fill("");
  await expect(globalPage).toBeHidden();
  await expect(page.locator(".spaces-info-wrap")).toBeVisible();

  const homeButton = page.locator("[data-home-page-trigger]");
  await homeButton.click();
  const homePage = page.locator("[data-home-page]");
  await expect(homePage).toBeVisible();
  await expect(headerSearch).toBeHidden();
  const homeSearch = homePage.locator("[data-home-search]");
  await homeSearch.fill("Cozy");
  await expect(homePage).toBeVisible();
  await expect(homePage.locator(".spaces-home-for-you")).toBeHidden();
  await expect(homePage.locator(".spaces-home-library")).toBeHidden();
  const homeResults = homePage.locator("[data-home-global-results]");
  await expect(homeResults).toBeVisible();
  await expect
    .poll(() => homeResults.locator("[data-global-result-row]").count())
    .toBeGreaterThan(0);

  await homeSearch.fill("");
  await expect(homeResults).toBeHidden();
  await expect(homePage.locator(".spaces-home-for-you")).toBeVisible();
  await expect(homePage.locator(".spaces-home-library")).toBeVisible();
});

test("Vanessa CSV export keeps every space, folder, file, and hash preview", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openStandaloneSpaces(page);

  const summary = await page.evaluate(async () => {
    const data = await (window as typeof window & {
      SpacesAccountData: {
        load: (profile: string) => Promise<{
          id: string;
          label: string;
          activeSpace?: { id: string; title: string };
          spaces: Array<{
            id: string;
            title: string;
            previewUrl: string;
            avatarColor: string;
          }>;
          folders: Array<{ id: string; spaceId: string }>;
          files: Array<{
            id: string;
            type: string;
            hash: string;
            spaceId: string;
            previewUrl: string;
          }>;
        }>;
      };
    }).SpacesAccountData.load("vanessa");
    const types = data.files.reduce<Record<string, number>>((counts, file) => {
      counts[file.type] = (counts[file.type] || 0) + 1;
      return counts;
    }, {});
    const spaceIds = new Set(data.spaces.map((space) => String(space.id)));
    const projectFolderIds = new Set(
      data.folders
        .filter((folder: { id: string }) => folder.id.startsWith("folder-"))
        .map((folder: { id: string }) => folder.id.replace("folder-", "")),
    );
    const documentFolderIds = new Set(
      data.folders
        .filter((folder: { id: string }) => folder.id.startsWith("document-folder-"))
        .map((folder: { id: string }) => folder.id.replace("document-folder-", "")),
    );
    const danglingFolderReferences = data.files.filter((file) => {
      const folderId = String((file as typeof file & { folderId?: string }).folderId || "0");
      if (folderId === "0") return false;
      if (file.type === "Floor Plans") return !projectFolderIds.has(folderId);
      if (file.type === "Documents") return !documentFolderIds.has(folderId);
      return false;
    }).length;

    return {
      id: data.id,
      label: data.label,
      activeSpace: data.activeSpace,
      spaces: data.spaces,
      folderCount: data.folders.length,
      fileCount: data.files.length,
      types,
      filesOutsideExportedSpaces: data.files.filter(
        (file) => !spaceIds.has(String(file.spaceId)),
      ).length,
      foldersOutsideExportedSpaces: data.folders.filter(
        (folder) => !spaceIds.has(String(folder.spaceId)),
      ).length,
      duplicateFileIds: data.files.length - new Set(data.files.map((file) => file.id)).size,
      duplicateFolderIds:
        data.folders.length - new Set(data.folders.map((folder) => folder.id)).size,
      danglingFolderReferences,
      screenshotPreviewCounts: Object.fromEntries(
        ["Renders", "360° Panorama", "360° Walkthrough"].map((type) => {
          const files = data.files.filter((file) => file.type === type);
          return [type, {
            files: files.length,
            uniquePreviews: new Set(files.map((file) => file.previewUrl)).size,
          }];
        }),
      ),
      previews: Object.fromEntries(
        ["Floor Plans", "Renders", "Moodboards", "360° Panorama", "360° Walkthrough"]
          .map((type) => [type, data.files.find((file) => file.type === type)?.previewUrl]),
      ),
    };
  });

  expect(summary).toMatchObject({
    id: "vanessa",
    label: "Vanessa",
    activeSpace: { id: "12053332", title: "Vanessa's Space" },
    folderCount: 31,
    fileCount: 229,
    filesOutsideExportedSpaces: 0,
    foldersOutsideExportedSpaces: 0,
    duplicateFileIds: 0,
    duplicateFolderIds: 0,
    danglingFolderReferences: 0,
    screenshotPreviewCounts: {
      Renders: { files: 27, uniquePreviews: 27 },
      "360° Panorama": { files: 1, uniquePreviews: 1 },
      "360° Walkthrough": { files: 72, uniquePreviews: 72 },
    },
    types: {
      "Floor Plans": 93,
      Renders: 27,
      "360° Panorama": 1,
      "360° Walkthrough": 72,
      Moodboards: 23,
      "AI Studio": 12,
      Documents: 1,
    },
  });
  expect(summary.spaces).toEqual([
    expect.objectContaining({
      id: "29071888",
      title: "My Space",
      previewUrl: "https://storage.planner5d.com/space/f603aa0d4b10d4fdcc7e2bdfdf91bfdc",
      avatarColor: "#f8b3b0",
    }),
    expect.objectContaining({
      id: "12053332",
      title: "Vanessa's Space",
      previewUrl: "https://storage.planner5d.com/space/b4ef530efcd3876f810bd3651114f205",
      avatarColor: "#ffb290",
    }),
  ]);
  expect(summary.previews["Floor Plans"]).toMatch(
    /^https:\/\/storage\.planner5d\.com\/thumbs\.600\/.+\.webp$/,
  );
  expect(summary.previews.Renders).toBe(
    "https://storage.planner5d.com/s/f6b03d0e52500a140af1e6b25177a69c_38",
  );
  expect(summary.previews.Moodboards).toMatch(
    /^https:\/\/storage\.planner5d\.com\/moodboards_thumbs\.600\/.+\.webp$/,
  );
  expect(summary.previews["360° Panorama"]).toBe(
    "https://storage.planner5d.com/s/f6b03d0e52500a140af1e6b25177a69c_36051101",
  );
  expect(summary.previews["360° Walkthrough"]).toBe(
    "https://storage.planner5d.com/s/fa16c82d5adb5fa58314d2c5b1bc51da_36291615",
  );

  await page.evaluate(async () => {
    await (window as typeof window & {
      SpacesAccountProfile: { applyProfile: (profile: string) => Promise<void> };
    }).SpacesAccountProfile.applyProfile("vanessa");
  });

  await expect(page.locator("body")).toHaveAttribute("data-user-profile", "vanessa");
  await expect(page.locator(".header-avatar-letter")).toHaveText("V");
  await expect(page.locator('[data-space-tree]:not([hidden])')).toHaveCount(2);
  await expect(page.locator('[data-space-tree][data-account-space-id="12053332"]')).toContainText(
    "Vanessa's Space",
  );
  await expect(page.locator('[data-space-tree][data-account-space-id="29071888"]')).toContainText(
    "My Space",
  );
  await expect(page.locator("[data-space-name]")).toHaveText("Vanessa's Space");
  await expect(page.locator("[data-space-address]")).toHaveText("Madrid, Spain");
  await expect(page.locator(".spaces-info-img img")).toHaveAttribute(
    "src",
    "https://storage.planner5d.com/space/b4ef530efcd3876f810bd3651114f205",
  );

  await page.locator("[data-home-page-trigger]").click();
  const homePage = page.locator("[data-home-page]");
  await expect(page.getByRole("heading", { name: "Hi, Vanessa" })).toBeVisible();
  await expect(homePage.locator("[data-home-space-card]")).toHaveCount(2);
  await expect(homePage.locator("[data-home-file-search]")).toHaveCount(5);
  const tyquillaRecent = homePage
    .locator("[data-home-file-search]")
    .filter({ hasText: "Tyquilla's Project V25" });
  await expect(tyquillaRecent).toHaveCount(1);
  await expect(tyquillaRecent.locator(".spaces-home-recent-thumbnail img")).toHaveAttribute(
    "src",
    "https://storage.planner5d.com/thumbs.600/93bffadeb477f7870c98c052df3c5e8e.webp",
  );
  await expect(
    homePage.locator('[data-home-space-card][data-home-space-id="12053332"] .spaces-home-space-image'),
  ).toHaveAttribute(
    "src",
    "https://storage.planner5d.com/space/b4ef530efcd3876f810bd3651114f205",
  );
  await expect
    .poll(() =>
      homePage
        .locator('[data-home-space-card][data-home-space-id="29071888"] .spaces-home-space-image')
        .getAttribute("src"),
    )
    .toBe("/spaces-static/assets/images/spaces/card-image-1.webp");

  await homePage
    .locator('[data-home-space-card][data-home-space-id="29071888"]')
    .click();
  await expect(page.locator('[data-space-tree][data-account-space-id="29071888"] .spaces-space-main')).toHaveClass(
    /is-active/,
  );
  await expect(page.locator("[data-space-name]")).toHaveText("My Space");
  await expect
    .poll(() => page.locator(".spaces-info-img img").getAttribute("src"))
    .toBe("/spaces-static/assets/images/spaces/card-image-1.webp");
});

test("Natalia CSV export maps projects and screenshots to the correct collections", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openStandaloneSpaces(page);

  const summary = await page.evaluate(async () => {
    const data = await (window as typeof window & {
      SpacesAccountData: {
        load: (profile: string) => Promise<{
          id: string;
          label: string;
          activeSpace?: { id: string; title: string };
          spaces: Array<{ id: string; title: string; previewUrl: string }>;
          folders: Array<{ id: string; type: string; title: string; spaceId: string }>;
          files: Array<{
            id: string;
            type: string;
            hash: string;
            spaceId: string;
            previewUrl: string;
            resolution?: string;
          }>;
        }>;
      };
    }).SpacesAccountData.load("natalia");
    const types = data.files.reduce<Record<string, number>>((counts, file) => {
      counts[file.type] = (counts[file.type] || 0) + 1;
      return counts;
    }, {});
    const spaceIds = new Set(data.spaces.map((space) => String(space.id)));

    return {
      id: data.id,
      label: data.label,
      activeSpace: data.activeSpace,
      spaces: data.spaces,
      folderCount: data.folders.length,
      folderTypes: data.folders.reduce<Record<string, number>>((counts, folder) => {
        counts[folder.type] = (counts[folder.type] || 0) + 1;
        return counts;
      }, {}),
      fileCount: data.files.length,
      types,
      filesOutsideExportedSpaces: data.files.filter(
        (file) => !spaceIds.has(String(file.spaceId)),
      ).length,
      foldersOutsideExportedSpaces: data.folders.filter(
        (folder) => !spaceIds.has(String(folder.spaceId)),
      ).length,
      duplicateFileIds: data.files.length - new Set(data.files.map((file) => file.id)).size,
      duplicateSpaceIds: data.spaces.length - new Set(data.spaces.map((space) => space.id)).size,
      renderPreview: data.files.find((file) => file.type === "Renders")?.previewUrl,
      walkthroughPreview: data.files.find((file) => file.type === "360° Walkthrough")?.previewUrl,
      screenshotPreviewCounts: Object.fromEntries(
        ["Renders", "360° Panorama", "360° Walkthrough"].map((type) => {
          const files = data.files.filter((file) => file.type === type);
          return [type, {
            files: files.length,
            uniquePreviews: new Set(files.map((file) => file.previewUrl)).size,
          }];
        }),
      ),
      renderResolutions: [...new Set(
        data.files
          .filter((file) => file.type === "Renders")
          .map((file) => file.resolution)
          .filter(Boolean),
      )].sort(),
    };
  });

  expect(summary).toMatchObject({
    id: "natalia",
    label: "Natalia",
    activeSpace: { id: "5998468", title: "Mi Space" },
    folderCount: 11,
    fileCount: 227,
    filesOutsideExportedSpaces: 0,
    foldersOutsideExportedSpaces: 0,
    duplicateFileIds: 0,
    duplicateSpaceIds: 0,
    screenshotPreviewCounts: {
      Renders: { files: 60, uniquePreviews: 60 },
      "360° Panorama": { files: 0, uniquePreviews: 0 },
      "360° Walkthrough": { files: 39, uniquePreviews: 39 },
    },
    folderTypes: {
      "Floor Plans": 2,
      Renders: 1,
      Documents: 8,
    },
    types: {
      "Floor Plans": 87,
      Renders: 60,
      "360° Walkthrough": 39,
      Moodboards: 25,
      "AI Studio": 15,
      Documents: 1,
    },
  });
  expect(summary.spaces).toEqual([
    expect.objectContaining({
      id: "5998468",
      title: "Mi Space",
      previewUrl: "https://storage.planner5d.com/space/03fc90e159fac9cef4640b21c7cc9e9b",
    }),
  ]);
  expect(summary.renderPreview).toBe(
    "https://storage.planner5d.com/s/4ec53962125bc760ce09d4fbbfbe95cf_1",
  );
  expect(summary.walkthroughPreview).toBe(
    "https://storage.planner5d.com/s/36e6c99fc9368c413ba7426302ee2750_36062983",
  );
  expect(summary.renderResolutions).toEqual(["4K", "Draft", "HD"]);

  await page.evaluate(async () => {
    await (window as typeof window & {
      SpacesAccountProfile: { applyProfile: (profile: string) => Promise<void> };
    }).SpacesAccountProfile.applyProfile("natalia");
  });

  await expect(page.locator("body")).toHaveAttribute("data-user-profile", "natalia");
  await expect(page.locator("body")).toHaveClass(/spaces-single-space-profile/);
  await expect(page.locator(".header-avatar-letter")).toHaveText("N");
  await expect(page.locator('[data-space-tree]:not([hidden])')).toHaveCount(1);
  await expect(page.locator('[data-space-tree]:not([hidden]) [data-space-pin]:not([hidden])')).toHaveCount(0);
  await expect(page.locator('[data-space-tree]:not([hidden]) [data-space-pin]')).toBeHidden();
  await expect(page.locator("[data-space-name]")).toHaveText("Mi Space");
  await expect(page.locator("[data-space-address]")).toHaveText("Hola");
  await expect(page.locator(".spaces-info-img img")).toHaveAttribute(
    "src",
    "https://storage.planner5d.com/space/03fc90e159fac9cef4640b21c7cc9e9b",
  );

  await page.locator("[data-home-page-trigger]").click();
  const homePage = page.locator("[data-home-page]");
  await expect(page.getByRole("heading", { name: "Hi, Natalia" })).toBeVisible();
  await expect(homePage.locator("[data-home-space-card]")).toHaveCount(1);
  await expect(homePage.locator('[data-home-space-card][data-home-space-id="5998468"]')).toContainText(
    "Mi Space",
  );
  await expect(homePage.locator("[data-home-file-search]")).toHaveCount(5);
});

test("breadcrumb back clears the active collection in the sidebar", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openStandaloneSpaces(page);

  await page.evaluate(async () => {
    await (window as typeof window & {
      SpacesAccountProfile: { applyProfile: (profile: string) => Promise<void> };
    }).SpacesAccountProfile.applyProfile("evelina");
  });

  const alexeyTree = page.locator('[data-space-tree][data-account-space-id="11834724"]');
  const alexeySpace = alexeyTree.locator(".spaces-space-main");
  const alexeyChevron = alexeyTree.locator(".spaces-space-chevron");
  const floorPlans = alexeyTree.locator(".spaces-tree-item").filter({ hasText: "Floor Plans" });

  await alexeySpace.click();
  if (await alexeyChevron.getAttribute("aria-expanded") === "false") {
    await alexeyChevron.click();
  }
  await floorPlans.click();
  await expect(floorPlans).toHaveClass(/is-active/);

  await page.locator("[data-inside-back]").click();
  await expect(floorPlans).not.toHaveClass(/is-active/);
  await expect(alexeySpace).toHaveClass(/is-active/);
});

test("every Space pin and the shared icon expose tooltips", async ({ page }) => {
  await openStandaloneSpaces(page);

  await page.evaluate(async () => {
    await (window as typeof window & {
      SpacesAccountProfile: { applyProfile: (profile: string) => Promise<void> };
    }).SpacesAccountProfile.applyProfile("evelina");
  });

  const visibleSpaces = page.locator('[data-space-tree]:not([hidden])');
  await expect(visibleSpaces).toHaveCount(2);

  for (const index of [0, 1]) {
    const space = visibleSpaces.nth(index);
    await space.hover();
    const pin = space.locator("[data-space-pin]");
    await pin.hover();
    await expect(space.locator(".spaces-space-pin-tooltip")).toBeVisible();
  }

  const sharedSpace = visibleSpaces.nth(1);
  await sharedSpace.locator(".spaces-space-shared").hover();
  await expect(sharedSpace.locator(".spaces-space-shared-tooltip")).toHaveText(
    "Shared space",
  );
  await expect(sharedSpace.locator(".spaces-space-shared-tooltip")).toBeVisible();
});

test("header profile controls Create and navigation placement", async ({ page }) => {
  await openStandaloneSpaces(page);

  const hireDesigner = page.getByRole("button", { name: "Hire a Designer" });
  await expect(hireDesigner).toBeVisible();
  await expect(hireDesigner.locator("img")).toHaveAttribute(
    "src",
    "/spaces-static/assets/images/spaces-v2/action-hire-designer.svg",
  );

  await page.getByRole("button", { name: "Profile settings" }).click();
  await page.getByRole("tab", { name: "Header", exact: true }).click();

  await page
    .getByRole("group", { name: "Header create button" })
    .getByRole("button", { name: "Hide", exact: true })
    .click();
  await expect(page.locator(".header-create-control")).toBeHidden();

  await page
    .getByRole("group", { name: "Header navigation placement" })
    .getByRole("button", { name: "Centered", exact: true })
    .click();
  await expect(page.locator("header.header-spaces-v2")).toHaveClass(/is-header-navigation-centered/);
});

test("tabs toolbar exposes contextual tooltips", async ({ page }) => {
  await openStandaloneSpaces(page);

  await page.getByRole("button", { name: "Profile settings" }).click();
  await page
    .getByRole("group", { name: "Collections type" })
    .getByRole("button", { name: "Tabs", exact: true })
    .click();
  await page.getByRole("button", { name: "Close profile settings" }).click();

  const newProjectButton = page.getByRole("button", { name: "New project" });
  const newFolderButton = page.getByRole("button", { name: "New folder" });
  const viewToggle = page.getByRole("button", { name: "Switch to list view" });
  const previewInsetShadow = await page
    .locator(".spaces-tabs-file-preview")
    .first()
    .evaluate((element) => getComputedStyle(element, "::after").boxShadow);
  expect(previewInsetShadow).toContain("rgba(0, 0, 0, 0.04)");
  expect(previewInsetShadow).toContain("inset");

  await newProjectButton.hover();
  await expect(page.locator("#spaces-tabs-create-tooltip")).toBeVisible();
  await expect(page.locator("#spaces-tabs-create-tooltip")).toHaveText("New project");

  await newFolderButton.hover();
  await expect(page.locator("#spaces-tabs-folder-tooltip")).toBeVisible();
  await expect(page.locator("#spaces-tabs-folder-tooltip")).toHaveText("New folder");

  await viewToggle.hover();
  await expect(page.locator("[data-space-tabs-view-tooltip]")).toBeVisible();
  await expect(page.locator("[data-space-tabs-view-tooltip]")).toHaveText("Switch to List");

  await viewToggle.click();
  await expect(page.locator("[data-space-tabs-view-tooltip]")).toHaveText("Switch to Grid");
});

test("tabs never leak files from another Vanessa Space", async ({ page }) => {
  await openStandaloneSpaces(page);

  await page.evaluate(async () => {
    await (window as typeof window & {
      SpacesAccountProfile: { applyProfile: (profile: string) => Promise<void> };
    }).SpacesAccountProfile.applyProfile("vanessa");
  });
  await page.getByRole("button", { name: "Profile settings" }).click();
  await page
    .getByRole("group", { name: "Collections type" })
    .getByRole("button", { name: "Tabs", exact: true })
    .click();
  await page.getByRole("button", { name: "Close profile settings" }).click();

  const mySpace = page.locator(
    '[data-space-tree][data-account-space-id="29071888"] .spaces-space-main',
  );
  await mySpace.click();
  await expect(mySpace).toHaveClass(/is-active/);
  await expect(page.locator("[data-space-name]")).toHaveText("My Space");

  const tabButtons = page.locator("[data-space-tab]");
  for (let index = 0; index < await tabButtons.count(); index += 1) {
    await tabButtons.nth(index).click();
    await expect(page.locator("[data-space-tabs-file]:not([hidden])")).toHaveCount(0);
  }

  const vanessaSpace = page.locator(
    '[data-space-tree][data-account-space-id="12053332"] .spaces-space-main',
  );
  await vanessaSpace.click();
  await expect(vanessaSpace).toHaveClass(/is-active/);
  await expect(page.locator("[data-space-name]")).toHaveText("Vanessa's Space");
  await expect
    .poll(() => page.locator("[data-space-tabs-file]:not([hidden])").count())
    .toBeGreaterThan(0);
});

test("Tabs v2 moves search into the tab bar and collapses overflow folders", async ({ page }) => {
  await openStandaloneSpaces(page);

  await page.evaluate(async () => {
    await (window as typeof window & {
      SpacesAccountProfile: { applyProfile: (profile: string) => Promise<void> };
    }).SpacesAccountProfile.applyProfile("vanessa");
  });
  await page.getByRole("button", { name: "Profile settings" }).click();
  await page
    .getByRole("group", { name: "Collections type" })
    .getByRole("button", { name: "Tabs v2", exact: true })
    .click();
  await page.getByRole("button", { name: "Close profile settings" }).click();

  const mainContent = page.locator(".spaces-main-content");
  await expect(mainContent).toHaveClass(/is-tabs-v2/);
  await expect(page.locator("input[data-space-tabs-search]")).toBeHidden();
  await expect(page.getByRole("button", { name: "Search files" })).toBeVisible();

  const folderSection = page.locator("[data-space-tabs-folders]");
  const folderCards = page.locator(".spaces-tabs-folder-card");
  await expect(folderSection).toBeVisible();
  await expect.poll(() => folderCards.count()).toBeGreaterThan(4);

  const showAll = page.locator("[data-space-tabs-folders-toggle]");
  await expect(showAll).toBeVisible();
  const collapsedCount = await page.locator(".spaces-tabs-folder-card:visible").count();
  expect(collapsedCount).toBe(6);
  expect(collapsedCount).toBeLessThan(await folderCards.count());
  await expect
    .poll(() => folderSection.evaluate(element => (
      getComputedStyle(element).gridTemplateColumns.split(" ").length
    )))
    .toBe(7);

  await showAll.click();
  await expect(showAll).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".spaces-tabs-folder-card:visible")).toHaveCount(await folderCards.count());

  await page.getByRole("button", { name: "Search files" }).click();
  const tabSearch = page.locator("[data-space-tabs-search-v2-input]");
  await expect(tabSearch).toBeFocused();
  await tabSearch.fill("Tyquilla");
  await expect
    .poll(() => page.locator("[data-space-tabs-file]:not([hidden])").count())
    .toBeGreaterThan(0);

  const mySpace = page.locator(
    '[data-space-tree][data-account-space-id="29071888"] .spaces-space-main',
  );
  await mySpace.click();
  await expect(page.locator("[data-space-name]")).toHaveText("My Space");
  await expect(folderSection).toBeHidden();
  await expect(page.locator("[data-space-tabs-file]:not([hidden])")).toHaveCount(0);
});

test("Tabs v2 list view only shows files from the active collection", async ({ page }) => {
  await openStandaloneSpaces(page);

  await page.evaluate(async () => {
    await (window as typeof window & {
      SpacesAccountProfile: { applyProfile: (profile: string) => Promise<void> };
    }).SpacesAccountProfile.applyProfile("vanessa");
  });
  await page.getByRole("button", { name: "Profile settings" }).click();
  await page
    .getByRole("group", { name: "Collections type" })
    .getByRole("button", { name: "Tabs v2", exact: true })
    .click();
  await page.getByRole("button", { name: "Close profile settings" }).click();

  await page.getByRole("tab", { name: "Renders" }).click();
  await page.getByRole("button", { name: "Switch to list view" }).click();

  const visibleFiles = page.locator("[data-space-tabs-file]:not([hidden])");
  await expect(visibleFiles).toHaveCount(27);
  expect(await visibleFiles.evaluateAll(files => (
    files.every(file => file.getAttribute("data-space-tabs-collection") === "renders")
  ))).toBe(true);
  expect(await visibleFiles.locator(".spaces-tabs-file-resolution").allTextContents()
    .then(values => [...new Set(values)].sort())).toEqual(["2K", "4K", "Draft", "FHD", "HD"]);
  expect(await visibleFiles.locator(".spaces-tabs-file-project").allTextContents()
    .then(values => values.every(value => value.trim() && value !== "—"))).toBe(true);
  await expect(visibleFiles.first().locator(".spaces-tabs-file-preview img")).toHaveAttribute(
    "src",
    /^https:\/\/storage\.planner5d\.com\/s\/.+_\d+$/,
  );
  await expect(
    page.locator('[data-space-tabs-file][data-space-tabs-collection="floor plans"]:visible'),
  ).toHaveCount(0);
});

test("render cards show only 4K, 2K, and FHD resolution badges", async ({ page }) => {
  await openStandaloneSpaces(page);

  await page.evaluate(async () => {
    await (window as typeof window & {
      SpacesAccountProfile: { applyProfile: (profile: string) => Promise<void> };
    }).SpacesAccountProfile.applyProfile("vanessa");
  });
  await page.getByRole("button", { name: "Profile settings" }).click();
  await page
    .getByRole("group", { name: "Collections type" })
    .getByRole("button", { name: "Tabs v2", exact: true })
    .click();
  await page.getByRole("button", { name: "Close profile settings" }).click();
  await page.getByRole("tab", { name: "Renders", exact: true }).click();

  const visibleRenderCards = page.locator("[data-space-tabs-file]:not([hidden])");
  const visibleBadges = visibleRenderCards.locator(".spaces-render-resolution-badge");
  const labels = await visibleBadges.allTextContents();
  expect(new Set(labels)).toEqual(new Set(["4K", "2K", "FHD"]));
  expect(labels.length).toBeLessThan(await visibleRenderCards.count());

  await page.getByRole("tab", { name: "360° Panorama", exact: true }).click();
  await expect(
    page.locator("[data-space-tabs-file]:not([hidden]) .spaces-render-resolution-badge"),
  ).toHaveCount(0);
});

test("inside search hides folders and restores them when cleared", async ({ page }) => {
  await openStandaloneSpaces(page);

  await page.evaluate(async () => {
    await (window as typeof window & {
      SpacesAccountProfile: { applyProfile: (profile: string) => Promise<void> };
    }).SpacesAccountProfile.applyProfile("vanessa");
  });

  const vanessaTree = page.locator(
    '[data-space-tree][data-account-space-id="12053332"]',
  );
  const chevron = vanessaTree.locator(".spaces-space-chevron");
  if (await chevron.getAttribute("aria-expanded") === "false") {
    await chevron.click();
  }
  await vanessaTree
    .locator(".spaces-tree-item")
    .filter({ hasText: "Floor Plans" })
    .click();

  const folders = page.locator("[data-inside-folders]");
  const search = page.getByRole("searchbox", { name: "Search inside files" });
  await expect(folders).toBeVisible();
  await search.fill("Tyquilla");
  await expect(folders).toBeHidden();
  await search.fill("");
  await expect(folders).toBeVisible();
});

test("inside version 4 keeps search expanded and shows folders", async ({ page }) => {
  await openStandaloneSpaces(page);

  await page.evaluate(async () => {
    await (window as typeof window & {
      SpacesAccountProfile: { applyProfile: (profile: string) => Promise<void> };
    }).SpacesAccountProfile.applyProfile("vanessa");
  });

  await page.locator('[data-collection="floor plans"] > a').click();

  await expect(page.getByRole("searchbox", { name: "Search inside files" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Folders" })).toBeVisible();
  await expect(page.locator("[data-inside-folder-list] button").first()).toBeVisible();
  await expect(page.locator("[data-inside-projects-title]")).toHaveText("Floor Plans");
});
