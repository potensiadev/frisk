'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface ReportDownloadProps {
    universityId?: string;
    availableMonths: string[];
    isUniversityUser: boolean;
}

export function ReportDownload({
    universityId,
    availableMonths,
    isUniversityUser,
}: ReportDownloadProps) {
    const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || '');
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState('');

    const handleDownload = async () => {
        if (!selectedMonth) {
            setError('월을 선택해주세요');
            return;
        }

        setError('');
        setIsDownloading(true);

        try {
            const [year, month] = selectedMonth.split('-');
            const params = new URLSearchParams({
                year,
                month,
            });

            if (universityId) {
                params.set('university_id', universityId);
            }

            const response = await fetch(`/api/reports/monthly?${params.toString()}`);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || '리포트 생성에 실패했습니다');
            }

            // Get the PDF blob
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `월간리포트_${year}년_${month}월.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError(err instanceof Error ? err.message : '오류가 발생했습니다');
        } finally {
            setIsDownloading(false);
        }
    };

    const formatMonthLabel = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        return `${year}년 ${parseInt(month)}월`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                리포트 다운로드
            </h2>

            <div className="flex flex-col sm:flex-row gap-4">
                {/* Month Selection */}
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        기간 선택
                    </label>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {availableMonths.map((month) => (
                            <option key={month} value={month}>
                                {formatMonthLabel(month)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Download Button */}
                <div className="flex items-end">
                    <Button
                        onClick={handleDownload}
                        isLoading={isDownloading}
                        disabled={!selectedMonth}
                        className="w-full sm:w-auto"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDF 다운로드
                    </Button>
                </div>
            </div>

            {/* Preview Section */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    리포트 내용
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        총 관리 학생 수
                    </li>
                    <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        해당 월 결석 건수 및 사유별 분류
                    </li>
                    <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        결석률
                    </li>
                    <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        3회 이상 결석 학생 명단 (위험군)
                    </li>
                    <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        결석 상세 내역
                    </li>
                </ul>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}
        </div>
    );
}
