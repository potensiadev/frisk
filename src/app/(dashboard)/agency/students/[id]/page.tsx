import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { StudentDetail } from './StudentDetail';
import type { Student, University } from '@/types/database';

interface StudentWithUniversity extends Student {
  universities: University;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch student
  const { data: studentData, error } = await supabase
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

  if (error || !studentData) {
    notFound();
  }

  const student = studentData as StudentWithUniversity;

  // Fetch absence count
  const { count: absenceCount } = await supabase
    .from('absences')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', id);

  // Fetch recent absences
  const { data: recentAbsences } = await supabase
    .from('absences')
    .select('*')
    .eq('student_id', id)
    .order('absence_date', { ascending: false })
    .limit(5);

  // Fetch last check-in
  const { data: lastCheckin } = await supabase
    .from('quarterly_checkins')
    .select('*')
    .eq('student_id', id)
    .order('check_in_date', { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/agency/students"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            학생 목록으로
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{student.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {student.universities?.name} · {student.student_no}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/agency/students/${id}/edit`}>
            <Button variant="secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              정보 수정
            </Button>
          </Link>
          <Link href={`/agency/absences/new?student_id=${id}`}>
            <Button>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              결석 등록
            </Button>
          </Link>
        </div>
      </div>

      <StudentDetail
        student={student}
        absenceCount={absenceCount || 0}
        recentAbsences={recentAbsences || []}
        lastCheckin={lastCheckin}
      />
    </div>
  );
}
