import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { unlockAchievement } from '../achievements';
import './NullStorm.css';

// NULLDIVE — 원버튼 터널 다이빙 (아케이드 2번 슬롯, 업적 5개 해금)
// 커서(>)가 되어 레거시 코드베이스의 심연으로 잠수한다.
// 조작: 홀드 = 부스터 상승, 릴리즈 = 하강. 벽/[DEPRECATED] 충돌 즉사.
// 점수: 깊이 DEPTH n LOC + null 토큰 수집 보너스

const W = 600;
const H = 460;
const PLAYER_X = 140;
const SEG = 20; // 터널 세그먼트 폭(px)
const PX_PER_LOC = 4; // 4px 진행 = 1 LOC
const GRAVITY = 820; // px/s²
const THRUST = 1700; // 홀드 시 상향 가속
const MAX_VY = 330;
const HISCORE_KEY = 'nulldive-hiscore'; // MAX DEPTH (LOC)

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

// --- WebAudio 신스 SFX ---
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

// 엔진 험 — 속도에 피치가 붙는 연속 저음 (플레이 중에만)
let hum = null;

const startHum = () => {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 46;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    hum = { osc, gain };
  } catch {
    /* 오디오 미지원 환경 무시 */
  }
};

const setHum = (speed, active) => {
  if (!hum) return;
  try {
    hum.osc.frequency.setTargetAtTime(40 + speed * 0.09, audioCtx.currentTime, 0.1);
    hum.gain.gain.setTargetAtTime(sfxMuted || !active ? 0 : 0.016, audioCtx.currentTime, 0.08);
  } catch {
    /* 무시 */
  }
};

const stopHum = () => {
  if (!hum) return;
  try {
    hum.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
    const h = hum;
    setTimeout(() => { try { h.osc.stop(); } catch { /* 무시 */ } }, 300);
  } catch {
    /* 무시 */
  }
  hum = null;
};

const SFX = {
  thrust: () => beep(140 + Math.random() * 40, 0.06, { type: 'sawtooth', vol: 0.012, slide: 60 }),
  graze: () => beep(2200 + Math.random() * 600, 0.04, { vol: 0.014, slide: -1200 }),
  token: () => {
    beep(880, 0.07, { vol: 0.04 });
    beep(1320, 0.09, { vol: 0.04, delay: 0.06 });
  },
  crash: () => {
    beep(220, 0.3, { type: 'sawtooth', vol: 0.09, slide: -160 });
    beep(80, 0.5, { type: 'square', vol: 0.07, delay: 0.05, slide: -40 });
  },
  milestone: () => beep(660, 0.1, { vol: 0.035, slide: 220 }),
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

// 깊이(LOC) 비례 난이도
const diffAt = (loc) => ({
  speed: Math.min(170 + loc * 0.055, 430),
  gap: Math.max(250 - loc * 0.045, 112),
  obstacleChance: loc > 200 ? Math.min(0.05 + loc * 0.00002, 0.16) : 0,
  tokenChance: 0.06,
});

const WALL_CHARS = '▓▒░#;{}<>=+*';

const makeSeg = (x, mid, gap) => {
  // 벽 내부 코드 글리프는 세그먼트 생성 시 고정 (프레임마다 랜덤이면 지글거린다)
  const chars = [];
  for (let y = 8; y < H; y += 22) {
    if (Math.random() < 0.5) {
      chars.push({ y, c: WALL_CHARS[Math.floor(Math.random() * WALL_CHARS.length)], a: 0.25 + Math.random() * 0.3 });
    }
  }
  return { x, top: mid - gap / 2, bottom: mid + gap / 2, chars };
};

const freshGame = () => {
  const g = {
    y: H / 2,
    vy: 0,
    worldX: 0,
    segs: [],
    genX: 0,
    mid: H / 2,
    obstacles: [],
    tokens: [],
    particles: [],
    popups: [],
    lines: Array.from({ length: 9 }, () => ({ x: Math.random() * W, y: Math.random() * H, len: 20 + Math.random() * 40 })),
    // 원경 패럴랙스 — 느리게 흐르는 흐릿한 코드 글리프
    far: Array.from({ length: 22 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      c: WALL_CHARS[Math.floor(Math.random() * WALL_CHARS.length)],
      a: 0.05 + Math.random() * 0.08,
    })),
    trail: [], // 커서 고스트 잔상
    grazeSfx: 0,
    wallFlash: 0,
    deathFlash: 0,
    tokensGot: 0,
    bonus: 0,
    waiting: true, // 첫 입력 전까지 물리 정지 — 시작하자마자 추락사하지 않게
    grace: 900, // 첫 입력 직후 충돌 유예
    thrustSfx: 0,
    ceilMs: 0, // CEILING RUNNER 히든 업적
    nextMilestone: 500,
    hit3k: false,
    shake: 0,
    slowmo: 0,
    dead: false,
  };
  // 초기 지형 채우기
  while (g.genX < W + 200) genAhead(g);
  return g;
};

