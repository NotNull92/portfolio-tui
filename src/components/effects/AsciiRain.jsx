import { useEffect, useRef } from 'react';

const GLYPHS = 'アイウエオカキクケコサシスセソ0123456789<>/\\*+=█▓▒░';

/**
 * 부모 요소를 가득 채우는 저밀도 ASCII 레인 배경 (canvas).
 * 이동은 매 프레임(dt 기반)이라 60/120Hz 어디서든 부드럽고,
 * 글리프 문자 교체만 ~90ms 간격으로 스텝 — 20fps 통짜 제한은
 * 화면에서 가장 큰 움직임을 뚝뚝 끊기게 만들어 페이지 전체가
 * 버벅이는 인상을 준다 (부드러운 디스플레이의 Mac에서 특히).
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
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf;
    let last = 0;
    let cols = [];
    let W = 0;
    let H = 0;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      W = Math.max(1, rect.width | 0);
      H = Math.max(1, rect.height | 0);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gap = fontSize * 1.6;
      cols = Array.from({ length: Math.ceil(W / gap) }, (_, i) => ({
        x: i * gap,
        y: Math.random() * H,
        v: (0.6 + Math.random()) * fontSize * speed * 20, // px/s (기존 20fps 스텝과 동일 체감 속도)
        ch: GLYPHS[(Math.random() * GLYPHS.length) | 0],
        swap: Math.random() * 90,
      }));
      ctx.fillStyle = '#000d02';
      ctx.fillRect(0, 0, W, H);
    };

    const step = (now) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min(now - last, 50);
      last = now;
      if (dt <= 0) return;
      const dts = dt / 1000;
      // 페이드 알파를 dt 에 비례시켜 60Hz/120Hz 에서 트레일 길이가 같게 유지
      ctx.fillStyle = `rgba(0, 13, 2, ${Math.min(0.16 * (dt / 50), 0.35)})`;
      ctx.fillRect(0, 0, W, H);
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      for (const c of cols) {
        c.y += c.v * dts;
        c.swap -= dt;
        if (c.swap <= 0) {
          c.swap = 90;
          c.ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        ctx.fillStyle = 'rgba(0, 255, 65, 0.55)';
        ctx.fillText(c.ch, c.x, c.y - fontSize);
        ctx.fillStyle = 'rgba(190, 255, 210, 0.9)';
        ctx.fillText(c.ch, c.x, c.y);
        if (c.y > H + 40) c.y = -20 - Math.random() * H * 0.5;
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    last = performance.now();
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
