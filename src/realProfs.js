// Real Yale SOM professors you can chat with. Keys are the backend's professor ids
// (instructor slugs from GET /api/professors); `who` is the key used in Faculty.jsx's ROOM_PROFESSOR.
export const REAL_PROFS = {
  'tauhid-zaman': {
    who: 'zaman',
    name: 'Prof. Tauhid Zaman',
    short: 'Prof. Zaman',
    initials: 'TZ',
    sub: 'MGT 409 · AI Foundations for Managers · Evans 2200',
    intro: 'Ask about MGT 409, stats and regression, or any course in the Fall 2026 catalog.',
    suggestions: ['Yo prof, what is omitted variable bias?', 'Which AI courses are offered this fall?', 'Explain the central limit theorem like I’m 10'],
  },
  'peter-schott': {
    who: 'schott',
    name: 'Prof. Peter Schott',
    short: 'Prof. Schott',
    initials: 'PS',
    sub: 'MGT 407 Statistics (EMBA) · Evans 2210',
    intro: 'Ask about probability and statistics, regression, international trade, or any course in the catalog. Fair warning: he loves problem sets.',
    suggestions: ['What’s a p-value, really?', 'How long is the next problem set?', 'Did trade with China really hurt US manufacturing?'],
  },
}

export const PROF_ID_BY_WHO = Object.fromEntries(Object.entries(REAL_PROFS).map(([id, p]) => [p.who, id]))
