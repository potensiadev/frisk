'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import type { University, UniversityContact } from '@/types/database';

interface UniversityWithContacts extends University {
  university_contacts: UniversityContact[];
}

interface UniversityListProps {
  universities: UniversityWithContacts[];
}

export function UniversityList({ universities }: UniversityListProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<UniversityWithContacts | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/universities/${deleteTarget.id}`, {
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
      header: '대학교명',
      render: (item: UniversityWithContacts) => (
        <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
      ),
    },
    {
      key: 'contacts',
      header: '담당자 이메일',
      render: (item: UniversityWithContacts) => {
        const contacts = item.university_contacts || [];
        if (contacts.length === 0) {
          return <span className="text-gray-400">미등록</span>;
        }
        return (
          <div className="space-y-1">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center gap-2">
                <span className="text-sm">{contact.email}</span>
                {contact.is_primary && (
                  <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                    대표
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: 'created_at',
      header: '등록일',
      render: (item: UniversityWithContacts) => (
        <span className="text-gray-500 dark:text-gray-400">
          {new Date(item.created_at).toLocaleDateString('ko-KR')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (item: UniversityWithContacts) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/universities/${item.id}`)}
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
        data={universities}
        keyExtractor={(item) => item.id}
        emptyMessage="등록된 대학교가 없습니다"
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="대학교 삭제"
        message={`"${deleteTarget?.name}" 대학교를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
