import { useEffect, useLayoutEffect, useRef, useCallback } from 'react';

const DEFAULT_CHARSET = '!<>-_\\/[]{}=+*^?#@%&$01';
const FRAME_MS = 33; // ~30fps — 스크램블 체감에는 충분하면서 부하는 절반

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const scrambleAll = (text, charset) =>
  text
    .split('')
    .map((ch) => (ch === ' ' || ch === '\n' ? ch : charset[(Math.random() * charset.length) | 0]))
    .join('');

/**
 * Originkit 스타일 스크램블(디크립트) 텍스트.
 * 글자들이 랜덤 글리프를 순환하다가 왼쪽부터 순서대로 실제 글자로 확정된다.
 * 성능: React 리렌더 없이 textContent를 직접 갱신한다 (setState 프레임 폭풍 방지).
 */
const ScrambleText = ({
  text,
  tag = 'span',
  charset = DEFAULT_CHARSET,
  duration = 700,
  delay = 0,
  className = '',
  rescrambleOnHover = false,
}) => {
  const Tag = tag;
  const ref = useRef(null);
  const rafRef = useRef(null);

  const run = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = text;
      return;
    }
    cancelAnimationFrame(rafRef.current);
    let start = null;
    let last = 0;
    const tick = (now) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / duration);
      if (now - last >= FRAME_MS || t >= 1) {
        last = now;
        let out = '';
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === ' ' || ch === '\n') {
            out += ch;
            continue;
          }
          // 왼쪽부터 순차 확정, 나머지는 랜덤 글리프
          out += t * text.length >= i + 1 ? ch : charset[(Math.random() * charset.length) | 0];
        }
        el.textContent = out;
      }
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [text, duration, charset]);

  // 첫 페인트 전에 스크램블 상태로 시작 (delay 동안 원문이 노출되는 것 방지)
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !prefersReducedMotion()) el.textContent = scrambleAll(text, charset);
  }, [text, charset]);

  useEffect(() => {
    const id = setTimeout(run, delay);
    return () => {
      clearTimeout(id);
      cancelAnimationFrame(rafRef.current);
    };
  }, [run, delay]);

  return (
    <Tag
      ref={ref}
      className={className}
      onMouseEnter={rescrambleOnHover ? run : undefined}
    >
      {text}
    </Tag>
  );
};

export default ScrambleText;
