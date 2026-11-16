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
  await page.addInitScript(() => {
    if (!localStorage.getItem('mock-initialized')) { localStorage.setItem('mock-user','student-a'); localStorage.setItem('mock-cloud','[]'); localStorage.setItem('mock-initialized','1'); }
  });
  page.practiceRequests = [];
  // External APIs/fonts are unrelated to local comic rendering; never call paid services.
  await page.route('**/*', async route => {
    const url = route.request().url();
    if (url.startsWith('https://esm.sh/@supabase/supabase-js')) return route.fulfill({contentType:'text/javascript',body:`export {createClient} from '${origin}/tests/fixtures/stock-client.js'`});
    if (url === origin + '/api/artlab-word-practice') {
      const body=route.request().postDataJSON(); page.practiceRequests.push(body);
      if (body.mode==='check') return route.fulfill({json:{correct:body.answer.includes(body.target),feedback:'Your sentence uses the target in context.'}});
      return route.fulfill({json:{exercises:practiceFixture(body.target)}});
    }
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

function practiceFixture(target) {
  const meaning=target==='cover'?'To put something over an object':'A paid job to make art';
  const prompts=target==='cover'?['Please ___ the mural with a cloth.',`What does “${target}” mean here?`,'Complete: ___ the wall with paper.','Use this sheet to ___ the painting.',`Write a sentence using ${target}.`]:['The artist received a ___ to paint our wall.',`What does “${target}” mean here?`,'Complete: receive a ___.','The museum paid for a new painting. It gave the artist a ___.',`Write a sentence using ${target}.`];
  return ['gap','meaning','collocation','completion','production'].map((type,i)=>({type,target,prompt:prompts[i],answer:type==='meaning'?meaning:target,options:type==='meaning'?[meaning,'A colour','A building']:[],hint:'Think about this word in context.',explanation:'This expression fits the situation.'}));
}

async function checkPanels(page, broken = false) {
  await page.waitForFunction(() => document.getElementById('wordStockStatus').textContent.startsWith('Your account'));
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
    await page.waitForFunction(i=>document.querySelectorAll('.illustrated-scene .vocab-select')[i].classList.contains('picked'), i);
  }
  const stocks = await page.evaluate(() => JSON.parse(localStorage.getItem('mock-cloud')));
  assert.equal(stocks.length, 8);
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

for (const width of [1440, 390]) {
  test(`account Word Stock workflow, keyboard and clear: ${width}px`, async () => {
    const page = await lesson({width,height:900});
    try {
      await page.goto(origin+'/webilang-art-lab');
      await page.waitForFunction(()=>window.artWordStock);
      await page.waitForFunction(()=>document.getElementById('wordStockStatus').textContent.startsWith('Your account'));
      await page.evaluate(() => {
        const entries=[{id:'other-module',user_id:'student-a',kind:'memory_note',module:'AI C1',content:{type:'words',item:{word:'perspective'}}},
          {id:'other-user',user_id:'student-b',kind:'memory_note',module:'AI C1',content:{type:'words',item:{word:'private vocabulary'}}}];
        localStorage.setItem('mock-cloud',JSON.stringify(entries));
        localStorage.setItem('genderRolesAIStocks_v1',JSON.stringify({words:[{word:'legacy other module'}]}));
        return window.artWordStock.refresh();
      });
      const commission=page.locator('.vocab-select[data-expression="commission"]');
      await commission.focus(); await page.keyboard.press('Enter');
      await page.waitForFunction(()=>document.querySelector('[data-expression="commission"]').classList.contains('picked'));
      await commission.click();
      const cover=page.locator('#p0 .selectable-word').filter({hasText:/^cover$/}).first();
      await cover.focus(); await page.keyboard.press('Space');
      await page.waitForFunction(()=>document.querySelectorAll('#savedWords .word-stock-select').length===3);
      await page.evaluate(()=>go(8));
      const choose=word=>page.locator('.word-stock-select').filter({hasText:new RegExp('^'+word+'$')});
      assert.equal(await choose('perspective').count(),1);
      assert.equal(await choose('private vocabulary').count(),0);
      await choose('commission').focus(); await page.keyboard.press('Enter');
      assert.equal(await choose('commission').getAttribute('aria-pressed'),'true');
      await page.locator('#wordPracticeGenerate').click();
      await page.waitForFunction(()=>document.querySelectorAll('.word-exercise-card').length===5);
      assert.deepEqual(page.practiceRequests.at(-1),{mode:'generate',target:'commission'});
      if(process.env.ARTLAB_SCREENSHOTS)await page.screenshot({path:`/tmp/artlab-word-stock-${width}.png`,fullPage:true});
      await page.locator('#word-answer-0').fill('wrong');
      await page.locator('.word-exercise-card').first().getByRole('button',{name:'Check',exact:true}).click();
      assert.match(await page.locator('.word-exercise-feedback').first().textContent(),/Not yet/);
      await page.locator('#word-answer-0').fill('commission');await page.locator('#word-answer-0').press('Enter');
      assert.match(await page.locator('.word-exercise-feedback').first().textContent(),/Correct/);
      await page.locator('.word-exercise-card').first().getByRole('button',{name:'Hint',exact:true}).click();
      for(const index of [1,2,3]){
        if(index===1)await page.locator('#word-answer-'+index).selectOption('A paid job to make art');
        else await page.locator('#word-answer-'+index).fill('commission');
        const card=page.locator('.word-exercise-card').nth(index);
        await card.getByRole('button',{name:'Check',exact:true}).click();
        assert.match(await card.locator('.word-exercise-feedback').textContent(),/Correct/);
        await card.getByRole('button',{name:'Hint',exact:true}).click();
        assert.equal(await card.getByRole('button',{name:'Hint',exact:true}).getAttribute('aria-expanded'),'true');
      }
      await page.locator('#word-answer-4').fill('The artist received a commission.');
      await page.locator('.word-exercise-card').last().getByRole('button',{name:'Check',exact:true}).click();
      await page.waitForFunction(()=>document.querySelectorAll('.word-exercise-feedback')[4].textContent.includes('✓'));
      const saved=await page.evaluate(()=>localStorage.getItem('mock-cloud'));
      await page.locator('#wordPracticeClear').focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator('#wordExercise').textContent(),'');
      assert.equal(await page.locator('#wordExercise input,#wordExercise textarea,#wordExercise select').count(),0);
      assert.equal(await page.locator('#wordPracticeStatus').textContent(),'');
      assert.equal(await page.evaluate(()=>localStorage.getItem('mock-cloud')),saved);
      await choose('cover').click();await page.locator('#wordPracticeGenerate').click();
      await page.waitForFunction(()=>document.querySelectorAll('.word-exercise-card').length===5);
      assert.deepEqual(page.practiceRequests.at(-1),{mode:'generate',target:'cover'});
      await choose('commission').click();assert.equal(await page.locator('.word-exercise-card').count(),0);
      // Selection is idempotent and removal requires its separate confirmed action.
      await choose('commission').click();assert.equal(await choose('commission').count(),1);
      page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Remove commission',exact:true}).click();
      assert.equal(await choose('commission').count(),1);
      await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.word-stock-select').length===3);
      assert.equal(await page.locator('.word-exercise-card').count(),0);
      assert.equal(await choose('commission').count(),1);assert.equal(await choose('cover').count(),1);
      assert.equal(await choose('perspective').count(),1);
      assert.match(await page.evaluate(()=>localStorage.getItem('genderRolesAIStocks_v1')),/legacy other module/);
      // The existing account-backed AI module reads the same saved word records.
      await page.goto(origin+'/ai/');
      await page.waitForFunction(()=>document.getElementById('word-stock-library')?.textContent.includes('commission'));
      assert.match(await page.locator('#word-stock-library').textContent(),/cover/);
      assert.match(await page.locator('#word-stock-library').textContent(),/perspective/);
      assert.doesNotMatch(await page.locator('#word-stock-library').textContent(),/private vocabulary/);
      await page.goto(origin+'/webilang-art-lab');
      await page.waitForFunction(()=>document.querySelectorAll('.word-stock-select').length===3);
      await page.evaluate(()=>window.mockSwitchAccount('student-b'));
      await page.waitForFunction(()=>document.querySelector('.word-stock-select')?.textContent==='private vocabulary');
      assert.equal(await choose('commission').count(),0);assert.equal(await page.locator('.word-exercise-card').count(),0);
      await page.evaluate(()=>window.mockSwitchAccount(null));
      await page.waitForFunction(()=>document.querySelectorAll('.word-stock-select').length===0);
      assert.equal(await page.locator('#wordPracticeGenerate').isDisabled(),true);
    } finally { await page.close(); }
  });
}

test('clearing or changing word discards a delayed generation response', async()=>{
  const page=await lesson({width:1100,height:900});
  try {
    await page.goto(origin+'/webilang-art-lab');
    await page.waitForFunction(()=>document.getElementById('wordStockStatus').textContent.startsWith('Your account'));
    await page.evaluate(async()=>{await window.artWordStock.add('commission');await window.artWordStock.add('cover');go(8);});
    let release;const gate=new Promise(resolve=>release=resolve);let started;const pending=new Promise(resolve=>started=resolve);
    await page.route('**/api/artlab-word-practice',async route=>{started();await gate;try{await route.fulfill({json:{exercises:practiceFixture('commission')}})}catch{}});
    await page.locator('.word-stock-select').filter({hasText:/^commission$/}).click();await page.locator('#wordPracticeGenerate').click();
    await pending;await page.locator('#wordPracticeClear').click();await page.locator('.word-stock-select').filter({hasText:/^cover$/}).click();release();
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.word-exercise-card').count(),0);
    assert.equal(await page.locator('#wordPracticeStatus').textContent(),'');
    assert.equal(await page.locator('.word-stock-select').count(),2);
  }finally{await page.close()}
});

test('legacy import is explicit, repeated saves deduplicate, and confirmed deletion stays account-scoped',async()=>{
  const page=await lesson({width:1100,height:900});
  try{
    await page.goto(origin+'/webilang-art-lab');
    await page.waitForFunction(()=>document.getElementById('wordStockStatus').textContent.startsWith('Your account'));
    await page.evaluate(()=>{
      localStorage.setItem('webilang-art-lab-personal-stocks-v2',JSON.stringify({words:['Commission'],pending:['cover'],grammar:['should']}));
      localStorage.setItem('mock-cloud',JSON.stringify([{id:'b-cover',user_id:'student-b',kind:'memory_note',module:'AI C1',content:{type:'words',item:{word:'cover'}}}]));
      go(8);
    });
    assert.equal(await page.locator('.word-stock-select').count(),0);
    await page.locator('#p8 summary').click();
    page.once('dialog',dialog=>dialog.dismiss());await page.locator('#wordStockImport').click();
    assert.equal(await page.locator('.word-stock-select').count(),0);
    page.once('dialog',dialog=>dialog.accept());await page.locator('#wordStockImport').click();
    await page.waitForFunction(()=>document.querySelectorAll('.word-stock-select').length===2);
    await page.evaluate(()=>Promise.all([window.artWordStock.add(' commission '),window.artWordStock.add('COMMISSION')]));
    assert.equal(await page.locator('.word-stock-select').count(),2);
    page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Remove cover',exact:true}).click();
    await page.waitForFunction(()=>document.querySelectorAll('.word-stock-select').length===1);
    const cloud=await page.evaluate(()=>JSON.parse(localStorage.getItem('mock-cloud')));
    assert.equal(cloud.length,2);assert.ok(cloud.some(row=>row.id==='b-cover'));
    const legacy=await page.evaluate(()=>JSON.parse(localStorage.getItem('webilang-art-lab-personal-stocks-v2')));
    assert.deepEqual(legacy,{words:['Commission'],pending:['cover'],grammar:['should']});
  }finally{await page.close()}
});
