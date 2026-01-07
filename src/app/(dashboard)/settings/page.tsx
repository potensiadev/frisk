'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // 유효성 검사
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: '새 비밀번호는 최소 6자 이상이어야 합니다.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
            return;
        }

        if (currentPassword === newPassword) {
            setMessage({ type: 'error', text: '현재 비밀번호와 다른 비밀번호를 입력해주세요.' });
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            // 현재 비밀번호 확인을 위해 재인증
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) {
                setMessage({ type: 'error', text: '사용자 정보를 확인할 수 없습니다.' });
                return;
            }

            // 현재 비밀번호로 재인증
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });

            if (signInError) {
                setMessage({ type: 'error', text: '현재 비밀번호가 올바르지 않습니다.' });
                return;
            }

            // 새 비밀번호로 업데이트
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (updateError) {
                setMessage({ type: 'error', text: '비밀번호 변경에 실패했습니다. 다시 시도해주세요.' });
                return;
            }

            setMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch {
            setMessage({ type: 'error', text: '오류가 발생했습니다. 다시 시도해주세요.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">설정</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">계정 설정을 관리하세요</p>
            </div>

            {/* 비밀번호 변경 섹션 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">비밀번호 변경</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        정기적으로 비밀번호를 변경하여 계정을 안전하게 보호하세요
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {message && (
                        <div
                            className={`px-4 py-3 rounded-lg text-sm ${message.type === 'success'
                                    ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                    : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                }`}
                        >
                            {message.text}
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="currentPassword"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                            현재 비밀번호
                        </label>
                        <input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="현재 비밀번호를 입력하세요"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="newPassword"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                            새 비밀번호
                        </label>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="새 비밀번호를 입력하세요 (최소 6자)"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                            새 비밀번호 확인
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="새 비밀번호를 다시 입력하세요"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    변경 중...
                                </span>
                            ) : (
                                '비밀번호 변경'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* 보안 안내 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex gap-3">
                    <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <div>
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">보안 안내</h3>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                            <li>• 비밀번호는 최소 6자 이상이어야 합니다</li>
                            <li>• 영문, 숫자, 특수문자를 조합하면 더 안전합니다</li>
                            <li>• 다른 사이트와 동일한 비밀번호 사용을 피하세요</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
