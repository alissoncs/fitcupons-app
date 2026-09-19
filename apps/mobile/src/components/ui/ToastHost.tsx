import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToastStore } from '@/store/toast';
import { useTheme } from '@/theme';

export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const message = useToastStore((state) => state.message);
  const hide = useToastStore((state) => state.hide);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hide, 2600);
    return () => clearTimeout(timer);
  }, [hide, message]);

  if (!message) return null;

  return (
    <Pressable
      onPress={hide}
      style={[
        styles.toast,
        {
          top: insets.top + 12,
          backgroundColor: theme.ink,
          borderRadius: theme.radius.button,
        },
      ]}
    >
      <Text style={[styles.text, { color: theme.bg }]}>{message}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
