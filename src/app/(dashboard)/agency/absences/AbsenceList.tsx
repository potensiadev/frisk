'use client';

import { useState, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import type { Absence, Student, University, AbsenceReason } from '@/types/database';

interface AbsenceWithStudent extends Absence {
  students: Student & {
    universities: University;
  };
}

interface FilterValues {
  search: string;
  university: string;
  reason: string;
  startDate: string;
  endDate: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

interface AbsenceListProps {
  absences: AbsenceWithStudent[];
  universities: { id: string; name: string }[];
  initialFilters: FilterValues;
  pagination: PaginationInfo;
}

const reasonLabels: Record<AbsenceReason, { label: string; color: string }> = {
  illness: {
    label: '질병',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  personal: {
    label: '개인 사정',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  other: {
    label: '기타',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  },
};

export function AbsenceList({ absences, universities, initialFilters, pagination }: AbsenceListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialFilters.search);
  const [universityFilter, setUniversityFilter] = useState(initialFilters.university);
  const [reasonFilter, setReasonFilter] = useState(initialFilters.reason);
  const [startDate, setStartDate] = useState(initialFilters.startDate);
  const [endDate, setEndDate] = useState(initialFilters.endDate);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update URL with filters (server-side filtering)
  const updateFilters = useCallback((newFilters: Partial<FilterValues>) => {
    const params = new URLSearchParams(searchParams.toString());

    const filters = {
      search: newFilters.search ?? search,
      university: newFilters.university ?? universityFilter,
      reason: newFilters.reason ?? reasonFilter,
      startDate: newFilters.startDate ?? startDate,
      endDate: newFilters.endDate ?? endDate,
    };

    // Update or remove params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    startTransition(() => {
      router.push(`/agency/absences?${params.toString()}`, { scroll: false });
    });
  }, [searchParams, router, search, universityFilter, reasonFilter, startDate, endDate]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    const timeoutId = setTimeout(() => {
      updateFilters({ search: value });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [updateFilters]);

  const handleFilterChange = useCallback((key: keyof FilterValues, value: string) => {
    switch (key) {
      case 'university':
        setUniversityFilter(value);
        break;
      case 'reason':
        setReasonFilter(value);
        break;
      case 'startDate':
        setStartDate(value);
        break;
      case 'endDate':
        setEndDate(value);
        break;
    }
    updateFilters({ [key]: value });
  }, [updateFilters]);

  const hasFilters = !!(search || universityFilter || reasonFilter || startDate || endDate);

  const goToPage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }
    startTransition(() => {
      router.push(`/agency/absences?${params.toString()}`, { scroll: false });
    });
  }, [searchParams, router]);

  const handleDelete = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/absences/${deletingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '삭제에 실패했습니다');
      }

      setShowDeleteModal(false);
      setDeletingId(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  return (
    <div className={`space-y-4 ${isPending ? 'opacity-70' : ''}`}>
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="학생명, 학번 검색..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* University Filter */}
          <select
            value={universityFilter}
            onChange={(e) => handleFilterChange('university', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">전체 대학교</option>
            {universities.map((uni) => (
              <option key={uni.id} value={uni.id}>
                {uni.name}
              </option>
            ))}
          </select>

          {/* Reason Filter */}
          <select
            value={reasonFilter}
            onChange={(e) => handleFilterChange('reason', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">전체 사유</option>
            <option value="illness">질병</option>
            <option value="personal">개인 사정</option>
            <option value="other">기타</option>
          </select>

          {/* Date Range */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            placeholder="시작일"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            placeholder="종료일"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {isPending ? '검색 중...' : `총 ${absences.length}건`}
      </div>

      {/* Absence List */}
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${isPending ? 'pointer-events-none' : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  결석일
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  학생 정보
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  대학교
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  사유
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  비고
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {absences.length > 0 ? (
                absences.map((absence) => {
                  const reasonInfo = reasonLabels[absence.reason];
                  return (
                    <tr
                      key={absence.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(absence.absence_date).toLocaleDateString('ko-KR')}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/agency/students/${absence.student_id}`}
                          className="hover:underline"
                        >
                          <p className="font-medium text-gray-900 dark:text-white">
                            {absence.students.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {absence.students.student_no}
                          </p>
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-gray-900 dark:text-white">
                        {absence.students.universities?.name}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${reasonInfo.color}`}
                        >
                          {reasonInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {absence.note || '-'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => openDeleteModal(absence.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="w-12 h-12 text-gray-300 dark:text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400">
                        {hasFilters
                          ? '검색 결과가 없습니다'
                          : '등록된 결석이 없습니다'}
                      </p>
                      <Link href="/agency/absences/new">
                        <Button size="sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          결석 등록
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            총 {pagination.totalCount}건 중 {(pagination.currentPage - 1) * 20 + 1}-{Math.min(pagination.currentPage * 20, pagination.totalCount)}건 표시
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => goToPage(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || isPending}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              이전
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    disabled={isPending}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === pagination.currentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => goToPage(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages || isPending}
            >
              다음
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingId(null);
        }}
        onConfirm={handleDelete}
        title="결석 삭제"
        message="이 결석 기록을 삭제하시겠습니까? 관련 증빙 파일도 함께 삭제됩니다."
        confirmText="삭제"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
