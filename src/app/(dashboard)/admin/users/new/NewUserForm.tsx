'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { validatePassword, validateEmail, getPasswordRequirements } from '@/lib/validation';
import type { UserRole } from '@/types/database';

interface University {
  id: string;
  name: string;
}

interface NewUserFormProps {
  universities: University[];
}

const roleOptions = [
  { value: 'admin', label: '관리자' },
  { value: 'nepal_agency', label: '네팔 유학원' },
  { value: 'university', label: '대학교' },
];

export function NewUserForm({ universities: initialUniversities }: NewUserFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('university');
  const [universityId, setUniversityId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 대학교 신규 등록 관련 상태
  const [universities, setUniversities] = useState<University[]>(initialUniversities);
  const [isAddingUniversity, setIsAddingUniversity] = useState(false);
  const [newUniversityName, setNewUniversityName] = useState('');
  const [isCreatingUniversity, setIsCreatingUniversity] = useState(false);
  const [universityError, setUniversityError] = useState('');

  const universityOptions = universities.map((u) => ({
    value: u.id,
    label: u.name,
  }));

  // 대학교 신규 등록 처리
  const handleCreateUniversity = async () => {
    setUniversityError('');

    if (!newUniversityName.trim()) {
      setUniversityError('대학교 이름을 입력해주세요');
      return;
    }

    setIsCreatingUniversity(true);

    try {
      const response = await fetch('/api/admin/universities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUniversityName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '대학교 등록에 실패했습니다');
      }

      // 등록 성공 시 목록에 추가하고 선택
      const newUniversity = data.university as University;
      setUniversities((prev) => [...prev, newUniversity].sort((a, b) => a.name.localeCompare(b.name)));
      setUniversityId(newUniversity.id);
      setIsAddingUniversity(false);
      setNewUniversityName('');
    } catch (err) {
      setUniversityError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setIsCreatingUniversity(false);
    }
  };

  // 신규 등록 취소
  const handleCancelAddUniversity = () => {
    setIsAddingUniversity(false);
    setNewUniversityName('');
    setUniversityError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email
    const emailValidation = validateEmail(email.trim());
    if (!emailValidation.valid) {
      setError(emailValidation.error!);
      return;
    }

    // Validate password complexity
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error!);
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (role === 'university' && !universityId) {
      setError('소속 대학교를 선택해주세요');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role,
          university_id: role === 'university' ? universityId : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '사용자 생성에 실패했습니다');
      }

      router.push('/admin/users');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      setIsSubmitting(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">사용자 추가</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">새로운 시스템 사용자를 등록합니다</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="space-y-6">
            {/* Email */}
            <Input
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              maxLength={254}
              required
            />

            {/* Password */}
            <Input
              label="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상 입력"
              helperText={getPasswordRequirements()}
              maxLength={128}
              required
            />

            {/* Confirm Password */}
            <Input
              label="비밀번호 확인"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호 재입력"
              maxLength={128}
              required
            />

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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  소속 대학교 <span className="text-red-500">*</span>
                </label>

                {!isAddingUniversity ? (
                  // 드롭다운 모드
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select
                        value={universityId}
                        onChange={(e) => setUniversityId(e.target.value)}
                        options={universityOptions}
                        placeholder="대학교를 선택해주세요"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsAddingUniversity(true)}
                      className="shrink-0"
                    >
                      신규 등록
                    </Button>
                  </div>
                ) : (
                  // 텍스트 입력 모드
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newUniversityName}
                        onChange={(e) => setNewUniversityName(e.target.value)}
                        placeholder="대학교 이름을 입력해주세요"
                        maxLength={100}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateUniversity();
                          } else if (e.key === 'Escape') {
                            handleCancelAddUniversity();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleCreateUniversity}
                        isLoading={isCreatingUniversity}
                        disabled={isCreatingUniversity}
                        className="shrink-0"
                      >
                        완료
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCancelAddUniversity}
                        disabled={isCreatingUniversity}
                        className="shrink-0"
                      >
                        취소
                      </Button>
                    </div>
                    {universityError && (
                      <p className="text-sm text-red-600 dark:text-red-400">{universityError}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Role Description */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">역할별 권한 안내</h3>
          <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <li><span className="font-medium">관리자:</span> 전체 시스템 관리 (대학교, 사용자, 학생, 감사로그)</li>
            <li><span className="font-medium">네팔 유학원:</span> 학생 관리, 결석 기록, 분기 점검</li>
            <li><span className="font-medium">대학교:</span> 소속 학생 조회, 월간 리포트 (읽기 전용)</li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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
            등록하기
          </Button>
        </div>
      </form>
    </div>
  );
}
