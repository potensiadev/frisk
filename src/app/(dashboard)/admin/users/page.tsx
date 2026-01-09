import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// 페이지 데이터 재검증 시간 (5분)
export const revalidate = 300;

// 동적 임포트로 초기 번들 크기 감소
const UserList = dynamic(() => import('./UserList').then(mod => ({ default: mod.UserList })), {
  loading: () => <UserListSkeleton />,
  ssr: true,
});

function UserListSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="animate-pulse">
        <div className="h-12 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32" />
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24" />
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function UsersPage() {
  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from('users')
    .select(`
      *,
      universities (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch users:', error);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">사용자 관리</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">시스템 사용자를 관리합니다</p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          사용자 추가
        </Link>
      </div>

      {/* User List */}
      <UserList users={users || []} />
    </div>
  );
}
