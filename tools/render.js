// Dev-only QA tool: render SVG art assets (or full HTML pages) to PNG so the
// art can be visually reviewed. Not shipped with the game.
//
//   node tools/render.js svg <input.svg> <out.png> [w] [h] [bg]
//   node tools/render.js page <file-or-url> <out.png> [w] [h]
//   node tools/render.js sheet <out.png> <bg> <a.svg> <b.svg> ...   (contact sheet)
//
const path = require('path');
const fs = require('fs');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

function fileUrl(p) {
  return 'file://' + path.resolve(p);
}

async function main() {
  const [, , mode, ...rest] = process.argv;
  const browser = await chromium.launch();

  if (mode === 'svg') {
    const [input, out, w = 400, h = 400, bg = 'transparent'] = rest;
    const svg = fs.readFileSync(input, 'utf8');
    const page = await browser.newPage({
      viewport: { width: +w, height: +h },
      deviceScaleFactor: 2,
    });
    await page.setContent(
      `<!doctype html><html><body style="margin:0;background:${bg};display:flex;align-items:center;justify-content:center;height:${h}px;width:${w}px">${svg}</body></html>`
    );
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.screenshot({ path: out, omitBackground: bg === 'transparent' });
  } else if (mode === 'page') {
    const [input, out, w = 1456, h = 816] = rest;
    const url = input.startsWith('http') ? input : fileUrl(input);
    const page = await browser.newPage({
      viewport: { width: +w, height: +h },
      deviceScaleFactor: 2,
    });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    await page.screenshot({ path: out });
  } else if (mode === 'sheet') {
    const [out, bg = '#574A8C', ...svgs] = rest;
    const cells = svgs
      .map((s) => {
        const content = fs.readFileSync(s, 'utf8');
        const label = path.basename(s);
        return `<figure style="margin:0;display:flex;flex-direction:column;align-items:center;gap:6px;background:rgba(0,0,0,.12);border-radius:14px;padding:14px">
          <div style="width:150px;height:150px;display:flex;align-items:center;justify-content:center">${content}</div>
          <figcaption style="font:600 12px system-ui;color:#fff;opacity:.85">${label}</figcaption>
        </figure>`;
      })
      .join('');
    const cols = Math.min(svgs.length, 5);
    const page = await browser.newPage({
      viewport: { width: cols * 192 + 40, height: 2000 },
      deviceScaleFactor: 1.5,
    });
    await page.setContent(
      `<!doctype html><html><body style="margin:0;background:${bg};padding:20px"><div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:16px">${cells}</div></body></html>`
    );
    await page.waitForTimeout(200);
    const el = await page.$('body > div');
    await el.screenshot({ path: out });
  } else {
    console.error('unknown mode', mode);
  }

  await browser.close();
  console.log('rendered ->', rest[mode === 'sheet' ? 0 : 1]);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
