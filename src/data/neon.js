// NeonPortfolio 데이터 — 리디자인 B (Neon Cinematic)
// 이미지 전부 Vite import (배포 시 해시 번들링)
import nmrTitle from '../assets/projects/nomorerolls-title.webp';
import nmrBattle from '../assets/projects/nomorerolls-battle.webp';
import nmrCorridor from '../assets/projects/nomorerolls-corridor.webp';
import nmrTalk from '../assets/projects/nomorerolls-talk.webp';
import monstelPlay from '../assets/projects/monstel-play.webp';
import monstelVideo from '../assets/projects/monstel-preview-2x.mp4';
import eosredKeyart from '../assets/projects/eosred-keyart.webp';
import freedrawDrawing from '../assets/projects/freedraw-drawing.webp';
import freedrawGallery from '../assets/projects/freedraw-gallery.webp';
import zombieVillage from '../assets/projects/zombie-village.webp';
import zombieGameplay from '../assets/projects/zombie-gameplay.webp';
import zombieShop from '../assets/projects/zombie-shop.webp';
import zombieCharacters from '../assets/projects/zombie-characters.webp';
import golfTitle from '../assets/projects/actiongolf-title.webp';
import golfLobby from '../assets/projects/actiongolf-lobby.webp';
import golfShop from '../assets/projects/actiongolf-shop.webp';
import golfSensor from '../assets/projects/actiongolf-sensor.webp';
import heraAgentLogo from '../assets/projects/hera-agent-logo.webp';
import heraUnityLogo from '../assets/projects/hera-unity-logo.webp';
import heraGodotLogo from '../assets/projects/hera-godot-logo.png';
import hebeLogo from '../assets/projects/hebe-logo.webp';
import workforgeLogo from '../assets/projects/workforge-logo.webp';

export const HERA_UNITY = { version: 'v0.3.17', connector: '0.2.10', released: '2026.10.21', guide: '/hera-guide/' };

export const METRICS = [
  { num: 4, suffix: '종', label: '상용 게임 출시', sub: '모바일 3 · PC VR 1 (Steam·Play)' },
  { num: 30, suffix: '%', label: 'BM 매출 비중', sub: '스텝업 패키지 설계·개발' },
  { num: 85, suffix: '%↓', label: '서버 부하 감소', sub: '월드 랭킹 갱신 구조 재설계' },
  { num: 5, suffix: '종', label: '오픈소스 공개', sub: 'OpenUPM·Godot Asset Store 배포' },
];

