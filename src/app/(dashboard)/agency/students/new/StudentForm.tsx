'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { validateEmail } from '@/lib/validation';
import type { StudentProgram } from '@/types/database';

interface StudentFormProps {
  universities: { id: string; name: string }[];
}

const programOptions = [
  { value: 'language', label: '어학연수' },
  { value: 'bachelor', label: '학사' },
  { value: 'master', label: '석사' },
  { value: 'phd', label: '박사' },
];

export function StudentForm({ universities }: StudentFormProps) {
  const router = useRouter();
  const [universityId, setUniversityId] = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [program, setProgram] = useState<StudentProgram>('bachelor');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [continueAdding, setContinueAdding] = useState(false);

  const universityOptions = universities.map((u) => ({
    value: u.id,
    label: u.name,
  }));

  const resetForm = () => {
    setStudentNo('');
    setName('');
    setDepartment('');
    setAddress('');
    setPhone('');
    setEmail('');
    // 대학교와 프로그램은 유지 (연속 등록 시 편의)
  };

  const handleSubmit = async (e: React.FormEvent, shouldContinue: boolean = false) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setContinueAdding(shouldContinue);

    // Validation
    if (!universityId) {
      setError('대학교를 선택해주세요');
      return;
    }

    if (!studentNo.trim()) {
      setError('학번을 입력해주세요');
      return;
    }

    if (!name.trim()) {
      setError('이름을 입력해주세요');
      return;
    }

    if (!department.trim()) {
      setError('학과를 입력해주세요');
      return;
    }

    if (!address.trim()) {
      setError('주소를 입력해주세요');
      return;
    }

    if (!phone.trim()) {
      setError('휴대폰번호를 입력해주세요');
      return;
    }

    // Validate phone format (Korean mobile)
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phone.replace(/-/g, ''))) {
      setError('올바른 휴대폰번호 형식을 입력해주세요');
      return;
    }

    // Validate email if provided
    if (email.trim()) {
      const emailValidation = validateEmail(email.trim());
      if (!emailValidation.valid) {
        setError(emailValidation.error!);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          university_id: universityId,
          student_no: studentNo.trim(),
          name: name.trim(),
          department: department.trim(),
          program,
          address: address.trim(),
          phone: phone.trim().replace(/-/g, ''),
          email: email.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '학생 등록에 실패했습니다');
      }

      if (shouldContinue) {
        // 연속 등록: 폼 초기화하고 성공 메시지 표시
        setSuccess(`${name}님이 등록되었습니다. 다음 학생을 입력하세요.`);
        resetForm();
        setIsSubmitting(false);
      } else {
        // 목록으로 이동
        router.push('/agency/students');
        router.refresh();
      }
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
          href="/agency/students"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          학생 목록으로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">학생 등록</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">새로운 학생 정보를 등록합니다</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* University & Student Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">학적 정보</h2>
          <div className="space-y-4">
            <Select
              label="대학교"
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
              options={universityOptions}
              placeholder="대학교를 선택해주세요"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="학번"
                value={studentNo}
                onChange={(e) => setStudentNo(e.target.value)}
                placeholder="예: 2024001234"
                maxLength={50}
                required
              />
              <Select
                label="프로그램"
                value={program}
                onChange={(e) => setProgram(e.target.value as StudentProgram)}
                options={programOptions}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="학생 이름"
                maxLength={100}
                required
              />
              <Input
                label="학과"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="예: 컴퓨터공학과"
                maxLength={100}
                required
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">연락처 정보</h2>
          <div className="space-y-4">
            <Input
              label="주소"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="거주지 주소"
              maxLength={500}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="휴대폰번호"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678"
                maxLength={20}
                required
              />
              <Input
                label="이메일"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                helperText="아르바이트 서류 발송용 (선택)"
                maxLength={254}
              />
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-amber-700 dark:text-amber-400">
              <p className="font-medium mb-1">개인정보 동의서</p>
              <p>학생 등록 후 상세 페이지에서 개인정보 동의서를 업로드해주세요.</p>
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
          <Button
            type="button"
            variant="secondary"
            onClick={(e) => handleSubmit(e, true)}
            disabled={isSubmitting}
            isLoading={isSubmitting && continueAdding}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            등록 후 계속 추가
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting && !continueAdding}
            disabled={isSubmitting}
          >
            등록하기
          </Button>
        </div>
      </form>
    </div>
  );
}
