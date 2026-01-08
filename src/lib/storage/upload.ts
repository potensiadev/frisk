'use client';

import { createClient } from '@/lib/supabase/client';

export type StorageBucket = 'consent-files' | 'absence-files';

export interface UploadResult {
    success: boolean;
    path?: string;
    url?: string;
    error?: string;
}

/**
 * 파일을 Supabase Storage에 업로드합니다.
 * 파일명은 UUID로 변환되어 저장됩니다 (개인정보 보호).
 */
export async function uploadFile(
    file: File,
    bucket: StorageBucket,
    folder?: string
): Promise<UploadResult> {
    const supabase = createClient();

    // 파일 확장자 추출
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // 허용된 확장자 확인
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
    if (!allowedExtensions.includes(ext)) {
        return {
            success: false,
            error: `허용되지 않은 파일 형식입니다. (허용: ${allowedExtensions.join(', ')})`,
        };
    }

    // 파일 크기 확인 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        return {
            success: false,
            error: '파일 크기는 10MB를 초과할 수 없습니다.',
        };
    }

    // UUID 생성하여 파일명으로 사용
    const uuid = crypto.randomUUID();
    const fileName = `${uuid}.${ext}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    try {
        const { error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('Upload error:', error);
            return {
                success: false,
                error: error.message,
            };
        }

        return {
            success: true,
            path: filePath,
        };
    } catch (err) {
        console.error('Upload exception:', err);
        return {
            success: false,
            error: '파일 업로드 중 오류가 발생했습니다.',
        };
    }
}

/**
 * Supabase Storage에서 파일을 삭제합니다.
 */
export async function deleteFile(
    bucket: StorageBucket,
    path: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();

    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) {
            console.error('Delete error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Delete exception:', err);
        return { success: false, error: '파일 삭제 중 오류가 발생했습니다.' };
    }
}

/**
 * 파일의 서명된 URL을 생성합니다 (24시간 유효).
 */
export async function getSignedUrl(
    bucket: StorageBucket,
    path: string,
    expiresIn: number = 86400 // 24시간
): Promise<{ url?: string; error?: string }> {
    const supabase = createClient();

    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);

        if (error) {
            console.error('Signed URL error:', error);
            return { error: error.message };
        }

        return { url: data.signedUrl };
    } catch (err) {
        console.error('Signed URL exception:', err);
        return { error: '서명된 URL 생성 중 오류가 발생했습니다.' };
    }
}

/**
 * 여러 파일의 서명된 URL을 한 번에 생성합니다.
 */
export async function getSignedUrls(
    bucket: StorageBucket,
    paths: string[],
    expiresIn: number = 86400
): Promise<{ urls: { path: string; url: string }[]; error?: string }> {
    const supabase = createClient();

    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrls(paths, expiresIn);

        if (error) {
            console.error('Signed URLs error:', error);
            return { urls: [], error: error.message };
        }

        return {
            urls: data
                .filter((item) => item.signedUrl)
                .map((item, index) => ({
                    path: paths[index],
                    url: item.signedUrl!,
                })),
        };
    } catch (err) {
        console.error('Signed URLs exception:', err);
        return { urls: [], error: '서명된 URL 생성 중 오류가 발생했습니다.' };
    }
}
