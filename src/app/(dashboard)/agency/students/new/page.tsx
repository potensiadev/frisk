import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StudentForm } from './StudentForm';

export default async function NewStudentPage() {
  const supabase = await createClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch universities for dropdown
  const { data: universities } = await supabase
    .from('universities')
    .select('id, name')
    .order('name');

  return (
    <StudentForm universities={universities || []} />
  );
}
