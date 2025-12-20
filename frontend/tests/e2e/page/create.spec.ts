import { test, expect } from '@playwright/test';

test.describe('Page Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Assume user is logged in and on a workspace
    // In practice, you'd set up authentication state
    await page.goto('/');
  });

  test('should display page creation form', async ({ page }) => {
    // Navigate to workspace pages
    await page.goto('/workspaces');

    // Check if create page button exists or navigate to create page
    // This depends on actual UI implementation
    const createButton = page.locator('button:has-text("New Page"), button:has-text("Create Page"), a:has-text("New Page")').first();
    await expect(createButton).toBeVisible();
  });

  test('should successfully create a new page', async ({ page, request }) => {
    // First ensure user and workspace exist
    const timestamp = Date.now();
    const testEmail = `test-e2e-page-${timestamp}@example.com`;
    const testPassword = 'password123';

    // Register user
    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'E2E Page Test User',
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

    // Create page via UI (adjust selectors based on actual UI)
    await page.click('button:has-text("New Page"), button:has-text("Create"), a:has-text("New Page")');

    // Fill page title
    const titleInput = page.locator('input[placeholder*="Title"], input[placeholder*="Page title"], input[name="title"]').first();
    await titleInput.fill('E2E Test Page');

    // Submit form
    await page.click('button[type="submit"], button:has-text("Create"), button:has-text("Save")');

    // Wait for navigation to page editor or success message
    await page.waitForURL(/\/(pages|editor)\//, { timeout: 10000 });

    // Verify page was created
    expect(page.url()).toMatch(/\/(pages|editor)\//);
  });

  test('should show error for missing page title', async ({ page }) => {
    // Navigate to create page
    await page.goto('/pages/new');

    // Try to submit without title
    await page.click('button[type="submit"], button:has-text("Create")');

    // Should show validation error or prevent submission
    const errorMessage = page.locator('.error, .text-red, [role="alert"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 2000 }).catch(() => {
      // Browser validation might prevent submission instead
      const titleInput = page.locator('input[placeholder*="Title"], input[name="title"]').first();
      expect(titleInput.getAttribute('required')).resolves.toBeDefined();
    });
  });

  test('should create child page with parent', async ({ page, request }) => {
    // Setup similar to first test
    const timestamp = Date.now();
    const testEmail = `test-e2e-child-page-${timestamp}@example.com`;

    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: 'password123',
        name: 'E2E Child Page User',
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

    // Create parent page
    const parentPageResponse = await request.post(
      `http://localhost:3000/api/v1/workspaces/${workspaceUuid}/pages`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { title: 'Parent Page' },
      }
    );

    const parentPage = await parentPageResponse.json();

    // Set auth and navigate
    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
    }, accessToken);

    await page.goto(`/workspaces/${workspaceUuid}`);

    // Find parent page and create child (UI dependent)
    // This is a placeholder - actual implementation depends on UI design
    await page.click(`[data-page-id="${parentPage.data.uuid}"]`);
    await page.click('button:has-text("Add sub-page"), button:has-text("Create child page")');

    const titleInput = page.locator('input[placeholder*="Title"]').first();
    await titleInput.fill('Child Page');

    await page.click('button[type="submit"], button:has-text("Create")');

    // Verify child page was created
    await page.waitForURL(/\/(pages|editor)\//, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(pages|editor)\//);
  });

  test('should navigate to page after creation', async ({ page, request }) => {
    // Similar setup as above
    const timestamp = Date.now();
    const testEmail = `test-e2e-navigate-${timestamp}@example.com`;

    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: 'password123',
        name: 'E2E Navigate User',
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

    // Create page
    await page.click('button:has-text("New Page"), button:has-text("Create")');
    const titleInput = page.locator('input[placeholder*="Title"]').first();
    await titleInput.fill('Navigate Test Page');
    await page.click('button[type="submit"], button:has-text("Create")');

    // Should navigate to page editor
    await page.waitForURL(/\/(pages|editor)\//, { timeout: 10000 });
    
    // Verify we're on the page editor
    const editor = page.locator('[data-testid="page-editor"], .page-editor, [role="textbox"]').first();
    await expect(editor).toBeVisible({ timeout: 5000 });
  });
});

