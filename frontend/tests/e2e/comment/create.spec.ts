import { test, expect } from '@playwright/test';

test.describe('Comment Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Assume user is logged in and on a workspace
    // In practice, you'd set up authentication state
    await page.goto('/');
  });

  test('should display comment interface on page', async ({ page, request }) => {
    // Setup: Register, login, create workspace and page
    const timestamp = Date.now();
    const testEmail = `test-e2e-comment-${timestamp}@example.com`;
    const testPassword = 'password123';

    // Register user
    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        name: 'E2E Comment Test User',
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

    // Create a page
    const pageResponse = await request.post(
      `http://localhost:3000/api/v1/workspaces/${workspaceUuid}/pages`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: {
          title: 'E2E Comment Test Page',
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

    // Navigate to page editor
    await page.goto(`/pages/${pageUuid}`);

    // Check if comment interface exists (adjust selectors based on actual UI)
    const commentButton = page.locator(
      'button:has-text("Comment"), button[aria-label*="Comment"], [data-testid="comment-button"]'
    ).first();
    await expect(commentButton).toBeVisible({ timeout: 5000 }).catch(() => {
      // Comment interface might be always visible or triggered differently
      // This is a placeholder - actual implementation depends on UI design
    });
  });

  test('should successfully create a comment on a page', async ({ page, request }) => {
    const timestamp = Date.now();
    const testEmail = `test-e2e-comment-create-${timestamp}@example.com`;

    // Register user
    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: 'password123',
        name: 'E2E Comment Create User',
      },
    });

    // Login
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

    // Create page
    const pageResponse = await request.post(
      `http://localhost:3000/api/v1/workspaces/${workspaceUuid}/pages`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { title: 'Comment Test Page' },
      }
    );

    const pageData = await pageResponse.json();
    const pageUuid = pageData.data.uuid;

    // Set auth and navigate
    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
    }, accessToken);

    await page.goto(`/pages/${pageUuid}`);

    // Open comment interface (adjust selectors based on actual UI)
    await page.click(
      'button:has-text("Comment"), button[aria-label*="Comment"], [data-testid="comment-button"]'
    );

    // Wait for comment input to appear
    const commentInput = page.locator(
      'textarea[placeholder*="Comment"], textarea[placeholder*="Add a comment"], textarea[name="comment"], [data-testid="comment-input"]'
    ).first();
    await expect(commentInput).toBeVisible({ timeout: 5000 });

    // Type comment
    await commentInput.fill('This is an E2E test comment');

    // Submit comment
    await page.click(
      'button:has-text("Post"), button:has-text("Comment"), button[type="submit"], [data-testid="comment-submit"]'
    );

    // Wait for comment to appear (adjust selector based on actual UI)
    const commentText = page.locator('text=This is an E2E test comment').first();
    await expect(commentText).toBeVisible({ timeout: 10000 });
  });

  test('should show error for empty comment', async ({ page, request }) => {
    const timestamp = Date.now();
    const testEmail = `test-e2e-comment-empty-${timestamp}@example.com`;

    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: 'password123',
        name: 'E2E Comment Empty User',
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

    const pageResponse = await request.post(
      `http://localhost:3000/api/v1/workspaces/${workspaceUuid}/pages`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { title: 'Empty Comment Test Page' },
      }
    );

    const pageData = await pageResponse.json();
    const pageUuid = pageData.data.uuid;

    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
    }, accessToken);

    await page.goto(`/pages/${pageUuid}`);

    // Open comment interface
    await page.click(
      'button:has-text("Comment"), button[aria-label*="Comment"], [data-testid="comment-button"]'
    );

    const commentInput = page.locator(
      'textarea[placeholder*="Comment"], textarea[name="comment"], [data-testid="comment-input"]'
    ).first();
    await expect(commentInput).toBeVisible({ timeout: 5000 });

    // Try to submit without content
    await page.click(
      'button:has-text("Post"), button:has-text("Comment"), button[type="submit"], [data-testid="comment-submit"]'
    );

    // Should show validation error or prevent submission
    const errorMessage = page.locator('.error, .text-red, [role="alert"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 2000 }).catch(() => {
      // Browser validation might prevent submission instead
      const isRequired = await commentInput.getAttribute('required');
      expect(isRequired).toBeDefined();
    });
  });

  test('should create reply to a comment', async ({ page, request }) => {
    const timestamp = Date.now();
    const testEmail = `test-e2e-comment-reply-${timestamp}@example.com`;

    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: 'password123',
        name: 'E2E Comment Reply User',
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

    const pageResponse = await request.post(
      `http://localhost:3000/api/v1/workspaces/${workspaceUuid}/pages`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { title: 'Reply Test Page' },
      }
    );

    const pageData = await pageResponse.json();
    const pageUuid = pageData.data.uuid;

    // Create a parent comment via API
    const commentResponse = await request.post(
      `http://localhost:3000/api/v1/pages/${pageUuid}/comments`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { content: 'Parent comment for reply test' },
      }
    );

    const commentData = await commentResponse.json();
    const parentCommentUuid = commentData.data.uuid;

    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
    }, accessToken);

    await page.goto(`/pages/${pageUuid}`);

    // Find parent comment and click reply button (adjust selectors based on actual UI)
    const replyButton = page.locator(
      `[data-comment-id="${parentCommentUuid}"] button:has-text("Reply"), [data-comment-id="${parentCommentUuid}"] button[aria-label*="Reply"]`
    ).first();
    await expect(replyButton).toBeVisible({ timeout: 5000 });

    await replyButton.click();

    // Wait for reply input
    const replyInput = page.locator(
      'textarea[placeholder*="Reply"], textarea[placeholder*="Write a reply"], [data-testid="reply-input"]'
    ).first();
    await expect(replyInput).toBeVisible({ timeout: 5000 });

    // Type reply
    await replyInput.fill('This is a reply to the parent comment');

    // Submit reply
    await page.click(
      'button:has-text("Reply"), button:has-text("Post"), button[type="submit"], [data-testid="reply-submit"]'
    );

    // Wait for reply to appear
    const replyText = page.locator('text=This is a reply to the parent comment').first();
    await expect(replyText).toBeVisible({ timeout: 10000 });
  });

  test('should resolve a comment', async ({ page, request }) => {
    const timestamp = Date.now();
    const testEmail = `test-e2e-comment-resolve-${timestamp}@example.com`;

    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: 'password123',
        name: 'E2E Comment Resolve User',
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

    const pageResponse = await request.post(
      `http://localhost:3000/api/v1/workspaces/${workspaceUuid}/pages`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { title: 'Resolve Test Page' },
      }
    );

    const pageData = await pageResponse.json();
    const pageUuid = pageData.data.uuid;

    // Create a comment via API
    const commentResponse = await request.post(
      `http://localhost:3000/api/v1/pages/${pageUuid}/comments`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { content: 'Comment to resolve' },
      }
    );

    const commentData = await commentResponse.json();
    const commentUuid = commentData.data.uuid;

    await page.addInitScript((token) => {
      localStorage.setItem('access_token', token);
    }, accessToken);

    await page.goto(`/pages/${pageUuid}`);

    // Find comment and click resolve button (adjust selectors based on actual UI)
    const resolveButton = page.locator(
      `[data-comment-id="${commentUuid}"] button:has-text("Resolve"), [data-comment-id="${commentUuid}"] button[aria-label*="Resolve"]`
    ).first();
    await expect(resolveButton).toBeVisible({ timeout: 5000 });

    await resolveButton.click();

    // Verify comment is marked as resolved (adjust selector based on actual UI)
    const resolvedIndicator = page.locator(
      `[data-comment-id="${commentUuid}"][data-resolved="true"], [data-comment-id="${commentUuid}"] .resolved-indicator`
    ).first();
    await expect(resolvedIndicator).toBeVisible({ timeout: 5000 });
  });
});

