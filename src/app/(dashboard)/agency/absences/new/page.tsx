import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AbsenceForm } from './AbsenceForm';
import type { Student, University } from '@/types/database';

interface StudentWithUniversity extends Student {
  universities: University;
}

export default async function NewAbsencePage() {
  const supabase = await createClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Check permission (only admin and agency can create)
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>();

  if (!userData || !['admin', 'nepal_agency'].includes(userData.role)) {
    redirect('/');
  }

  // Fetch all active students
  const { data: students } = await supabase
    .from('students')
    .select(`
      *,
      universities (
        id,
        name
      )
    `)
    .eq('status', 'enrolled')
    .is('deleted_at', null)
    .order('name');

  return (
    <Suspense fallback={<div className="p-8 text-center">로딩 중...</div>}>
      <AbsenceForm students={(students as StudentWithUniversity[]) || []} />
    </Suspense>
  );
}
