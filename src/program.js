// The training program. Every exercise uses only: 2x12kg DBs, 2x6kg DBs, ab roller, band, mat.
// Nothing loads the right shoulder overhead.

export const WARMUP = [
  { n: 'Arm circles + shoulder rolls', d: '45 sec', c: 'Small circles first, then wider. Stop short of any pinch.' },
  { n: 'Band pull-aparts, light', d: '20 reps', c: 'Band at chest height. Warms the rotator cuff and upper back.' },
  { n: 'Bodyweight squats', d: '15 reps', c: 'Slow, full depth you can control.' },
  { n: 'Hip hinge, no load', d: '12 reps', c: 'Push the hips back, flat spine.' },
  { n: 'Plank', d: '30 sec', c: 'Wakes up the trunk before you load it.' },
];

export const COOLDOWN = [
  { n: "Child's pose", d: 60, c: 'Breathe into the lower back.' },
  { n: 'Standing hamstring stretch', d: 45, c: 'Per leg. Soft knee, hinge from the hip.' },
  { n: 'Hip flexor lunge stretch', d: 45, c: 'Per side. Squeeze the back glute.' },
  { n: 'Doorway chest stretch, elbow LOW', d: 40, c: 'Per side. Forearm below shoulder height — never above.' },
  { n: 'Slow nasal breathing', d: 60, c: 'Sitting. Four in, six out.' },
];

