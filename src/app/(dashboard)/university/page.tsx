import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function UniversityDashboard() {
    const supabase = await createClient();

    // 현재 사용자의 대학교 ID 조회
    const { data: { user } } = await supabase.auth.getUser();
    const { data: userData } = await supabase
        .from('users')
        .select('university_id')
        .eq('id', user?.id)
        .single();

    const universityId = userData?.university_id;

    // 통계 데이터 조회
    const [
        { count: studentsCount },
        { count: absencesThisMonth },
        { data: riskStudents },
    ] = await Promise.all([
        supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('university_id', universityId)
            .is('deleted_at', null)
            .eq('status', 'enrolled'),
        supabase
            .from('absences')
            .select('*, students!inner(*)', { count: 'exact', head: true })
            .eq('students.university_id', universityId)
            .gte('absence_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.rpc('get_risk_students_count', { p_university_id: universityId }).single(),
    ]);

    const stats = [
        {
            name: '재학 중 학생',
            value: studentsCount || 0,
            href: '/university/students',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            color: 'blue',
        },
        {
            name: '이번 달 결석',
            value: absencesThisMonth || 0,
            href: '/university/students',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'amber',
        },
        {
            name: '위험군 학생',
            value: riskStudents?.count || 0,
            href: '/university/students?filter=risk',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            color: 'red',
        },
    ];

    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">대학교 대시보드</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">유학생 관리 현황을 조회하세요</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <Link
                        key={stat.name}
                        href={stat.href}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Report Request */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">월간 리포트</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            유학생 관리 현황 리포트를 요청하세요
                        </p>
                    </div>
                    <Link
                        href="/university/reports"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        리포트 요청
                    </Link>
                </div>
            </div>

            {/* Info Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex gap-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">안내사항</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            결석 발생 시 이메일로 즉시 알림이 발송됩니다.
                            문의사항이 있으시면 담당 유학원에 연락해 주세요.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
