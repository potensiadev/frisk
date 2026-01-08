import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { UserList } from './UserList';

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