export const PROGRAM = {
  1: {
    t: 'Upper — Push', f: 'Chest, triceps, side delts', ex: [
      { n: 'Floor press', s: 4, r: '10–15', rest: 100, kg: '2 × 12kg', a: 'floorpress',
        c: 'Lie on the mat, elbows stop at the floor. The floor caps the range so the shoulder never drops into the painful zone.',
        w: 'Bottom-limited pressing builds the chest with far less shoulder stress than a full bench press.' },
      { n: 'Incline push-up', s: 3, r: '12–15', rest: 90, kg: 'Hands on a chair', a: 'pushup',
        c: 'Hands elevated, elbows near your ribs at about 45°, not flared wide.',
        w: 'Elevating the hands cuts the load and keeps the shoulder out of deep extension — the position that aggravated you.' },
      { n: 'Band chest press', s: 3, r: '15–20', rest: 75, kg: 'Band', a: 'bandpress',
        c: 'Band behind your back, press forward and squeeze. Control the return.',
        w: 'Bands load the end of the press hardest, where dumbbells go light — useful with a 12kg ceiling.' },
      { n: 'Lateral raise — below shoulder', s: 3, r: '15–20', rest: 60, kg: '2 × 6kg', a: 'lateral',
        c: 'Stop the hands at chest height. Thumbs level with the floor, not tilted down.',
        w: 'Side delts respond to high reps and long tension. Stopping low avoids the impingement arc.' },
      { n: 'Lying triceps extension', s: 3, r: '12–15', rest: 75, kg: '2 × 6kg', a: 'triceps',
        c: 'On your back, upper arms vertical, bend only at the elbow.',
        w: 'Lying beats overhead here — overhead loading is one of the clearest aggravators of an irritated shoulder.' },
      { n: 'Ab roller from knees', s: 3, r: '8–12', rest: 75, kg: 'Roller', a: 'roller',
        c: 'Only roll out as far as you can keep your lower back from sagging.',
        w: 'The rollout produces some of the highest measured abdominal activation of any trunk exercise.' },
    ],
  },
  2: {
    t: 'Lower — Quads', f: 'Quads, glutes, calves', ex: [
      { n: 'Goblet squat', s: 4, r: '15–20', rest: 120, kg: '1 × 12kg', a: 'goblet',
        c: 'Hold the bell at your chest. Three seconds down, drive up.',
        w: 'At light loads, growth tracks reps taken close to failure, not the weight. Finish 1–2 reps short.' },
      { n: 'Bulgarian split squat', s: 3, r: '10–12 / leg', rest: 110, kg: '2 × 12kg', a: 'split',
        c: 'Rear foot on the bed or a chair. Front shin near vertical.',
        w: 'Single-leg work doubles the effective load per limb — the main way past a 12kg ceiling.' },
      { n: 'Walking lunge', s: 3, r: '12 / leg', rest: 90, kg: '2 × 6kg', a: 'lunge',
        c: 'Long step, back knee near the floor, torso upright.',
        w: 'Trains the quads through a long stretched range, which drives more growth than short-range work.' },
      { n: 'Calf raise off a step', s: 4, r: '20', rest: 60, kg: '1 × 12kg', a: 'calf',
        c: 'Heel drops below the step, pause two seconds at the bottom.',
        w: 'Calves grow mainly from full stretch under load, so the step matters more than the weight.' },
      { n: 'Plank', s: 3, r: 'max hold', rest: 60, kg: 'Mat', a: 'plank',
        c: 'Squeeze glutes, ribs down. Stop when the hips start to sag.',
        w: 'Trains the trunk to resist extension, which carries over to squats and lunges.' },
    ],
  },
  3: {
    t: 'Cardio — Easy', f: 'Aerobic base', cardio: true, ex: [
      { n: 'Easy run, walk or cycle', s: 1, r: '30–40 min', rest: 0, kg: 'Outdoors', a: 'run',
        c: 'Conversational pace — you should be able to speak full sentences.',
        w: 'Most cardio should sit at low intensity; it builds the aerobic base without eating recovery from lifting.' },
      { n: 'Mobility flow', s: 1, r: '8 min', rest: 0, kg: 'Mat', a: 'mobility',
        c: 'Cat-cow, hip openers, thoracic rotations. Nothing forced.' },
    ],
  },
  4: {
    t: 'Upper — Pull', f: 'Back, rear delts, biceps', ex: [
      { n: 'Single-arm dumbbell row', s: 4, r: '12–15 / side', rest: 100, kg: '1 × 12kg', a: 'row',
        c: 'Hand and knee on the bed, flat back, pull the elbow to your hip.',
        w: 'Pulling work strengthens the muscles that hold the shoulder back and down, and usually feels good on a cranky joint.' },
      { n: 'Band row', s: 3, r: '15', rest: 80, kg: 'Band', a: 'bandrow',
        c: 'Band around your feet, sit tall, pull to the ribs. Pause one second squeezed.',
        w: 'Adds mid-back volume without more spinal load after heavy rows.' },
      { n: 'Band pull-apart', s: 3, r: '20', rest: 60, kg: 'Band', a: 'pullapart',
        c: 'Arms straight at chest height, pull the band to your chest.',
        w: 'Directly trains the rear delts and lower traps — the usual weak link behind shoulder pain in pressers.' },
      { n: 'Rear delt flye', s: 3, r: '15–20', rest: 70, kg: '2 × 6kg', a: 'reardelt',
        c: 'Hinge forward, slight elbow bend, lead with the pinkies.',
        w: 'The most under-trained head of the shoulder; responds well to light, high-rep work.' },
      { n: 'Dumbbell curl', s: 3, r: '12–15', rest: 75, kg: '2 × 12kg', a: 'curl',
        c: 'No swinging. Three seconds lowering each rep.',
        w: 'The lowering phase contributes heavily to growth, and slowing it raises the effective load.' },
      { n: 'Hammer curl', s: 3, r: '12–15', rest: 70, kg: '2 × 6kg', a: 'hammer',
        c: 'Thumbs up throughout. Elbows pinned to your sides.',
        w: 'Hits the brachialis under the biceps, which adds visible arm thickness.' },
    ],
  },
  5: {
    t: 'Lower — Hinge', f: 'Hamstrings, glutes, trunk', ex: [
      { n: 'Romanian deadlift', s: 4, r: '15–20', rest: 110, kg: '2 × 12kg', a: 'rdl',
        c: 'Push the hips back, bells close to your legs, stop when the hamstrings pull.',
        w: 'Hamstrings grow best when trained at long muscle lengths, which the RDL loads directly.' },
      { n: 'Single-leg RDL', s: 3, r: '12 / leg', rest: 90, kg: '1 × 12kg', a: 'slrdl',
        c: 'Bell in the opposite hand. Hips square, slow and balanced.',
        w: 'Doubles the per-leg load and trains hip stability at the same time.' },
      { n: 'Floor hip thrust', s: 4, r: '15–20', rest: 90, kg: '1 × 12kg on hips', a: 'thrust',
        c: 'Shoulders on the floor or against the bed, pause two seconds at the top.',
        w: 'Glutes see peak activation at lockout, so the top pause is the working part of the rep.' },
      { n: 'Step-up', s: 3, r: '12 / leg', rest: 90, kg: '2 × 12kg', a: 'stepup',
        c: 'Push through the top foot. Lower under control — do not drop.',
        w: 'Loaded single-leg work with a long range; one of the better glute and quad builders at home.' },
      { n: 'Ab roller from knees', s: 3, r: '8–12', rest: 75, kg: 'Roller', a: 'roller',
        c: 'Ribs down, roll only as far as you keep control.',
        w: 'Progress by rolling further, not by adding load.' },
    ],
  },
  6: {
    t: 'Cardio — Intervals', f: 'Conditioning', cardio: true, ex: [
      { n: 'Interval circuit', s: 5, r: '40s work / 20s rest', rest: 60, kg: 'Mat', a: 'intervals',
        c: 'Rotate: high knees, mountain climbers, squat jumps, fast step-ups. One round each, 5 rounds.',
        w: 'Short hard intervals raise aerobic capacity in far less time than steady cardio.' },
      { n: 'Walk down', s: 1, r: '5 min', rest: 0, kg: '—', a: 'run',
        c: 'Keep moving until your breathing settles.' },
    ],
  },
  0: { t: 'Rest', f: 'Recovery', rest: true, ex: [] },
};

// JS getDay(): 0 Sun .. 6 Sat  ->  program key
export const DAY_TO_PROGRAM = [0, 1, 2, 3, 4, 5, 6];
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
