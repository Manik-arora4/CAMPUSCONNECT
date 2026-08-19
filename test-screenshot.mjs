import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Login page
  console.log('📸 Loading login page...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.screenshot({ path: 'campusconnect/screenshots/01-login.png', fullPage: true });
  console.log('✅ Login page captured');

  // 2. Login as student
  console.log('🔑 Logging in as student...');
  await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'student@demo.campusconnect');
  await page.fill('input[type="password"]', 'demo1234');
  
  // Click login button
  const loginBtn = await page.$('button[type="submit"]');
  if (loginBtn) await loginBtn.click();
  
  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'campusconnect/screenshots/02-dashboard.png', fullPage: true });
  console.log('✅ Dashboard captured');

  // 3. Timetable
  console.log('📸 Loading timetable...');
  await page.goto('http://localhost:5173/timetable', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'campusconnect/screenshots/03-timetable.png', fullPage: true });
  console.log('✅ Timetable captured');

  // 4. Attendance
  console.log('📸 Loading attendance...');
  await page.goto('http://localhost:5173/attendance', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'campusconnect/screenshots/04-attendance.png', fullPage: true });
  console.log('✅ Attendance captured');

  // 5. Assignments
  console.log('📸 Loading assignments...');
  await page.goto('http://localhost:5173/assignments', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'campusconnect/screenshots/05-assignments.png', fullPage: true });
  console.log('✅ Assignments captured');

  // 6. Notices / College
  console.log('📸 Loading notices...');
  await page.goto('http://localhost:5173/college', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'campusconnect/screenshots/06-notices.png', fullPage: true });
  console.log('✅ Notices captured');

  // 7. Events
  console.log('📸 Loading events...');
  await page.goto('http://localhost:5173/events', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'campusconnect/screenshots/07-events.png', fullPage: true });
  console.log('✅ Events captured');

  // 8. Opportunities
  console.log('📸 Loading opportunities...');
  await page.goto('http://localhost:5173/opportunities', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'campusconnect/screenshots/08-opportunities.png', fullPage: true });
  console.log('✅ Opportunities captured');

  // 9. Tasks
  console.log('📸 Loading tasks...');
  await page.goto('http://localhost:5173/tasks', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'campusconnect/screenshots/09-tasks.png', fullPage: true });
  console.log('✅ Tasks captured');

  // 10. AI Chat
  console.log('📸 Loading AI Chat...');
  await page.goto('http://localhost:5173/ai/chat', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'campusconnect/screenshots/10-ai-chat.png', fullPage: true });
  console.log('✅ AI Chat captured');

  // 11. Profile
  console.log('📸 Loading profile...');
  await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'campusconnect/screenshots/11-profile.png', fullPage: true });
  console.log('✅ Profile captured');

  // 12. Notifications
  console.log('📸 Loading notifications...');
  await page.goto('http://localhost:5173/notifications', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'campusconnect/screenshots/12-notifications.png', fullPage: true });
  console.log('✅ Notifications captured');

  // Check for console errors
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  
  await browser.close();
  
  console.log('\n🎉 All screenshots saved to campusconnect/screenshots/');
  if (errors.length > 0) {
    console.log('⚠️ Console errors found:', errors);
  } else {
    console.log('✅ No JS console errors detected');
  }
}

main().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
