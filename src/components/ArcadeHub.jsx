import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ACHIEVEMENTS, readUnlocked, SLOT2_THRESHOLD, isSlot2Unlocked } from '../achievements';
import './NullStorm.css';

// 아케이드 허브 — EXPL 버튼으로 열리는 게임 선택 화면
// 잠긴 슬롯이 보이는 것 자체가 티저다: 업적 5개를 모을 이유를 아케이드 안에서 만든다

const readHiscore = (key) => {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
};

const ArcadeHub = ({ onClose, onSelect }) => {
  const unlockedCount = ACHIEVEMENTS.filter((a) => readUnlocked()[a.id]).length;
  const slot2Open = isSlot2Unlocked();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect('nullstorm');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onSelect]);

  return (
    <motion.div
      className="arcade-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="arcade-cabinet"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
      >
        <div className="arcade-header">
          <span className="arcade-title text-glow-strong">▶ ARCADE</span>
          <span className="arcade-hiscore">SELECT GAME</span>
          <button className="arcade-close" onClick={onClose}>[X]</button>
        </div>

        <div className="hub-slots">
          <button type="button" className="hub-slot" onClick={() => onSelect('nullstorm')}>
            <span className="hub-slot-no">01</span>
            <span className="hub-slot-title">NULLSTORM</span>
            <span className="hub-slot-desc">null 탄막을 뿌려 런타임 에러를 격추하라</span>
            <span className="hub-slot-meta">HI-SCORE {String(readHiscore('nullstorm-hiscore')).padStart(6, '0')}</span>
            <span className="hub-slot-play">[ INSERT COIN ]</span>
          </button>

          {slot2Open ? (
            <button type="button" className="hub-slot" onClick={() => onSelect('nulldive')}>
              <span className="hub-slot-no">02</span>
              <span className="hub-slot-title">NULLDIVE</span>
              <span className="hub-slot-desc">레거시 코드의 심연으로 다이브하라</span>
              <span className="hub-slot-meta">MAX DEPTH {readHiscore('nulldive-hiscore')} LOC</span>
              <span className="hub-slot-play">[ INSERT COIN ]</span>
            </button>
          ) : (
            <div className="hub-slot locked">
              <span className="hub-slot-no">02</span>
              <span className="hub-slot-title">???</span>
              <span className="hub-slot-desc">잠긴 슬롯</span>
              <span className="hub-slot-meta lock-progress">
                업적 {unlockedCount}/{SLOT2_THRESHOLD} 달성 시 해금
              </span>
              <span className="hub-slot-play">[ LOCKED ]</span>
            </div>
          )}
        </div>

        <div className="arcade-footer">CLICK / ENTER 게임 시작 · ESC 닫기</div>
      </motion.div>
    </motion.div>
  );
};

export default ArcadeHub;
