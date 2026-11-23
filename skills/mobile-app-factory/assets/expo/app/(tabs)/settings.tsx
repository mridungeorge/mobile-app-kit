import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { ListRow } from '../../src/components/ListRow';
import { useAuth } from '../../src/auth';
import { useColors } from '../../src/useColors';

export default function Settings() {
  const { colors } = useColors();
  const auth = useAuth();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ListRow title="Restore purchases" subtitle="Subscription restore is always visible" colors={colors} onPress={() => {}} />
      <ListRow title="Delete account" subtitle="Permanently remove your account and data" colors={colors} onPress={() => router.push('/delete-account')} />
      <ListRow title="Sign out" subtitle="Removes the token from the keychain" colors={colors} onPress={() => auth.signOut()} />
      <Text style={{ color: colors.textSecondary, padding: 16, fontSize: 13 }}>
        Offline-first: habits are stored with expo-sqlite and render without a network.
      </Text>
    </View>
  );
}
