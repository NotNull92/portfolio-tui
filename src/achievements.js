// 업적 시스템 — localStorage 영속, CustomEvent('tui-achievement') 로 토스트 연동
// 발생지가 흩어져 있어(터미널/포트폴리오/게임) 이벤트 버스 방식을 쓴다.

export const ACHIEVEMENTS = [
  { id: 'full-scan', title: 'FULL SCAN', desc: '모든 탭을 탐사했다' },
  { id: 'curiosity', title: 'CURIOSITY LV.MAX', desc: '부팅 화면의 시크릿 커맨드를 발견했다', hidden: true },
  { id: 'insert-coin', title: 'INSERT COIN', desc: 'NULLSTORM 을 실행했다' },
  { id: 'first-patch', title: 'FIRST PATCH', desc: 'NULLSTORM 첫 판을 완주했다' },
  { id: 'boom', title: 'BOOM', desc: '폭탄을 사용했다' },
  { id: 'overclocked', title: 'OVERCLOCKED', desc: '콤보 x8 에 도달했다' },
  { id: 'segfault-handled', title: 'SEGFAULT HANDLED', desc: '보스 SEGFAULT 를 격파했다' },
  { id: 'score-5000', title: 'SCORE 5000', desc: '단판 5000점을 넘겼다' },
  { id: 'record-breaker', title: 'RECORD BREAKER', desc: '하이스코어를 3회 갱신했다' },
];

const KEY = 'tui-achievements';

export const readUnlocked = () => {
  try {
    const obj = JSON.parse(localStorage.getItem(KEY));
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
};

// 아케이드 2번 슬롯(NULLDIVE) 해금 기준 — 스킬 무관 업적만으로 도달 가능한 개수
export const SLOT2_THRESHOLD = 5;

export const isSlot2Unlocked = () =>
  ACHIEVEMENTS.filter((a) => readUnlocked()[a.id]).length >= SLOT2_THRESHOLD;

export const unlockAchievement = (id) => {
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  if (!def) return false;
  const cur = readUnlocked();
  if (cur[id]) return false;
  cur[id] = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(cur));
  } catch {
    /* localStorage 사용 불가 시 무시 */
  }
  window.dispatchEvent(new CustomEvent('tui-achievement', { detail: def }));
  // 5개째 달성 순간: 2번 슬롯 해금 토스트
  const count = ACHIEVEMENTS.filter((a) => cur[a.id]).length;
  if (count === SLOT2_THRESHOLD) {
    window.dispatchEvent(
      new CustomEvent('tui-achievement', {
        detail: { id: 'arcade-slot-2', title: 'NULLDIVE', label: 'NEW GAME UNLOCKED' },
      })
    );
  }
  return true;
};

// RECORD BREAKER — 하이스코어 갱신 횟수 누적
const RB_KEY = 'tui-record-breaks';

export const noteRecordBroken = () => {
  let n = 1;
  try {
    n = (Number(localStorage.getItem(RB_KEY)) || 0) + 1;
    localStorage.setItem(RB_KEY, String(n));
  } catch {
    /* localStorage 사용 불가 시 무시 */
  }
  if (n >= 3) unlockAchievement('record-breaker');
};
