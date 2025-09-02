import { env } from './env';
import { features } from './features';
import { services } from './services';

export const config = {
  app: {
    name: env.VITE_APP_NAME,
    version: env.VITE_APP_VERSION,
    environment: env.VITE_APP_ENVIRONMENT,
  },
  supabase: {
    url: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
    projectId: env.VITE_SUPABASE_PROJECT_ID,
  },
  features,
  services,
} as const;

export { env } from './env';
export { features } from './features';
export { services } from './services';