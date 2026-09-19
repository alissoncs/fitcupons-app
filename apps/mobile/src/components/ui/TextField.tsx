import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  password?: boolean;
};

export function TextField({ label, error, password, style, ...rest }: Props) {
  const theme = useTheme();
  const [hidden, setHidden] = useState(password ?? false);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.inkMuted }]}>{label}</Text>
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : theme.border,
            borderRadius: theme.radius.button,
          },
        ]}
      >
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          placeholderTextColor={theme.inkMuted}
          style={[styles.input, { color: theme.ink }, style]}
          autoCapitalize={rest.autoCapitalize ?? (password ? 'none' : rest.autoCapitalize)}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
            hitSlop={8}
            onPress={() => setHidden((value) => !value)}
            style={styles.icon}
          >
            <MaterialCommunityIcons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.inkMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  field: {
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: 12 },
});
