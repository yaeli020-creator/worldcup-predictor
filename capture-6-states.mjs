import puppeteer from '/tmp/wc-capture/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { mkdir } from 'fs/promises';
import path from 'path';

const OUT = '/Users/yl/世界杯/docs/screenshots';
const URL = 'http://127.0.0.1:8123/worldcup-predictor.html';

const shots = [
  {
    name: '01-待开奖-未参与-可竞猜',
    slide: 0,
    desc: '阿根廷 vs 沙特',
  },
  {
    name: '02-待开奖-已参与',
    slide: 1,
    desc: '卡塔尔 vs 厄瓜多尔',
  },
  {
    name: '03-已锁盘-未参与',
    slide: 2,
    desc: '德国 vs 日本',
  },
  {
    name: '04-已开奖-未参与-平局',
    slide: 3,
    desc: '比利时 vs 加拿大',
  },
  {
    name: '05-已开奖-已参与-未猜中',
    slide: 4,
    desc: '巴西 vs 塞尔维亚',
  },
  {
    name: '06-已开奖-已参与-猜中',
    slide: 5,
    desc: '葡萄牙 vs 加纳',
  },
];

await mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 });

for (const shot of shots) {
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate((slide) => {
    state.loggedIn = true;
    renderCoinBar();
    goToSlide(slide, false);
    closeJoinModal();
    closeRulesModal();
  }, shot.slide);
  await new Promise((r) => setTimeout(r, 400));

  const cardFile = path.join(OUT, `${shot.name}-卡片.png`);
  const cardEl = await page.$('.match-card:not(.peek)');
  if (cardEl) {
    await cardEl.screenshot({ path: cardFile });
  }

  const fullFile = path.join(OUT, `${shot.name}-全屏.png`);
  await page.screenshot({ path: fullFile, fullPage: false });
  console.log('saved', cardFile, fullFile);
}

await browser.close();
