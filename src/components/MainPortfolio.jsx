import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Target, Settings, Clock, Briefcase, Mail } from 'lucide-react';
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
        { label: 'LIVE', url: '#' },
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

const MainPortfolio = ({ onAdminClick }) => {
  const [activeTab, setActiveTab] = useState('stat');
  const [currentTime, setCurrentTime] = useState(new Date());

  // 실시간 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 시간 포맷팅 (HH:MM:SS)
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
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
            onClick={onAdminClick}
            aria-label="Admin Access"
          >
            <Settings size={16} />
            <span>[ ??? ]</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-container">
          {activeTab === 'stat' && <StatTab />}
          {activeTab === 'logs' && <LogsTab />}
          {activeTab === 'quests' && <QuestsTab />}
          {activeTab === 'inventory' && <InventoryTab />}
          {activeTab === 'contact' && <ContactTab />}
        </div>

        {/* Footer */}
        <div className="portfolio-footer">
          <span className="text-glow">{'>'} SYSTEM READY_</span>
          <span className="cursor-blink">█</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MainPortfolio;