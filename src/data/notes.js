/**
 * NOTES 탭 데이터 로더
 *
 * ── 글 쓰는 법 ────────────────────────────────────────────────
 * 이 파일은 건드릴 필요가 없다.
 * src/content/notes/ 에 .md 파일을 하나 만들면 자동으로 목록에 뜬다.
 *
 *   src/content/notes/2026-08-08-어떤-제목.md
 *
 *   ---
 *   title: 어떤 제목
 *   type: POEM              # ARTICLE | POEM | PHILOSOPHY | THOUGHT
 *   date: 2026-08-08
 *   excerpt: 목록에 보일 한 줄 요약   # 없으면 첫 문단에서 자동 생성
 *   ---
 *
 *   본문. 빈 줄 하나가 문단 구분이다.
 *   길이 제한은 없고, 길어지면 책이 알아서 페이지를 나눈다.
 *
 * 정렬은 date 내림차순(최신 글이 위)이라 순서를 신경 쓸 필요도 없다.
 * ─────────────────────────────────────────────────────────────
 */

export const NOTE_TYPES = {
  ARTICLE: { label: 'ARTICLE', ko: '아티클', color: '#38bdf8' },
  POEM: { label: 'POEM', ko: '시', color: '#f472b6' },
  PHILOSOPHY: { label: 'PHILOSOPHY', ko: '철학', color: '#a855f7' },
  THOUGHT: { label: 'THOUGHT', ko: '단상', color: '#facc15' },
};

const DEFAULT_TYPE = 'THOUGHT';

/** `--- key: value ---` 형태의 단순 frontmatter 파서 (외부 의존성 없이) */
const parseFrontmatter = (raw) => {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: text.trim() };

  const meta = {};
  for (const line of m[1].split('\n')) {
    const hit = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!hit) continue;
    let value = hit[2].trim().replace(/\s+#.*$/, ''); // 값 뒤 주석 제거
    value = value.replace(/^["'](.*)["']$/, '$1'); // 따옴표 제거
    meta[hit[1]] = value;
  }
  return { meta, body: text.slice(m[0].length).trim() };
};

const firstParagraph = (body) => {
  const p = body.split(/\n\s*\n/)[0] || '';
  return p.length > 90 ? `${p.slice(0, 90).trimEnd()}…` : p;
};

// Vite가 빌드 시점에 마크다운을 전부 문자열로 인라인한다 (런타임 요청 없음)
const files = import.meta.glob('../content/notes/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export const NOTES = Object.entries(files)
  .map(([path, raw]) => {
    const { meta, body } = parseFrontmatter(raw);
    const filename = path.split('/').pop().replace(/\.md$/, '');
    const type = NOTE_TYPES[meta.type] ? meta.type : DEFAULT_TYPE;

    return {
      id: meta.id || filename,
      title: meta.title || filename,
      type,
      // 프론트매터에 date가 없으면 파일명 앞의 YYYY-MM-DD 를 쓴다
      date: meta.date || (filename.match(/^\d{4}-\d{2}-\d{2}/) || [''])[0],
      excerpt: meta.excerpt || firstParagraph(body),
      body,
    };
  })
  // 최신 글이 위로. 같은 날짜면 파일명 역순
  .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id.localeCompare(a.id));
