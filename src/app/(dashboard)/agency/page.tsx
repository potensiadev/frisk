import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AgencyDashboard() {
    const supabase = await createClient();

    // 통계 데이터 조회
    const [
        { count: studentsCount },
        { count: absencesThisMonth },
        { data: pendingCheckins },
    ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'enrolled'),
        supabase
            .from('absences')
            .select('*', { count: 'exact', head: true })
            .gte('absence_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.rpc('get_pending_checkin_count').single(),
    ]);

    const stats = [
        {
            name: '재학 중 학생',
            value: studentsCount || 0,
            href: '/agency/students',
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
            href: '/agency/absences',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'amber',
        },
        {
            name: '점검 대기',
            value: pendingCheckins?.count || 0,
            href: '/agency/checkins',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
            color: 'purple',
        },
    ];

    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">유학원 대시보드</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">학생 관리 현황을 확인하세요</p>
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

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Link
                    href="/agency/absences/new"
                    className="flex items-center gap-4 p-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-white hover:from-red-600 hover:to-orange-600 transition-all shadow-sm hover:shadow-md"
                >
                    <div className="p-3 bg-white/20 rounded-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">결석 기록</h3>
                        <p className="text-white/80 text-sm">새로운 결석을 기록합니다</p>
                    </div>
                </Link>

                <Link
                    href="/agency/students/new"
                    className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl text-white hover:from-blue-600 hover:to-indigo-600 transition-all shadow-sm hover:shadow-md"
                >
                    <div className="p-3 bg-white/20 rounded-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">학생 등록</h3>
                        <p className="text-white/80 text-sm">새로운 학생을 등록합니다</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
