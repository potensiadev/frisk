/**
 * Environment variable validation
 * Throws descriptive errors if required env vars are missing
 */

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Please check your .env.local file or deployment environment.`
    );
  }
  return value;
}

// Public environment variables (available on client and server)
export const env = {
  get SUPABASE_URL() {
    return getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  },
  get SUPABASE_ANON_KEY() {
    return getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  },
} as const;

// Server-only environment variables
export const serverEnv = {
  get SUPABASE_SERVICE_ROLE_KEY() {
    return getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY');
  },
} as const;

// Validate all required env vars at startup (call this in instrumentation.ts or layout)
export function validateEnv() {
  const errors: string[] = [];

  // Check public env vars
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  // Check server env vars (only on server)
  if (typeof window === 'undefined') {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY');
    }
  }

  if (errors.length > 0) {
    console.error(
      `\n❌ Missing required environment variables:\n` +
      errors.map(e => `   - ${e}`).join('\n') +
      `\n\nPlease check your .env.local file.\n`
    );
    // Don't throw in production to allow graceful degradation
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`Missing environment variables: ${errors.join(', ')}`);
    }
  }
}
