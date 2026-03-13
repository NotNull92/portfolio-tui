import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Terminal from './components/Terminal';
import MainPortfolio from './components/MainPortfolio';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleAdminClick = () => {
    setShowAdmin(true);
    // TODO: Phase 3 - Admin Tool Implementation
    console.log('Admin access clicked');
  };

  return (
    <div className="app">
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <Terminal 
            key="terminal" 
            onAuthenticated={handleAuthenticated} 
          />
        ) : (
          <MainPortfolio 
            key="portfolio" 
            onAdminClick={handleAdminClick}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;