import { useEffect } from 'react';
import { motion } from 'framer-motion';
import './ResumeView.css';

// RESUME — 채용 담당자용 패스트패스 (한 화면 요약)
// 원본 이력서 PDF 는 민감 정보(연락처·주소 등) 때문에 게시하지 않고,
// 알맹이만 발췌해 웹 뷰로 제공한다. 연락처는 공개 채널만.
// 이 뷰만 사이트의 CRT 초록 테마를 벗고 흰 바탕 문서로 렌더된다 — 채용 담당자 시인성 우선.
// CRT 이펙트 레이어는 body.resume-open 동안 꺼진다 (ResumeView.css)
//
// [문서 구조의 근거]
// 게임업계 채용 담당자는 6~10초 F패턴 스캔에서 ①출시작 ②기술 스택 ③플레이 가능한 링크
// 세 가지를 먼저 확인한다. 그래서 배치 순서를 스캔 순서에 맞췄다:
//   헤더(이름·포지셔닝·스택 칩·링크) → 개인 기여 지표 → 01 출시작 → 02 경력 → 03 사이드 → 04 스킬 → 05 기타
// 지표 칸에는 "내가 만든 결과"만 넣는다. 프로젝트 규모(MAU·매출)는 출시작 행의
// '프로젝트 지표'로 분리 표기한다 — 회사 성과를 개인 성과처럼 읽히게 두지 않기 위해서다.

const CAREER_START = { year: 2020, month: 10 }; // Unity 커리어 시작 (뱅코 입사)

// "2020.10 ~ 현재" 옆에 붙는 실제 경력 길이. 하드코딩하면 반드시 낡는다.
const tenureText = () => {
  const now = new Date();
  const months =
    (now.getFullYear() - CAREER_START.year) * 12 + (now.getMonth() + 1 - CAREER_START.month);
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y <= 0) return `${m}개월`;
  return m > 0 ? `${y}년 ${m}개월` : `${y}년`;
};

const CONTACTS = [
  { label: 'EMAIL', value: 'fatiger92@gmail.com', href: 'mailto:fatiger92@gmail.com' },
  { label: 'GITHUB', value: 'github.com/NotNull92', href: 'https://github.com/NotNull92' },
  { label: 'LINKEDIN', value: 'linkedin.com/in/youngjunji', href: 'https://www.linkedin.com/in/youngjunji/' },
  { label: 'BLOG', value: 'velog.io/@not_null_92', href: 'https://velog.io/@not_null_92' },
];

// 스캔 3순위(엔진·언어 매칭)를 헤더에서 바로 확인할 수 있도록 상단에 칩으로 노출
const STACK = ['Unity', 'C#', 'UniRx / UniTask', 'Addressables', 'UI Toolkit', 'Jenkins CI', 'Go', 'Godot'];

// 전부 "내가 설계·구현한 결과". 회사 규모 지표는 여기 넣지 않는다.
const IMPACT = [
  { value: '30%', label: 'BM 매출 기여', sub: '스텝업 패키지 설계·개발' },
  { value: '45%', label: '상품 팝업 전환율', sub: '유저 행동 기반 조건부 노출' },
  { value: '85%↓', label: '월드 랭킹 서버 부하', sub: '랭킹 갱신 구조 재설계' },
  { value: '90%↓', label: '휴면 계정 운영 공수', sub: '유니크 식별자 재사용 시스템' },
];

