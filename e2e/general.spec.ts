import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
    test('should have correct page title', async ({ page }) => {
        await page.goto('/login');
        await expect(page).toHaveTitle(/유학생 관리|FRISK/i);
    });
});

test.describe('Mobile Responsiveness', () => {
    test('login page should be mobile-friendly', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/login');

        // Check that login form is visible and usable on mobile
        const emailInput = page.getByLabel(/이메일/i);
        const passwordInput = page.getByLabel(/비밀번호/i);
        const loginButton = page.getByRole('button', { name: /로그인/i });

        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
        await expect(loginButton).toBeVisible();

        // Check that elements are not overflowing
        const emailBox = await emailInput.boundingBox();
        const buttonBox = await loginButton.boundingBox();

        expect(emailBox?.width).toBeLessThanOrEqual(375);
        expect(buttonBox?.width).toBeLessThanOrEqual(375);
    });
});

test.describe('Accessibility', () => {
    test('login form should have proper labels', async ({ page }) => {
        await page.goto('/login');

        // Check for accessible form elements
        const emailInput = page.getByLabel(/이메일/i);
        const passwordInput = page.getByLabel(/비밀번호/i);

        // Inputs should be associated with labels
        await expect(emailInput).toHaveAttribute('type', 'email');
        await expect(passwordInput).toHaveAttribute('type', 'password');
    });
});

test.describe('Performance', () => {
    test('login page should load quickly', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('/login', { waitUntil: 'networkidle' });
        const loadTime = Date.now() - startTime;

        // Page should load within 5 seconds
        expect(loadTime).toBeLessThan(5000);
    });
});
