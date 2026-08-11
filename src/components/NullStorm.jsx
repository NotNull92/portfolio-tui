import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import './NullStorm.css';

// NULLSTORM — 탄막 슈터 (EXPL 6/6 해금 보상)
// 커서 기체가 null 탄막을 뿌려 BUG/NPE 를 격추한다.
// 조작: A/D·←→ 이동(관성), 스페이스/클릭 홀드 연사, B/우클릭 폭탄
// 렌더링: 캔버스에 모노스페이스 글리프 (CRT 미학 유지 + 60fps)
// 게임 상태: ref 로 보관, rAF 루프에서 직접 DOM 갱신 (리렌더 없음)

const W = 600;
const H = 460;
const SHIP_Y = H - 34;
const FIRE_INTERVAL = 110; // ms
const BULLET_SPEED = 380; // px/s
const SHIP_MAX_SPEED = 280; // px/s
const SHIP_ACCEL = 1600; // px/s²
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

// --- WebAudio 신스 SFX (에셋 없이 즉석 합성) ---
let audioCtx = null;
let sfxMuted = false;

const beep = (freq, dur, { type = 'square', vol = 0.04, slide = 0, delay = 0 } = {}) => {
  if (sfxMuted) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(freq + slide, 30), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  } catch {
    /* 오디오 미지원 환경 무시 */
  }
};

const SFX = {
  fire: () => beep(760 + Math.random() * 120, 0.05, { vol: 0.012, slide: -350 }),
  hit: () => beep(180, 0.05, { type: 'sawtooth', vol: 0.035 }),
  kill: () => beep(240, 0.12, { type: 'sawtooth', vol: 0.05, slide: 380 }),
  escape: () => beep(140, 0.28, { vol: 0.06, slide: -70 }),
  bomb: () => {
    beep(90, 0.5, { type: 'sawtooth', vol: 0.09, slide: -55 });
    beep(1200, 0.3, { vol: 0.03, slide: -900 });
  },
  wave: () => {
    beep(660, 0.08, { vol: 0.04 });
    beep(880, 0.1, { vol: 0.04, delay: 0.09 });
  },
  gameover: () => {
    beep(440, 0.16, { vol: 0.05 });
    beep(330, 0.16, { vol: 0.05, delay: 0.16 });
    beep(220, 0.34, { vol: 0.05, delay: 0.32, slide: -60 });
  },
  record: () => {
    beep(660, 0.1, { vol: 0.05 });
    beep(880, 0.1, { vol: 0.05, delay: 0.1 });
    beep(1320, 0.22, { vol: 0.05, delay: 0.2 });
  },
};

// 웨이브별 난이도 곡선
const waveSpec = (wave) => ({
  count: 8 + wave * 3,
  spawnInterval: Math.max(1000 - wave * 70, 300),
  speed: 26 + wave * 7,
  npeChance: wave >= 2 ? Math.min(0.15 + wave * 0.04, 0.45) : 0,
});

const makeStars = () =>
  Array.from({ length: 36 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    speed: 14 + Math.random() * 30,
    char: Math.random() < 0.3 ? '·' : Math.random() < 0.5 ? '˙' : ':',
  }));

const freshGame = () => ({
  ship: { x: W / 2, vx: 0, recoil: 0 },
  bullets: [],
  enemies: [],
  particles: [],
  popups: [],
  stars: makeStars(),
  score: 0,
  streak: 0,
  comboFlash: 0,
  lastMult: 1,
  lives: 3,
  wave: 1,
  spawned: 0,
  spawnTimer: 800,
  intermission: 1200, // 첫 WAVE 배너
  bombGauge: 0,
  bombFlash: 0,
  bombWave: 0, // 충격파 반경 진행
  dmgFlash: 0,
  shake: 0,
  hitstop: 0,
  fireTimer: 0,
});

const multiplierOf = (streak) => Math.min(1 + Math.floor(streak / 5), 8);

