import { expect, test } from '@playwright/test';

test('account route requires auth and returns after login; logout blocks again', async ({ page, request }) => {
  const email = `e2e_${Date.now()}_${Math.random().toString(16).slice(2)}@example.com`;
  const password = 'Passw0rd!';

  const registerRes = await request.post('/api/auth/register', {
    data: { email, password }
  });

  expect(registerRes.ok()).toBeTruthy();

  await page.goto('/account');
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible();
  await expect(page.locator('.account-card').getByText(email)).toBeVisible();

  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();

  await page.goto('/account');
  await expect(page).toHaveURL(/\/login$/);
});
