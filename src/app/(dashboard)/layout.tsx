import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardShell from '@/components/dashboard/DashboardShell';
import type { UserRole } from '@/types/database';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 사용자 정보 조회
    const { data: userData } = await supabase
        .from('users')
        .select('email, role, university_id')
        .eq('id', user.id)
        .single<{ email: string; role: UserRole; university_id: string | null }>();

    // 프로필이 없는 사용자는 로그아웃 처리
    if (!userData) {
        await supabase.auth.signOut();
        redirect('/login?error=profile_not_found');
    }

    return (
        <DashboardShell
            user={{
                id: user.id,
                email: user.email || userData.email,
                role: userData.role,
                university_id: userData.university_id,
            }}
        >
            {children}
        </DashboardShell>
    );
}
