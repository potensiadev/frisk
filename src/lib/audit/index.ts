import type { SupabaseClient } from '@supabase/supabase-js';

type AuditActionType = 'login' | 'logout' | 'download' | 'upload' | 'update' | 'delete' | 'export';

interface AuditLogParams {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: SupabaseClient<any>;
    userId: string | null;
    actionType: AuditActionType;
    details?: Record<string, unknown>;
    ipAddress?: string | null;
}

/**
 * 감사 로그를 기록합니다.
 */
export async function createAuditLog({
    supabase,
    userId,
    actionType,
    details,
    ipAddress,
}: AuditLogParams): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase.from('audit_logs').insert({
            user_id: userId,
            action_type: actionType,
            details: details ? JSON.stringify(details) : null,
            ip_address: ipAddress || null,
        });

        if (error) {
            console.error('Failed to create audit log:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Audit log error:', err);
        return { success: false, error: 'Failed to create audit log' };
    }
}

/**
 * 로그인 성공 로그를 기록합니다.
 */
export async function logLoginSuccess(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: SupabaseClient<any>,
    userId: string,
    email: string,
    ipAddress?: string | null
) {
    return createAuditLog({
        supabase,
        userId,
        actionType: 'login',
        details: { email, status: 'success' },
        ipAddress,
    });
}

/**
 * 로그인 실패 로그를 기록합니다.
 */
export async function logLoginFailure(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: SupabaseClient<any>,
    email: string,
    reason: string,
    ipAddress?: string | null
) {
    return createAuditLog({
        supabase,
        userId: null,
        actionType: 'login',
        details: { email, status: 'failure', reason },
        ipAddress,
    });
}

/**
 * 로그아웃 로그를 기록합니다.
 */
export async function logLogout(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: SupabaseClient<any>,
    userId: string,
    email: string,
    ipAddress?: string | null
) {
    return createAuditLog({
        supabase,
        userId,
        actionType: 'logout',
        details: { email },
        ipAddress,
    });
}

/**
 * 파일 다운로드 로그를 기록합니다.
 */
export async function logDownload(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: SupabaseClient<any>,
    userId: string,
    fileType: 'report' | 'absence_file' | 'consent_file',
    fileName: string,
    ipAddress?: string | null
) {
    return createAuditLog({
        supabase,
        userId,
        actionType: 'download',
        details: { fileType, fileName },
        ipAddress,
    });
}

/**
 * 파일 업로드 로그를 기록합니다.
 */
export async function logUpload(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: SupabaseClient<any>,
    userId: string,
    fileType: 'absence_file' | 'other',
    fileName: string,
    relatedId?: string,
    ipAddress?: string | null
) {
    return createAuditLog({
        supabase,
        userId,
        actionType: 'upload',
        details: { fileType, fileName, relatedId },
        ipAddress,
    });
}

/**
 * 데이터 생성/수정 로그를 기록합니다.
 */
export async function logUpdate(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: SupabaseClient<any>,
    userId: string,
    target: 'student' | 'checkin' | 'absence',
    targetId: string,
    changes: Record<string, unknown>,
    ipAddress?: string | null
) {
    return createAuditLog({
        supabase,
        userId,
        actionType: 'update',
        details: { target, targetId, changes },
        ipAddress,
    });
}

/**
 * 데이터 삭제 로그를 기록합니다.
 */
export async function logDelete(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: SupabaseClient<any>,
    userId: string,
    target: 'student' | 'file' | 'absence',
    targetId: string,
    ipAddress?: string | null
) {
    return createAuditLog({
        supabase,
        userId,
        actionType: 'delete',
        details: { target, targetId },
        ipAddress,
    });
}
