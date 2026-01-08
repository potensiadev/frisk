import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { AbsenceList } from './AbsenceList';
import type { Absence, Student, University } from '@/types/database';

interface AbsenceWithStudent extends Absence {
  students: Student & {
    universities: University;
  };
}

export default async function AbsencesPage() {
  const supabase = await createClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch absences with student and university info
  const { data: absences, error } = await supabase
    .from('absences')
    .select(`
      *,
      students (
        id,
        name,
        student_no,
        university_id,
        universities (
          id,
          name
        )
      )
    `)
    .order('absence_date', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Failed to fetch absences:', error);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">결석 관리</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            학생 결석 현황을 관리하고 대학교에 알림을 보냅니다
          </p>
        </div>
        <Link href="/agency/absences/new">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            결석 등록
          </Button>
        </Link>
      </div>

      {/* Absence List */}
      <AbsenceList
        absences={(absences as AbsenceWithStudent[]) || []}
        universities={universities || []}
      />
    </div>
  );
}
