import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const glyphMap = MaterialCommunityIcons.glyphMap as Record<string, number>;

export function resolveSportIcon(iconName: string | null | undefined): IconName {
  if (iconName && glyphMap[iconName] != null) {
    return iconName as IconName;
  }
  return 'tag-outline';
}

export function passwordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
} {
  if (!password) return { score: 0, label: '' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  const labels = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'] as const;
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score] };
}
