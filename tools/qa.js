// QA harness: drive the real app through many configurations and assert
// invariants. Catches console errors, broken flows, invalid scores, etc.
const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const url = 'file://' + path.resolve('index.html');

const CONFIGS = [
  { cat:'science',          diff:'mixed',  mode:'solo', players:3, num:10 },
  { cat:'general_knowledge', diff:'easy',  mode:'solo', players:2, num:5  },
  { cat:'art',              diff:'normal', mode:'solo', players:4, num:10 },
  { cat:'geography',        diff:'hard',   mode:'solo', players:3, num:20 }, // pool=10 -> clamp
  { cat:'sports',           diff:'mixed',  mode:'pass', players:2, num:5  },
  { cat:'history',          diff:'normal', mode:'pass', players:4, num:10 },
  { cat:'mixed',            diff:'mixed',  mode:'solo', players:4, num:20 },
  { cat:'mixed',            diff:'hard',   mode:'pass', players:3, num:15 },
  { cat:'science',          diff:'hard',   mode:'pass', players:2, num:20 }, // pool=10 -> clamp
];

async function setStepper(page, step, valSel, target){
  for (let g=0; g<12; g++){
    const cur = parseInt(await page.textContent(valSel), 10);
    if (cur === target) break;
    await page.click(`.step[data-step="${step}"][data-dir="${cur < target ? 1 : -1}"]`);
    await page.waitForTimeout(40);
  }
}

async function runOne(browser, cfg){
  const page = await browser.newPage({ viewport:{width:1280,height:720} });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: '+e.message));
  page.on('console', m => { if (m.type()==='error') errors.push('CONSOLE: '+m.text()); });
  await page.goto(url, { waitUntil:'networkidle' });
  await page.waitForTimeout(200);

  await page.click('[data-act="play"]'); await page.waitForTimeout(200);
  await page.click(`.cat-tile[data-cat="${cfg.cat}"]`);
  await page.click(`.chip2[data-diff="${cfg.diff}"]`);
  await page.click(`.chip2[data-mode="${cfg.mode}"]`);
  await setStepper(page, 'players', '#playersVal', cfg.players);
  await setStepper(page, 'num', '#numVal', cfg.num);
  await page.click('[data-act="start"]'); await page.waitForTimeout(700);

  let guard = 0, questionsSeen = 0;
  while (guard++ < 80){
    if (await page.$('#screen-results.active')) break;
    if (await page.$('#screen-leaderboard.active')){
      await page.click('#screen-leaderboard [data-act="next-q"]');
      await page.waitForTimeout(120);
      continue;
    }
    const ans = await page.$('#answers .answer:not(.dim):not(.correct):not(.wrong)');
    if (ans){ questionsSeen++; await ans.click(); await page.waitForTimeout(1650); }
    else await page.waitForTimeout(120);
  }

  // assertions
  const fails = [];
  const onResults = await page.$('#screen-results.active');
  if (!onResults) fails.push('did not reach results');
  const ranks = await page.$$eval('#ranking .rank-row', els => els.map(e => ({
    name: e.querySelector('.rank-name')?.textContent,
    score: parseInt(e.querySelector('.rank-score')?.textContent, 10)
  })));
  if (ranks.length !== cfg.players) fails.push(`ranking rows ${ranks.length} != players ${cfg.players}`);
  let prev = Infinity;
  for (const r of ranks){
    if (!Number.isInteger(r.score) || r.score < 0) fails.push(`bad score ${r.score} for ${r.name}`);
    if (r.score > prev) fails.push('ranking not sorted desc');
    prev = r.score;
  }
  const maxScore = ranks.length ? ranks[0].score : 0;
  if (maxScore > cfg.num) fails.push(`max score ${maxScore} > num ${cfg.num}`);
  if (questionsSeen === 0) fails.push('no questions answered');
  if (errors.length) fails.push(...errors);

  await page.close();
  return { cfg, questionsSeen, ranks, fails };
}

(async () => {
  const browser = await chromium.launch();
  let allPass = true;
  for (const cfg of CONFIGS){
    const r = await runOne(browser, cfg);
    const tag = r.fails.length ? 'FAIL' : 'ok  ';
    if (r.fails.length) allPass = false;
    console.log(`[${tag}] ${cfg.cat}/${cfg.diff}/${cfg.mode}/p${cfg.players}/n${cfg.num}  qs=${r.questionsSeen}  scores=[${r.ranks.map(x=>x.score).join(',')}]`);
    r.fails.forEach(f => console.log('       - '+f));
  }
  await browser.close();
  console.log(allPass ? '\nALL CONFIGS PASS' : '\nSOME CONFIGS FAILED');
  process.exit(allPass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
