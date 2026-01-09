import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import type { UserRole } from '@/types/database';

// Role-based path permissions
const ROLE_PATHS: Record<UserRole, string[]> = {
    admin: ['/admin', '/agency', '/university', '/settings'],
    nepal_agency: ['/agency', '/settings'],
    university: ['/university', '/settings'],
};

// Get allowed paths for a role
function getAllowedPaths(role: UserRole): string[] {
    return ROLE_PATHS[role] || [];
}

// Check if a path is allowed for a role
function isPathAllowedForRole(pathname: string, role: UserRole): boolean {
    const allowedPaths = getAllowedPaths(role);
    return allowedPaths.some(path => pathname.startsWith(path));
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        env.SUPABASE_URL,
        env.SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // 세션 갱신 - 중요: getUser()를 호출해야 세션이 갱신됨
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // 인증되지 않은 사용자가 보호된 경로에 접근하면 로그인으로 리다이렉트
    const protectedPaths = ['/admin', '/agency', '/university', '/settings'];
    const isProtectedPath = protectedPaths.some((path) =>
        pathname.startsWith(path)
    );

    if (!user && isProtectedPath) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // 인증된 사용자의 역할 기반 접근 제어
    if (user && isProtectedPath) {
        // 사용자 역할 조회
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single<{ role: UserRole }>();

        if (!userData) {
            // 사용자 프로필이 없으면 로그인으로 리다이렉트
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }

        const userRole = userData.role;

        // 역할에 맞지 않는 경로 접근 시 해당 역할의 대시보드로 리다이렉트
        if (!isPathAllowedForRole(pathname, userRole)) {
            const url = request.nextUrl.clone();
            switch (userRole) {
                case 'admin':
                    url.pathname = '/admin';
                    break;
                case 'nepal_agency':
                    url.pathname = '/agency';
                    break;
                case 'university':
                    url.pathname = '/university';
                    break;
                default:
                    url.pathname = '/login';
            }
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
