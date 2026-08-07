import { useEffect, useRef } from 'react';

const GLYPHS = 'アイウエオカキクケコサシスセソ0123456789<>/\\*+=█▓▒░';

/**
 * 부모 요소를 가득 채우는 저밀도 ASCII 레인 배경 (canvas, ~20fps).
 * 부모는 position: relative 이어야 하고, 콘텐츠는 z-index를 올려야 한다.
 */
const AsciiRain = ({ opacity = 0.25, fontSize = 14, speed = 1 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let last = 0;
    let cols = [];
    let W = 0;
    let H = 0;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      W = canvas.width = Math.max(1, rect.width | 0);
      H = canvas.height = Math.max(1, rect.height | 0);
      const gap = fontSize * 1.6;
      cols = Array.from({ length: Math.ceil(W / gap) }, (_, i) => ({
        x: i * gap,
        y: Math.random() * H,
        v: (0.6 + Math.random()) * fontSize * speed,
        ch: GLYPHS[(Math.random() * GLYPHS.length) | 0],
      }));
      ctx.fillStyle = '#000d02';
      ctx.fillRect(0, 0, W, H);
    };

    const step = (now) => {
      raf = requestAnimationFrame(step);
      if (now - last < 50) return; // ~20fps로 제한
      last = now;
      ctx.fillStyle = 'rgba(0, 13, 2, 0.16)';
      ctx.fillRect(0, 0, W, H);
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      for (const c of cols) {
        // 이전 헤드 위치는 트레일 색으로 다시 찍고, 새 헤드는 밝게 (Matrix 헤드+트레일)
        ctx.fillStyle = 'rgba(0, 255, 65, 0.5)';
        ctx.fillText(c.ch, c.x, c.y);
        c.y += c.v;
        c.ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        ctx.fillStyle = 'rgba(190, 255, 210, 0.9)';
        ctx.fillText(c.ch, c.x, c.y);
        if (c.y > H + 40) c.y = -20 - Math.random() * H * 0.5;
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [fontSize, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="ascii-rain"
      style={{ opacity }}
      aria-hidden="true"
    />
  );
};

export default AsciiRain;
