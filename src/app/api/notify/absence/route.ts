import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/client';
import { generateAbsenceEmailHtml, generateAbsenceEmailSubject } from '@/lib/email/templates/absence';
import type { AbsenceReason } from '@/types/database';

interface NotifyAbsenceRequest {
  absence_id: string;
  student_id: string;
  absence_date: string;
  reason: AbsenceReason;
}

// POST /api/notify/absence - Send absence notification email to university
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission (only admin and agency can send notifications)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    if (!userData || !['admin', 'nepal_agency'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: NotifyAbsenceRequest = await request.json();
    const { student_id, absence_date, reason } = body;

    if (!student_id || !absence_date || !reason) {
      return NextResponse.json(
        { error: '필수 항목이 누락되었습니다' },
        { status: 400 }
      );
    }

    // Get student info with university
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        name,
        student_no,
        university_id,
        universities (
          id,
          name
        )
      `)
      .eq('id', student_id)
      .is('deleted_at', null)
      .single();

    if (studentError || !studentData) {
      return NextResponse.json({ error: '학생을 찾을 수 없습니다' }, { status: 404 });
    }

    const student = studentData as {
      id: string;
      name: string;
      student_no: string;
      university_id: string;
      universities: { id: string; name: string };
    };

    // Get university contacts
    const { data: contactsData, error: contactsError } = await supabase
      .from('university_contacts')
      .select('email')
      .eq('university_id', student.university_id);

    if (contactsError) {
      console.error('Failed to fetch contacts:', contactsError);
      return NextResponse.json(
        { error: '대학교 담당자 정보를 가져오는데 실패했습니다' },
        { status: 500 }
      );
    }

    const contacts = (contactsData || []) as Array<{ email: string }>;

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: '대학교 담당자 이메일이 등록되어 있지 않습니다', sent: false },
        { status: 400 }
      );
    }

    // Generate email content
    const emailHtml = generateAbsenceEmailHtml({
      studentName: student.name,
      studentNo: student.student_no,
      universityName: student.universities.name,
      absenceDate: absence_date,
      reason: reason,
    });

    const emailSubject = generateAbsenceEmailSubject(student.name, absence_date);

    // Send email to all contacts
    const emailAddresses = contacts.map(c => c.email);
    const result = await sendEmail({
      to: emailAddresses,
      subject: emailSubject,
      html: emailHtml,
    });

    if (!result.success) {
      console.error('Email send failed:', result.error);
      return NextResponse.json(
        {
          error: '이메일 발송에 실패했습니다',
          sent: false,
          detail: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sent: true,
      messageId: result.messageId,
      recipients: emailAddresses,
    });
  } catch (error) {
    console.error('Absence notification error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
