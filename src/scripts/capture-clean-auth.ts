import puppeteer from 'puppeteer-core';

async function captureCleanAuth() {
  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  // Open Auth Modal
  const signInNav = await page.$('#sign-in-nav-btn');
  if (signInNav) {
    await signInNav.click();
    await new Promise((r) => setTimeout(r, 800));
  }

  const screenPath = '/Users/aryan.sethiya/.gemini/antigravity-ide/brain/781b0207-14dc-40df-8b0f-785653378b2e/clean_auth_modal.png';
  await page.screenshot({ path: screenPath });
  console.log(`📸 Captured Clean Auth Modal -> ${screenPath}`);

  await browser.close();
}

captureCleanAuth().catch(console.error);
