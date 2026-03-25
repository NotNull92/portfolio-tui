import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Terminal from './components/Terminal';
import MainPortfolio from './components/MainPortfolio';
import AdminDashboard from './components/AdminDashboard';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleAdminMode = () => {
    setIsAdmin(true);
  };

  const handleExitAdmin = () => {
    setIsAdmin(false);
  };

  return (
    <div className="app">
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <Terminal 
            key="terminal" 
            onAuthenticated={handleAuthenticated} 
          />
        ) : isAdmin ? (
          <AdminDashboard 
            key="admin" 
            onExit={handleExitAdmin} 
          />
        ) : (
          <MainPortfolio 
            key="portfolio" 
            onAdminMode={handleAdminMode} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
