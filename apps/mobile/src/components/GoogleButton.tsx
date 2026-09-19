import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/theme';

export function GoogleButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continuar com Google"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderRadius: theme.radius.button,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.icon}>
        <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
      </View>
      <Text style={[styles.label, { color: theme.ink }]}>Continuar com Google</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  icon: { width: 24, alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '600' },
});
