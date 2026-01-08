/**
 * Input validation utilities
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Password validation rules:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: '비밀번호를 입력해주세요' };
  }

  if (password.length < 8) {
    return { valid: false, error: '비밀번호는 8자 이상이어야 합니다' };
  }

  if (password.length > 128) {
    return { valid: false, error: '비밀번호는 128자 이하여야 합니다' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: '비밀번호에 대문자가 포함되어야 합니다' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: '비밀번호에 소문자가 포함되어야 합니다' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: '비밀번호에 숫자가 포함되어야 합니다' };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: '비밀번호에 특수문자가 포함되어야 합니다' };
  }

  return { valid: true };
}

/**
 * Get password requirements message
 */
export function getPasswordRequirements(): string {
  return '비밀번호는 8자 이상이며, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다';
}

/**
 * Email validation
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, error: '이메일을 입력해주세요' };
  }

  // More comprehensive email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: '올바른 이메일 형식을 입력해주세요' };
  }

  if (email.length > 254) {
    return { valid: false, error: '이메일은 254자 이하여야 합니다' };
  }

  return { valid: true };
}

/**
 * University name validation
 */
export function validateUniversityName(name: string): ValidationResult {
  if (!name || !name.trim()) {
    return { valid: false, error: '대학교명을 입력해주세요' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return { valid: false, error: '대학교명은 2자 이상이어야 합니다' };
  }

  if (trimmedName.length > 100) {
    return { valid: false, error: '대학교명은 100자 이하여야 합니다' };
  }

  return { valid: true };
}

/**
 * Generic text length validation
 */
export function validateTextLength(
  text: string,
  fieldName: string,
  minLength: number,
  maxLength: number
): ValidationResult {
  if (!text || !text.trim()) {
    return { valid: false, error: `${fieldName}을(를) 입력해주세요` };
  }

  const trimmedText = text.trim();

  if (trimmedText.length < minLength) {
    return { valid: false, error: `${fieldName}은(는) ${minLength}자 이상이어야 합니다` };
  }

  if (trimmedText.length > maxLength) {
    return { valid: false, error: `${fieldName}은(는) ${maxLength}자 이하여야 합니다` };
  }

  return { valid: true };
}
