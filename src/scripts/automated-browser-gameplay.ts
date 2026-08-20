import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const artifactDir = '/Users/aryan.sethiya/.gemini/antigravity-ide/brain/781b0207-14dc-40df-8b0f-785653378b2e';

async function runAutonomousTest() {
  console.log('🚀 Launching automated browser testing via Google Chrome...');
  
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
  page.on('pageerror', (err) => console.log('  [BROWSER ERROR]', err.message));

  // 1. Mission Control Screen
  console.log('📡 Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  
  const screen1Path = path.join(artifactDir, 'screen1_mission_control.png');
  await page.screenshot({ path: screen1Path });
  console.log('📸 Captured Screen 1: Mission Control ->', screen1Path);

  // Click Launch
  console.log('🎯 Clicking "Launch" button...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const launch = buttons.find((b) => b.textContent?.includes('Launch'));
    if (launch) launch.click();
  });

  // 2. Wait for Daily Orbit Screen to load
  console.log('⏳ Waiting for Daily Orbit HUD...');
  const inputSelector = 'input[placeholder="ENTER SEMANTIC PROBE..."]';
  await page.waitForSelector(inputSelector, { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1000));

  // Submit First Probe "travel"
  console.log('🛸 Entering probe: "travel"...');
  await page.type(inputSelector, 'travel');
  await page.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 2000));

  // Submit Second Probe "flight"
  console.log('🛸 Entering probe: "flight"...');
  await page.click(inputSelector, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type(inputSelector, 'flight');
  await page.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 2000));

  const screen2Path = path.join(artifactDir, 'screen2_daily_orbit.png');
  await page.screenshot({ path: screen2Path });
  console.log('📸 Captured Screen 2: Daily Orbit with Trajectories ->', screen2Path);

  // Submit Target Word "airport" to solve!
  console.log('🎯 Entering center target word: "airport"...');
  await page.click(inputSelector, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type(inputSelector, 'airport');
  await page.keyboard.press('Enter');

  // 3. Solved Screen
  console.log('🏆 Waiting for Orbit Solved Screen...');
  await page.waitForFunction(() => document.body.innerText.includes('SOLVED!'), { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));

  const screen3Path = path.join(artifactDir, 'screen3_orbit_solved.png');
  await page.screenshot({ path: screen3Path });
  console.log('📸 Captured Screen 3: Orbit Solved! ->', screen3Path);

  // 4. Standings Screen
  console.log('🏆 Navigating to Space Standings...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const standingsBtn = buttons.find((b) => b.textContent?.includes('Standings') || b.textContent?.includes('Space Standings'));
    if (standingsBtn) standingsBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const screen4Path = path.join(artifactDir, 'screen4_space_standings.png');
  await page.screenshot({ path: screen4Path });
  console.log('📸 Captured Screen 4: Space Standings ->', screen4Path);

  await browser.close();
  console.log('🎉 Full 4-screen Stitch test completed successfully!');
}

runAutonomousTest().catch((err) => {
  console.error('❌ Autonomous test error:', err);
  process.exit(1);
});
