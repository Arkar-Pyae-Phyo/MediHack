import 'dotenv/config';
import type { ConfigContext, ExpoConfig } from '@expo/config';
import baseConfig from './app.json';

export default ({ config }: ConfigContext): ExpoConfig => {
  const expoConfig = baseConfig.expo as Partial<ExpoConfig> & {
    extra?: Record<string, unknown>;
  };

  return {
    ...config,
    ...expoConfig,
    extra: {
      ...(config.extra ?? {}),
      ...(expoConfig.extra ?? {}),
      hasGeminiKey: Boolean(process.env.EXPO_PUBLIC_GEMINI_API_KEY),
    },
  } as ExpoConfig;
};
