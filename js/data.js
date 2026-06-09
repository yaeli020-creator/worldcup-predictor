/** 好运世界杯活动 Mock 数据 */

const FLAGS = {
  卡塔尔: '🇶🇦',
  厄瓜多尔: '🇪🇨',
  英格兰: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  伊朗: '🇮🇷',
  巴西: '🇧🇷',
  阿根廷: '🇦🇷',
  法国: '🇫🇷',
  德国: '🇩🇪',
  西班牙: '🇪🇸',
  日本: '🇯🇵',
};

function flag(name) {
  return FLAGS[name] || '⚽';
}

function hoursFromNow(h) {
  const d = new Date();
  d.setHours(d.getHours() + h);
  return d.toISOString();
}

/** 固定 2 场竞猜 */
const ACTIVITY_MATCHES = [
  {
    id: 'm1',
    label: '第1场',
    teamA: '卡塔尔',
    teamB: '厄瓜多尔',
    time: '11-21 00:00',
    lockAt: hoursFromNow(48),
    status: 'open',
    market: { a: 77, draw: 7, b: 16 },
    result: null,
  },
  {
    id: 'm2',
    label: 'H组第1轮',
    teamA: '英格兰',
    teamB: '伊朗',
    time: '11-22 03:00',
    lockAt: hoursFromNow(-2),
    status: 'settled',
    market: { a: 81, draw: 5, b: 14 },
    result: 'a',
    scoreA: 3,
    scoreB: 2,
  },
];

/** 九宫格 9 格奖品（index 4 为中心大奖，其余为外圈） */
const GRID_PRIZES = [
  { name: '10元券', icon: '🎫' },
  { name: '谢谢参与', icon: '😊' },
  { name: '5元券', icon: '🎟️' },
  { name: '积分+20', icon: '⭐' },
  { name: '一等奖球衣', icon: '👕' },
  { name: '谢谢参与', icon: '😊' },
  { name: '再来一次', icon: '🔄' },
  { name: '20元券', icon: '💰' },
  { name: '现金红包', icon: '🧧' },
];

/** 跑马灯路径：外圈 8 格位置顺序（3x3 网格，跳过中心 index 4） */
const GRID_PATH = [0, 1, 2, 5, 8, 7, 6, 3];

window.WC_DATA = {
  flag,
  ACTIVITY_MATCHES,
  GRID_PRIZES,
  GRID_PATH,
};
