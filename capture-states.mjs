import puppeteer from '/tmp/wc-capture/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { mkdir } from 'fs/promises';
import path from 'path';

const OUT = '/Users/yl/世界杯/screenshots';
const BASE = 'http://127.0.0.1:8123/worldcup-predictor.html';
const WIDTH = 390;

const shots = [
  { file: '01-未登录-默认赛事.png',             query: 'demo=1&login=0&slide=0' },
  { file: '02-已登录-待开奖未参与-阿根廷.png',   query: 'demo=1&login=1&slide=0' },
  { file: '03-待开奖已参与-卡塔尔.png',          query: 'demo=1&login=1&slide=1' },
  { file: '04-已锁盘未参与-德国.png',            query: 'demo=1&login=1&slide=2' },
  { file: '05-已锁盘已参与-英格兰.png',          query: 'demo=1&login=1&slide=3' },
  { file: '06-已开奖未参与平局-比利时.png',      query: 'demo=1&login=1&slide=4' },
  { file: '07-已开奖已参与猜错-巴西.png',        query: 'demo=1&login=1&slide=5' },
  { file: '08-已开奖已参与猜中-葡萄牙.png',      query: 'demo=1&login=1&slide=6' },
  { file: '09-参与成功弹窗.png',                 query: 'demo=1&login=1&slide=0&modal=join' },
  { file: '13-参与成功弹窗2.png',                query: 'demo=1&login=1&slide=0&modal=join2' },
  { file: '10-活动规则弹窗.png',                 query: 'demo=1&login=1&modal=rules' },
  { file: '11-竞猜记录弹窗.png',               query: 'demo=1&login=1&modal=records' },
  { file: '12-分享海报弹窗.png',               query: 'demo=1&login=1&modal=share&match=m1' },
];

async function getPageHeight(page) {
  return page.evaluate(() => {
    const app = document.getElementById('app');
    const hasModal = document.querySelector('.modal-mask.show');
    const appH = app ? Math.max(app.scrollHeight, app.offsetHeight) : 0;
    const docH = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      appH,
      844
    );
    return hasModal ? Math.max(docH, window.innerHeight) : docH;
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
  await page.goto(`${BASE}?${shot.query}`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  const height = Math.ceil(await getPageHeight(page));
  await page.setViewport({ width: WIDTH, height });
  await new Promise((r) => setTimeout(r, 250));

  const file = path.join(OUT, shot.file);
  await page.screenshot({ path: file, fullPage: false });
  console.log('saved', file, `${WIDTH}x${height}`);
}

await browser.close();
