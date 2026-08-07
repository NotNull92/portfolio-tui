import { useEffect, useRef } from 'react';

/**
 * 마우스를 따라다니는 인광(phosphor) 글로우. 데스크탑(pointer: fine)에서만 동작.
 */
const CursorGlow = () => {
  const ref = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let x = tx;
    let y = ty;
    let raf = 0;

    // 목표점에 수렴하면 루프를 멈추고, 마우스가 움직일 때만 재시작 (idle CPU 절약)
    const loop = () => {
      const dx = tx - x;
      const dy = ty - y;
      x += dx * 0.12;
      y += dy * 0.12;
      el.style.transform = `translate(${x - 220}px, ${y - 220}px)`;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    };
    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      el.style.opacity = '1';
      if (!raf) raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
};

export default CursorGlow;
