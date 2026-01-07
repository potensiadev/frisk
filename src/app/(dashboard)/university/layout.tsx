import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/database';

export default async function UniversityLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 대학교 역할 검증
    const { data: userData } = await supabase
        .from('users')
        .select('role, university_id')
        .eq('id', user.id)
        .single<{ role: UserRole; university_id: string | null }>();

    // admin과 university만 접근 허용
    if (userData?.role !== 'university' && userData?.role !== 'admin') {
        if (userData?.role === 'nepal_agency') {
            redirect('/agency');
        }
        redirect('/login');
    }

    // university 역할인데 university_id가 없으면 에러 페이지로
    if (userData?.role === 'university' && !userData?.university_id) {
        redirect('/login?error=no_university');
    }

    return <>{children}</>;
}
