const puppeteer = require('puppeteer');

async function debugOrderDetail() {
  console.log('Starting browser automation to debug order detail...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Listen to console logs from the page
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[OrderDetail]')) {
      console.log('PAGE LOG:', text);
    }
  });
  
  // Listen to network requests
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/admin/orders/') || url.includes('/api/user/orders/')) {
      console.log('\nAPI RESPONSE:', url);
      console.log('Status:', response.status());
      try {
        const data = await response.json();
        console.log('Data:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('Could not parse JSON');
      }
    }
  });
  
  try {
    // Go to login page
    console.log('Step 1: Navigate to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });
    
    // Login as admin
    console.log('Step 2: Login as admin...');
    await page.type('input[type="email"]', 'admin@xyvn.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✓ Logged in');
    
    // Go to admin panel
    console.log('\nStep 3: Navigate to admin panel...');
    await page.goto('http://localhost:3001/admin', { waitUntil: 'networkidle0' });
    
    // Click on "订单管理" tab
    console.log('Step 4: Click on orders tab...');
    await page.waitForSelector('button');
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('订单管理')) {
        await button.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    console.log('✓ Orders tab clicked');
    
    // Wait for orders table
    await page.waitForSelector('.admin-table', { timeout: 5000 });
    
    // Click first "查看" button
    console.log('\nStep 5: Click first 查看 button...');
    const viewButtons = await page.$$('.btn-view');
    if (viewButtons.length > 0) {
      console.log(`Found ${viewButtons.length} view buttons`);
      await viewButtons[0].click();
      console.log('✓ View button clicked');
      
      // Wait a bit for navigation and API calls
      await page.waitForTimeout(3000);
      
      // Check current URL
      const currentUrl = page.url();
      console.log('\nCurrent URL:', currentUrl);
      
      // Check page content
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('\nPage content preview:');
      console.log(bodyText.substring(0, 500));
      
      // Check if order detail is rendered
      const hasOrderDetail = await page.$('.order-detail');
      console.log('\nHas .order-detail element:', !!hasOrderDetail);
      
      const hasLoadingState = await page.$('.loading-state');
      console.log('Has .loading-state element:', !!hasLoadingState);
      
      const hasErrorState = await page.$('.error-state');
      console.log('Has .error-state element:', !!hasErrorState);
      
      const hasOrderItems = await page.$('.order-items');
      console.log('Has .order-items element:', !!hasOrderItems);
      
      // Wait a bit more to see console logs
      await page.waitForTimeout(2000);
      
    } else {
      console.log('✗ No view buttons found');
    }
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  }
  
  console.log('\nTest complete. Browser will stay open for 10 seconds...');
  await page.waitForTimeout(10000);
  
  await browser.close();
}

debugOrderDetail().catch(console.error);
