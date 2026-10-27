import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ironroom:v1';

export const todayKey = () => dateKey(new Date());

export const dateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Seeded reminders. All deletable — they are a starting point, not a fixture.
const SEED_HABITS = [
  { id: 'h_minox', name: 'Minoxidil 5ml', kind: 'check', unit: '',
    sched: { type: 'daily', hour: 21, min: 0, days: [], every: 1 }, on: true, created: todayKey() },
  { id: 'h_weight', name: 'Weight', kind: 'measure', unit: 'kg',
    sched: { type: 'weekly', hour: 8, min: 0, days: [5], every: 1 }, on: true, created: todayKey() },
  { id: 'h_height', name: 'Height', kind: 'measure', unit: 'cm',
    sched: { type: 'weekly', hour: 8, min: 0, days: [5], every: 1 }, on: true, created: todayKey() },
];

export const DEFAULTS = {
  done: {},          // "YYYY-MM-DD|programDay|exerciseIndex" -> sets completed
  water: {},         // "YYYY-MM-DD" -> ml
  habits: SEED_HABITS,
  habitLog: {},      // "habitId|YYYY-MM-DD" -> true (check) | number (measure)
  goal: 3000,
  glass: 250,
  trainHour: 18,
  trainMin: 0,
  remindWorkout: true,
  remindWater: true,
  waterEvery: 60,    // minutes
  theme: 'system',
};

export async function load() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const saved = JSON.parse(raw);
    // Merge so a version that predates habits still gets the new fields.
    return {
      ...DEFAULTS,
      ...saved,
      habits: Array.isArray(saved.habits) ? saved.habits : DEFAULTS.habits,
      habitLog: saved.habitLog || {},
    };
  } catch (e) {
    return { ...DEFAULTS };
  }
}

export async function persist(state) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // offline-only app; a failed write is not worth interrupting a session for
  }
}

/* ---------- habit scheduling ---------- */

export function isDueOn(habit, date) {
  const s = habit.sched || {};
  if (s.type === 'daily') return true;
  if (s.type === 'weekly') return (s.days || []).includes(date.getDay());
  if (s.type === 'interval') {
    const start = new Date(habit.created || todayKey());
    const days = Math.floor((date - start) / 86400000);
    return days >= 0 && days % Math.max(1, s.every || 1) === 0;
  }
  return false;
}

export const habitValue = (state, id, dk) => state.habitLog[`${id}|${dk}`];

export function scheduleLabel(h) {
  const s = h.sched || {};
  const t = `${String(s.hour ?? 9).padStart(2, '0')}:${String(s.min ?? 0).padStart(2, '0')}`;
  const NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (s.type === 'daily') return `Every day · ${t}`;
  if (s.type === 'weekly') {
    const d = (s.days || []).map((i) => NAMES[i]).join(', ') || 'no day set';
    return `${d} · ${t}`;
  }
  return `Every ${s.every || 1} days · ${t}`;
}
