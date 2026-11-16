import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from '../src/components/Button';
import { type } from '../src/theme';
import { useColors } from '../src/useColors';

// Required by App Store 5.1.1(v) and Play when the app has accounts. Wire onDelete to your backend.
export default function DeleteAccount() {
  const { colors } = useColors();
  const onDelete = () => router.replace('/');
  return (
    <View style={{ flex: 1, padding: 16, gap: 16, backgroundColor: colors.bg }}>
      <Text style={[type.body, { color: colors.text }]}>
        This permanently deletes your account and the data we hold about you. This cannot be undone.
      </Text>
      <Button label="Delete my account" variant="danger" colors={colors} onPress={onDelete} />
      <Button label="Cancel" variant="ghost" colors={colors} onPress={() => router.back()} />
    </View>
  );
}
