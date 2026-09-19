import type { ConfigContext, ExpoConfig } from 'expo/config';

import appJson from './app.json';

function googleIosUrlScheme(clientId: string): string {
  const suffix = '.apps.googleusercontent.com';
  if (!clientId.endsWith(suffix)) {
    return 'com.googleusercontent.apps.PLACEHOLDER';
  }
  return `com.googleusercontent.apps.${clientId.slice(0, -suffix.length)}`;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const base = appJson.expo as ExpoConfig;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
  const iosUrlScheme = googleIosUrlScheme(iosClientId);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? (base.extra as { apiUrl?: string } | undefined)?.apiUrl;

  const plugins: ExpoConfig['plugins'] = (base.plugins ?? []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === '@react-native-google-signin/google-signin') {
      const options = (plugin[1] ?? {}) as Record<string, unknown>;
      return [plugin[0], { ...options, iosUrlScheme }] as [string, Record<string, unknown>];
    }
    return plugin;
  });

  return {
    ...config,
    ...base,
    extra: {
      ...base.extra,
      apiUrl,
    },
    plugins,
  };
};
