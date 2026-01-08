'use client';

import { useState } from 'react';
import type { AuditActionType, UserRole } from '@/types/database';

interface AuditLog {
    id: string;
    user_id: string | null;
    action_type: AuditActionType;
    details: string | null;
    ip_address: string | null;
    created_at: string;
    users: {
        email: string;
        role: UserRole;
    } | null;
}

interface AuditLogListProps {
    initialLogs: AuditLog[];
}

const actionTypeLabels: Record<AuditActionType, { label: string; color: string; icon: string }> = {
    login: {
        label: '로그인',
        color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        icon: '🔓',
    },
    login_failed: {
        label: '로그인 실패',
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        icon: '🚫',
    },
    logout: {
        label: '로그아웃',
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        icon: '🔒',
    },
    download: {
        label: '다운로드',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        icon: '📥',
    },
    create: {
        label: '생성',
        color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        icon: '➕',
    },
    update: {
        label: '수정',
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        icon: '✏️',
    },
    delete: {
        label: '삭제',
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        icon: '🗑️',
    },
};

const roleLabels: Record<UserRole, string> = {
    admin: '관리자',
    nepal_agency: '유학원',
    university: '대학교',
};

type FilterType = 'all' | AuditActionType;

export function AuditLogList({ initialLogs }: AuditLogListProps) {
    const [logs] = useState<AuditLog[]>(initialLogs);
    const [filter, setFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter logs
    const filteredLogs = logs.filter((log) => {
        // Filter by action type
        if (filter !== 'all' && log.action_type !== filter) {
            return false;
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const email = log.users?.email?.toLowerCase() || '';
            const ip = log.ip_address?.toLowerCase() || '';
            const details = log.details?.toLowerCase() || '';

            return email.includes(query) || ip.includes(query) || details.includes(query);
        }

        return true;
    });

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const parseDetails = (detailsStr: string | null): Record<string, any> | null => {
        if (!detailsStr) return null;
        try {
            return JSON.parse(detailsStr);
        } catch {
            return null;
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Action Type Filter */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${filter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                    >
                        전체
                    </button>
                    {(Object.keys(actionTypeLabels) as AuditActionType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${filter === type
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                        >
                            {actionTypeLabels[type].label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="이메일, IP 주소 검색..."
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
            </div>

            {/* Log List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Table Header (Desktop) */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <div className="col-span-2">시간</div>
                    <div className="col-span-2">활동</div>
                    <div className="col-span-3">사용자</div>
                    <div className="col-span-2">IP 주소</div>
                    <div className="col-span-3">상세</div>
                </div>

                {/* Log Items */}
                {filteredLogs.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredLogs.map((log) => {
                            const actionInfo = actionTypeLabels[log.action_type];
                            const details = parseDetails(log.details);

                            return (
                                <div
                                    key={log.id}
                                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    {/* Mobile Layout */}
                                    <div className="lg:hidden space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${actionInfo.color}`}>
                                                <span>{actionInfo.icon}</span>
                                                {actionInfo.label}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatDate(log.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            {log.users?.email || '알 수 없음'}
                                            {log.users?.role && (
                                                <span className="text-gray-500 dark:text-gray-400 ml-1">
                                                    ({roleLabels[log.users.role]})
                                                </span>
                                            )}
                                        </p>
                                        {log.ip_address && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                IP: {log.ip_address}
                                            </p>
                                        )}
                                        {details && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded p-2">
                                                {JSON.stringify(details, null, 2)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Desktop Layout */}
                                    <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                                        <div className="col-span-2 text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(log.created_at)}
                                        </div>
                                        <div className="col-span-2">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${actionInfo.color}`}>
                                                <span>{actionInfo.icon}</span>
                                                {actionInfo.label}
                                            </span>
                                        </div>
                                        <div className="col-span-3">
                                            <p className="text-sm text-gray-900 dark:text-white truncate">
                                                {log.users?.email || '알 수 없음'}
                                            </p>
                                            {log.users?.role && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {roleLabels[log.users.role]}
                                                </p>
                                            )}
                                        </div>
                                        <div className="col-span-2 text-sm text-gray-500 dark:text-gray-400 font-mono">
                                            {log.ip_address || '-'}
                                        </div>
                                        <div className="col-span-3 text-sm text-gray-600 dark:text-gray-400 truncate">
                                            {details ? JSON.stringify(details) : '-'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                            기록이 없습니다
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            선택한 필터에 해당하는 로그가 없습니다.
                        </p>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                최근 50건의 로그가 표시됩니다. 전체 로그는 데이터베이스에서 직접 조회해주세요.
            </div>
        </div>
    );
}
