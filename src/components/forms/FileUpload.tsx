'use client';

import { useState, useRef } from 'react';
import { uploadFile, type StorageBucket } from '@/lib/storage/upload';

interface FileUploadProps {
    bucket: StorageBucket;
    folder?: string;
    label?: string;
    helperText?: string;
    accept?: string;
    maxSizeLabel?: string;
    onUploadComplete: (path: string) => void;
    onUploadError?: (error: string) => void;
    disabled?: boolean;
    existingFile?: string | null;
}

export function FileUpload({
    bucket,
    folder,
    label = '파일 업로드',
    helperText,
    accept = 'image/*,.pdf',
    maxSizeLabel = '최대 10MB',
    onUploadComplete,
    onUploadError,
    disabled = false,
    existingFile,
}: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<string | null>(existingFile || null);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        setError(null);
        setIsUploading(true);

        const result = await uploadFile(file, bucket, folder);

        if (result.success && result.path) {
            setUploadedFile(file.name);
            onUploadComplete(result.path);
        } else {
            setError(result.error || '업로드 실패');
            onUploadError?.(result.error || '업로드 실패');
        }

        setIsUploading(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (disabled || isUploading) return;

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleClick = () => {
        if (!disabled && !isUploading) {
            inputRef.current?.click();
        }
    };

    const handleRemove = () => {
        setUploadedFile(null);
        setError(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                </label>
            )}

            <div
                className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer
          ${dragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${error ? 'border-red-300 dark:border-red-600' : ''}
        `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleChange}
                    disabled={disabled || isUploading}
                    className="hidden"
                />

                {isUploading ? (
                    <div className="flex flex-col items-center">
                        <svg
                            className="animate-spin h-8 w-8 text-blue-500 mb-2"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <p className="text-sm text-gray-500 dark:text-gray-400">업로드 중...</p>
                    </div>
                ) : uploadedFile ? (
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-2">
                            <svg
                                className="w-8 h-8 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white font-medium truncate max-w-full">
                            {uploadedFile}
                        </p>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove();
                            }}
                            className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                            파일 제거
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <svg
                            className="w-10 h-10 text-gray-400 mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            <span className="font-medium text-blue-600 dark:text-blue-400">클릭하여 업로드</span>
                            <span className="hidden sm:inline"> 또는 드래그 앤 드롭</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {maxSizeLabel}
                        </p>
                    </div>
                )}
            </div>

            {helperText && !error && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
            )}

            {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
}
