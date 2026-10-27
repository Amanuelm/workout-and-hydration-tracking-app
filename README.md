# Iron Room

Offline workout + hydration tracker. Expo (React Native). No backend, no account,
no network calls — all data lives in AsyncStorage on the phone, and every reminder
is a local notification scheduled on the device.

## What you need once

- Node 18+ on your computer
- A free Expo account: https://expo.dev/signup

## Get the APK

```bash
cd ironroom
npm install
npx expo install --fix          # aligns package versions with the SDK
npx eas-cli@latest login        # your Expo account
npx eas-cli@latest build:configure
npx eas-cli@latest build -p android --profile preview
```

The build runs on Expo's servers. When it finishes you get a URL and a QR code —
open it on the phone and install the APK. You'll need "install from unknown
sources" enabled for your browser.

Free plan: up to 15 Android builds, low queue priority (peak waits can pass
90 minutes), 45-minute build timeout.

## Try it before building

```bash
npx expo start
```

Scan the QR with Expo Go. Note: scheduled notifications do not work properly in
Expo Go on Android — they only work in the real build. Everything else does.

## Layout

```
App.js            all four screens, tab bar, rest timer
src/program.js    the training program — edit exercises, sets, reps, rest here
src/Figure.js     animated SVG exercise demonstrations
src/store.js      AsyncStorage load/save
src/notify.js     local notification scheduling
app.json          app name, package id, icon, permissions
eas.json          build profiles (preview = APK)
```

## Changing the program

`src/program.js` is plain data. Keys 1–6 are Mon–Sat, 0 is Sunday (rest).
Each exercise: `n` name, `s` sets, `r` reps, `rest` seconds, `kg` equipment,
`a` which animation to use, `c` form cue, `w` why it's in the program.

Animation keys available: `squat`, `hinge`, `press`, `row`, `curl`, `open`,
`roll`, `plank`, `calf`, `thrust`, `cardio`.

## Shoulder note

The program deliberately contains no overhead loading. If you change exercises,
keep it that way until the right shoulder has been assessed.
