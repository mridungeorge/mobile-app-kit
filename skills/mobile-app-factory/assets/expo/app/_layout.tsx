import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColors } from '../src/useColors';

export default function RootLayout() {
  const { colors, dark } = useColors();
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="detail/[id]" options={{ title: 'Detail' }} />
        <Stack.Screen name="delete-account" options={{ title: 'Delete account' }} />
      </Stack>
    </>
  );
}
