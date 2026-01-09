import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

// 페이지 데이터 재검증 시간 (1분) - 로그는 실시간에 가깝게 표시
export const revalidate = 60;

// 동적 임포트로 초기 번들 크기 감소
const AuditLogList = dynamic(() => import('./AuditLogList').then(mod => ({ default: mod.AuditLogList })), {
  loading: () => <AuditLogListSkeleton />,
  ssr: true,
});

function AuditLogListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter skeleton */}
      <div className="flex gap-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-40" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-32" />
      </div>
      {/* Table skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32" />
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20" />
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-40" />
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SearchParams {
    type?: string;
    search?: string;
}

export default async function AuditLogsPage({
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

    // Check role - only admin can view audit logs
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: string }>();

    if (!userData || userData.role !== 'admin') {
        redirect('/admin');
    }

    // Build query with server-side filtering
    let query = supabase
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
    `);

    // Apply filters on server
    if (params.type && params.type !== 'all') {
        query = query.eq('action_type', params.type);
    }

    if (params.search) {
        // Search by email or IP address using text search on related tables
        // Since we can't directly filter on joined tables, we'll filter by IP and details
        query = query.or(`ip_address.ilike.%${params.search}%,details.ilike.%${params.search}%`);
    }

    const { data: logs, error } = await query
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

    const hasFilters = !!(params.type && params.type !== 'all') || !!params.search;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    감사 로그
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {hasFilters
                        ? `검색 결과 ${logs?.length || 0}건`
                        : '시스템 접속 및 활동 기록'
                    }
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
            <AuditLogList
                logs={logs || []}
                initialFilters={{
                    type: params.type || 'all',
                    search: params.search || '',
                }}
            />
        </div>
    );
}
