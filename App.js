import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Switch, Vibration,
  useColorScheme, StatusBar, SafeAreaView, Platform, Dimensions, Modal,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

import { PROGRAM, WARMUP, COOLDOWN, DAY_TO_PROGRAM, DAY_NAMES } from './src/program';
import { dark, light, type as T, R } from './src/theme';
import Figure from './src/Figure';
import Player from './src/Player';
import { load, persist, todayKey, dateKey, DEFAULTS } from './src/store';
import * as notify from './src/notify';

const { width: SW } = Dimensions.get('window');

export default function App() {
  const scheme = useColorScheme();
  const [state, setState] = useState(null);
  const [tab, setTab] = useState('today');
  const [sel, setSel] = useState(DAY_TO_PROGRAM[new Date().getDay()]);
  const [playing, setPlaying] = useState(false);
  const [rest, setRest] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    load().then((s) => {
      setState(s);
      notify.setup().then((ok) => { if (ok) notify.reschedule(s); });
    });
  }, []);

  const update = useCallback((patch) => {
    setState((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      persist(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!rest) return;
    timer.current = setInterval(() => {
      setRest((r) => {
        if (!r) return r;
        if (r.left <= 1) {
          clearInterval(timer.current);
          Vibration.vibrate([0, 320, 160, 320]);
          return null;
        }
        return { ...r, left: r.left - 1 };
      });
    }, 1000);
    return () => clearInterval(timer.current);
  }, [rest !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  const startRest = async (seconds, label) => {
    if (!seconds) return;
    if (rest?.notifId) notify.cancel(rest.notifId);
    const id = await notify.scheduleRestEnd(seconds, label);
    setRest({ left: seconds, total: seconds, label: label || '', notifId: id });
  };
  const stopRest = () => {
    if (rest?.notifId) notify.cancel(rest.notifId);
    clearInterval(timer.current);
    setRest(null);
  };

  const sysDark = scheme === 'dark';
  const c = !state ? dark
    : state.theme === 'dark' ? dark
    : state.theme === 'light' ? light
    : sysDark ? dark : light;

  if (!state) return <View style={{ flex: 1, backgroundColor: dark.bg }} />;

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
  const botInset = Platform.OS === 'android' ? 8 : 24;

  const setsDone = (day, i) => state.done[`${todayKey()}|${day}|${i}`] || 0;
  const logSet = (day, i) => {
    const p = PROGRAM[day];
    const e = p.ex[i];
    const key = `${todayKey()}|${day}|${i}`;
    const v = state.done[key] || 0;
    const nv = v + 1 > e.s ? 0 : v + 1;
    update((prev) => ({ ...prev, done: { ...prev.done, [key]: nv } }));
    if (nv > 0 && e.rest) {
      const nx = p.ex[i + 1];
      const label = nv >= e.s && nx ? `Up next: ${nx.n}` : `${e.n} — set ${nv + 1} of ${e.s}`;
      startRest(e.rest, label);
    }
  };

  const waterToday = () => state.water[todayKey()] || 0;
  const addWater = (ml) =>
    update((p) => ({ ...p, water: { ...p.water, [todayKey()]: Math.max(0, (p.water[todayKey()] || 0) + ml) } }));

  const session = PROGRAM[sel];

  if (playing && !session.rest) {
    return (
      <Player
        c={c}
        day={sel}
        session={{ ...session, warm: WARMUP, cool: COOLDOWN }}
        setsDone={setsDone}
        onLogSet={(i) => logSet(sel, i)}
        onClose={() => { stopRest(); setPlaying(false); }}
        rest={rest}
        startRest={startRest}
        stopRest={stopRest}
        insetTop={topInset}
        insetBottom={botInset}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle={c === dark ? 'light-content' : 'dark-content'} backgroundColor={c.bg} />
      <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? topInset : 0 }}>
        <ScrollView
          contentContainerStyle={{ padding: 18, paddingBottom: 120, gap: 16 }}
          showsVerticalScrollIndicator={false}>
          {tab === 'today' && (
            <Home
              c={c} state={state} sel={sel} setSel={setSel} session={session}
              setsDone={setsDone} onStart={() => setPlaying(true)}
              addWater={addWater} waterToday={waterToday}
              onTheme={() => update({ theme: c === dark ? 'light' : 'dark' })}
            />
          )}
          {tab === 'water' && <Water c={c} state={state} addWater={addWater} waterToday={waterToday} />}
          {tab === 'progress' && <Progress c={c} state={state} />}
          {tab === 'settings' && <Settings c={c} state={state} update={update} />}
        </ScrollView>
      </SafeAreaView>

      <View style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row',
        backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.line,
        paddingTop: 10, paddingBottom: botInset + 10,
      }}>
        {[['today', 'Today'], ['water', 'Water'], ['progress', 'Progress'], ['settings', 'You']].map(([k, label]) => (
          <Pressable key={k} style={{ flex: 1, alignItems: 'center', gap: 4 }} onPress={() => setTab(k)}>
            <TabIcon k={k} color={tab === k ? c.accent : c.dim} />
            <Text style={[T.label, { color: tab === k ? c.accent : c.dim, fontSize: 9.5 }]}>{label.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TabIcon({ k, color }) {
  const sw = 1.9;
  const p = {
    today: <Path d="M4 6h16M4 12h16M4 18h9" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />,
    water: <Path d="M12 3s6 6.5 6 10.5A6 6 0 0 1 6 13.5C6 9.5 12 3 12 3Z" stroke={color} strokeWidth={sw} fill="none" strokeLinejoin="round" />,
    progress: <Path d="M4 19V10M10 19V5M16 19v-6M22 19H2" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />,
    settings: <><Circle cx={12} cy={9} r={3.4} stroke={color} strokeWidth={sw} fill="none" /><Path d="M5 20c1.5-3.4 4-5 7-5s5.5 1.6 7 5" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" /></>,
  }[k];
  return <Svg width={22} height={22} viewBox="0 0 24 24">{p}</Svg>;
}

/* ================= HOME ================= */
function Home({ c, state, sel, setSel, session, setsDone, onStart, addWater, waterToday, onTheme }) {
  const isToday = sel === DAY_TO_PROGRAM[new Date().getDay()];
  const total = session.ex.reduce((a, e) => a + e.s, 0);
  const done = session.ex.reduce((a, e, i) => a + Math.min(setsDone(sel, i), e.s), 0);
  const started = done > 0;
  const finished = total > 0 && done >= total;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';

  const ml = waterToday();
  const wpct = Math.min(1, ml / state.goal);

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={[T.label, { color: c.dim }]}>{greet.toUpperCase()}</Text>
          <Text style={[T.h1, { color: c.fg, marginTop: 2 }]}>Iron Room</Text>
        </View>
        <Pressable onPress={onTheme} hitSlop={12}
          style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={17} height={17} viewBox="0 0 24 24">
            <Path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z" fill={c.fg} />
          </Svg>
        </Pressable>
      </View>

      {/* week strip */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {DAY_NAMES.map((d, i) => {
          const k = DAY_TO_PROGRAM[i];
          const on = k === sel;
          const isRest = PROGRAM[k].rest;
          const td = i === new Date().getDay();
          return (
            <Pressable key={d} onPress={() => setSel(k)}
              style={{
                flex: 1, paddingVertical: 11, borderRadius: R.sm, alignItems: 'center',
                backgroundColor: on ? c.accent : c.surface,
                borderWidth: 1, borderColor: on ? c.accent : td ? c.line : 'transparent',
              }}>
              <Text style={[T.label, { fontSize: 9.5, color: on ? c.onAccent : isRest ? c.dim : c.muted }]}>
                {d.toUpperCase()}
              </Text>
              <View style={{
                width: 4, height: 4, borderRadius: 2, marginTop: 5,
                backgroundColor: on ? c.onAccent : isRest ? 'transparent' : c.accent,
              }} />
            </Pressable>
          );
        })}
      </View>

      {/* hero session card */}
      {session.rest ? (
        <View style={{ backgroundColor: c.surface, borderRadius: R.lg, padding: 22, borderWidth: 1, borderColor: c.line }}>
          <Text style={[T.label, { color: c.dim }]}>{isToday ? 'TODAY' : DAY_NAMES[sel].toUpperCase()}</Text>
          <Text style={[T.hero, { color: c.fg, marginTop: 6 }]}>Rest day</Text>
          <Text style={[T.body, { color: c.muted, marginTop: 10 }]}>
            Nothing scheduled. Walk, eat well, sleep. Muscle is built now, not in the session.
          </Text>
        </View>
      ) : (
        <View style={{ backgroundColor: c.surface, borderRadius: R.lg, borderWidth: 1, borderColor: c.line, overflow: 'hidden' }}>
          <View style={{ padding: 22, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1 }}>
                <Text style={[T.label, { color: c.accent }]}>{isToday ? "TODAY'S SESSION" : DAY_NAMES[sel].toUpperCase()}</Text>
                <Text style={[T.h1, { color: c.fg, marginTop: 6 }]}>{session.t}</Text>
                <Text style={[T.small, { color: c.muted, marginTop: 4 }]}>
                  {session.f} · {session.ex.length} exercises
                </Text>
              </View>
              <View style={{ marginLeft: 8, marginTop: -4 }}>
                <Figure kind={session.ex[0]?.a || 'goblet'} size={86} playing color={c.fg} far={c.figFar} accent={c.accent} line={c.line} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 4, marginTop: 18 }}>
              {session.ex.map((e, i) => {
                const d = Math.min(setsDone(sel, i), e.s);
                return (
                  <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: c.surface2, overflow: 'hidden' }}>
                    <View style={{ width: `${(d / e.s) * 100}%`, height: '100%', backgroundColor: c.accent }} />
                  </View>
                );
              })}
            </View>
            <Text style={[T.small, { color: c.dim, marginTop: 8 }, T.num]}>{done} of {total} sets logged</Text>
          </View>

          <Pressable
            onPress={onStart}
            style={{ backgroundColor: finished ? c.surface2 : c.accent, paddingVertical: 20, alignItems: 'center' }}>
            <Text style={[T.h2, { color: finished ? c.muted : c.onAccent, letterSpacing: 0.3 }]}>
              {finished ? 'REVIEW SESSION' : started ? 'CONTINUE' : 'START WORKOUT'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* water strip */}
      <Pressable
        onPress={() => addWater(state.glass)}
        style={{
          backgroundColor: c.surface, borderRadius: R.lg, padding: 18,
          borderWidth: 1, borderColor: c.line, flexDirection: 'row', alignItems: 'center', gap: 16,
        }}>
        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c.waterSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path d="M12 3s6 6.5 6 10.5A6 6 0 0 1 6 13.5C6 9.5 12 3 12 3Z" fill={c.water} />
          </Svg>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[T.h3, { color: c.fg }, T.num]}>{(ml / 1000).toFixed(1)} / {(state.goal / 1000).toFixed(1)} L</Text>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surface2, marginTop: 7, overflow: 'hidden' }}>
            <View style={{ width: `${wpct * 100}%`, height: '100%', backgroundColor: c.water, borderRadius: 3 }} />
          </View>
        </View>
        <View style={{ backgroundColor: c.surface2, borderRadius: R.sm, paddingVertical: 9, paddingHorizontal: 13 }}>
          <Text style={[T.small, { color: c.fg, fontWeight: '800' }]}>+{state.glass}</Text>
        </View>
      </Pressable>

      <View style={{ backgroundColor: c.surface, borderRadius: R.lg, padding: 16, borderWidth: 1, borderColor: c.warn + '55' }}>
        <Text style={[T.small, { color: c.muted }]}>
          <Text style={{ color: c.warn, fontWeight: '800' }}>Shoulder rule. </Text>
          Nothing in this program loads your right shoulder overhead. If something leaves you sore the next
          morning, cut the load or the range — and get the shoulder assessed rather than training through it.
        </Text>
      </View>
    </>
  );
}

/* ================= WATER ================= */
function Water({ c, state, addWater, waterToday }) {
  const ml = waterToday();
  const glasses = Math.ceil(state.goal / state.glass);
  const filled = Math.floor(ml / state.glass);
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i);
    return { l: DAY_NAMES[d.getDay()], v: state.water[dateKey(d)] || 0 };
  });
  return (
    <>
      <Text style={[T.h1, { color: c.fg }]}>Hydration</Text>

      <View style={{ backgroundColor: c.surface, borderRadius: R.lg, padding: 22, borderWidth: 1, borderColor: c.line, alignItems: 'center' }}>
        <Text style={[{ fontSize: 54, fontWeight: '900', color: c.fg, letterSpacing: -2 }, T.num]}>
          {(ml / 1000).toFixed(1)}
        </Text>
        <Text style={[T.small, { color: c.muted }, T.num]}>of {(state.goal / 1000).toFixed(1)} litres</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20, justifyContent: 'center' }}>
          {Array.from({ length: glasses }, (_, i) => (
            <View key={i} style={{
              width: 34, height: 44, borderRadius: 7, borderWidth: 2,
              borderColor: i < filled ? c.water : c.line,
              backgroundColor: i < filled ? c.water : 'transparent',
            }} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 22, alignSelf: 'stretch' }}>
          <Pressable onPress={() => addWater(-state.glass)}
            style={{ backgroundColor: c.surface2, borderRadius: R.md, paddingVertical: 15, paddingHorizontal: 22 }}>
            <Text style={[T.h3, { color: c.fg }]}>−</Text>
          </Pressable>
          <Pressable onPress={() => { Vibration.vibrate(10); addWater(state.glass); }}
            style={{ flex: 1, backgroundColor: c.water, borderRadius: R.md, paddingVertical: 15, alignItems: 'center' }}>
            <Text style={[T.h3, { color: '#06151C' }]}>+ {state.glass} ml</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ backgroundColor: c.surface, borderRadius: R.lg, padding: 18, borderWidth: 1, borderColor: c.line }}>
        <Text style={[T.label, { color: c.dim }]}>LAST 7 DAYS</Text>
        <Bars c={c} data={last7} max={state.goal} color={c.water} />
      </View>
    </>
  );
}

