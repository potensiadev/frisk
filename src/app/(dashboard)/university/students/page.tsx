import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UniversityStudentList } from './UniversityStudentList';
import type { Student, University } from '@/types/database';

interface StudentWithUniversity extends Student {
  universities: University;
}

export default async function UniversityStudentsPage() {
  const supabase = await createClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get user's university_id
  const { data: userData } = await supabase
    .from('users')
    .select('university_id')
    .eq('id', user.id)
    .single<{ university_id: string | null }>();

  if (!userData?.university_id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          소속 대학교가 설정되지 않았습니다. 관리자에게 문의해주세요.
        </p>
      </div>
    );
  }

  // Fetch students for this university only
  const { data: students, error } = await supabase
    .from('students')
    .select(`
      *,
      universities (
        id,
        name
      )
    `)
    .eq('university_id', userData.university_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch students:', error);
  }

  // Get university name
  const universityName = (students as StudentWithUniversity[])?.[0]?.universities?.name || '소속 대학교';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">학생 현황</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {universityName} 소속 학생 {students?.length || 0}명
        </p>
      </div>

      {/* Student List (Read-Only) */}
      <UniversityStudentList students={(students as StudentWithUniversity[]) || []} />
    </div>
  );
}
