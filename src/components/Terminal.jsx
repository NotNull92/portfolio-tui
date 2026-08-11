import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScrambleText from './effects/ScrambleText';
import AsciiRain from './effects/AsciiRain';
import './Terminal.css';

import vaultBoyImg from '../assets/notnull-logo.png';

// ASCII Art for RobCo Boot Sequence
const ASCII_ART = `
███╗   ██╗ ██████╗ ████████╗███╗   ██╗██╗   ██╗██╗     ██╗     
████╗  ██║██╔═══██╗╚══██╔══╝████╗  ██║██║   ██║██║     ██║     
██╔██╗ ██║██║   ██║   ██║   ██╔██╗ ██║██║   ██║██║     ██║     
██║╚██╗██║██║   ██║   ██║   ██║╚██╗██║██║   ██║██║     ██║     
██║ ╚████║╚██████╔╝   ██║   ██║ ╚████║╚██████╔╝███████╗███████╗
╚═╝  ╚═══╝ ╚═════╝    ╚═╝   ╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚══════╝
`;

const BOOT_MESSAGES = [
  { text: 'EMBER STUDIO COMPANY (TM) TERMLINK PROTOCOL', delay: 100 },
  { text: '', delay: 200 },
  { text: '> INITIALIZING MAIN SYSTEM...', delay: 150 },
  { text: '> LOADING UNITY RUNTIME... 5 YEARS OF FIELD DATA FOUND', delay: 150 },
  { text: '> MOUNTING LIVE-SERVICE RECORDS... MAU 35K VERIFIED', delay: 120 },
  { text: '> SYNCING SIDE PROJECTS... 4 AI DEV TOOLS ONLINE', delay: 130 },
  { text: '> CALIBRATING DICE... NOMOREROLLS PROTOTYPE COMPLETE', delay: 100 },
  { text: '', delay: 150 },
  { text: '> ALL SYSTEMS NOMINAL. WELCOME, VISITOR.', delay: 100 },
  { text: '', delay: 200 },
];

const ACCESS_KEY = 'alena';

const ERROR_MESSAGES = [
  '> ACCESS DENIED - INVALID VIBES: SYSTEM SUSPECTS USER',
  '> ACCESS DENIED - PROMPT REJECTED: BRAIN.EXE FAILED TO TOKENIZE.',
  '> ACCESS DENIED - ZERO CONTEXT: YOUR FINGERS ARE OUT OF SYNC',
];

// 시크릿 커맨드 — help 에 전부 나오지는 않는다. 게임 개발자는 이스터에그를 심는 법.
const SECRET_COMMANDS = {
  help: [
    'AVAILABLE COMMANDS: help, whoami, credits, ls, clear, exit',
    'SOME COMMANDS ARE NOT LISTED. GAME DEVS LOVE SECRETS.',
  ],
  whoami: [
    'GUEST.',
    '...BUT AFTER READING THIS PORTFOLIO: HIRING MANAGER, PROBABLY.',
  ],
  sudo: [
    'PERMISSION GRANTED... JUST KIDDING. NICE TRY, ADMIN.',
    'ACHIEVEMENT UNLOCKED ★ CURIOSITY: LV.MAX',
  ],
  'sudo su': [
    'PERMISSION GRANTED... JUST KIDDING. NICE TRY, ADMIN.',
    'ACHIEVEMENT UNLOCKED ★ CURIOSITY: LV.MAX',
  ],
  credits: [
    'DESIGNED & BUILT BY NOTNULL (YOUNGJUN JI)',
    'ENGINE: REACT 19 + VITE / FX: FRAMER-MOTION',
    'NO GAME DEVS WERE HARMED IN THE MAKING OF THIS TERMINAL.',
  ],
  ls: [
    'stat/  logs/  quests/  inventory/  notes/  contact/  secret.txt',
  ],
  'cat secret.txt': [
    'THE REAL SECRET IS SHIPPING. — NOTNULL',
  ],
  'rm -rf /': [
    'DELETING FILESYSTEM... 3%... 12%... 47%...',
    'JUST KIDDING. THIS TERMINAL IS READ-ONLY. NICE TRY THOUGH.',
  ],
  exit: [
    'THERE IS NO ESCAPE. PRESS ENTER TO GO DEEPER.',
  ],
  clear: [],
};