function Bars({ c, data, max, color }) {
  const m = Math.max(max, ...data.map((d) => d.v)) || 1;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, marginTop: 14, gap: 7 }}>
      {data.map((d, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
          <View style={{
            width: '100%', borderRadius: 6, backgroundColor: color,
            height: `${Math.max(3, (d.v / m) * 86)}%`, opacity: d.v ? 1 : 0.25,
          }} />
          <Text style={[T.label, { color: c.dim, fontSize: 9.5, marginTop: 7 }]}>{d.l.toUpperCase()}</Text>
        </View>
      ))}
    </View>
  );
}

/* ================= PROGRESS ================= */
function Progress({ c, state }) {
  let sets = 0; const days = new Set();
  Object.keys(state.done).forEach((k) => { if (state.done[k] > 0) { sets += state.done[k]; days.add(k.split('|')[0]); } });
  const wk = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i);
    const ds = dateKey(d); let n = 0;
    Object.keys(state.done).forEach((k) => { if (k.startsWith(ds)) n += state.done[k]; });
    return { l: DAY_NAMES[d.getDay()], v: n };
  });
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = dateKey(d);
    const has = Object.keys(state.done).some((k) => k.startsWith(ds) && state.done[k] > 0);
    if (has) streak++; else if (i > 0) break;
  }
  const Stat = ({ v, l }) => (
    <View style={{ flex: 1, backgroundColor: c.surface, borderRadius: R.md, padding: 16, borderWidth: 1, borderColor: c.line }}>
      <Text style={[{ fontSize: 30, fontWeight: '900', color: c.fg, letterSpacing: -1 }, T.num]}>{v}</Text>
      <Text style={[T.label, { color: c.dim, marginTop: 3, fontSize: 9.5 }]}>{l}</Text>
    </View>
  );
  return (
    <>
      <Text style={[T.h1, { color: c.fg }]}>Progress</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stat v={sets} l="SETS" />
        <Stat v={days.size} l="SESSIONS" />
        <Stat v={streak} l="STREAK" />
      </View>
      <View style={{ backgroundColor: c.surface, borderRadius: R.lg, padding: 18, borderWidth: 1, borderColor: c.line }}>
        <Text style={[T.label, { color: c.dim }]}>SETS THIS WEEK</Text>
        <Bars c={c} data={wk} max={8} color={c.accent} />
      </View>
      <View style={{ backgroundColor: c.surface, borderRadius: R.lg, padding: 18, borderWidth: 1, borderColor: c.line }}>
        <Text style={[T.label, { color: c.dim }]}>HOW TO PROGRESS</Text>
        <Text style={[T.body, { color: c.muted, marginTop: 10 }]}>
          Hit the top of the rep range on every set? Next session add a rep, slow the lowering to four seconds,
          or add a set. Once 12kg feels easy for 20+ reps, switch to the single-arm or single-leg version — that
          doubles the load per limb, which is your main route forward with these dumbbells.
        </Text>
        <Text style={[T.body, { color: c.muted, marginTop: 12 }]}>
          Protein is the other half: roughly 1.6g per kg of bodyweight per day, or the training will not show.
        </Text>
      </View>
    </>
  );
}

