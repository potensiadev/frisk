import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { env, serverEnv } from '@/lib/env';

/**
 * Supabase Admin Client
 * Service Role Key를 사용하여 RLS를 우회합니다.
 * 서버 측에서만 사용해야 합니다.
 */
export function createAdminClient() {
  return createClient<Database>(env.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
