import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform } from 'react-native';
import { LocalStorageService } from './localStorage';
import { TMDBService } from './tmdb';
import { SERVER_CONFIG } from '../config/api';

const BACKGROUND_FETCH_TASK = 'background-fetch-recommendations';

// Configure how notifications should appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  } as any),
});

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E50914',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for push notification!');
    return;
  }
  // Use projectId from Constants to get the specific token
  token = (await Notifications.getExpoPushTokenAsync({
    projectId: 'dc466c00-cdbb-48ca-bacc-66beb8023943', // From app.json eas configuration
  })).data;
  
  return token;
}

// ----------------------------------------------------------------------
// Background Fetch Logic for Tastes/Recommendations
// ----------------------------------------------------------------------

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const isPushEnabled = await LocalStorageService.isPushEnabled();
    if (!isPushEnabled) return BackgroundFetch.BackgroundFetchResult.NoData;

    const favs = await LocalStorageService.getFavorites();
    if (favs.length === 0) return BackgroundFetch.BackgroundFetchResult.NoData;

    // Just take the first favorite to find a recommendation to notify about
    const fav = favs[0];
    const recs = await TMDBService.getRecommendations(fav.media_type, fav.id);
    
    if (recs && recs.length > 0) {
      const topRec = recs[0];
      
      // Check if we already notified about this exact movie/show
      const lastNotified = await LocalStorageService.getLastNotifiedId();
      if (lastNotified !== topRec.id) {
        // Send a local notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '¡Nueva recomendación para ti! 🍿',
            body: `Porque te gustó "${fav.title}", te sugerimos ver "${topRec.title || topRec.name}".`,
            data: { mediaId: topRec.id, mediaType: topRec.media_type },
          },
          trigger: null, // trigger immediately
        });
        
        // Save state so we don't spam the user
        await LocalStorageService.setLastNotifiedId(topRec.id);
        return BackgroundFetch.BackgroundFetchResult.NewData;
      }
    }
    
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('Background fetch failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundFetchAsync() {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 60 * 24, // 24 hours
    stopOnTerminate: false,       // android only
    startOnBoot: true,            // android only
  });
}
