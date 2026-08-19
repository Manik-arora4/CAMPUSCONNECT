import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
let passed = 0;
let failed = 0;
const results = [];

function ok(label) { passed++; results.push(`✅ ${label}`); }
function fail(label, reason) { failed++; results.push(`❌ ${label} — ${reason}`); }

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const jsErrors = [];
  page.on('pageerror', (e) => jsErrors.push(e.message));

  // ── 1. LOGIN PAGE ──
  console.log('\n━━━ 1. LOGIN PAGE ━━━');
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 });
    const body = await page.textContent('body');
    if (body.includes('CAMPUSCONNECT')) ok('Login page loads with branding');
    else fail('Login page loads', 'No branding found');

    const emailInput = await page.$('input[type="email"]');
    const passInput = await page.$('input[type="password"]');
    const submitBtn = await page.$('button[type="submit"]');
    if (emailInput && passInput && submitBtn) ok('Login form has email, password, submit');
    else fail('Login form elements', `email=${!!emailInput} pass=${!!passInput} btn=${!!submitBtn}`);

    if (body.includes('Register') || body.includes('Sign up') || body.includes('Create')) ok('Register link present');
    else fail('Register link', 'Not found');
    if (body.includes('Forgot')) ok('Forgot password link present');
    else fail('Forgot password link', 'Not found');
  } catch (e) { fail('Login page', e.message); }

  // ── 2. STUDENT LOGIN ──
  console.log('\n━━━ 2. STUDENT LOGIN ━━━');
  try {
    await page.fill('input[type="email"]', 'student@demo.campusconnect');
    await page.fill('input[type="password"]', 'demo1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await page.waitForTimeout(2000);
    if (page.url().includes('/dashboard')) ok('Redirected to dashboard after login');
    else fail('Post-login redirect', `URL: ${page.url()}`);
    const body = await page.textContent('body');
    if (body.includes('Aarav')) ok('Shows user name "Aarav"');
    else fail('User name display', 'Name not found');
  } catch (e) { fail('Student login', e.message); }

  // ── 3. DASHBOARD ──
  console.log('\n━━━ 3. DASHBOARD ━━━');
  try {
    const body = await page.textContent('body');
    const hasSidebar = await page.$('aside') !== null;
    const hasHeader = await page.$('header') !== null;
    if (hasSidebar) ok('Sidebar renders');
    else fail('Sidebar', 'Not found');
    if (hasHeader) ok('Header renders');
    else fail('Header', 'Not found');

    const navLinks = await page.$$('aside a');
    if (navLinks.length > 5) ok(`Sidebar has ${navLinks.length} nav links`);
    else fail('Sidebar nav', `Only ${navLinks.length} links`);

    // Dashboard has stat cards, schedule, deadlines, opportunities, notices
    if (body.includes('Good') || body.includes('morning') || body.includes('afternoon') || body.includes('evening')) ok('Greeting renders');
    else fail('Dashboard greeting', 'Not found');
    if (body.includes('Classes today') || body.includes('Attendance') || body.includes('Pending tasks')) ok('Stat cards render');
    else fail('Stat cards', 'Not shown');
    if (body.includes('AI Recommendation') || body.includes('Recommendation')) ok('AI recommendation section renders');
    else fail('AI recommendation', 'Not found');
    if (body.includes('schedule') || body.includes('Schedule') || body.includes('deadline')) ok('Schedule/deadlines sections render');
    else fail('Schedule/deadlines', 'Not found');

    const bell = await page.$('button[aria-label="Notifications"]');
    if (bell) ok('Notification bell present');
    else fail('Notification bell', 'Not found');
    const logout = await page.$('button[aria-label="Logout"]');
    if (logout) ok('Logout button present');
    else fail('Logout button', 'Not found');
    if (body.includes('CAMPUSCONNECT') || body.includes('Your College')) ok('Footer renders');
    else fail('Footer', 'Not found');
  } catch (e) { fail('Dashboard', e.message); }

  // ── 4. TIMETABLE ──
  console.log('\n━━━ 4. TIMETABLE ━━━');
  try {
    await page.goto(`${BASE}/timetable`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    if (body.includes('Timetable') || body.includes('Schedule')) ok('Timetable page loads');
    else fail('Timetable page', 'No timetable text');
    if (body.includes('Monday') || body.includes('Tuesday') || body.includes('Mon')) ok('Days of week shown');
    else fail('Days of week', 'Not displayed');
    if (body.includes('C Programming') || body.includes('DBMS') || body.includes('09:00')) ok('Timetable slots render with subjects');
    else fail('Timetable slots', 'No subject data');
  } catch (e) { fail('Timetable', e.message); }

  // ── 5. ATTENDANCE ──
  console.log('\n━━━ 5. ATTENDANCE ━━━');
  try {
    await page.goto(`${BASE}/attendance`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    if (body.includes('Attendance')) ok('Attendance page loads');
    else fail('Attendance page', 'No attendance text');
    if (body.includes('C Programming') || body.includes('DBMS') || body.includes('Mathematics') || body.includes('%')) ok('Subject-wise attendance data shown');
    else fail('Attendance data', 'No subject data');
    const progressBars = await page.$$('div[class*="rounded-full"]');
    if (progressBars.length > 0) ok(`Progress bars present (${progressBars.length} elements)`);
    else fail('Progress bars', 'Not found');
  } catch (e) { fail('Attendance', e.message); }

  // ── 6. ASSIGNMENTS ──
  console.log('\n━━━ 6. ASSIGNMENTS ━━━');
  try {
    await page.goto(`${BASE}/assignments`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    if (body.includes('Assignment')) ok('Assignments page loads');
    else fail('Assignments page', 'No assignment text');
    if (body.includes('ER Diagram') || body.includes('Linked List') || body.includes('DBMS') || body.includes('Portfolio')) ok('Assignment cards render');
    else fail('Assignment data', 'No content');
    if (body.includes('Due') || body.includes('due') || body.includes('days left')) ok('Due dates shown');
    else fail('Due dates', 'Not shown');
  } catch (e) { fail('Assignments', e.message); }

  // ── 7. TASKS ──
  console.log('\n━━━ 7. TASKS ━━━');
  try {
    await page.goto(`${BASE}/tasks`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    if (body.includes('Task')) ok('Tasks page loads');
    else fail('Tasks page', 'No task text');
    if (body.includes('DBMS') || body.includes('C pointer') || body.includes('hackathon') || body.includes('LinkedIn')) ok('Task items render');
    else fail('Task items', 'No task data');
  } catch (e) { fail('Tasks', e.message); }

  // ── 8. NOTICES ──
  console.log('\n━━━ 8. NOTICES ━━━');
  try {
    await page.goto(`${BASE}/college`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    if (body.includes('Notice') || body.includes('Mid-Semester') || body.includes('TechFest')) ok('Notices page loads with data');
    else fail('Notices page', 'No notice content');
  } catch (e) { fail('Notices', e.message); }

  // ── 9. EVENTS ──
  console.log('\n━━━ 9. EVENTS ━━━');
  try {
    await page.goto(`${BASE}/events`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    if (body.includes('Event')) ok('Events page loads');
    else fail('Events page', 'No event text');
    if (body.includes('Hackathon') || body.includes('Workshop') || body.includes('Fest') || body.includes('Talk')) ok('Event cards render');
    else fail('Event data', 'No events');
  } catch (e) { fail('Events', e.message); }

  // ── 10. CLUBS ──
  console.log('\n━━━ 10. CLUBS ━━━');
  try {
    await page.goto(`${BASE}/clubs`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    if (body.includes('Club')) ok('Clubs page loads');
    else fail('Clubs page', 'No club text');
    if (body.includes('Coding') || body.includes('AI/ML') || body.includes('Robotics')) ok('Club cards render');
    else fail('Club data', 'No clubs');
  } catch (e) { fail('Clubs', e.message); }

  // ── 11. OPPORTUNITIES ──
  console.log('\n━━━ 11. OPPORTUNITIES ━━━');
  try {
    await page.goto(`${BASE}/opportunities`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1500);
    const body = await page.textContent('body');
    if (body.includes('Opportunit')) ok('Opportunities page loads');
    else fail('Opportunities page', 'No opportunity text');
    if (body.includes('Hackathon') || body.includes('Internship') || body.includes('Scholarship')) ok('Opportunity cards render');
    else fail('Opportunity data', 'No opportunities');
  } catch (e) { fail('Opportunities', e.message); }

  // ── 12. AI CHAT ──
  console.log('\n━━━ 12. AI CHAT ━━━');
  try {
    await page.goto(`${BASE}/ai/chat`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    if (body.includes('AI') || body.includes('Assistant') || body.includes('Chat')) ok('AI Chat page loads');
    else fail('AI Chat page', 'No AI text');
    // AI chat uses <input className="input"> (no type attr, defaults to text)
    const chatInput = await page.$('input.input') || await page.$('input[placeholder*="timetable" i]') || await page.$('input[placeholder*="Ask" i]');
    if (chatInput) ok('Chat input field present');
    else fail('Chat input', 'Not found');
    // Check suggestion buttons
    const suggestions = await page.$$('button');
    const hasSuggestions = suggestions.length > 3;
    if (hasSuggestions) ok('Suggestion buttons present');
    else fail('Suggestion buttons', 'Not enough buttons');
  } catch (e) { fail('AI Chat', e.message); }

  // ── 13. AI PLANNER ──
  console.log('\n━━━ 13. AI PLANNER ━━━');
  try {
    await page.goto(`${BASE}/ai/planner`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    if (body.includes('Planner') || body.includes('Plan') || body.includes('AI')) ok('AI Planner page loads');
    else fail('AI Planner', 'No planner text');
  } catch (e) { fail('AI Planner', e.message); }

  // ── 14. AI SKILLS ──
  console.log('\n━━━ 14. AI SKILLS ━━━');
  try {
    await page.goto(`${BASE}/ai/skills`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    if (body.includes('Skill') || body.includes('Roadmap') || body.includes('AI')) ok('AI Skills page loads');
    else fail('AI Skills', 'No skills text');
  } catch (e) { fail('AI Skills', e.message); }

  // ── 15. PROFILE ──
  console.log('\n━━━ 15. PROFILE ━━━');
  try {
    await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    if (body.includes('Aarav')) ok('Profile shows user data');
    else fail('Profile data', 'No user name');
    if (body.includes('BCA') || body.includes('Computer Science') || body.includes('Python')) ok('Profile shows academic details');
    else fail('Academic details', 'Not shown');
  } catch (e) { fail('Profile', e.message); }

  // ── 16. NOTIFICATIONS ──
  console.log('\n━━━ 16. NOTIFICATIONS ━━━');
  try {
    await page.goto(`${BASE}/notifications`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    if (body.includes('Notification')) ok('Notifications page loads');
    else fail('Notifications page', 'No notification text');
  } catch (e) { fail('Notifications', e.message); }

  // ── 17. EXAMS ──
  console.log('\n━━━ 17. EXAMS ━━━');
  try {
    await page.goto(`${BASE}/exams`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    if (body.includes('Exam') || body.includes('Unit Test') || body.includes('Mid')) ok('Exams page loads');
    else fail('Exams page', 'No exam text');
  } catch (e) { fail('Exams', e.message); }

  // ── 18. APPLICATIONS ──
  console.log('\n━━━ 18. APPLICATIONS ━━━');
  try {
    await page.goto(`${BASE}/applications`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    if (body.includes('Application')) ok('Applications page loads');
    else fail('Applications page', 'No application text');
  } catch (e) { fail('Applications', e.message); }

  // ── 19. RESUMES ──
  console.log('\n━━━ 19. RESUMES ━━━');
  try {
    await page.goto(`${BASE}/resumes`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    if (body.includes('Resume')) ok('Resumes page loads');
    else fail('Resumes page', 'No resume text');
  } catch (e) { fail('Resumes', e.message); }

  // ── 20. NAVIGATION ──
  console.log('\n━━━ 20. NAVIGATION FLOW ━━━');
  try {
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);

    const ttLink = await page.$('a[href="/timetable"]');
    if (ttLink) {
      await ttLink.click();
      await page.waitForTimeout(1500);
      if (page.url().includes('/timetable')) ok('Sidebar nav → Timetable');
      else fail('Sidebar nav → Timetable', 'Failed');
    } else fail('Sidebar nav → Timetable', 'Link not found');

    const dashLink = await page.$('a[href="/dashboard"]');
    if (dashLink) {
      await dashLink.click();
      await page.waitForTimeout(1500);
      if (page.url().includes('/dashboard')) ok('Sidebar nav → Dashboard');
      else fail('Sidebar nav → Dashboard', 'Failed');
    } else fail('Sidebar nav → Dashboard', 'Link not found');

    // Close notification dropdown if open by clicking elsewhere
    await page.click('main', { force: true }).catch(() => {});
    await page.waitForTimeout(300);

    const bell = await page.$('button[aria-label="Notifications"]');
    if (bell) {
      await bell.click();
      await page.waitForTimeout(500);
      const dropdown = await page.textContent('body');
      if (dropdown.includes('Notifications') || dropdown.includes('Mark all')) ok('Notification bell dropdown');
      else fail('Notification dropdown', 'No content');
      // Close by clicking the overlay
      const overlay = await page.$('.fixed.inset-0.z-30');
      if (overlay) await overlay.click();
      else await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  } catch (e) { fail('Navigation flow', e.message); }

  // ── 21. LOGOUT ──
  console.log('\n━━━ 21. LOGOUT ━━━');
  try {
    // Make sure no dropdown is open
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);

    // Use force:true to bypass any overlay
    const logoutBtn = await page.$('button[aria-label="Logout"]');
    if (logoutBtn) {
      await logoutBtn.click({ force: true });
      await page.waitForURL('**/login**', { timeout: 5000 });
      await page.waitForTimeout(500);
      if (page.url().includes('/login')) ok('Logout redirects to login');
      else fail('Logout', `URL: ${page.url()}`);
    } else fail('Logout button', 'Not found');
  } catch (e) { fail('Logout', e.message); }

  // ── 22. INVALID LOGIN ──
  console.log('\n━━━ 22. INVALID LOGIN ━━━');
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    if (!page.url().includes('/dashboard')) ok('Invalid login stays on login page');
    else fail('Invalid login', 'Should not redirect to dashboard');
    const body = await page.textContent('body');
    if (body.includes('Invalid') || body.includes('error') || body.includes('Error') || body.includes('wrong')) ok('Error message shown for invalid login');
    else fail('Invalid login error', 'No error message');
  } catch (e) { fail('Invalid login', e.message); }

  // ── 23. REGISTER PAGE ──
  console.log('\n━━━ 23. REGISTER PAGE ━━━');
  try {
    await page.goto(`${BASE}/register`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    // Multi-step register: step 0 shows "Who are you?" with role selection
    if (body.includes('Who are you') || body.includes('Register') || body.includes('Sign up') || body.includes('role')) ok('Register page loads (multi-step)');
    else fail('Register page', 'Not found');

    // Check role selection buttons
    if (body.includes('Student') && body.includes('Faculty') && body.includes('Admin')) ok('Role selection step renders');
    else fail('Role selection', 'Not all roles shown');

    // Click student role to go to step 1
    const studentBtn = await page.$('button:has-text("Student")');
    if (studentBtn) {
      await studentBtn.click();
      await page.waitForTimeout(500);
      const body2 = await page.textContent('body');
      if (body2.includes('Create') || body2.includes('Full name') || body2.includes('email')) ok('Student registration form appears');
      else fail('Student registration form', 'Not shown after role selection');
    } else fail('Student role button', 'Not found');
  } catch (e) { fail('Register page', e.message); }

  // ── 24. FORGOT PASSWORD ──
  console.log('\n━━━ 24. FORGOT PASSWORD ━━━');
  try {
    await page.goto(`${BASE}/forgot-password`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(500);
    const body = await page.textContent('body');
    if (body.includes('Forgot') || body.includes('Reset') || body.includes('password')) ok('Forgot password page loads');
    else fail('Forgot password page', 'Not found');
  } catch (e) { fail('Forgot password', e.message); }

  // ── 25. ROLE GATING ──
  console.log('\n━━━ 25. ROLE GATING ━━━');
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.fill('input[type="email"]', 'student@demo.campusconnect');
    await page.fill('input[type="password"]', 'demo1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1500);
    const adminUrl = page.url();
    if (!adminUrl.includes('/admin')) ok('Student redirected away from admin');
    else fail('Role gating', `Student on admin: ${adminUrl}`);

    await page.goto(`${BASE}/faculty`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1500);
    const facUrl = page.url();
    if (!facUrl.includes('/faculty')) ok('Student redirected away from faculty');
    else fail('Role gating faculty', `Student on faculty: ${facUrl}`);
  } catch (e) { fail('Role gating', e.message); }

  // ── 26. MOBILE VIEW ──
  console.log('\n━━━ 26. MOBILE VIEW ━━━');
  try {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);

    const asideHidden = await page.$eval('aside', (el) => {
      const style = window.getComputedStyle(el);
      return style.display === 'none' || el.classList.contains('hidden');
    }).catch(() => true);
    if (asideHidden) ok('Sidebar hidden on mobile');
    else fail('Mobile sidebar', 'Sidebar visible');

    const menuBtn = await page.$('button[aria-label="Open menu"]');
    if (menuBtn) ok('Mobile menu button present');
    else fail('Mobile menu button', 'Not found');

    if (menuBtn) {
      await menuBtn.click();
      await page.waitForTimeout(500);
      const mobileSidebar = await page.$('.fixed.inset-0');
      if (mobileSidebar) ok('Mobile sidebar opens on menu click');
      else fail('Mobile sidebar open', 'Not triggered');
    }

    await page.setViewportSize({ width: 1440, height: 900 });
  } catch (e) { fail('Mobile view', e.message); }

  // ── SUMMARY ──
  console.log('\n═══════════════════════════════════════');
  console.log('          E2E TEST RESULTS');
  console.log('═══════════════════════════════════════');
  results.forEach((r) => console.log(r));
  console.log('───────────────────────────────────────');
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  Total:    ${passed + failed}`);
  console.log('═══════════════════════════════════════');

  if (jsErrors.length > 0) {
    console.log('\n⚠️  JS Page Errors:');
    [...new Set(jsErrors)].forEach((e) => console.log('  - ' + e.substring(0, 200)));
  } else {
    console.log('\n✅ Zero JS page errors');
  }

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
