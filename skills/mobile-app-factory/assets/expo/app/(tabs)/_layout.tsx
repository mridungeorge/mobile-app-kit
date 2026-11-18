import { Tabs } from 'expo-router';
import { useColors } from '../../src/useColors';

export default function TabsLayout() {
  const { colors } = useColors();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarAccessibilityLabel: 'Home tab' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarAccessibilityLabel: 'Settings tab' }} />
    </Tabs>
  );
}
