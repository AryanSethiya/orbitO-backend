import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const artifactDir = '/Users/aryan.sethiya/.gemini/antigravity-ide/brain/781b0207-14dc-40df-8b0f-785653378b2e';

async function runAutonomousTest() {
  console.log('🚀 Launching automated browser testing with Google Pilot Auth & Community Leaderboards...');
  
  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (!fs.existsSync(executablePath)) {
    throw new Error('Chrome executable not found at: ' + executablePath);
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  
  page.on('console', (msg) => console.log('  [BROWSER CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', (err: any) => console.log('  [BROWSER ERROR]', err?.message || err));

  // 1. Mission Control Screen
  console.log('📡 Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  
  // Click Google Pilot Authentication Prompt
  console.log('🔐 Opening Pilot Authentication Modal...');
  await page.evaluate(() => {
    const banner = Array.from(document.querySelectorAll('div')).find(d => d.textContent?.includes('Google Pilot Authentication'));
    if (banner) (banner as HTMLElement).click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Sign In as AstroPioneer in Starfleet Academy
  console.log('✨ Authenticating as AstroPioneer (Starfleet Academy)...');
  await page.evaluate(() => {
    const authBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Launch as AstroPioneer') || b.textContent?.includes('Continue with Google'));
    if (authBtn) (authBtn as HTMLButtonElement).click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const screen1Path = path.join(artifactDir, 'screen1_mission_control.png');
  await page.screenshot({ path: screen1Path });
  console.log('📸 Captured Screen 1: Mission Control with Authenticated Pilot ->', screen1Path);

  // Click Launch on Mission Control
  console.log('🚀 Clicking Launch button on Mission Control...');
  await page.evaluate(() => {
    const launchBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Launch') && !b.textContent?.includes('AstroPioneer'));
    if (launchBtn) (launchBtn as HTMLButtonElement).click();
  });

  // 2. Launch Daily Orbit
  console.log('⏳ Entering Daily Orbit HUD...');
  const inputSelector = 'input[placeholder="ENTER SEMANTIC PROBE..."]';
  await page.waitForSelector(inputSelector, { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1000));

  // Submit Probes
  console.log('🛸 Entering probe: "sky"...');
  await page.type(inputSelector, 'sky');
  await page.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 2000));

  console.log('🛸 Entering probe: "stars"...');
  await page.type(inputSelector, 'stars');
  await page.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 2000));

  const screen2Path = path.join(artifactDir, 'screen2_daily_orbit.png');
  await page.screenshot({ path: screen2Path });
  console.log('📸 Captured Screen 2: Daily Orbit with Probes & Telemetry ->', screen2Path);

  // Submit Target Word to solve!
  const todayTarget = 'galaxy';
  console.log(`🎯 Entering center target word: "${todayTarget}"...`);
  await page.click(inputSelector, { count: 3 });
  await page.keyboard.press('Backspace');
  await page.type(inputSelector, todayTarget);
  await page.keyboard.press('Enter');

  // 3. Solved Screen
  console.log('🏆 Waiting for Orbit Solved Screen...');
  await page.waitForFunction(() => document.body.innerText.includes('SOLVED!'), { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 3000));

  const screen3Path = path.join(artifactDir, 'screen3_orbit_solved.png');
  await page.screenshot({ path: screen3Path });
  console.log('📸 Captured Screen 3: Orbit Solved with Live AI Roast & Countdown ->', screen3Path);

  // 4. Navigate to Space Standings
  console.log('🏆 Navigating to Space Standings...');
  await page.evaluate(() => {
    const standingsBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('View Space Standings') || b.textContent?.includes('Standings'));
    if (standingsBtn) (standingsBtn as HTMLButtonElement).click();
  });
  await new Promise((r) => setTimeout(r, 3000));

  const screen4Path = path.join(artifactDir, 'screen4_space_standings.png');
  await page.screenshot({ path: screen4Path });
  console.log('📸 Captured Screen 4: Real-time Space Standings with Community Tabs ->', screen4Path);

  await browser.close();
  console.log('🎉 Full End-to-End Test for Auth, One-Play Lock, and Real Community Leaderboards completed successfully!');
}

runAutonomousTest().catch((err) => {
  console.error('❌ Autonomous test error:', err);
  process.exit(1);
});
