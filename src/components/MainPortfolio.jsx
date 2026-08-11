import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Target, Clock, Briefcase, Mail, BookOpen } from 'lucide-react';
import NoteBook from './NoteBook';
import NullStorm from './NullStorm';
import NullDive from './NullDive';
import ArcadeHub from './ArcadeHub';
import { ACHIEVEMENTS, readUnlocked, unlockAchievement } from '../achievements';
import { NOTES, NOTE_TYPES } from '../data/notes';
import ScrambleText from './effects/ScrambleText';
import AsciiRain from './effects/AsciiRain';
import vaultBoyImg from '../assets/notnull-logo.png';
import ringverseTitleImg from '../assets/projects/ringverse-title.webp';
import nmrTitleImg from '../assets/projects/nomorerolls-title.webp';
import nmrBattleImg from '../assets/projects/nomorerolls-battle.webp';
import nmrCorridorImg from '../assets/projects/nomorerolls-corridor.webp';
import nmrTalkImg from '../assets/projects/nomorerolls-talk.webp';
import heraUnityLogo from '../assets/projects/hera-unity-logo.webp';
import heraGodotLogo from '../assets/projects/hera-godot-logo.webp';
import hebeLogo from '../assets/projects/hebe-logo.webp';
import workforgeLogo from '../assets/projects/workforge-logo.webp';
import mrTitleImg from '../assets/projects/mentalrobo-title.webp';
import mrTopicImg from '../assets/projects/mentalrobo-topic.webp';
import mrRhythmImg from '../assets/projects/mentalrobo-rhythm.webp';
import eosRedKeyart from '../assets/projects/eosred-keyart.webp';
import fdDrawImg from '../assets/projects/freedraw-drawing.webp';
import fdGalleryImg from '../assets/projects/freedraw-gallery.webp';
import zkVillageImg from '../assets/projects/zombie-village.webp';
import zkGameplayImg from '../assets/projects/zombie-gameplay.webp';
import zkShopImg from '../assets/projects/zombie-shop.webp';
import zkCharImg from '../assets/projects/zombie-characters.webp';
import agTitleImg from '../assets/projects/actiongolf-title.webp';
import agLobbyImg from '../assets/projects/actiongolf-lobby.webp';
import agShopImg from '../assets/projects/actiongolf-shop.webp';
import agSensorImg from '../assets/projects/actiongolf-sensor.webp';
import './MainPortfolio.css';

// 섹션 헤더 (스크램블 리빌)
const SectionHeader = ({ title, style }) => (
  <div className="section-header" style={style}>
    <span className="text-glow">
      <ScrambleText text={`> ${title}`} duration={600} rescrambleOnHover />
    </span>
  </div>
);

// 프로젝트 카드 스포트라이트 (마우스 위치를 CSS 변수로 전달)
// - rAF 스로틀: mousemove는 프레임보다 자주 발생할 수 있다
// - 좌표는 WeakMap에 보관 (dataset 어트리뷰트 churn 방지)
const spotlightState = new WeakMap();

