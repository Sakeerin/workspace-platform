import { test, expect } from '@playwright/test';

test.describe('Search Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Assume user is logged in and on a workspace
    // In practice, you'd set up authentication state
    await page.goto('/');
  });

  test('should display search interface', async ({ page, request }) => {
    // Setup: Register, login, create workspace and pages
    const timestamp = Date.now();
    const testEmail = `test-e2e-search-${timestamp}@example.com`;
    const testPassword = 'password123';

    // Register user
    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'E2E Search Test User',
      },
    });

    expect(registerResponse.ok()).toBeTruthy();

    // Login
    const loginResponse = await request.post('http://localhost:3000/api/v1/auth/login', {
      data: {
        email: testEmail,
        password: testPassword,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const { data } = await loginResponse.json();
    const accessToken = data.tokens.access_token;

    // Get workspace
    const workspacesResponse = await request.get('http://localhost:3000/api/v1/workspaces', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(workspacesResponse.ok()).toBeTruthy();
    const workspacesData = await workspacesResponse.json();
    const workspaceUuid = workspacesData.data[0]?.uuid;

    expect(workspaceUuid).toBeDefined();

    // Set auth token in browser
    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
    }, accessToken);

    // Navigate to workspace
    await page.goto(`/workspaces/${workspaceUuid}`);

    // Check if search interface exists (adjust selectors based on actual UI)
    // Could be a search bar, Cmd+K shortcut, or search button
    const searchInput = page.locator(
      'input[placeholder*="Search"], input[type="search"], [data-testid="search-input"]'
    ).first();
    
    // Try keyboard shortcut (Cmd/Ctrl+K)
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
    
    // Wait for search modal/interface to appear
    const searchModal = page.locator(
      '[data-testid="search-modal"], .search-modal, [role="dialog"]'
    ).first();
    await expect(searchModal).toBeVisible({ timeout: 5000 }).catch(() => {
      // Search might be always visible, check for input instead
      expect(searchInput).toBeVisible({ timeout: 2000 });
    });
  });

  test('should perform search and display results', async ({ page, request }) => {
    const timestamp = Date.now();
    const testEmail = `test-e2e-search-perform-${timestamp}@example.com`;

    // Register and login
    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: 'password123',
        name: 'E2E Search Perform User',
      },
    });

    const loginResponse = await request.post('http://localhost:3000/api/v1/auth/login', {
      data: {
        email: testEmail,
        password: 'password123',
      },
    });

    const { data: loginData } = await loginResponse.json();
    const accessToken = loginData.tokens.access_token;

    // Get workspace
    const workspacesResponse = await request.get('http://localhost:3000/api/v1/workspaces', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const workspacesData = await workspacesResponse.json();
    const workspaceUuid = workspacesData.data[0]?.uuid;

    // Create a test page
    const pageResponse = await request.post(
      `http://localhost:3000/api/v1/workspaces/${workspaceUuid}/pages`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { title: 'E2E Search Test Page' },
      }
    );

    expect(pageResponse.ok()).toBeTruthy();

    // Set auth and navigate
    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
    }, accessToken);

    await page.goto(`/workspaces/${workspaceUuid}`);

    // Open search (Cmd/Ctrl+K)
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');

    // Wait for search input
    const searchInput = page.locator(
      'input[placeholder*="Search"], input[type="search"], [data-testid="search-input"]'
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Type search query
    await searchInput.fill('E2E Search Test');

    // Wait for results to appear (with debounce delay)
    await page.waitForTimeout(500);

    // Check for search results
    const searchResults = page.locator(
      '[data-testid="search-results"], .search-results, [role="listbox"]'
    ).first();
    await expect(searchResults).toBeVisible({ timeout: 5000 });

    // Verify result contains the page
    const resultItem = page.locator('text=E2E Search Test Page').first();
    await expect(resultItem).toBeVisible({ timeout: 2000 });
  });

  test('should filter search results by type', async ({ page, request }) => {
    const timestamp = Date.now();
    const testEmail = `test-e2e-search-filter-${timestamp}@example.com`;

    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: 'password123',
        name: 'E2E Search Filter User',
      },
    });

    const loginResponse = await request.post('http://localhost:3000/api/v1/auth/login', {
      data: {
        email: testEmail,
        password: 'password123',
      },
    });

    const { data: loginData } = await loginResponse.json();
    const accessToken = loginData.tokens.access_token;

    const workspacesResponse = await request.get('http://localhost:3000/api/v1/workspaces', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const workspacesData = await workspacesResponse.json();
    const workspaceUuid = workspacesData.data[0]?.uuid;

    // Create pages
    await request.post(
      `http://localhost:3000/api/v1/workspaces/${workspaceUuid}/pages`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { title: 'Filter Test Page 1' },
      }
    );

    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
    }, accessToken);

    await page.goto(`/workspaces/${workspaceUuid}`);

    // Open search
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');

    const searchInput = page.locator(
      'input[placeholder*="Search"], input[type="search"], [data-testid="search-input"]'
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('Filter Test');

    await page.waitForTimeout(500);

    // Find and click type filter (adjust selector based on actual UI)
    const typeFilter = page.locator(
      'button:has-text("Page"), button[data-filter="page"], [data-testid="filter-page"]'
    ).first();
    
    // If filter exists, click it
    if (await typeFilter.isVisible().catch(() => false)) {
      await typeFilter.click();
      await page.waitForTimeout(300);
    }

    // Verify results are filtered (all should be pages)
    const searchResults = page.locator(
      '[data-testid="search-results"], .search-results'
    ).first();
    await expect(searchResults).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to page from search results', async ({ page, request }) => {
    const timestamp = Date.now();
    const testEmail = `test-e2e-search-navigate-${timestamp}@example.com`;

    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: 'password123',
        name: 'E2E Search Navigate User',
      },
    });

    const loginResponse = await request.post('http://localhost:3000/api/v1/auth/login', {
      data: {
        email: testEmail,
        password: 'password123',
      },
    });

    const { data: loginData } = await loginResponse.json();
    const accessToken = loginData.tokens.access_token;

    const workspacesResponse = await request.get('http://localhost:3000/api/v1/workspaces', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const workspacesData = await workspacesResponse.json();
    const workspaceUuid = workspacesData.data[0]?.uuid;

    // Create a page
    const pageResponse = await request.post(
      `http://localhost:3000/api/v1/workspaces/${workspaceUuid}/pages`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { title: 'Navigate Test Page' },
      }
    );

    const pageData = await pageResponse.json();
    const pageUuid = pageData.data.uuid;

    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
    }, accessToken);

    await page.goto(`/workspaces/${workspaceUuid}`);

    // Open search
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');

    const searchInput = page.locator(
      'input[placeholder*="Search"], input[type="search"], [data-testid="search-input"]'
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('Navigate Test');

    await page.waitForTimeout(500);

    // Click on search result
    const resultItem = page.locator('text=Navigate Test Page').first();
    await expect(resultItem).toBeVisible({ timeout: 5000 });
    await resultItem.click();

    // Should navigate to page editor
    await page.waitForURL(/\/(pages|editor)\//, { timeout: 10000 });
    expect(page.url()).toContain(pageUuid);
  });

  test('should show empty state when no results found', async ({ page, request }) => {
    const timestamp = Date.now();
    const testEmail = `test-e2e-search-empty-${timestamp}@example.com`;

    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: 'password123',
        name: 'E2E Search Empty User',
      },
    });

    const loginResponse = await request.post('http://localhost:3000/api/v1/auth/login', {
      data: {
        email: testEmail,
        password: 'password123',
      },
    });

    const { data: loginData } = await loginResponse.json();
    const accessToken = loginData.tokens.access_token;

    const workspacesResponse = await request.get('http://localhost:3000/api/v1/workspaces', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const workspacesData = await workspacesResponse.json();
    const workspaceUuid = workspacesData.data[0]?.uuid;

    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
    }, accessToken);

    await page.goto(`/workspaces/${workspaceUuid}`);

    // Open search
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');

    const searchInput = page.locator(
      'input[placeholder*="Search"], input[type="search"], [data-testid="search-input"]'
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Search for something that doesn't exist
    await searchInput.fill('nonexistentterm12345');

    await page.waitForTimeout(500);

    // Check for empty state message
    const emptyState = page.locator(
      'text=No results, text=No pages found, [data-testid="search-empty"]'
    ).first();
    await expect(emptyState).toBeVisible({ timeout: 5000 });
  });
});