// Typing Animation Hook
const useTypingEffect = (text, speed = 30, startDelay = 0) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    
    const startTimeout = setTimeout(() => {
      let currentIndex = 0;
      const intervalId = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsComplete(true);
          clearInterval(intervalId);
        }
      }, speed);

      return () => clearInterval(intervalId);
    }, startDelay);

    return () => clearTimeout(startTimeout);
  }, [text, speed, startDelay]);

  return { displayedText, isComplete };
};

// Single Line with Typing Effect
const TypedLine = ({ text, delay, onComplete, isActive }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  // 활성화 후 1회만 타이핑 (onComplete 참조 변경으로 인한 재타이핑 방지)
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isActive || startedRef.current) return;
    startedRef.current = true;

    let intervalId;
    const timeout = setTimeout(() => {
      let currentIndex = 0;
      // 16ms에 2자씩 = 8ms/자 체감 속도 유지하면서 setState 횟수는 절반
      intervalId = setInterval(() => {
        if (currentIndex < text.length) {
          currentIndex = Math.min(currentIndex + 2, text.length);
          setDisplayedText(text.slice(0, currentIndex));
        } else {
          setIsComplete(true);
          clearInterval(intervalId);
          onComplete?.();
        }
      }, 16);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalId);
    };
  }, [text, delay, isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div className="terminal-line">
      <span className="text-glow">{displayedText}</span>
      {!isComplete && <span className="cursor-blink">█</span>}
    </div>
  );
};

