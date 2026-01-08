'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import type { User, University, UserRole } from '@/types/database';

interface UserWithUniversity extends User {
  universities: University | null;
}

interface UserListProps {
  users: UserWithUniversity[];
}

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

export function UserList({ users }: UserListProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<UserWithUniversity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/users/${deleteTarget.id}`, {
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
      key: 'email',
      header: '이메일',
      render: (item: UserWithUniversity) => (
        <span className="font-medium text-gray-900 dark:text-white">{item.email}</span>
      ),
    },
    {
      key: 'role',
      header: '역할',
      render: (item: UserWithUniversity) => {
        const roleInfo = roleLabels[item.role];
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleInfo.color}`}>
            {roleInfo.label}
          </span>
        );
      },
    },
    {
      key: 'university',
      header: '소속 대학교',
      render: (item: UserWithUniversity) => {
        if (item.role !== 'university') {
          return <span className="text-gray-400">-</span>;
        }
        return item.universities ? (
          <span>{item.universities.name}</span>
        ) : (
          <span className="text-amber-500">미지정</span>
        );
      },
    },
    {
      key: 'created_at',
      header: '등록일',
      render: (item: UserWithUniversity) => (
        <span className="text-gray-500 dark:text-gray-400">
          {new Date(item.created_at).toLocaleDateString('ko-KR')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (item: UserWithUniversity) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/users/${item.id}`)}
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
      <Table
        columns={columns}
        data={users}
        keyExtractor={(item) => item.id}
        emptyMessage="등록된 사용자가 없습니다"
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="사용자 삭제"
        message={`"${deleteTarget?.email}" 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
