import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test('should show login page', async ({ page }) => {
        await page.goto('/login');

        // Check login page elements
        await expect(page.getByRole('heading', { name: /로그인/i })).toBeVisible();
        await expect(page.getByLabel(/이메일/i)).toBeVisible();
        await expect(page.getByLabel(/비밀번호/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /로그인/i })).toBeVisible();
    });

    test('should redirect unauthenticated users from protected routes', async ({ page }) => {
        // Try to access protected routes
        await page.goto('/admin');
        await expect(page).toHaveURL(/\/login/);

        await page.goto('/agency');
        await expect(page).toHaveURL(/\/login/);

        await page.goto('/university');
        await expect(page).toHaveURL(/\/login/);
    });

    test('should show error on invalid login', async ({ page }) => {
        await page.goto('/login');

        await page.getByLabel(/이메일/i).fill('invalid@test.com');
        await page.getByLabel(/비밀번호/i).fill('wrongpassword');
        await page.getByRole('button', { name: /로그인/i }).click();

        // Wait for error message
        await expect(page.getByText(/이메일 또는 비밀번호가 일치하지 않습니다|Invalid/i)).toBeVisible({ timeout: 10000 });
    });
});
