(function () {
  const STORAGE_KEY = 'wc_lucky_cup_v1';
  const GUESS_COST = 100;
  const GUESS_REWARD = 300;
  const LOTTERY_COST = 50;

  const defaultUser = () => ({
    loggedIn: true,
    nickname: '预言家',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lucky',
    availablePoints: 500,
    votes: {},
    history: [
      { date: formatToday(), text: '活动赠送积分', delta: 500, type: 'positive' },
    ],
  });

  let state = loadState();
  let matches = WC_DATA.ACTIVITY_MATCHES.map((m) => ({ ...m }));
  let gridSpinning = false;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...defaultUser(), ...JSON.parse(raw) };
    } catch (_) {}
    return defaultUser();
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function formatToday() {
    const d = new Date();
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }

  const $ = (sel) => document.querySelector(sel);

  function init() {
    bindEvents();
    initGridLottery();
    renderHero();
    renderActivityMatches();
    setupGuessScroll();
    updateGridUI();
    startCountdown();
  }

  function renderDots() {
    const dots = $('#guess-dots');
    if (!dots) return;
    dots.innerHTML = matches
      .map((_, i) => `<span class="dot${i === 0 ? ' active' : ''}"></span>`)
      .join('');
  }

  function setupGuessScroll() {
    const scroller = $('#guess-matches');
    const dots = $('#guess-dots');
    if (!scroller || !dots) return;
    scroller.addEventListener('scroll', () => {
      const card = scroller.querySelector('.match-card');
      if (!card) return;
      const step = card.offsetWidth + 12;
      const idx = Math.round(scroller.scrollLeft / step);
      dots.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === idx));
    }, { passive: true });
  }

  function startCountdown() {
    const el = $('#countdown-timer');
    if (!el) return;
    const target = Date.now() + (3 * 3600 + 28 * 60 + 40) * 1000;
    function tick() {
      const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      el.textContent = `${h} : ${m} : ${s}`;
    }
    tick();
    setInterval(tick, 1000);
  }

  function bindEvents() {
    $('#btn-rules').addEventListener('click', () => $('#rules-overlay').classList.remove('hidden'));
    $('#btn-rules-close').addEventListener('click', () => $('#rules-overlay').classList.add('hidden'));
    $('#btn-share').addEventListener('click', () => {
      alert('分享功能为原型占位，正式版将调起微信分享。');
    });
    $('#btn-points-detail').addEventListener('click', openHistory);
    $('#btn-history-close').addEventListener('click', () => $('#history-overlay').classList.add('hidden'));
    $('#btn-login').addEventListener('click', onLogin);
    $('#rules-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'rules-overlay') e.target.classList.add('hidden');
    });
    $('#history-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'history-overlay') e.target.classList.add('hidden');
    });
  }

  function onLogin() {
    if (!state.history.find((h) => h.text === '每日签到' && h.date === formatToday())) {
      state.history.unshift({ date: formatToday(), text: '每日签到', delta: 10, type: 'positive' });
      state.availablePoints += 10;
      saveState();
    }
    alert('登录成功！欢迎参与好运世界杯竞猜。');
    renderHero();
    updateGridUI();
  }

  function renderHero() {
    const guessed = Object.keys(state.votes).length;
    $('#hero-points').textContent = state.availablePoints;
    $('#hero-guessed').textContent = guessed;
    $('#grid-points').textContent = state.availablePoints;
  }

  function isLocked(m) {
    if (m.status === 'locked') return true;
    if (m.lockAt) return new Date() >= new Date(m.lockAt);
    return false;
  }

  function canVote(m) {
    if (m.result) return false;
    return !isLocked(m);
  }

  function getMatchStatus(m) {
    if (m.result) return { label: '已开奖', cls: 'settled' };
    if (isLocked(m)) return { label: '已锁盘', cls: 'locked' };
    return { label: '可竞猜', cls: 'open' };
  }

  function choiceLabel(m, key) {
    if (key === 'a') return `${m.teamA}胜`;
    if (key === 'b') return `${m.teamB}胜`;
    return '平局';
  }

  function renderActivityMatches() {
    const container = $('#guess-matches');
    container.innerHTML = matches.map((m) => {
      const vote = state.votes[m.id];
      const st = getMatchStatus(m);
      const settled = !!m.result;
      const voted = !!vote;
      const canPick = canVote(m) && !voted;
      const showPct = voted || settled;

      const odds = (pct) => (85 / Math.max(pct, 1)).toFixed(2);
      const options = [
        { key: 'a', name: m.teamA, cls: 'opt-win', pct: m.market.a },
        { key: 'draw', name: '平局', cls: 'opt-draw', pct: m.market.draw },
        { key: 'b', name: m.teamB, cls: 'opt-lose', pct: m.market.b },
      ];

      const optButtons = options.map((o) => {
        const isPicked = voted && vote.choice === o.key;
        const isCorrect = settled && m.result === o.key;
        const cls = ['option-btn', o.cls];
        if (isPicked) cls.push('picked');
        if (isCorrect) cls.push('correct');
        if (settled && !isCorrect) cls.push('dimmed');
        return `
          <div class="option-cell">
            <button type="button" class="${cls.join(' ')}" data-choice="${o.key}" ${canPick ? '' : 'disabled'}>
              <span class="opt-name">${o.name}</span>
              <span class="opt-odds">收益 ×${odds(o.pct)}倍</span>
            </button>
            <span class="option-pct">${o.pct}%用户选${isCorrect ? ' <em>正确</em>' : ''}</span>
          </div>`;
      }).join('');

      const centerHtml = settled
        ? `<div class="score">${m.scoreA} : ${m.scoreB}</div>`
        : '<div class="team vs-label">VS</div>';

      let footer = '';
      if (settled) {
        footer = voted
          ? (vote.choice === m.result
              ? `<p class="guess-footer correct-text">恭喜猜中，奖励 ${GUESS_REWARD} 积分</p>`
              : '<p class="guess-footer muted">很遗憾，本场未猜中</p>')
          : '<p class="guess-footer muted">您未参与竞猜</p>';
      } else if (voted) {
        footer = `<p class="guess-footer">已选：${choiceLabel(m, vote.choice)}</p>`;
      } else if (canPick) {
        footer = `<p class="guess-footer muted">消耗 ${GUESS_COST} 积分参与竞猜</p>`;
      } else {
        footer = '<p class="guess-footer muted">竞猜已截止</p>';
      }

      const changeBtn = voted && !settled && canVote(m)
        ? '<button type="button" class="btn-change" data-action="change">修改预测</button>'
        : '';

      return `
        <article class="match-card guess-card" data-id="${m.id}">
          <div class="card-status-badge ${st.cls}">${st.label}</div>
          <p class="match-info">${m.time} · ${m.label}</p>
          <div class="match-teams">
            <div class="team">
              <span class="team-flag">${WC_DATA.flag(m.teamA)}</span>
              <span class="team-name">${m.teamA}</span>
            </div>
            ${centerHtml}
            <div class="team">
              <span class="team-flag">${WC_DATA.flag(m.teamB)}</span>
              <span class="team-name">${m.teamB}</span>
            </div>
          </div>
          <div class="option-row" data-match="${m.id}">
            ${optButtons}
          </div>
          <div class="guess-footer-row">
            ${footer}
            ${changeBtn}
          </div>
        </article>`;
    }).join('');

    bindMatchCards(container);
    renderDots();
  }

  function bindMatchCards(container) {
    container.querySelectorAll('.option-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const id = btn.closest('.match-card').dataset.id;
        const m = matches.find((x) => x.id === id);
        if (!m || !canVote(m) || state.votes[m.id]) return;
        submitVote(m, btn.dataset.choice);
      });
    });
    container.querySelectorAll('[data-action="change"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.match-card').dataset.id;
        delete state.votes[id];
        saveState();
        renderActivityMatches();
        renderHero();
      });
    });
  }

  function submitVote(m, choice) {
    if (state.votes[m.id]) return;
    if (state.availablePoints < GUESS_COST) {
      alert(`积分不足，参与竞猜需要 ${GUESS_COST} 积分。`);
      return;
    }
    state.availablePoints -= GUESS_COST;
    state.votes[m.id] = { choice, at: Date.now() };
    state.history.unshift({
      date: formatToday(),
      text: `${m.teamA} vs ${m.teamB} 竞猜（${choiceLabel(m, choice)}）`,
      delta: -GUESS_COST,
      type: 'negative',
    });
    saveState();
    renderActivityMatches();
    renderHero();
    updateGridUI();
  }

  /* ——— 九宫格 ——— */
  function initGridLottery() {
    const grid = $('#grid-lottery');
    grid.innerHTML = WC_DATA.GRID_PRIZES.map((p, i) =>
      `<div class="grid-cell grid-cell-prize${i === 4 ? ' grid-cell-jackpot' : ''}" data-cell-pos="${i}" data-prize-idx="${i}">
        <span class="grid-prize-icon">${p.icon}</span>
        <span class="grid-prize-name">${p.name}</span>
      </div>`
    ).join('');
    $('#btn-grid-spin').addEventListener('click', spinGridLottery);
  }

  function updateGridUI() {
    const btn = $('#btn-grid-spin');
    if (btn) btn.disabled = gridSpinning || state.availablePoints < LOTTERY_COST;
    $('#grid-points').textContent = state.availablePoints;
  }

  function spinGridLottery() {
    if (gridSpinning) return;
    if (state.availablePoints < LOTTERY_COST) {
      alert(`积分不足，抽奖需要 ${LOTTERY_COST} 积分。`);
      return;
    }

    gridSpinning = true;
    updateGridUI();
    $('#grid-result').textContent = '';

    const prizeIdx = Math.floor(Math.random() * WC_DATA.GRID_PRIZES.length);
    const prize = WC_DATA.GRID_PRIZES[prizeIdx];
    const ring = WC_DATA.GRID_PATH;
    const isCenter = prizeIdx === 4;
    const stopRing = isCenter ? 0 : ring.indexOf(prizeIdx);
    const finalPos = isCenter ? 4 : prizeIdx;
    const totalSteps = 8 * 3 + (stopRing >= 0 ? stopRing : 0);
    let step = 0;
    let speed = 80;

    state.availablePoints -= LOTTERY_COST;
    state.history.unshift({
      date: formatToday(),
      text: '九宫格抽奖',
      delta: -LOTTERY_COST,
      type: 'negative',
    });
    saveState();
    renderHero();

    function clearActive() {
      document.querySelectorAll('.grid-cell-prize').forEach((c) => c.classList.remove('active'));
    }

    function highlight(ringIndex) {
      clearActive();
      const pos = ring[ringIndex % 8];
      document.querySelector(`.grid-cell-prize[data-cell-pos="${pos}"]`)?.classList.add('active');
    }

    function tick() {
      highlight(step % 8);
      step++;
      if (step > totalSteps) {
        clearActive();
        document.querySelector(`.grid-cell-prize[data-cell-pos="${finalPos}"]`)?.classList.add('active');

        let extra = '';
        if (prize.name === '积分+20') {
          state.availablePoints += 20;
          extra = '，积分 +20';
        }
        state.history.unshift({
          date: formatToday(),
          text: `九宫格中奖：${prize.name}`,
          delta: prize.name === '积分+20' ? 20 : 0,
          type: prize.name === '积分+20' ? 'positive' : 'neutral',
        });
        saveState();
        renderHero();
        gridSpinning = false;
        updateGridUI();
        $('#grid-result').textContent = `恭喜获得：${prize.icon} ${prize.name}${extra}`;
        return;
      }
      if (step > totalSteps - 8) speed += 25;
      setTimeout(tick, speed);
    }

    tick();
  }

  function openHistory() {
    const list = $('#history-list');
    if (!state.history.length) {
      list.innerHTML = '<li class="empty-tip">暂无积分流水</li>';
    } else {
      list.innerHTML = state.history
        .map(
          (h) => `
        <li>
          <div>
            <span class="history-date">${h.date}</span>
            ${h.text}
          </div>
          <span class="${h.type === 'negative' ? 'negative' : h.type === 'positive' ? 'positive' : 'neutral'}">
            ${h.delta > 0 ? '+' : ''}${h.delta === 0 ? '—' : h.delta}
          </span>
        </li>`
        )
        .join('');
    }
    $('#history-overlay').classList.remove('hidden');
  }

  function settleMatches() {
    let changed = false;
    matches.forEach((m) => {
      if (!m.result || !state.votes[m.id] || state.votes[m.id].settled) return;
      const v = state.votes[m.id];
      if (v.choice === m.result) {
        state.availablePoints += GUESS_REWARD;
        state.history.unshift({
          date: formatToday(),
          text: `${m.teamA} vs ${m.teamB} 猜中`,
          delta: GUESS_REWARD,
          type: 'positive',
        });
      }
      state.votes[m.id].settled = true;
      changed = true;
    });
    if (changed) {
      saveState();
      renderHero();
      updateGridUI();
    }
  }

  init();
  settleMatches();
})();
