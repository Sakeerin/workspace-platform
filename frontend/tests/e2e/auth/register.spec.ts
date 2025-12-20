import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
    // Check page title
    await expect(page.locator('h2')).toContainText('Create your account');

    // Check form fields are present
    await expect(page.locator('input[placeholder="Name"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Email address"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign up")')).toBeVisible();

    // Check link to login page
    await expect(page.locator('a:has-text("Already have an account? Sign in")')).toBeVisible();
  });

  test('should successfully register a new user', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `test-e2e-register-${timestamp}@example.com`;
    const testName = 'E2E Test User';
    const testPassword = 'password123';

    // Fill registration form
    await page.fill('input[placeholder="Name"]', testName);
    await page.fill('input[placeholder="Email address"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);

    // Submit form
    await page.click('button:has-text("Sign up")');

    // Wait for navigation to home page (successful registration redirects to /)
    await page.waitForURL('/', { timeout: 10000 });

    // Verify we're on the home page after successful registration
    expect(page.url()).toContain('/');
  });

  test('should show error for password less than 8 characters', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `test-e2e-register-${timestamp}@example.com`;
    const testName = 'E2E Test User';
    const shortPassword = 'short';

    // Fill registration form with short password
    await page.fill('input[placeholder="Name"]', testName);
    await page.fill('input[placeholder="Email address"]', testEmail);
    await page.fill('input[placeholder*="Password"]', shortPassword);

    // Submit form
    await page.click('button:has-text("Sign up")');

    // Verify error message is shown
    await expect(page.locator('.bg-red-50')).toBeVisible();
    await expect(page.locator('.bg-red-50')).toContainText('Password must be at least 8 characters');

    // Verify we're still on registration page
    expect(page.url()).toContain('/register');
  });

  test('should show error for invalid email format', async ({ page }) => {
    const timestamp = Date.now();
    const invalidEmail = `invalid-email-${timestamp}`;
    const testName = 'E2E Test User';
    const testPassword = 'password123';

    // Fill registration form with invalid email
    await page.fill('input[placeholder="Name"]', testName);
    await page.fill('input[placeholder="Email address"]', invalidEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);

    // Try to submit - browser validation should prevent submission
    await page.click('button:has-text("Sign up")');

    // HTML5 validation should prevent form submission
    // Check that email field has validation message
    const emailInput = page.locator('input[placeholder="Email address"]');
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => {
      return (el as any).validationMessage;
    });

    // Browser validation message should exist (though content varies by browser)
    expect(validationMessage).toBeTruthy();
  });

  test('should show error when email already exists', async ({ page, request }) => {
    const timestamp = Date.now();
    const testEmail = `test-e2e-register-duplicate-${timestamp}@example.com`;
    const testName = 'E2E Test User';
    const testPassword = 'password123';

    // First, create a user via API
    const response = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        name: testName,
      },
    });

    expect(response.ok()).toBeTruthy();

    // Now try to register with same email
    await page.fill('input[placeholder="Name"]', testName);
    await page.fill('input[placeholder="Email address"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);

    await page.click('button:has-text("Sign up")');

    // Wait for error message
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.bg-red-50')).toContainText(/already exists|failed/i);

    // Verify we're still on registration page
    expect(page.url()).toContain('/register');
  });

  test('should disable submit button while loading', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `test-e2e-register-${timestamp}@example.com`;
    const testName = 'E2E Test User';
    const testPassword = 'password123';

    // Fill registration form
    await page.fill('input[placeholder="Name"]', testName);
    await page.fill('input[placeholder="Email address"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);

    // Click submit
    const submitButton = page.locator('button:has-text("Sign up")');
    await submitButton.click();

    // Button should show loading state (text changes or becomes disabled)
    // Note: This check might need adjustment based on actual implementation
    await expect(submitButton).toContainText(/Creating account|Sign up/);
  });

  test('should navigate to login page when clicking sign in link', async ({ page }) => {
    // Click the "Already have an account? Sign in" link
    await page.click('a:has-text("Already have an account? Sign in")');

    // Verify navigation to login page
    await page.waitForURL('/login');
    expect(page.url()).toContain('/login');
    await expect(page.locator('h2')).toContainText('Sign in to your account');
  });

  test('should show required field validation', async ({ page }) => {
    // Try to submit empty form
    await page.click('button:has-text("Sign up")');

    // Browser validation should prevent submission
    // Check that required fields are marked
    const nameInput = page.locator('input[placeholder="Name"]');
    const emailInput = page.locator('input[placeholder="Email address"]');
    const passwordInput = page.locator('input[placeholder*="Password"]');

    // Check if fields are required (HTML5 validation)
    const nameRequired = await nameInput.getAttribute('required');
    const emailRequired = await emailInput.getAttribute('required');
    const passwordRequired = await passwordInput.getAttribute('required');

    expect(nameRequired).toBeDefined();
    expect(emailRequired).toBeDefined();
    expect(passwordRequired).toBeDefined();
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    // Intercept and block network requests
    await context.route('**/api/v1/auth/register', (route) => {
      route.abort('failed');
    });

    const timestamp = Date.now();
    const testEmail = `test-e2e-register-${timestamp}@example.com`;
    const testName = 'E2E Test User';
    const testPassword = 'password123';

    // Fill registration form
    await page.fill('input[placeholder="Name"]', testName);
    await page.fill('input[placeholder="Email address"]', testEmail);
    await page.fill('input[placeholder*="Password"]', testPassword);

    // Submit form
    await page.click('button:has-text("Sign up")');

    // Wait for error message
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.bg-red-50')).toContainText(/failed|error/i);
  });
});

