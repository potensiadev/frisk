import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateEmail } from '@/lib/validation';
import type { StudentProgram } from '@/types/database';

interface CreateStudentRequest {
  university_id: string;
  student_no: string;
  name: string;
  department: string;
  program: StudentProgram;
  address: string;
  phone: string;
  email?: string | null;
}

// GET /api/students - List students
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role, university_id')
      .eq('id', user.id)
      .single<{ role: string; university_id: string | null }>();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from('students')
      .select(`
        *,
        universities (
          id,
          name
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // University users can only see their own students
    if (userData.role === 'university' && userData.university_id) {
      query = query.eq('university_id', userData.university_id);
    }

    // Parse query params for filtering
    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get('university_id');
    const program = searchParams.get('program');
    const status = searchParams.get('status');

    if (universityId) {
      query = query.eq('university_id', universityId);
    }
    if (program) {
      query = query.eq('program', program);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: students, error } = await query;

    if (error) {
      console.error('Failed to fetch students:', error);
      return NextResponse.json({ error: '학생 목록 조회에 실패했습니다' }, { status: 500 });
    }

    // 캐싱 헤더 추가 (60초 캐시, 120초 stale-while-revalidate)
    const response = NextResponse.json({ students });
    response.headers.set(
      'Cache-Control',
      'private, s-maxage=60, stale-while-revalidate=120'
    );
    return response;
  } catch (error) {
    console.error('Failed to fetch students:', error);
    return NextResponse.json({ error: '학생 목록 조회에 실패했습니다' }, { status: 500 });
  }
}

// POST /api/students - Create student
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create students
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    if (!userData || !['admin', 'nepal_agency'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: CreateStudentRequest = await request.json();
    const { university_id, student_no, name, department, program, address, phone, email } = body;

    // Validation
    if (!university_id || !student_no || !name || !department || !program || !address || !phone) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요' },
        { status: 400 }
      );
    }

    // Validate program
    const validPrograms: StudentProgram[] = ['language', 'bachelor', 'master', 'phd'];
    if (!validPrograms.includes(program)) {
      return NextResponse.json({ error: '유효하지 않은 프로그램입니다' }, { status: 400 });
    }

    // Validate email if provided
    if (email) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return NextResponse.json({ error: emailValidation.error }, { status: 400 });
      }
    }

    // Check if university exists
    const { data: university } = await supabase
      .from('universities')
      .select('id')
      .eq('id', university_id)
      .single();

    if (!university) {
      return NextResponse.json({ error: '대학교를 찾을 수 없습니다' }, { status: 400 });
    }

    // Check for duplicate student (university + program + student_no)
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('university_id', university_id)
      .eq('program', program)
      .eq('student_no', student_no)
      .is('deleted_at', null)
      .single();

    if (existingStudent) {
      return NextResponse.json(
        { error: '이미 등록된 학번입니다 (같은 대학교, 같은 프로그램)' },
        { status: 400 }
      );
    }

    // Create student
    const { data: student, error: createError } = await (supabase
      .from('students') as any)
      .insert({
        university_id,
        student_no: student_no.trim(),
        name: name.trim(),
        department: department.trim(),
        program,
        address: address.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        status: 'enrolled',
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create student:', createError);
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: '이미 등록된 학번입니다' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: '학생 등록에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error) {
    console.error('Failed to create student:', error);
    return NextResponse.json({ error: '학생 등록에 실패했습니다' }, { status: 500 });
  }
}
