import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const theme = useTheme();
  const favorites = useQuery({
    queryKey: queryKeys.favoritesBadge,
    queryFn: () => api.favorites(),
  });
  const badge = favorites.data?.total;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.inkMuted,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="newspaper-variant-outline" color={color} size={size} accessibilityLabel="Feed" />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify" color={color} size={size} accessibilityLabel="Buscar" />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Salvos',
          tabBarBadge: badge && badge > 0 ? badge : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart-outline" color={color} size={size} accessibilityLabel="Salvos" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-outline" color={color} size={size} accessibilityLabel="Perfil" />
          ),
        }}
      />
    </Tabs>
  );
}
