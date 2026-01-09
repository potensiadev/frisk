import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AbsenceReason } from '@/types/database';

interface CreateAbsenceRequest {
  student_id: string;
  absence_date: string;
  reason: AbsenceReason;
  note?: string;
  send_notification?: boolean;
}

// GET /api/absences - List absences with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role and university
    const { data: userData } = await supabase
      .from('users')
      .select('role, university_id')
      .eq('id', user.id)
      .single<{ role: string; university_id: string | null }>();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const universityId = searchParams.get('university_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const reason = searchParams.get('reason');

    // Build query
    let query = supabase
      .from('absences')
      .select(`
        *,
        students (
          id,
          name,
          student_no,
          university_id,
          universities (
            id,
            name
          )
        )
      `)
      .order('absence_date', { ascending: false });

    // Apply filters
    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (startDate) {
      query = query.gte('absence_date', startDate);
    }

    if (endDate) {
      query = query.lte('absence_date', endDate);
    }

    if (reason) {
      query = query.eq('reason', reason);
    }

    // University users can only see their students
    if (userData.role === 'university' && userData.university_id) {
      const { data: studentIdsData } = await supabase
        .from('students')
        .select('id')
        .eq('university_id', userData.university_id)
        .is('deleted_at', null);

      const studentIds = (studentIdsData || []) as Array<{ id: string }>;

      if (studentIds.length > 0) {
        query = query.in('student_id', studentIds.map(s => s.id));
      } else {
        return NextResponse.json({ absences: [] });
      }
    } else if (universityId) {
      // Filter by university for admin/agency
      const { data: studentIdsData } = await supabase
        .from('students')
        .select('id')
        .eq('university_id', universityId)
        .is('deleted_at', null);

      const studentIds = (studentIdsData || []) as Array<{ id: string }>;

      if (studentIds.length > 0) {
        query = query.in('student_id', studentIds.map(s => s.id));
      } else {
        return NextResponse.json({ absences: [] });
      }
    }

    const { data: absences, error } = await query;

    if (error) {
      console.error('Failed to fetch absences:', error);
      return NextResponse.json({ error: '결석 목록 조회에 실패했습니다' }, { status: 500 });
    }

    // 캐싱 헤더 추가 (60초 캐시, 120초 stale-while-revalidate)
    const response = NextResponse.json({ absences: absences || [] });
    response.headers.set(
      'Cache-Control',
      'private, s-maxage=60, stale-while-revalidate=120'
    );
    return response;
  } catch (error) {
    console.error('Failed to fetch absences:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// POST /api/absences - Create absence
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission (only admin and agency can create)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    if (!userData || !['admin', 'nepal_agency'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: CreateAbsenceRequest = await request.json();
    const { student_id, absence_date, reason, note, send_notification } = body;

    // Validation
    if (!student_id || !absence_date || !reason) {
      return NextResponse.json(
        { error: '필수 항목을 입력해주세요' },
        { status: 400 }
      );
    }

    // Validate reason
    const validReasons: AbsenceReason[] = ['illness', 'personal', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: '유효하지 않은 결석 사유입니다' },
        { status: 400 }
      );
    }

    // Check if student exists
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id, name, student_no, university_id')
      .eq('id', student_id)
      .is('deleted_at', null)
      .single<{ id: string; name: string; student_no: string; university_id: string }>();

    if (studentError || !studentData) {
      return NextResponse.json({ error: '학생을 찾을 수 없습니다' }, { status: 404 });
    }

    // Create absence
    const { data: absence, error: createError } = await (supabase
      .from('absences') as any)
      .insert({
        student_id,
        absence_date,
        reason,
        note: note || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create absence:', createError);
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: '해당 날짜에 이미 결석이 등록되어 있습니다' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: '결석 등록에 실패했습니다' }, { status: 500 });
    }

    // Send notification email if requested
    let notificationSent = false;
    if (send_notification) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notify/absence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            absence_id: absence.id,
            student_id,
            absence_date,
            reason,
          }),
        });
        notificationSent = response.ok;
      } catch (err) {
        console.error('Failed to send notification:', err);
      }
    }

    return NextResponse.json({
      success: true,
      absence,
      notification_sent: notificationSent,
    });
  } catch (error) {
    console.error('Failed to create absence:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
