import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, FlatList, Dimensions, StatusBar, Vibration, Animated, Easing, StyleSheet,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Figure from './Figure';
import { type as T, R } from './theme';

const { height: SH, width: SW } = Dimensions.get('window');

/* One full-height page per exercise, snapped like a vertical feed. */
export default function Player({ c, session, day, setsDone, onLogSet, onClose, rest, startRest, stopRest, insetTop, insetBottom }) {
  const [idx, setIdx] = useState(0);
  const listRef = useRef(null);
  const H = SH;

  const pages = [
    { kind: 'warmup' },
    ...session.ex.map((e, i) => ({ kind: 'ex', e, i })),
    { kind: 'cooldown' },
  ];

  const onViewRef = useRef(({ viewableItems }) => {
    if (viewableItems?.length) setIdx(viewableItems[0].index ?? 0);
  });
  const viewCfg = useRef({ itemVisiblePercentThreshold: 60 });

  const next = useCallback(() => {
    if (idx < pages.length - 1) listRef.current?.scrollToIndex({ index: idx + 1, animated: true });
  }, [idx, pages.length]);

  const totalSets = session.ex.reduce((a, e) => a + e.s, 0);
  const doneSets = session.ex.reduce((a, e, i) => a + Math.min(setsDone(day, i), e.s), 0);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={c.bg} />

      <FlatList
        ref={listRef}
        data={pages}
        keyExtractor={(p, i) => String(i)}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={H}
        decelerationRate="fast"
        getItemLayout={(_, i) => ({ length: H, offset: H * i, index: i })}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewCfg.current}
        renderItem={({ item, index }) => (
          <View style={{ height: H, width: SW }}>
            {item.kind === 'warmup' && <ListPage c={c} title="Warm-up" sub="5 minutes — do not skip" items={session.warm} insetTop={insetTop} onNext={next} />}
            {item.kind === 'cooldown' && <ListPage c={c} title="Cool-down" sub="4 minutes" items={session.cool} insetTop={insetTop} timed onHold={(s) => startRest(s, 'Hold the stretch')} />}
            {item.kind === 'ex' && (
              <ExercisePage
                c={c}
                e={item.e}
                i={item.i}
                active={index === idx}
                done={setsDone(day, item.i)}
                onLog={() => { onLogSet(item.i); }}
                insetTop={insetTop}
                insetBottom={insetBottom}
              />
            )}
          </View>
        )}
      />

      {/* top chrome */}
      <View style={[st.top, { paddingTop: insetTop + 10 }]} pointerEvents="box-none">
        <Pressable onPress={onClose} hitSlop={14} style={[st.round, { backgroundColor: c.surface2 }]}>
          <Svg width={17} height={17} viewBox="0 0 24 24">
            <Path d="M6 6l12 12M18 6L6 18" stroke={c.fg} strokeWidth={2.2} strokeLinecap="round" />
          </Svg>
        </Pressable>
        <View style={{ flex: 1 }} />
        <View style={[st.counter, { backgroundColor: c.surface2 }]}>
          <Text style={[T.label, { color: c.muted }]}>{doneSets}/{totalSets} SETS</Text>
        </View>
      </View>

      {/* page rail */}
      <View style={[st.rail, { top: insetTop + 70 }]} pointerEvents="none">
        {pages.map((_, i) => (
          <View
            key={i}
            style={{
              width: 3,
              height: i === idx ? 20 : 9,
              borderRadius: 2,
              marginVertical: 2.5,
              backgroundColor: i === idx ? c.accent : c.line,
            }}
          />
        ))}
      </View>

      {rest && <RestOverlay c={c} rest={rest} onSkip={stopRest} insetBottom={insetBottom} />}
    </View>
  );
}

/* ---------------- exercise page ---------------- */
function ExercisePage({ c, e, i, active, done, onLog, insetTop, insetBottom }) {
  const press = useRef(new Animated.Value(0)).current;
  const complete = done >= e.s;
  const [showWhy, setShowWhy] = useState(false);

  return (
    <View style={{ flex: 1, paddingTop: insetTop + 58, paddingBottom: insetBottom + 20, paddingHorizontal: 22 }}>
      <Text style={[T.label, { color: c.accent, marginBottom: 6 }]}>EXERCISE {i + 1}</Text>
      <Text style={[T.hero, { color: c.fg }]} numberOfLines={3}>{e.n}</Text>
      <Text style={[T.small, { color: c.muted, marginTop: 8 }]}>
        {e.s} sets · {e.r} · {e.kg}
      </Text>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: Math.min(SW - 44, 330), aspectRatio: 1, borderRadius: R.xl,
          backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: c.line,
        }}>
          <Figure
            kind={e.a}
            size={Math.min(SW - 80, 290)}
            playing={active}
            color={c.fg}
            far={c.figFar}
            accent={c.accent}
            line={c.line}
          />
        </View>
      </View>

      <Pressable onPress={() => setShowWhy((v) => !v)}>
        <Text style={[T.body, { color: c.muted }]} numberOfLines={showWhy ? 8 : 2}>
          <Text style={{ color: c.fg, fontWeight: '700' }}>Form. </Text>{e.c}
          {showWhy && e.w ? `\n\nWhy it's here. ${e.w.replace(/<\/?b>/g, '')}` : ''}
        </Text>
        {!!e.w && (
          <Text style={[T.label, { color: c.dim, marginTop: 8 }]}>{showWhy ? 'LESS' : 'WHY THIS ONE'}</Text>
        )}
      </Pressable>

      {/* set dots */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 18, marginBottom: 14 }}>
        {Array.from({ length: e.s }, (_, k) => (
          <View
            key={k}
            style={{
              flex: 1, height: 6, borderRadius: 3,
              backgroundColor: k < done ? c.accent : c.surface2,
            }}
          />
        ))}
      </View>

      <Animated.View style={{ transform: [{ scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) }] }}>
        <Pressable
          onPressIn={() => Animated.timing(press, { toValue: 1, duration: 90, useNativeDriver: true }).start()}
          onPressOut={() => Animated.timing(press, { toValue: 0, duration: 140, useNativeDriver: true }).start()}
          onPress={() => { Vibration.vibrate(12); onLog(); }}
          style={{
            backgroundColor: complete ? c.surface2 : c.accent,
            borderRadius: R.lg, paddingVertical: 19, alignItems: 'center',
          }}>
          <Text style={[T.h3, { color: complete ? c.muted : c.onAccent, letterSpacing: 0.4 }]}>
            {complete ? 'DONE — TAP TO RESET' : `LOG SET ${done + 1} OF ${e.s}`}
          </Text>
        </Pressable>
      </Animated.View>

      <Text style={[T.label, { color: c.dim, textAlign: 'center', marginTop: 12 }]}>SWIPE UP FOR NEXT</Text>
    </View>
  );
}

