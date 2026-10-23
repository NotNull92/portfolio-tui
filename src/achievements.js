// 업적 시스템 — localStorage 영속, CustomEvent('tui-achievement') 로 토스트 연동

export const ACHIEVEMENTS = [
  { id: 'curiosity', title: 'CURIOSITY LV.MAX', desc: '부팅 화면의 시크릿 커맨드를 발견했다', hidden: true },
];

const KEY = 'tui-achievements';

const readUnlocked = () => {
  try {
    const obj = JSON.parse(localStorage.getItem(KEY));
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
};

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
  return true;
};
