/**
 * NOTES 탭 데이터 — 아티클 / 시 / 철학적 견해 / 개인적 단상
 *
 * 글을 추가하려면 아래 NOTES 배열 맨 앞에 항목을 하나 넣으면 된다.
 * (배열 순서가 곧 표시 순서다. 최신 글을 위에 두면 된다.)
 *
 *   {
 *     id: 'unique-slug',        // 고유 문자열. 아무거나, 중복만 피하면 된다
 *     title: '글 제목',
 *     type: 'POEM',             // ARTICLE | POEM | PHILOSOPHY | THOUGHT
 *     date: '2026-08-07',
 *     excerpt: '목록에 보일 한 줄 요약',
 *     body: `본문.
 *
 * 빈 줄 하나가 문단 구분이다. 길이 제한은 없고,
 * 길어지면 책이 알아서 여러 페이지로 나눈다.`,
 *   }
 */

export const NOTE_TYPES = {
  ARTICLE: { label: 'ARTICLE', ko: '아티클', color: '#38bdf8' },
  POEM: { label: 'POEM', ko: '시', color: '#f472b6' },
  PHILOSOPHY: { label: 'PHILOSOPHY', ko: '철학', color: '#a855f7' },
  THOUGHT: { label: 'THOUGHT', ko: '단상', color: '#facc15' },
};

export const NOTES = [
  {
    id: 'about-this-archive',
    title: '이 서가에 대하여',
    type: 'THOUGHT',
    date: '2026-08-07',
    excerpt: '코드로 남기지 못한 것들을 두는 자리.',
    body: `코드는 무엇을 만들었는지는 말해주지만, 왜 그렇게 만들었는지는 잘 말해주지 않는다.

커밋 로그에 남는 건 결과다. 그 앞에 있던 망설임, 버린 선택지, 밤새 뒤집었다가 결국 처음으로 돌아온 결정 같은 것들은 어디에도 기록되지 않는다.

이 서가는 그런 것들을 두는 자리다.

만들면서 든 생각, 게임이라는 매체에 대한 견해, 가끔은 코드와 아무 상관 없는 문장들. 정리된 결론이 아니라 정리되는 중인 생각을 그대로 둔다.

읽는 사람이 있다면, 결과물보다 그 뒤의 사람을 조금 더 알게 되기를.`,
  },
];