/* ---------------- warm-up / cool-down page ---------------- */
function ListPage({ c, title, sub, items, insetTop, timed, onHold, onNext }) {
  return (
    <View style={{ flex: 1, paddingTop: insetTop + 72, paddingHorizontal: 22 }}>
      <Text style={[T.label, { color: c.accent, marginBottom: 6 }]}>{timed ? 'FINISH' : 'START HERE'}</Text>
      <Text style={[T.hero, { color: c.fg }]}>{title}</Text>
      <Text style={[T.small, { color: c.muted, marginTop: 6 }]}>{sub}</Text>

      <View style={{ flex: 1, justifyContent: 'center', gap: 14 }}>
        {items.map((w, i) => (
          <View key={w.n} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Text style={[T.h2, { color: c.dim, width: 26 }, T.num]}>{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[T.h3, { color: c.fg }]}>{w.n}</Text>
              <Text style={[T.small, { color: c.muted }]}>{w.c}</Text>
            </View>
            {timed ? (
              <Pressable
                onPress={() => onHold(w.d)}
                style={{ backgroundColor: c.surface2, borderRadius: R.sm, paddingVertical: 9, paddingHorizontal: 13 }}>
                <Text style={[T.small, { color: c.fg, fontWeight: '800' }, T.num]}>{w.d}s</Text>
              </Pressable>
            ) : (
              <Text style={[T.small, { color: c.dim }, T.num]}>{w.d}</Text>
            )}
          </View>
        ))}
      </View>

      {!timed && (
        <Pressable
          onPress={onNext}
          style={{ backgroundColor: c.accent, borderRadius: R.lg, paddingVertical: 19, alignItems: 'center', marginBottom: 34 }}>
          <Text style={[T.h3, { color: c.onAccent, letterSpacing: 0.4 }]}>WARMED UP — LET'S GO</Text>
        </Pressable>
      )}
      {timed && <View style={{ height: 40 }} />}
    </View>
  );
}

/* ---------------- rest overlay ---------------- */
function RestOverlay({ c, rest, onSkip, insetBottom }) {
  const pct = rest.left / rest.total;
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true })).start();
  }, [spin]);

  const SZ = 230;
  const RAD = (SZ - 18) / 2;
  const CIRC = 2 * Math.PI * RAD;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', paddingBottom: insetBottom }]}>
      <Text style={[T.label, { color: c.accent, marginBottom: 26 }]}>REST</Text>
      <View style={{ width: SZ, height: SZ, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={SZ} height={SZ} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={SZ / 2} cy={SZ / 2} r={RAD} stroke={c.surface2} strokeWidth={9} fill="none" />
          <Circle
            cx={SZ / 2} cy={SZ / 2} r={RAD}
            stroke={c.accent} strokeWidth={9} fill="none" strokeLinecap="round"
            strokeDasharray={`${CIRC}`}
            strokeDashoffset={CIRC * (1 - pct)}
          />
        </Svg>
        <Text style={[{ fontSize: 64, fontWeight: '900', color: c.fg, letterSpacing: -2 }, T.num]}>
          {Math.floor(rest.left / 60)}:{String(rest.left % 60).padStart(2, '0')}
        </Text>
      </View>
      <Text style={[T.body, { color: c.muted, marginTop: 26, textAlign: 'center', paddingHorizontal: 40 }]}>
        {rest.label}
      </Text>
      <Pressable
        onPress={onSkip}
        style={{ marginTop: 34, backgroundColor: c.surface2, borderRadius: R.lg, paddingVertical: 15, paddingHorizontal: 40 }}>
        <Text style={[T.h3, { color: c.fg }]}>Skip rest</Text>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  top: { position: 'absolute', left: 0, right: 0, top: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 10 },
  round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  counter: { borderRadius: 14, paddingVertical: 8, paddingHorizontal: 13 },
  rail: { position: 'absolute', right: 8, alignItems: 'center' },
});
