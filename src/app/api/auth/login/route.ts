import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logLoginSuccess, logLoginFailure } from '@/lib/audit';
import { rateLimiters } from '@/lib/rate-limit';
import type { UserRole } from '@/types/database';

export async function POST(request: NextRequest) {
    try {
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

        // Rate limit check
        const rateLimitResult = rateLimiters.login(ipAddress);
        if (!rateLimitResult.success) {
            const retryAfter = Math.ceil(rateLimitResult.resetIn / 1000);
            return NextResponse.json(
                { error: `너무 많은 로그인 시도입니다. ${retryAfter}초 후에 다시 시도해주세요.` },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(retryAfter),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetIn / 1000)),
                    }
                }
            );
        }

        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: '이메일과 비밀번호를 입력해주세요.' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            // 로그인 실패 로그 기록
            await logLoginFailure(supabase, email, error.message, ipAddress);

            return NextResponse.json(
                { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
                { status: 401 }
            );
        }

        // 사용자 역할 조회
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single<{ role: UserRole }>();

        if (!userData) {
            // 사용자 프로필이 없는 경우
            await logLoginFailure(supabase, email, 'User profile not found', ipAddress);

            await supabase.auth.signOut();
            return NextResponse.json(
                { error: '사용자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.' },
                { status: 403 }
            );
        }

        // 로그인 성공 로그 기록
        await logLoginSuccess(supabase, data.user.id, email, ipAddress);

        // 역할에 따른 리다이렉트 경로 결정
        let redirectPath = '/login';
        switch (userData.role) {
            case 'admin':
                redirectPath = '/admin';
                break;
            case 'nepal_agency':
                redirectPath = '/agency';
                break;
            case 'university':
                redirectPath = '/university';
                break;
        }

        return NextResponse.json({
            success: true,
            redirectPath,
            user: {
                id: data.user.id,
                email: data.user.email,
                role: userData.role,
            },
        });
    } catch {
        return NextResponse.json(
            { error: '로그인 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