const Terminal = ({ onAuthenticated }) => {
  const [phase, setPhase] = useState('boot'); // boot, input, authenticating, success
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showAscii, setShowAscii] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [error, setError] = useState('');
  const [errorKey, setErrorKey] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [cmdLog, setCmdLog] = useState([]);
  const inputRef = useRef(null);

  // Show ASCII art first
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAscii(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // 부팅 중 아무 키/클릭으로 스킵
  useEffect(() => {
    if (phase !== 'boot') return;
    const skip = () => {
      setSkipped(true);
      setShowAscii(true);
      setCurrentLineIndex(BOOT_MESSAGES.length);
    };
    window.addEventListener('keydown', skip);
    window.addEventListener('mousedown', skip);
    return () => {
      window.removeEventListener('keydown', skip);
      window.removeEventListener('mousedown', skip);
    };
  }, [phase]);

  // Handle boot sequence completion
  const handleLineComplete = useCallback(() => {
    setCurrentLineIndex(prev => prev + 1);
  }, []);

  // Show prompt after boot sequence
  useEffect(() => {
    if (currentLineIndex >= BOOT_MESSAGES.length && phase === 'boot') {
      setTimeout(() => {
        setShowPrompt(true);
        setPhase('input');
      }, 120);
    }
  }, [currentLineIndex, phase]);

  // Focus input when ready
  useEffect(() => {
    if (phase === 'input' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase]);

  // Handle authentication — 빈 입력 + Enter도 입장 허용 (게이트 이탈 방지)
  const handleAuthenticate = useCallback(() => {
    const value = inputValue.trim().toLowerCase();

    // 시크릿 커맨드는 입장 대신 응답을 출력한다
    if (value && Object.prototype.hasOwnProperty.call(SECRET_COMMANDS, value)) {
      if (value === 'clear') {
        setCmdLog([]);
      } else {
        setCmdLog((log) => [...log, { cmd: value, lines: SECRET_COMMANDS[value] }]);
      }
      if (value === 'rm -rf /') {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 600);
      }
      setError('');
      setInputValue('');
      inputRef.current?.focus();
      return;
    }

    if (value === ACCESS_KEY || value === '') {
      setPhase('authenticating');
      setError('');
      
      // Trigger glitch effect then authenticate
      setTimeout(() => {
        setGlitch(true);
      }, 500);
      
      setTimeout(() => {
        onAuthenticated();
      }, 1500);
    } else {
      const randomError = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
      setError(randomError);
      setErrorKey((k) => k + 1);
      setInputValue('');
      inputRef.current?.focus();
    }
  }, [inputValue, onAuthenticated]);

  // Handle key press
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && phase === 'input') {
      handleAuthenticate();
    }
  }, [handleAuthenticate, phase]);

  // Global key listener for input focus
  useEffect(() => {
    const handleGlobalKeyDown = () => {
      if (phase === 'input' && inputRef.current) {
        inputRef.current.focus();
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [phase]);

  return (
    <motion.div 
      className={`terminal-container crt-container ${glitch ? 'screen-glitch' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AsciiRain opacity={0.22} />
      <div className="terminal-content">
        {/* Header Section: ASCII Art + Vault Boy */}
        <AnimatePresence>
          {showAscii && (
            <motion.div
              className="header-section"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <pre className="ascii-art text-glow-strong">
                {ASCII_ART.split('\n').map((line, i) => (
                  <ScrambleText
                    key={i}
                    tag="div"
                    text={line || ' '}
                    charset="█▓▒░╗╚╝║═╔"
                    duration={750}
                    delay={i * 90}
                  />
                ))}
              </pre>
              <motion.div
                className="vault-boy-container"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <img 
                  src={vaultBoyImg} 
                  alt="Vault Boy" 
                  className="vault-boy-img"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Boot Messages */}
        <div className="boot-sequence">
          {skipped
            ? BOOT_MESSAGES.map((msg, index) => (
                <div key={index} className="terminal-line">
                  <span className="text-glow">{msg.text}</span>
                </div>
              ))
            : BOOT_MESSAGES.slice(0, currentLineIndex + 1).map((msg, index) => (
                <TypedLine
                  key={index}
                  text={msg.text}
                  delay={index === 0 ? 60 : 30}
                  isActive={showAscii && index <= currentLineIndex}
                  onComplete={index === currentLineIndex ? handleLineComplete : undefined}
                />
              ))}
        </div>

        {/* Skip Hint */}
        {phase === 'boot' && showAscii && !skipped && (
          <div className="skip-hint">[ PRESS ANY KEY TO SKIP ]</div>
        )}

        {/* Input Prompt */}
        <AnimatePresence>
          {showPrompt && (
            <motion.div
              className="input-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="prompt-line text-glow neon-pulse">
                {'>'} ENTER 키를 누르면 바로 입장합니다.
              </div>
              {cmdLog.length > 0 && (
                <div className="cmd-log">
                  {cmdLog.map((entry, i) => (
                    <div key={i} className="cmd-entry">
                      <div className="terminal-line cmd-echo">{'> '}{entry.cmd}</div>
                      {entry.lines.map((line, j) => (
                        <div key={j} className="terminal-line cmd-resp text-glow">{line}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              <div className="input-line">
                <span className="text-glow">{'>'} </span>
                <input
                  ref={inputRef}
                  type="text"
                  className="terminal-input text-glow"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  spellCheck="false"
                  autoFocus
                />
                <span className="cursor-blink">█</span>
              </div>
              {error && (
                <motion.div
                  key={errorKey}
                  className="error-line text-glow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, x: [0, -8, 8, -5, 5, -2, 0] }}
                  transition={{ x: { duration: 0.4 } }}
                  style={{ color: '#ff3333' }}
                >
                  <ScrambleText
                    text={error}
                    charset="!@#$%&*<>/\\"
                    duration={450}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Authenticating message */}
        <AnimatePresence>
          {phase === 'authenticating' && !glitch && (
            <motion.div
              className="authenticating text-glow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {'> VERIFYING ACCESS KEY...'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Terminal;