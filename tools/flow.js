// Drive the whole game and screenshot each screen for QA.
const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const url = 'file://' + path.resolve('index.html');
const out = 'build/preview/';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:720}, deviceScaleFactor:2 });
  const log = [];
  p.on('console', m => log.push(m.type()+': '+m.text()));
  p.on('pageerror', e => log.push('PAGEERROR: '+e.message));
  await p.goto(url, { waitUntil:'networkidle' });
  await p.waitForTimeout(600);
  await p.screenshot({ path: out+'flow_menu.png' });

  // settings
  await p.click('[data-act="settings"]'); await p.waitForTimeout(500);
  await p.screenshot({ path: out+'flow_settings.png' });
  await p.click('#screen-settings [data-act="back-menu"]'); await p.waitForTimeout(400);

  // pregame
  await p.click('[data-act="play"]'); await p.waitForTimeout(500);
  await p.screenshot({ path: out+'flow_pregame.png' });

  // pick a category (science) then start
  await p.click('.cat-tile[data-cat="science"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: out+'flow_pregame2.png' });
  await p.click('[data-act="start"]'); await p.waitForTimeout(900);
  await p.screenshot({ path: out+'flow_game1.png' });

  // answer first question, capture reveal
  await p.click('#answers .answer'); await p.waitForTimeout(700);
  await p.screenshot({ path: out+'flow_reveal.png' });
  await p.waitForTimeout(1200);

  // blast through the rest
  for (let i=0;i<12;i++){
    const ans = await p.$('#answers .answer');
    if (ans){ await ans.click(); await p.waitForTimeout(1900); }
    const results = await p.$('#screen-results.active');
    if (results) break;
  }
  await p.waitForTimeout(700);
  await p.screenshot({ path: out+'flow_results.png' });

  await b.close();
  console.log(log.join('\n') || 'no console output');
  console.log('flow done');
})().catch(e=>{ console.error(e); process.exit(1); });
