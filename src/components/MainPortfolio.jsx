import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Target, Settings, Clock, Briefcase, Mail, Lock, XCircle, CheckCircle } from 'lucide-react';
import './MainPortfolio.css';

// Tab components
const StatTab = () => {
  return (
    <div className="tab-content">
      <div className="section-header">
        <span className="text-glow">{'>'} PERSONAL DATA</span>
      </div>
      <div className="data-grid">
        <div className="data-row">
          <span className="label">NAME:</span>
          <span className="value text-glow">YOUNGJUN JI (NOTNULL)</span>
        </div>
        <div className="data-row">
          <span className="label">ROLE:</span>
          <span className="value text-glow">UNITY DEVELOPER</span>
        </div>
        <div className="data-row">
          <span className="label">EXPERIENCE:</span>
          <span className="value text-glow">5 YEARS</span>
        </div>
        <div className="data-row">
          <span className="label">STATUS:</span>
          <span className="value text-glow" style={{ color: '#00ff41' }}>ACTIVE</span>
        </div>
      </div>
      <div className="section-header" style={{ marginTop: '30px' }}>
        <span className="text-glow">{'>'} SKILLS</span>
      </div>
      <div className="skills-container">
        <div className="skill-bar">
          <span className="skill-name">UNITY / C#</span>
          <div className="skill-progress">
            <div className="skill-fill" style={{ width: '90%' }}></div>
          </div>
        </div>
        <div className="skill-bar">
          <span className="skill-name">GIT / SVN </span>
          <div className="skill-progress">
            <div className="skill-fill" style={{ width: '90%' }}></div>
          </div>
        </div>
        <div className="skill-bar">
          <span className="skill-name">redmine</span>
          <div className="skill-progress">
            <div className="skill-fill" style={{ width: '100%' }}></div>
          </div>
        </div>
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
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-title text-glow-strong">{'>'} PROJECT DETAILS</span>
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

// Admin Password Modal
const AdminPasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('PASSWORD REQUIRED');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    // Simulate password check
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // TODO: Replace with actual password verification logic
    const ADMIN_PASSWORD = 'admin123';
    
    if (password === ADMIN_PASSWORD) {
      onSuccess();
      handleClose();
    } else {
      setError('ACCESS DENIED');
      setPassword('');
    }
    
    setIsLoading(false);
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
    >
      <motion.div 
        className="modal-content admin-modal"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-title text-glow-strong">
            <Lock size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            {'>'} DO NOT ACCESS HERE
          </span>
        </div>
        
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="modal-section">
            <span className="modal-label">ENTER PASSWORD:</span>
            <input
              type="password"
              className="admin-password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              autoFocus
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <motion.div 
              className="admin-error text-glow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {`> ${error}`}
            </motion.div>
          )}
          
          <div className="admin-actions">
            <button 
              type="button" 
              className="admin-btn cancel"
              onClick={handleClose}
              disabled={isLoading}
            >
              <XCircle size={14} />
              <span>CANCEL</span>
            </button>
            <button 
              type="submit" 
              className="admin-btn submit"
              disabled={isLoading}
            >
              <CheckCircle size={14} />
              <span>{isLoading ? 'VERIFYING...' : 'SUBMIT'}</span>
            </button>
          </div>
        </form>
        
        <div className="modal-footer">
          <span className="text-glow">{'>'} AUTHORIZATION REQUIRED_</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

