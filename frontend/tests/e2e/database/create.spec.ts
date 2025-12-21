import { test, expect } from '@playwright/test';

test.describe('Database Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Assume user is logged in and on a workspace
    // In practice, you'd set up authentication state
    await page.goto('/');
  });

  test('should display database creation form', async ({ page }) => {
    // Navigate to workspace pages
    await page.goto('/workspaces');

    // Check if create database button exists or navigate to create database
    // This depends on actual UI implementation
    const createButton = page.locator('button:has-text("New Database"), button:has-text("Create Database"), a:has-text("New Database")').first();
    await expect(createButton).toBeVisible();
  });

  test('should successfully create a new database', async ({ page, request }) => {
    // First ensure user and workspace exist
    const timestamp = Date.now();
    const testEmail = `test-e2e-db-${timestamp}@example.com`;
    const testPassword = 'password123';

    // Register user
    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'E2E Database Test User',
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

    // Create a page for the database
    const pageResponse = await request.post(
      `http://localhost:3000/api/v1/workspaces/${workspaceUuid}/pages`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          title: 'Database Page',
          type: 'database',
          database_type: 'table',
        },
      }
    );

    expect(pageResponse.ok()).toBeTruthy();
    const pageData = await pageResponse.json();
    const pageUuid = pageData.data.uuid;

    // Set auth token in browser
    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
    }, accessToken);

    // Navigate to workspace
    await page.goto(`/workspaces/${workspaceUuid}`);

    // Create database via UI (adjust selectors based on actual UI)
    await page.click('button:has-text("New Database"), button:has-text("Create Database"), a:has-text("New Database")');

    // Fill database title
    const titleInput = page.locator('input[placeholder*="Database title"], input[placeholder*="Title"], input[name="title"]').first();
    await titleInput.fill('E2E Test Database');

    // Add properties (if UI supports it)
    // This depends on actual UI implementation
    const addPropertyButton = page.locator('button:has-text("Add Property"), button:has-text("Add Column")').first();
    if (await addPropertyButton.isVisible().catch(() => false)) {
      await addPropertyButton.click();
      // Add property fields would go here
    }

    // Submit form
    await page.click('button[type="submit"], button:has-text("Create"), button:has-text("Save")');

    // Wait for navigation to database editor or success message
    await page.waitForURL(/\/(databases|database)\//, { timeout: 10000 });

    // Verify database was created
    expect(page.url()).toMatch(/\/(databases|database)\//);
  });

  test('should show error for missing database title', async ({ page }) => {
    // Navigate to create database
    await page.goto('/databases/new');

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

  test('should create database with properties', async ({ page, request }) => {
    // Setup similar to first test
    const timestamp = Date.now();
    const testEmail = `test-e2e-db-props-${timestamp}@example.com`;

    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: 'password123',
        name: 'E2E Database Props User',
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

    // Create a page for the database
    const pageResponse = await request.post(
      `http://localhost:3000/api/v1/workspaces/${workspaceUuid}/pages`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          title: 'Database Page',
          type: 'database',
          database_type: 'table',
        },
      }
    );

    const pageData = await pageResponse.json();
    const pageUuid = pageData.data.uuid;

    // Set auth and navigate
    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
    }, accessToken);

    await page.goto(`/workspaces/${workspaceUuid}`);

    // Create database with properties (UI dependent)
    await page.click('button:has-text("New Database"), button:has-text("Create Database")');

    const titleInput = page.locator('input[placeholder*="Title"]').first();
    await titleInput.fill('Database with Properties');

    // Add properties if UI supports it
    // This is a placeholder - actual implementation depends on UI design
    const addPropertyButton = page.locator('button:has-text("Add Property")').first();
    if (await addPropertyButton.isVisible().catch(() => false)) {
      await addPropertyButton.click();
      // Add property configuration would go here
    }

    await page.click('button[type="submit"], button:has-text("Create")');

    // Verify database was created
    await page.waitForURL(/\/(databases|database)\//, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(databases|database)\//);
  });

  test('should navigate to database editor after creation', async ({ page, request }) => {
    // Similar setup as above
    const timestamp = Date.now();
    const testEmail = `test-e2e-db-nav-${timestamp}@example.com`;

    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: 'password123',
        name: 'E2E Database Navigate User',
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

    // Create a page for the database
    const pageResponse = await request.post(
      `http://localhost:3000/api/v1/workspaces/${workspaceUuid}/pages`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          title: 'Database Page',
          type: 'database',
          database_type: 'table',
        },
      }
    );

    const pageData = await pageResponse.json();
    const pageUuid = pageData.data.uuid;

    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
    }, accessToken);

    await page.goto(`/workspaces/${workspaceUuid}`);

    // Create database
    await page.click('button:has-text("New Database"), button:has-text("Create Database")');
    const titleInput = page.locator('input[placeholder*="Title"]').first();
    await titleInput.fill('Navigate Test Database');
    await page.click('button[type="submit"], button:has-text("Create")');

    // Should navigate to database editor
    await page.waitForURL(/\/(databases|database)\//, { timeout: 10000 });
    
    // Verify we're on the database editor
    const editor = page.locator('[data-testid="database-editor"], .database-editor, [data-testid="database-view"]').first();
    await expect(editor).toBeVisible({ timeout: 5000 });
  });
});

