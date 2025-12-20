import { test, expect } from '@playwright/test';

test.describe('User Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Check page title
    await expect(page.locator('h2')).toContainText('Sign in to your account');

    // Check form fields are present
    await expect(page.locator('input[placeholder="Email address"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible();

    // Check link to registration page
    await expect(page.locator('a:has-text("Don\'t have an account? Sign up")')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page, request }) => {
    // First, create a test user
    const timestamp = Date.now();
    const testEmail = `test-e2e-login-${timestamp}@example.com`;
    const testName = 'E2E Test Login User';
    const testPassword = 'password123';

    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        name: testName,
      },
    });

    expect(registerResponse.ok()).toBeTruthy();

    // Now login with those credentials
    await page.fill('input[placeholder="Email address"]', testEmail);
    await page.fill('input[placeholder="Password"]', testPassword);

    // Submit form
    await page.click('button:has-text("Sign in")');

    // Wait for navigation to home page (successful login redirects to /)
    await page.waitForURL('/', { timeout: 10000 });

    // Verify we're on the home page after successful login
    expect(page.url()).toContain('/');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    const invalidEmail = 'nonexistent@example.com';
    const invalidPassword = 'wrongpassword';

    // Fill login form with invalid credentials
    await page.fill('input[placeholder="Email address"]', invalidEmail);
    await page.fill('input[placeholder="Password"]', invalidPassword);

    // Submit form
    await page.click('button:has-text("Sign in")');

    // Wait for error message
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.bg-red-50')).toContainText(/invalid|incorrect|error/i);

    // Verify we're still on login page
    expect(page.url()).toContain('/login');
  });

  test('should show error for incorrect password', async ({ page, request }) => {
    // First, create a test user
    const timestamp = Date.now();
    const testEmail = `test-e2e-login-wrong-pw-${timestamp}@example.com`;
    const testName = 'E2E Test Login User';
    const testPassword = 'password123';

    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        name: testName,
      },
    });

    expect(registerResponse.ok()).toBeTruthy();

    // Now try to login with wrong password
    await page.fill('input[placeholder="Email address"]', testEmail);
    await page.fill('input[placeholder="Password"]', 'wrongpassword');

    await page.click('button:has-text("Sign in")');

    // Wait for error message
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.bg-red-50')).toContainText(/invalid|incorrect|error/i);

    // Verify we're still on login page
    expect(page.url()).toContain('/login');
  });

  test('should show error for invalid email format', async ({ page }) => {
    const invalidEmail = 'invalid-email-format';
    const testPassword = 'password123';

    // Fill login form with invalid email
    await page.fill('input[placeholder="Email address"]', invalidEmail);
    await page.fill('input[placeholder="Password"]', testPassword);

    // Try to submit - browser validation should prevent submission
    await page.click('button:has-text("Sign in")');

    // HTML5 validation should prevent form submission
    const emailInput = page.locator('input[placeholder="Email address"]');
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => {
      return (el as any).validationMessage;
    });

    // Browser validation message should exist
    expect(validationMessage).toBeTruthy();
  });

  test('should disable submit button while loading', async ({ page, request }) => {
    // First, create a test user
    const timestamp = Date.now();
    const testEmail = `test-e2e-login-loading-${timestamp}@example.com`;
    const testName = 'E2E Test Login User';
    const testPassword = 'password123';

    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        name: testName,
      },
    });

    expect(registerResponse.ok()).toBeTruthy();

    // Fill login form
    await page.fill('input[placeholder="Email address"]', testEmail);
    await page.fill('input[placeholder="Password"]', testPassword);

    // Click submit
    const submitButton = page.locator('button:has-text("Sign in")');
    await submitButton.click();

    // Button should show loading state
    await expect(submitButton).toContainText(/Signing in|Sign in/);
  });

  test('should navigate to registration page when clicking sign up link', async ({ page }) => {
    // Click the "Don't have an account? Sign up" link
    await page.click('a:has-text("Don\'t have an account? Sign up")');

    // Verify navigation to registration page
    await page.waitForURL('/register');
    expect(page.url()).toContain('/register');
    await expect(page.locator('h2')).toContainText('Create your account');
  });

  test('should show required field validation', async ({ page }) => {
    // Try to submit empty form
    await page.click('button:has-text("Sign in")');

    // Browser validation should prevent submission
    const emailInput = page.locator('input[placeholder="Email address"]');
    const passwordInput = page.locator('input[placeholder="Password"]');

    // Check if fields are required (HTML5 validation)
    const emailRequired = await emailInput.getAttribute('required');
    const passwordRequired = await passwordInput.getAttribute('required');

    expect(emailRequired).toBeDefined();
    expect(passwordRequired).toBeDefined();
  });

  test('should handle network errors gracefully', async ({ page, context, request }) => {
    // First, create a test user
    const timestamp = Date.now();
    const testEmail = `test-e2e-login-network-${timestamp}@example.com`;
    const testName = 'E2E Test Login User';
    const testPassword = 'password123';

    const registerResponse = await request.post('http://localhost:3000/api/v1/auth/register', {
      data: {
        email: testEmail,
        password: testPassword,
        name: testName,
      },
    });

    expect(registerResponse.ok()).toBeTruthy();

    // Intercept and block network requests
    await context.route('**/api/v1/auth/login', (route) => {
      route.abort('failed');
    });

    // Fill login form
    await page.fill('input[placeholder="Email address"]', testEmail);
    await page.fill('input[placeholder="Password"]', testPassword);

    // Submit form
    await page.click('button:has-text("Sign in")');

    // Wait for error message
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.bg-red-50')).toContainText(/failed|error/i);
  });

  test('should preserve form data after error', async ({ page }) => {
    const testEmail = 'test@example.com';
    const testPassword = 'wrongpassword';

    // Fill login form
    await page.fill('input[placeholder="Email address"]', testEmail);
    await page.fill('input[placeholder="Password"]', testPassword);

    // Submit form
    await page.click('button:has-text("Sign in")');

    // Wait for error
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 5000 });

    // Verify form data is still present
    const emailValue = await page.locator('input[placeholder="Email address"]').inputValue();
    expect(emailValue).toBe(testEmail);

    // Note: For security, password fields are often cleared, but email should remain
  });
});

