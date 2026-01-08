import { SupabaseClient } from '@supabase/supabase-js';
import { UserRole } from '@/types/database';

export class AuthError extends Error {
    constructor(message: string, public statusCode: number = 401) {
        super(message);
        this.name = 'AuthError';
    }
}

interface UserData {
    id: string;
    role: UserRole;
    university_id?: string | null;
}

/**
 * Validates authentication and retrieves user data with role.
 */
export async function getUserOrThrow(
    supabase: SupabaseClient
): Promise<UserData> {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new AuthError('인증이 필요합니다', 401);
    }

    const { data: userData, error: profileError } = await supabase
        .from('users')
        .select('role, university_id')
        .eq('id', user.id)
        .single<{ role: string; university_id: string | null }>();

    if (profileError || !userData) {
        throw new AuthError('사용자 정보가 없습니다', 403);
    }

    return {
        id: user.id,
        role: userData.role as UserRole,
        university_id: userData.university_id,
    };
}

/**
 * Ensures the user has one of the allowed roles.
 */
export function requireRole(user: UserData, allowedRoles: UserRole[]) {
    if (!allowedRoles.includes(user.role)) {
        throw new AuthError('권한이 없습니다', 403);
    }
}

/**
 * Ensures university users only access students from their university.
 * Admin/Agency bypass this check.
 */
export function requireUniversityScope(
    user: UserData,
    studentUniversityId: string | null | undefined
) {
    if (user.role === 'university') {
        if (!user.university_id || user.university_id !== studentUniversityId) {
            throw new AuthError('다른 대학의 학생 정보에는 접근할 수 없습니다', 403);
        }
    }
}