// 게임 이력서의 1순위 — 출시작을 문장 속에 묻지 않고 행으로 세운다
const SHIPPED = [
  {
    name: 'EOS RED',
    platform: 'Android / iOS',
    genre: '모바일 MMORPG · 라이브 서비스',
    period: '2021.09 ~ 현재',
    role: '클라이언트 개발 (팀 7~8인) — 길드 경쟁전·전용 PVE 던전·BM 3종·빌드/패치·점검',
    scale: '프로젝트 지표 — MAU 최대 3.5만 / DAU 1.2만 · 월 매출 최대 400억 (6년차 서비스)',
    links: [
      { label: 'GOOGLE PLAY', url: 'https://play.google.com/store/apps/details?id=com.bluepotiongames.eosm&pcampaignid=web_share' },
    ],
  },
  {
    name: 'FREE DRAW',
    platform: 'PC VR · SteamVR',
    genre: 'VR 3D 드로잉 툴',
    period: '2021.03 출시',
    role: 'Oculus Rift → Quest 포팅 · TCP 소켓 모바일 관전 연동 · 갤러리 룸/녹화 기능',
    scale: 'Steam 정식 출시 · 전북콘텐츠진흥원 국가지원사업 평가 86점',
    links: [
      { label: 'STEAM', url: 'https://store.steampowered.com/app/1539810/FreeDraw/' },
    ],
  },
  {
    name: 'ZOMBIE KINGDOM',
    platform: 'Android',
    genre: '모바일 슈팅 · 1인 개발',
    period: '2020.12 출시',
    role: '조선시대 컨셉 전면 리메이크 · JSON 다국어 시스템 · AdMob/IAP 연동 후 스토어 출시',
    scale: '전북콘텐츠진흥원 지원사업 선정 — 프로젝트 지원금 5,000만 원',
    links: [],
  },
  {
    name: 'ACTION GOLF',
    platform: 'Android + Arduino',
    genre: '자이로 센서 하드웨어 연동 골프',
    period: '2021.04 출시',
    role: '메인 개발자 인수인계 후 담당 (2인 팀) — 블루투스 센서 통신 리팩토링·UI 리뉴얼·상점 BM 추가',
    scale: '실물 센서 ↔ 게임 클라이언트 실시간 연동',
    links: [
      { label: '플레이 영상', url: 'https://drive.google.com/file/d/1m1fkNzGY1tKGw5mvhPq-CL2nKHApZ5TD/view' },
    ],
  },
];

const CAREERS = [
  {
    period: '2021.09 ~ 재직중',
    company: '블루포션게임즈',
    team: '레드클라이언트팀 · Unity 클라이언트 개발',
    bullets: [
      '길드 경쟁전과 전용 PVE 던전 개발·리뉴얼 — 협업 미션 5종 설계, 서버·기획과 스펙 조율',
      'BM 시스템 3종 개발 — 스텝업 패키지(매출 기여 30%)·조건부 팝업(전환율 45%)·1+1 상품',
      '월드 랭킹 갱신 구조를 재설계해 서버 부하 85% 감소, 휴면 계정 처리 자동화로 운영 공수 90% 절감',
      '길드 추천 시스템(가입률 +30%)·보스 던전 리뉴얼(참여율 +35%)·콜로세움 개선(일일 참여율 +150%)',
      '국내 클라이언트 점검, Android/iOS 빌드 및 패치 배포, BTS 이슈 대응 담당',
    ],
  },
  {
    period: '2020.10 ~ 2021.09',
    company: '뱅코게임즈',
    team: '개발팀 파트장 · Unity 멀티플랫폼 개발',
    bullets: [
      '1년 사이 모바일·PC VR·하드웨어 연동 3개 타이틀을 출시까지 담당 (위 SHIPPED 참조)',
      '스토어 출시 실무 — AdMob·인앱결제 연동, 다국어 대응, 빌드 및 스토어 등록',
      '전북콘텐츠진흥원 국가지원사업 2건 참여 — 좀비 킹덤(지원금 5,000만 원)·프리 드로우(평가 86점)',
    ],
  },
];