const handleCardMouseMove = (e) => {
  const el = e.currentTarget;
  let s = spotlightState.get(el);
  if (!s) {
    s = { raf: 0 };
    spotlightState.set(el, s);
  }
  s.x = e.clientX;
  s.y = e.clientY;
  if (s.raf) return;
  s.raf = requestAnimationFrame(() => {
    s.raf = 0;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${s.x - rect.left}px`);
    el.style.setProperty('--my', `${s.y - rect.top}px`);
  });
};

const handleCardMouseLeave = (e) => {
  e.currentTarget.style.setProperty('--mx', '-999px');
  e.currentTarget.style.setProperty('--my', '-999px');
};

// 프로젝트 미디어 (스크린샷/GIF) — media 배열이 비어 있으면 TUI 스타일 더미 프레임 표시
// 실제 자료가 준비되면 프로젝트 데이터에 media: [{ src, alt }] 를 추가하면 된다.
// 카드는 항상 첫 장만, 모달은 2장 이상일 때 썸네일 갤러리를 함께 보여준다.
const ProjectMedia = ({ media, name, variant = 'card' }) => {
  const [idx, setIdx] = useState(0);

  if (!media || media.length === 0) {
    return (
      <div className={`project-media placeholder ${variant}`}>
        <span className="media-nosignal">NO SIGNAL</span>
        <span className="media-hint">[ MEDIA INCOMING ]</span>
      </div>
    );
  }

  const isGallery = variant === 'modal' && media.length > 1;
  const current = media[Math.min(idx, media.length - 1)];
  const shown = variant === 'modal' ? current : media[0];

  return (
    <>
      {/* kind: 'logo' 는 정사각 로고라 잘리지 않도록 contain 렌더 */}
      <div className={`project-media ${variant} ${shown.kind === 'logo' ? 'is-logo' : ''}`}>
        <img src={shown.src} alt={shown.alt || name} loading="lazy" />
      </div>
      {isGallery && (
        <>
          <div className="media-thumbs">
            {media.map((m, i) => (
              <button
                key={i}
                type="button"
                className={`media-thumb ${i === idx ? 'active' : ''}`}
                onClick={() => setIdx(i)}
                aria-label={m.alt || `${name} 스크린샷 ${i + 1}`}
              >
                <img src={m.src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
          <div className="media-caption">
            [{idx + 1}/{media.length}] {current.alt}
          </div>
        </>
      )}
    </>
  );
};

// GitHub 링크에서 owner/repo 추출
const parseGithubRepo = (project) => {
  if (!project?.links) return null;
  const gh = project.links.find((l) => /github\.com\/[^/]+\/[^/]+/.test(l.url));
  if (!gh) return null;
  const m = gh.url.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  if (!m) return null;
  return `${m[1]}/${m[2].replace(/\.git$/, '')}`;
};

// GitHub star/fork localStorage 캐시 (10분 TTL)
const GH_TTL = 10 * 60 * 1000;

const readGhCache = (repo) => {
  try {
    return JSON.parse(localStorage.getItem(`gh-stats:${repo}`));
  } catch {
    return null;
  }
};

// GitHub 공개 API로 star/fork 수를 실시간 조회 (localStorage 10분 캐시)
const GithubStats = ({ repo, variant = 'card' }) => {
  // 만료된 캐시라도 우선 표시하고, 신선하지 않으면 아래 effect에서 갱신
  const [stats, setStats] = useState(() => {
    if (!repo) return null;
    const cached = readGhCache(repo);
    return cached ? { stars: cached.stars, forks: cached.forks } : null;
  });

  useEffect(() => {
    if (!repo) return;
    const cached = readGhCache(repo);
    if (cached && Date.now() - cached.t < GH_TTL) return;
    let cancelled = false;

    fetch(`https://api.github.com/repos/${repo}`)
      .then((r) => {
        if (!r.ok) throw new Error(`GitHub API ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const next = { stars: data.stargazers_count, forks: data.forks_count };
        setStats(next);
        try {
          localStorage.setItem(`gh-stats:${repo}`, JSON.stringify({ ...next, t: Date.now() }));
        } catch {
          /* localStorage 사용 불가 시 무시 */
        }
      })
      .catch(() => {
        /* 실패(rate limit 등) 시 초기 상태의 만료 캐시가 그대로 유지됨 */
      });

    return () => {
      cancelled = true;
    };
  }, [repo]);

  if (!repo || !stats) return null;

  return (
    <div className={`repo-stats ${variant}`}>
      <span className="repo-stat" title="Stars"><span className="repo-stat-icon">★</span> {stats.stars}</span>
      <span className="repo-stat" title="Forks"><span className="repo-stat-icon">⑂</span> {stats.forks}</span>
    </div>
  );
};

// 0 → target 카운트업 (ease-out cubic)
const useCountUp = (target, duration = 900) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / duration, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
};

// Pip-Boy 스타일 세그먼트 스킬 바 — 임의 % 대신 근거(note)를 함께 표기
const SkillBar = ({ name, pct, note, delay = 0 }) => {
  const total = 24;
  const filled = Math.round((pct / 100) * total);
  const shownPct = useCountUp(pct);
  const lv = Math.round(pct / 10);
  return (
    <div className="skill-bar" title={`EXP SOURCE: ${note}`}>
      <div className="skill-head">
        <span className="skill-name">
          <span className="skill-lv">LV.{lv}</span>
          {name}
          <span className="skill-pct">[{shownPct}%]</span>
        </span>
        <span className="skill-note">{note}</span>
      </div>
      <div className="skill-segments">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`seg ${i < filled ? 'on' : ''}`}
            style={{ '--i': i + delay }}
          />
        ))}
      </div>
    </div>
  );
};

// Tab components
const StatTab = () => {
  const personalData = [
    { label: 'NAME:', value: 'YOUNGJUN JI (NOTNULL)' },
    { label: 'ROLE:', value: 'UNITY DEVELOPER' },
    { label: 'EXPERIENCE:', value: '5 YEARS' },
    { label: 'COMPANY:', value: '블루포션게임즈 (EOS RED)' },
    { label: 'STATUS:', value: '재직중 · EMPLOYED', color: '#00ff41' },
  ];

  return (
    <div className="tab-content">
      <SectionHeader title="PERSONAL DATA" />
      <div className="stat-pitch text-glow">
        라이브 MMORPG 콘텐츠·BM 개발 3년, 1인 게임 개발, AI 개발툴 오픈소스까지 —
        만든 것으로 증명하는 Unity 개발자입니다.
      </div>
      <div className="stat-layout">
        <div className="data-grid">
          {personalData.map((row, i) => (
            <div className="data-row" key={row.label}>
              <span className="label">{row.label}</span>
              <span
                className="value text-glow"
                style={row.color ? { color: row.color } : undefined}
              >
                <ScrambleText text={row.value} duration={550} delay={150 + i * 120} />
              </span>
            </div>
          ))}
        </div>
        <div className="stat-portrait tui-corners">
          <img src={vaultBoyImg} alt="NOTNULL vault boy portrait" className="stat-portrait-img" />
          <span className="stat-portrait-label">ID: NOTNULL-92</span>
        </div>
      </div>
      <SectionHeader title="SKILLS" style={{ marginTop: '30px' }} />
      <div className="skills-container">
        <SkillBar
          name="UNITY / C#"
          pct={95}
          note="5 YRS · 라이브 MMORPG 3년 · 출시작 4종"
          delay={0}
        />
        <SkillBar
          name="게임플레이 / BM 시스템"
          pct={85}
          note="길드전·BM 3종 개발 · 매출 기여 30%"
          delay={6}
        />
        <SkillBar
          name="TOOLING (GO / GDSCRIPT)"
          pct={70}
          note="오픈소스 개발자 도구 4종 공개 (Unity·Godot·MCP)"
          delay={12}
        />
        <SkillBar
          name="GIT / SVN / JENKINS"
          pct={80}
          note="라이브 브랜치 운영 · CI 빌드 배포"
          delay={18}
        />
      </div>
    </div>
  );
};

const ProjectModal = ({ project, onClose }) => {
  if (!project) return null;

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        initial={{ scaleY: 0.02, scaleX: 1.08, opacity: 0.5 }}
        animate={{ scaleY: 1, scaleX: 1, opacity: 1 }}
        exit={{ scaleY: 0.02, scaleX: 1.08, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-title text-glow-strong">
            <ScrambleText text={`> ${project.name}`} duration={600} delay={200} />
          </span>
          <button className="modal-close" onClick={onClose}>[X]</button>
        </div>
        
        <div className="modal-body">
          <div className="modal-section">
            <span className="modal-label">PROJECT NAME:</span>
            <span className="modal-value text-glow">{project.name}</span>
          </div>
          
          <div className="modal-section">
            <span className="modal-label">STATUS:</span>
            <span className="modal-value" style={{ color: project.status === 'IN DEVELOPMENT' ? '#ffaa00' : '#00ff41' }}>
              {project.status}
            </span>
          </div>

          {project.tags && project.tags.length > 0 && (
            <div className="modal-section">
              <span className="modal-label">TAGS:</span>
              <ProjectTags tags={project.tags} />
            </div>
          )}

          {parseGithubRepo(project) && (
            <div className="modal-section">
              <span className="modal-label">REPO STATS:</span>
              <GithubStats repo={parseGithubRepo(project)} variant="modal" />
            </div>
          )}

          <div className="modal-section">
            <span className="modal-label">MEDIA:</span>
            <ProjectMedia media={project.media} name={project.name} variant="modal" />
          </div>

          <div className="modal-section">
            <span className="modal-label">DESCRIPTION:</span>
            <p className="modal-description">{project.fullDescription || project.description}</p>
          </div>
          
          <div className="modal-section">
            <span className="modal-label">TECH STACK:</span>
            <div className="modal-tech">
              {project.tech.map((t, i) => (
                <span key={i} className="tech-tag">{t}</span>
              ))}
            </div>
          </div>
          
          {project.features && (
            <div className="modal-section">
              <span className="modal-label">KEY FEATURES:</span>
              <ul className="modal-features">
                {project.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
            </div>
          )}
          
          {project.links && (
            <div className="modal-section">
              <span className="modal-label">LINKS:</span>
              <div className="modal-links">
                {project.links.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="modal-link">
                    [{link.label}]
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <span className="text-glow">{'>'} CLICK OUTSIDE OR [X] TO CLOSE_</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

// 1차 축: 플랫폼/유형 (필터) — 프로젝트는 복수 소속 가능
const CATEGORIES = [
  { id: 'ALL', label: 'ALL' },
  { id: 'MOBILE', label: 'MOBILE GAME' },
  { id: 'PC', label: 'PC GAME' },
  { id: 'ARVR', label: 'AR/VR' },
  { id: 'TOOL', label: 'TOOL' },
];

// 2차 축: 성격 태그 (배지) — 필터에는 쓰지 않고 카드에서 신호만 준다
const TAG_COLORS = {
  'LIVE SERVICE': '#38bdf8',
  'OPEN SOURCE': '#00ff41',
  SOLO: '#a855f7',
  'GAME JAM': '#ff8800',
  HARDWARE: '#facc15',
  EXHIBITION: '#f472b6',
};

const ProjectTags = ({ tags }) => {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="project-tags">
      {tags.map((t) => (
        <span
          key={t}
          className="project-tag"
          style={{ color: TAG_COLORS[t] || '#88ddaa', borderColor: `${TAG_COLORS[t] || '#88ddaa'}66` }}
        >
          {t}
        </span>
      ))}
    </div>
  );
};

// QUESTS 탭 하단 업적 목록 — 미달성 조건 노출이 재방문 동기가 된다
const AchievementsSection = () => {
  const [unlocked, setUnlocked] = useState(readUnlocked);

  useEffect(() => {
    const refresh = () => setUnlocked(readUnlocked());
    window.addEventListener('tui-achievement', refresh);
    return () => window.removeEventListener('tui-achievement', refresh);
  }, []);

  const count = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;

  return (
    <>
      <SectionHeader
        title={`ACHIEVEMENTS ${count}/${ACHIEVEMENTS.length}`}
        style={{ marginTop: '30px' }}
      />
      <div className="ach-grid">
        {ACHIEVEMENTS.map((a) => {
          const got = Boolean(unlocked[a.id]);
          const showInfo = got || !a.hidden;
          return (
            <div key={a.id} className={`ach-card ${got ? 'unlocked' : 'locked'}`}>
              <span className="ach-card-star">{got ? '★' : '☆'}</span>
              <div className="ach-card-body">
                <span className="ach-card-title">{showInfo ? a.title : '???'}</span>
                <span className="ach-card-desc">{showInfo ? a.desc : '히든 업적'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const QuestsTab = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const inProgressProjects = [
    {
      name: 'NoMoreRolls',
      description: '언더테일의 도덕적 전투 선택을 주사위 족보 메카닉으로 번역한 1인 개발 로그라이크 (프로토타입 완료)',
      fullDescription: `"언더테일의 도덕적 전투 선택을 주사위 족보 메카닉으로 번역한 1인 개발 로그라이크"입니다. 적과 전투(Fight)하거나 대화(Talk)하는 이중 루트 시스템이 핵심이며, 10체 고유 영혼의 트라우마를 기믹이라는 게임적 장치로 표현합니다.

▶ 프로토타입 플레이 영상: https://youtu.be/kqOMakdCoEc

[프로젝트 개요]
• 개발 기간: 2026.04 ~ 진행 중 (프로토타입 완료)
• 장르: 로그라이크 (주사위 기반 전투 + 서사 분기)
• 플랫폼: Steam (PC), BIC 출품 대상
• 팀 구성: 1인 개발
• 사용 기술: C#, Unity, DOTween, Odin Inspector, UniTask

[핵심 기여도]
• 전체 게임 디자인 문서(GDD) 23개 섹션 작성 및 유지
• 아키텍처 설계: 2씬(State 전환 기반) + 통합 ParlorScene 구조
• 전투 시스템: 10종 족보 판정 + 데미지/공감 이중 계산 시스템
• Fight/Talk 대칭 루트: 동일 주사위-족보 루프에서 공격/공감으로 분기
• 적 기믹 시스템: 트라우마를 게임 메커니즘으로 번역 (9종 GimmickType)
• 복도 진행 시스템: 22노드 고정 경로 + 루트 비율 기반 시각 변화
• Talk 조건 판정: 적별 고유 퍼즐 (GimmickType 기반 7종 switch)
• 크로스런 메타 시스템: 회차별 타이틀 변화 + True Ending 루트

[대표 개발 컨텐츠]

◆ 핵심 시스템
• PedigreeManager: 10종 족보 판정 (HighCard ~ MonoRoll) + 데미지 계산
• TalkManager: 공감 계산 + 감정 게이지 + 적별 조건 판정 + 대화 선택지
• ParlorManager + CorridorState: 22노드 복도 진행 + DOTween 스크롤/페이드 연출
• BattleManager SubSM: 11개 State 기반 턴제 전투 (Intro → RouteSelect → Dice → Hand → Resolve → TurnEnd)
• DiceSlotManager: 5슬롯 장착/교체/보관함 시스템 (덱빌딩 → 슬롯 시스템으로 전환)

◆ UI/연출
• CombatUIController: 전투 UI 통합 컨트롤러 (족보 선택, 리롤, 루트 선택, 결과)
• PlayerAttackDirector: 3Phase 공격 연출 (팝업 → 아이콘 비행 → 피격 플래시)
• EmotionGaugeUI: 감정 게이지 하트 DOTween 연출
• DoorSlotUI: 문 상태별 스프라이트 + Pulse 애니메이션 + 동료 표시
• RouteSelectUI: Fight/Talk 루트 선택 + 적 대사 표시

◆ 메타 시스템
• CrossRunSaveManager: JSON 기반 크로스런 영속 저장
• MetaEventSystem: 회차별 타이틀 로고/부제 변화 + Dealer 대사 타이핑 연출
• True Ending 루트: Fight+Talk 양쪽 엔딩 달성 시 해금

◆ 설계 문서
• GDD 23개 섹션 (개요, 세계관, 캐릭터, 전투, Talk, 기믹, 조우 구조, 엔딩 등)
• Unity Docs 5종 (scene-overview, title/parlor hierarchy, title/parlor dev-spec)
• 밸런스 시뮬레이션 (10,000턴 기반 족보/데미지/공감 수치 확정)
• 인라인 체크리스트 (프로토타입 구동 기준)

[협업 도구]
• 버전 관리: Git (GitHub)
• 문서화: Obsidian (Second Brain Vault)
• AI 파트너: OMEGA(Ω) (오피) — 전략, 태스크 분해, 문서 관리`,
      status: 'PROTOTYPE DONE',
      progress: 55,
      category: ['PC'],
      tags: ['SOLO'],
      media: [
        { src: nmrTitleImg, alt: '타이틀 화면 — FIGHT / TALK 이중 루트를 상징하는 응접실 타이틀' },
        { src: nmrBattleImg, alt: '전투 화면 — 주사위 5개 굴림/LOCK, 족보 기록, 체력·굴욕 이중 게이지' },
        { src: nmrCorridorImg, alt: '복도 진행 — 전투/휴식 문 선택, 문 너머 실루엣으로 적 암시' },
        { src: nmrTalkImg, alt: 'Talk 루트 성공 — 설득 후 기억의 파편 보상 선택' },
      ],
      tech: ['Unity', 'C#', 'DOTween', 'Odin Inspector', 'UniTask', 'OMEGA(Ω)', 'Git', 'Obsidian'],
      features: [
        '프로토타입 완료 — 플레이 영상 공개',
        'Fight/Talk 이중 루트: 동일 족보가 공격/감정으로 의미 분기',
        '10체 고유 영혼 + 트라우마 기믹 9종',
        '22노드 고정 복도 + 루트 비율 기반 시각 변화',
        '10종 주사위 족보 (HighCard ~ MonoRoll)',
        '1인 전체 설계/개발 (GDD 23섹션 + 전체 구현)',
      ],
      links: [
        { label: 'PLAY VIDEO', url: 'https://youtu.be/kqOMakdCoEc' },
      ],
    },
    {
      name: 'RINGVERSE: KARVAS COMMAND',
      description: '그리드 인벤토리 빌드 × 거점 디펜스 융합 모바일 게임 (1인 개발, 프로젝트 코드명 Inventoria)',
      fullDescription: `"그리드 인벤토리 빌드 × 거점 디펜스"를 융합한 모바일 라이브서비스 게임입니다. 체스판에 포탑을 배치하고, 각 포탑에 영웅을 파일럿으로 얹고, 포탑 내부 그리드에 아이템을 어떻게 배치·조합하느냐가 곧 전투력이 됩니다.

태그라인: "뿌리의 끝, 세계의 가장자리 — 여기가 카르바스다."

[프로젝트 개요]
• 개발 기간: 2026.06 ~ 진행 중 (커밋 747개)
• 정식 타이틀: RingVerse: Karvas Command (코드명 Inventoria)
• 장르: 그리드 빌드 × 거점 디펜스 (모바일 라이브서비스)
• 플랫폼: 모바일 (Android / iOS), PC 빌드 병행
• 팀 구성: 1인 개발 (기획·설계·구현 전담)
• 사용 기술: Unity 6, C#, UI Toolkit, Addressables, Odin Inspector, Input System

[핵심 설계]
• 체스판 5×5 포탑 배치 + 포탑 내부 그리드 아이템 조합 = 전투력
• 영웅 5인 완전 대칭 로스터 (제이아·세인·솔·오빗·그롬)
  — 고정 열 지정형 패시브 + 스킬 체인 액티브
• 처치 쿼터 사이클 → 1-of-3 픽 (상점 / 팀 포탑 / 파워픽)
• 전투 = 자동 토대(3면 스웜·커버리지·화력↔방어 저울) + 이산 개입(스킬·픽)
• 무각본 보스, 승리 = 최종보스(랫 킹) 처치 / 패배 = 성벽 HP 0
• 로비 = 성 내부 허브 (D-5 카운트다운 + AP 3 소비 모델)
• 모험가 길드 = 비주얼 노벨식 다공간 허브 (고용 → 우호도 → 영구 영입)

[아키텍처 / 엔지니어링]
• 어셈블리 분리: Game.Core / Game.Combat / Game.UI / Game.Editor
• 2씬(TitleScene → GameScene) + GameScene 내부 HSM 상태 머신
• uGUI → UI Toolkit 전면 전환 완료 (2026.08)
• 결정론 보장: 전투/상점 RNG를 별도 시드로 격리해 헤드리스 재현 검증
• 데이터 주도 설계: 인트로 카드·포탑 카탈로그 18종·스킬 모듈 24종을
  코드 수정 없이 데이터 교체만으로 확장 가능하도록 구성

[세계관]
엔드하임 대륙 바르카르 변경권, 오크 부족들이 피난로를 지키기 위해 세운
마지막 방어선 "카르바스 성채". 뿌리가 마르고 균열에서 쥐 떼가 쏟아진다.

[문서 · 협업]
• 설계 정본 문서 30여 종 운영 (GDD + 주제별 정본 맵 + 의사결정 이력)
• 문서 우선 개발: 정본 맵으로 구 문서 재해석을 차단하는 규칙 체계
• 자체 개발한 hera-agent-unity를 UPM 의존성으로 실제 투입 (도그푸딩)
• 버전 관리: Git (GitHub)`,
      status: 'IN PROGRESS',
      progress: 45,
      category: ['MOBILE', 'PC'],
      tags: ['SOLO'],
      media: [
        { src: ringverseTitleImg, alt: 'RingVerse: Karvas Command 타이틀 화면 — 카르바스 성채와 쥐 떼 벌판' },
      ],
      tech: ['Unity 6', 'C#', 'UI Toolkit', 'Addressables', 'Odin Inspector', 'HSM', 'hera-agent-unity'],
      features: [
        '그리드 빌드 × 거점 디펜스 융합 (체스판 5×5 포탑 배치)',
        '영웅 5인 대칭 로스터 + 스킬 체인 시스템',
        'uGUI → UI Toolkit 전면 전환 완료',
        '결정론 RNG 격리 + 헤드리스 재현 검증',
        '설계 정본 문서 30여 종 운영 (문서 우선 개발)',
        '자체 AI 툴(hera-agent-unity) 실전 투입 · 1인 개발',
      ],
    },
  ];

  const releasedProjects = [
    {
      name: 'HERA-AGENT-UNITY',
      description: 'AI 코딩 에이전트가 라이브 Unity 에디터를 제어하는 저토큰(Low-token) CLI',
      fullDescription: `"AI 코딩 에이전트가 실행 중인 Unity 에디터를 직접 제어하는 저토큰 CLI"입니다. Codex, Claude, Cursor, Copilot, AntiGravity 등의 에이전트가 Python 서버 없이, 셸 명령만으로 라이브 Unity 에디터를 조사하고 변경할 수 있게 합니다.

[프로젝트 개요]
• 개발 기간: 2026.05 ~ 진행 중
• 최신 릴리스: v0.1.4 (2026.08.06)
• 유형: 개발자 도구 (Go CLI + Unity UPM 패키지)
• 라이선스: Apache-2.0 (오픈소스)
• 플랫폼: Windows / macOS / Linux
• 대상: Unity 2022.3+ (6000.x 검증)
• 사용 기술: Go 1.25+, C#, Unity Editor API, PowerShell

[핵심 개념]
에이전트는 오래된 학습 데이터로 추측하지 않고, 실제 에디터에 직접 물어봅니다.
AI agent → hera-agent-unity → Unity Editor

[대표 기능]
• status: 실행 중인 Unity 프로젝트/버전/포트/상태 조회
• exec: 로드된 프로젝트 안에서 C# 코드 실행
• console: 실제 Unity 콘솔 에러 읽기
• editor play --wait: Play Mode 진입 및 대기
• GameObject 생성/편집을 Unity API로 안전하게 수행
• Input QA: Unity EventSystem을 통한 uGUI 클릭/서브밋/스크롤/드래그 검증
• 빌드한 UI를 실제 Unity UI 오브젝트로 생성 후 결과 캡처

[저토큰 최적화]
• list --compact ≈93 토큰, find_gameobjects --ids ≈49~55 토큰 수준으로 벤치마크
• Unity 2022.3 / 2023.2 / 6000.x 다중 버전 검증
• 기본 CLI 경로는 MCP 설정·Python 서버 없이 셸 명령만으로 동작
• v0.1.0+ 부터 실험적 stdio MCP 어댑터 제공 (기본 비활성, 선택 사용)

[v0.1.4 주요 변경]
• 멀티 에디터 정책 락: 첫 대상 에디터를 결정적으로 선택한 뒤,
  도메인 리로드나 에디터 재시작으로 포트가 바뀌어도 정규화된 프로젝트 경로로 고정 유지
• 에이전트 컨텍스트 바운딩: 출력량을 제한해 토큰 폭주 방지
• 셀렉터 미지정 시의 우선순위를 회귀 테스트로 고정

[성과]
• GitHub Stars 22 · Forks 3 (2026.08 기준, 카드에 실시간 표시)

[협업 도구]
• 버전 관리: Git (GitHub)
• 릴리스: GitHub Releases (v0.1.4)`,
      status: 'RELEASED',
      category: ['TOOL'],
      tags: ['OPEN SOURCE'],
      media: [
        { src: heraUnityLogo, alt: 'hera-agent-unity 로고', kind: 'logo' },
      ],
      tech: ['Go', 'C#', 'Unity Editor', 'UPM', 'CLI', 'Apache-2.0'],
      features: [
        'AI 에이전트용 라이브 Unity 에디터 제어 CLI',
        'Python 서버 없이 셸 명령만으로 동작 (MCP 선택 지원)',
        'C# 실행 · 콘솔 읽기 · Play Mode · UI 생성',
        'EventSystem 기반 UI 입력 QA (Input QA)',
        '저토큰 최적화 (list --compact ≈93 토큰)',
        '멀티 에디터 정책 락 + 도메인 리로드 안전성 (v0.1.4)',
      ],
      links: [
        { label: 'GITHUB', url: 'https://github.com/NotNull92/hera-agent-unity' },
        { label: 'RELEASES', url: 'https://github.com/NotNull92/hera-agent-unity/releases' },
        { label: 'YOUTUBE', url: 'https://www.youtube.com/@emberstudioo' },
      ],
    },
    {
      name: 'HERA-AGENT-GODOT',
      description: 'AI 에이전트가 라이브 Godot 4.7+ 에디터를 제어하는 저토큰 CLI (v1.0.0 안정 계약 · Godot Asset Store 등록)',
      fullDescription: `"AI 코딩 에이전트에게 라이브 Godot 에디터의 눈·손·증거를 제공하는 저토큰 CLI"입니다. hera-agent-unity의 형제 프로젝트로, 같은 저토큰·셸 네이티브 철학을 Godot 전용으로 새로 설계했습니다(포팅이 아님).

[프로젝트 개요]
• 개발 기간: 2026.06 ~ 진행 중
• 최신 릴리스: v1.0.0 (2026.07.21) — 안정 CLI 계약 + SemVer 채택
• 유형: 개발자 도구 (Go CLI + Godot 애드온)
• 라이선스: MIT (오픈소스)
• 대상: Godot 4.7+ 표준 빌드
• 배포: GitHub Releases · Godot Asset Store · Homebrew tap
• 사용 기술: Go 1.25+, GDScript, EditorPlugin, HTTP RPC

[제품 아이덴티티]
• live editor truth (라이브 에디터의 진실)
• low-token control (저토큰 제어)
• proof-first QA (증거 우선 QA)

[동작 방식]
Go CLI ──HTTP /rpc──▶ Godot 에디터 애드온(@tool EditorPlugin, GDScript)
• CLI(Go): 에디터를 탐색하고 명령당 1개의 compact JSON 요청 전송
• 애드온(GDScript): localhost HTTP 서버를 띄우고 EditorInterface로 메인 스레드에서 실행

[대표 기능]
• 노드 트리 읽기/쓰기 (node get --prop/--props, 편집)
• GDScript 평가(eval), 씬 실행/정지(run/stop)
• 런타임 UI 검사: game ui tree --path/--depth/--fields/--type/--text
• Game Feel UI Mode (Beta) + EditorSettings 영속화
• QA 워크플로우: game qa discover, 실행 가능한 체크 기반 QA 판정
• batch / smoke / screenshot / diagnostics 등 다양한 명령 지원

[v1.0.0 주요 변경]
• 안정 계약 + SemVer: 명령·출력 필드·스트림·종료 코드에 메이저 호환성 보장과
  문서화된 deprecation 정책 적용 (docs/CONTRACT.md)
• Godot 네이티브 UI 테마 QA: Theme 리소스 항목을 조회·수정하고
  간격/타입/색상/대비/컨테이너/장식 측정 규칙으로 검증
• 스크린샷 diff: 두 캡처를 로컬에서 비교해 변경 픽셀 수·비율·바운딩 박스 산출
  (프로젝트 이미지를 외부 업로드하지 않음)
• 라이브 신뢰성 개선: 하트비트 스왑 재시도(바운디드 백오프),
  진단이 로깅 사각지대를 보고해 false-clean 방지
• 0.9 → 1.0 무중단 마이그레이션 (breaking change 없음)

[저토큰(측정 기반)]
• 턴당 상주 툴 스키마 0 토큰 (MCP 서버는 약 4k~31k 토큰)
• status ≈48 토큰, node get ≈186 토큰 수준의 compact JSON 응답
• 씬 구성 → 실행 → 런타임 QA → 노드 수정까지 전체 세션 ≈1,170 토큰

[성과]
• GitHub Stars 10 · Forks 1 (2026.08 기준, 카드에 실시간 표시)

[협업 도구]
• 버전 관리: Git (GitHub)
• 배포: GitHub Releases + Godot Asset Store + Homebrew tap`,
      status: 'RELEASED',
      category: ['TOOL'],
      tags: ['OPEN SOURCE'],
      media: [
        { src: heraGodotLogo, alt: 'hera-agent-godot 로고', kind: 'logo' },
      ],
      tech: ['Go', 'GDScript', 'Godot 4.7+', 'EditorPlugin', 'CLI', 'MIT'],
      features: [
        'AI 에이전트용 라이브 Godot 에디터 제어 CLI',
        'v1.0.0 안정 CLI 계약 + SemVer/deprecation 정책',
        'Godot 네이티브 UI 테마 QA + 스크린샷 diff',
        '노드 트리 읽기/쓰기 · GDScript eval · 씬 실행',
        '저토큰: 전체 QA 세션 ≈1,170 토큰 (툴 스키마 0)',
        'Godot Asset Store + Homebrew tap 배포',
      ],
      links: [
        { label: 'GITHUB', url: 'https://github.com/NotNull92/hera-agent-godot' },
        { label: 'RELEASES', url: 'https://github.com/NotNull92/hera-agent-godot/releases' },
        { label: 'ASSET STORE', url: 'https://store.godotengine.org/asset/notnull92/hera-agent-godot/' },
        { label: 'YOUTUBE', url: 'https://www.youtube.com/@emberstudioo' },
      ],
    },
    {
      name: 'HEBE-AGENT-UNITY',
      description: 'AI 에이전트를 위한 빠르고 복구 가능한 Unity 실행 런타임 (warm exec 240ms 측정)',
      fullDescription: `"AI 코딩 에이전트를 위한 빠르고 복구 가능한 Unity 실행 런타임"입니다. 단순한 에디터 원격 제어가 아니라, 반복되는 C# 시작 비용을 캐시로 제거하는 데 집중한 경량 실행 런타임입니다. hera-agent-unity의 경량 실행 에디션으로, Hera의 검증된 localhost 실행 코어와 에이전트 루프에 필요한 도구만 남기고 MCP·타입 툴 계약·승인 플로우·배치·문서 번들·UI/에셋 파이프라인은 의도적으로 제외했습니다.

[프로젝트 개요]
• 개발 기간: 2026.08 ~ 진행 중
• 최신 릴리스: v0.0.1 (2026.08.06, 초기 공개)
• 유형: 개발자 도구 (Go 바이너리 1개 + Unity UPM 패키지 1개)
• 라이선스: Apache-2.0 (오픈소스)
• 사용 기술: Go, C#, Unity Editor API, localhost HTTP

[설계 목표]
• Hot execution loop: 컴파일러 탐색, 레퍼런스 세트, 컴파일된 DLL,
  로드된 어셈블리를 캐시해 반복 실행 비용을 제거
• Recoverable Editor control: 결정적 프로젝트/포트 타게팅,
  하트비트 기반 대기, 도메인 리로드 안전 테스트, 재개 가능한 run ID
• Agent-native feedback: 구조화된 에러 코드·제안·에이전트 힌트,
  compact JSON, 토큰 절약형 툴 탐색
• Small deployment surface: 별도 서버 프로세스·Python 런타임·MCP 클라이언트 불필요

[측정 성능] (2026.08.06 벤치마크)
동일한 31파일 픽스처와 동일 명령 시퀀스를 이미 열린 Unity 에디터에서 3회 반복 측정

• 전체 고정 워크플로우: 중앙값 37.285s (p95 38.344s)
• 동일 코드 warm exec: 중앙값 240ms (p95 273ms, 27회)
• 서로 다른 코드 exec: 중앙값 313ms (p95 392ms, 30회)
• 최초 cold exec: 1.460s → warm 대비 약 6.08배 (83.6% 단축)
• EditMode 12개 테스트 960ms / PlayMode 3개 테스트 7.720s
• 측정된 99개 CLI 명령에서 실패 0건, Unity 콘솔 에러 0건
• 변동계수 약 2.63% (표준편차 0.984s)

* 서로 다른 코드에서도 313ms가 나온다는 점은 단순 결과 캐싱이 아니라
  컴파일러 탐색·레퍼런스 세트·응답 파일·어셈블리 준비가 재사용됨을 의미합니다.

[측정 환경]
• Windows 11 Pro, Intel Core i7-12700, 31.8 GiB RAM
• Unity 6000.5.6f1, Interaction Mode: No Throttling

[협업 도구]
• 버전 관리: Git (GitHub)
• 릴리스: GitHub Releases (v0.0.1)`,
      status: 'RELEASED',
      category: ['TOOL'],
      tags: ['OPEN SOURCE'],
      media: [
        { src: hebeLogo, alt: 'hebe-agent-unity 로고', kind: 'logo' },
      ],
      tech: ['Go', 'C#', 'Unity Editor', 'UPM', 'CLI', 'Apache-2.0'],
      features: [
        'Hera의 경량 실행 에디션 (실행 코어만 남긴 미니멀 버전)',
        '컴파일러·레퍼런스·DLL·어셈블리 캐시로 warm exec 240ms',
        'cold 대비 약 6.08배 단축 (83.6%), 측정 기반 벤치마크 공개',
        '99개 명령 측정에서 실패 0건 · 콘솔 에러 0건',
        '도메인 리로드 안전 테스트 + 재개 가능한 run ID',
        'Go 바이너리 1개 + UPM 패키지 1개, 서버 프로세스 불필요',
      ],
      links: [
        { label: 'GITHUB', url: 'https://github.com/NotNull92/hebe-agent-unity' },
        { label: 'RELEASES', url: 'https://github.com/NotNull92/hebe-agent-unity/releases' },
        { label: 'HERA', url: 'https://github.com/NotNull92/hera-agent-unity' },
      ],
    },
    {
      name: 'WORKFORGE-MCP',
      description: 'ChatGPT를 Windows 워크스테이션에 안전하게 연결하는 MCP 게이트웨이',
      fullDescription: `"ChatGPT에게 내 PC를 만질 안전한 손을 쥐여주는 MCP 게이트웨이"입니다. ChatGPT가 실제 프로젝트 파일을 읽고, Git 상태를 파악하고, 가드가 걸린 편집을 수행하고, 로컬 이미지를 확인하고, 감독 하에 PowerShell 작업을 실행할 수 있게 합니다.

기존에는 에러 메시지 복사 → 붙여넣기 → 관련 소스 찾기 → 코드 복사 → 수정본 받기 → 다시 붙여넣기 → 빌드 → 다음 에러 복사의 반복이었다면, WorkForge는 이 루프를 "프로젝트 확인하고, 문제 찾아서, 고쳐줘" 한 문장으로 바꿉니다.

[프로젝트 개요]
• 개발 기간: 2026.08 ~ 진행 중
• 유형: 개발자 도구 (MCP 서버 / Windows 게이트웨이)
• 라이선스: MIT (오픈소스)
• 대상: Windows + ChatGPT (OpenAI Secure MCP Tunnel)
• 사용 기술: TypeScript, Node.js, PowerShell, MCP (Model Context Protocol)

[제공 기능 — MCP 툴 12종]
• 파일/폴더 탐색: 구조 파악, 관련 파일 검색, 설정 파일 읽기
• 파일 생성·편집: SHA-256 가드 기반 안전 편집
• 프로젝트 상태 파악: Git 변경 사항, 마지막 커밋 이후 diff 요약
• PowerShell 작업: 빌드/테스트 실행, 진행 상태 조회, 취소
• 로컬 이미지 검사: PNG 열어 UI 설명, 크기·내용 확인

[안전 설계]
보안을 사후 조치가 아니라 설계 단계에 넣었습니다.
• 권한 경계: 실행한 Windows 계정 권한 안에서만 동작 —
  권한 상승 도구가 아니며 ACL·UAC를 우회하지 않음
• 상주 없음: 서비스·예약 작업·시작 프로그램·Run 레지스트리를 만들지 않음.
  재부팅 후 터널은 사용자가 다시 켜기 전까지 정지 상태 유지
• 재실행 방지: 연결이 끊겨도 이전 PowerShell 명령을 나중에 몰래 재생하지 않음
• Stale 편집 차단: SHA-256 검증으로 "내가 방금 본 그 파일일 때만 수정" 보장 —
  그 사이 누가 바꿨으면 중단
• 자격 증명 격리: Runtime API Key를 보호된 로컬 파일에 두고,
  프로젝트·셸 코드 실행 전 환경변수에서 제거
• 로그 마스킹: 사용자 홈 경로·터널 ID·자격 증명 패턴을 자동 마스킹

[설치·운영]
• Install / Setup / Configure Tunnel / Uninstall 배치 스크립트 제공
• ForgeUI 컨트롤 패널 (WorkForge Control.cmd)
• SECURITY.md · THIRD_PARTY_NOTICES.md 문서화

[협업 도구]
• 버전 관리: Git (GitHub)`,
      status: 'RELEASED',
      category: ['TOOL'],
      tags: ['OPEN SOURCE'],
      media: [
        { src: workforgeLogo, alt: 'workforge-mcp 로고', kind: 'logo' },
      ],
      tech: ['TypeScript', 'Node.js', 'PowerShell', 'MCP', 'Windows', 'MIT'],
      features: [
        'ChatGPT ↔ Windows 워크스테이션 MCP 게이트웨이',
        'MCP 툴 12종 (파일·Git·PowerShell·이미지)',
        'SHA-256 가드 편집으로 stale 덮어쓰기 차단',
        '권한 상승 없음 · 상주 없음 · 명령 재실행 방지',
        'Runtime 키 격리 + 로그 자동 마스킹',
        '설치/터널 설정 배치 스크립트 + ForgeUI 제공',
      ],
      links: [
        { label: 'GITHUB', url: 'https://github.com/NotNull92/workforge-mcp' },
      ],
    },
    {
      name: 'MENTAL ROBO',
      description: '리듬 입력과 토크 쇼를 결합한 코미디 로봇 스탠드업 게임 (GGJ 2024)',
      fullDescription: `"리듬 입력과 토크 쇼를 결합한 코미디 로봇 스탠드업 게임"입니다. 게임잼 주제 "Make Me Laugh"에 맞춰, 청중의 성향을 파악하고 적절한 농담 주제를 선택하여 최고의 코미디언 로봇이 되는 48시간 게임잼 완성작입니다.

[프로젝트 개요]
• 개발 기간: 2024.01 (Global Game Jam 2024, 48시간)
• 장르: 2D 캐주얼 (리듬 액션 + 토크 시뮬레이션)
• 플랫폼: PC (Windows)
• 팀 구성: 3인 (메인 개발 1 + 2)
• 사용 기술: C#, Unity
• 게임잼 주제: "Make Me Laugh"
• 게임잼 사이트: Zempie x Global Game Jam 2024 @Seoul

[핵심 기여도]
• 메인 개발: 전체 게임 시스템 구현 (리듬 입력, 청중 AI, 주제 선택, 점수 계산)
• 리듬 입력 시스템: 타이밍에 맞춘 방향키 입력 판정
• 청중 반응 시스템: 선택한 농담 주제에 따른 점수 보너스/패널티 계산
• 농담 주제 분기 퍼즐: 인싸개그, 아재개그, 화장실농담 3종 선택지
• 청중 공략 시스템: "40대 남성 청중", "부장님 직책 다수" 등 청중 성향에 따른 전략적 선택
• 48시간 내 프로토타입 완성 및 빌드 배포

[대표 개발 컨텐츠]

◆ 핵심 시스템
• 리듬 입력 판정: 타이밍 윈도우 기반 방향키 입력 처리
• 농담 주제 선택: 청중 취향 분석 → 적절한 주제 선택 → 점수 보너스
• 청중 반응 AI: 주제별 호감도 계산 + 실시간 점수 피드백
• 게임 플로우: 스탠드업 진행 → 주제 선택 → 리듬 입력 → 결과 판정

◆ UI/연출
• 픽셀아트 로봇 캐릭터 + 무대 배경 (빨간 커튼, 스포트라이트)
• 청중 실루엣 + 반응 연출
• 농담 주제 버튼 UI (인싸개그/아재개그/화장실농담)
• 청중 공략 포인트 힌트 시스템

[협업 도구]
• 버전 관리: Git (GitHub)
• 리포지토리: https://github.com/MrBadToast/GGJ2024`,
      status: 'RELEASED',
      category: ['PC'],
      tags: ['GAME JAM'],
      media: [
        { src: mrTitleImg, alt: '타이틀 — 스포트라이트 아래 무대에 선 코미디언 로봇' },
        { src: mrTopicImg, alt: '농담 주제 선택 — 청중 공략 포인트를 읽고 인싸/아재/화장실 개그 중 선택' },
        { src: mrRhythmImg, alt: '리듬 입력 — 타이밍 링에 맞춰 방향키를 입력해 스탠드업 진행' },
      ],
      tech: ['Unity', 'C#', 'Git', 'GitHub'],
      features: [
        '리듬 입력 기반 스탠드업 코미디 게임',
        '청중 성향 파악 + 농담 주제 선택 퍼즐',
        '48시간 게임잼 완성작 (GGJ 2024 Seoul)',
        '3인 팀 협업 메인 개발',
      ],
      links: [
        { label: 'GITHUB', url: 'https://github.com/MrBadToast/GGJ2024' },
        { label: 'GGJ', url: 'https://globalgamejam.org/games/2024/mental-robo-2' },
      ],
    },
    {
      name: 'EOS-RED',
      description: '장기 LIVE 서비스 모바일 MMORPG (2021.09 ~ 현재 참여 중)',
      fullDescription: '장기 Live 서비스 중인 모바일 MMORPG로, 2021년 9월 합류해 현재까지 컨텐츠·BM 개발을 이어가고 있는 프로젝트입니다.\n\n[프로젝트 개요]\n• 개발 기간: 2021.09 - ing (Live 서비스 중)\n• 장르: MMORPG\n• 플랫폼: 모바일\n• 팀 구성: 클라이언트 7 ~ 8인\n• 사용 기술: C#, Unity3D, OSA, UniRx, Dotween 등\n\n[출시 후 성과 지표]\n• MAU: 최대 35,000\n• DAU: 최대 12,000\n• 매출: 최대 400억, 평균 200억\n\n[핵심 기여도]\n• 스텝업 패키지 개발 및 유지 보수: 새로운 BM 시스템 개발로 매출에 기여\n• 상품 1+1 구매 기능 개발 및 유지 보수: 이벤트성 신규 유저 진입을 위한 BM 개발\n• 조건부 팝업 패키지 개발 및 유지 보수: 새로운 BM 시스템 개발\n• 대형/소형 컨텐츠 다수 개발 및 개선\n\n[대표 개발 컨텐츠]\n\n◆ 대형 컨텐츠\n• 길드 경쟁전: 길드원 간 협업 미션 시스템, PVP 경쟁 시스템\n• 길드 경쟁전 전용 PVE 던전: 실시간 협력 던전 시스템\n• 길드 경쟁전 리뉴얼: PVP 중심 경쟁 시스템, 밸런스 조정\n\n◆ BM 시스템\n• 스텝업 상품 시스템: 단계별 구매 유도 BM (매출 30% 기여)\n• 조건부 팝업: 유저 행동 기반 타겟팅 상품 노출 (전환율 45%)\n• 스텝업 패키지 개선: 다단계 구매 시스템 고도화\n\n◆ 시스템 & 편의성\n• 휴면 계정 처리: 유니크 식별자 재사용 시스템 (운영 공수 90% 절감)\n• 캐릭터 즉시 삭제: UniRx 기반 반응형 UI\n• 월드 랭킹 시스템: 서버 부하 85% 감소 최적화\n• VIP 칭호/버프/이펙트: 등급별 차별화 시스템\n• 재화 숫자 표기 개선: UI 가독성 향상\n\n◆ 기타 컨텐츠\n• 길드 추천 시스템: 길드 가입률 30% 증가\n• 보스 던전 리뉴얼: 참여율 35% 증가\n• 콜로세움 개선: 일일 참여율 150% 증가\n• 소울 각인 확장, 펫 레벨 증가, 아이템 획득 세분화 등\n\n[협업 도구]\n• 버전 관리: Git, SVN, Git Fork, Gitea, CDN, Hermes, Jenkins\n• 이슈 트래킹: RedMine\n• 문서화: Notion, Wiki',
      status: 'RELEASED',
      category: ['MOBILE'],
      tags: ['LIVE SERVICE'],
      media: [
        { src: eosRedKeyart, alt: 'EOS RED 공식 키아트 (블루포션게임즈)' },
      ],
      tech: ['Unity', 'C#', 'UniRx', 'OSA', 'Dotween', 'Jenkins', 'Git/SVN'],
      features: [
        'MAU 35,000 / DAU 12,000 달성',
        '매출 최대 400억, 평균 200억',
        '스텝업 패키지 매출 기여 30%',
        '대형/소형 컨텐츠 18개 이상 개발',
        'BM 시스템 3종 개발 (스텝업, 조건부팝업, 1+1)',
        '서버 부하 85% 감소 최적화',
      ],
      links: [
        { label: 'GOOGLE PLAY', url: 'https://play.google.com/store/apps/details?id=com.bluepotiongames.eosm&pcampaignid=web_share' },
      ],
    },
    {
      name: 'FREEDRAW',
      description: 'VR drawing application for MetaQuest 2',
      fullDescription: 'VR을 이용한 드로잉 컨텐츠. 2021년 전북콘텐츠진흥원 국가지원사업에서 86점을 받았다.',
      status: 'RELEASED',
      category: ['ARVR'],
      media: [
        { src: fdDrawImg, alt: 'VR 3D 드로잉 — RECORDING ROOM에서 컬러 팔레트로 공간에 직접 그리는 장면' },
        { src: fdGalleryImg, alt: 'DRAW ROOM 갤러리 공간 — 작품을 전시·감상하는 VR 룸' },
      ],
      tech: ['Unity', 'C#', 'SteamVR', 'Oculus Integration', 'TCP Socket'],
      features: [
        'VR 3D drawing system',
        'Save/Load/Continue drawing',
        'Mobile app sync via TCP',
        'Oculus Rift to Quest conversion',
      ],
      links: [
        { label: 'STEAM', url: 'https://store.steampowered.com/app/1539810/FreeDraw/' },
      ],
    },
    {
      name: 'ZOMBIE KINGDOM',
      description: '조선시대 컨셉 모바일 슈팅 게임',
      fullDescription: '오픈소스 프로젝트를 분석하여 리메이크한 모바일 슈팅 게임입니다.\n\n[프로젝트 개요]\n• 개발 기간: 2020.10 - 2020.12\n• 장르: 모바일 슈팅 게임\n• 플랫폼: 모바일\n• 팀 구성: 클라이언트 1인\n• 사용 기술: C#, Unity3D\n\n[핵심 기여도]\n• 오픈소스 프로젝트 분석 및 리메이크\n• 기존 포스트 아포칼립스 컨셉에서 조선시대 컨셉으로 변경\n• UI 전면 수정, 맵 레벨링, 인게임 내 오브젝트 모델링 변경\n• Json을 이용한 다국어 지원 기능 추가\n• 구글 애드몹, 인앱결제 추가 및 스토어 출시\n\n[출시 후 성과]\n• 전북콘텐츠진흥원 국가지원사업 지원금: 50,000,000\n\n[협업 도구]\n• 버전 관리: Unity Collaborate, Trello\n• 이슈 트래킹: Notion\n• 문서화: Hwp, Word',
      status: 'RELEASED',
      category: ['MOBILE'],
      tags: ['SOLO'],
      media: [
        { src: zkVillageImg, alt: '조선시대 컨셉 마을 — 포스트 아포칼립스에서 전면 리컨셉한 배경' },
        { src: zkGameplayImg, alt: '인게임 — 웨이브 방어 슈팅 (WAVE 1/10)' },
        { src: zkShopImg, alt: '상점 UI — 무기/방어구 구매 및 업그레이드' },
        { src: zkCharImg, alt: '조선 병사 캐릭터 모델링 — 컨셉 변경에 맞춰 교체한 인게임 오브젝트' },
      ],
      tech: ['Unity', 'C#', 'Google AdMob', 'IAP', 'JSON'],
      features: [
        '오픈소스 리메이크 (1인 개발)',
        '조선시대 컨셉 변경',
        '다국어 지원 시스템',
        '구글 애드몹 & 인앱결제',
        '전북콘텐츠진흥원 지원금 5천만원',
      ],
    },
    {
      name: 'ACTION GOLF',
      description: '자이로 센서 기반 모바일 골프 게임',
      fullDescription: '자이로 센서를 이용한 모바일 골프 게임입니다.\n\n[프로젝트 개요]\n• 개발 기간: 2021.01 - 2021.04\n• 장르: 자이로 센서를 이용한 모바일 골프 게임\n• 플랫폼: 모바일\n• 팀 구성: 클라이언트 2인\n• 사용 기술: C#, Unity3D, 아두이노, Bluetooth Plugin\n\n[핵심 기여도]\n• UI 코드 개선 및 리뉴얼\n• 상점 시스템 추가\n• 블루투스 센서 연결 및 데이터 전송 코드 개선 및 최적화\n\n[팀 내 역할]\n• 메인 개발자에게 프로젝트를 넘겨받아 작업 진행\n\n[협업 도구]\n• 버전 관리: Unity Collaborate, Trello\n• 이슈 트래킹: Notion\n• 문서화: Notion',
      status: 'RELEASED',
      category: ['MOBILE'],
      tags: ['HARDWARE'],
      media: [
        { src: agTitleImg, alt: 'ACTION GOLF 타이틀 화면' },
        { src: agSensorImg, alt: '인게임 — 자이로 센서 스윙 준비 (골프채를 직각으로 놓는 캘리브레이션 안내)' },
        { src: agShopImg, alt: '상점 시스템 — 골프채 구매/장착 (직접 추가한 시스템)' },
        { src: agLobbyImg, alt: '로비 — 연습장/싱글플레이/멀티플레이/상점 (UI 리뉴얼 담당)' },
      ],
      tech: ['Unity', 'C#', 'Arduino', 'Bluetooth Plugin', 'Gyro Sensor'],
      features: [
        '자이로 센서 기반 골프 스윙',
        'UI 코드 개선 및 리뉴얼',
        '상점 시스템 구현',
        '블루투스 센서 연결 최적화',
        '전북콘텐츠진흥원 국가지원사업',
      ],
      links: [
        { label: 'VIDEO', url: 'https://drive.google.com/file/d/1m1fkNzGY1tKGw5mvhPq-CL2nKHApZ5TD/view' },
      ],
    },
  ];

  const renderProjectCard = (project, index) => (
    <motion.div
      key={index}
      className="project-card clickable tui-corners spotlight-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12 }}
      onClick={() => setSelectedProject(project)}
      onMouseMove={handleCardMouseMove}
      onMouseLeave={handleCardMouseLeave}
      whileTap={{ scale: 0.99 }}
    >
      <span className="card-spotlight" aria-hidden="true" />
      <ProjectMedia media={project.media} name={project.name} variant="card" />
      <div className="project-header">
        <span className="project-name text-glow">{project.name}</span>
        <span className={`project-status ${project.status === 'RELEASED' ? 'released' : 'progress'}`}>
          <span className="status-led" />
          {project.status}
        </span>
      </div>
      <ProjectTags tags={project.tags} />
      <p className="project-description">{project.description}</p>
      <div className="project-tech">
        {project.tech.map((t, i) => (
          <span key={i} className="tech-tag">{t}</span>
        ))}
      </div>
      {project.progress && (
        <div className="project-progress">
          <div className="mini-segments">
            {Array.from({ length: 20 }, (_, i) => (
              <span
                key={i}
                className={`mseg ${i < Math.round(project.progress / 5) ? 'on' : ''}`}
              />
            ))}
          </div>
          <span className="progress-text">{project.progress}%</span>
        </div>
      )}
      {parseGithubRepo(project) && (
        <GithubStats repo={parseGithubRepo(project)} variant="card" />
      )}
      <div className="project-click-hint text-glow">{'[ CLICK FOR DETAILS ]'}</div>
    </motion.div>
  );

  const matches = (p) => filter === 'ALL' || (p.category || []).includes(filter);
  const shownInProgress = inProgressProjects.filter(matches);
  const shownReleased = releasedProjects.filter(matches);
  const countOf = (id) =>
    id === 'ALL'
      ? inProgressProjects.length + releasedProjects.length
      : [...inProgressProjects, ...releasedProjects].filter((p) => (p.category || []).includes(id)).length;

  return (
    <div className="tab-content">
      {/* 카테고리 필터 — IN PROGRESS / COMPLETED 구분은 그대로 유지된다 */}
      <div className="quest-filters" role="group" aria-label="프로젝트 분류 필터">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`quest-filter ${filter === c.id ? 'active' : ''}`}
            onClick={() => setFilter(c.id)}
            aria-pressed={filter === c.id}
          >
            {c.label} <span className="filter-count">{countOf(c.id)}</span>
          </button>
        ))}
      </div>

      {/* In Progress Section */}
      {shownInProgress.length > 0 && (
        <>
          <SectionHeader title="QUESTS IN PROGRESS" />
          <div className="projects-grid">
            {shownInProgress.map((project, index) => renderProjectCard(project, index))}
          </div>
        </>
      )}

      {/* Released Section */}
      {shownReleased.length > 0 && (
        <>
          <SectionHeader
            title="COMPLETED QUESTS"
            style={shownInProgress.length > 0 ? { marginTop: '30px' } : undefined}
          />
          <div className="projects-grid">
            {shownReleased.map((project, index) => renderProjectCard(project, index))}
          </div>
        </>
      )}

      <AchievementsSection />

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
};

