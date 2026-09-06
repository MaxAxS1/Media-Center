import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { registerForPushNotificationsAsync, registerBackgroundFetchAsync } from '../src/services/notifications';

export default function RootLayout() {
  useEffect(() => {
    async function setupNotifications() {
      await registerForPushNotificationsAsync();
      await registerBackgroundFetchAsync();
    }
    setupNotifications();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#141414' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="detail"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
});
