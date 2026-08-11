import { useEffect } from 'react';
import { motion } from 'framer-motion';
import './ResumeView.css';

// RESUME — 채용 담당자용 패스트패스 (한 화면 요약)
// 원본 이력서 PDF 는 민감 정보(연락처·주소 등) 때문에 게시하지 않고,
// 알맹이만 발췌해 웹 뷰로 제공한다. 연락처는 이메일·GitHub 만.
// Ctrl+P 인쇄 시 CRT 장식이 빠진 흑백 문서로 출력된다 (ResumeView.css @media print)

const CONTACTS = [
  { label: 'EMAIL', value: 'fatiger92@gmail.com', href: 'mailto:fatiger92@gmail.com' },
  { label: 'GITHUB', value: 'github.com/NotNull92', href: 'https://github.com/NotNull92' },
];

const METRICS = [
  { value: '30%', label: 'BM 매출 기여', sub: '스텝업 패키지 설계·개발' },
  { value: '35K', label: '라이브 MAU', sub: '모바일 MMORPG 운영 참여' },
  { value: '400억', label: '월 매출 게임 라이브', sub: '6년차 서비스 현역 참여 중' },
  { value: '4종', label: '오픈소스 공개', sub: 'OpenUPM·Godot Asset Store 배포' },
];

const CAREERS = [
  {
    period: '2021.09 ~ 재직중',
    company: '블루포션게임즈 · 레드클라이언트팀',
    role: 'Unity 클라이언트 개발 — EOS RED (라이브 모바일 MMORPG)',
    bullets: [
      '길드 경쟁전 + 전용 PVE 던전 개발·리뉴얼 (미션 5종 설계, 서버·기획 협업)',
      'BM 3종 개발 — 스텝업 패키지(매출 기여 30%)·조건부 팝업(전환율 45%)·1+1 상품',
      '월드 랭킹 재설계로 서버 부하 85% 감소, 휴면 계정 처리로 운영 공수 90% 절감',
      '국내 클라이언트 점검·AOS/iOS 빌드 및 패치·BTS 대응 담당',
    ],
  },
  {
    period: '2020.10 ~ 2021.09',
    company: '뱅코 · 개발팀',
    role: '파트장 — Unity 멀티플랫폼 개발',
    bullets: [
      '좀비 킹덤: 조선시대 리컨셉·다국어 시스템·애드몹/IAP 연동, 스토어 출시',
      '액션 골프: 아두이노 자이로 센서 × 블루투스 통신 리팩토링, 상점 BM 추가',
      '프리 드로우(VR): Rift→Quest 포팅, TCP 모바일 관전 연동, Steam 정식 출시',
    ],
  },
];

const SIDE_PROJECTS = [
  { name: 'NoMoreRolls', desc: '주사위 족보 로그라이크 — 1인 개발, 프로토타입 완료, Steam 출시 예정' },
  { name: 'RINGVERSE: KARVAS COMMAND', desc: '그리드 빌드 × 거점 디펜스 PC 게임 — 1인 개발 진행 중, Steam 출시 예정' },
  { name: 'hera-agent-unity / godot', desc: 'AI 에이전트용 라이브 에디터 제어 CLI 2종 — 오픈소스, Godot Asset Store 등록' },
  { name: 'hebe-agent-unity · workforge-mcp', desc: 'Unity 실행 런타임(warm 240ms) · ChatGPT MCP 게이트웨이 — 오픈소스' },
];

const SKILLS = [
  { group: '주력', items: 'C# (6년) · Unity (모바일 클라이언트 / 라이브 서비스)' },
  { group: '툴링', items: 'Go · GDScript · Git / SVN · Jenkins CI' },
  { group: '라이브러리', items: 'UniRx · DOTween · Odin Inspector · UniTask · UI Toolkit · Addressables' },
  { group: '경험', items: 'BM 설계 · 서버-클라 통신 · AOS/iOS 빌드·배포 · VR(SteamVR/Quest) · BT 하드웨어 연동' },
];

const ETC = [
  '학력 — 안산공과대학 컴퓨터정보과 졸업',
  '수상 — 게임프로그래밍개발자 양성 과정 최우수상 (2020)',
  '자격 — 네트워크관리사 2급 (국가공인)',
  '어학 — 영어 일상회화 (호주 4년 거주)',
];

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
          <span className="resume-toolbar-title">▶ RESUME — 30초 요약</span>
          <button type="button" className="resume-btn" onClick={() => window.print()}>
            [ PRINT / PDF ]
          </button>
          <button type="button" className="resume-btn" onClick={onClose}>[X]</button>
        </div>

        <header className="resume-head">
          <div>
            <h2 className="resume-name">지영준 <span className="resume-alias">YOUNGJUN JI · NOTNULL</span></h2>
            <p className="resume-role">
              Unity 게임 클라이언트 개발자 — Unity/C# 2020.10~현재 · EOS RED 라이브서비스 2021.09~현재
            </p>
          </div>
          <ul className="resume-contacts">
            {CONTACTS.map((c) => (
              <li key={c.label}>
                <span className="resume-label">{c.label}</span>
                <a href={c.href} target="_blank" rel="noopener noreferrer">{c.value}</a>
              </li>
            ))}
          </ul>
        </header>

        <section className="resume-metrics" aria-label="핵심 성과">
          {METRICS.map((m) => (
            <div className="resume-metric" key={m.label}>
              <span className="resume-metric-value">{m.value}</span>
              <span className="resume-metric-label">{m.label}</span>
              <span className="resume-metric-sub">{m.sub}</span>
            </div>
          ))}
        </section>

        <section>
          <h3 className="resume-section-title">CAREER</h3>
          {CAREERS.map((c) => (
            <article className="resume-career" key={c.company}>
              <div className="resume-career-head">
                <strong>{c.company}</strong>
                <span className="resume-period">{c.period}</span>
              </div>
              <p className="resume-career-role">{c.role}</p>
              <ul>
                {c.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </article>
          ))}
        </section>

        <section>
          <h3 className="resume-section-title">SIDE PROJECTS / OPEN SOURCE</h3>
          <ul className="resume-side">
            {SIDE_PROJECTS.map((p) => (
              <li key={p.name}><strong>{p.name}</strong> — {p.desc}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="resume-section-title">SKILLS</h3>
          <ul className="resume-skills">
            {SKILLS.map((s) => (
              <li key={s.group}>
                <span className="resume-label">{s.group}</span>
                <span>{s.items}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="resume-section-title">ETC</h3>
          <ul className="resume-etc">
            {ETC.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </section>

        <footer className="resume-foot">
          <span>상세 프로젝트 기록·플레이 가능한 데모는 이 사이트의 QUESTS(PROJECTS) 탭에 있습니다.</span>
          <span className="resume-foot-hint">ESC 닫기 · Ctrl+P 인쇄/PDF 저장</span>
        </footer>
      </motion.div>
    </motion.div>
  );
};

export default ResumeView;
