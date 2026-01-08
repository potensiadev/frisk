'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/Modal';
import type { Student, University, StudentProgram, StudentStatus } from '@/types/database';

interface StudentWithUniversity extends Student {
  universities: University;
}

interface StudentListProps {
  students: StudentWithUniversity[];
  universities: { id: string; name: string }[];
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

const programOptions = [
  { value: '', label: '전체 프로그램' },
  { value: 'language', label: '어학연수' },
  { value: 'bachelor', label: '학사' },
  { value: 'master', label: '석사' },
  { value: 'phd', label: '박사' },
];

const statusOptions = [
  { value: '', label: '전체 상태' },
  { value: 'enrolled', label: '재학중' },
  { value: 'graduated', label: '졸업' },
  { value: 'completed', label: '수료' },
  { value: 'withdrawn', label: '자퇴' },
  { value: 'expelled', label: '제적' },
];

export function StudentList({ students, universities }: StudentListProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<StudentWithUniversity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const universityOptions = [
    { value: '', label: '전체 대학교' },
    ...universities.map((u) => ({ value: u.id, label: u.name })),
  ];

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Search filter (name, student_no, phone)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          student.name.toLowerCase().includes(query) ||
          student.student_no.toLowerCase().includes(query) ||
          student.phone.includes(query);
        if (!matchesSearch) return false;
      }

      // University filter
      if (universityFilter && student.university_id !== universityFilter) {
        return false;
      }

      // Program filter
      if (programFilter && student.program !== programFilter) {
        return false;
      }

      // Status filter
      if (statusFilter && student.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [students, searchQuery, universityFilter, programFilter, statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/students/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || '삭제에 실패했습니다');
      } else {
        router.refresh();
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다');
    }

    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const columns = [
    {
      key: 'name',
      header: '이름',
      render: (item: StudentWithUniversity) => (
        <Link
          href={`/agency/students/${item.id}`}
          className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {item.name}
        </Link>
      ),
    },
    {
      key: 'university',
      header: '대학교',
      render: (item: StudentWithUniversity) => (
        <span className="text-gray-900 dark:text-white">{item.universities?.name}</span>
      ),
    },
    {
      key: 'student_no',
      header: '학번',
      render: (item: StudentWithUniversity) => (
        <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">
          {item.student_no}
        </span>
      ),
    },
    {
      key: 'program',
      header: '프로그램',
      render: (item: StudentWithUniversity) => (
        <span className="text-gray-700 dark:text-gray-300">
          {programLabels[item.program]}
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (item: StudentWithUniversity) => {
        const statusInfo = statusLabels[item.status];
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        );
      },
    },
    {
      key: 'phone',
      header: '연락처',
      render: (item: StudentWithUniversity) => (
        <span className="text-gray-500 dark:text-gray-400">{item.phone}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (item: StudentWithUniversity) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/agency/students/${item.id}`)}
          >
            상세
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/agency/students/${item.id}/edit`)}
          >
            수정
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(item)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            삭제
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <Input
              placeholder="이름, 학번, 연락처로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={universityFilter}
            onChange={(e) => setUniversityFilter(e.target.value)}
            options={universityOptions}
          />
          <Select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            options={programOptions}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />
        </div>
        {(searchQuery || universityFilter || programFilter || statusFilter) && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredStudents.length}명의 학생이 검색되었습니다
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setUniversityFilter('');
                setProgramFilter('');
                setStatusFilter('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        emptyMessage="등록된 학생이 없습니다"
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="학생 삭제"
        message={`"${deleteTarget?.name}" 학생을 삭제하시겠습니까? 삭제된 데이터는 1년 후 영구 삭제됩니다.`}
        confirmText="삭제"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