const SIDE_PROJECTS = [
  {
    name: 'NoMoreRolls',
    tag: '1인 개발',
    desc: '주사위 족보 로그라이크 — 언더테일식 Fight/Talk 이중 루트. 프로토타입 완료, Steam 출시 예정',
    links: [{ label: '플레이 영상', url: 'https://youtu.be/kqOMakdCoEc' }],
  },
  {
    name: 'RINGVERSE: KARVAS COMMAND',
    tag: '1인 개발',
    desc: '그리드 빌드 × 거점 디펜스 PC 게임 — 개발 진행 중, Steam 출시 예정',
    links: [],
  },
  {
    name: 'hera-agent-unity / hera-agent-godot',
    tag: '오픈소스',
    desc: 'AI 에이전트용 라이브 에디터 제어 CLI 2종 (Go) — OpenUPM · Godot Asset Store 공식 등록',
    links: [
      { label: 'UNITY', url: 'https://github.com/NotNull92/hera-agent-unity' },
      { label: 'GODOT', url: 'https://store.godotengine.org/asset/notnull92/hera-agent-godot/' },
    ],
  },
  {
    name: 'hebe-agent-unity · workforge-mcp',
    tag: '오픈소스',
    desc: 'Unity 실행 런타임(warm 240ms, cold 대비 6.08배 단축) · ChatGPT용 MCP 게이트웨이(툴 12종)',
    links: [
      { label: 'HEBE', url: 'https://github.com/NotNull92/hebe-agent-unity' },
      { label: 'WORKFORGE', url: 'https://github.com/NotNull92/workforge-mcp' },
    ],
  },
  {
    name: 'MENTAL ROBO',
    tag: '게임잼',
    desc: 'Global Game Jam 2024 Seoul — 3인 팀 메인 개발, 48시간 완성작 (리듬 입력 스탠드업 코미디)',
    links: [{ label: 'GGJ', url: 'https://globalgamejam.org/games/2024/mental-robo-2' }],
  },
];

const SKILLS = [
  { group: '주력', items: `C# · Unity — 모바일 클라이언트 / 라이브 서비스 (${tenureText()})` },
  { group: '라이브러리', items: 'UniRx · UniTask · DOTween · Odin Inspector · UI Toolkit · Addressables · OSA' },
  { group: '툴링', items: 'Go · GDScript · Git / SVN · Jenkins CI · Gitea · RedMine' },
  { group: '도메인', items: 'BM 설계 · 서버-클라 프로토콜 협업 · Android/iOS 빌드·배포 · VR(SteamVR/Quest) · 블루투스 하드웨어 연동' },
];

const ETC = [
  '학력 — 안산공과대학 컴퓨터정보과 졸업',
  '수상 — 게임프로그래밍개발자 양성 과정 최우수상 (2020)',
  '자격 — 네트워크관리사 2급 (국가공인)',
  '어학 — 영어 일상회화 (호주 4년 거주)',
];

// 섹션 헤더 — 번호를 붙여 읽는 순서를 눈에 보이게 고정한다
const SectionTitle = ({ no, children, en }) => (
  <h3 className="resume-section-title">
    <span className="resume-section-no">{no}</span>
    <span className="resume-section-en">{children}</span>
    {en && <span className="resume-section-ko">{en}</span>}
  </h3>
);

const LinkPills = ({ links }) =>
  links && links.length > 0 ? (
    <span className="resume-pills">
      {links.map((l) => (
        <a
          key={l.url}
          className="resume-pill"
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          ▶ {l.label}
        </a>
      ))}
    </span>
  ) : null;

