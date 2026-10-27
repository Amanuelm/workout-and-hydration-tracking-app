import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ironroom:v1';

export const DEFAULTS = {
  done: {},          // "YYYY-MM-DD|programDay|exerciseIndex" -> sets completed
  water: {},         // "YYYY-MM-DD" -> ml
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
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
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

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const dateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
