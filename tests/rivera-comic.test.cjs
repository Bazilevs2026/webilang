// Run with Playwright available on NODE_PATH and CHROMIUM_PATH pointing to Chromium.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
let browser, server, origin;
before(async () => {
  // Like Vercel, serve directory index.html without redirecting to a trailing slash.
  server = http.createServer(async (req, res) => {
    try {
      let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
      if (!file.startsWith(root + path.sep)) throw new Error('Outside checkout');
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
      const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg' }[path.extname(file)];
      res.setHeader('Content-Type', type || 'application/octet-stream');
      res.end(await fs.readFile(file));
    } catch { res.writeHead(404).end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
});
after(async () => { await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); });

async function lesson(viewport, failure) {
  const page = await browser.newPage({ viewport });
  // External APIs/fonts are unrelated to local comic rendering; never call paid services.
  await page.route('**/*', async route => {
    const url = route.request().url();
    if (!url.startsWith(origin + '/')) return route.abort();
    if (failure && /\/assets\/rivera-\d\.jpg$/.test(url)) {
      return route.fulfill(failure === '404'
        ? { status: 404, contentType: 'text/plain', body: 'Missing image' }
        : { status: 200, contentType: 'text/html', body: '<html>Not an image</html>' });
    }
    return route.continue();
  });
  return page;
}

async function checkPanels(page, broken = false) {
  assert.equal(await page.locator('.comic-image').count(), 8);
  for (let i = 0; i < 8; i++) {
    const img = page.locator('.comic-image').nth(i);
    await img.scrollIntoViewIfNeeded(); // Exercise lazy loading for every panel.
    await page.waitForFunction(({ i, broken }) => {
      const img = document.querySelectorAll('.comic-image')[i];
      return img.complete && (broken ? img.style.opacity === '0' : img.naturalWidth > 0);
    }, { i, broken });
    const data = await img.evaluate(el => ({ src: el.currentSrc, width: el.naturalWidth, opacity: getComputedStyle(el).opacity, alt: el.alt }));
    assert.equal(data.src, `${origin}/webilang-art-lab/assets/rivera-${i + 1}.jpg`);
    assert.match(data.alt, new RegExp(`scene ${i + 1}:`));
    assert.equal(data.opacity, broken ? '0' : '1');
    assert.equal(data.width, broken ? 0 : 762);
    const art = page.locator('.comic-art').nth(i);
    const box = await art.boundingBox();
    assert.ok(box.width > 100 && box.height > 100, `Panel ${i + 1} retains its artwork area`);
    assert.equal(await art.locator('.comic-fallback').isVisible(), true);
    assert.match(await art.textContent(), new RegExp(`0${i + 1} /`));
    assert.match(await art.textContent(), /Illustration unavailable/);
    const vocab = page.locator('.illustrated-scene .vocab-select').nth(i);
    await vocab.click();
    assert.match(await vocab.getAttribute('class'), /picked/);
  }
  const stocks = await page.evaluate(() => JSON.parse(localStorage.getItem('webilang-art-lab-personal-stocks-v2')));
  assert.equal(stocks.pending.length, 8);
}

test('all eight image files are served as JPEGs', async () => {
  for (let i = 1; i <= 8; i++) {
    const res = await fetch(`${origin}/webilang-art-lab/assets/rivera-${i}.jpg`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/jpeg');
    assert.deepEqual(Buffer.from(await res.arrayBuffer()), await fs.readFile(path.join(root, `webilang-art-lab/assets/rivera-${i}.jpg`)));
  }
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  for (const suffix of ['', '/', '/index.html']) {
    test(`eight panels and vocabulary: ${viewport.width}px /webilang-art-lab${suffix}`, async () => {
      const page = await lesson(viewport);
      try {
        const failedResources = [];
        page.on('response', res => { if (res.url().startsWith(origin) && res.status() >= 400) failedResources.push(res.url()); });
        await page.goto(`${origin}/webilang-art-lab${suffix}`);
        await checkPanels(page);
        assert.deepEqual(failedResources, [], 'Lesson scripts, styles, and images resolve in its directory');
      } finally { await page.close(); }
    });
  }
  for (const failure of ['404', 'invalid image']) {
    test(`eight embedded fallbacks and vocabulary: ${viewport.width}px, ${failure}`, async () => {
      const page = await lesson(viewport, failure);
      try {
        await page.goto(`${origin}/webilang-art-lab`);
        await checkPanels(page, true);
        // A later successful reload restores the original artwork without an error loop.
        await page.unroute('**/*');
        await page.evaluate(() => document.querySelectorAll('.comic-image').forEach(img => { img.src += '?retry=1'; }));
        await page.waitForFunction(() => [...document.querySelectorAll('.comic-image')].every(img => img.complete && img.naturalWidth > 0 && img.style.opacity === '1'));
      } finally { await page.close(); }
    });
  }
}