export const WORKS = [
  {
    name: 'MONSTEL', badge: 'IN DEVELOPMENT', badgeTone: 'amber',
    period: 'IN DEV · 비공개 테스트 준비 중', genre: 'MOBILE IDLE TYCOON · GODOT · 1인 개발',
    pitch: '괴물 손님을 같은 종족끼리 이어 접수하고, 엘리베이터로 운송·정산하며 호텔을 키우는 모바일 방치형 타이쿤',
    points: [
      '1인 개발 — 접수→운송→정산→자동화, 특수 호텔 6종의 완성→매각→재건축 성장 루프 (Godot 4 .NET · C#)',
      '직원 뽑기·스킬 · 편지 30통·기념품 10개 · 포토 모드·매각 시상 카드 · 자작 툴(hera-agent-godot)과 Android 실기로 QA',
    ],
    media: [{ type: 'video', src: monstelVideo, poster: monstelPlay, alt: '몬스텔 Android 플레이 영상 · 2배속' }],
    links: [{ label: 'GAMEPLAY VIDEO · 2×', url: monstelVideo }],
  },
  {
    name: 'NoMoreRolls', badge: 'IN DEVELOPMENT', badgeTone: 'amber',
    period: 'IN DEV · 2026 스마일게이트 IndieGo 출품', genre: 'ROGUELIKE · DICE PEDIGREE · 1인 개발',
    pitch: '언더테일의 도덕적 선택을 주사위 족보 메커닉으로 번역한 로그라이크 (Steam 출시 예정)',
    points: [
      '1인 개발 — 기획(GDD 23섹션)·전투·연출·아키텍처 전부',
      '프로토타입 완성·플레이 영상 공개 (족보 판정 10종 + Fight/Talk 이중 루트)',
    ],
    media: [
      { src: nmrTitle, alt: '타이틀 화면' },
      { src: nmrBattle, alt: '전투 — 주사위 굴림/LOCK, 족보 기록' },
      { src: nmrCorridor, alt: '복도 진행 — 문 선택' },
      { src: nmrTalk, alt: 'Talk 루트 성공' },
    ],
    links: [{ label: 'GAMEPLAY VIDEO', url: 'https://youtu.be/kqOMakdCoEc' }],
  },
  {
    name: 'EOS-RED', badge: 'SHIPPED', badgeTone: 'green',
    period: 'LIVE · 2021.09 ~ 현재', genre: 'MOBILE MMORPG · LIVE SERVICE',
    pitch: '월 매출 최대 400억 라이브 모바일 MMORPG',
    points: [
      '2021.09부터 클라이언트 개발 — 콘텐츠·BM·빌드/패치·점검 담당',
      '스텝업 패키지 BM 매출 비중 30% · 서버 부하 85% 감소 · MAU 35K 서비스 유지',
    ],
    media: [{ src: eosredKeyart, alt: 'EOS RED 공식 키아트' }],
    links: [{ label: 'GOOGLE PLAY', url: 'https://play.google.com/store/apps/details?id=com.bluepotiongames.eosm&pcampaignid=web_share' }],
  },
  {
    name: 'FREEDRAW', badge: 'SHIPPED', badgeTone: 'green',
    period: 'RELEASED', genre: 'VR 3D DRAWING · STEAM',
    pitch: 'VR 공간에 브러시로 직접 그리는 3D 드로잉 앱',
    points: [
      '개발 · Rift→Quest 포팅 · TCP 모바일 관전 연동',
      'Steam 정식 출시 (2021.03) · 국가지원사업 평가 86점',
    ],
    media: [
      { src: freedrawDrawing, alt: 'VR 3D 드로잉' },
      { src: freedrawGallery, alt: '갤러리 룸' },
    ],
    links: [{ label: 'STEAM', url: 'https://store.steampowered.com/app/1539810/FreeDraw/' }],
  },
  {
    name: 'ZOMBIE KINGDOM', badge: 'SHIPPED', badgeTone: 'green',
    period: 'RELEASED', genre: 'MOBILE SHOOTER · 1인 리메이크',
    pitch: '조선시대 컨셉으로 전면 리메이크한 모바일 탄막 슈팅',
    points: [
      '1인 리메이크 — 컨셉 전환·다국어 시스템·수익화(애드몹/IAP)',
      'Android 출시 · 전북콘텐츠진흥원 지원사업 선정 (지원금 5,000만 원)',
    ],
    media: [
      { src: zombieVillage, alt: '조선시대 컨셉 마을' },
      { src: zombieGameplay, alt: '인게임 웨이브 방어' },
      { src: zombieShop, alt: '상점 UI' },
      { src: zombieCharacters, alt: '조선 병사 캐릭터' },
    ],
    links: [],
  },
  {
    name: 'ACTION GOLF', badge: 'SHIPPED', badgeTone: 'green',
    period: 'RELEASED', genre: 'GYRO SENSOR GOLF · HARDWARE',
    pitch: '아두이노 자이로 센서로 실제 스윙을 인식하는 모바일 골프 게임',
    points: [
      '2인 팀 — 블루투스 통신 리팩토링 · 상점 BM 추가',
      '센서 반응 속도·안정성 개선 · Android 출시',
    ],
    media: [
      { src: golfTitle, alt: 'ACTION GOLF 타이틀' },
      { src: golfSensor, alt: '자이로 센서 스윙' },
      { src: golfShop, alt: '상점 시스템' },
      { src: golfLobby, alt: '로비' },
    ],
    links: [],
  },
];

