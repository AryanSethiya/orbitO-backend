import puppeteer from 'puppeteer-core';

async function testFullSuite() {
  console.log('🚀 Launching automated browser testing with Logo, Room-based Communities & Streaming AI Roast...');

  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('dialog', async (dialog) => {
    console.log('  [AUTO DISMISS DIALOG]', dialog.message());
    await dialog.dismiss();
  });

  page.on('console', (msg) => console.log('  [BROWSER CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', (err: any) => console.log('  [BROWSER ERROR]', err?.message || err));

  console.log('📡 Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  // Clear local storage for fresh test pilot
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  // 1. Sign In
  console.log('🔐 Authenticating as Aryan Sethiya...');
  const signInNav = await page.$('#sign-in-nav-btn');
  if (signInNav) {
    await signInNav.click();
    await new Promise((r) => setTimeout(r, 600));

    const launchAuth = await page.waitForSelector('#launch-auth-btn');
    if (launchAuth) {
      await launchAuth.click();
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // 2. Submit Probes
  console.log('🛸 Entering Daily Orbit...');
  const probeInput = '#probe-word-input';
  await page.waitForSelector(probeInput);

  async function typeAndSend(word: string) {
    console.log(`🛸 Launching probe: "${word}"...`);
    await page.evaluate((selector: string) => {
      const el = document.querySelector(selector) as HTMLInputElement;
      if (el) el.value = '';
    }, probeInput);
    await page.type(probeInput, word);
    await page.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 2000));
  }

  await typeAndSend('guitar');
  await typeAndSend('coffee');
  await typeAndSend('ocean');

  const screenPath1 = '/Users/aryan.sethiya/.gemini/antigravity-ide/brain/781b0207-14dc-40df-8b0f-785653378b2e/screen1_gameplay.png';
  await page.screenshot({ path: screenPath1 });
  console.log(`📸 Captured Gameplay Screen -> ${screenPath1}`);

  // 3. Solve with target word: "galaxy"
  console.log('🎯 Entering center target word: "galaxy"...');
  await typeAndSend('galaxy');
  await new Promise((r) => setTimeout(r, 3500));

  const screenPath2 = '/Users/aryan.sethiya/.gemini/antigravity-ide/brain/781b0207-14dc-40df-8b0f-785653378b2e/screen2_solved.png';
  await page.screenshot({ path: screenPath2 });
  console.log(`📸 Captured Solved Modal with Streaming Roast -> ${screenPath2}`);

  // 4. Standings Screen
  console.log('🏆 Navigating to Standings...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const standingsBtn = btns.find(b => b.textContent && b.textContent.includes('Standings'));
    if (standingsBtn) (standingsBtn as HTMLElement).click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const screenPath3 = '/Users/aryan.sethiya/.gemini/antigravity-ide/brain/781b0207-14dc-40df-8b0f-785653378b2e/screen3_standings.png';
  await page.screenshot({ path: screenPath3 });
  console.log(`📸 Captured Standings Screen -> ${screenPath3}`);

  await browser.close();
  console.log('🎉 Full verification test finished successfully!');
}

testFullSuite().catch(console.error);
