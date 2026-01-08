import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ReportDownload } from './ReportDownload';

export default async function ReportsPage() {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Get user info
    const { data: userData } = await supabase
        .from('users')
        .select('role, university_id')
        .eq('id', user.id)
        .single<{ role: string; university_id: string | null }>();

    if (!userData) {
        redirect('/login');
    }

    // For university users, get their university info
    let universityName = '';
    if (userData.role === 'university' && userData.university_id) {
        const { data: university } = await supabase
            .from('universities')
            .select('name')
            .eq('id', userData.university_id)
            .single<{ name: string }>();

        universityName = university?.name || '';
    }

    // Get list of available months (based on absences data)
    const { data: absences } = await supabase
        .from('absences')
        .select('absence_date')
        .order('absence_date', { ascending: false });

    // Extract unique year-month combinations
    const monthsSet = new Set<string>();
    (absences || []).forEach((a: any) => {
        const date = new Date(a.absence_date);
        monthsSet.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    });

    // Always add current month
    const now = new Date();
    monthsSet.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

    const availableMonths = Array.from(monthsSet).sort().reverse();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    월간 리포트
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {universityName && `${universityName} - `}학생 출결 현황 리포트를 다운로드하세요
                </p>
            </div>

            {/* Report Download Section */}
            <ReportDownload
                universityId={userData.university_id || undefined}
                availableMonths={availableMonths}
                isUniversityUser={userData.role === 'university'}
            />

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex gap-3">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-700 dark:text-blue-400">
                        <p className="font-medium mb-1">리포트 안내</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            <li>리포트는 요청 시 즉시 생성됩니다 (저장되지 않음)</li>
                            <li>PDF 형식으로 다운로드됩니다</li>
                            <li>총 학생 수, 결석 현황, 위험군 학생 명단이 포함됩니다</li>
                            <li>진단서 등 민감 정보는 포함되지 않습니다</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
