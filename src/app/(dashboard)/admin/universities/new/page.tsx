'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UniversityContactForm } from '@/components/forms/UniversityContactForm';
import { createClient } from '@/lib/supabase/client';

interface Contact {
  email: string;
  is_primary: boolean;
}

export default function NewUniversityPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([{ email: '', is_primary: true }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;

      // 1. Create university
      const { data: university, error: uniError } = await supabase
        .from('universities')
        .insert({ name: name.trim() })
        .select()
        .single();

      if (uniError) {
        console.error('University creation error:', uniError);
        if (uniError.code === '23505') {
          setError('이미 등록된 대학교명입니다');
        } else {
          setError('대학교 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
        return;
      }

      // 2. Create contacts
      const contactsToInsert = validContacts.map((c) => ({
        university_id: university.id,
        email: c.email.trim(),
        is_primary: c.is_primary,
      }));

      const { error: contactError } = await supabase
        .from('university_contacts')
        .insert(contactsToInsert);

      if (contactError) {
        console.error('Contact creation error:', contactError);
        // Rollback: delete created university
        await supabase.from('universities').delete().eq('id', university.id);
        setError('담당자 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      router.push('/admin/universities');
      router.refresh();
    } catch (error) {
      console.error('Unexpected error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">대학교 추가</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">새로운 제휴 대학교를 등록합니다</p>
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