const ResumeView = ({ onClose }) => {
  // 인쇄 시 이력서만 나오도록 바디에 마커 클래스
  useEffect(() => {
    document.body.classList.add('resume-open');
    return () => document.body.classList.remove('resume-open');
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      className="resume-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="resume-sheet"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
      >
        <div className="resume-toolbar">
          <span className="resume-toolbar-title">RESUME — 30초 요약</span>
          <button type="button" className="resume-btn" onClick={() => window.print()}>
            PRINT / PDF
          </button>
          <button type="button" className="resume-btn resume-btn-ghost" onClick={onClose}>
            닫기 [ESC]
          </button>
        </div>

        <header className="resume-head">
          <div className="resume-identity">
            <h2 className="resume-name">
              지영준 <span className="resume-alias">YOUNGJUN JI · NOTNULL</span>
            </h2>
            <p className="resume-role">
              Unity 게임 클라이언트 개발자
              <span className="resume-role-sep">·</span>
              <span className="resume-tenure">2020.10 ~ 현재 ({tenureText()})</span>
              <span className="resume-status">재직중</span>
            </p>
            <p className="resume-pitch">
              라이브 MMORPG 콘텐츠·BM 개발 <strong>5년</strong>,
              상용 출시 <strong>4종</strong>, 개발자 도구 오픈소스 <strong>4종</strong> —
              만든 것으로 증명하는 개발자입니다.
            </p>
            <ul className="resume-stack" aria-label="핵심 기술 스택">
              {STACK.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>

          <ul className="resume-contacts">
            {CONTACTS.map((c) => (
              <li key={c.label}>
                <span className="resume-label">{c.label}</span>
                <a href={c.href} target="_blank" rel="noopener noreferrer">
                  {c.value}
                </a>
              </li>
            ))}
          </ul>
        </header>

        <section className="resume-metrics" aria-label="개인 기여 성과">
          <p className="resume-metrics-cap">직접 설계·구현해 만든 결과</p>
          <div className="resume-metrics-grid">
            {IMPACT.map((m) => (
              <div className="resume-metric" key={m.label}>
                <span className="resume-metric-value">{m.value}</span>
                <span className="resume-metric-label">{m.label}</span>
                <span className="resume-metric-sub">{m.sub}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="resume-block">
          <SectionTitle no="01" en="출시작">SHIPPED TITLES</SectionTitle>
          <div className="resume-ships">
            {SHIPPED.map((s) => (
              <article className="resume-ship" key={s.name}>
                <div className="resume-ship-top">
                  <strong className="resume-ship-name">{s.name}</strong>
                  <span className="resume-ship-platform">{s.platform}</span>
                  <span className="resume-ship-period">{s.period}</span>
                </div>
                <p className="resume-ship-genre">{s.genre}</p>
                <p className="resume-ship-role">{s.role}</p>
                <p className="resume-ship-scale">
                  {s.scale}
                  <LinkPills links={s.links} />
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="resume-block">
          <SectionTitle no="02" en="경력">CAREER</SectionTitle>
          {CAREERS.map((c) => (
            <article className="resume-career" key={c.company}>
              <div className="resume-career-head">
                <strong>{c.company}</strong>
                <span className="resume-period">{c.period}</span>
              </div>
              <p className="resume-career-role">{c.team}</p>
              <ul>
                {c.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="resume-block">
          <SectionTitle no="03" en="사이드 · 오픈소스">SIDE PROJECTS</SectionTitle>
          <ul className="resume-side">
            {SIDE_PROJECTS.map((p) => (
              <li key={p.name}>
                <span className="resume-side-head">
                  <strong>{p.name}</strong>
                  <span className="resume-side-tag">{p.tag}</span>
                </span>
                <span className="resume-side-desc">
                  {p.desc}
                  <LinkPills links={p.links} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="resume-block">
          <SectionTitle no="04" en="기술">SKILLS</SectionTitle>
          <ul className="resume-skills">
            {SKILLS.map((s) => (
              <li key={s.group}>
                <span className="resume-label">{s.group}</span>
                <span>{s.items}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="resume-block">
          <SectionTitle no="05" en="기타">ETC</SectionTitle>
          <ul className="resume-etc">
            {ETC.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </section>

        <footer className="resume-foot">
          <span className="resume-foot-main">
            이 이력서를 띄우고 있는 사이트도 직접 만들었습니다 — React 19 · Canvas 미니게임 2종 내장.
            프로젝트 상세와 스크린샷은 <strong>PROJECTS</strong> 탭에 있습니다.
          </span>
          <span className="resume-foot-hint">ESC 닫기 · Ctrl+P 인쇄/PDF 저장</span>
        </footer>
      </motion.div>
    </motion.div>
  );
};

export default ResumeView;
