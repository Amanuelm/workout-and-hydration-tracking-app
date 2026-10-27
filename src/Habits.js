import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Switch, Modal, ScrollView, Vibration } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { type as T, R } from './theme';
import { isDueOn, habitValue, scheduleLabel, todayKey } from './store';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const uid = () => `h_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

const Check = ({ color }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24">
    <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

/* ---------- today's due reminders, shown on the home screen ---------- */
export function DueToday({ c, state, onCheck, onMeasure }) {
  const dk = todayKey();
  const now = new Date();
  const due = (state.habits || []).filter((h) => h.on && isDueOn(h, now));
  if (!due.length) return null;

  return (
    <View style={{ backgroundColor: c.surface, borderRadius: R.lg, padding: 18, borderWidth: 1, borderColor: c.line }}>
      <Text style={[T.label, { color: c.dim, marginBottom: 12 }]}>DUE TODAY</Text>
      <View style={{ gap: 9 }}>
        {due.map((h) => {
          const v = habitValue(state, h.id, dk);
          const done = h.kind === 'check' ? v === true : typeof v === 'number';
          return (
            <Pressable
              key={h.id}
              onPress={() => { Vibration.vibrate(10); h.kind === 'check' ? onCheck(h.id) : onMeasure(h); }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                backgroundColor: c.surface2, borderRadius: R.md, padding: 13,
                borderWidth: 1, borderColor: done ? c.ok : 'transparent',
              }}>
              <View style={{
                width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
                backgroundColor: done ? c.ok : 'transparent', borderWidth: done ? 0 : 2, borderColor: c.line,
              }}>
                {done && <Check color={c.bg} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[T.h3, { color: c.fg }]}>{h.name}</Text>
                {h.kind === 'measure' && (
                  <Text style={[T.small, { color: c.muted }]}>
                    {typeof v === 'number' ? `${v} ${h.unit}` : `Tap to log · ${h.unit}`}
                  </Text>
                )}
              </View>
              {h.kind === 'measure' && typeof v === 'number' && (
                <Text style={[T.h3, { color: c.accent }, T.num]}>{v}</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ---------- manage reminders (profile page) ---------- */
export function HabitManager({ c, state, update, reschedule }) {
  const [editing, setEditing] = useState(null);

  const save = (h) => {
    const list = state.habits || [];
    const exists = list.some((x) => x.id === h.id);
    const habits = exists ? list.map((x) => (x.id === h.id ? h : x)) : [...list, h];
    update({ habits });
    reschedule({ ...state, habits });
    setEditing(null);
  };
  const remove = (id) => {
    const habits = (state.habits || []).filter((x) => x.id !== id);
    update({ habits });
    reschedule({ ...state, habits });
    setEditing(null);
  };
  const toggle = (id, on) => {
    const habits = (state.habits || []).map((x) => (x.id === id ? { ...x, on } : x));
    update({ habits });
    reschedule({ ...state, habits });
  };

  return (
    <View style={{ backgroundColor: c.surface, borderRadius: R.lg, padding: 18, borderWidth: 1, borderColor: c.line }}>
      <Text style={[T.label, { color: c.dim, marginBottom: 6 }]}>REMINDERS</Text>

      {(state.habits || []).map((h) => (
        <View key={h.id} style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: c.line,
        }}>
          <Pressable style={{ flex: 1 }} onPress={() => setEditing(h)}>
            <Text style={[T.body, { color: c.fg, fontWeight: '700' }]}>
              {h.name}{h.kind === 'measure' ? ` · ${h.unit}` : ''}
            </Text>
            <Text style={[T.small, { color: c.muted }]}>{scheduleLabel(h)}</Text>
          </Pressable>
          <Switch
            value={!!h.on}
            onValueChange={(v) => toggle(h.id, v)}
            trackColor={{ true: c.accent, false: c.surface2 }}
            thumbColor={c.fg}
          />
        </View>
      ))}

      <Pressable
        onPress={() => setEditing({
          id: uid(), name: '', kind: 'check', unit: '',
          sched: { type: 'daily', hour: 9, min: 0, days: [], every: 2 },
          on: true, created: todayKey(),
        })}
        style={{ backgroundColor: c.surface2, borderRadius: R.sm, paddingVertical: 13, alignItems: 'center', marginTop: 14 }}>
        <Text style={[T.body, { color: c.accent, fontWeight: '800' }]}>+ Add a reminder</Text>
      </Pressable>

      {editing && (
        <HabitEditor
          c={c}
          habit={editing}
          isNew={!(state.habits || []).some((x) => x.id === editing.id)}
          onSave={save}
          onDelete={remove}
          onClose={() => setEditing(null)}
        />
      )}
    </View>
  );
}

/* ---------- add / edit sheet ---------- */
function HabitEditor({ c, habit, isNew, onSave, onDelete, onClose }) {
  const [h, setH] = useState(habit);
  const s = h.sched;
  const set = (p) => setH((x) => ({ ...x, ...p }));
  const setS = (p) => setH((x) => ({ ...x, sched: { ...x.sched, ...p } }));
  const num = (v, fb, max) => {
    const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) ? Math.min(max, n) : fb;
  };

  const Seg = ({ options, value, onPick }) => (
    <View style={{ flexDirection: 'row', gap: 7, marginTop: 9 }}>
      {options.map(([k, l]) => (
        <Pressable key={k} onPress={() => onPick(k)}
          style={{
            flex: 1, paddingVertical: 11, borderRadius: R.sm, alignItems: 'center',
            backgroundColor: value === k ? c.accent : c.surface2,
          }}>
          <Text style={[T.small, { color: value === k ? c.onAccent : c.fg, fontWeight: '800' }]}>{l}</Text>
        </Pressable>
      ))}
    </View>
  );
  const Field = ({ label, children }) => (
    <View style={{ marginTop: 18 }}>
      <Text style={[T.label, { color: c.dim }]}>{label}</Text>
      {children}
    </View>
  );
  const input = {
    backgroundColor: c.surface2, borderRadius: R.sm, paddingHorizontal: 14, paddingVertical: 12,
    color: c.fg, fontSize: 16, fontWeight: '600', marginTop: 9,
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000A', justifyContent: 'flex-end' }}>
        <View style={{
          backgroundColor: c.bg, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl,
          paddingHorizontal: 22, paddingTop: 20, paddingBottom: 34, maxHeight: '92%',
        }}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={[T.h1, { color: c.fg }]}>{isNew ? 'New reminder' : 'Edit reminder'}</Text>

            <Field label="NAME">
              <TextInput
                value={h.name}
                onChangeText={(v) => set({ name: v })}
                placeholder="Minoxidil 5ml"
                placeholderTextColor={c.dim}
                style={input}
              />
            </Field>

            <Field label="TYPE">
              <Seg
                options={[['check', 'Tick it off'], ['measure', 'Log a number']]}
                value={h.kind}
                onPick={(k) => set({ kind: k, unit: k === 'measure' && !h.unit ? 'kg' : h.unit })}
              />
            </Field>

            {h.kind === 'measure' && (
              <Field label="UNIT">
                <TextInput
                  value={h.unit}
                  onChangeText={(v) => set({ unit: v })}
                  placeholder="kg"
                  placeholderTextColor={c.dim}
                  style={input}
                />
              </Field>
            )}

            <Field label="HOW OFTEN">
              <Seg
                options={[['daily', 'Daily'], ['weekly', 'Weekly'], ['interval', 'Every N days']]}
                value={s.type}
                onPick={(k) => setS({ type: k })}
              />
            </Field>

            {s.type === 'weekly' && (
              <Field label="DAYS">
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 9 }}>
                  {DAYS.map((d, i) => {
                    const on = (s.days || []).includes(i);
                    return (
                      <Pressable key={i}
                        onPress={() => setS({
                          days: on ? s.days.filter((x) => x !== i) : [...(s.days || []), i].sort(),
                        })}
                        style={{
                          flex: 1, aspectRatio: 1, borderRadius: R.sm, alignItems: 'center', justifyContent: 'center',
                          backgroundColor: on ? c.accent : c.surface2,
                        }}>
                        <Text style={[T.small, { color: on ? c.onAccent : c.muted, fontWeight: '800' }]}>{d}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Field>
            )}

            {s.type === 'interval' && (
              <Field label="REPEAT EVERY (DAYS)">
                <TextInput
                  defaultValue={String(s.every || 2)}
                  keyboardType="number-pad"
                  onEndEditing={(e) => setS({ every: Math.max(1, num(e.nativeEvent.text, s.every || 2, 365)) })}
                  style={input}
                />
              </Field>
            )}

            <Field label="TIME">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TextInput
                  defaultValue={String(s.hour ?? 9).padStart(2, '0')}
                  keyboardType="number-pad"
                  onEndEditing={(e) => setS({ hour: num(e.nativeEvent.text, s.hour ?? 9, 23) })}
                  style={[input, { flex: 1, textAlign: 'center' }]}
                />
                <Text style={[T.h2, { color: c.muted, marginTop: 9 }]}>:</Text>
                <TextInput
                  defaultValue={String(s.min ?? 0).padStart(2, '0')}
                  keyboardType="number-pad"
                  onEndEditing={(e) => setS({ min: num(e.nativeEvent.text, s.min ?? 0, 59) })}
                  style={[input, { flex: 1, textAlign: 'center' }]}
                />
              </View>
            </Field>

            <Pressable
              onPress={() => h.name.trim() && onSave({ ...h, name: h.name.trim() })}
              style={{
                backgroundColor: h.name.trim() ? c.accent : c.surface2,
                borderRadius: R.lg, paddingVertical: 17, alignItems: 'center', marginTop: 26,
              }}>
              <Text style={[T.h3, { color: h.name.trim() ? c.onAccent : c.dim }]}>
                {isNew ? 'Add reminder' : 'Save changes'}
              </Text>
            </Pressable>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Pressable onPress={onClose}
                style={{ flex: 1, backgroundColor: c.surface2, borderRadius: R.lg, paddingVertical: 15, alignItems: 'center' }}>
                <Text style={[T.body, { color: c.fg, fontWeight: '700' }]}>Cancel</Text>
              </Pressable>
              {!isNew && (
                <Pressable onPress={() => onDelete(h.id)}
                  style={{ flex: 1, backgroundColor: c.surface2, borderRadius: R.lg, paddingVertical: 15, alignItems: 'center' }}>
                  <Text style={[T.body, { color: c.warn, fontWeight: '700' }]}>Delete</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ---------- log a measurement ---------- */
export function MeasureEntry({ c, habit, current, onSave, onClose }) {
  const [v, setV] = useState(current != null ? String(current) : '');
  const parsed = parseFloat(String(v).replace(',', '.'));
  const valid = Number.isFinite(parsed);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: '#000B', justifyContent: 'center', padding: 28 }} onPress={onClose}>
        <Pressable style={{ backgroundColor: c.bg, borderRadius: R.xl, padding: 24 }} onPress={() => {}}>
          <Text style={[T.label, { color: c.accent }]}>LOG</Text>
          <Text style={[T.h1, { color: c.fg, marginTop: 4 }]}>{habit.name}</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 }}>
            <TextInput
              value={v}
              onChangeText={setV}
              keyboardType="decimal-pad"
              autoFocus
              placeholder="0"
              placeholderTextColor={c.dim}
              style={{
                flex: 1, backgroundColor: c.surface2, borderRadius: R.md,
                paddingHorizontal: 18, paddingVertical: 16,
                color: c.fg, fontSize: 32, fontWeight: '900', textAlign: 'center',
              }}
            />
            <Text style={[T.h2, { color: c.muted }]}>{habit.unit}</Text>
          </View>

          <Pressable
            onPress={() => valid && onSave(parsed)}
            style={{
              backgroundColor: valid ? c.accent : c.surface2,
              borderRadius: R.lg, paddingVertical: 16, alignItems: 'center', marginTop: 20,
            }}>
            <Text style={[T.h3, { color: valid ? c.onAccent : c.dim }]}>Save</Text>
          </Pressable>
          {current != null && (
            <Pressable onPress={() => onSave(null)} style={{ paddingVertical: 14, alignItems: 'center' }}>
              <Text style={[T.body, { color: c.muted }]}>Clear today's entry</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
