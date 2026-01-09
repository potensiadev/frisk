'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/forms/FileUpload';
import type { AbsenceReason, Student, University } from '@/types/database';

interface StudentWithUniversity extends Student {
  universities: University;
}

interface AbsenceFormProps {
  students: StudentWithUniversity[];
}

const reasonOptions = [
  { value: 'illness', label: '질병' },
  { value: 'personal', label: '개인 사정' },
  { value: 'other', label: '기타' },
];

export function AbsenceForm({ students }: AbsenceFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedStudentId = searchParams.get('student_id');

  const [studentId, setStudentId] = useState(preselectedStudentId || '');
  const [absenceDate, setAbsenceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [reason, setReason] = useState<AbsenceReason>('illness');
  const [note, setNote] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [absenceFilePath, setAbsenceFilePath] = useState<string | null>(null);
  const [continueAdding, setContinueAdding] = useState(false);

  // Update studentId when preselected changes
  useEffect(() => {
    if (preselectedStudentId) {
      setStudentId(preselectedStudentId);
    }
  }, [preselectedStudentId]);

  const resetForm = () => {
    setStudentId('');
    setAbsenceDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setAbsenceFilePath(null);
    // 사유와 알림 설정은 유지 (연속 등록 시 편의)
  };

  const handleSubmit = async (e: React.FormEvent, shouldContinue: boolean = false) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setContinueAdding(shouldContinue);

    if (!studentId) {
      setError('학생을 선택해주세요');
      return;
    }

    if (!absenceDate) {
      setError('결석일을 입력해주세요');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          absence_date: absenceDate,
          reason,
          note: note.trim() || null,
          send_notification: sendNotification,
          file_path: absenceFilePath,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '결석 등록에 실패했습니다');
      }

      const selectedStudent = students.find(s => s.id === studentId);
      let successMessage = `${selectedStudent?.name}님의 결석이 등록되었습니다`;

      if (sendNotification) {
        if (data.notification_sent) {
          successMessage += ' (대학교 알림 발송 완료)';
        } else {
          successMessage += ' (알림 발송 실패)';
        }
      }

      if (shouldContinue) {
        // 연속 등록: 폼 초기화하고 성공 메시지 표시
        setSuccess(successMessage + '. 다음 결석을 입력하세요.');
        resetForm();
        setIsSubmitting(false);
      } else {
        setSuccess(successMessage);
        // 목록으로 이동
        setTimeout(() => {
          router.push('/agency/absences');
        }, 1500);
        setIsSubmitting(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      setIsSubmitting(false);
    }
  };

  // Group students by university for the dropdown
  const studentOptions = students.map(student => ({
    value: student.id,
    label: `${student.name} (${student.student_no}) - ${student.universities?.name}`,
  }));

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/agency/absences"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          결석 목록으로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">결석 등록</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          학생의 결석을 등록하고 대학교에 알림을 보냅니다
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">학생 선택</h2>
          <Select
            label="학생"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            options={[
              { value: '', label: '학생을 선택하세요' },
              ...studentOptions,
            ]}
            required
          />
        </div>

        {/* Absence Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">결석 정보</h2>
          <div className="space-y-4">
            <Input
              label="결석일"
              type="date"
              value={absenceDate}
              onChange={(e) => setAbsenceDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />

            <Select
              label="결석 사유"
              value={reason}
              onChange={(e) => setReason(e.target.value as AbsenceReason)}
              options={reasonOptions}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                비고 (선택)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="추가 내용을 입력하세요"
                rows={3}
                maxLength={500}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {note.length}/500
              </p>
            </div>
          </div>
        </div>

        {/* 증빙 파일 업로드 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">증빙 서류 (선택)</h2>
          <FileUpload
            bucket="absence-files"
            folder={studentId || 'temp'}
            helperText="진단서 등 증빙 서류를 업로드하세요"
            onUploadComplete={(path) => setAbsenceFilePath(path)}
            disabled={!studentId}
          />
          {!studentId && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              먼저 학생을 선택해주세요
            </p>
          )}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>안내:</strong> 증빙 파일은 UUID로 저장되어 개인정보가 보호됩니다.
              대학교 담당자는 시스템을 통해서만 파일을 열람할 수 있습니다.
            </p>
          </div>
        </div>

        {/* Notification Option */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">알림 설정</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendNotification}
              onChange={(e) => setSendNotification(e.target.checked)}
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
            />
            <div>
              <p className="text-gray-900 dark:text-white font-medium">대학교에 알림 발송</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                대학교 담당자에게 결석 알림 이메일을 발송합니다
              </p>
            </div>
          </label>
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>주의:</strong> 알림 이메일에는 학생명, 학번, 결석일, 사유 코드만 포함됩니다.
              진단서나 질병명 등 민감정보는 전송되지 않습니다.
            </p>
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
            결석 등록
          </Button>
        </div>
      </form>
    </div>
  );
}