/* ================= SETTINGS ================= */
function Settings({ c, state, update }) {
  const commit = (patch) => { update(patch); notify.reschedule({ ...state, ...patch }); };
  const num = (v, fb) => { const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10); return Number.isFinite(n) ? n : fb; };
  const Row = ({ label, children }) => (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: c.line,
    }}>
      <Text style={[T.body, { color: c.fg, flex: 1 }]}>{label}</Text>
      {children}
    </View>
  );
  const Input = (props) => (
    <TextInput
      {...props}
      keyboardType="number-pad"
      placeholderTextColor={c.dim}
      style={{
        backgroundColor: c.surface2, borderRadius: R.sm, paddingHorizontal: 12, paddingVertical: 9,
        color: c.fg, fontSize: 15, fontWeight: '700', minWidth: 72, textAlign: 'center',
      }}
    />
  );
  const Card = ({ title, children }) => (
    <View style={{ backgroundColor: c.surface, borderRadius: R.lg, padding: 18, borderWidth: 1, borderColor: c.line }}>
      <Text style={[T.label, { color: c.dim, marginBottom: 4 }]}>{title}</Text>
      {children}
    </View>
  );

  return (
    <>
      <Text style={[T.h1, { color: c.fg }]}>You</Text>

      <Card title="REMINDERS">
        <Row label="Workout reminder">
          <Switch value={state.remindWorkout} onValueChange={(v) => commit({ remindWorkout: v })}
            trackColor={{ true: c.accent, false: c.surface2 }} thumbColor={c.fg} />
        </Row>
        <Row label="Time of day">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Input defaultValue={String(state.trainHour)}
              onEndEditing={(e) => commit({ trainHour: Math.min(23, num(e.nativeEvent.text, state.trainHour)) })} />
            <Text style={[T.h3, { color: c.muted }]}>:</Text>
            <Input defaultValue={String(state.trainMin).padStart(2, '0')}
              onEndEditing={(e) => commit({ trainMin: Math.min(59, num(e.nativeEvent.text, state.trainMin)) })} />
          </View>
        </Row>
        <Row label="Water reminder">
          <Switch value={state.remindWater} onValueChange={(v) => commit({ remindWater: v })}
            trackColor={{ true: c.accent, false: c.surface2 }} thumbColor={c.fg} />
        </Row>
        <Row label="Nudge every (min)">
          <Input defaultValue={String(state.waterEvery)}
            onEndEditing={(e) => commit({ waterEvery: Math.max(15, num(e.nativeEvent.text, state.waterEvery)) })} />
        </Row>
        <Text style={[T.small, { color: c.dim, marginTop: 10 }]}>
          Reminders are scheduled on this phone and fire whether or not the app is open.
        </Text>
      </Card>

      <Card title="HYDRATION">
        <Row label="Daily goal (ml)">
          <Input defaultValue={String(state.goal)}
            onEndEditing={(e) => update({ goal: Math.max(500, num(e.nativeEvent.text, state.goal)) })} />
        </Row>
        <Row label="Glass size (ml)">
          <Input defaultValue={String(state.glass)}
            onEndEditing={(e) => update({ glass: Math.max(50, num(e.nativeEvent.text, state.glass)) })} />
        </Row>
      </Card>

      <Card title="APPEARANCE">
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          {[['system', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([k, l]) => (
            <Pressable key={k} onPress={() => update({ theme: k })}
              style={{
                flex: 1, paddingVertical: 12, borderRadius: R.sm, alignItems: 'center',
                backgroundColor: state.theme === k ? c.accent : c.surface2,
              }}>
              <Text style={[T.small, { color: state.theme === k ? c.onAccent : c.fg, fontWeight: '800' }]}>{l}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card title="YOUR EQUIPMENT">
        <Text style={[T.body, { color: c.muted, marginTop: 8 }]}>
          2 × 12kg dumbbells · 2 × 6kg dumbbells · ab roller · resistance band · mat.
          Every exercise in the program uses only these.
        </Text>
      </Card>

      <Card title="DATA">
        <Text style={[T.body, { color: c.muted, marginTop: 8, marginBottom: 14 }]}>
          Everything is stored on this phone. Nothing is uploaded anywhere.
        </Text>
        <Pressable onPress={() => {
          const t = todayKey(); const done = { ...state.done };
          Object.keys(done).forEach((k) => { if (k.startsWith(t)) delete done[k]; });
          update({ done });
        }}
          style={{ backgroundColor: c.surface2, borderRadius: R.sm, paddingVertical: 13, alignItems: 'center' }}>
          <Text style={[T.body, { color: c.fg, fontWeight: '700' }]}>Clear today's sets</Text>
        </Pressable>
        <Pressable onPress={() => update({ ...DEFAULTS })}
          style={{ backgroundColor: c.surface2, borderRadius: R.sm, paddingVertical: 13, alignItems: 'center', marginTop: 8 }}>
          <Text style={[T.body, { color: c.warn, fontWeight: '700' }]}>Reset everything</Text>
        </Pressable>
      </Card>
    </>
  );
}
