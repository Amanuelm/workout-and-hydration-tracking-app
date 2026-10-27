import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { G, Line, Circle, Rect } from 'react-native-svg';
import { frames as buildFrames, meta, gearPoints } from './rig';

const ALine = Animated.createAnimatedComponent(Line);
const ACircle = Animated.createAnimatedComponent(Circle);
const AG = Animated.createAnimatedComponent(G);

const N = 11;
const INPUT = Array.from({ length: N }, (_, i) => i / (N - 1));

// Pluck a nested joint, e.g. 'legN.knee'
const at = (f, path) => path.split('.').reduce((o, k) => o[k], f);

// Body segments: [from, to, strokeWidth, layer]
const BODY = [
  ['hip', 'legF.knee', 5.0, 'far'],
  ['legF.knee', 'legF.ankle', 4.6, 'far'],
  ['legF.ankle', 'legF.toe', 4.0, 'far'],
  ['neck', 'armF.elbow', 4.6, 'far'],
  ['armF.elbow', 'armF.hand', 4.2, 'far'],
  ['hip', 'neck', 7.5, 'near'],
  ['neck', 'head', 5.0, 'near'],
  ['hip', 'legN.knee', 5.6, 'near'],
  ['legN.knee', 'legN.ankle', 5.2, 'near'],
  ['legN.ankle', 'legN.toe', 4.4, 'near'],
  ['neck', 'armN.elbow', 5.2, 'near'],
  ['armN.elbow', 'armN.hand', 4.8, 'near'],
];

function unwrap(series) {
  const out = series.slice();
  for (let i = 1; i < out.length; i++) {
    while (out[i] - out[i - 1] > 180) out[i] -= 360;
    while (out[i] - out[i - 1] < -180) out[i] += 360;
  }
  return out;
}

export default function Figure({
  kind,
  size = 64,
  playing = true,
  color = '#F2F3F7',
  far = '#6B7384',
  accent = '#FF5A1F',
  line = '#2A2F3C',
  showFloor = true,
}) {
  const t = useRef(new Animated.Value(0)).current;
  const { fr, m, gears } = useMemo(() => {
    const f = buildFrames(kind, N);
    const mm = meta(kind);
    return { fr: f, m: mm, gears: f.map((x) => gearPoints(x, mm.gear)) };
  }, [kind]);

  useEffect(() => {
    t.stopAnimation();
    if (!playing) { t.setValue(0.35); return; }
    const half = m.ms;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: half, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
        Animated.timing(t, { toValue: 0, duration: half, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [t, playing, kind, m.ms]);

  const chan = (get) => t.interpolate({ inputRange: INPUT, outputRange: fr.map(get) });

  const seg = (from, to, w, layer, key) => (
    <ALine
      key={key}
      x1={chan((f) => at(f, from)[0])}
      y1={chan((f) => at(f, from)[1])}
      x2={chan((f) => at(f, to)[0])}
      y2={chan((f) => at(f, to)[1])}
      stroke={layer === 'far' ? far : color}
      strokeWidth={w}
      strokeLinecap="round"
    />
  );

  const g0 = gears[0];
  const equip = [];

  if (g0?.type === 'db') {
    g0.bars.forEach((_, i) => {
      const rots = unwrap(gears.map((g) => g.bars[i].rot));
      equip.push(
        <AG
          key={`db${i}`}
          translateX={t.interpolate({ inputRange: INPUT, outputRange: gears.map((g) => g.bars[i].p[0]) })}
          translateY={t.interpolate({ inputRange: INPUT, outputRange: gears.map((g) => g.bars[i].p[1]) })}
        >
          <AG rotation={t.interpolate({ inputRange: INPUT, outputRange: rots })}>
            <Line x1={-7} y1={0} x2={7} y2={0} stroke={accent} strokeWidth={3.4} strokeLinecap="round" />
            <Rect x={-11.5} y={-5} width={5.5} height={10} rx={2} fill={accent} />
            <Rect x={6} y={-5} width={5.5} height={10} rx={2} fill={accent} />
          </AG>
        </AG>
      );
    });
  }

  const bandSeg = (key, getA, getB, op = 1) => (
    <ALine
      key={key}
      x1={t.interpolate({ inputRange: INPUT, outputRange: gears.map((g) => getA(g)[0]) })}
      y1={t.interpolate({ inputRange: INPUT, outputRange: gears.map((g) => getA(g)[1]) })}
      x2={t.interpolate({ inputRange: INPUT, outputRange: gears.map((g) => getB(g)[0]) })}
      y2={t.interpolate({ inputRange: INPUT, outputRange: gears.map((g) => getB(g)[1]) })}
      stroke={accent}
      strokeWidth={3}
      strokeLinecap="round"
      opacity={op}
    />
  );

  const band = [];
  if (g0?.type === 'band') {
    if (g0.c && g0.d) {
      band.push(bandSeg('b1', (g) => g.a, (g) => g.b));
      band.push(bandSeg('b2', (g) => g.c, (g) => g.d, 0.55));
    } else if (g0.c) {
      band.push(bandSeg('b1', (g) => g.a, (g) => g.b));
      band.push(bandSeg('b2', (g) => g.b, (g) => g.c, 0.55));
    } else {
      band.push(bandSeg('b1', (g) => g.a, (g) => g.b));
    }
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {m.prop?.type === 'mat' && <Rect x={6} y={104} width={108} height={7} rx={3.5} fill={line} />}
      {m.prop?.type === 'box' && (
        <Rect x={m.prop.x} y={m.prop.y} width={m.prop.w} height={m.prop.h} rx={3} fill={line} />
      )}
      {showFloor && <Line x1={4} y1={110} x2={116} y2={110} stroke={line} strokeWidth={2.5} strokeLinecap="round" />}

      {BODY.filter((s) => s[3] === 'far').map((s, i) => seg(s[0], s[1], s[2], s[3], `f${i}`))}
      {g0?.type === 'band' && g0.behind ? band : null}
      <ACircle
        cx={chan((f) => f.head[0])}
        cy={chan((f) => f.head[1])}
        r={7}
        fill={color}
      />
      {BODY.filter((s) => s[3] === 'near').map((s, i) => seg(s[0], s[1], s[2], s[3], `n${i}`))}
      {g0?.type === 'band' && !g0.behind ? band : null}
      {g0?.type === 'roller' && (
        <AG
          translateX={t.interpolate({ inputRange: INPUT, outputRange: gears.map((g) => g.p[0]) })}
          translateY={t.interpolate({ inputRange: INPUT, outputRange: gears.map((g) => g.p[1] + 4) })}
        >
          <Circle cx={0} cy={0} r={7.5} fill="none" stroke={accent} strokeWidth={3.4} />
          <Line x1={-9} y1={0} x2={9} y2={0} stroke={accent} strokeWidth={2.6} strokeLinecap="round" />
        </AG>
      )}
      {g0?.type === 'db' ? equip : null}
    </Svg>
  );
}
