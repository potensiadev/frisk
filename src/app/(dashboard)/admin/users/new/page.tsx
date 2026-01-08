import { createClient } from '@/lib/supabase/server';
import { NewUserForm } from './NewUserForm';

export default async function NewUserPage() {
  const supabase = await createClient();

  // Get universities for dropdown
  const { data: universities } = await supabase
    .from('universities')
    .select('id, name')
    .order('name');

  return <NewUserForm universities={universities || []} />;
}
