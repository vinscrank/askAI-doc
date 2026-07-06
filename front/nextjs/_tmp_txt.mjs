import { chromium } from 'playwright';

const scratch = '/private/tmp/claude-501/-Users-vincenzo-Desktop-websites-askDocAI/6f0e3c8d-2767-4dbf-b072-352c7c34f402/scratchpad';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });

const consoleErrors = [];
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

await page.goto('http://localhost:3000/app/56643c23-672e-46be-a3a1-39bb48c71403', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${scratch}/txt-readable.png`, fullPage: true });

const el = page.locator('.overflow-auto').first();
const box = await el.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + 50);
await page.mouse.wheel(0, 400);
await page.waitForTimeout(300);

const scrollTop = await el.evaluate((e) => e.scrollTop);
const windowScroll = await page.evaluate(() => window.scrollY);
console.log('txt preview scrollTop:', scrollTop, 'window scrollY:', windowScroll);

console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors));
await browser.close();
