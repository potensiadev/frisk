'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { University } from '@/types/database';

interface StudentData {
    id: string;
    name: string;
    student_no: string;
    department: string;
    phone: string;
    address: string;
    email: string | null;
    universities: University;
}

interface CheckinData {
    id: string;
    check_in_date: string;
    phone_verified: boolean;
    address_verified: boolean;
    email_verified: boolean;
}

interface CheckinFormProps {
    student: StudentData;
    currentCheckin: CheckinData | null;
    currentQuarter: number;
    currentYear: number;
    userId: string;
}

export function CheckinForm({
    student,
    currentCheckin,
    currentQuarter,
    currentYear,
    userId,
}: CheckinFormProps) {
    const router = useRouter();

    // Form state
    const [phone, setPhone] = useState(student.phone);
    const [address, setAddress] = useState(student.address);
    const [email, setEmail] = useState(student.email || '');

    const [phoneVerified, setPhoneVerified] = useState(currentCheckin?.phone_verified || false);
    const [addressVerified, setAddressVerified] = useState(currentCheckin?.address_verified || false);
    const [emailVerified, setEmailVerified] = useState(currentCheckin?.email_verified || false);

    // Track if contact info changed
    const [phoneChanged, setPhoneChanged] = useState(false);
    const [addressChanged, setAddressChanged] = useState(false);
    const [emailChanged, setEmailChanged] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handlePhoneChange = (value: string) => {
        setPhone(value);
        setPhoneChanged(value !== student.phone);
        if (value !== student.phone) setPhoneVerified(false);
    };

    const handleAddressChange = (value: string) => {
        setAddress(value);
        setAddressChanged(value !== student.address);
        if (value !== student.address) setAddressVerified(false);
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        setEmailChanged(value !== (student.email || ''));
        if (value !== (student.email || '')) setEmailVerified(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: student.id,
                    phone: phone.trim(),
                    address: address.trim(),
                    email: email.trim() || null,
                    phone_verified: phoneVerified,
                    address_verified: addressVerified,
                    email_verified: emailVerified,
                    phone_changed: phoneChanged,
                    address_changed: addressChanged,
                    email_changed: emailChanged,
                    existing_checkin_id: currentCheckin?.id || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '점검 저장에 실패했습니다');
            }

            setSuccess('점검이 완료되었습니다');

            setTimeout(() => {
                router.push('/agency/checkin');
                router.refresh();
            }, 1000);
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
                    href="/agency/checkin"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    점검 목록으로
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    연락처 점검
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {currentYear}년 {currentQuarter}분기 · {student.name}
                </p>
            </div>

            {/* Student Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">학생 정보</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">이름</p>
                        <p className="text-gray-900 dark:text-white font-medium">{student.name}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">학번</p>
                        <p className="text-gray-900 dark:text-white font-mono">{student.student_no}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">대학교</p>
                        <p className="text-gray-900 dark:text-white">{student.universities?.name}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">학과</p>
                        <p className="text-gray-900 dark:text-white">{student.department}</p>
                    </div>
                </div>
            </div>

            {/* Check-in Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Phone */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <Input
                                label="휴대폰번호"
                                type="tel"
                                value={phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                required
                            />
                            {phoneChanged && (
                                <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                                    연락처가 변경되었습니다 (이전: {student.phone})
                                </p>
                            )}
                        </div>
                        <label className="flex items-center gap-2 pt-7 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={phoneVerified}
                                onChange={(e) => setPhoneVerified(e.target.checked)}
                                className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">확인</span>
                        </label>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <Input
                                label="주소"
                                value={address}
                                onChange={(e) => handleAddressChange(e.target.value)}
                                required
                            />
                            {addressChanged && (
                                <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                                    주소가 변경되었습니다
                                </p>
                            )}
                        </div>
                        <label className="flex items-center gap-2 pt-7 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={addressVerified}
                                onChange={(e) => setAddressVerified(e.target.checked)}
                                className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">확인</span>
                        </label>
                    </div>
                </div>

                {/* Email */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <Input
                                label="이메일 (선택)"
                                type="email"
                                value={email}
                                onChange={(e) => handleEmailChange(e.target.value)}
                            />
                            {emailChanged && (
                                <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                                    이메일이 변경되었습니다
                                </p>
                            )}
                        </div>
                        <label className="flex items-center gap-2 pt-7 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={emailVerified}
                                onChange={(e) => setEmailVerified(e.target.checked)}
                                className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">확인</span>
                        </label>
                    </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex gap-3">
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-blue-700 dark:text-blue-400">
                            <p className="font-medium mb-1">점검 방법</p>
                            <ul className="list-disc list-inside space-y-0.5">
                                <li>학생과 대면하여 각 연락처가 일치하는지 확인합니다</li>
                                <li>일치하면 &apos;확인&apos; 체크박스를 선택합니다</li>
                                <li>연락처가 변경된 경우 새로운 정보를 입력합니다</li>
                                <li>변경된 연락처는 자동으로 기록됩니다</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

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
                        점검 완료
                    </Button>
                </div>
            </form>
        </div>
    );
}
