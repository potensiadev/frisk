'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { University } from '@/types/database';

interface StudentWithCheckin {
    id: string;
    name: string;
    student_no: string;
    department: string;
    phone: string;
    address: string;
    email: string | null;
    universities: University;
    currentQuarterCheckin: {
        id: string;
        check_in_date: string;
        phone_verified: boolean;
        address_verified: boolean;
        email_verified: boolean;
    } | null;
    isCheckedIn: boolean;
}

interface CheckinListProps {
    uncheckedStudents: StudentWithCheckin[];
    checkedStudents: StudentWithCheckin[];
    currentQuarter: number;
    currentYear: number;
}

type TabType = 'unchecked' | 'checked';

export function CheckinList({
    uncheckedStudents,
    checkedStudents,
    currentQuarter,
    currentYear,
}: CheckinListProps) {
    const [activeTab, setActiveTab] = useState<TabType>('unchecked');
    const [searchQuery, setSearchQuery] = useState('');

    const students = activeTab === 'unchecked' ? uncheckedStudents : checkedStudents;

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_no.includes(searchQuery) ||
        student.universities?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('unchecked')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'unchecked'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                >
                    미점검 ({uncheckedStudents.length})
                </button>
                <button
                    onClick={() => setActiveTab('checked')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'checked'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                >
                    점검 완료 ({checkedStudents.length})
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="학생명, 학번, 대학교 검색..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                    className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            {/* Student Cards */}
            {filteredStudents.length > 0 ? (
                <div className="grid gap-4">
                    {filteredStudents.map((student) => (
                        <div
                            key={student.id}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                            {student.name}
                                        </h3>
                                        {student.isCheckedIn && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                점검완료
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {student.universities?.name} · {student.student_no}
                                    </p>

                                    {/* Contact Info */}
                                    <div className="mt-3 space-y-1 text-sm">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span>{student.phone}</span>
                                            {student.currentQuarterCheckin?.phone_verified && (
                                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                                            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="flex-1">{student.address}</span>
                                            {student.currentQuarterCheckin?.address_verified && (
                                                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        {student.email && (
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span>{student.email}</span>
                                                {student.currentQuarterCheckin?.email_verified && (
                                                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Checked Date */}
                                    {student.currentQuarterCheckin && (
                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            점검일: {new Date(student.currentQuarterCheckin.check_in_date).toLocaleDateString('ko-KR')}
                                        </p>
                                    )}
                                </div>

                                {/* Action Button */}
                                <Link
                                    href={`/agency/checkin/${student.id}`}
                                    className="flex-shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    {student.isCheckedIn ? '수정' : '점검하기'}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        {activeTab === 'unchecked' ? '미점검 학생이 없습니다' : '점검 완료된 학생이 없습니다'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {activeTab === 'unchecked'
                            ? `${currentYear}년 ${currentQuarter}분기 모든 학생 점검이 완료되었습니다.`
                            : '아직 점검을 시작하지 않았습니다.'
                        }
                    </p>
                </div>
            )}
        </div>
    );
}
