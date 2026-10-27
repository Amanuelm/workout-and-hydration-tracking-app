// Iron Room palette. Dark-first: this is an app used in a dim room at 6am.
// Accent is a hot signal orange reserved for action — the one thing that moves
// you forward on a screen. Water keeps its own cool blue so the two never read
// as the same kind of progress.

export const dark = {
  bg: '#0B0D13',
  surface: '#141822',
  surface2: '#1D222E',
  line: '#2A3040',
  fg: '#F3F5F9',
  muted: '#8A93A6',
  dim: '#5A6274',
  accent: '#FF5A1F',
  accentSoft: '#2A1710',
  onAccent: '#14060A',
  ok: '#3DD68C',
  warn: '#F0A741',
  water: '#38B6E6',
  waterSoft: '#10242E',
  figFar: '#5A6274',
};

export const light = {
  bg: '#F4F5F7',
  surface: '#FFFFFF',
  surface2: '#EBEDF1',
  line: '#DCDFE6',
  fg: '#12151C',
  muted: '#5D6575',
  dim: '#8B93A3',
  accent: '#D9430C',
  accentSoft: '#FDEAE1',
  onAccent: '#FFFFFF',
  ok: '#17895A',
  warn: '#A8690E',
  water: '#0E7FAC',
  waterSoft: '#E2F1F8',
  figFar: '#AEB5C2',
};

// Type scale. No custom font files, so weight and letter-spacing carry the
// personality: heavy condensed-feeling display, quiet readable body.
export const type = {
  hero: { fontSize: 38, fontWeight: '900', letterSpacing: -1.0 },
  h1: { fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '800', letterSpacing: -0.2 },
  h3: { fontSize: 16.5, fontWeight: '700', letterSpacing: -0.1 },
  body: { fontSize: 14.5, fontWeight: '400', lineHeight: 21 },
  small: { fontSize: 12.5, fontWeight: '500', lineHeight: 18 },
  label: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4 },
  num: { fontVariant: ['tabular-nums'] },
};

export const R = { sm: 10, md: 16, lg: 22, xl: 30 };
