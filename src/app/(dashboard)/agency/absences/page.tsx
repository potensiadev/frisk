import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/Button';
import type { Absence, Student, University } from '@/types/database';

// 페이지 데이터 재검증 시간 (1분) - 결석 데이터는 자주 업데이트됨
export const revalidate = 60;

// 동적 임포트로 초기 번들 크기 감소
const AbsenceList = dynamic(() => import('./AbsenceList').then(mod => ({ default: mod.AbsenceList })), {
  loading: () => <AbsenceListSkeleton />,
  ssr: true,
});

function AbsenceListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
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
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface AbsenceWithStudent extends Absence {
  students: Student & {
    universities: University;
  };
}

interface SearchParams {
  search?: string;
  university?: string;
  reason?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
}

const PAGE_SIZE = 20;

export default async function AbsencesPage({
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

  // Pagination
  const currentPage = Math.max(1, parseInt(params.page || '1', 10));
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Build query with server-side filtering
  let query = supabase
    .from('absences')
    .select(`
      *,
      students!inner (
        id,
        name,
        student_no,
        university_id,
        universities (
          id,
          name
        )
      )
    `, { count: 'exact' });

  // Apply filters on server
  if (params.university) {
    query = query.eq('students.university_id', params.university);
  }
  if (params.reason) {
    query = query.eq('reason', params.reason);
  }
  if (params.startDate) {
    query = query.gte('absence_date', params.startDate);
  }
  if (params.endDate) {
    query = query.lte('absence_date', params.endDate);
  }
  if (params.search) {
    query = query.or(`students.name.ilike.%${params.search}%,students.student_no.ilike.%${params.search}%`);
  }

  const { data: absences, error, count: filteredCount } = await query
    .order('absence_date', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Failed to fetch absences:', error);
  }

  // Get total count
  const { count: totalCount } = await supabase
    .from('absences')
    .select('*', { count: 'exact', head: true });

  // Fetch universities for filter
  const { data: universities } = await supabase
    .from('universities')
    .select('id, name')
    .order('name');

  const hasFilters = !!(params.search || params.university || params.reason || params.startDate || params.endDate);
  const totalPages = Math.ceil((filteredCount || 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">결석 관리</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {hasFilters
              ? `검색 결과 ${filteredCount || 0}건 (전체 ${totalCount || 0}건)`
              : `학생 결석 현황을 관리하고 대학교에 알림을 보냅니다`
            }
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
        initialFilters={{
          search: params.search || '',
          university: params.university || '',
          reason: params.reason || '',
          startDate: params.startDate || '',
          endDate: params.endDate || '',
        }}
        pagination={{
          currentPage,
          totalPages,
          totalCount: filteredCount || 0,
        }}
      />
    </div>
  );
}
