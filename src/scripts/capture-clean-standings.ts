import puppeteer from 'puppeteer-core';

async function captureCleanStandings() {
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

  // Navigate to Standings
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const standingsBtn = btns.find(b => b.textContent && b.textContent.includes('Standings'));
    if (standingsBtn) (standingsBtn as HTMLElement).click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const screenPath = '/Users/aryan.sethiya/.gemini/antigravity-ide/brain/781b0207-14dc-40df-8b0f-785653378b2e/clean_standings.png';
  await page.screenshot({ path: screenPath });
  console.log(`📸 Captured Clean Space Standings -> ${screenPath}`);

  await browser.close();
}

captureCleanStandings().catch(console.error);