const NullStorm = ({ onClose }) => {
  const [phase, setPhase] = useState('title'); // title | playing | gameover
  const [finalScore, setFinalScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [hiscore, setHiscore] = useState(readHiscore);
  const [muted, setMuted] = useState(false);

  const canvasRef = useRef(null);
  const gameRef = useRef(freshGame());
  const firingRef = useRef(false);
  const keysRef = useRef({ left: false, right: false });
  const pointerXRef = useRef(null); // 드래그 조준 (모바일/마우스)
  const phaseRef = useRef('title');
  const scoreElRef = useRef(null);
  const waveElRef = useRef(null);
  const comboElRef = useRef(null);
  const livesElRef = useRef(null);
  const bombElRef = useRef(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    sfxMuted = muted;
  }, [muted]);

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
      g.popups.push({ x: e.x, y: e.y, text: `+${e.points * mult}`, life: 700, color: '#ffd700' });
      for (let i = 0; i < 4; i++) {
        g.particles.push({
          x: e.x, y: e.y,
          vx: (Math.random() - 0.5) * 200,
          vy: (Math.random() - 0.5) * 200,
          life: 450,
          char: ['*', '+', '·', '×'][i % 4],
          color: '#ffffff',
        });
      }
    }
    g.enemies = [];
    g.bombGauge = 0;
    g.bombFlash = 250;
    g.bombWave = 1; // 충격파 시작
    g.shake = 350;
    g.hitstop = 150;
    SFX.bomb();
  }, []);

  const endGame = useCallback(() => {
    const g = gameRef.current;
    setFinalScore(g.score);
    const prev = readHiscore();
    if (g.score > prev) {
      writeHiscore(g.score);
      setHiscore(g.score);
      setIsNewRecord(true);
      SFX.record();
    } else {
      setIsNewRecord(false);
      SFX.gameover();
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
      const k = e.key.toLowerCase();
      if (k === 'a' || e.key === 'ArrowLeft') { keysRef.current.left = true; e.preventDefault(); return; }
      if (k === 'd' || e.key === 'ArrowRight') { keysRef.current.right = true; e.preventDefault(); return; }
      if (phaseRef.current === 'title' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        startGame();
        return;
      }
      if (phaseRef.current === 'gameover' && (k === 'r' || e.key === ' ')) {
        e.preventDefault();
        startGame();
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        firingRef.current = true;
      }
      if (k === 'b') triggerBomb();
    };
    const onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || e.key === 'ArrowLeft') keysRef.current.left = false;
      if (k === 'd' || e.key === 'ArrowRight') keysRef.current.right = false;
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
      const rawDt = Math.min(now - last, 50); // 탭 백그라운드 복귀 시 점프 방지
      last = now;
      const g = gameRef.current;

      // 히트스탑: 격추/폭탄 순간 시간을 잠깐 늦춰 타격감을 만든다
      let dt = rawDt;
      if (g.hitstop > 0) {
        g.hitstop -= rawDt;
        dt = rawDt * 0.12;
      }
      const dts = dt / 1000;

      // --- update ---
      // 기체 이동: 드래그 조준 > 키보드 관성
      const keys = keysRef.current;
      if (pointerXRef.current !== null) {
        const target = pointerXRef.current;
        g.ship.vx = Math.max(-SHIP_MAX_SPEED, Math.min(SHIP_MAX_SPEED, (target - g.ship.x) * 10));
      } else {
        const input = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
        if (input !== 0) {
          g.ship.vx += input * SHIP_ACCEL * dts;
          g.ship.vx = Math.max(-SHIP_MAX_SPEED, Math.min(SHIP_MAX_SPEED, g.ship.vx));
        } else {
          g.ship.vx *= Math.pow(0.0001, dts); // 감쇠 (프레임률 독립)
          if (Math.abs(g.ship.vx) < 4) g.ship.vx = 0;
        }
      }
      g.ship.x += g.ship.vx * dts;
      if (g.ship.x < 24) { g.ship.x = 24; g.ship.vx = 0; }
      if (g.ship.x > W - 24) { g.ship.x = W - 24; g.ship.vx = 0; }
      g.ship.recoil = Math.max(g.ship.recoil - dt, 0);

      // 연사 (+반동/머즐/사운드)
      g.fireTimer -= dt;
      if (firingRef.current && g.fireTimer <= 0) {
        g.fireTimer = FIRE_INTERVAL;
        g.bullets.push({
          x: g.ship.x + (Math.random() - 0.5) * 10,
          y: SHIP_Y - 14,
          vx: (Math.random() - 0.5) * 46 + g.ship.vx * 0.15, // 이동 관성이 탄에 실린다
        });
        g.ship.recoil = 80;
        SFX.fire();
      }

      // 탄 이동
      g.bullets = g.bullets.filter((b) => {
        b.y -= BULLET_SPEED * dts;
        b.x += b.vx * dts;
        return b.y > -10;
      });

      // 배경 낙하 글리프
      for (const s of g.stars) {
        s.y += s.speed * dts;
        if (s.y > H) { s.y = -8; s.x = Math.random() * W; }
      }

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
            flash: 0,
            knock: 0,
          });
          g.spawned += 1;
        }
      } else if (g.enemies.length === 0) {
        // 웨이브 클리어
        g.wave += 1;
        g.spawned = 0;
        g.intermission = 1400;
        g.score += g.wave * 50; // 클리어 보너스
        g.popups.push({ x: W / 2, y: H / 2 + 30, text: `WAVE BONUS +${g.wave * 50}`, life: 900, color: '#00ff41' });
        SFX.wave();
      }

      // 적 이동 + 바닥 판정
      g.enemies = g.enemies.filter((e) => {
        e.flash = Math.max(e.flash - dt, 0);
        if (e.knock > 0) {
          e.y -= 60 * dts; // 피격 넉백
          e.knock -= dt;
        }
        e.y += e.speed * dts;
        e.wob += dts * 2;
        e.x += Math.sin(e.wob) * 14 * dts;
        if (e.y > SHIP_Y - 4) {
          g.lives -= 1;
          g.streak = 0;
          g.shake = 300;
          g.dmgFlash = 260;
          SFX.escape();
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
            e.flash = 90;
            e.knock = 60;
            if (e.hp <= 0) {
              e.dead = true;
              g.streak += 1;
              g.comboFlash = 300;
              g.hitstop = Math.max(g.hitstop, e.type === 'NPE' ? 60 : 35);
              g.shake = Math.max(g.shake, 90);
              const mult = multiplierOf(g.streak);
              const gained = e.points * mult;
              g.score += gained;
              g.bombGauge = Math.min(g.bombGauge + 6, 100);
              g.popups.push({ x: e.x, y: e.y - 6, text: `+${gained}`, life: 600, color: e.type === 'NPE' ? '#ffaa00' : '#aaffcc' });
              if (mult > g.lastMult) {
                g.popups.push({ x: e.x, y: e.y - 26, text: `COMBO x${mult}!`, life: 850, color: '#ffd700' });
              }
              g.lastMult = mult;
              SFX.kill();
              for (let i = 0; i < 5; i++) {
                g.particles.push({
                  x: e.x, y: e.y,
                  vx: (Math.random() - 0.5) * 180,
                  vy: (Math.random() - 0.5) * 180 - 40,
                  life: 400,
                  char: ['*', '+', '·', '×', '¤'][i],
                  color: e.type === 'NPE' ? '#ffaa00' : '#ff5544',
                });
              }
            } else {
              SFX.hit();
            }
            break;
          }
        }
      }
      g.bullets = g.bullets.filter((b) => !b.hit);
      g.enemies = g.enemies.filter((e) => !e.dead);
      if (g.streak === 0) g.lastMult = 1;

      // 파티클 / 팝업
      g.particles = g.particles.filter((p) => {
        p.life -= dt;
        p.x += p.vx * dts;
        p.y += p.vy * dts;
        return p.life > 0;
      });
      g.popups = g.popups.filter((p) => {
        p.life -= dt;
        p.y -= 26 * dts;
        return p.life > 0;
      });

      g.comboFlash = Math.max(g.comboFlash - dt, 0);
      g.bombFlash = Math.max(g.bombFlash - dt, 0);
      g.dmgFlash = Math.max(g.dmgFlash - dt, 0);
      g.shake = Math.max(g.shake - dt, 0);
      if (g.bombWave > 0) {
        g.bombWave += rawDt * 1.6;
        if (g.bombWave > Math.max(W, H)) g.bombWave = 0;
      }

      // --- draw ---
      ctx.save();
      if (g.shake > 0) {
        const s = g.shake / 45;
        ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
      }
      ctx.fillStyle = '#020f06';
      ctx.fillRect(-12, -12, W + 24, H + 24);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 배경 글리프 (깊이감)
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(0, 255, 65, 0.13)';
      for (const s of g.stars) ctx.fillText(s.char, s.x, s.y);

      // 탄 (+트레일)
      ctx.font = '14px "JetBrains Mono", monospace';
      for (const b of g.bullets) {
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = '#00ff41';
        ctx.fillText('·', b.x, b.y + 22);
        ctx.globalAlpha = 0.45;
        ctx.fillText('¦', b.x, b.y + 11);
        ctx.globalAlpha = 1;
        ctx.fillText('¦', b.x, b.y);
      }

      // 적 (피격 시 흰색 플래시)
      ctx.font = 'bold 15px "JetBrains Mono", monospace';
      for (const e of g.enemies) {
        if (e.flash > 0) {
          ctx.fillStyle = '#ffffff';
        } else if (e.type === 'NPE') {
          ctx.fillStyle = e.hp === 2 ? '#ffaa00' : '#ffdd88';
        } else {
          ctx.fillStyle = '#ff5544';
        }
        ctx.fillText(e.type, e.x, e.y);
      }

      // 기체 (속도 기울임 + 발사 반동 + 머즐 플래시)
      ctx.save();
      const recoilY = g.ship.recoil > 0 ? (g.ship.recoil / 80) * 3 : 0;
      ctx.translate(g.ship.x, SHIP_Y + recoilY);
      ctx.rotate((g.ship.vx / SHIP_MAX_SPEED) * 0.16);
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38f8ff';
      ctx.fillText('/▲\\', 0, 0);
      if (g.ship.recoil > 55) {
        ctx.fillStyle = '#eaffea';
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        ctx.fillText('^', 0, -15);
      }
      // 이동 시 추진 글리프
      if (Math.abs(g.ship.vx) > 40) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#00ff41';
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillText(g.ship.vx > 0 ? '«' : '»', g.ship.vx > 0 ? -20 : 20, 4);
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      // 파티클
      ctx.font = '13px "JetBrains Mono", monospace';
      for (const p of g.particles) {
        ctx.globalAlpha = Math.max(p.life / 400, 0);
        ctx.fillStyle = p.color;
        ctx.fillText(p.char, p.x, p.y);
      }
      ctx.globalAlpha = 1;

      // 점수/콤보 팝업
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      for (const p of g.popups) {
        ctx.globalAlpha = Math.min(p.life / 300, 1);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
      }
      ctx.globalAlpha = 1;

      // 폭탄 충격파
      if (g.bombWave > 0) {
        ctx.strokeStyle = `rgba(255, 215, 0, ${Math.max(1 - g.bombWave / Math.max(W, H), 0)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(g.ship.x, SHIP_Y, g.bombWave, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 웨이브 배너 (스케일 팝)
      if (g.intermission > 0) {
        const t = 1 - g.intermission / 1400;
        const pop = t < 0.25 ? 0.6 + (t / 0.25) * 0.55 : 1.15 - Math.min((t - 0.25) * 0.35, 0.15);
        ctx.save();
        ctx.translate(W / 2, H / 2 - 20);
        ctx.scale(pop, pop);
        ctx.font = 'bold 26px "JetBrains Mono", monospace';
        ctx.fillStyle = '#00ff41';
        ctx.globalAlpha = 0.55 + 0.45 * Math.sin(now / 90);
        ctx.fillText(`WAVE ${g.wave}`, 0, 0);
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // 폭탄 섬광 / 피해 비네트
      if (g.bombFlash > 0) {
        ctx.globalAlpha = (g.bombFlash / 250) * 0.85;
        ctx.fillStyle = '#eaffea';
        ctx.fillRect(-12, -12, W + 24, H + 24);
        ctx.globalAlpha = 1;
      }
      if (g.dmgFlash > 0) {
        const a = (g.dmgFlash / 260) * 0.4;
        const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
        grad.addColorStop(0, 'rgba(255,40,40,0)');
        grad.addColorStop(1, `rgba(255,40,40,${a})`);
        ctx.fillStyle = grad;
        ctx.fillRect(-12, -12, W + 24, H + 24);
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

  // 포인터 입력 (마우스 + 터치): 누르면 연사, 누른 채 좌우 드래그 = 이동
  const pointerToGameX = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return ((e.clientX - rect.left) / rect.width) * W;
  };

  const onPointerDown = useCallback((e) => {
    if (e.button === 2) return; // 우클릭은 폭탄 (contextmenu 에서 처리)
    if (phaseRef.current === 'title' || phaseRef.current === 'gameover') {
      startGame();
      return;
    }
    firingRef.current = true;
    pointerXRef.current = pointerToGameX(e);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, [startGame]);

  const onPointerMove = useCallback((e) => {
    if (pointerXRef.current !== null) {
      pointerXRef.current = pointerToGameX(e);
    }
  }, []);

  const stopFiring = useCallback(() => {
    firingRef.current = false;
    pointerXRef.current = null;
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
          <button
            className="arcade-close"
            onClick={() => setMuted((m) => !m)}
            title={muted ? '사운드 켜기' : '사운드 끄기'}
          >
            {muted ? '[♪✕]' : '[♪]'}
          </button>
          <button className="arcade-close" onClick={onClose}>[X]</button>
        </div>

        <div
          className="arcade-screen"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
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
                <span>A/D · ←→ — 이동 (터치: 누른 채 드래그)</span>
                <span>스페이스/클릭 홀드 — 연사</span>
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

        <div className="arcade-footer">A/D 이동 · HOLD 연사 · B 폭탄 · ESC 닫기</div>
      </motion.div>
    </motion.div>
  );
};

export default NullStorm;
