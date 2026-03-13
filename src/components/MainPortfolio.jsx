import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, FolderCode, Settings } from 'lucide-react';
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

const DataTab = () => {
  const [selectedProject, setSelectedProject] = useState(null);

  const projects = [
    {
      name: 'DAILY BREW',
      description: 'A cozy coffee shop simulation game',
      fullDescription: 'A relaxing coffee shop management simulation where you brew coffee, serve customers, and build your dream café. Features a day-night cycle, customer stories, and cozy atmosphere.',
      status: 'IN DEVELOPMENT',
      tech: ['Unity', 'C#', '2D Graphics', 'Pixel Art'],
      features: [
        'Coffee brewing mini-games',
        'Customer relationship system',
        'Café customization',
        'Story-driven events',
      ],
      links: [
        { label: 'GITHUB', url: '#' },
        { label: 'DEMO', url: '#' },
      ],
    },
    {
      name: 'DEVILGIRL',
      description: 'Dark fantasy action adventure',
      fullDescription: 'A dark fantasy action-adventure game featuring a mysterious protagonist. Explore atmospheric dungeons, battle supernatural enemies, and uncover ancient secrets.',
      status: 'IN DEVELOPMENT',
      tech: ['Unity', 'C#', '3D Graphics', 'Shader Graph'],
      features: [
        'Real-time combat system',
        'Atmospheric lighting',
        'Boss battles',
        'Skill progression',
      ],
      links: [
        { label: 'GITHUB', url: '#' },
        { label: 'TRAILER', url: '#' },
      ],
    },
  ];

  return (
    <div className="tab-content">
      <div className="section-header">
        <span className="text-glow">{'>'} PROJECT DATABASE</span>
      </div>
      <div className="projects-grid">
        {projects.map((project, index) => (
          <motion.div 
            key={index}
            className="project-card clickable"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            onClick={() => setSelectedProject(project)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="project-header">
              <span className="project-name text-glow">{project.name}</span>
              <span className="project-status">{project.status}</span>
            </div>
            <p className="project-description">{project.description}</p>
            <div className="project-tech">
              {project.tech.map((t, i) => (
                <span key={i} className="tech-tag">{t}</span>
              ))}
            </div>
            <div className="project-click-hint text-glow">{'[ CLICK FOR DETAILS ]'}</div>
          </motion.div>
        ))}
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

const MainPortfolio = ({ onAdminClick }) => {
  const [activeTab, setActiveTab] = useState('stat');

  const tabs = [
    { id: 'stat', label: 'STAT', icon: User },
    { id: 'data', label: 'DATA', icon: FolderCode },
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
            STATUS: ONLINE | UPTIME: 00:00:00
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
          {activeTab === 'data' && <DataTab />}
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