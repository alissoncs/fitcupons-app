import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { Button } from './Button';

export function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
  icon = 'tag-outline',
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  const theme = useTheme();
  return (
    <View style={styles.box}>
      <MaterialCommunityIcons name={icon} size={40} color={theme.inkMuted} />
      <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>
      {subtitle ? <Text style={[styles.sub, { color: theme.inkMuted }]}>{subtitle}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} style={styles.action} /> : null}
    </View>
  );
}

export function ErrorCard({ onRetry }: { onRetry: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.error, { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: theme.radius.card }]}>
      <Text style={[styles.title, { color: theme.ink }]}>Não consegui carregar</Text>
      <Text style={[styles.sub, { color: theme.inkMuted }]}>Verifique a conexão e tente de novo.</Text>
      <Button label="Tentar de novo" onPress={onRetry} variant="secondary" />
    </View>
  );
}

export function SkeletonBlock({ height, width = '100%' }: { height: number; width?: number | `${number}%` }) {
  const theme = useTheme();
  return (
    <View
      style={{
        height,
        width,
        borderRadius: theme.radius.button,
        backgroundColor: theme.primarySoft,
      }}
    />
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', padding: 32, gap: 10 },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  sub: { fontSize: 14, textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: 8 },
  error: { margin: 16, padding: 16, borderWidth: 1, gap: 10 },
});
