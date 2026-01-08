import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { UserEditForm } from './UserEditForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function UserEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('users')
    .select(`
      *,
      universities (
        id,
        name
      )
    `)
    .eq('id', id)
    .single();

  if (error || !user) {
    notFound();
  }

  // Get universities for dropdown
  const { data: universities } = await supabase
    .from('universities')
    .select('id, name')
    .order('name');

  return (
    <UserEditForm
      user={user}
      universities={universities || []}
    />
  );
}
