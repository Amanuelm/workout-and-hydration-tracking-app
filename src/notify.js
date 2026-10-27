import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// All notifications here are LOCAL and scheduled on the device.
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

const WORKOUT = 'workout';
const WATER = 'water';

async function cancelTagged(tag) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all.filter((n) => n.content?.data?.tag === tag)
       .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

export async function reschedule(state) {
  try {
    await cancelTagged(WORKOUT);
    await cancelTagged(WATER);

    if (state.remindWorkout) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Training time',
          body: "Today's session is waiting. Warm up first.",
          data: { tag: WORKOUT },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: state.trainHour,
          minute: state.trainMin,
        },
      });
    }

    if (state.remindWater) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Water break', body: 'Drink a glass.', data: { tag: WATER } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(60, state.waterEvery * 60),
          repeats: true,
        },
      });
    }
  } catch (e) {
    // notifications are a convenience; never block the app on them
  }
}

// Fires even if the user leaves the app mid-set.
export async function scheduleRestEnd(seconds, label) {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title: 'Rest done', body: label || 'Next set.', data: { tag: 'rest' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, seconds), repeats: false },
    });
  } catch (e) {
    return null;
  }
}

export async function cancel(id) {
  try { if (id) await Notifications.cancelScheduledNotificationAsync(id); } catch (e) {}
}