export const OSS = [
  { name: 'heraAgent', repo: 'NotNull92/heraAgent', logo: heraAgentLogo, url: 'https://github.com/NotNull92/heraAgent', desc: '터미널 CLI/TUI 코딩 에이전트 · Windows·macOS · 소스 프리뷰', license: 'Apache-2.0' },
  { name: 'hera-agent-unity', repo: 'NotNull92/hera-agent-unity', logo: heraUnityLogo, url: 'https://github.com/NotNull92/hera-agent-unity', desc: `라이브 Unity 에디터 제어·런타임 QA · ${HERA_UNITY.version} · Unity 6.6+ · npm·OpenUPM`, license: 'Apache-2.0' },
  { name: 'hera-agent-godot', repo: 'NotNull92/hera-agent-godot', logo: heraGodotLogo, url: 'https://github.com/NotNull92/hera-agent-godot', desc: 'Godot 4 에디터 제어 CLI · v2.0.2 · C# 지원 · Asset Store', license: 'MIT' },
  { name: 'hebe-agent-unity', repo: 'NotNull92/hebe-agent-unity', logo: hebeLogo, url: 'https://github.com/NotNull92/hebe-agent-unity', desc: 'Unity C# 실행·입력 재생·QA · warm exec 중앙값 240ms', license: 'Apache-2.0' },
  { name: 'workforge-mcp', repo: 'NotNull92/workforge-mcp', logo: workforgeLogo, url: 'https://github.com/NotNull92/workforge-mcp', desc: 'ChatGPT ↔ 로컬 PC · 툴 12종 · Windows 배포 / macOS 소스 프리뷰', license: 'MIT' },
];

export const CAREERS = [
  {
    period: '2021.09 ~ 재직중', company: '블루포션게임즈', team: '레드클라이언트팀 · Unity 클라이언트 개발',
    bullets: [
      '길드 경쟁전과 전용 PVE 던전 개발·리뉴얼 — 협업 미션 5종 설계, 서버·기획과 스펙 조율',
      'BM 시스템 3종 개발 — 스텝업 패키지(BM 매출 비중 30%)·조건부 팝업(전환율 45%)·1+1 상품',
      '월드 랭킹 갱신 구조를 재설계해 서버 부하 85% 감소, 휴면 계정 처리 자동화로 운영 공수 90% 절감',
      '길드 추천 시스템(가입률 +30%)·보스 던전 리뉴얼(참여율 +35%)·콜로세움 개선(일일 참여율 +150%)',
      '국내 클라이언트 점검, Android/iOS 빌드 및 패치 배포, BTS 이슈 대응 담당',
    ],
  },
  {
    period: '2020.10 ~ 2021.09', company: '뱅코게임즈', team: '개발팀 파트장 · Unity 멀티플랫폼 개발',
    bullets: [
      '1년 사이 모바일·PC VR·하드웨어 연동 3개 타이틀을 출시까지 담당',
      '스토어 출시 실무 — AdMob·인앱결제 연동, 다국어 대응, 빌드 및 스토어 등록',
      '전북콘텐츠진흥원 국가지원사업 2건 참여 — 좀비 킹덤(지원금 5,000만 원)·프리 드로우(평가 86점)',
    ],
  },
];

// Unity 커리어 시작(뱅코 입사) 기준 경력. 하드코딩하면 반드시 낡는다.
const CAREER_START = { year: 2020, month: 10 };
const tenureText = () => {
  const now = new Date();
  const months = (now.getFullYear() - CAREER_START.year) * 12 + (now.getMonth() + 1 - CAREER_START.month);
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y <= 0) return `${m}개월`;
  return m > 0 ? `${y}년 ${m}개월` : `${y}년`;
};

export const SKILL_GROUPS = [
  { group: '주력', items: `C# · Unity — 모바일 클라이언트 / 라이브 서비스 (${tenureText()})` },
  { group: '라이브러리', items: 'UniRx · UniTask · DOTween · Odin Inspector · UI Toolkit · Addressables · OSA' },
  { group: '툴링', items: 'Go · GDScript · Git / SVN · Jenkins CI · Gitea · RedMine' },
  { group: '도메인', items: 'BM 설계 · 서버-클라 프로토콜 협업 · Android/iOS 빌드·배포 · VR(SteamVR/Quest) · 블루투스 하드웨어 연동' },
];

export const MARQUEE =
  'GAME CREATOR ▸ UNITY CLIENT DEVELOPER ▸ SINCE 2020.10 ▸ MONSTEL ▸ NOMOREROLLS PROTOTYPE COMPLETE ▸ HERA-AGENT UNITY / GODOT ▸ HEBE-AGENT-UNITY ▸ HERAAGENT ▸ GITHUB.COM/NOTNULL92 ▸ OPEN FOR TRANSMISSION ▸ ';
