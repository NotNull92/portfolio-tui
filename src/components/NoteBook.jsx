import { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { NOTE_TYPES } from '../data/notes';
import './NoteBook.css';

const GAP = 44; // 두 페이지 사이 접힘(gutter) 폭
const TWO_PAGE_MIN = 620; // 이 폭 아래로는 한 번에 한 페이지만 편다

/**
 * 폴아웃 스킬북 형태의 본문 뷰어.
 * 본문을 CSS 다단으로 흘려 실제 페이지를 만들고, 한 번에 한 장(2페이지)씩 넘긴다.
 */
const NoteBook = ({ note, onClose }) => {
  const viewportRef = useRef(null);
  const flowRef = useRef(null);
  const [spread, setSpread] = useState(0);
  const [layout, setLayout] = useState({ per: 2, colW: 0, gap: GAP, spreads: 1 });

  const measure = useCallback(() => {
    const vp = viewportRef.current;
    const flow = flowRef.current;
    if (!vp || !flow) return;

    const W = vp.clientWidth;
    const per = W >= TWO_PAGE_MIN ? 2 : 1;
    const gap = per === 2 ? GAP : 0;
    const colW = (W - gap * (per - 1)) / per;

    // 다단 폭을 먼저 확정한 뒤 전체 폭을 재야 열 개수가 맞는다
    flow.style.columnWidth = `${colW}px`;
    flow.style.columnGap = `${gap}px`;

    const cols = Math.max(1, Math.round((flow.scrollWidth + gap) / (colW + gap)));
    const spreads = Math.max(1, Math.ceil(cols / per));

    setLayout({ per, colW, gap, spreads });
    setSpread((s) => Math.min(s, spreads - 1));
  }, []);

  useLayoutEffect(() => {
    measure();
    const vp = viewportRef.current;
    if (!vp) return;
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    return () => ro.disconnect();
  }, [measure, note]);

  // 글이 바뀌면 NotesTab이 key로 리마운트하므로 별도 리셋은 필요 없다

  const canPrev = spread > 0;
  const canNext = spread < layout.spreads - 1;
  const turn = useCallback(
    (dir) => setSpread((s) => Math.min(Math.max(s + dir, 0), layout.spreads - 1)),
    [layout.spreads]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') turn(1);
      else if (e.key === 'ArrowLeft') turn(-1);
      else if (e.key === 'Escape') onClose();
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [turn, onClose]);

  if (!note) return null;

  const meta = NOTE_TYPES[note.type] || { label: note.type, ko: '', color: '#88ddaa' };
  const paragraphs = String(note.body || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const offset = -(spread * layout.per * (layout.colW + layout.gap));

  return (
    <motion.div
      className="book-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="book"
        initial={{ scaleY: 0.04, opacity: 0.4 }}
        animate={{ scaleY: 1, opacity: 1 }}
        exit={{ scaleY: 0.04, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={note.title}
      >
        <button className="book-close" onClick={onClose} aria-label="닫기">
          [X]
        </button>

        <div className={`book-viewport ${layout.per === 2 ? 'two-page' : 'one-page'}`} ref={viewportRef}>
          {layout.per === 2 && <div className="book-gutter" aria-hidden="true" />}

          <div className="book-flow" ref={flowRef} style={{ transform: `translateX(${offset}px)` }}>
            {/* 첫 열 = 표제지 (폴아웃 스킬북의 삽화 페이지 자리) */}
            <div className="book-titlepage">
              <div className="book-emblem" aria-hidden="true">
                <span className="book-emblem-mark">{meta.label.charAt(0)}</span>
              </div>
              <h3 className="book-title">{note.title}</h3>
              <div className="book-rule" aria-hidden="true" />
              <div className="book-meta">
                <span className="book-type" style={{ color: meta.color, borderColor: `${meta.color}66` }}>
                  {meta.label}
                </span>
                <span className="book-date">{note.date}</span>
              </div>
            </div>

            {/* 시는 행갈이가 의미를 가지므로 줄바꿈을 보존한다 (pre-line) */}
            <div className={`book-body ${note.type === 'POEM' ? 'verse' : ''}`}>
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="book-footer">
          <button
            className="book-arrow"
            onClick={() => turn(-1)}
            disabled={!canPrev}
            aria-label="이전 장"
          >
            ◀
          </button>
          <span className="book-pagebox">
            <span className="book-pageno">
              {spread + 1} / {layout.spreads}
            </span>
            {layout.spreads > 1 && (
              <span className="book-navhint">← → 방향키로도 넘길 수 있습니다</span>
            )}
          </span>
          <button
            className="book-arrow"
            onClick={() => turn(1)}
            disabled={!canNext}
            aria-label="다음 장"
          >
            ▶
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NoteBook;
