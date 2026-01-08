import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { StudentEditForm } from './StudentEditForm';
import type { Student, University } from '@/types/database';

interface StudentWithUniversity extends Student {
  universities: University;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentEditPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch student
  const { data: student, error } = await supabase
    .from('students')
    .select(`
      *,
      universities (
        id,
        name
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !student) {
    notFound();
  }

  // Fetch universities for dropdown
  const { data: universities } = await supabase
    .from('universities')
    .select('id, name')
    .order('name');

  return (
    <StudentEditForm
      student={student as StudentWithUniversity}
      universities={universities || []}
    />
  );
}
