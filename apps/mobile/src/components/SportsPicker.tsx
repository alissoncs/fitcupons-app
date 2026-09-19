import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Sport } from '@fitcupons/shared';

import { resolveSportIcon } from '@/lib/sport-icon';
import { useTheme } from '@/theme';

type Props = {
  sports: Sport[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function SportsPicker({ sports, selectedIds, onChange }: Props) {
  const theme = useTheme();
  const selected = new Set(selectedIds);

  function toggle(id: string) {
    void Haptics.selectionAsync();
    if (selected.has(id)) onChange(selectedIds.filter((item) => item !== id));
    else onChange([...selectedIds, id]);
  }

  return (
    <View style={styles.grid}>
      {sports.map((sport) => {
        const active = selected.has(sport.id);
        return (
          <Pressable
            key={sport.id}
            accessibilityRole="button"
            accessibilityLabel={sport.name}
            accessibilityState={{ selected: active }}
            onPress={() => toggle(sport.id)}
            style={[
              styles.card,
              {
                backgroundColor: active ? theme.primarySoft : theme.surface,
                borderColor: active ? theme.primary : theme.border,
                borderRadius: theme.radius.card,
              },
            ]}
          >
            {active ? (
              <View style={[styles.check, { backgroundColor: theme.primary }]}>
                <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
              </View>
            ) : null}
            <MaterialCommunityIcons
              name={resolveSportIcon(sport.iconName)}
              size={32}
              color={active ? theme.primary : theme.inkMuted}
            />
            <Text style={[styles.name, { color: active ? theme.primary : theme.ink }]}>{sport.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47.5%',
    minHeight: 112,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  name: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
