import type { UserRole } from '@/types/database';

/**
 * 역할별 대시보드 경로 매핑
 */
export const ROLE_DASHBOARD_PATHS: Record<UserRole, string> = {
  admin: '/admin',
  nepal_agency: '/agency',
  university: '/university',
} as const;

/**
 * 보호된 경로 목록
 */
export const PROTECTED_PATHS = [
  '/admin',
  '/agency',
  '/university',
  '/settings',
] as const;

/**
 * 공개 경로 목록
 */
export const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
] as const;

/**
 * 역할에 따른 리다이렉트 경로 반환
 */
export function getRedirectPathByRole(role: UserRole | null): string {
  if (!role) {
    return '/login';
  }
  return ROLE_DASHBOARD_PATHS[role] ?? '/login';
}

/**
 * 현재 경로가 해당 역할에 허용되는지 확인
 */
export function isPathAllowedForRole(path: string, role: UserRole | null): boolean {
  if (!role) {
    return false;
  }

  // Admin은 모든 경로 접근 가능
  if (role === 'admin') {
    return true;
  }

  // Nepal Agency는 /agency, /settings 접근 가능
  if (role === 'nepal_agency') {
    return path.startsWith('/agency') || path.startsWith('/settings');
  }

  // University는 /university, /settings 접근 가능
  if (role === 'university') {
    return path.startsWith('/university') || path.startsWith('/settings');
  }

  return false;
}

/**
 * 경로가 보호된 경로인지 확인
 */
export function isProtectedPath(path: string): boolean {
  return PROTECTED_PATHS.some((protectedPath) => path.startsWith(protectedPath));
}

/**
 * 경로가 공개 경로인지 확인
 */
export function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((publicPath) => path.startsWith(publicPath));
}

/**
 * 역할에 따른 권한 체크
 */
export const RolePermissions = {
  /**
   * Admin 역할 확인
   */
  isAdmin(role: UserRole | null): boolean {
    return role === 'admin';
  },

  /**
   * Nepal Agency 역할 확인
   */
  isNepalAgency(role: UserRole | null): boolean {
    return role === 'nepal_agency';
  },

  /**
   * University 역할 확인
   */
  isUniversity(role: UserRole | null): boolean {
    return role === 'university';
  },

  /**
   * Admin 영역 접근 가능 여부
   */
  canAccessAdmin(role: UserRole | null): boolean {
    return role === 'admin';
  },

  /**
   * Agency 영역 접근 가능 여부 (admin + nepal_agency)
   */
  canAccessAgency(role: UserRole | null): boolean {
    return role === 'admin' || role === 'nepal_agency';
  },

  /**
   * University 영역 접근 가능 여부 (admin + university)
   */
  canAccessUniversity(role: UserRole | null): boolean {
    return role === 'admin' || role === 'university';
  },

  /**
   * 학생 데이터 쓰기 권한 (admin + nepal_agency)
   */
  canWriteStudents(role: UserRole | null): boolean {
    return role === 'admin' || role === 'nepal_agency';
  },

  /**
   * 결석 데이터 쓰기 권한 (admin + nepal_agency)
   */
  canWriteAbsences(role: UserRole | null): boolean {
    return role === 'admin' || role === 'nepal_agency';
  },

  /**
   * 감사 로그 조회 권한 (admin only)
   */
  canViewAuditLogs(role: UserRole | null): boolean {
    return role === 'admin';
  },
} as const;

/**
 * 역할별 접근 불가 시 리다이렉트 경로 반환
 */
export function getUnauthorizedRedirectPath(role: UserRole | null): string {
  if (!role) {
    return '/login';
  }
  return getRedirectPathByRole(role);
}
