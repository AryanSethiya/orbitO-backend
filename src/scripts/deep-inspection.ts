import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function inspectAndTest() {
  console.log('🔍 Starting Deep Inspection and Verification...');

  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleLogs: string[] = [];
  page.on('console', (msg) => {
    const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    console.log(' ', text);
    consoleLogs.push(text);
  });

  page.on('pageerror', (err: any) => {
    console.error('  [PAGE ERROR]', err?.message || err);
  });

  // 1. Navigate to frontend
  console.log('📡 Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  // Reset to brand new test pilot
  const testUserId = `pilot_${Date.now()}`;
  console.log(`🔐 Signing in as fresh test pilot: ${testUserId}...`);
  await page.evaluate((id: string) => {
    localStorage.clear();
    const user = {
      id,
      name: 'Commander Nova',
      email: `${id}@gmail.com`,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`,
      community: "Aryan's Cosmic Fleet",
    };
    localStorage.setItem('orbito_user', JSON.stringify(user));
    localStorage.setItem('orbito_player_id', id);
  }, testUserId);

  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));

  const screen1 = '/Users/aryan.sethiya/.gemini/antigravity-ide/brain/781b0207-14dc-40df-8b0f-785653378b2e/inspect1_fresh_orbit.png';
  await page.screenshot({ path: screen1 });
  console.log(`📸 Captured Fresh Orbit Screen -> ${screen1}`);

  // 2. Test Decrypt Clue #1
  console.log('💡 Decrypting Clue #1...');
  const hintBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((el) => el.textContent && el.textContent.includes('Decrypt Next Clue'));
    if (b) {
      (b as HTMLElement).click();
      return true;
    }
    return false;
  });
  console.log('  Hint button clicked:', hintBtn);
  await new Promise((r) => setTimeout(r, 2000));

  const screen2 = '/Users/aryan.sethiya/.gemini/antigravity-ide/brain/781b0207-14dc-40df-8b0f-785653378b2e/inspect2_after_hint1.png';
  await page.screenshot({ path: screen2 });
  console.log(`📸 Captured After Hint #1 -> ${screen2}`);

  // 3. Test Decrypt Clue #2
  console.log('💡 Decrypting Clue #2...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((el) => el.textContent && el.textContent.includes('Decrypt Next Clue'));
    if (b) (b as HTMLElement).click();
  });
  await new Promise((r) => setTimeout(r, 2000));

  const screen3 = '/Users/aryan.sethiya/.gemini/antigravity-ide/brain/781b0207-14dc-40df-8b0f-785653378b2e/inspect3_after_hint2.png';
  await page.screenshot({ path: screen3 });
  console.log(`📸 Captured After Hint #2 -> ${screen3}`);

  // 4. Test Submitting Probes
  console.log('🛸 Submitting Probe "guitar"...');
  const probeInput = '#probe-word-input';
  await page.waitForSelector(probeInput);
  await page.type(probeInput, 'guitar');
  await page.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 2000));

  console.log('🛸 Submitting Probe "coffee"...');
  await page.evaluate((selector: string) => {
    const el = document.querySelector(selector) as HTMLInputElement;
    if (el) el.value = '';
  }, probeInput);
  await page.type(probeInput, 'coffee');
  await page.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 2000));

  const screen4 = '/Users/aryan.sethiya/.gemini/antigravity-ide/brain/781b0207-14dc-40df-8b0f-785653378b2e/inspect4_probes_launched.png';
  await page.screenshot({ path: screen4 });
  console.log(`📸 Captured Probes Launched -> ${screen4}`);

  // 5. Solve Daily Orbit
  console.log('🎯 Submitting Center Target Word "galaxy"...');
  await page.evaluate((selector: string) => {
    const el = document.querySelector(selector) as HTMLInputElement;
    if (el) el.value = '';
  }, probeInput);
  await page.type(probeInput, 'galaxy');
  await page.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 4000));

  const screen5 = '/Users/aryan.sethiya/.gemini/antigravity-ide/brain/781b0207-14dc-40df-8b0f-785653378b2e/inspect5_solved_savage.png';
  await page.screenshot({ path: screen5 });
  console.log(`📸 Captured Solved Savage Roast -> ${screen5}`);

  await browser.close();
  console.log('🎉 Deep Inspection Completed!');
}

inspectAndTest().catch(console.error);
