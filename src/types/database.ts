// Supabase 데이터베이스 타입 정의

export type UserRole = 'admin' | 'nepal_agency' | 'university';

export type StudentProgram = 'language' | 'bachelor' | 'master' | 'phd';

export type StudentStatus = 'enrolled' | 'graduated' | 'completed' | 'withdrawn' | 'expelled';

export type AbsenceReason = 'illness' | 'personal' | 'other';

export type AuditActionType = 'login' | 'download' | 'logout';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  university_id: string | null;
  created_at: string;
}

export interface University {
  id: string;
  name: string;
  created_at: string;
}

export interface UniversityContact {
  id: string;
  university_id: string;
  email: string;
  is_primary: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  university_id: string;
  student_no: string;
  name: string;
  department: string;
  program: StudentProgram;
  address: string;
  phone: string;
  email: string | null;
  status: StudentStatus;
  consent_file_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Absence {
  id: string;
  student_id: string;
  absence_date: string;
  reason: AbsenceReason;
  note: string | null;
  created_by: string;
  created_at: string;
}

export interface AbsenceFile {
  id: string;
  absence_id: string;
  file_path: string;
  original_name: string;
  created_at: string;
}

export interface QuarterlyCheckin {
  id: string;
  student_id: string;
  check_in_date: string;
  phone_verified: boolean;
  address_verified: boolean;
  email_verified: boolean;
  checked_by: string;
  created_at: string;
}

export interface ContactChangeLog {
  id: string;
  student_id: string;
  field_name: 'phone' | 'address' | 'email';
  old_value: string | null;
  new_value: string;
  changed_by: string;
  check_in_date: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action_type: AuditActionType;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

// Database 타입 (Supabase 클라이언트용)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at'> & { id: string };
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      universities: {
        Row: University;
        Insert: Omit<University, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<University, 'id' | 'created_at'>>;
      };
      university_contacts: {
        Row: UniversityContact;
        Insert: Omit<UniversityContact, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<UniversityContact, 'id' | 'created_at'>>;
      };
      students: {
        Row: Student;
        Insert: Omit<Student, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Student, 'id' | 'created_at' | 'updated_at'>>;
      };
      absences: {
        Row: Absence;
        Insert: Omit<Absence, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Absence, 'id' | 'created_at'>>;
      };
      absence_files: {
        Row: AbsenceFile;
        Insert: Omit<AbsenceFile, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<AbsenceFile, 'id' | 'created_at'>>;
      };
      quarterly_checkins: {
        Row: QuarterlyCheckin;
        Insert: Omit<QuarterlyCheckin, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<QuarterlyCheckin, 'id' | 'created_at'>>;
      };
      contact_change_logs: {
        Row: ContactChangeLog;
        Insert: Omit<ContactChangeLog, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<ContactChangeLog, 'id' | 'created_at'>>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<AuditLog, 'id' | 'created_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
      get_user_university_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      student_program: StudentProgram;
      student_status: StudentStatus;
      absence_reason: AbsenceReason;
      audit_action_type: AuditActionType;
    };
  };
}
