'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UniversityContactForm } from '@/components/forms/UniversityContactForm';
import { createClient } from '@/lib/supabase/client';
import type { University, UniversityContact } from '@/types/database';

interface Contact {
  id?: string;
  email: string;
  is_primary: boolean;
}

interface UniversityEditFormProps {
  university: University;
  contacts: UniversityContact[];
  studentCount: number;
}

export function UniversityEditForm({ university, contacts: initialContacts, studentCount }: UniversityEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(university.name);
  const [contacts, setContacts] = useState<Contact[]>(
    initialContacts.map((c) => ({
      id: c.id,
      email: c.email,
      is_primary: c.is_primary,
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!name.trim()) {
      setError('대학교명을 입력해주세요');
      return;
    }

    const validContacts = contacts.filter((c) => c.email.trim());
    if (validContacts.length === 0) {
      setError('최소 1명의 담당자 이메일을 입력해주세요');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmail = validContacts.find((c) => !emailRegex.test(c.email));
    if (invalidEmail) {
      setError('올바른 이메일 형식을 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    // 1. Update university name
    if (name.trim() !== university.name) {
      const { error: uniError } = await supabase
        .from('universities')
        .update({ name: name.trim() })
        .eq('id', university.id);

      if (uniError) {
        console.error('University update error:', uniError);
        if (uniError.code === '23505') {
          setError('이미 등록된 대학교명입니다');
        } else {
          setError('대학교 수정에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
        setIsSubmitting(false);
        return;
      }
    }

    // 2. Update contacts
    // Delete removed contacts
    const existingIds = initialContacts.map((c) => c.id);
    const currentIds = validContacts.filter((c) => c.id).map((c) => c.id);
    const toDelete = existingIds.filter((id) => !currentIds.includes(id));

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('university_contacts')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        console.error('Contact delete error:', deleteError);
        setError('담당자 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
        setIsSubmitting(false);
        return;
      }
    }

    // Update existing contacts
    for (const contact of validContacts.filter((c) => c.id)) {
      const { error: updateError } = await supabase
        .from('university_contacts')
        .update({
          email: contact.email.trim(),
          is_primary: contact.is_primary,
        })
        .eq('id', contact.id);

      if (updateError) {
        console.error('Contact update error:', updateError);
        setError('담당자 수정에 실패했습니다. 잠시 후 다시 시도해주세요.');
        setIsSubmitting(false);
        return;
      }
    }

    // Insert new contacts
    const newContacts = validContacts.filter((c) => !c.id);
    if (newContacts.length > 0) {
      const { error: insertError } = await supabase
        .from('university_contacts')
        .insert(
          newContacts.map((c) => ({
            university_id: university.id,
            email: c.email.trim(),
            is_primary: c.is_primary,
          }))
        );

      if (insertError) {
        console.error('Contact insert error:', insertError);
        setError('담당자 추가에 실패했습니다. 잠시 후 다시 시도해주세요.');
        setIsSubmitting(false);
        return;
      }
    }

    setSuccess('대학교 정보가 수정되었습니다');
    setIsSubmitting(false);
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/universities"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          대학교 목록으로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">대학교 수정</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">대학교 정보를 수정합니다</p>
      </div>

      {/* Stats */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-blue-600 dark:text-blue-400">등록된 학생 수</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{studentCount}명</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="space-y-6">
            {/* University Name */}
            <Input
              label="대학교명"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 서울대학교"
              maxLength={100}
              required
            />

            {/* Contacts */}
            <UniversityContactForm
              contacts={contacts}
              onChange={setContacts}
            />
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
