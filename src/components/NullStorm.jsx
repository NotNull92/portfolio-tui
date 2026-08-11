import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import './NullStorm.css';

// NULLSTORM — 원버튼 탄막 슈터 (EXPL 6/6 해금 보상)
// 커서 기체가 null 탄막을 뿌려 BUG/NPE 를 격추한다.
// 렌더링: 캔버스에 모노스페이스 글리프 (CRT 미학 유지 + 60fps)
// 게임 상태: ref 로 보관, rAF 루프에서 직접 DOM 갱신 (리렌더 없음)

const W = 600;
const H = 460;
const SHIP_Y = H - 34;
const FIRE_INTERVAL = 110; // ms
const BULLET_SPEED = 360; // px/s
const HISCORE_KEY = 'nullstorm-hiscore';

const readHiscore = () => {
  try {
    return Number(localStorage.getItem(HISCORE_KEY)) || 0;
  } catch {
    return 0;
  }
};

const writeHiscore = (v) => {
  try {
    localStorage.setItem(HISCORE_KEY, String(v));
  } catch {
    /* localStorage 사용 불가 시 무시 */
  }
};

// 웨이브별 난이도 곡선
const waveSpec = (wave) => ({
  count: 8 + wave * 3,
  spawnInterval: Math.max(1000 - wave * 70, 300),
  speed: 26 + wave * 7,
  npeChance: wave >= 2 ? Math.min(0.15 + wave * 0.04, 0.45) : 0,
});

const freshGame = () => ({
  ship: { x: W / 2, dir: 1, speed: 95 },
  bullets: [],
  enemies: [],
  particles: [],
  score: 0,
  streak: 0,
  comboFlash: 0,
  lives: 3,
  wave: 1,
  spawned: 0,
  spawnTimer: 800,
  intermission: 1200, // 첫 WAVE 배너
  bombGauge: 0,
  bombFlash: 0,
  shake: 0,
  fireTimer: 0,
});

const multiplierOf = (streak) => Math.min(1 + Math.floor(streak / 5), 8);

