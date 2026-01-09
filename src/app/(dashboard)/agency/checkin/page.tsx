import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

// 페이지 데이터 재검증 시간 (1분) - 체크인 데이터는 실시간에 가깝게 표시
export const revalidate = 60;

// 동적 임포트로 초기 번들 크기 감소
const CheckinList = dynamic(() => import('./CheckinList').then(mod => ({ default: mod.CheckinList })), {
  loading: () => <CheckinListSkeleton />,
  ssr: true,
});

function CheckinListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tab skeleton */}
      <div className="flex gap-2">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-32" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-32" />
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="animate-pulse space-y-3">
              <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3" />
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-full mt-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function CheckinPage() {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Check role
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: string }>();

    if (!userData || !['admin', 'nepal_agency'].includes(userData.role)) {
        redirect('/agency');
    }

    // Get current quarter info
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const currentYear = now.getFullYear();

    // Calculate quarter start date (for filtering)
    const quarterStartMonth = (currentQuarter - 1) * 3;
    const quarterStartDate = new Date(currentYear, quarterStartMonth, 1).toISOString().split('T')[0];

    // Fetch students with check-in status for current quarter
    const { data: students, error } = await supabase
        .from('students')
        .select(`
      id,
      name,
      student_no,
      department,
      phone,
      address,
      email,
      university_id,
      universities (
        id,
        name
      ),
      quarterly_checkins (
        id,
        check_in_date,
        phone_verified,
        address_verified,
        email_verified,
        created_at
      )
    `)
        .eq('status', 'enrolled')
        .is('deleted_at', null)
        .order('name');

    if (error) {
        console.error('Failed to fetch students:', error);
    }

    // Process students to add check-in status
    const processedStudents = (students || []).map((student: any) => {
        const checkins = student.quarterly_checkins || [];
        const currentQuarterCheckin = checkins.find((c: any) => {
            const checkinDate = new Date(c.check_in_date);
            return checkinDate >= new Date(quarterStartDate);
        });

        return {
            ...student,
            universities: student.universities,
            currentQuarterCheckin: currentQuarterCheckin || null,
            isCheckedIn: !!currentQuarterCheckin,
        };
    });

    // Separate into checked and unchecked
    const uncheckedStudents = processedStudents.filter((s: any) => !s.isCheckedIn);
    const checkedStudents = processedStudents.filter((s: any) => s.isCheckedIn);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Quarterly Check-in
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {currentYear}년 {currentQuarter}분기 학생 연락처 점검
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">전체 학생</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {processedStudents.length}명
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">점검 완료</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {checkedStudents.length}명
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">미점검</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                        {uncheckedStudents.length}명
                    </p>
                </div>
            </div>

            {/* Student List */}
            <CheckinList
                uncheckedStudents={uncheckedStudents}
                checkedStudents={checkedStudents}
                currentQuarter={currentQuarter}
                currentYear={currentYear}
            />
        </div>
    );
}
