import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Edit, Trash2, GripVertical, XCircle, CheckCircle } from 'lucide-react';
import './AdminDashboard.css';

const STORAGE_KEY = 'portfolio_projects';

const DEFAULT_PROJECTS = [
  { id: 1, name: 'DAILY BREW', status: 'IN_PROGRESS', description: '카페 시뮬레이션' },
  { id: 2, name: 'EOS-RED', status: 'DONE', description: '모바일 MMORPG' },
];

const loadProjects = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_PROJECTS;
  } catch {
    return DEFAULT_PROJECTS;
  }
};

const saveProjects = (projects) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects:', e);
  }
};

const ProjectModal = ({ isOpen, onClose, project, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'TODO',
    tech: '',
    features: '',
    fullDescription: '',
  });

  useState(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'TODO',
        tech: (project.tech || []).join(', '),
        features: (project.features || []).join('\n'),
        fullDescription: project.fullDescription || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'TODO',
        tech: '',
        features: '',
        fullDescription: '',
      });
    }
  }, [project, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSave({
      ...project,
      name: formData.name.trim(),
      description: formData.description.trim(),
      status: formData.status,
      tech: formData.tech.split(',').map(t => t.trim()).filter(Boolean),
      features: formData.features.split('\n').map(f => f.trim()).filter(Boolean),
      fullDescription: formData.fullDescription.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="modal-content admin-modal project-modal"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-title text-glow-strong">
            {'>'} {project ? 'EDIT PROJECT' : 'NEW PROJECT'}
          </span>
        </div>
        
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">PROJECT NAME:</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter project name"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">SHORT DESCRIPTION:</label>
            <input
              type="text"
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description"
            />
          </div>

          <div className="form-group">
            <label className="form-label">STATUS:</label>
            <select
              className={`form-input form-select status-${formData.status.toLowerCase()}`}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="DONE">DONE</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">TECH STACK (comma separated):</label>
            <input
              type="text"
              className="form-input"
              value={formData.tech}
              onChange={(e) => setFormData({ ...formData, tech: e.target.value })}
              placeholder="Unity, C#, React..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">FEATURES (one per line):</label>
            <textarea
              className="form-input form-textarea"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">FULL DESCRIPTION:</label>
            <textarea
              className="form-input form-textarea"
              value={formData.fullDescription}
              onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
              placeholder="Detailed project description..."
              rows={4}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="admin-btn cancel" onClick={onClose}>
              <XCircle size={14} />
              <span>CANCEL</span>
            </button>
            <button type="submit" className="admin-btn submit">
              <CheckCircle size={14} />
              <span>SAVE</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const AdminDashboard = ({ onExit }) => {
  const [projects, setProjects] = useState(loadProjects);
  
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const columns = [
    { id: 'TODO', title: 'TODO', color: '#ffaa00' },
    { id: 'IN_PROGRESS', title: 'IN PROGRESS', color: '#3b82f6' },
    { id: 'DONE', title: 'DONE', color: '#00ff41' },
  ];

  const getProjectsByStatus = (status) => {
    return projects.filter(p => p.status === status);
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setShowModal(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowModal(true);
  };

  const handleDeleteProject = (id) => {
    if (window.confirm('DELETE THIS PROJECT?')) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const handleSaveProject = (projectData) => {
    if (editingProject) {
      setProjects(projects.map(p => 
        p.id === editingProject.id ? { ...projectData, id: p.id } : p
      ));
    } else {
      const newProject = {
        ...projectData,
        id: Date.now(),
      };
      setProjects([...projects, newProject]);
    }
  };

  const handleMoveProject = (project, newStatus) => {
    setProjects(projects.map(p => 
      p.id === project.id ? { ...p, status: newStatus } : p
    ));
  };

  return (
    <motion.div 
      className="admin-container crt-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="admin-content">
        <div className="admin-header">
          <button className="back-button" onClick={onExit}>
            <ArrowLeft size={16} />
            <span>[ EXIT SECRET ROOM ]</span>
          </button>
          <div className="admin-title text-glow-strong">
            {'>'} SECRET ROOM
          </div>
          <button className="add-button" onClick={handleAddProject}>
            <Plus size={16} />
            <span>[ NEW PROJECT ]</span>
          </button>
        </div>

        <div className="kanban-board">
          {columns.map((column) => (
            <div key={column.id} className="kanban-column">
              <div className="column-header" style={{ borderColor: column.color }}>
                <span className="column-title text-glow" style={{ color: column.color }}>
                  {column.title}
                </span>
                <span className="column-count">{getProjectsByStatus(column.id).length}</span>
              </div>
              <div className="column-content">
                {getProjectsByStatus(column.id).map((project) => (
                  <motion.div 
                    key={project.id}
                    className="project-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ borderColor: column.color }}
                  >
                    <div className="project-item-header">
                      <GripVertical size={14} className="drag-handle" />
                      <span className="project-item-name text-glow">{project.name}</span>
                    </div>
                    <p className="project-item-desc">{project.description}</p>
                    <div className="project-item-status">
                      <select
                        className={`status-select status-${project.status.toLowerCase()}`}
                        value={project.status}
                        onChange={(e) => handleMoveProject(project, e.target.value)}
                      >
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="DONE">DONE</option>
                      </select>
                    </div>
                    <div className="project-item-actions">
                      <button 
                        className="action-btn edit" 
                        onClick={() => handleEditProject(project)}
                      >
                        <Edit size={12} />
                      </button>
                      <button 
                        className="action-btn delete" 
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="admin-footer">
          <span className="text-glow">{'>'} SELECT STATUS TO MOVE | CLICK ICONS TO EDIT/DELETE_</span>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <ProjectModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            project={editingProject}
            onSave={handleSaveProject}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminDashboard;
