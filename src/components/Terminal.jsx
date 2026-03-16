{/* eslint-disable no-unused-vars */}
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  { text: 'INDIE ALCHEMIST COMPANY (TM) TERMLINK PROTOCOL', delay: 100 },
  { text: 'ENTER PASSWORD NOW', delay: 80 },
  { text: '', delay: 200 },
  { text: '> INITIALIZING MAIN SYSTEM...', delay: 150 },
  { text: '> FEEDING SEMI-BROKEN PROMPTS TO LLM...', delay: 150 },
  { text: '> GENERATING CODE I DON\'T FULLY UNDERSTAND... OK', delay: 120 },
  { text: '> MOUNTING VIBE-DRIVEN ARCHITECTURE... FINGERS CROSSED', delay: 130 },
  { text: '> PRAYING THE AI DOESN\'T HALLUCINATE AT SCALE... DONE', delay: 100 },
  { text: '', delay: 150 },
  { text: '> ANYWAY MAIN SYSTEM READY', delay: 100 },
  { text: '', delay: 200 },
];

const ACCESS_KEY = 'alena';

const ERROR_MESSAGES = [
  '> ACCESS DENIED - INVALID VIBES: SYSTEM SUSPECTS USER',
  '> ACCESS DENIED - PROMPT REJECTED: BRAIN.EXE FAILED TO TOKENIZE.',
  '> ACCESS DENIED - ZERO CONTEXT: YOUR FINGERS ARE OUT OF SYNC',
];

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

  useEffect(() => {
    if (!isActive) return;
    
    setDisplayedText('');
    setIsComplete(false);
    
    const timeout = setTimeout(() => {
      let currentIndex = 0;
      const intervalId = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsComplete(true);
          clearInterval(intervalId);
          onComplete?.();
        }
      }, 25);

      return () => clearInterval(intervalId);
    }, delay);

    return () => clearTimeout(timeout);
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
  const [glitch, setGlitch] = useState(false);
  const inputRef = useRef(null);

  // Show ASCII art first
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAscii(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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
      }, 300);
    }
  }, [currentLineIndex, phase]);

  // Focus input when ready
  useEffect(() => {
    if (phase === 'input' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase]);

  // Handle authentication
  const handleAuthenticate = useCallback(() => {
    if (inputValue.toLowerCase() === ACCESS_KEY) {
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
                {ASCII_ART}
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
          {BOOT_MESSAGES.slice(0, currentLineIndex + 1).map((msg, index) => (
            <TypedLine
              key={index}
              text={msg.text}
              delay={index === 0 ? 100 : 50}
              isActive={showAscii && index <= currentLineIndex}
              onComplete={index === currentLineIndex ? handleLineComplete : undefined}
            />
          ))}
        </div>

        {/* Input Prompt */}
        <AnimatePresence>
          {showPrompt && (
            <motion.div
              className="input-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="prompt-line text-glow">
                {'>'} 입장하려면 명령어를 입력하세요. (ACCESS_KEY: alena)
              </div>
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
                  className="error-line text-glow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ color: '#ff3333' }}
                >
                  {error}
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