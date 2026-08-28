import { useState, useEffect, useRef } from 'react';
import ResumeView from './ResumeView';
import { METRICS, WORKS, OSS, CAREERS, SKILL_GROUPS, MARQUEE } from '../data/neon';
import heroBg from '../assets/hf/hero-bg.webp';
import dividerImg from '../assets/hf/divider.webp';
import workspaceImg from '../assets/hf/workspace.webp';
import arcadeImg from '../assets/hf/arcade.webp';
import './NeonPortfolio.css';

// 리디자인 B — Neon Cinematic
// 기존 MainPortfolio(TUI 탭 구조)를 대체하는 원페이지 스크롤 메인.
// ResumeView(흰 배경 문서형)는 그대로 재사용한다.

const GLYPHS = '01<>/{}=+*#$%&アイウエオ';

const NeonBg = () => {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf; let W = 0; let H = 0; let t = 0; let parts = [];
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      parts = Array.from({ length: 70 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        v: 8 + Math.random() * 26, size: 9 + Math.random() * 5,
        ch: GLYPHS[(Math.random() * GLYPHS.length) | 0],
        cyan: Math.random() < 0.35, swap: Math.random() * 800,
      }));
    };
    const step = () => {
      raf = requestAnimationFrame(step);
      t += 1;
      ctx.clearRect(0, 0, W, H);
      const horizon = H * 0.62;
      ctx.strokeStyle = 'rgba(0,224,255,0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 24; i += 1) {
        const x = (i / 24) * W;
        ctx.beginPath();
        ctx.moveTo(W / 2 + (x - W / 2) * 0.12, horizon);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      const off = (t * 0.6) % 40;
      for (let y = horizon + off; y < H; y += 40 * (0.4 + (y - horizon) / (H - horizon))) {
        const a = 0.03 + ((y - horizon) / (H - horizon)) * 0.09;
        ctx.strokeStyle = `rgba(0,255,163,${a})`;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      for (const p of parts) {
        p.y -= p.v / 60;
        p.swap -= 16;
        if (p.swap <= 0) { p.swap = 800; p.ch = GLYPHS[(Math.random() * GLYPHS.length) | 0]; }
        if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; }
        ctx.font = `${p.size}px "JetBrains Mono", monospace`;
        ctx.fillStyle = p.cyan ? 'rgba(0,224,255,0.35)' : 'rgba(0,255,163,0.3)';
        ctx.fillText(p.ch, p.x, p.y);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} className="np-hero-canvas" aria-hidden="true" />;
};

