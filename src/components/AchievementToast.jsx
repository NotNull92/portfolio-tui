import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AchievementToast.css';

// 업적 해금 토스트 — 전역 컴포넌트 (터미널/포트폴리오/게임 어디서든 뜬다)
// 동시 해금은 큐잉해서 한 장씩 3초간 표시

let chimeCtx = null;

const chime = () => {
  try {
    chimeCtx = chimeCtx || new (window.AudioContext || window.webkitAudioContext)();
    [660, 880, 1320].forEach((freq, i) => {
      const osc = chimeCtx.createOscillator();
      const gain = chimeCtx.createGain();
      const t = chimeCtx.currentTime + i * 0.09;
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      osc.connect(gain);
      gain.connect(chimeCtx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  } catch {
    /* 오디오 미지원 환경 무시 */
  }
};

const AchievementToast = () => {
  const [queue, setQueue] = useState([]);
  const current = queue[0] ?? null;

  useEffect(() => {
    const onUnlock = (e) => setQueue((q) => [...q, e.detail]);
    window.addEventListener('tui-achievement', onUnlock);
    return () => window.removeEventListener('tui-achievement', onUnlock);
  }, []);

  useEffect(() => {
    if (!current) return;
    chime();
    const t = setTimeout(() => setQueue((q) => q.slice(1)), 3200);
    return () => clearTimeout(t);
  }, [current]);

  return (
    <div className="ach-toast-host" aria-live="polite">
      <AnimatePresence>
        {current && (
          <motion.div
            key={current.id}
            className="ach-toast"
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          >
            <span className="ach-star">★</span>
            <span className="ach-body">
              <span className="ach-label">ACHIEVEMENT UNLOCKED</span>
              <span className="ach-title">{current.title}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AchievementToast;
