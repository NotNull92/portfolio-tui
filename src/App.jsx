import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Terminal from './components/Terminal';
import NeonPortfolio from './components/NeonPortfolio';
import CursorGlow from './components/effects/CursorGlow';
import AchievementToast from './components/AchievementToast';
import './index.css';

function App() {
  // 같은 세션에서 재방문 시 터미널 생략.
  // ?direct = 즉시 입장, ?resume = 즉시 입장 + 이력서 뷰 오픈 (채용 담당자용)
  // 모바일은 부팅 연출을 기본 생략 (키 입력 2단계가 이탈 요인 — CLS 개선 겸)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return (
        sessionStorage.getItem('tui-authed') === '1' ||
        params.has('direct') ||
        params.has('resume') ||
        window.matchMedia('(max-width: 640px)').matches
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
          <NeonPortfolio
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
