import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logLogout } from '@/lib/audit';

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;

    // 로그아웃 전 사용자 정보 조회
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        // 로그아웃 로그 기록
        await logLogout(supabase, user.id, user.email || '', ipAddress);
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, redirectPath: '/login' });
}
