'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { FileUpload } from '@/components/ui/FileUpload';
import { validateEmail } from '@/lib/validation';
import type { Student, University, StudentProgram, StudentStatus } from '@/types/database';

interface StudentWithUniversity extends Student {
  universities: University;
}

interface StudentEditFormProps {
  student: StudentWithUniversity;
  universities: { id: string; name: string }[];
}

const programOptions = [
  { value: 'language', label: '어학연수' },
  { value: 'bachelor', label: '학사' },
  { value: 'master', label: '석사' },
  { value: 'phd', label: '박사' },
];

const statusOptions = [
  { value: 'enrolled', label: '재학중' },
  { value: 'graduated', label: '졸업' },
  { value: 'completed', label: '수료' },
  { value: 'withdrawn', label: '자퇴' },
  { value: 'expelled', label: '제적' },
];

export function StudentEditForm({ student, universities }: StudentEditFormProps) {
  const router = useRouter();
  const [studentNo, setStudentNo] = useState(student.student_no);
  const [name, setName] = useState(student.name);
  const [department, setDepartment] = useState(student.department);
  const [program, setProgram] = useState<StudentProgram>(student.program);
  const [address, setAddress] = useState(student.address);
  const [phone, setPhone] = useState(student.phone);
  const [email, setEmail] = useState(student.email || '');
  const [status, setStatus] = useState<StudentStatus>(student.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<StudentStatus | null>(null);
  const [consentFileUrl, setConsentFileUrl] = useState<string | null>(student.consent_file_url);

  const handleConsentUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/students/${student.id}/consent`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '파일 업로드에 실패했습니다');
    }

    setConsentFileUrl(data.url);
    setSuccess('동의서가 업로드되었습니다');
  };

  const handleConsentDelete = async () => {
    const response = await fetch(`/api/students/${student.id}/consent`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '파일 삭제에 실패했습니다');
    }

    setConsentFileUrl(null);
    setSuccess('동의서가 삭제되었습니다');
  };

  const handleStatusChange = (newStatus: StudentStatus) => {
    if (newStatus !== 'enrolled' && status === 'enrolled') {
      setPendingStatus(newStatus);
      setShowStatusModal(true);
    } else {
      setStatus(newStatus);
    }
  };

  const confirmStatusChange = () => {
    if (pendingStatus) {
      setStatus(pendingStatus);
    }
    setShowStatusModal(false);
    setPendingStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
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

    // Validate phone format
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
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_no: studentNo.trim(),
          name: name.trim(),
          department: department.trim(),
          program,
          address: address.trim(),
          phone: phone.trim().replace(/-/g, ''),
          email: email.trim() || null,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '학생 정보 수정에 실패했습니다');
      }

      setSuccess('학생 정보가 수정되었습니다');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/agency/students/${student.id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          학생 상세로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">학생 정보 수정</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{student.name} ({student.student_no})</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* University Info (read-only) */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">대학교 정보</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">대학교</p>
              <p className="text-gray-900 dark:text-white font-medium">{student.universities?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">등록일</p>
              <p className="text-gray-900 dark:text-white">
                {new Date(student.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </div>

        {/* Academic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">학적 정보</h2>
          <div className="space-y-4">
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

            <Select
              label="상태"
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as StudentStatus)}
              options={statusOptions}
              required
            />
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

        {/* Consent File */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">개인정보 동의서</h2>
          <FileUpload
            label="동의서 파일"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            maxSize={5 * 1024 * 1024}
            currentFileUrl={consentFileUrl}
            onUpload={handleConsentUpload}
            onDelete={handleConsentDelete}
            helperText="PDF, JPG, PNG, WEBP 파일 (최대 5MB)"
            disabled={isSubmitting}
          />
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

      {/* Status Change Confirmation Modal */}
      <ConfirmModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setPendingStatus(null);
        }}
        onConfirm={confirmStatusChange}
        title="상태 변경 확인"
        message={`학생 상태를 "${statusOptions.find(s => s.value === pendingStatus)?.label}"(으)로 변경하시겠습니까? 이 변경은 학생의 데이터 보관 기간에 영향을 줄 수 있습니다.`}
        confirmText="변경"
        variant="warning"
      />
    </div>
  );
}