const NeonPortfolio = () => {
  const [metricVals, setMetricVals] = useState(METRICS.map(() => 0));
  const [ghStats, setGhStats] = useState({});
  const [workMedia, setWorkMedia] = useState({});
  const [resumeOpen, setResumeOpen] = useState(() => {
    try { return new URLSearchParams(window.location.search).has('resume'); } catch { return false; }
  });

  // 숫자 카운트업
  useEffect(() => {
    const targets = METRICS.map((m) => m.num);
    const t0 = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min((t - t0) / 1100, 1);
      const ease = 1 - (1 - p) ** 3;
      setMetricVals(targets.map((n) => Math.round(n * ease)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // GitHub 실시간 ★/⑂
  useEffect(() => {
    OSS.forEach(({ repo }) => {
      fetch(`https://api.github.com/repos/${repo}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d) return;
          setGhStats((prev) => ({ ...prev, [repo]: { stars: d.stargazers_count, forks: d.forks_count } }));
        })
        .catch(() => {});
    });
  }, []);

  return (
    <div className="np-root">
      <div className="np-scanlines" aria-hidden="true" />

      <nav className="np-nav">
        <span className="np-logo">NOT<em>NULL</em></span>
        <div className="np-nav-links">
          <a href="#works">WORKS</a>
          <a href="#tools">DEV TOOLS</a>
          <a href="#record">RECORD</a>
          <a href="#contact">CONTACT</a>
        </div>
        <a href="mailto:fatiger92@gmail.com" className="np-hire">HIRE ME</a>
      </nav>

      <header className="np-hero">
        <img src={heroBg} alt="" aria-hidden="true" className="np-hero-bg" />
        <NeonBg />
        <div className="np-hero-shade" aria-hidden="true" />
        <div className="np-hero-inner">
          <div className="np-kicker">GAME CREATOR — UNITY CLIENT DEVELOPER · LIVE SERVICE × SOLO DEV × OPEN SOURCE</div>
          <h1 className="np-h1">
            I create games that <em className="g">inspire</em>, resonate deeply, and{' '}
            <em className="c">stay with people</em> long after the final screen fades.
          </h1>
          <p className="np-lede">
            월 매출 최대 400억 MMORPG의 라이브 콘텐츠·BM을 5년째 책임지는 Unity 클라이언트 개발자입니다.
            본업에 집중하면서, 퇴근 후에는 혼자 게임 2종을 만들고, 그 과정에서 필요했던 AI 개발툴을 오픈소스로 배포합니다.
          </p>
          <p className="np-why">
            <span className="np-why-label">WHY &quot;GAME CREATOR&quot;?</span>
            앞으로의 AI 에이전틱 시대에는 게임 개발자로 국한되는 것이 아니라 게임 전반의 모든 것을 창조할 수 있는
            게임 제작자가 필요하다고 생각합니다.
          </p>
          <div className="np-metrics">
            {METRICS.map((m, i) => (
              <div key={m.label} className="np-metric">
                <span className="np-metric-num">
                  {metricVals[i]}
                  <em>{m.suffix}</em>
                </span>
                <span className="np-metric-label">{m.label}</span>
                <span className="np-metric-sub">{m.sub}</span>
              </div>
            ))}
          </div>
          <div className="np-cta-row">
            <a href="#works" className="np-btn np-btn-solid">VIEW WORKS ▼</a>
            <button type="button" onClick={() => setResumeOpen(true)} className="np-btn np-btn-ghost">
              RESUME — 30초 요약
            </button>
          </div>
        </div>
        <div className="np-ticker" aria-hidden="true">
          <div className="np-ticker-track">
            <span>{MARQUEE}</span>
            <span>{MARQUEE}</span>
          </div>
        </div>
      </header>

      <section id="works" className="np-section">
        <div className="np-eyebrow"><span>SELECTED WORKS</span><i /></div>
        <h2 className="np-h2">Shipped <em>&amp; Building</em></h2>
        <div className="np-works">
          {WORKS.map((w, i) => {
            const selIdx = workMedia[i] || 0;
            const cover = w.media[selIdx] || w.media[0];
            return (
              <article key={w.name} className={`np-work${i % 2 === 1 ? ' np-work-rev' : ''}`}>
                <div className="np-work-media">
                  <div className="np-work-cover">
                    <img src={cover.src} alt={cover.alt} loading="lazy" />
                    <div className="np-work-cover-shade" aria-hidden="true" />
                    <span className="np-work-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  {w.media.length > 1 && (
                    <div className="np-work-thumbs">
                      {w.media.map((m, j) => (
                        <button
                          type="button"
                          key={m.src}
                          className={j === selIdx ? 'active' : ''}
                          onClick={() => setWorkMedia((prev) => ({ ...prev, [i]: j }))}
                        >
                          <img src={m.src} alt={m.alt} loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="np-work-body">
                  <div className="np-work-meta">
                    <span className={`np-badge np-badge-${w.badgeTone}`}>
                      {w.badgeTone === 'amber' ? '● ' : '■ '}
                      {w.badge}
                    </span>
                    <span className="np-work-period">{w.period}</span>
                  </div>
                  <h3>{w.name}</h3>
                  <p className="np-work-genre">{w.genre}</p>
                  <p className="np-work-pitch">{w.pitch}</p>
                  <ul>
                    {w.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                  {w.links.length > 0 && (
                    <div className="np-work-links">
                      {w.links.map((lk) => (
                        <a key={lk.url} href={lk.url} target="_blank" rel="noopener noreferrer">
                          {lk.label} ↗
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="np-divider" aria-hidden="true">
        <img src={dividerImg} alt="" />
      </div>

      <section id="tools" className="np-tools">
        <img src={workspaceImg} alt="" aria-hidden="true" className="np-tools-bg" />
        <div className="np-tools-inner">
          <div className="np-eyebrow"><span>OPEN SOURCE DEV TOOLS</span><i /></div>
          <h2 className="np-h2">게임을 만들다,<em> 도구까지 만들었다</em></h2>
          <p className="np-tools-lede">
            AI 에이전트로 게임을 개발하며 부딪힌 문제를 직접 풀어 배포한 4종 — OpenUPM · Godot Asset Store 공식 등록.
          </p>
          <a
            className="np-deepdive"
            href="https://velog.io/@not_null_92"
            target="_blank"
            rel="noopener noreferrer"
          >
            ✎ 기술 딥다이브 — 설계 과정과 측정 기록은 블로그에 (velog) ↗
          </a>
          <div className="np-tool-grid">
            {OSS.map((t) => {
              const g = ghStats[t.repo];
              return (
                <a key={t.name} href={t.url} target="_blank" rel="noopener noreferrer" className="np-tool">
                  <img src={t.logo} alt={`${t.name} 로고`} loading="lazy" />
                  <strong>{t.name}</strong>
                  <span className="np-tool-desc">{t.desc}</span>
                  <span className="np-tool-stats">
                    ★ {g ? g.stars : '–'} · ⑂ {g ? g.forks : '–'} · {t.license}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section id="record" className="np-record">
        <div>
          <div className="np-eyebrow"><span>FIELD RECORD</span><i /></div>
          <h2 className="np-h2">Career</h2>
          <div className="np-careers">
            {CAREERS.map((c) => (
              <article key={c.company}>
                <div className="np-career-head">
                  <h3>{c.company}</h3>
                  <span>{c.period}</span>
                </div>
                <p className="np-career-team">{c.team}</p>
                <ul>
                  {c.bullets.map((b) => (
                    <li key={b}>— {b}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
        <div>
          <div className="np-eyebrow"><span>LOADOUT</span><i /></div>
          <h2 className="np-h2">Stack</h2>
          <div className="np-stack">
            {SKILL_GROUPS.map((g) => (
              <div key={g.group} className="np-stack-card">
                <span>{g.group}</span>
                <p>{g.items}</p>
              </div>
            ))}
            <div className="np-status">
              <i aria-hidden="true" />
              STATUS: EMPLOYED · 블루포션게임즈 재직중
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="np-footer">
        <img src={arcadeImg} alt="" aria-hidden="true" className="np-footer-bg" />
        <div className="np-footer-inner">
          <div className="np-kicker">READY FOR TRANSMISSION</div>
          <h2>
            Let&apos;s ship the
            <br />
            <em>next title</em>
          </h2>
          <div className="np-footer-cta">
            <a href="mailto:fatiger92@gmail.com" className="np-btn np-btn-solid">EMAIL ME</a>
            <a href="https://github.com/NotNull92" target="_blank" rel="noopener noreferrer" className="np-btn np-btn-ghost">GITHUB</a>
            <a href="https://www.linkedin.com/in/youngjunji/" target="_blank" rel="noopener noreferrer" className="np-btn np-btn-ghost">LINKEDIN</a>
          </div>
          <p className="np-colophon">YOUNGJUN JI · NOTNULL — BUILT WITH REACT, SHIPPED WITH PRIDE</p>
        </div>
      </footer>

      {resumeOpen && <ResumeView onClose={() => setResumeOpen(false)} />}
    </div>
  );
};

export default NeonPortfolio;
