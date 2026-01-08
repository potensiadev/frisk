'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Student, University, Absence, QuarterlyCheckin, StudentProgram, StudentStatus, AbsenceReason } from '@/types/database';
import { FileUpload } from '@/components/forms/FileUpload';
import { getSignedUrl } from '@/lib/storage/upload';

interface StudentWithUniversity extends Student {
  universities: University;
}

interface StudentDetailProps {
  student: StudentWithUniversity;
  absenceCount: number;
  recentAbsences: Absence[];
  lastCheckin: QuarterlyCheckin | null;
}

const programLabels: Record<StudentProgram, string> = {
  language: '어학연수',
  bachelor: '학사',
  master: '석사',
  phd: '박사',
};

const statusLabels: Record<StudentStatus, { label: string; color: string }> = {
  enrolled: {
    label: '재학중',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  graduated: {
    label: '졸업',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  completed: {
    label: '수료',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  withdrawn: {
    label: '자퇴',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  expelled: {
    label: '제적',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

const reasonLabels: Record<AbsenceReason, string> = {
  illness: '질병',
  personal: '개인사정',
  other: '기타',
};

export function StudentDetail({ student, absenceCount, recentAbsences, lastCheckin }: StudentDetailProps) {
  const router = useRouter();
  const statusInfo = statusLabels[student.status];
  const isRiskStudent = absenceCount >= 3;

  const [consentFileUrl, setConsentFileUrl] = useState<string | null>(null);
  const [isUploadingConsent, setIsUploadingConsent] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Get signed URL for existing consent file
  useEffect(() => {
    async function fetchSignedUrl() {
      if (student.consent_file_url) {
        const result = await getSignedUrl('consent-files', student.consent_file_url);
        if (result.url) {
          setConsentFileUrl(result.url);
        }
      }
    }
    fetchSignedUrl();
  }, [student.consent_file_url]);

  // Handle consent file upload
  const handleConsentUpload = async (path: string) => {
    setIsUploadingConsent(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const response = await fetch(`/api/students/${student.id}/consent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent_file_url: path }),
      });

      if (!response.ok) {
        throw new Error('동의서 저장에 실패했습니다');
      }

      setUploadSuccess(true);
      router.refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setIsUploadingConsent(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Basic Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">기본 정보</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">대학교</p>
              <p className="text-gray-900 dark:text-white font-medium">{student.universities?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">학번</p>
              <p className="text-gray-900 dark:text-white font-mono">{student.student_no}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">학과</p>
              <p className="text-gray-900 dark:text-white">{student.department}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">프로그램</p>
              <p className="text-gray-900 dark:text-white">{programLabels[student.program]}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">상태</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">등록일</p>
              <p className="text-gray-900 dark:text-white">
                {new Date(student.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">연락처 정보</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">주소</p>
              <p className="text-gray-900 dark:text-white">{student.address}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">휴대폰번호</p>
                <p className="text-gray-900 dark:text-white">{student.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">이메일</p>
                <p className="text-gray-900 dark:text-white">{student.email || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Absences */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">최근 결석 기록</h2>
            {absenceCount > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                총 {absenceCount}건
              </span>
            )}
          </div>
          {recentAbsences.length > 0 ? (
            <div className="space-y-3">
              {recentAbsences.map((absence) => (
                <div
                  key={absence.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(absence.absence_date).toLocaleDateString('ko-KR')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {reasonLabels[absence.reason]}
                      {absence.note && ` - ${absence.note}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">결석 기록이 없습니다</p>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Risk Alert */}
        {isRiskStudent && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">위험군 학생</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  결석 {absenceCount}회로 비자 연장 리스크가 있습니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">결석 현황</h3>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{absenceCount}회</div>
          {absenceCount >= 3 && (
            <p className="text-sm text-red-500 mt-1">위험군 기준 초과</p>
          )}
        </div>

        {/* Last Check-in */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">최근 점검일</h3>
          {lastCheckin ? (
            <>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(lastCheckin.check_in_date).toLocaleDateString('ko-KR')}
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  {lastCheckin.phone_verified ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className="text-gray-600 dark:text-gray-400">휴대폰번호</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {lastCheckin.address_verified ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className="text-gray-600 dark:text-gray-400">주소</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {lastCheckin.email_verified ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className="text-gray-600 dark:text-gray-400">이메일</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">점검 기록 없음</p>
          )}
        </div>

        {/* Consent File */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">개인정보 동의서</h3>

          {student.consent_file_url ? (
            <div className="space-y-3">
              <a
                href={consentFileUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 ${!consentFileUrl ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {consentFileUrl ? '파일 보기' : '로딩 중...'}
              </a>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                새 파일을 업로드하면 기존 파일이 대체됩니다.
              </p>
            </div>
          ) : null}

          <div className={student.consent_file_url ? 'mt-4' : ''}>
            <FileUpload
              bucket="consent-files"
              folder={student.id}
              label={student.consent_file_url ? '새 동의서 업로드' : undefined}
              helperText="스캔된 동의서 이미지 또는 PDF"
              onUploadComplete={handleConsentUpload}
              onUploadError={(err) => setUploadError(err)}
              disabled={isUploadingConsent}
            />
          </div>

          {uploadSuccess && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
              동의서가 저장되었습니다.
            </p>
          )}

          {uploadError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {uploadError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
