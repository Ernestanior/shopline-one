import { test, expect } from '@playwright/test';

test.describe('Admin Order Detail', () => {
  test('should view order detail from admin panel', async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3001/login');
    await page.fill('input[type="email"]', 'admin@xyvn.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3001/');
    
    // Go to admin panel
    await page.goto('http://localhost:3001/admin');
    await page.waitForLoadState('networkidle');
    
    // Click on orders tab
    await page.click('text=订单管理');
    await page.waitForTimeout(1000);
    
    // Check if orders table is visible
    const table = await page.locator('.admin-table');
    await expect(table).toBeVisible();
    
    // Get first view button
    const viewButton = await page.locator('.btn-view').first();
    await expect(viewButton).toBeVisible();
    
    // Click view button and check URL
    await viewButton.click();
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log('Current URL after clicking view:', currentUrl);
    
    // Check if we're on order detail page
    const isOrderDetailPage = currentUrl.includes('/order');
    console.log('Is on order detail page:', isOrderDetailPage);
    
    // Check page content
    const pageText = await page.textContent('body');
    console.log('Page contains "订单详情":', pageText?.includes('订单详情'));
    console.log('Page contains "订单信息":', pageText?.includes('订单信息'));
    console.log('Page contains "商品清单":', pageText?.includes('商品清单'));
    
    // Check for specific elements
    const hasOrderDetail = await page.locator('.order-detail').count();
    const hasLoadingState = await page.locator('.loading-state').count();
    const hasErrorState = await page.locator('.error-state').count();
    
    console.log('Has .order-detail:', hasOrderDetail);
    console.log('Has .loading-state:', hasLoadingState);
    console.log('Has .error-state:', hasErrorState);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'order-detail-debug.png', fullPage: true });
    
    // The page should show order details
    await expect(page.locator('.order-detail')).toBeVisible({ timeout: 5000 });
  });
});
