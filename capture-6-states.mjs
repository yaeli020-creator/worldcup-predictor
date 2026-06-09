import puppeteer from '/tmp/wc-capture/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { mkdir } from 'fs/promises';
import path from 'path';

const OUT = '/Users/yl/世界杯/docs/screenshots';
const URL = 'http://127.0.0.1:8123/worldcup-predictor.html';
const WIDTH = 390;

const shots = [
  { name: '01-待开奖-未参与-可竞猜', slide: 0, desc: '阿根廷 vs 沙特' },
  { name: '02-待开奖-已参与', slide: 1, desc: '卡塔尔 vs 厄瓜多尔' },
  { name: '03-已锁盘-未参与', slide: 2, desc: '德国 vs 日本' },
  { name: '04-已锁盘-已参与', slide: 3, desc: '英格兰 vs 伊朗' },
  { name: '05-已开奖-未参与-平局', slide: 4, desc: '比利时 vs 加拿大' },
  { name: '06-已开奖-已参与-未猜中', slide: 5, desc: '巴西 vs 塞尔维亚' },
  { name: '07-已开奖-已参与-猜中', slide: 6, desc: '葡萄牙 vs 加纳' },
];

async function getPageHeight(page) {
  return page.evaluate(() => {
    const app = document.getElementById('app');
    return Math.ceil(Math.max(
      app?.scrollHeight || 0,
      app?.offsetHeight || 0,
      document.documentElement.scrollHeight,
      844
    ));
  });
}

await mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();

for (const shot of shots) {
  await page.goto(`${URL}?demo=1&login=1`, { waitUntil: 'networkidle0' });
  await page.evaluate((slide) => {
    state.loggedIn = true;
    renderCoinBar();
    goToSlide(slide, false);
    closeJoinModal();
    closeRulesModal();
    closeRecordsModal();
  }, shot.slide);
  await new Promise((r) => setTimeout(r, 500));

  const height = await getPageHeight(page);
  await page.setViewport({ width: WIDTH, height });

  const cardFile = path.join(OUT, `${shot.name}-卡片.png`);
  const cardEl = await page.$('.match-card:not(.peek)');
  if (cardEl) await cardEl.screenshot({ path: cardFile });

  const fullFile = path.join(OUT, `${shot.name}-全屏.png`);
  await page.screenshot({ path: fullFile, fullPage: false });
  console.log('saved', cardFile, fullFile, `${WIDTH}x${height}`);
}

await browser.close();
