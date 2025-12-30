// Environment variable validation and type safety
// VITE_API_URL is now optional - will use fallback from getApiRoot() if not set
const optionalEnvVars = [
  'VITE_API_URL', // Optional - will use fallback from getApiRoot() if not set
  'VITE_DATABASE_URL', // Not used by frontend (uses HTTP API), kept for compatibility
  'VITE_APP_NAME',
  'VITE_APP_VERSION',
  'VITE_APP_ENVIRONMENT',
  'VITE_ENABLE_AI_FEATURES',
  'VITE_ENABLE_ANALYTICS',
  'VITE_ENABLE_PROJECT_MANAGEMENT',
  'VITE_ENABLE_FINANCIAL_MANAGEMENT',
  'VITE_ENABLE_HR_MANAGEMENT',
  'VITE_ENABLE_CRM',
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_ANALYTICS_TRACKING_ID',
] as const;

type OptionalEnvVar = typeof optionalEnvVars[number];
type EnvVar = OptionalEnvVar;

// Validate environment variables (all are optional with defaults)
function validateEnv(): Record<EnvVar, string> {
  const env: Partial<Record<EnvVar, string>> = {};

  // Add all variables with defaults
  for (const key of optionalEnvVars) {
    // Handle undefined, null, or empty string - use default in all cases
    const value = import.meta.env[key];
    env[key] = (value && value.trim() !== '') ? value : getDefaultValue(key);
  }

  return env as Record<EnvVar, string>;
}

function getDefaultValue(key: OptionalEnvVar): string {
  const defaults: Record<OptionalEnvVar, string> = {
    VITE_API_URL: '', // Empty - will use fallback from getApiRoot()
    VITE_DATABASE_URL: '', // Not used by frontend (uses HTTP API)
    VITE_APP_NAME: 'BuildFlow Agency Management',
    VITE_APP_VERSION: '1.0.0',
    VITE_APP_ENVIRONMENT: 'development',
    VITE_ENABLE_AI_FEATURES: 'true',
    VITE_ENABLE_ANALYTICS: 'true',
    VITE_ENABLE_PROJECT_MANAGEMENT: 'true',
    VITE_ENABLE_FINANCIAL_MANAGEMENT: 'true',
    VITE_ENABLE_HR_MANAGEMENT: 'true',
    VITE_ENABLE_CRM: 'true',
    VITE_STRIPE_PUBLISHABLE_KEY: '',
    VITE_GOOGLE_MAPS_API_KEY: '',
    VITE_ANALYTICS_TRACKING_ID: '',
  };
  return defaults[key];
}

export const env = validateEnv();

// Helper functions
export const isDevelopment = () => env.VITE_APP_ENVIRONMENT === 'development';
export const isProduction = () => env.VITE_APP_ENVIRONMENT === 'production';
export const isStaging = () => env.VITE_APP_ENVIRONMENT === 'staging';