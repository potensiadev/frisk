/**
 * Environment variable validation
 *
 * IMPORTANT: NEXT_PUBLIC_* variables must be referenced directly (not dynamically)
 * because Next.js replaces them at build time. Dynamic access like process.env[name]
 * will not work in production client-side code.
 */

// Public environment variables (available on client and server)
// These must be direct references for Next.js build-time replacement to work
export const env = {
  get SUPABASE_URL() {
    const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!value) {
      throw new Error(
        `Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. ` +
        `Please check your .env.local file or deployment environment.`
      );
    }
    return value;
  },
  get SUPABASE_ANON_KEY() {
    const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!value) {
      throw new Error(
        `Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. ` +
        `Please check your .env.local file or deployment environment.`
      );
    }
    return value;
  },
} as const;

// Server-only environment variables
// These don't need NEXT_PUBLIC_ prefix and only run on server
export const serverEnv = {
  get SUPABASE_SERVICE_ROLE_KEY() {
    const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!value) {
      throw new Error(
        `Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY. ` +
        `Please check your .env.local file or deployment environment.`
      );
    }
    return value;
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