const NullStorm = ({ onClose }) => {
  const [phase, setPhase] = useState('title'); // title | playing | gameover
  const [finalScore, setFinalScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [hiscore, setHiscore] = useState(readHiscore);

  const canvasRef = useRef(null);
  const gameRef = useRef(freshGame());
  const firingRef = useRef(false);
  const phaseRef = useRef('title');
  const scoreElRef = useRef(null);
  const waveElRef = useRef(null);
  const comboElRef = useRef(null);
  const livesElRef = useRef(null);
  const bombElRef = useRef(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const startGame = useCallback(() => {
    gameRef.current = freshGame();
    setPhase('playing');
  }, []);

  const triggerBomb = useCallback(() => {
    const g = gameRef.current;
    if (phaseRef.current !== 'playing' || g.bombGauge < 100 || g.enemies.length === 0) return;
    const mult = multiplierOf(g.streak);
    for (const e of g.enemies) {
      g.score += e.points * mult;
      g.streak += 1;
      for (let i = 0; i < 4; i++) {
        g.particles.push({
          x: e.x, y: e.y,
          vx: (Math.random() - 0.5) * 160,
          vy: (Math.random() - 0.5) * 160,
          life: 400,
          char: ['*', '+', '·', '×'][i % 4],
          color: '#ffffff',
        });
      }
    }
    g.enemies = [];
    g.bombGauge = 0;
    g.bombFlash = 250;
    g.shake = 300;
  }, []);

  const endGame = useCallback(() => {
    const g = gameRef.current;
    setFinalScore(g.score);
    const prev = readHiscore();
    if (g.score > prev) {
      writeHiscore(g.score);
      setHiscore(g.score);
      setIsNewRecord(true);
    } else {
      setIsNewRecord(false);
    }
    setPhase('gameover');
  }, []);

  // 키보드 입력
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (phaseRef.current === 'title' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        startGame();
        return;
      }
      if (phaseRef.current === 'gameover' && (e.key === 'r' || e.key === 'R' || e.key === ' ')) {
        e.preventDefault();
        startGame();
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        firingRef.current = true;
      }
      if (e.key === 'b' || e.key === 'B') triggerBomb();
    };
    const onKeyUp = (e) => {
      if (e.key === ' ') firingRef.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onClose, startGame, triggerBomb]);

  // 메인 루프 (playing 동안)
  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    let raf;
    let last = performance.now();

    const tick = (now) => {
      const dt = Math.min(now - last, 50); // 탭 백그라운드 복귀 시 점프 방지
      last = now;
      const g = gameRef.current;
      const dts = dt / 1000;

      // --- update ---
      // 기체 자동 왕복
      g.ship.x += g.ship.dir * g.ship.speed * dts;
      if (g.ship.x < 30) { g.ship.x = 30; g.ship.dir = 1; }
      if (g.ship.x > W - 30) { g.ship.x = W - 30; g.ship.dir = -1; }

      // 연사
      g.fireTimer -= dt;
      if (firingRef.current && g.fireTimer <= 0) {
        g.fireTimer = FIRE_INTERVAL;
        g.bullets.push({
          x: g.ship.x + (Math.random() - 0.5) * 10,
          y: SHIP_Y - 14,
          vx: (Math.random() - 0.5) * 46, // 뿌리는 손맛: 살짝 퍼지는 탄
        });
      }

      // 탄 이동
      g.bullets = g.bullets.filter((b) => {
        b.y -= BULLET_SPEED * dts;
        b.x += b.vx * dts;
        return b.y > -10;
      });

      // 웨이브 / 스폰
      const spec = waveSpec(g.wave);
      if (g.intermission > 0) {
        g.intermission -= dt;
      } else if (g.spawned < spec.count) {
        g.spawnTimer -= dt;
        if (g.spawnTimer <= 0) {
          g.spawnTimer = spec.spawnInterval * (0.7 + Math.random() * 0.6);
          const isNpe = Math.random() < spec.npeChance;
          g.enemies.push({
            x: 30 + Math.random() * (W - 60),
            y: -14,
            type: isNpe ? 'NPE' : 'BUG',
            hp: isNpe ? 2 : 1,
            points: isNpe ? 30 : 10,
            speed: spec.speed * (isNpe ? 0.8 : 1) * (0.85 + Math.random() * 0.3),
            wob: Math.random() * Math.PI * 2, // 좌우 흔들림 위상
          });
          g.spawned += 1;
        }
      } else if (g.enemies.length === 0) {
        // 웨이브 클리어
        g.wave += 1;
        g.spawned = 0;
        g.intermission = 1400;
        g.score += g.wave * 50; // 클리어 보너스
      }

      // 적 이동 + 바닥 판정
      g.enemies = g.enemies.filter((e) => {
        e.y += e.speed * dts;
        e.wob += dts * 2;
        e.x += Math.sin(e.wob) * 14 * dts;
        if (e.y > SHIP_Y - 4) {
          g.lives -= 1;
          g.streak = 0;
          g.shake = 250;
          return false;
        }
        return true;
      });

      // 충돌 판정
      for (const b of g.bullets) {
        for (const e of g.enemies) {
          const ew = e.type.length * 11;
          if (Math.abs(b.x - e.x) < ew / 2 + 4 && Math.abs(b.y - e.y) < 13) {
            b.hit = true;
            e.hp -= 1;
            if (e.hp <= 0) {
              e.dead = true;
              g.streak += 1;
              g.comboFlash = 300;
              g.score += e.points * multiplierOf(g.streak);
              g.bombGauge = Math.min(g.bombGauge + 6, 100);
              for (let i = 0; i < 3; i++) {
                g.particles.push({
                  x: e.x, y: e.y,
                  vx: (Math.random() - 0.5) * 140,
                  vy: (Math.random() - 0.5) * 140 - 30,
                  life: 350,
                  char: ['*', '+', '·'][i],
                  color: e.type === 'NPE' ? '#ffaa00' : '#ff5544',
                });
              }
            }
            break;
          }
        }
      }
      g.bullets = g.bullets.filter((b) => !b.hit);
      g.enemies = g.enemies.filter((e) => !e.dead);

      // 파티클
      g.particles = g.particles.filter((p) => {
        p.life -= dt;
        p.x += p.vx * dts;
        p.y += p.vy * dts;
        return p.life > 0;
      });

      g.comboFlash = Math.max(g.comboFlash - dt, 0);
      g.bombFlash = Math.max(g.bombFlash - dt, 0);
      g.shake = Math.max(g.shake - dt, 0);

      // --- draw ---
      ctx.save();
      if (g.shake > 0) {
        const s = g.shake / 60;
        ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
      }
      ctx.fillStyle = '#020f06';
      ctx.fillRect(-10, -10, W + 20, H + 20);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 탄
      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00ff41';
      for (const b of g.bullets) ctx.fillText('¦', b.x, b.y);

      // 적
      ctx.font = 'bold 15px "JetBrains Mono", monospace';
      for (const e of g.enemies) {
        if (e.type === 'NPE') {
          ctx.fillStyle = e.hp === 2 ? '#ffaa00' : '#ffdd88';
        } else {
          ctx.fillStyle = '#ff5544';
        }
        ctx.fillText(e.type, e.x, e.y);
      }

      // 기체
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38f8ff';
      ctx.fillText('/▲\\', g.ship.x, SHIP_Y);

      // 파티클
      ctx.font = '13px "JetBrains Mono", monospace';
      for (const p of g.particles) {
        ctx.globalAlpha = Math.max(p.life / 350, 0);
        ctx.fillStyle = p.color;
        ctx.fillText(p.char, p.x, p.y);
      }
      ctx.globalAlpha = 1;

      // 웨이브 배너
      if (g.intermission > 0) {
        ctx.font = 'bold 26px "JetBrains Mono", monospace';
        ctx.fillStyle = '#00ff41';
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(now / 90);
        ctx.fillText(`WAVE ${g.wave}`, W / 2, H / 2 - 20);
        ctx.globalAlpha = 1;
      }

      // 폭탄 섬광
      if (g.bombFlash > 0) {
        ctx.globalAlpha = g.bombFlash / 250 * 0.85;
        ctx.fillStyle = '#eaffea';
        ctx.fillRect(-10, -10, W + 20, H + 20);
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      // --- HUD (직접 DOM 갱신) ---
      if (scoreElRef.current) scoreElRef.current.textContent = String(g.score).padStart(6, '0');
      if (waveElRef.current) waveElRef.current.textContent = String(g.wave);
      if (comboElRef.current) {
        const m = multiplierOf(g.streak);
        comboElRef.current.textContent = `x${m}`;
        comboElRef.current.classList.toggle('combo-hot', m >= 4 && g.comboFlash > 0);
      }
      if (livesElRef.current) livesElRef.current.textContent = '♥'.repeat(Math.max(g.lives, 0)).padEnd(3, '·');
      if (bombElRef.current) {
        bombElRef.current.style.width = `${g.bombGauge}%`;
        bombElRef.current.classList.toggle('bomb-ready', g.bombGauge >= 100);
      }

      if (g.lives <= 0) {
        endGame();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, endGame]);

  // 포인터 입력 (마우스 + 터치)
  const onPointerDown = useCallback((e) => {
    if (e.button === 2) return; // 우클릭은 폭탄 (contextmenu 에서 처리)
    if (phaseRef.current === 'title' || phaseRef.current === 'gameover') {
      startGame();
      return;
    }
    firingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, [startGame]);

  const stopFiring = useCallback(() => {
    firingRef.current = false;
  }, []);

  const onContextMenu = useCallback((e) => {
    e.preventDefault();
    triggerBomb();
  }, [triggerBomb]);

  return (
    <motion.div
      className="arcade-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="arcade-cabinet"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="arcade-header">
          <span className="arcade-title text-glow-strong">▶ NULLSTORM</span>
          <span className="arcade-hiscore">HI-SCORE {String(hiscore).padStart(6, '0')}</span>
          <button className="arcade-close" onClick={onClose}>[X]</button>
        </div>

        <div
          className="arcade-screen"
          onPointerDown={onPointerDown}
          onPointerUp={stopFiring}
          onPointerLeave={stopFiring}
          onPointerCancel={stopFiring}
          onContextMenu={onContextMenu}
        >
          <canvas ref={canvasRef} className="arcade-canvas" />

          {phase === 'title' && (
            <div className="arcade-splash">
              <pre className="arcade-logo text-glow-strong">{`███ NULLSTORM ███`}</pre>
              <p className="arcade-tag">null 탄막을 뿌려 BUG 를 격추하라</p>
              <p className="arcade-blink">[ CLICK / SPACE TO START ]</p>
              <div className="arcade-howto">
                <span>홀드 — 연사</span>
                <span>B / 우클릭 — 폭탄 (게이지 풀차지 시)</span>
                <span>적이 바닥에 닿으면 ♥ 감소</span>
              </div>
            </div>
          )}

          {phase === 'gameover' && (
            <div className="arcade-splash">
              <pre className="arcade-logo gameover text-glow-strong">{`GAME OVER`}</pre>
              <p className="arcade-final">SCORE {String(finalScore).padStart(6, '0')}</p>
              {isNewRecord && <p className="arcade-record">★ NEW RECORD ★</p>}
              <p className="arcade-blink">[ CLICK / R TO RESTART ]</p>
            </div>
          )}

          {phase === 'playing' && (
            <button
              type="button"
              className="arcade-bomb-btn"
              onPointerDown={(e) => {
                e.stopPropagation();
                triggerBomb();
              }}
            >
              [B] BOMB
            </button>
          )}
        </div>

        <div className="arcade-hud">
          <span className="hud-item">SCORE <b ref={scoreElRef}>000000</b></span>
          <span className="hud-item">WAVE <b ref={waveElRef}>1</b></span>
          <span className="hud-item">COMBO <b ref={comboElRef}>x1</b></span>
          <span className="hud-item">LIVES <b ref={livesElRef}>♥♥♥</b></span>
          <span className="hud-item bomb-wrap">
            BOMB
            <span className="bomb-meter"><i ref={bombElRef} /></span>
          </span>
        </div>

        <div className="arcade-footer">HOLD: 연사 · B/우클릭: 폭탄 · ESC: 닫기</div>
      </motion.div>
    </motion.div>
  );
};

export default NullStorm;
