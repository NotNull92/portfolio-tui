import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Terminal from './components/Terminal';
import MainPortfolio from './components/MainPortfolio';
import CursorGlow from './components/effects/CursorGlow';
import AchievementToast from './components/AchievementToast';
import './index.css';

function App() {
  // 같은 세션에서 재방문 시 터미널 생략.
  // ?direct = 즉시 입장, ?resume = 즉시 입장 + 이력서 뷰 오픈 (채용 담당자용)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return (
        sessionStorage.getItem('tui-authed') === '1' ||
        params.has('direct') ||
        params.has('resume')
      );
    } catch {
      return false;
    }
  });

  const handleAuthenticated = () => {
    try {
      sessionStorage.setItem('tui-authed', '1');
    } catch {
      /* sessionStorage 사용 불가 시 무시 */
    }
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
      <CursorGlow />
      <AchievementToast />
      <div className="crt-fx" aria-hidden="true">
        <div className="crt-sweep" />
        <div className="crt-vignette" />
        <div className="crt-noise" />
        <div className="crt-frame" />
      </div>
    </div>
  );
}

export default App;
