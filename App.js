import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Switch, Vibration,
  useColorScheme, StatusBar, SafeAreaView, Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { PROGRAM, WARMUP, COOLDOWN, DAY_TO_PROGRAM, DAY_NAMES } from './src/program';
import { dark, light } from './src/theme';
import Figure from './src/Figure';
import { load, persist, todayKey, dateKey, DEFAULTS } from './src/store';
import * as notify from './src/notify';

export default function App() {
  const scheme = useColorScheme();
  const [state, setState] = useState(null);
  const [tab, setTab] = useState('today');
  const [sel, setSel] = useState(DAY_TO_PROGRAM[new Date().getDay()]);
  const [openEx, setOpenEx] = useState(null);
  const [showWarm, setShowWarm] = useState(false);
  const [showCool, setShowCool] = useState(false);
  const [rest, setRest] = useState(null); // {left,total,label,notifId}
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

  // rest countdown
  useEffect(() => {
    if (!rest) return;
    timer.current = setInterval(() => {
      setRest((r) => {
        if (!r) return r;
        if (r.left <= 1) {
          clearInterval(timer.current);
          Vibration.vibrate([0, 300, 150, 300]);
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

  const dk = scheme === 'dark';
  const c = state?.theme === 'dark' ? dark : state?.theme === 'light' ? light : dk ? dark : light;

  if (!state) return <View style={{ flex: 1, backgroundColor: dk ? dark.bg : light.bg }} />;

  const setsDone = (day, i) => state.done[`${todayKey()}|${day}|${i}`] || 0;
  const bumpSet = (day, i, total, restSec, nextLabel) => {
    const key = `${todayKey()}|${day}|${i}`;
    const v = state.done[key] || 0;
    const nv = v + 1 > total ? 0 : v + 1;
    update((p) => ({ ...p, done: { ...p.done, [key]: nv } }));
    if (nv > 0 && restSec) startRest(restSec, nextLabel);
  };
  const waterToday = () => state.water[todayKey()] || 0;
  const addWater = (ml) =>
    update((p) => ({ ...p, water: { ...p.water, [todayKey()]: Math.max(0, (p.water[todayKey()] || 0) + ml) } }));

  const S = styles(c);

  return (
    <SafeAreaView style={[S.root, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
      <StatusBar barStyle={c === dark ? 'light-content' : 'dark-content'} backgroundColor={c.surface} />
      <View style={S.header}>
        <Text style={S.brand}>IRON <Text style={{ color: c.accent }}>ROOM</Text></Text>
        <Pressable
          style={S.iconBtn}
          onPress={() => update({ theme: c === dark ? 'light' : 'dark' })}>
          <Text style={{ color: c.fg, fontSize: 16 }}>◐</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={S.main} keyboardShouldPersistTaps="handled">
        {tab === 'today' && (
          <TodayTab
            c={c} S={S} sel={sel} setSel={setSel} openEx={openEx} setOpenEx={setOpenEx}
            setsDone={setsDone} bumpSet={bumpSet} startRest={startRest}
            showWarm={showWarm} setShowWarm={setShowWarm} showCool={showCool} setShowCool={setShowCool}
          />
        )}
        {tab === 'water' && <WaterTab c={c} S={S} state={state} addWater={addWater} waterToday={waterToday} />}
        {tab === 'progress' && <ProgressTab c={c} S={S} state={state} />}
        {tab === 'settings' && <SettingsTab c={c} S={S} state={state} update={update} />}
      </ScrollView>

      {rest && (
        <View style={S.restBar}>
          <View style={[S.restFill, { width: `${(rest.left / rest.total) * 100}%` }]} />
          <Text style={S.restNum}>{Math.floor(rest.left / 60)}:{String(rest.left % 60).padStart(2, '0')}</Text>
          <View style={{ flex: 1 }}>
            <Text style={S.restLbl}>REST</Text>
            <Text style={S.restNext} numberOfLines={1}>{rest.label}</Text>
          </View>
          <Pressable style={S.restSkip} onPress={stopRest}><Text style={S.restSkipTxt}>Skip</Text></Pressable>
        </View>
      )}

      <View style={S.nav}>
        {[
          ['today', 'Today'], ['water', 'Water'], ['progress', 'Progress'], ['settings', 'Settings'],
        ].map(([k, label]) => (
          <Pressable key={k} style={S.navBtn} onPress={() => { setTab(k); setSel(DAY_TO_PROGRAM[new Date().getDay()]); }}>
            <TabIcon k={k} color={tab === k ? c.accent : c.muted} />
            <Text style={[S.navTxt, { color: tab === k ? c.accent : c.muted }]}>{label.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

function TabIcon({ k, color }) {
  const p = {
    today: <Path d="M4 7h16M4 12h16M4 17h10" stroke={color} strokeWidth="1.9" strokeLinecap="round" fill="none" />,
    water: <Path d="M12 3s6 6.5 6 10.5A6 6 0 0 1 6 13.5C6 9.5 12 3 12 3Z" stroke={color} strokeWidth="1.9" fill="none" strokeLinejoin="round" />,
    progress: <Path d="M4 19V9M10 19V5M16 19v-7M22 19H2" stroke={color} strokeWidth="1.9" strokeLinecap="round" fill="none" />,
    settings: <><Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.9" fill="none" /><Path d="M4 12h2m12 0h2M12 4v2m0 12v2" stroke={color} strokeWidth="1.9" strokeLinecap="round" fill="none" /></>,
  }[k];
  return <Svg width={21} height={21} viewBox="0 0 24 24">{p}</Svg>;
}

/* ---------------- Today ---------------- */
function TodayTab({ c, S, sel, setSel, openEx, setOpenEx, setsDone, bumpSet, startRest, showWarm, setShowWarm, showCool, setShowCool }) {
  const p = PROGRAM[sel];
  const isToday = sel === DAY_TO_PROGRAM[new Date().getDay()];
  const dayRow = (
    <View style={S.dayRow}>
      {DAY_NAMES.map((d, i) => {
        const on = DAY_TO_PROGRAM[i] === sel;
        return (
          <Pressable key={d} onPress={() => { setSel(DAY_TO_PROGRAM[i]); setOpenEx(null); }}
            style={[S.dayBtn, on && { backgroundColor: c.accent }]}>
            <Text style={[S.dayTxt, on && { color: c.onAccent }]}>{d}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (p.rest) {
    return (
      <>
        <View style={S.card}>
          <Text style={S.eyebrow}>{isToday ? 'TODAY' : DAY_NAMES[sel].toUpperCase()}</Text>
          <Text style={S.lead}>REST DAY</Text>
          <Text style={S.sub}>Nothing scheduled. Walk, eat well, sleep. Growth happens now, not in the session.</Text>
        </View>
        {dayRow}
      </>
    );
  }

  const total = p.ex.reduce((a, e) => a + e.s, 0);
  const done = p.ex.reduce((a, e, i) => a + Math.min(setsDone(sel, i), e.s), 0);

  return (
    <>
      <View style={S.card}>
        <View style={S.row}>
          <View style={{ flex: 1 }}>
            <Text style={S.eyebrow}>{isToday ? `TODAY · ${DAY_NAMES[new Date().getDay()].toUpperCase()}` : DAY_NAMES[sel].toUpperCase()}</Text>
            <Text style={S.lead}>{p.t.toUpperCase()}</Text>
            <Text style={S.sub}>{p.f}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={S.statBig}>{done}/{total}</Text>
            <Text style={S.statLbl}>SETS</Text>
          </View>
        </View>
        <View style={S.bar}><View style={[S.barFill, { width: `${total ? (done / total) * 100 : 0}%` }]} /></View>
      </View>

      {dayRow}

      <Pressable style={S.card} onPress={() => setShowWarm(!showWarm)}>
        <View style={S.row}>
          <View style={{ flex: 1 }}>
            <Text style={S.eyebrow}>STEP 1</Text>
            <Text style={S.exName}>Warm-up · 5 min</Text>
          </View>
          <Text style={S.pill}>{showWarm ? 'HIDE' : 'OPEN'}</Text>
        </View>
        {showWarm && (
          <View style={{ marginTop: 10, gap: 10 }}>
            {WARMUP.map((w) => (
              <View key={w.n}>
                <Text style={S.itemName}>{w.n} <Text style={S.sub}>· {w.d}</Text></Text>
                <Text style={S.subSmall}>{w.c}</Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>

      {p.ex.map((e, i) => {
        const sd = setsDone(sel, i);
        const open = openEx === i;
        const cmp = sd >= e.s;
        return (
          <View key={e.n} style={[S.card, { padding: 0 }, open && { borderColor: c.accent }, cmp && { opacity: 0.62 }]}>
            <Pressable style={S.exHead} onPress={() => setOpenEx(open ? null : i)}>
              <View style={S.figWrap}>
                <Figure kind={e.a} size={56} color={c.fg} accent={c.accent} line={c.line} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.exName}>{e.n}</Text>
                <Text style={S.subSmall}>{e.s} × {e.r} · {e.kg}</Text>
              </View>
              <Text style={[S.pill, cmp && { color: c.ok }, !cmp && sd > 0 && { color: c.accent }]}>{sd}/{e.s}</Text>
            </Pressable>
            {open && (
              <View style={S.exBody}>
                <View style={S.bigFig}>
                  <Figure kind={e.a} size={130} color={c.fg} accent={c.accent} line={c.line} />
                </View>
                <Text style={S.cue}>{e.c}</Text>
                {!!e.w && <Text style={S.why}><Text style={{ color: c.fg, fontWeight: '700' }}>Why it's here — </Text>{e.w}</Text>}
                <View style={S.sets}>
                  {Array.from({ length: e.s }, (_, k) => (
                    <View key={k} style={[S.setDot, k < sd && { backgroundColor: c.ok, borderColor: c.ok }]}>
                      <Text style={[S.setDotTxt, k < sd && { color: '#fff' }]}>{k + 1}</Text>
                    </View>
                  ))}
                </View>
                <Pressable
                  style={S.btn}
                  onPress={() => {
                    const nx = p.ex[i + 1];
                    const label = sd + 1 >= e.s && nx ? `Next: ${nx.n}` : `${e.n} · set ${sd + 2}`;
                    bumpSet(sel, i, e.s, e.rest, label);
                  }}>
                  <Text style={S.btnTxt}>Set done{e.rest ? ` · rest ${e.rest}s` : ''}</Text>
                </Pressable>
              </View>
            )}
          </View>
        );
      })}

      <Pressable style={S.card} onPress={() => setShowCool(!showCool)}>
        <View style={S.row}>
          <View style={{ flex: 1 }}>
            <Text style={S.eyebrow}>STEP 3</Text>
            <Text style={S.exName}>Cool-down · 4 min</Text>
          </View>
          <Text style={S.pill}>{showCool ? 'HIDE' : 'OPEN'}</Text>
        </View>
        {showCool && (
          <View style={{ marginTop: 10, gap: 10 }}>
            {COOLDOWN.map((w) => (
              <View key={w.n} style={S.row}>
                <View style={{ flex: 1 }}>
                  <Text style={S.itemName}>{w.n}</Text>
                  <Text style={S.subSmall}>{w.c}</Text>
                </View>
                <Pressable style={S.ghostBtn} onPress={() => startRest(w.d, 'Hold the stretch')}>
                  <Text style={S.ghostTxt}>{w.d}s</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </Pressable>

      <View style={S.warnBox}>
        <Text style={S.warnTxt}>
          <Text style={{ color: c.warn, fontWeight: '700' }}>Shoulder rule. </Text>
          Nothing here loads your right shoulder overhead. If an exercise leaves you sore the next morning, cut the load or the range — and get the shoulder assessed rather than training through it.
        </Text>
      </View>
    </>
  );
}

/* ---------------- Water ---------------- */
function WaterTab({ c, S, state, addWater, waterToday }) {
  const ml = waterToday();
  const glasses = Math.ceil(state.goal / state.glass);
  const filled = Math.floor(ml / state.glass);
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i);
    return { l: DAY_NAMES[d.getDay()], v: state.water[dateKey(d)] || 0 };
  });
  return (
    <>
      <View style={S.card}>
        <View style={S.row}>
          <View style={{ flex: 1 }}>
            <Text style={S.eyebrow}>HYDRATION</Text>
            <Text style={S.lead}>{(ml / 1000).toFixed(1)}<Text style={{ fontSize: 17 }}> / {(state.goal / 1000).toFixed(1)} L</Text></Text>
          </View>
          <Pressable style={S.smBtn} onPress={() => addWater(state.glass)}>
            <Text style={S.btnTxt}>+{state.glass} ml</Text>
          </Pressable>
        </View>
        <View style={S.bar}><View style={[S.barFill, { width: `${Math.min(100, (ml / state.goal) * 100)}%`, backgroundColor: c.water }]} /></View>
        <View style={S.glasses}>
          {Array.from({ length: glasses }, (_, i) => (
            <View key={i} style={[S.glass, i < filled && { backgroundColor: c.water, borderColor: c.water }]}>
              <Text style={{ color: i < filled ? '#fff' : c.muted, fontSize: 11, fontWeight: '700' }}>{i < filled ? '✓' : ''}</Text>
            </View>
          ))}
        </View>
        <Pressable style={[S.ghostBtn, { alignSelf: 'flex-start', marginTop: 12 }]} onPress={() => addWater(-state.glass)}>
          <Text style={S.ghostTxt}>− {state.glass} ml</Text>
        </Pressable>
      </View>

      <View style={S.card}>
        <Text style={S.eyebrow}>LAST 7 DAYS</Text>
        <View style={S.chart}>
          {last7.map((d, i) => (
            <View key={i} style={S.chartCol}>
              <View style={{ width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: c.water, height: `${Math.max(3, Math.min(100, (d.v / state.goal) * 100))}%` }} />
              <Text style={S.chartLbl}>{d.l}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

/* ---------------- Progress ---------------- */
function ProgressTab({ c, S, state }) {
  let sets = 0; const days = new Set();
  Object.keys(state.done).forEach((k) => { if (state.done[k] > 0) { sets += state.done[k]; days.add(k.split('|')[0]); } });
  const wk = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i);
    const ds = dateKey(d); let n = 0;
    Object.keys(state.done).forEach((k) => { if (k.startsWith(ds)) n += state.done[k]; });
    return { l: DAY_NAMES[d.getDay()], v: n };
  });
  const max = Math.max(8, ...wk.map((d) => d.v));
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = dateKey(d);
    const has = Object.keys(state.done).some((k) => k.startsWith(ds) && state.done[k] > 0);
    if (has) streak++; else if (i > 0) break;
  }
  return (
    <>
      <View style={S.card}>
        <Text style={S.eyebrow}>ALL TIME</Text>
        <View style={[S.row, { gap: 26, marginTop: 10 }]}>
          <View><Text style={S.statBig}>{sets}</Text><Text style={S.statLbl}>SETS LOGGED</Text></View>
          <View><Text style={S.statBig}>{days.size}</Text><Text style={S.statLbl}>SESSIONS</Text></View>
          <View><Text style={S.statBig}>{streak}</Text><Text style={S.statLbl}>DAY STREAK</Text></View>
        </View>
      </View>
      <View style={S.card}>
        <Text style={S.eyebrow}>SETS THIS WEEK</Text>
        <View style={S.chart}>
          {wk.map((d, i) => (
            <View key={i} style={S.chartCol}>
              <Text style={[S.chartLbl, { marginBottom: 4 }]}>{d.v || ''}</Text>
              <View style={{ width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: c.accent, height: `${Math.max(3, (d.v / max) * 100)}%` }} />
              <Text style={S.chartLbl}>{d.l}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={S.card}>
        <Text style={S.eyebrow}>HOW TO PROGRESS</Text>
        <Text style={[S.sub, { marginTop: 8 }]}>
          Hit the top of the rep range on every set? Next session add a rep, slow the lowering to four seconds, or add a set.
          Once 12kg feels easy for 20+ reps, switch to the single-arm or single-leg version — that doubles the load per limb,
          which is your main route forward with these dumbbells.
        </Text>
        <Text style={[S.sub, { marginTop: 10 }]}>
          Protein is the other half: roughly 1.6g per kg of bodyweight per day, or the training will not show.
        </Text>
      </View>
    </>
  );
}

/* ---------------- Settings ---------------- */
function SettingsTab({ c, S, state, update }) {
  const commit = (patch) => {
    const next = { ...state, ...patch };
    update(patch);
    notify.reschedule(next);
  };
  const num = (v, fallback) => {
    const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) ? n : fallback;
  };
  return (
    <>
      <View style={S.card}>
        <Text style={S.eyebrow}>REMINDERS</Text>
        <View style={S.setRow}>
          <Text style={S.setLbl}>Workout reminder</Text>
          <Switch value={state.remindWorkout} onValueChange={(v) => commit({ remindWorkout: v })}
            trackColor={{ true: c.accent }} />
        </View>
        <View style={S.setRow}>
          <Text style={S.setLbl}>Time</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TextInput style={S.input} keyboardType="number-pad" defaultValue={String(state.trainHour)}
              onEndEditing={(e) => commit({ trainHour: Math.min(23, num(e.nativeEvent.text, state.trainHour)) })} />
            <Text style={S.setLbl}>:</Text>
            <TextInput style={S.input} keyboardType="number-pad" defaultValue={String(state.trainMin).padStart(2, '0')}
              onEndEditing={(e) => commit({ trainMin: Math.min(59, num(e.nativeEvent.text, state.trainMin)) })} />
          </View>
        </View>
        <View style={S.setRow}>
          <Text style={S.setLbl}>Water reminder</Text>
          <Switch value={state.remindWater} onValueChange={(v) => commit({ remindWater: v })}
            trackColor={{ true: c.accent }} />
        </View>
        <View style={S.setRow}>
          <Text style={S.setLbl}>Every (minutes)</Text>
          <TextInput style={S.input} keyboardType="number-pad" defaultValue={String(state.waterEvery)}
            onEndEditing={(e) => commit({ waterEvery: Math.max(15, num(e.nativeEvent.text, state.waterEvery)) })} />
        </View>
      </View>

      <View style={S.card}>
        <Text style={S.eyebrow}>HYDRATION</Text>
        <View style={S.setRow}>
          <Text style={S.setLbl}>Daily goal (ml)</Text>
          <TextInput style={S.input} keyboardType="number-pad" defaultValue={String(state.goal)}
            onEndEditing={(e) => update({ goal: Math.max(500, num(e.nativeEvent.text, state.goal)) })} />
        </View>
        <View style={S.setRow}>
          <Text style={S.setLbl}>Glass size (ml)</Text>
          <TextInput style={S.input} keyboardType="number-pad" defaultValue={String(state.glass)}
            onEndEditing={(e) => update({ glass: Math.max(50, num(e.nativeEvent.text, state.glass)) })} />
        </View>
      </View>

      <View style={S.card}>
        <Text style={S.eyebrow}>YOUR EQUIPMENT</Text>
        <Text style={[S.sub, { marginTop: 8 }]}>
          2 × 12kg dumbbells · 2 × 6kg dumbbells · ab roller · resistance band · mat.
          Every exercise in the program uses only these.
        </Text>
      </View>

      <View style={S.card}>
        <Text style={S.eyebrow}>DATA</Text>
        <Text style={[S.sub, { marginTop: 8, marginBottom: 12 }]}>
          Everything is stored on this phone only. Nothing is uploaded anywhere.
        </Text>
        <Pressable style={S.ghostBtn} onPress={() => {
          const t = todayKey();
          const done = { ...state.done };
          Object.keys(done).forEach((k) => { if (k.startsWith(t)) delete done[k]; });
          update({ done });
        }}>
          <Text style={S.ghostTxt}>Clear today's logged sets</Text>
        </Pressable>
        <Pressable style={[S.ghostBtn, { marginTop: 8 }]} onPress={() => update({ ...DEFAULTS })}>
          <Text style={[S.ghostTxt, { color: c.warn }]}>Reset everything</Text>
        </Pressable>
      </View>
    </>
  );
}

/* ---------------- styles ---------------- */
function styles(c) {
  return {
    root: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10,
      backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.line,
    },
    brand: { flex: 1, color: c.fg, fontSize: 20, fontWeight: '800', letterSpacing: 1.4 },
    iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
    main: { padding: 16, paddingBottom: 140, gap: 14 },

    card: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 14 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    eyebrow: { color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.3 },
    lead: { color: c.fg, fontSize: 27, fontWeight: '800', letterSpacing: 0.4, marginTop: 2 },
    sub: { color: c.muted, fontSize: 13.5, lineHeight: 20 },
    subSmall: { color: c.muted, fontSize: 12.5, lineHeight: 18 },
    itemName: { color: c.fg, fontSize: 14, fontWeight: '600' },
    pill: { color: c.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },

    bar: { height: 9, borderRadius: 999, backgroundColor: c.surface2, overflow: 'hidden', marginTop: 12 },
    barFill: { height: '100%', backgroundColor: c.accent, borderRadius: 999 },

    statBig: { color: c.fg, fontSize: 26, fontWeight: '800' },
    statLbl: { color: c.muted, fontSize: 10.5, fontWeight: '700', letterSpacing: 1 },

    dayRow: { flexDirection: 'row', gap: 6 },
    dayBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: c.surface2, alignItems: 'center' },
    dayTxt: { color: c.muted, fontSize: 12.5, fontWeight: '700' },

    exHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
    figWrap: { width: 62, height: 62, borderRadius: 11, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
    exName: { color: c.fg, fontSize: 16.5, fontWeight: '700' },
    exBody: { paddingHorizontal: 12, paddingBottom: 12, gap: 11 },
    bigFig: { height: 150, borderRadius: 11, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
    cue: { color: c.muted, fontSize: 13, lineHeight: 19, borderLeftWidth: 2, borderLeftColor: c.line, paddingLeft: 10 },
    why: { color: c.muted, fontSize: 12, lineHeight: 18 },
    sets: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    setDot: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
    setDotTxt: { color: c.muted, fontWeight: '700', fontSize: 13 },

    btn: { backgroundColor: c.accent, borderRadius: 11, paddingVertical: 13, alignItems: 'center' },
    btnTxt: { color: c.onAccent, fontWeight: '800', fontSize: 14.5 },
    smBtn: { backgroundColor: c.accent, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 13 },
    ghostBtn: { backgroundColor: c.surface2, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 13, alignSelf: 'flex-start' },
    ghostTxt: { color: c.fg, fontWeight: '700', fontSize: 13 },

    glasses: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 12 },
    glass: { width: 42, height: 54, borderRadius: 8, borderWidth: 2, borderColor: c.line, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },

    chart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, marginTop: 12, gap: 7 },
    chartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
    chartLbl: { color: c.muted, fontSize: 11, marginTop: 6 },

    setRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: c.line },
    setLbl: { color: c.fg, fontSize: 14 },
    input: { backgroundColor: c.surface2, borderWidth: 1, borderColor: c.line, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, color: c.fg, fontSize: 14, minWidth: 64, textAlign: 'center' },

    warnBox: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.warn, borderRadius: 12, padding: 12 },
    warnTxt: { color: c.muted, fontSize: 12.5, lineHeight: 18 },

    restBar: {
      position: 'absolute', left: 0, right: 0, bottom: 72, backgroundColor: c.accent,
      flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12,
    },
    restFill: { position: 'absolute', left: 0, top: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.75)' },
    restNum: { color: c.onAccent, fontSize: 34, fontWeight: '800', minWidth: 86 },
    restLbl: { color: c.onAccent, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.2, opacity: 0.85 },
    restNext: { color: c.onAccent, fontSize: 13.5, fontWeight: '700' },
    restSkip: { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 13 },
    restSkipTxt: { color: c.onAccent, fontWeight: '800', fontSize: 13 },

    nav: {
      position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row',
      backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.line, paddingBottom: 10, paddingTop: 9,
    },
    navBtn: { flex: 1, alignItems: 'center', gap: 3 },
    navTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  };
}
