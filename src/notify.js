import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Every notification here is LOCAL and scheduled on the device.
// Nothing leaves the phone, and they fire with the app closed.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setup() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
    });
  }
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    return req.status === 'granted';
  }
  return true;
}

async function cancelTagged(prefix) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => String(n.content?.data?.tag || '').startsWith(prefix))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

const daily = (hour, minute) => ({
  type: Notifications.SchedulableTriggerInputTypes.DAILY,
  hour, minute,
});

// expo weekday: 1 = Sunday ... 7 = Saturday. JS getDay(): 0 = Sunday.
const weekly = (jsDay, hour, minute) => ({
  type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
  weekday: jsDay + 1,
  hour, minute,
});

const interval = (seconds) => ({
  type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
  seconds: Math.max(60, seconds),
  repeats: true,
});

export async function reschedule(state) {
  try {
    await cancelTagged('workout');
    await cancelTagged('water');
    await cancelTagged('habit:');

    if (state.remindWorkout) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Training time',
          body: "Today's session is waiting. Warm up first.",
          data: { tag: 'workout' },
        },
        trigger: daily(state.trainHour, state.trainMin),
      });
    }

    if (state.remindWater) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Water break', body: 'Drink a glass.', data: { tag: 'water' } },
        trigger: interval(Math.max(15, state.waterEvery) * 60),
      });
    }

    for (const h of state.habits || []) {
      if (!h.on) continue;
      const s = h.sched || {};
      const hour = s.hour ?? 9;
      const minute = s.min ?? 0;
      const content = {
        title: h.name,
        body: h.kind === 'measure'
          ? `Time to log your ${h.name.toLowerCase()}.`
          : 'Tap when it is done.',
        data: { tag: `habit:${h.id}`, habitId: h.id },
      };

      if (s.type === 'daily') {
        await Notifications.scheduleNotificationAsync({ content, trigger: daily(hour, minute) });
      } else if (s.type === 'weekly') {
        for (const d of s.days || []) {
          await Notifications.scheduleNotificationAsync({ content, trigger: weekly(d, hour, minute) });
        }
      } else if (s.type === 'interval') {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: interval(Math.max(1, s.every || 1) * 86400),
        });
      }
    }
  } catch (e) {
    // notifications are a convenience; never block the app on them
  }
}

// Fires even if the phone is locked mid-set.
export async function scheduleRestEnd(seconds, label) {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title: 'Rest done', body: label || 'Next set.', data: { tag: 'rest' } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, seconds),
        repeats: false,
      },
    });
  } catch (e) {
    return null;
  }
}

export async function cancel(id) {
  try { if (id) await Notifications.cancelScheduledNotificationAsync(id); } catch (e) {}
}