const QuestsTab = () => {
  const [selectedProject, setSelectedProject] = useState(null);

  const inProgressProjects = [
    {
      name: 'DAILY BREW',
      description: 'A cozy coffee shop simulation game',
      fullDescription: 'A relaxing coffee shop management simulation where you brew coffee, serve customers, and build your dream café. Features a day-night cycle, customer stories, and cozy atmosphere.',
      status: 'IN PROGRESS',
      progress: 65,
      tech: ['Unity', 'C#', '2D Graphics', 'Pixel Art'],
      features: [
        'Coffee brewing mini-games',
        'Customer relationship system',
        'Café customization',
        'Story-driven events',
      ],
    },
  ];

  const releasedProjects = [
    {
      name: 'EOS-RED',
      description: '6주년 모바일 MMORPG - LIVE 서비스',
      fullDescription: '6주년을 맞이한 모바일 MMORPG로, 2021년 9월부터 Live 서비스 중인 프로젝트입니다.\n\n[프로젝트 개요]\n• 개발 기간: 2021.09 - 2024.11~(Live)\n• 장르: MMORPG\n• 플랫폼: 모바일\n• 팀 구성: 클라이언트 7 ~ 8인\n• 사용 기술: C#, Unity3D, OSA, UniRx, Dotween 등\n\n[출시 후 성과 지표]\n• MAU: 최대 35,000\n• DAU: 최대 12,000\n• 매출: 최대 400억, 평균 200억\n\n[핵심 기여도]\n• 스텝업 패키지 개발 및 유지 보수: 새로운 BM 시스템 개발로 매출에 기여\n• 상품 1+1 구매 기능 개발 및 유지 보수: 이벤트성 신규 유저 진입을 위한 BM 개발\n• 조건부 팝업 패키지 개발 및 유지 보수: 새로운 BM 시스템 개발\n• 대형/소형 컨텐츠 다수 개발 및 개선\n\n[대표 개발 컨텐츠]\n\n◆ 대형 컨텐츠\n• 길드 경쟁전: 길드원 간 협업 미션 시스템, PVP 경쟁 시스템\n• 길드 경쟁전 전용 PVE 던전: 실시간 협력 던전 시스템\n• 길드 경쟁전 리뉴얼: PVP 중심 경쟁 시스템, 밸런스 조정\n\n◆ BM 시스템\n• 스텝업 상품 시스템: 단계별 구매 유도 BM (매출 30% 기여)\n• 조건부 팝업: 유저 행동 기반 타겟팅 상품 노출 (전환율 45%)\n• 스텝업 패키지 개선: 다단계 구매 시스템 고도화\n\n◆ 시스템 & 편의성\n• 휴면 계정 처리: 유니크 식별자 재사용 시스템 (운영 공수 90% 절감)\n• 캐릭터 즉시 삭제: UniRx 기반 반응형 UI\n• 월드 랭킹 시스템: 서버 부하 85% 감소 최적화\n• VIP 칭호/버프/이펙트: 등급별 차별화 시스템\n• 재화 숫자 표기 개선: UI 가독성 향상\n\n◆ 기타 컨텐츠\n• 길드 추천 시스템: 길드 가입률 30% 증가\n• 보스 던전 리뉴얼: 참여율 35% 증가\n• 콜로세움 개선: 일일 참여율 150% 증가\n• 소울 각인 확장, 펫 레벨 증가, 아이템 획득 세분화 등\n\n[협업 도구]\n• 버전 관리: Git, SVN, Git Fork, Gitea, CDN, Hermes, Jenkins\n• 이슈 트래킹: RedMine\n• 문서화: Notion, Wiki',
      status: 'RELEASED',
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
      fullDescription: 'VR을 이용한 드로잉 컨텐츠. 2021년 전북콘텐츠진흥원 국가지원사업에서 86점을 받았으며, NC와 협력해 광주 비엔날레 전시 계약을 체결했다.',
      status: 'RELEASED',
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
      name: 'PORTFOLIO-BLOG',
      description: 'Terminal-style portfolio website',
      fullDescription: 'A retro terminal-style portfolio website inspired by Fallout UI. Built with React and features CRT effects, typing animations, and a unique user experience.',
      status: 'RELEASED',
      tech: ['React', 'Vite', 'CSS', 'Framer Motion'],
      features: [
        'CRT monitor effects',
        'Typing animations',
        'Fallout-inspired UI',
        'Responsive design',
      ],
      links: [
        { label: 'LIVE', url: 'https://portfolio-tui-ten.vercel.app/' },
      ],
    },
    {
      name: 'ZOMBIE KINGDOM',
      description: '조선시대 컨셉 모바일 슈팅 게임',
      fullDescription: '오픈소스 프로젝트를 분석하여 리메이크한 모바일 슈팅 게임입니다.\n\n[프로젝트 개요]\n• 개발 기간: 2020.10 - 2020.12\n• 장르: 모바일 슈팅 게임\n• 플랫폼: 모바일\n• 팀 구성: 클라이언트 1인\n• 사용 기술: C#, Unity3D\n\n[핵심 기여도]\n• 오픈소스 프로젝트 분석 및 리메이크\n• 기존 포스트 아포칼립스 컨셉에서 조선시대 컨셉으로 변경\n• UI 전면 수정, 맵 레벨링, 인게임 내 오브젝트 모델링 변경\n• Json을 이용한 다국어 지원 기능 추가\n• 구글 애드몹, 인앱결제 추가 및 스토어 출시\n\n[출시 후 성과]\n• 전북콘텐츠진흥원 국가지원사업 지원금: 50,000,000\n\n[협업 도구]\n• 버전 관리: Unity Collaborate, Trello\n• 이슈 트래킹: Notion\n• 문서화: Hwp, Word',
      status: 'RELEASED',
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
      className="project-card clickable"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.2 }}
      onClick={() => setSelectedProject(project)}
      whileHover={{ borderColor: '#00ff41' }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="project-header">
        <span className="project-name text-glow">{project.name}</span>
        <span className={`project-status ${project.status === 'RELEASED' ? 'released' : 'progress'}`}>
          {project.status}
        </span>
      </div>
      <p className="project-description">{project.description}</p>
      <div className="project-tech">
        {project.tech.map((t, i) => (
          <span key={i} className="tech-tag">{t}</span>
        ))}
      </div>
      {project.progress && (
        <div className="project-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
          </div>
          <span className="progress-text">{project.progress}%</span>
        </div>
      )}
      <div className="project-click-hint text-glow">{'[ CLICK FOR DETAILS ]'}</div>
    </motion.div>
  );

  return (
    <div className="tab-content">
      {/* In Progress Section */}
      <div className="section-header">
        <span className="text-glow">{'>'} QUESTS IN PROGRESS</span>
      </div>
      <div className="projects-grid">
        {inProgressProjects.map((project, index) => renderProjectCard(project, index))}
      </div>

      {/* Released Section */}
      <div className="section-header" style={{ marginTop: '30px' }}>
        <span className="text-glow">{'>'} COMPLETED QUESTS</span>
      </div>
      <div className="projects-grid">
        {releasedProjects.map((project, index) => renderProjectCard(project, index))}
      </div>
      
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
        { date: '03', title: 'PORTFOLIO-BLOG 개발', desc: '터미널 스타일 포트폴리오 웹사이트 개발' },
        { date: '01', title: 'DAILY BREW 사이드 프로젝트 시작', desc: '카페 시뮬레이션 게임 개발 시작' },
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
        { date: '09', title: '블루포션 게임즈 입사', desc: 'Unity 개발 - 에오스 레드 모바일 MMORPG 게임 컨텐츠 개발(LIVE 서비스)' },
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
      <div className="section-header">
        <span className="text-glow">{'>'} ACTIVITY LOGS</span>
      </div>
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
      year: '2024',
      title: 'Global Game Jam 2024 Seoul 참가',
      type: 'GAME JAM',
      desc: '48시간 게임 개발 대회 참가\n- 3인팀으로 게임 아이디어 구상 및 개발\n- 게임 개발 과정에서의 문제 해결 능력 향상',
      link: 'https://globalgamejam.org/games/2024/mental-robo-2',
      linkLabel: 'VIEW GAME',
    },
  ];

  const getTypeColor = (type) => {
    switch (type) {
      case 'GAME JAM': return '#ff8800';
      case 'EXHIBITION': return '#a855f7';
      case 'COMMUNITY': return '#3b82f6';
      case 'FESTIVAL': return '#00ff41';
      default: return '#6b7280';
    }
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <span className="text-glow">{'>'} ACTIVITIES & ACHIEVEMENTS</span>
      </div>
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

// Contact Tab - 연락처
const ContactTab = () => {
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
  ];

  return (
    <div className="tab-content">
      <div className="section-header">
        <span className="text-glow">{'>'} CONTACT TRANSMISSION</span>
      </div>
      <div className="contact-list">
        {contacts.map((contact, idx) => (
          <motion.a
            key={idx}
            href={contact.url}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-item"
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
          </motion.a>
        ))}
      </div>
      <div className="contact-hint text-glow">
        {'>'} CLICK TO CONNECT_
      </div>
    </div>
  );
};

