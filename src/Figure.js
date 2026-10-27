import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { G, Line, Circle } from 'react-native-svg';

const AG = Animated.createAnimatedComponent(G);

// One shared 0 -> 1 -> 0 driver per figure; every joint interpolates off it.
function useRep(duration) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(t, { toValue: 0, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration]);
  return t;
}
const to = (t, a, b) => t.interpolate({ inputRange: [0, 1], outputRange: [a, b] });

export default function Figure({ kind, size = 62, color = '#ECEEF4', accent = '#7D9BFF', line = '#333848' }) {
  const t = useRep(kind === 'roll' || kind === 'hinge' ? 1500 : 1200);
  const S = { stroke: color, strokeWidth: 4.4, strokeLinecap: 'round' };
  const K = { stroke: accent, strokeWidth: 5.4, strokeLinecap: 'round' };
  const ground = <Line x1="12" y1="110" x2="108" y2="110" stroke={line} strokeWidth="2.5" />;

  let body = null;

  if (kind === 'squat') {
    body = (
      <AG translateY={to(t, 0, 11)}>
        <AG rotation={to(t, 0, 26)} originX="58" originY="62">
          <Circle cx="58" cy="24" r="8" fill={color} />
          <Line x1="58" y1="32" x2="58" y2="62" {...S} />
          <Line x1="58" y1="40" x2="48" y2="56" {...S} />
          <Line x1="42" y1="50" x2="54" y2="62" {...K} />
        </AG>
        <AG rotation={to(t, 0, 52)} originX="58" originY="62">
          <Line x1="58" y1="62" x2="58" y2="86" {...S} />
          <AG rotation={to(t, 0, -52)} originX="58" originY="86">
            <Line x1="58" y1="86" x2="58" y2="108" {...S} />
            <Line x1="58" y1="108" x2="70" y2="108" {...S} />
          </AG>
        </AG>
      </AG>
    );
  } else if (kind === 'hinge') {
    body = (
      <>
        <AG rotation={to(t, 0, 72)} originX="58" originY="62">
          <Circle cx="58" cy="24" r="8" fill={color} />
          <Line x1="58" y1="32" x2="58" y2="62" {...S} />
          <Line x1="58" y1="40" x2="58" y2="60" {...S} />
          <Line x1="50" y1="60" x2="66" y2="60" {...K} />
        </AG>
        <AG rotation={to(t, 0, -14)} originX="58" originY="62">
          <Line x1="58" y1="62" x2="58" y2="86" {...S} />
          <Line x1="58" y1="86" x2="58" y2="108" {...S} />
          <Line x1="58" y1="108" x2="70" y2="108" {...S} />
        </AG>
      </>
    );
  } else if (kind === 'press') {
    body = (
      <>
        <Circle cx="24" cy="86" r="8" fill={color} />
        <Line x1="32" y1="86" x2="74" y2="86" {...S} />
        <Line x1="74" y1="86" x2="84" y2="72" {...S} />
        <Line x1="84" y1="72" x2="94" y2="88" {...S} />
        <Line x1="94" y1="88" x2="104" y2="88" {...S} />
        <AG rotation={to(t, 0, -86)} originX="48" originY="86">
          <Line x1="48" y1="86" x2="48" y2="62" {...S} />
          <Line x1="40" y1="60" x2="56" y2="60" {...K} />
        </AG>
        <Line x1="12" y1="96" x2="108" y2="96" stroke={line} strokeWidth="2.5" />
      </>
    );
  } else if (kind === 'row') {
    body = (
      <>
        <Circle cx="34" cy="44" r="8" fill={color} />
        <Line x1="42" y1="46" x2="76" y2="54" {...S} />
        <Line x1="76" y1="54" x2="78" y2="80" {...S} />
        <Line x1="78" y1="80" x2="74" y2="106" {...S} />
        <Line x1="74" y1="106" x2="86" y2="106" {...S} />
        <AG rotation={to(t, 0, 44)} originX="50" originY="48">
          <Line x1="50" y1="48" x2="50" y2="78" {...S} />
          <Line x1="42" y1="80" x2="58" y2="80" {...K} />
        </AG>
        {ground}
      </>
    );
  } else if (kind === 'curl') {
    body = (
      <>
        <Circle cx="58" cy="22" r="8" fill={color} />
        <Line x1="58" y1="30" x2="58" y2="66" {...S} />
        <Line x1="58" y1="66" x2="50" y2="108" {...S} />
        <Line x1="58" y1="66" x2="68" y2="108" {...S} />
        <Line x1="58" y1="36" x2="52" y2="56" {...S} />
        <AG rotation={to(t, 0, -128)} originX="52" originY="56">
          <Line x1="52" y1="56" x2="54" y2="76" {...S} />
          <Line x1="46" y1="78" x2="62" y2="78" {...K} />
        </AG>
        {ground}
      </>
    );
  } else if (kind === 'open') {
    body = (
      <>
        <Circle cx="58" cy="22" r="8" fill={color} />
        <Line x1="58" y1="30" x2="58" y2="66" {...S} />
        <Line x1="58" y1="66" x2="50" y2="108" {...S} />
        <Line x1="58" y1="66" x2="68" y2="108" {...S} />
        <AG rotation={to(t, 0, -34)} originX="58" originY="38">
          <Line x1="58" y1="38" x2="30" y2="46" {...S} />
          <Circle cx="28" cy="46" r="4" fill={accent} />
        </AG>
        <AG rotation={to(t, 0, 34)} originX="58" originY="38">
          <Line x1="58" y1="38" x2="86" y2="46" {...S} />
          <Circle cx="88" cy="46" r="4" fill={accent} />
        </AG>
        {ground}
      </>
    );
  } else if (kind === 'roll') {
    body = (
      <>
        <AG translateX={to(t, 0, 20)} translateY={to(t, 0, 8)}>
          <Circle cx="34" cy="62" r="8" fill={color} />
          <Line x1="40" y1="66" x2="62" y2="86" {...S} />
          <Line x1="62" y1="86" x2="76" y2="104" {...S} />
          <Line x1="76" y1="104" x2="88" y2="104" {...S} />
          <Line x1="38" y1="68" x2="30" y2="92" {...S} />
          <Circle cx="26" cy="98" r="9" stroke={accent} strokeWidth="5.4" fill="none" />
        </AG>
        {ground}
      </>
    );
  } else if (kind === 'plank') {
    body = (
      <>
        <AG translateY={to(t, 0, 2)}>
          <Circle cx="26" cy="72" r="8" fill={color} />
          <Line x1="34" y1="74" x2="86" y2="88" {...S} />
          <Line x1="86" y1="88" x2="96" y2="104" {...S} />
          <Line x1="96" y1="104" x2="106" y2="104" {...S} />
          <Line x1="40" y1="76" x2="36" y2="104" {...S} />
          <Line x1="36" y1="104" x2="48" y2="104" {...S} />
        </AG>
        {ground}
      </>
    );
  } else if (kind === 'calf') {
    body = (
      <>
        <AG translateY={to(t, 0, -9)}>
          <Circle cx="58" cy="22" r="8" fill={color} />
          <Line x1="58" y1="30" x2="58" y2="66" {...S} />
          <Line x1="58" y1="36" x2="48" y2="60" {...S} />
          <Line x1="42" y1="62" x2="54" y2="62" {...K} />
          <Line x1="58" y1="66" x2="56" y2="104" {...S} />
          <Line x1="56" y1="104" x2="68" y2="106" {...S} />
        </AG>
        {ground}
      </>
    );
  } else if (kind === 'thrust') {
    body = (
      <>
        <AG translateY={to(t, 6, -4)}>
          <Circle cx="24" cy="74" r="8" fill={color} />
          <Line x1="32" y1="76" x2="62" y2="80" {...S} />
          <Line x1="56" y1="70" x2="70" y2="70" {...K} />
          <Line x1="62" y1="80" x2="80" y2="88" {...S} />
        </AG>
        <Line x1="80" y1="88" x2="84" y2="106" {...S} />
        <Line x1="84" y1="106" x2="96" y2="106" {...S} />
        {ground}
      </>
    );
  } else {
    // cardio
    body = (
      <>
        <AG translateY={to(t, 0, -9)}>
          <Circle cx="62" cy="24" r="8" fill={color} />
          <Line x1="62" y1="32" x2="56" y2="62" {...S} />
          <Line x1="60" y1="40" x2="78" y2="48" {...S} />
          <Line x1="60" y1="42" x2="40" y2="34" {...S} />
          <Line x1="56" y1="62" x2="72" y2="84" {...S} />
          <Line x1="72" y1="84" x2="70" y2="106" {...S} />
          <Line x1="56" y1="62" x2="40" y2="80" {...S} />
          <Line x1="40" y1="80" x2="46" y2="96" {...S} />
        </AG>
        {ground}
      </>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {body}
    </Svg>
  );
}