function genAhead(g) {
  const loc = g.genX / PX_PER_LOC;
  const d = diffAt(loc);
  // 통과 가능성 보장: 세그먼트당 중심 이동을 갭 대비 제한
  const maxStep = Math.min(18, d.gap * 0.14);
  g.mid += (Math.random() - 0.5) * 2 * maxStep;
  g.mid = Math.max(d.gap / 2 + 16, Math.min(H - d.gap / 2 - 16, g.mid));
  const seg = makeSeg(g.genX, g.mid, d.gap);
  g.segs.push(seg);

  // 장애물: 갭이 충분할 때만, 위/아래 벽에 붙여 배치 (최소 통과폭 84px 보장)
  if (Math.random() < d.obstacleChance && d.gap > 150) {
    const h = 20;
    const onTop = Math.random() < 0.5;
    g.obstacles.push({
      x: g.genX + 40,
      y: onTop ? seg.top + h / 2 + 6 : seg.bottom - h / 2 - 6,
      w: 104,
      h,
    });
  }

  // null 토큰: 위험한 위치(벽 근처)에 배치해야 리스크/리워드가 된다
  if (Math.random() < d.tokenChance) {
    const nearTop = Math.random() < 0.5;
    g.tokens.push({
      x: g.genX + 10,
      y: nearTop ? seg.top + 18 : seg.bottom - 18,
    });
  }

  g.genX += SEG;
}

