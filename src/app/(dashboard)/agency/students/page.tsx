import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/Button';
import type { Student, University } from '@/types/database';

// 페이지 데이터 재검증 시간 (1분) - 학생 데이터는 자주 조회됨
export const revalidate = 60;

// 동적 임포트로 초기 번들 크기 감소
const StudentList = dynamic(() => import('./StudentList').then(mod => ({ default: mod.StudentList })), {
  loading: () => <StudentListSkeleton />,
  ssr: true,
});

function StudentListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
      </div>
      {/* Table skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24" />
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32" />
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20" />
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16" />
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StudentWithUniversity extends Student {
  universities: University;
}

interface SearchParams {
  search?: string;
  university?: string;
  program?: string;
  status?: string;
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Build query with server-side filtering
  let query = supabase
    .from('students')
    .select(`
      *,
      universities (
        id,
        name
      )
    `)
    .is('deleted_at', null);

  // Apply filters on server
  if (params.university) {
    query = query.eq('university_id', params.university);
  }
  if (params.program) {
    query = query.eq('program', params.program);
  }
  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.search) {
    // Search by name, student_no, or phone using OR condition
    query = query.or(`name.ilike.%${params.search}%,student_no.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
  }

  const { data: students, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch students:', error);
  }

  // Get total count for display (without filters)
  const { count: totalCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  // Fetch universities for filter
  const { data: universities } = await supabase
    .from('universities')
    .select('id, name')
    .order('name');

  const hasFilters = !!(params.search || params.university || params.program || params.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">학생 관리</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {hasFilters
              ? `검색 결과 ${students?.length || 0}명 (전체 ${totalCount || 0}명)`
              : `등록된 학생 ${totalCount || 0}명`
            }
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
        initialFilters={{
          search: params.search || '',
          university: params.university || '',
          program: params.program || '',
          status: params.status || '',
        }}
      />
    </div>
  );
}
