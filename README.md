# Iron Room

Offline workout + hydration tracker. Expo (React Native). No backend, no account,
no network calls — data lives in AsyncStorage on the phone and every reminder is a
local notification scheduled on the device.

## Build the APK

```bash
cd ironroom
npm install
npx expo install --fix
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

The build runs on Expo's servers; you get a URL and QR code to install from.
The app icon, splash and notification icon are native config, so they only appear
in a real build — not in Expo Go.

## Preview during development

```bash
npx expo start
```

Scan with Expo Go. Scheduled notifications do not fire correctly in Expo Go on
Android; test those from the APK. Everything else works.

## Layout

```
App.js            app shell, home screen, water / progress / settings tabs
src/rig.js        skeleton + pose data — the source of truth for every animation
src/Figure.js     renders the rig as animated SVG
src/Player.js     fullscreen workout player (vertical paged feed)
src/program.js    the training program
src/store.js      AsyncStorage load/save
src/notify.js     local notification scheduling
src/theme.js      palette and type scale
assets/           icon, adaptive icon, splash, favicon
```

## How the animations work

`src/rig.js` holds a skeleton (shin, thigh, torso, neck, upper arm, forearm) and a
start and end pose for each exercise. A pose is authored the way a coach describes
one: where the hips are, where each foot is planted, how far the torso leans.
Joint positions are solved with two-bone inverse kinematics, so feet stay on the
floor, limbs never stretch past their own length, and joints always connect.

`src/Figure.js` samples each exercise into 11 frames and drives one animated value
through those samples, so the motion runs without re-rendering React on every tick.

### Adding or changing an exercise animation

Add an entry to `POSES` in `src/rig.js`:

```js
mykind: {
  ms: 1500,                                  // half-cycle duration
  gear: { type: 'db', at: 'both' },          // db | band | roller, or omit
  prop: { type: 'box', x: 58, y: 88, w: 40, h: 22 },   // or { type: 'mat' }
  a: { hip: [50, 62], torso: 5, fN: [52, 110], fF: [45, 110], armAN: [5, 3] },
  b: { hip: [40, 80], torso: 30, fN: [52, 110], fF: [45, 110], armAN: [5, 3] },
}
```

- `hip` — hip position. Floor is y = 110; a standing hip sits at y = 62.
- `torso` — degrees, 0 upright, positive leans forward (+x).
- `fN` / `fF` — near and far foot targets. Give a target and the leg is solved by
  IK; omit it and use `legAN` / `legAF` angles instead (for a foot in the air).
- `hN` / `hF` — hand targets, same idea; `armAN` / `armAF` for angles instead.
- `kneeN`, `kneeF`, `elbN`, `elbF` — `1` or `-1`, which way the joint bends.

Then point an exercise at it with `a: 'mykind'` in `src/program.js`.

## Swapping in image or GIF demonstrations

If you ever license an exercise media library, replace the `<Figure .../>` call in
`src/Player.js` and `App.js` with an `<Image>` and keep everything else. Don't take
GIFs off the web — the exercise GIF libraries are all copyrighted.

## Shoulder note

The program deliberately contains no overhead loading. If you change exercises,
keep it that way until the right shoulder has been assessed.
