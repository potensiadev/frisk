import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/database';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 관리자 역할 검증
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: UserRole }>();

    if (userData?.role !== 'admin') {
        // 관리자가 아니면 적절한 대시보드로 리다이렉트
        if (userData?.role === 'nepal_agency') {
            redirect('/agency');
        } else if (userData?.role === 'university') {
            redirect('/university');
        }
        redirect('/login');
    }

    return <>{children}</>;
}
