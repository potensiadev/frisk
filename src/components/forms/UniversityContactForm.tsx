'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Contact {
  id?: string;
  email: string;
  is_primary: boolean;
}

interface UniversityContactFormProps {
  contacts: Contact[];
  onChange: (contacts: Contact[]) => void;
  maxContacts?: number;
}

export function UniversityContactForm({
  contacts,
  onChange,
  maxContacts = 2,
}: UniversityContactFormProps) {
  const [emailError, setEmailError] = useState<string>('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddContact = () => {
    if (contacts.length >= maxContacts) {
      setEmailError(`최대 ${maxContacts}명까지 등록 가능합니다`);
      return;
    }
    onChange([...contacts, { email: '', is_primary: contacts.length === 0 }]);
  };

  const handleRemoveContact = (index: number) => {
    const newContacts = contacts.filter((_, i) => i !== index);
    // 삭제 후 대표 담당자가 없으면 첫 번째를 대표로 설정
    if (newContacts.length > 0 && !newContacts.some((c) => c.is_primary)) {
      newContacts[0].is_primary = true;
    }
    onChange(newContacts);
    setEmailError('');
  };

  const handleEmailChange = (index: number, email: string) => {
    const newContacts = [...contacts];
    newContacts[index] = { ...newContacts[index], email };
    onChange(newContacts);

    if (email && !validateEmail(email)) {
      setEmailError('올바른 이메일 형식을 입력해주세요');
    } else {
      setEmailError('');
    }
  };

  const handlePrimaryChange = (index: number) => {
    const newContacts = contacts.map((contact, i) => ({
      ...contact,
      is_primary: i === index,
    }));
    onChange(newContacts);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          담당자 이메일 <span className="text-red-500">*</span>
          <span className="text-gray-400 font-normal ml-2">(최소 1명, 최대 {maxContacts}명)</span>
        </label>
        {contacts.length < maxContacts && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddContact}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            담당자 추가
          </Button>
        )}
      </div>

      {contacts.length === 0 && (
        <div className="text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 mb-2">등록된 담당자가 없습니다</p>
          <Button type="button" variant="secondary" size="sm" onClick={handleAddContact}>
            담당자 추가
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {contacts.map((contact, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-1">
              <Input
                type="email"
                value={contact.email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                placeholder="example@university.ac.kr"
                maxLength={254}
                required
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="primary_contact"
                  checked={contact.is_primary}
                  onChange={() => handlePrimaryChange(index)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">대표</span>
              </label>
              {contacts.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveContact(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {emailError && (
        <p className="text-sm text-red-500">{emailError}</p>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        결석 알림 이메일이 등록된 담당자에게 발송됩니다.
      </p>
    </div>
  );
}
