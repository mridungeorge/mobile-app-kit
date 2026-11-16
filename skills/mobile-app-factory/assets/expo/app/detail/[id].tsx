import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { type } from '../../src/theme';
import { useColors } from '../../src/useColors';

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useColors();
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: colors.bg }}>
      <Text style={[type.title, { color: colors.text }]}>Item {id}</Text>
    </View>
  );
}
