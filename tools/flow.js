// Drive the whole game and screenshot each screen for QA.
const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const url = 'file://' + path.resolve('index.html');
const out = 'build/preview/';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:720}, deviceScaleFactor:2 });
  const log = [];
  p.on('pageerror', e => log.push('PAGEERROR: '+e.message));
  await p.goto(url, { waitUntil:'networkidle' });
  await p.waitForTimeout(500);
  await p.screenshot({ path: out+'flow_menu.png' });

  await p.click('[data-act="play"]'); await p.waitForTimeout(450);
  await p.click('.cat-tile[data-cat="science"]'); await p.waitForTimeout(150);
  await p.screenshot({ path: out+'flow_pregame.png' });
  await p.click('[data-act="start"]'); await p.waitForTimeout(900);
  await p.screenshot({ path: out+'flow_game1.png' });

  let boardShot = false;
  for (let i=0;i<24;i++){
    if (await p.$('#screen-results.active')) break;
    if (await p.$('#screen-leaderboard.active')){
      if(!boardShot){ await p.screenshot({ path: out+'flow_board.png' }); boardShot = true; }
      await p.click('#screen-leaderboard [data-act="next-q"]');
      await p.waitForTimeout(500);
      continue;
    }
    const ans = await p.$('#answers .answer:not(.dim):not(.correct):not(.wrong)');
    if (ans){ await ans.click(); await p.waitForTimeout(1700); }
    else await p.waitForTimeout(300);
  }
  await p.waitForTimeout(600);
  await p.screenshot({ path: out+'flow_results.png' });

  await b.close();
  console.log(log.join('\n') || 'no page errors');
  console.log('flow done');
})().catch(e=>{ console.error(e); process.exit(1); });
