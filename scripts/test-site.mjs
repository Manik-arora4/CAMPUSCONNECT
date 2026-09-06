import { chromium } from 'playwright';
import { spawn } from 'child_process';

const LOCAL = 'http://localhost:5000';

async function test() {
  console.log('Starting server...');
  const server = spawn('node', ['server/src/index.js'], {
    env: { ...process.env, NODE_ENV: 'development' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  server.stdout.on('data', d => process.stdout.write(d));
  server.stderr.on('data', d => process.stderr.write(d));

  for (let i = 0; i < 20; i++) {
    try { if ((await fetch(LOCAL + '/api/health')).ok) break; } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }

  // First, register a new user with a unique password so we can test
  console.log('\n=== Register test user with unique password ===');
  const testPass = 'xK9mP2wQ7z'; // unique password
  const regResult = await fetch(LOCAL + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Debug User',
      email: 'debug@test.edu',
      password: testPass,
      role: 'student'
    })
  });
  const regData = await regResult.json();
  console.log('Register:', regResult.status, regData.user?.name || regData.error);

  // Test 1: Node.js login with the unique password
  console.log('\n=== Node.js login ===');
  const r1 = await fetch(LOCAL + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'debug@test.edu', password: testPass })
  });
  console.log('Result:', r1.status, (await r1.json()).user?.name || 'FAILED');

  // Test 2: Chromium login with the same unique password
  console.log('\n=== Chromium login ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(LOCAL + '/login', { waitUntil: 'networkidle', timeout: 30000 });
  
  const r2 = await page.evaluate(async (pass) => {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'debug@test.edu', password: pass })
    });
    const data = await r.json();
    return { status: r.status, name: data.user?.name, error: data.error };
  }, testPass);
  console.log('Result:', r2.status, r2.name || r2.error);
  
  await browser.close();
  server.kill();
}

test().catch(console.error);
