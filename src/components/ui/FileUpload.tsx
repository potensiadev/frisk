'use client';

import { useState, useRef, useCallback } from 'react';

interface FileUploadProps {
  label: string;
  accept?: string;
  maxSize?: number; // in bytes
  currentFileUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete?: () => Promise<void>;
  helperText?: string;
  disabled?: boolean;
}

export function FileUpload({
  label,
  accept = '.pdf,.jpg,.jpeg,.png,.webp',
  maxSize = 5 * 1024 * 1024, // 5MB default
  currentFileUrl,
  onUpload,
  onDelete,
  helperText,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `파일 크기는 ${formatFileSize(maxSize)} 이하여야 합니다`;
    }

    // Check file type
    const allowedTypes = accept.split(',').map((t) => t.trim().toLowerCase());
    const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const fileMime = file.type.toLowerCase();

    const isValidType = allowedTypes.some((type) => {
      if (type.startsWith('.')) {
        return type === fileExt;
      }
      if (type.includes('/*')) {
        return fileMime.startsWith(type.replace('/*', '/'));
      }
      return type === fileMime;
    });

    if (!isValidType) {
      return `허용된 파일 형식: ${accept}`;
    }

    return null;
  };

  const handleFile = useCallback(
    async (file: File) => {
      setError('');

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsUploading(true);
      try {
        await onUpload(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : '업로드에 실패했습니다');
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, maxSize, accept]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
      // Reset input value to allow re-uploading same file
      e.target.value = '';
    },
    [handleFile]
  );

  const handleDelete = async () => {
    if (!onDelete) return;

    setError('');
    setIsUploading(true);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {currentFileUrl ? (
        // Show current file
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                파일 업로드됨
              </p>
              <a
                href={currentFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                파일 보기
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
            >
              변경
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={disabled || isUploading}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
              >
                삭제
              </button>
            )}
          </div>
        </div>
      ) : (
        // Show upload area
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`
            relative p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <>
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">업로드 중...</p>
              </>
            ) : (
              <>
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      클릭하여 업로드
                    </span>
                    {' '}또는 파일을 드래그하세요
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {accept} (최대 {formatFileSize(maxSize)})
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}
