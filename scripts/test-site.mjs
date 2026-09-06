import { chromium } from 'playwright';

const BASE = 'https://campusconnect-rho-one.vercel.app';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  try {
    // 1. Homepage
    console.log('=== 1. Homepage ===');
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    const title = await page.title();
    console.log('Title:', title);
    const url = page.url();
    console.log('URL:', url);

    // 2. Login page
    console.log('\n=== 2. Login Page ===');
    await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
    const hasForm = await page.$('form');
    const hasEmail = await page.$('input[type="email"]');
    const hasPass = await page.$('input[type="password"]');
    const hasBtn = await page.$('button[type="submit"]');
    console.log('Form:', !!hasForm, '| Email:', !!hasEmail, '| Password:', !!hasPass, '| Button:', !!hasBtn);

    // 3. Fill and submit login
    console.log('\n=== 3. Login Flow ===');
    await hasEmail.fill('admin@iet.edu');
    await hasPass.fill('admin1234');
    
    const navPromise = page.waitForURL('**/admin**', { timeout: 15000 }).catch(() => null);
    await hasBtn.click();
    await navPromise;
    await page.waitForTimeout(3000);
    
    console.log('URL after login:', page.url());
    const token = await page.evaluate(() => localStorage.getItem('cc_token'));
    console.log('Token stored:', !!token);

    // 4. Check if dashboard loaded
    console.log('\n=== 4. Dashboard Check ===');
    const bodyText = await page.textContent('body');
    const hasDashboard = bodyText.includes('Dashboard') || bodyText.includes('Admin') || bodyText.includes('College');
    console.log('Dashboard content loaded:', hasDashboard);
    console.log('Body preview:', bodyText.substring(0, 300).replace(/\s+/g, ' '));

    // 5. JS errors
    console.log('\n=== 5. JS Errors ===');
    if (errors.length === 0) console.log('No JS errors ✅');
    else errors.forEach(e => console.log('❌', e.substring(0, 150)));

    // 6. Navigate to a few pages
    console.log('\n=== 6. Navigation Test ===');
    const pages = ['/admin', '/faculty', '/dashboard'];
    for (const p of pages) {
      await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
      const content = await page.textContent('body').catch(() => '');
      const hasContent = content.length > 100;
      console.log(p + ':', hasContent ? '✅ loaded (' + content.substring(0, 60).replace(/\s+/g, ' ') + '...)' : '❌ empty');
    }

    console.log('\n=== RESULT ===');
    console.log(errors.length === 0 ? '✅ All good!' : '⚠️ ' + errors.length + ' JS errors found');

  } catch (e) {
    console.error('TEST FAILED:', e.message);
  } finally {
    await browser.close();
  }
}

test();
