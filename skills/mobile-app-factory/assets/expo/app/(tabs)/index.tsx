import { router } from 'expo-router';
import { FlatList, View } from 'react-native';
import { EmptyState } from '../../src/components/EmptyState';
import { ListRow } from '../../src/components/ListRow';
import { useColors } from '../../src/useColors';

const ITEMS = [
  { id: '1', title: 'First item', subtitle: 'Replace with your data' },
  { id: '2', title: 'Second item', subtitle: 'Tap to open the detail route' },
];

export default function Home() {
  const { colors } = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={ITEMS}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState title="Nothing here yet" body="Add your first item to get started." colors={colors} />}
        renderItem={({ item }) => (
          <ListRow
            title={item.title}
            subtitle={item.subtitle}
            colors={colors}
            onPress={() => router.push({ pathname: '/detail/[id]', params: { id: item.id } })}
          />
        )}
      />
    </View>
  );
}
