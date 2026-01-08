import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { CheckinForm } from './CheckinForm';

interface CheckinDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function CheckinDetailPage({ params }: CheckinDetailPageProps) {
    const { id: studentId } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Check role
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: string }>();

    if (!userData || !['admin', 'nepal_agency'].includes(userData.role)) {
        redirect('/agency');
    }

    // Get current quarter info
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const currentYear = now.getFullYear();
    const quarterStartMonth = (currentQuarter - 1) * 3;
    const quarterStartDate = new Date(currentYear, quarterStartMonth, 1).toISOString().split('T')[0];

    // Fetch student with check-in data
    const { data: student, error } = await supabase
        .from('students')
        .select(`
      id,
      name,
      student_no,
      department,
      phone,
      address,
      email,
      university_id,
      universities (
        id,
        name
      ),
      quarterly_checkins (
        id,
        check_in_date,
        phone_verified,
        address_verified,
        email_verified,
        created_at
      )
    `)
        .eq('id', studentId)
        .eq('status', 'enrolled')
        .is('deleted_at', null)
        .single();

    if (error || !student) {
        notFound();
    }

    // Find current quarter check-in
    const checkins = (student as any).quarterly_checkins || [];
    const currentCheckin = checkins.find((c: any) => {
        const checkinDate = new Date(c.check_in_date);
        return checkinDate >= new Date(quarterStartDate);
    });

    return (
        <CheckinForm
            student={student as any}
            currentCheckin={currentCheckin || null}
            currentQuarter={currentQuarter}
            currentYear={currentYear}
            userId={user.id}
        />
    );
}
