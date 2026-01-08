import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { UniversityEditForm } from './UniversityEditForm';
import type { University, UniversityContact } from '@/types/database';

interface Props {
  params: Promise<{ id: string }>;
}

interface UniversityWithContacts extends University {
  university_contacts: UniversityContact[];
}

export default async function UniversityDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('universities')
    .select(`
      *,
      university_contacts (
        id,
        email,
        is_primary
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    notFound();
  }

  const university = data as unknown as UniversityWithContacts;

  // Get student count for this university
  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('university_id', id)
    .is('deleted_at', null);

  return (
    <UniversityEditForm
      university={university}
      contacts={university.university_contacts || []}
      studentCount={studentCount || 0}
    />
  );
}