const NullDive = ({ onClose }) => {
  const [phase, setPhase] = useState('title'); // title | playing | gameover
  const [finalDepth, setFinalDepth] = useState(0);
  const [finalTokens, setFinalTokens] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [hiscore, setHiscore] = useState(readHiscore);
  const [muted, setMuted] = useState(false);

  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const thrustRef = useRef(false);
  const phaseRef = useRef('title');
  const depthElRef = useRef(null);
  const tokenElRef = useRef(null);
  const speedElRef = useRef(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    sfxMuted = muted;
  }, [muted]);

  // 업적: NULLDIVE 첫 실행
  useEffect(() => {
    unlockAchievement('dive-in');
  }, []);

  const startGame = useCallback(() => {
    gameRef.current = freshGame();
    setPhase('playing');
  }, []);

  const endGame = useCallback(() => {
    const g = gameRef.current;
    const depth = Math.floor(g.worldX / PX_PER_LOC);
    const total = depth + g.bonus;
    setFinalDepth(total);
    setFinalTokens(g.tokensGot);
    unlockAchievement('first-crash');
    if (g.tokensGot >= 10) unlockAchievement('null-collector');
    const prev = readHiscore();
    if (total > prev) {
      writeHiscore(total);
      setHiscore(total);
      setIsNewRecord(true);
      SFX.record();
    } else {
      setIsNewRecord(false);
      SFX.gameover();
    }
    setPhase('gameover');
  }, []);

  // 키보드
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (phaseRef.current === 'title') { startGame(); return; }
        if (phaseRef.current === 'gameover') { startGame(); return; }
        thrustRef.current = true;
        return;
      }
      if (phaseRef.current === 'gameover' && (e.key === 'r' || e.key === 'R')) {
        startGame();
      }
    };
    const onKeyUp = (e) => {
      if (e.key === ' ' || e.key === 'Enter') thrustRef.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onClose, startGame]);

  // 메인 루프
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
    startHum();

    const tick = (now) => {
      const rawDt = Math.min(now - last, 50);
      last = now;
      const g = gameRef.current;

      // 사망 슬로모 후 게임오버 전환
      if (g.dead) {
        g.slowmo -= rawDt;
        if (g.slowmo <= 0) {
          endGame();
          return;
        }
      }
      const dt = g.dead ? rawDt * 0.15 : rawDt;
      const dts = dt / 1000;

      const loc = g.worldX / PX_PER_LOC;
      const d = diffAt(loc);

      // 대기 상태: 제자리 호버, 첫 부스터 입력과 함께 다이브 시작
      if (g.waiting) {
        if (thrustRef.current) {
          g.waiting = false;
          g.vy = -120; // 첫 입력에 살짝 떠오르며 시작
        } else {
          g.y = H / 2 + Math.sin(now / 300) * 5;
          g.vy = 0;
        }
      }

      if (!g.dead && !g.waiting) {
        // 물리: 홀드 상승 / 릴리즈 하강
        if (thrustRef.current) {
          g.vy -= THRUST * dts;
          g.thrustSfx -= dt;
          if (g.thrustSfx <= 0) {
            g.thrustSfx = 95;
            SFX.thrust();
          }
          // 부스터 분사 파티클
          g.particles.push({
            x: PLAYER_X - 10,
            y: g.y + 6 + (Math.random() - 0.5) * 6,
            vx: -120 - Math.random() * 60,
            vy: 40 + Math.random() * 50,
            life: 300,
            char: ['·', '˙', ':'][Math.floor(Math.random() * 3)],
            color: '#38f8ff',
          });
        }
        g.vy += GRAVITY * dts;
        g.vy = Math.max(-MAX_VY, Math.min(MAX_VY, g.vy));
        g.y += g.vy * dts;

        // 진행
        g.worldX += d.speed * dts;
        while (g.genX < g.worldX + W + 100) genAhead(g);
        // 지나간 지형 정리
        while (g.segs.length && g.segs[0].x < g.worldX - SEG * 3) g.segs.shift();
        g.obstacles = g.obstacles.filter((o) => o.x > g.worldX - 200);
        g.tokens = g.tokens.filter((t) => t.x > g.worldX - 100);

        g.grace = Math.max(g.grace - dt, 0);

        // 충돌: 현재 위치의 세그먼트
        const idx = Math.floor((g.worldX + PLAYER_X) / SEG) - Math.floor(g.segs[0]?.x / SEG || 0);
        const seg = g.segs[idx];
        const die = () => {
          if (g.grace > 0 || g.dead) return;
          g.dead = true;
          g.slowmo = 650;
          g.shake = 400;
          g.deathFlash = 130; // 충돌 순간 화이트 임팩트
          SFX.crash();
          for (let i = 0; i < 18; i++) {
            g.particles.push({
              x: PLAYER_X, y: g.y,
              vx: (Math.random() - 0.5) * 320,
              vy: (Math.random() - 0.5) * 320,
              life: 650,
              char: ['>', '*', '×', '+', '░'][i % 5],
              color: i % 3 === 0 ? '#ff5544' : '#38f8ff',
            });
          }
        };

        if (seg) {
          if (g.y - 7 < seg.top || g.y + 7 > seg.bottom) die();
          // 히든 업적: 천장 스침 5초 연속
          if (g.y - seg.top < 16) {
            g.ceilMs += dt;
            if (g.ceilMs >= 5000) unlockAchievement('ceiling-runner');
            // 니어미스 스파크 (천장/바닥 공통)
          } else {
            g.ceilMs = 0;
          }
          if (g.y - seg.top < 13 || seg.bottom - g.y < 13) {
            if (Math.random() < 0.5) {
              g.particles.push({
                x: PLAYER_X + 4,
                y: g.y - seg.top < 13 ? seg.top + 2 : seg.bottom - 2,
                vx: -80,
                vy: g.y - seg.top < 13 ? 30 : -30,
                life: 200,
                char: '·',
                color: '#ffd700',
              });
            }
            // 그레이즈 사운드 (스로틀)
            g.grazeSfx -= dt;
            if (g.grazeSfx <= 0) {
              g.grazeSfx = 130;
              SFX.graze();
            }
          } else {
            g.grazeSfx = 0;
          }
        }
        // 화면 밖(터널 밖 상하단)도 사망
        if (g.y < 4 || g.y > H - 4) die();

        // 장애물 충돌
        for (const o of g.obstacles) {
          const sx = o.x - g.worldX;
          if (Math.abs(sx - PLAYER_X) < o.w / 2 + 6 && Math.abs(g.y - o.y) < o.h / 2 + 6) {
            die();
            break;
          }
        }

        // 토큰 수집
        g.tokens = g.tokens.filter((t) => {
          const sx = t.x - g.worldX;
          if (Math.abs(sx - PLAYER_X) < 16 && Math.abs(g.y - t.y) < 16) {
            g.tokensGot += 1;
            g.bonus += 50;
            g.popups.push({ x: sx, y: t.y - 10, text: '+50 null', life: 600, maxLife: 600, color: '#a855f7', size: 13 });
            SFX.token();
            for (let i = 0; i < 3; i++) {
              g.particles.push({
                x: sx, y: t.y,
                vx: (Math.random() - 0.5) * 120,
                vy: (Math.random() - 0.5) * 120,
                life: 300,
                char: '¤',
                color: '#a855f7',
              });
            }
            return false;
          }
          return true;
        });

        // 깊이 마일스톤 — 벽 플래시 + 속도 상승 표시
        if (loc >= g.nextMilestone) {
          g.popups.push({ x: W / 2, y: 60, text: `DEPTH ${g.nextMilestone} LOC`, life: 900, maxLife: 900, color: '#00ff41', size: 16 });
          g.popups.push({ x: W / 2, y: 84, text: 'VELOCITY +', life: 700, maxLife: 700, color: '#38f8ff', size: 11 });
          g.wallFlash = 450;
          g.nextMilestone += 500;
          SFX.milestone();
        }

        // 커서 고스트 잔상
        g.trail.push({ wx: g.worldX + PLAYER_X, y: g.y, rot: Math.max(-0.5, Math.min(0.5, g.vy / 600)), life: 240 });
        // 업적: 3000 LOC
        if (!g.hit3k && loc + g.bonus >= 3000) {
          g.hit3k = true;
          unlockAchievement('depth-3000');
        }
      }

      // 파티클/팝업/배경
      g.particles = g.particles.filter((p) => {
        p.life -= rawDt;
        p.x += p.vx * dts;
        p.y += p.vy * dts;
        return p.life > 0;
      });
      g.popups = g.popups.filter((p) => {
        p.life -= rawDt;
        p.y -= 22 * dts;
        return p.life > 0;
      });
      for (const l of g.lines) {
        l.x -= d.speed * 1.6 * dts;
        if (l.x + l.len < 0) {
          l.x = W + Math.random() * 80;
          l.y = Math.random() * H;
          l.len = 20 + Math.random() * 40;
        }
      }
      for (const f of g.far) {
        f.x -= d.speed * 0.35 * dts;
        if (f.x < -10) {
          f.x = W + Math.random() * 40;
          f.y = Math.random() * H;
        }
      }
      g.trail = g.trail.filter((t) => {
        t.life -= rawDt;
        return t.life > 0;
      });
      g.shake = Math.max(g.shake - rawDt, 0);
      g.wallFlash = Math.max(g.wallFlash - rawDt, 0);
      g.deathFlash = Math.max(g.deathFlash - rawDt, 0);

      // 엔진 험: 속도 비례 피치, 대기/사망 시 음소거
      setHum(d.speed, !g.waiting && !g.dead);

      // --- draw ---
      ctx.save();
      if (g.shake > 0) {
        const s = g.shake / 50;
        ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
      }
      ctx.fillStyle = '#020f06';
      ctx.fillRect(-12, -12, W + 24, H + 24);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 원경 패럴랙스 (벽보다 먼저 — 벽 뒤에 깔린다)
      ctx.font = '10px "JetBrains Mono", monospace';
      for (const f of g.far) {
        ctx.globalAlpha = f.a;
        ctx.fillStyle = '#00ff41';
        ctx.fillText(f.c, f.x, f.y);
      }
      ctx.globalAlpha = 1;

      // 속도감 라인
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.10)';
      ctx.lineWidth = 1;
      for (const l of g.lines) {
        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.x + l.len, l.y);
        ctx.stroke();
      }

      // 터널 벽
      for (const seg of g.segs) {
        const sx = seg.x - g.worldX;
        if (sx < -SEG || sx > W) continue;
        ctx.fillStyle = 'rgba(0, 80, 30, 0.55)';
        ctx.fillRect(sx, -12, SEG + 1, seg.top + 12);
        ctx.fillRect(sx, seg.bottom, SEG + 1, H - seg.bottom + 12);
        // 벽 경계 하이라이트 (마일스톤 순간 골드 플래시)
        if (g.wallFlash > 0) {
          ctx.fillStyle = `rgba(255, 215, 0, ${0.4 + (g.wallFlash / 450) * 0.6})`;
          ctx.fillRect(sx, seg.top - 3, SEG + 1, 3);
          ctx.fillRect(sx, seg.bottom, SEG + 1, 3);
        } else {
          ctx.fillStyle = '#00ff41';
          ctx.fillRect(sx, seg.top - 2, SEG + 1, 2);
          ctx.fillRect(sx, seg.bottom, SEG + 1, 2);
        }
        // 벽 내부 코드 글리프
        ctx.font = '11px "JetBrains Mono", monospace';
        for (const c of seg.chars) {
          if (c.y < seg.top - 6 || c.y > seg.bottom + 6) {
            ctx.globalAlpha = c.a * 0.5;
            ctx.fillStyle = '#00ff41';
            ctx.fillText(c.c, sx + SEG / 2, c.y);
          }
        }
        ctx.globalAlpha = 1;
      }

      // 장애물 [DEPRECATED]
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      for (const o of g.obstacles) {
        const sx = o.x - g.worldX;
        if (sx < -80 || sx > W + 80) continue;
        ctx.fillStyle = 'rgba(255, 85, 68, 0.15)';
        ctx.fillRect(sx - o.w / 2, o.y - o.h / 2, o.w, o.h);
        ctx.strokeStyle = '#ff5544';
        ctx.strokeRect(sx - o.w / 2, o.y - o.h / 2, o.w, o.h);
        ctx.fillStyle = '#ff5544';
        ctx.fillText('[DEPRECATED]', sx, o.y);
      }

      // null 토큰 — 바운스 + 트윙클
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      for (const t of g.tokens) {
        const sx = t.x - g.worldX;
        if (sx < -20 || sx > W + 20) continue;
        const bob = Math.sin(now / 260 + t.x * 0.05) * 3;
        ctx.fillStyle = '#a855f7';
        ctx.fillText('null', sx, t.y + bob);
        if (Math.random() < 0.04) {
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = '#e9d5ff';
          ctx.fillText('+', sx + (Math.random() - 0.5) * 22, t.y + bob + (Math.random() - 0.5) * 16);
          ctx.globalAlpha = 1;
        }
      }

      // 커서 고스트 잔상
      for (const t of g.trail) {
        const sx = t.wx - g.worldX;
        if (sx < -20) continue;
        ctx.save();
        ctx.translate(sx, t.y);
        ctx.rotate(t.rot);
        ctx.globalAlpha = (t.life / 240) * 0.3;
        ctx.font = 'bold 20px "JetBrains Mono", monospace';
        ctx.fillStyle = '#38f8ff';
        ctx.fillText('>', 0, 0);
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // 플레이어 커서 (속도 기울임 + 스쿼시&스트레치 + 부스터 화염)
      if (!g.dead) {
        ctx.save();
        ctx.translate(PLAYER_X, g.y);
        ctx.rotate(Math.max(-0.5, Math.min(0.5, g.vy / 600)));
        const stretch = Math.min(Math.abs(g.vy) / 900, 0.3);
        ctx.scale(1 + stretch, 1 - stretch * 0.5);
        if (thrustRef.current && !g.waiting) {
          ctx.font = 'bold 14px "JetBrains Mono", monospace';
          ctx.fillStyle = '#ffaa00';
          ctx.globalAlpha = 0.7 + Math.random() * 0.3;
          ctx.fillText('≋', -16, 4);
          ctx.globalAlpha = 1;
        }
        ctx.font = 'bold 20px "JetBrains Mono", monospace';
        ctx.fillStyle = '#38f8ff';
        ctx.fillText('>', 0, 0);
        ctx.restore();
      }

      // 대기 안내
      if (g.waiting) {
        ctx.font = 'bold 15px "JetBrains Mono", monospace';
        ctx.fillStyle = '#00ff41';
        ctx.globalAlpha = 0.55 + 0.45 * Math.sin(now / 220);
        ctx.fillText('[ HOLD TO BOOST ]', PLAYER_X + 90, g.y - 34);
        ctx.globalAlpha = 1;
      }

      // 파티클
      ctx.font = '12px "JetBrains Mono", monospace';
      for (const p of g.particles) {
        ctx.globalAlpha = Math.max(p.life / 400, 0);
        ctx.fillStyle = p.color;
        ctx.fillText(p.char, p.x, p.y);
      }
      ctx.globalAlpha = 1;

      // 팝업
      for (const p of g.popups) {
        const age = p.maxLife - p.life;
        const pop = age < 90 ? 0.4 + (age / 90) * 0.85 : Math.max(1.25 - (age - 90) * 0.002, 1);
        ctx.font = `bold ${Math.round(p.size * pop)}px "JetBrains Mono", monospace`;
        ctx.globalAlpha = Math.min(p.life / 300, 1);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
      }
      ctx.globalAlpha = 1;

      // 충돌 순간 화이트 임팩트 플래시
      if (g.deathFlash > 0) {
        ctx.globalAlpha = (g.deathFlash / 130) * 0.75;
        ctx.fillStyle = '#eaffea';
        ctx.fillRect(-12, -12, W + 24, H + 24);
        ctx.globalAlpha = 1;
      }

      // 사망 붉은 비네트
      if (g.dead) {
        const a = (g.slowmo / 650) * 0.35;
        const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
        grad.addColorStop(0, 'rgba(255,40,40,0)');
        grad.addColorStop(1, `rgba(255,40,40,${a})`);
        ctx.fillStyle = grad;
        ctx.fillRect(-12, -12, W + 24, H + 24);
      }
      ctx.restore();

      // --- HUD ---
      const depthNow = Math.floor(loc) + g.bonus;
      if (depthElRef.current) depthElRef.current.textContent = `${depthNow} LOC`;
      if (tokenElRef.current) tokenElRef.current.textContent = `${g.tokensGot}`;
      if (speedElRef.current) speedElRef.current.textContent = `${Math.round(d.speed)}px/s`;

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      stopHum();
    };
  }, [phase, endGame]);

  // 포인터: 홀드 = 부스터
  const onPointerDown = useCallback((e) => {
    if (phaseRef.current === 'title' || phaseRef.current === 'gameover') {
      startGame();
      return;
    }
    thrustRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, [startGame]);

  const stopThrust = useCallback(() => {
    thrustRef.current = false;
  }, []);

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
          <span className="arcade-title text-glow-strong">▶ NULLDIVE</span>
          <span className="arcade-hiscore">MAX DEPTH {hiscore} LOC</span>
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
          onPointerUp={stopThrust}
          onPointerLeave={stopThrust}
          onPointerCancel={stopThrust}
          onContextMenu={(e) => e.preventDefault()}
        >
          <canvas ref={canvasRef} className="arcade-canvas" />

          {phase === 'title' && (
            <div className="arcade-splash">
              <pre className="arcade-logo text-glow-strong">{`▼▼▼ NULLDIVE ▼▼▼`}</pre>
              <p className="arcade-tag">레거시 코드의 심연으로 다이브하라</p>
              <p className="arcade-blink">[ CLICK / SPACE TO DIVE ]</p>
              <div className="arcade-howto">
                <span>홀드 — 부스터 상승 · 릴리즈 — 하강</span>
                <span>벽·[DEPRECATED] 충돌 즉사 — 한 번의 실수로 끝난다</span>
                <span>null 토큰 수집 = 보너스 +50 LOC</span>
              </div>
            </div>
          )}

          {phase === 'gameover' && (
            <div className="arcade-splash">
              <pre className="arcade-logo gameover text-glow-strong">{`STACK TRACE END`}</pre>
              <p className="arcade-final">DEPTH {finalDepth} LOC</p>
              <p className="arcade-tag">null × {finalTokens}</p>
              {isNewRecord && <p className="arcade-record">★ MAX DEPTH RECORD ★</p>}
              <p className="arcade-blink">[ CLICK / R TO RE-DIVE ]</p>
            </div>
          )}
        </div>

        <div className="arcade-hud">
          <span className="hud-item">DEPTH <b ref={depthElRef}>0 LOC</b></span>
          <span className="hud-item">null <b ref={tokenElRef}>0</b></span>
          <span className="hud-item">VELOCITY <b ref={speedElRef}>170px/s</b></span>
        </div>

        <div className="arcade-footer">HOLD 상승 · RELEASE 하강 · ESC 닫기</div>
      </motion.div>
    </motion.div>
  );
};

export default NullDive;
