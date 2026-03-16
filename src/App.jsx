import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Terminal from './components/Terminal';
import MainPortfolio from './components/MainPortfolio';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
