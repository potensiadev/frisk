import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { UniversityList } from './UniversityList';

export default async function UniversitiesPage() {
  const supabase = await createClient();

  const { data: universities, error } = await supabase
    .from('universities')
    .select(`
      *,
      university_contacts (
        id,
        email,
        is_primary
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch universities:', error);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">대학교 관리</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">제휴 대학교 목록을 관리합니다</p>
        </div>
        <Link
          href="/admin/universities/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          대학교 추가
        </Link>
      </div>

      {/* University List */}
      <UniversityList universities={universities || []} />
    </div>
  );
}
