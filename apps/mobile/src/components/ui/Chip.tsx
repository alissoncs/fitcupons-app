import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { resolveSportIcon } from '@/lib/sport-icon';
import { useTheme } from '@/theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  iconName?: string | null;
  removable?: boolean;
};

export function Chip({ label, selected, onPress, iconName, removable }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
          borderRadius: 999,
        },
      ]}
    >
      {iconName ? (
        <MaterialCommunityIcons
          name={resolveSportIcon(iconName)}
          size={16}
          color={selected ? '#FFFFFF' : theme.inkMuted}
        />
      ) : null}
      <Text style={[styles.label, { color: selected ? '#FFFFFF' : theme.ink }]}>{label}</Text>
      {removable ? (
        <View>
          <MaterialCommunityIcons name="close" size={14} color={selected ? '#FFFFFF' : theme.inkMuted} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: { fontSize: 13, fontWeight: '600' },
});
