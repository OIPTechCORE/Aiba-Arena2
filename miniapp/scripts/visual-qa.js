/**
 * Visual QA script: navigate, switch tabs, capture screenshots and measurements.
 * Reports confirmed visual inconsistencies.
 * Run: npm run visual-qa (requires dev server on localhost:3000)
 * One-time: npx playwright install chromium
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '../.visual-qa');

/** Measure element bounding box and text */
async function measure(el, label) {
  if (!el) return null;
  const box = await el.boundingBox();
  const text = await el.textContent().catch(() => '');
  return { label, ...box, text: text?.slice(0, 100) };
}

/** Check quick-nav for expected labels and report inconsistencies */
async function verifyQuickNav(page) {
  const expected = ['Guide', 'FAQs', 'Settings'];
  const inconsistencies = [];
  const btns = await page.$$('.quick-nav__btn');
  const actual = [];
  for (const btn of btns) {
    const text = await btn.textContent().catch(() => '');
    actual.push(text?.trim() || '');
  }
  for (let i = 0; i < expected.length; i++) {
    const e = expected[i];
    const a = actual[i];
    if (a !== e) {
      inconsistencies.push({ where: 'quick-nav', expected: e, actual: a || '(empty)' });
    }
  }
  return { expected, actual, inconsistencies };
}

/** Check bottom nav for expected tab labels */
async function verifyBottomNav(page) {
  const labels = await page.$$eval(
    '.android-bottom-nav__label',
    els => els.map(e => e.textContent?.trim() || '')
  );
  const inconsistencies = [];
  const required = ['Home', 'Profile'];
  for (const r of required) {
    if (!labels.includes(r)) {
      inconsistencies.push({ where: 'bottom-nav', expected: `Tab "${r}" present`, actual: `Not found. Labels: ${labels.join(', ')}` });
    }
  }
  return { labels, inconsistencies };
}

/** Check tab panel visibility and content */
async function verifyTabContent(page, tabId, tabLabel) {
  const panel = await page.$(`.tab-panel.is-active`);
  if (!panel) return { found: false, inconsistencies: [{ where: `tab-${tabId}`, expected: 'Active panel', actual: 'None' }] };
  const title = await page.$('.card__title');
  const titleText = title ? await title.textContent().catch(() => '') : '';
  const inconsistencies = [];
  return { found: true, titleText: titleText?.slice(0, 60), inconsistencies };
}

async function run() {
  let browser;
  const report = {
    timestamp: new Date().toISOString(),
    tabs: {},
    measurements: [],
    inconsistencies: [],
  };

  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    console.error('Playwright launch failed. Run: npx playwright install chromium');
    throw e;
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 15000 });
    await page.waitForSelector('.tab-content', { timeout: 8000 });
  } catch (e) {
    report.inconsistencies.push({ where: 'setup', expected: 'App loads', actual: e.message });
    report.error = e.message;
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
    console.error('Visual QA failed: app did not load. Is dev server running on localhost:3000?');
    process.exitCode = 1;
    await browser.close();
    return;
  }

  try {
    // Dismiss cinematic intro if present
    const enterBtn = await page.$('.cinematic__enter, .hero-center__enter--btn');
    if (enterBtn) {
      await enterBtn.click();
      await page.waitForTimeout(600);
    }
    // Dismiss tutorial overlay if present (blocks clicks)
    const overlay = page.locator('.tutorial-overlay');
    if (await overlay.count() > 0) {
      const skip = overlay.locator('button', { hasText: 'Skip' });
      if (await skip.count() > 0) await skip.first().click();
      else {
        const done = overlay.locator('button', { hasText: 'Done' });
        if (await done.count() > 0) await done.first().click();
        else {
          for (let i = 0; i < 4; i++) {
            const next = overlay.locator('button', { hasText: 'Next' });
            if ((await next.count()) === 0) break;
            await next.first().click();
            await page.waitForTimeout(300);
          }
        }
      }
      await page.waitForTimeout(400);
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });

    // 1. Verify quick-nav
    const quickNavResult = await verifyQuickNav(page);
    report.quickNav = quickNavResult;
    report.inconsistencies.push(...quickNavResult.inconsistencies);

    // Capture header/quick-nav area
    const quickNav = await page.$('.quick-nav');
    if (quickNav) {
      await quickNav.screenshot({ path: path.join(OUT_DIR, 'quick-nav.png') });
    }

    // 2. Verify bottom nav and switch tabs
    const bottomNavResult = await verifyBottomNav(page);
    report.bottomNav = bottomNavResult;
    report.inconsistencies.push(...bottomNavResult.inconsistencies);

    const tabConfigs = [
      { id: 'home', label: 'Home' },
      { id: 'market', label: 'Market' },
      { id: 'carRacing', label: 'Car Racing' },
      { id: 'bikeRacing', label: 'Bike Racing' },
      { id: 'profile', label: 'Profile' },
    ];

    for (const { id, label } of tabConfigs) {
      const btn = await page.locator('.android-bottom-nav__btn').filter({ hasText: label }).first();
      if (!(await btn.count())) continue;

      await btn.click();
      await page.waitForTimeout(600);

      const filename = `tab-${id}.png`;
      await page.screenshot({ path: path.join(OUT_DIR, filename), fullPage: false });
      report.tabs[id] = { screenshot: filename };

      const tabResult = await verifyTabContent(page, id, label);
      if (tabResult.inconsistencies?.length) {
        report.inconsistencies.push(...tabResult.inconsistencies);
      }

      // Measurements
      const card = await page.$('.tab-panel.is-active .card, .tab-panel.is-active .card--elevated').catch(() => null);
      const title = await page.$('.tab-panel.is-active .card__title').catch(() => null);
      const hint = await page.$('.tab-panel.is-active .card__hint').catch(() => null);
      const navActive = await page.$('.android-bottom-nav__btn--active');

      for (const [el, mLabel] of [
        [card, `card-${id}`],
        [title, `title-${id}`],
        [hint, `hint-${id}`],
        [navActive, `navBtn-${id}`],
      ]) {
        const m = await measure(el, mLabel);
        if (m) report.measurements.push(m);
      }
    }

    fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(OUT_DIR, 'measurements.json'), JSON.stringify({ tabs: report.tabs, measurements: report.measurements }, null, 2));

    console.log('Visual QA complete. Output:', OUT_DIR);
    if (report.inconsistencies.length > 0) {
      console.log('\n--- Confirmed visual inconsistencies ---');
      report.inconsistencies.forEach((inc, i) => {
        console.log(`${i + 1}. [${inc.where}] Expected: "${inc.expected}" | Actual: "${inc.actual}"`);
      });
      process.exitCode = 1;
    }
  } catch (e) {
    console.error('Visual QA failed:', e.message);
    report.error = e.message;
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