const MainPortfolio = ({ onAdminMode }) => {
  const [activeTab, setActiveTab] = useState('stat');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAdminModal, setShowAdminModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleAdminSuccess = () => {
    setShowAdminModal(false);
    onAdminMode?.();
  };

  const tabs = [
    { id: 'stat', label: 'STAT', icon: User },
    { id: 'logs', label: 'LOGS', icon: Clock },
    { id: 'quests', label: 'QUESTS', icon: Target },
    { id: 'inventory', label: 'INVENTORY', icon: Briefcase },
    { id: 'contact', label: 'CONTACT', icon: Mail },
  ];

  return (
    <motion.div 
      className="portfolio-container crt-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="portfolio-content">
        {/* Header */}
        <div className="portfolio-header">
          <div className="header-title text-glow-strong">
            {'>'} PORTFOLIO TERMINAL v1.0
          </div>
          <div className="header-status text-glow">
            STATUS: ONLINE | UPTIME: {formatTime(currentTime)}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} />
              <span>[ {tab.label} ]</span>
            </button>
          ))}
          {/* Hidden Admin Button */}
          <button
            className="tab-button admin-button"
            onClick={() => setShowAdminModal(true)}
            aria-label="Admin Access"
          >
            <Settings size={16} />
            <span>[ ??? ]</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-container">
          <AnimatePresence mode="wait">
            {activeTab === 'stat' && <motion.div key="stat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="tab-wrapper"><StatTab /></motion.div>}
            {activeTab === 'logs' && <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="tab-wrapper"><LogsTab /></motion.div>}
            {activeTab === 'quests' && <motion.div key="quests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="tab-wrapper"><QuestsTab /></motion.div>}
            {activeTab === 'inventory' && <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="tab-wrapper"><InventoryTab /></motion.div>}
            {activeTab === 'contact' && <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="tab-wrapper"><ContactTab /></motion.div>}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="portfolio-footer">
          <span className="text-glow">{'>'} SYSTEM READY_</span>
          <span className="cursor-blink">█</span>
        </div>
      </div>

      {/* Admin Password Modal */}
      {showAdminModal && (
        <AdminPasswordModal 
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          onSuccess={handleAdminSuccess}
        />
      )}
    </motion.div>
  );
};

export default MainPortfolio;