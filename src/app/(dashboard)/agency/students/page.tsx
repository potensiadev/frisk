import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { StudentList } from './StudentList';
import type { Student, University } from '@/types/database';

interface StudentWithUniversity extends Student {
  universities: University;
}

export default async function StudentsPage() {
  const supabase = await createClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch students with university info (exclude soft-deleted)
  const { data: students, error } = await supabase
    .from('students')
    .select(`
      *,
      universities (
        id,
        name
      )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch students:', error);
  }

  // Fetch universities for filter
  const { data: universities } = await supabase
    .from('universities')
    .select('id, name')
    .order('name');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">학생 관리</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            등록된 학생 {students?.length || 0}명
          </p>
        </div>
        <Link href="/agency/students/new">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            학생 등록
          </Button>
        </Link>
      </div>

      {/* Student List */}
      <StudentList
        students={(students as StudentWithUniversity[]) || []}
        universities={universities || []}
      />
    </div>
  );
}
