import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/database';

export default async function AgencyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 네팔 유학원 역할 검증
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: UserRole }>();

    // admin과 nepal_agency만 접근 허용
    if (userData?.role !== 'nepal_agency' && userData?.role !== 'admin') {
        if (userData?.role === 'university') {
            redirect('/university');
        }
        redirect('/login');
    }

    return <>{children}</>;
}
