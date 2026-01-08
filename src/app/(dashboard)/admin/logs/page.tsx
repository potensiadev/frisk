import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AuditLogList } from './AuditLogList';

export default async function AuditLogsPage() {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Check role - only admin can view audit logs
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: string }>();

    if (!userData || userData.role !== 'admin') {
        redirect('/admin');
    }

    // Fetch initial audit logs
    const { data: logs, error } = await supabase
        .from('audit_logs')
        .select(`
      id,
      user_id,
      action_type,
      details,
      ip_address,
      created_at,
      users (
        email,
        role
      )
    `)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Failed to fetch audit logs:', error);
    }

    // Get summary stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { count: totalLogs } = await supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true });

    const { count: todayLogins } = await supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('action_type', 'login')
        .gte('created_at', today.toISOString());

    const { count: weeklyDownloads } = await supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('action_type', 'download')
        .gte('created_at', thisWeek.toISOString());

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    감사 로그
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    시스템 접속 및 활동 기록
                </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">전체 기록</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {totalLogs?.toLocaleString() || 0}건
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">오늘 로그인</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                        {todayLogins || 0}회
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">주간 다운로드</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {weeklyDownloads || 0}회
                    </p>
                </div>
            </div>

            {/* Audit Log List */}
            <AuditLogList initialLogs={logs || []} />
        </div>
    );
}
