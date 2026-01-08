'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { User, University, UserRole } from '@/types/database';

interface UserWithUniversity extends User {
  universities: University | null;
}

interface UserEditFormProps {
  user: UserWithUniversity;
  universities: { id: string; name: string }[];
}

const roleOptions = [
  { value: 'admin', label: '관리자' },
  { value: 'nepal_agency', label: '네팔 유학원' },
  { value: 'university', label: '대학교' },
];

const roleLabels: Record<UserRole, { label: string; color: string }> = {
  admin: {
    label: '관리자',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  nepal_agency: {
    label: '네팔 유학원',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  university: {
    label: '대학교',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
};

export function UserEditForm({ user, universities }: UserEditFormProps) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(user.role);
  const [universityId, setUniversityId] = useState(user.university_id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const universityOptions = universities.map((u) => ({
    value: u.id,
    label: u.name,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (role === 'university' && !universityId) {
      setError('소속 대학교를 선택해주세요');
      return;
    }

    setIsSubmitting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        role,
        university_id: role === 'university' ? universityId : null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('User update error:', updateError);
      setError('사용자 수정에 실패했습니다. 잠시 후 다시 시도해주세요.');
      setIsSubmitting(false);
      return;
    }

    setSuccess('사용자 정보가 수정되었습니다');
    setIsSubmitting(false);
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          사용자 목록으로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">사용자 수정</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">사용자 정보를 수정합니다</p>
      </div>

      {/* User Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              등록일: {new Date(user.created_at).toLocaleDateString('ko-KR')}
            </p>
          </div>
          <div className="ml-auto">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${roleLabels[user.role].color}`}>
              {roleLabels[user.role].label}
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="space-y-6">
            {/* Role */}
            <Select
              label="역할"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              options={roleOptions}
              required
            />

            {/* University (only for university role) */}
            {role === 'university' && (
              <Select
                label="소속 대학교"
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                options={universityOptions}
                placeholder="대학교를 선택해주세요"
                required
              />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-amber-700 dark:text-amber-400">
              <p className="font-medium mb-1">비밀번호 변경</p>
              <p>비밀번호는 사용자가 직접 설정 페이지에서 변경해야 합니다.</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            저장하기
          </Button>
        </div>
      </form>
    </div>
  );
}
