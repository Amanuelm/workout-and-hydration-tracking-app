import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { buildWorkbook } from './xlsx';
import { PROGRAM, DAY_NAMES } from './program';
import { dateKey } from './store';

// Turns everything the app has stored into a four-sheet workbook and hands it
// to the system share sheet. Nothing is uploaded — the file is written to the
// app's own cache and shared from there.

function setRows(state) {
  const rows = [['Date', 'Weekday', 'Session', 'Exercise', 'Sets done', 'Sets planned', 'Reps', 'Load']];
  Object.keys(state.done)
    .filter((k) => state.done[k] > 0)
    .sort()
    .forEach((k) => {
      const [date, dayStr, idxStr] = k.split('|');
      const p = PROGRAM[Number(dayStr)];
      const e = p?.ex?.[Number(idxStr)];
      if (!e) return;
      const wd = DAY_NAMES[new Date(date).getDay()] || '';
      rows.push([date, wd, p.t, e.n, state.done[k], e.s, e.r, e.kg]);
    });
  return rows;
}

function waterRows(state) {
  const rows = [['Date', 'Weekday', 'Millilitres', 'Goal', 'Percent of goal']];
  Object.keys(state.water).sort().forEach((d) => {
    const v = state.water[d];
    if (!v) return;
    rows.push([d, DAY_NAMES[new Date(d).getDay()] || '', v, state.goal, Math.round((v / state.goal) * 100)]);
  });
  return rows;
}

function habitRows(state) {
  const rows = [['Date', 'Reminder', 'Done']];
  const byId = Object.fromEntries((state.habits || []).map((h) => [h.id, h]));
  Object.keys(state.habitLog || {}).sort().forEach((k) => {
    const [id, date] = k.split('|');
    const h = byId[id];
    if (!h || h.kind !== 'check') return;
    if (state.habitLog[k]) rows.push([date, h.name, 'yes']);
  });
  return rows;
}

function measureRows(state) {
  const rows = [['Date', 'Measure', 'Value', 'Unit']];
  const byId = Object.fromEntries((state.habits || []).map((h) => [h.id, h]));
  Object.keys(state.habitLog || {}).sort().forEach((k) => {
    const [id, date] = k.split('|');
    const h = byId[id];
    if (!h || h.kind !== 'measure') return;
    const v = state.habitLog[k];
    if (typeof v === 'number') rows.push([date, h.name, v, h.unit || '']);
  });
  return rows;
}

export async function exportWorkbook(state) {
  const b64 = buildWorkbook([
    { name: 'Training', rows: setRows(state) },
    { name: 'Water', rows: waterRows(state) },
    { name: 'Reminders', rows: habitRows(state) },
    { name: 'Measurements', rows: measureRows(state) },
  ]);

  const name = `iron-room-${dateKey(new Date())}.xlsx`;
  const file = new File(Paths.cache, name);
  try { file.create({ overwrite: true }); } catch (e) {}
  await file.write(b64, { encoding: 'base64' });

  if (!(await Sharing.isAvailableAsync())) {
    return { ok: false, reason: 'Sharing is not available on this device.' };
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: 'Export Iron Room data',
    UTI: 'org.openxmlformats.spreadsheetml.sheet',
  });
  return { ok: true, name };
}
