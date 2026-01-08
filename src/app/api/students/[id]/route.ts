import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateEmail } from '@/lib/validation';
import type { StudentProgram, StudentStatus } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface UpdateStudentRequest {
  student_no?: string;
  name?: string;
  department?: string;
  program?: StudentProgram;
  address?: string;
  phone?: string;
  email?: string | null;
  status?: StudentStatus;
}

// GET /api/students/[id] - Get student detail
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: studentData, error } = await supabase
      .from('students')
      .select(`
        *,
        universities (
          id,
          name
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !studentData) {
      return NextResponse.json({ error: '학생을 찾을 수 없습니다' }, { status: 404 });
    }

    const student = studentData as { university_id: string; [key: string]: unknown };

    // Check permission for university users
    const { data: userData } = await supabase
      .from('users')
      .select('role, university_id')
      .eq('id', user.id)
      .single<{ role: string; university_id: string | null }>();

    if (userData?.role === 'university' && userData.university_id !== student.university_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ student: studentData });
  } catch (error) {
    console.error('Failed to fetch student:', error);
    return NextResponse.json({ error: '학생 정보 조회에 실패했습니다' }, { status: 500 });
  }
}

// PUT /api/students/[id] - Update student
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    if (!userData || !['admin', 'nepal_agency'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if student exists
    const { data: existingStudentData } = await supabase
      .from('students')
      .select('id, phone, address, email')
      .eq('id', id)
      .is('deleted_at', null)
      .single<{ id: string; phone: string; address: string; email: string | null }>();

    if (!existingStudentData) {
      return NextResponse.json({ error: '학생을 찾을 수 없습니다' }, { status: 404 });
    }

    const existingStudent = existingStudentData;

    const body: UpdateStudentRequest = await request.json();
    const { student_no, name, department, program, address, phone, email, status } = body;

    // Validate email if provided
    if (email) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return NextResponse.json({ error: emailValidation.error }, { status: 400 });
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses: StudentStatus[] = ['enrolled', 'graduated', 'completed', 'withdrawn', 'expelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: '유효하지 않은 상태입니다' }, { status: 400 });
      }
    }

    // Validate program if provided
    if (program) {
      const validPrograms: StudentProgram[] = ['language', 'bachelor', 'master', 'phd'];
      if (!validPrograms.includes(program)) {
        return NextResponse.json({ error: '유효하지 않은 프로그램입니다' }, { status: 400 });
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (student_no !== undefined) updateData.student_no = student_no.trim();
    if (name !== undefined) updateData.name = name.trim();
    if (department !== undefined) updateData.department = department.trim();
    if (program !== undefined) updateData.program = program;
    if (address !== undefined) updateData.address = address.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (status !== undefined) updateData.status = status;

    // Log contact changes
    const contactChanges: Array<{ field: string; old: string | null; new: string | null }> = [];
    if (phone !== undefined && phone !== existingStudent.phone) {
      contactChanges.push({ field: 'phone', old: existingStudent.phone, new: phone });
    }
    if (address !== undefined && address !== existingStudent.address) {
      contactChanges.push({ field: 'address', old: existingStudent.address, new: address });
    }
    if (email !== undefined && email !== existingStudent.email) {
      contactChanges.push({ field: 'email', old: existingStudent.email, new: email || null });
    }

    // Update student
    const { data: student, error: updateError } = await (supabase
      .from('students') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update student:', updateError);
      if (updateError.code === '23505') {
        return NextResponse.json({ error: '이미 등록된 학번입니다' }, { status: 400 });
      }
      return NextResponse.json({ error: '학생 정보 수정에 실패했습니다' }, { status: 500 });
    }

    // Insert contact change logs
    if (contactChanges.length > 0) {
      const logs = contactChanges.map((change) => ({
        student_id: id,
        field_name: change.field,
        old_value: change.old,
        new_value: change.new || '',
        changed_by: user.id,
      }));

      await (supabase.from('contact_change_logs') as any).insert(logs);
    }

    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.error('Failed to update student:', error);
    return NextResponse.json({ error: '학생 정보 수정에 실패했습니다' }, { status: 500 });
  }
}

// DELETE /api/students/[id] - Soft delete student
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    if (!userData || !['admin', 'nepal_agency'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if student exists
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (!student) {
      return NextResponse.json({ error: '학생을 찾을 수 없습니다' }, { status: 404 });
    }

    // Soft delete
    const { error: deleteError } = await (supabase
      .from('students') as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete student:', deleteError);
      return NextResponse.json({ error: '학생 삭제에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete student:', error);
    return NextResponse.json({ error: '학생 삭제에 실패했습니다' }, { status: 500 });
  }
}