// Logs Tab - 경력/활동 타임라인
const LogsTab = () => {
  const logs = [
    {
      year: '2026',
      events: [
        { date: '08', title: 'NoMoreRolls 프로토타입 완료', desc: '주사위 족보 전투 + Fight/Talk 이중 루트 프로토타입 완성, 플레이 영상 공개' },
        { date: '08', title: 'WORKFORGE-MCP 공개', desc: 'ChatGPT를 Windows 워크스테이션에 연결하는 MCP 게이트웨이 오픈소스 공개 (MCP 툴 12종, MIT)' },
        { date: '08', title: 'HEBE-AGENT-UNITY 공개', desc: 'Hera의 경량 실행 에디션 오픈소스 공개 (v0.0.1) — warm exec 240ms, cold 대비 6.08배 단축 벤치마크' },
        { date: '07', title: 'HERA-AGENT-GODOT v1.0.0 릴리스', desc: '안정 CLI 계약 + SemVer 채택, UI 테마 QA·스크린샷 diff 추가, Homebrew tap 배포' },
        { date: '06', title: 'RINGVERSE: KARVAS COMMAND 개발 시작', desc: '그리드 빌드 × 거점 디펜스 융합 모바일 게임 1인 개발 (코드명 Inventoria)' },
        { date: '06', title: 'HERA-AGENT-GODOT 개발 시작', desc: 'AI 에이전트용 라이브 Godot 에디터 제어 CLI 개발 (Godot Asset Store 등록)' },
        { date: '05', title: 'HERA-AGENT-UNITY 개발 시작', desc: 'AI 에이전트용 라이브 Unity 에디터 제어 저토큰 CLI 개발 (오픈소스, Apache-2.0) — Stars 22' },
        { date: '04', title: 'NoMoreRolls 개발 시작', desc: '언더테일의 도덕적 선택을 주사위 족보로 번역한 1인 개발 로그라이크 착수' },
        { date: '03', title: 'PORTFOLIO-BLOG 개발', desc: '터미널 스타일 포트폴리오 웹사이트 개발' },
      ]
    },
    {
      year: '2024',
      events: [
        
        { date: '01', title: 'Global Game Jam 2024 Seoul 참가', desc: '자신의 게임 개발 능력에 의심을 가지게 되어 참가' },
      ]
    },
    {
      year: '2021',
      events: [
        { date: '09', title: '블루포션 게임즈 입사 (현재 재직중)', desc: 'Unity 개발 - 에오스 레드 모바일 MMORPG 컨텐츠·BM 개발, 2021.09 ~ 현재까지 LIVE 서비스 참여' },
      ]
    },
    {
      year: '2020',
      events: [
        { date: '10', title: '뱅코 게임즈 입사', desc: 'Unity 개발 - 모바일 게임, 블루투스 연동 게임, VR 개발' },
      ]
    },
    {
      year: '2020',
      events: [
        { date: '09', title: '국비지원 유니티 개발자 양성 프로그램 수료', desc: '게임 개발 학습 및 최우수상 수여' },
      ]
    },
  ];

  return (
    <div className="tab-content">
      <SectionHeader title="ACTIVITY LOGS" />
      <div className="logs-timeline">
        {logs.map((yearGroup, idx) => (
          <div key={idx} className="log-year-group">
            <div className="log-year text-glow">{yearGroup.year}</div>
            <div className="log-events">
              {yearGroup.events.map((event, eventIdx) => (
                <motion.div 
                  key={eventIdx}
                  className="log-entry"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: eventIdx * 0.1 }}
                >
                  <span className="log-date">[{yearGroup.year}.{event.date}]</span>
                  <span className="log-title text-glow">{event.title}</span>
                  <span className="log-desc">{event.desc}</span>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Inventory Tab - 대외활동/수상내역
const InventoryTab = () => {
  const activities = [
    {
      year: '2026',
      title: 'Godot Asset Store 등록',
      type: 'PLATFORM',
      desc: 'hera-agent-godot 공식 애셋 스토어 배포\n- Homebrew tap 병행 배포\n- v1.0.0 안정 CLI 계약 공개',
      link: 'https://store.godotengine.org/asset/notnull92/hera-agent-godot/',
      linkLabel: 'VIEW ASSET',
    },
    {
      year: '2024',
      title: 'Global Game Jam 2024 Seoul 참가',
      type: 'GAME JAM',
      desc: '48시간 게임 개발 대회 참가\n- 3인팀으로 게임 아이디어 구상 및 개발\n- 게임 개발 과정에서의 문제 해결 능력 향상',
      link: 'https://globalgamejam.org/games/2024/mental-robo-2',
      linkLabel: 'VIEW GAME',
    },
    {
      year: '2021',
      title: '전북콘텐츠진흥원 국가지원사업 선정',
      type: 'FUNDING',
      desc: 'FREEDRAW — VR 드로잉 앱\n- 심사 결과 86점\n- ACTION GOLF 역시 동 사업 대상',
    },
    {
      year: '2020',
      title: '전북콘텐츠진흥원 국가지원사업 선정',
      type: 'FUNDING',
      desc: 'ZOMBIE KINGDOM — 조선시대 컨셉 모바일 슈팅\n- 지원금 50,000,000원\n- 구글 애드몹·인앱결제 적용 후 스토어 출시',
    },
    {
      year: '2020',
      title: '국비지원 유니티 개발자 양성 프로그램 수료',
      type: 'AWARD',
      desc: '게임 개발 학습 과정 수료\n- 최우수상 수여',
    },
  ];

  const getTypeColor = (type) => {
    switch (type) {
      case 'GAME JAM': return '#ff8800';
      case 'EXHIBITION': return '#a855f7';
      case 'COMMUNITY': return '#3b82f6';
      case 'FESTIVAL': return '#00ff41';
      case 'AWARD': return '#facc15';
      case 'FUNDING': return '#38bdf8';
      case 'PLATFORM': return '#f472b6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="tab-content">
      <SectionHeader title="ACTIVITIES & ACHIEVEMENTS" />
      <div className="inventory-grid">
        {activities.map((item, idx) => (
          <motion.div 
            key={idx}
            className="inventory-item"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            style={{ borderColor: getTypeColor(item.type) }}
          >
            <div className="item-year">{item.year}</div>
            <div className="item-title text-glow" style={{ color: getTypeColor(item.type) }}>
              {item.title}
            </div>
            <div className="item-type" style={{ color: getTypeColor(item.type) }}>
              [{item.type}]
            </div>
            <div className="item-desc">{item.desc}</div>
            {item.link && (
              <a 
                className="item-link"
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ borderColor: getTypeColor(item.type), color: getTypeColor(item.type) }}
              >
                [{item.linkLabel || 'LINK'}]
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Notes Tab - 직접 쓴 글 (아티클 / 시 / 철학 / 단상)
const NotesTab = () => {
  const [openNote, setOpenNote] = useState(null);

  return (
    <div className="tab-content">
      <SectionHeader title="PERSONAL ARCHIVE" />
      <div className="notes-list">
        {NOTES.map((note, idx) => {
          const meta = NOTE_TYPES[note.type] || { label: note.type, color: '#88ddaa' };
          return (
            <motion.button
              key={note.id}
              type="button"
              className="note-row tui-corners"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              onClick={() => setOpenNote(note)}
            >
              <span className="note-spine" style={{ background: meta.color }} aria-hidden="true" />
              <span className="note-main">
                <span className="note-head">
                  <span className="note-title text-glow">{note.title}</span>
                  <span
                    className="note-type"
                    style={{ color: meta.color, borderColor: `${meta.color}66` }}
                  >
                    {meta.label}
                  </span>
                </span>
                <span className="note-excerpt">{note.excerpt}</span>
                <span className="note-foot">
                  <span className="note-date">[{note.date}]</span>
                  <span className="note-open">{'[ OPEN POST ]'}</span>
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>
      {NOTES.length === 0 ? (
        <div className="notes-empty">{'>'} NO ENTRIES YET_</div>
      ) : (
        <div className="notes-hint text-glow">
          {'>'} 글을 선택하면 게시글이 열립니다. 하단의 <span className="hint-key">◀ ▶</span> 또는
          키보드 <span className="hint-key">←</span> <span className="hint-key">→</span> 로 페이지를 넘기고,{' '}
          <span className="hint-key">ESC</span> 로 닫습니다_
        </div>
      )}

      <AnimatePresence>
        {openNote && (
          <NoteBook key={openNote.id} note={openNote} onClose={() => setOpenNote(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

// Contact Tab - 연락처
const ContactTab = ({ onNavigate }) => {
  const contacts = [
    {
      label: 'GITHUB',
      value: 'github.com/NotNull92',
      url: 'https://github.com/NotNull92',
      icon: '[<>]'
    },
    {
      label: 'EMAIL',
      value: 'fatiger92@gmail.com',
      url: 'mailto:fatiger92@gmail.com',
      icon: '[::]'
    },
    {
      label: 'LINKEDIN',
      value: 'linkedin.com/in/youngjunji',
      url: 'https://www.linkedin.com/in/youngjunji/',
      icon: '[::]'
    },
    {
      label: 'BLOG',
      value: 'velog.io/@not_null_92',
      url: 'https://velog.io/@not_null_92',
      icon: '[::]'
    },
    {
      label: 'RESUME',
      value: 'PDF 준비 중 — 메일로 요청해 주세요',
      url: 'mailto:fatiger92@gmail.com?subject=%5BResume%20Request%5D%20Portfolio%20방문',
      icon: '[▼]'
    },
    {
      label: 'NOTES',
      value: `개인 서가 — 아티클 · 시 · 단상 ${NOTES.length}편`,
      tab: 'notes',
      icon: '[≡]'
    },
  ];

  return (
    <div className="tab-content">
      <SectionHeader title="CONTACT TRANSMISSION" />
      <div className="contact-list">
        {contacts.map((contact, idx) => {
          // tab 항목은 외부 링크가 아니라 내부 탭 이동이므로 button 으로 낸다
          const isInternal = Boolean(contact.tab);
          const Tag = isInternal ? motion.button : motion.a;
          const linkProps = isInternal
            ? { type: 'button', onClick: () => onNavigate?.(contact.tab) }
            : { href: contact.url, target: '_blank', rel: 'noopener noreferrer' };

          return (
            <Tag
              key={idx}
              {...linkProps}
              className={`contact-item ${isInternal ? 'internal' : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ borderColor: '#00ff41' }}
            >
              <span className="contact-icon text-glow">{contact.icon}</span>
              <div className="contact-info">
                <span className="contact-label">{contact.label}:</span>
                <span className="contact-value text-glow">{contact.value}</span>
              </div>
            </Tag>
          );
        })}
      </div>
      <div className="contact-hint text-glow">
        {'>'} CLICK TO CONNECT_
      </div>
    </div>
  );
};

const MARQUEE_TEXT =
  'UNITY DEVELOPER ▸ 5 YEARS EXPERIENCE ▸ RINGVERSE: KARVAS COMMAND ▸ NOMOREROLLS PROTOTYPE COMPLETE ▸ HERA-AGENT UNITY / GODOT ▸ HEBE-AGENT-UNITY ▸ GITHUB.COM/NOTNULL92 ▸ OPEN FOR TRANSMISSION ▸ ';

const formatTime = (date) =>
  date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

// 1초마다 이 컴포넌트만 리렌더 (MainPortfolio 전체 트리 리렌더 방지)
const UptimeClock = () => {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <span className="uptime-display">{formatTime(currentTime)}</span>;
};

const TABS = [
  { id: 'stat', label: 'STAT', icon: User },
  { id: 'logs', label: 'LOGS', icon: Clock },
  { id: 'quests', label: 'QUESTS', icon: Target },
  { id: 'inventory', label: 'INVENTORY', icon: Briefcase },
  { id: 'notes', label: 'NOTES', icon: BookOpen },
  { id: 'contact', label: 'CONTACT', icon: Mail },
];

// 탐험 도장 — 방문한 탭을 sessionStorage 에 도장 찍는다
// 재접속(새 탭/브라우저 재시작)마다 초기화: 매 세션 탐험을 새로 시작한다.
// 업적·하이스코어는 localStorage 라 세션이 바뀌어도 유지된다.
const EXPL_KEY = 'tui-explored-tabs';
const EXPL_SEEN_KEY = 'tui-expl-unlock-seen';

const persistExplored = (set) => {
  try {
    sessionStorage.setItem(EXPL_KEY, JSON.stringify([...set]));
  } catch {
    /* sessionStorage 사용 불가 시 무시 */
  }
};

const readExplored = () => {
  try {
    const arr = JSON.parse(sessionStorage.getItem(EXPL_KEY));
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const MainPortfolio = () => {
  const [activeTab, setActiveTab] = useState('stat');
  const tabs = TABS;

  // 첫 진입 탭(stat)은 마운트 시점에 도장
  const [explored, setExplored] = useState(() => {
    const s = readExplored();
    if (!s.has('stat')) {
      s.add('stat');
      persistExplored(s);
    }
    return s;
  });
  // 해금 배너도 세션 단위 — 매 세션 6/6 달성 순간마다 다시 띄운다
  const [unlockSeen, setUnlockSeen] = useState(() => {
    try {
      return sessionStorage.getItem(EXPL_SEEN_KEY) === '1';
    } catch {
      return true;
    }
  });

  // 탭 전환 + 탐험 도장
  const visitTab = useCallback((id) => {
    setActiveTab(id);
    setExplored((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      persistExplored(next);
      if (next.size >= TABS.length) unlockAchievement('full-scan');
      return next;
    });
  }, []);

  // 업적 시스템 이전에 탐험을 끝낸 방문자 소급 처리
  // (토스트 리스너가 형제 컴포넌트라 마운트 완료 후로 지연)
  useEffect(() => {
    if (explored.size < TABS.length) return;
    const t = setTimeout(() => unlockAchievement('full-scan'), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const explComplete = explored.size >= TABS.length;
  // null | 'hub' | 'nullstorm' — 게임 [X]/ESC 는 허브로, 허브 [X]/ESC 는 포트폴리오로
  const [arcadeView, setArcadeView] = useState(null);

  const dismissUnlock = () => {
    try {
      sessionStorage.setItem(EXPL_SEEN_KEY, '1');
    } catch {
      /* sessionStorage 사용 불가 시 무시 */
    }
    setUnlockSeen(true);
  };

  // 숫자키 1~5로 탭 전환
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < TABS.length) visitTab(TABS[idx].id);
    };
    if (arcadeView !== null) return; // 아케이드 중에는 탭 단축키 비활성
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visitTab, arcadeView]);

  return (
    <motion.div 
      className="portfolio-container crt-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AsciiRain opacity={0.12} />
      <div className="portfolio-content">
        {/* Header — 시스템 상태바 */}
        <div className="portfolio-header">
          <div className="header-title text-glow-strong">
            <ScrambleText text="> PORTFOLIO TERMINAL v2.0" duration={800} rescrambleOnHover />
          </div>
          <div className="header-readouts text-glow">
            <span className="readout">
              <span className="readout-label">USER</span> GUEST
            </span>
            <span className="readout">
              <span className="readout-label">MEM</span> 64K OK
            </span>
            <span className="readout">
              <span className="readout-label">STATUS</span>{' '}
              <span className="status-online">ONLINE</span>
            </span>
            {explComplete ? (
              <button
                type="button"
                className="readout expl-arcade-btn"
                title="NULLSTORM 실행"
                onClick={() => setArcadeView('hub')}
              >
                <span className="readout-label">EXPL</span> {explored.size}/{TABS.length}
                <span className="expl-star"> ★</span>
                <span className="expl-play"> ▶ PLAY</span>
              </button>
            ) : (
              <span className="readout" title="탭을 모두 방문하면 시크릿이 해금됩니다">
                <span className="readout-label">EXPL</span> {explored.size}/{TABS.length}
              </span>
            )}
            <span className="readout">
              <span className="readout-label">UPTIME</span> <UptimeClock />
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${explored.has(tab.id) ? 'visited' : ''}`}
              onClick={() => visitTab(tab.id)}
            >
              {activeTab === tab.id && (
                <motion.span
                  layoutId="tab-active"
                  className="tab-active-bg"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="tab-fkey">{i + 1}</span>
              <tab.icon size={16} />
              <span>[ {tab.label} ]</span>
            </button>
          ))}
        </div>

        {/* 탐험 완료 보상 배너 (1회성) — 히든 아케이드 해금 */}
        <AnimatePresence>
          {explComplete && !unlockSeen && (
            <motion.div
              className="unlock-banner"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <span className="unlock-msg">
                ★ EXPLORATION COMPLETE — 전 구역 탐사 완료, 히든 아케이드가 해금되었습니다!
              </span>
              <button
                type="button"
                className="unlock-play"
                onClick={() => {
                  dismissUnlock();
                  setArcadeView('hub');
                }}
              >
                ▶ OPEN ARCADE
              </button>
              <button type="button" className="unlock-dismiss" onClick={dismissUnlock}>[X]</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content */}
        <div className="tab-container">
          <AnimatePresence mode="wait">
            {activeTab === 'stat' && <motion.div key="stat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="tab-wrapper"><StatTab /></motion.div>}
            {activeTab === 'logs' && <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="tab-wrapper"><LogsTab /></motion.div>}
            {activeTab === 'quests' && <motion.div key="quests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="tab-wrapper"><QuestsTab /></motion.div>}
            {activeTab === 'inventory' && <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="tab-wrapper"><InventoryTab /></motion.div>}
            {activeTab === 'notes' && <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="tab-wrapper"><NotesTab /></motion.div>}
            {activeTab === 'contact' && <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="tab-wrapper"><ContactTab onNavigate={visitTab} /></motion.div>}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="portfolio-footer">
          <span className="text-glow footer-ready">{'>'} SYSTEM READY_</span>
          <span className="cursor-blink">█</span>
          <div className="footer-marquee" aria-hidden="true">
            <div className="marquee-track">
              <span>{MARQUEE_TEXT}</span>
              <span>{MARQUEE_TEXT}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 히든 아케이드 — 허브(게임 선택) → 게임, 게임을 닫으면 허브로 복귀 */}
      <AnimatePresence mode="wait">
        {arcadeView === 'hub' && (
          <ArcadeHub
            key="hub"
            onClose={() => setArcadeView(null)}
            onSelect={(id) => setArcadeView(id)}
          />
        )}
        {arcadeView === 'nullstorm' && (
          <NullStorm key="nullstorm" onClose={() => setArcadeView('hub')} />
        )}
        {arcadeView === 'nulldive' && (
          <NullDive key="nulldive" onClose={() => setArcadeView('hub')} />
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default MainPortfolio;