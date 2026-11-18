import { router } from 'expo-router';
import { View } from 'react-native';
import { ListRow } from '../../src/components/ListRow';
import { useColors } from '../../src/useColors';

export default function Settings() {
  const { colors } = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ListRow title="Delete account" subtitle="Permanently remove your account and data" colors={colors} onPress={() => router.push('/delete-account')} />
    </View>
  );
}
