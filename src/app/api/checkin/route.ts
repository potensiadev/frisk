import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserOrThrow, requireRole, AuthError } from '@/lib/auth-checks';
import { logUpdate } from '@/lib/audit';
import { getIP } from '@/lib/rate-limit';

interface CheckinRequest {
    student_id: string;
    phone: string;
    address: string;
    email: string | null;
    phone_verified: boolean;
    address_verified: boolean;
    email_verified: boolean;
    phone_changed: boolean;
    address_changed: boolean;
    email_changed: boolean;
    existing_checkin_id: string | null;
}

// POST /api/checkin - Create or update quarterly check-in
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check auth using unified helper
        let user;
        try {
            user = await getUserOrThrow(supabase);
            requireRole(user, ['admin', 'nepal_agency']);
        } catch (error) {
            if (error instanceof AuthError) {
                return NextResponse.json({ error: error.message }, { status: error.statusCode });
            }
            throw error;
        }

        const body: CheckinRequest = await request.json();
        const {
            student_id,
            phone,
            address,
            email,
            phone_verified,
            address_verified,
            email_verified,
            phone_changed,
            address_changed,
            email_changed,
            existing_checkin_id,
        } = body;

        if (!student_id) {
            return NextResponse.json({ error: '학생 ID가 필요합니다' }, { status: 400 });
        }

        // Get current student data for change logging
        const { data: currentStudent, error: studentError } = await supabase
            .from('students')
            .select('phone, address, email')
            .eq('id', student_id)
            .is('deleted_at', null)
            .single<{ phone: string; address: string; email: string | null }>();

        if (studentError || !currentStudent) {
            return NextResponse.json({ error: '학생을 찾을 수 없습니다' }, { status: 404 });
        }

        const today = new Date().toISOString().split('T')[0];

        // Log contact changes
        if (phone_changed && phone !== currentStudent.phone) {
            await (supabase.from('contact_change_logs') as any).insert({
                student_id,
                field_name: 'phone',
                old_value: currentStudent.phone,
                new_value: phone,
                changed_by: user.id,
                check_in_date: today,
            });
        }

        if (address_changed && address !== currentStudent.address) {
            await (supabase.from('contact_change_logs') as any).insert({
                student_id,
                field_name: 'address',
                old_value: currentStudent.address,
                new_value: address,
                changed_by: user.id,
                check_in_date: today,
            });
        }

        if (email_changed && email !== currentStudent.email) {
            await (supabase.from('contact_change_logs') as any).insert({
                student_id,
                field_name: 'email',
                old_value: currentStudent.email,
                new_value: email,
                changed_by: user.id,
                check_in_date: today,
            });
        }

        // Update student contact info if changed
        if (phone_changed || address_changed || email_changed) {
            const updateData: Record<string, any> = {
                updated_at: new Date().toISOString(),
            };

            if (phone_changed) updateData.phone = phone;
            if (address_changed) updateData.address = address;
            if (email_changed) updateData.email = email || null;

            const { error: updateError } = await (supabase
                .from('students') as any)
                .update(updateData)
                .eq('id', student_id);

            if (updateError) {
                console.error('Student update error:', updateError);
                return NextResponse.json(
                    { error: '학생 정보 업데이트에 실패했습니다' },
                    { status: 500 }
                );
            }
        }

        // Create or update check-in record
        if (existing_checkin_id) {
            // Update existing check-in
            const { error: checkinError } = await (supabase
                .from('quarterly_checkins') as any)
                .update({
                    check_in_date: today,
                    phone_verified,
                    address_verified,
                    email_verified,
                })
                .eq('id', existing_checkin_id);

            // Log update
            await logUpdate(supabase, user.id, 'checkin', existing_checkin_id, {
                check_in_date: today,
                phone_verified,
                address_verified,
                email_verified
            }, getIP(request));

            if (checkinError) {
                console.error('Checkin update error:', checkinError);
                return NextResponse.json(
                    { error: '점검 기록 업데이트에 실패했습니다' },
                    { status: 500 }
                );
            }
        } else {
            // Create new check-in
            const { error: checkinError } = await (supabase
                .from('quarterly_checkins') as any)
                .insert({
                    student_id,
                    check_in_date: today,
                    phone_verified,
                    address_verified,
                    email_verified,
                    checked_by: user.id,
                });

            if (checkinError) {
                console.error('Checkin insert error:', checkinError);
                return NextResponse.json(
                    { error: '점검 기록 생성에 실패했습니다' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: '점검이 완료되었습니다',
        });
    } catch (error) {
        console.error('Checkin error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다' },
            { status: 500 }
        );
    }
}

// GET /api/checkin - Get check-in summary
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check auth using unified helper
        let user;
        try {
            user = await getUserOrThrow(supabase);
        } catch (error) {
            if (error instanceof AuthError) {
                return NextResponse.json({ error: error.message }, { status: error.statusCode });
            }
            throw error;
        }

        const searchParams = request.nextUrl.searchParams;
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
        const quarter = parseInt(searchParams.get('quarter') || String(Math.floor(new Date().getMonth() / 3) + 1));

        // Calculate quarter date range
        const quarterStartMonth = (quarter - 1) * 3;
        const quarterStartDate = new Date(year, quarterStartMonth, 1).toISOString().split('T')[0];
        const quarterEndDate = new Date(year, quarterStartMonth + 3, 0).toISOString().split('T')[0];

        // Get check-in stats
        // Use !inner join to filter by student's university if needed
        let checkinsQuery = supabase
            .from('quarterly_checkins')
            .select('id, student_id, check_in_date, phone_verified, address_verified, email_verified, students!inner(university_id)')
            .gte('check_in_date', quarterStartDate)
            .lte('check_in_date', quarterEndDate);

        if (user.role === 'university') {
            if (!user.university_id) {
                return NextResponse.json({ error: 'University ID not found for user' }, { status: 400 });
            }
            checkinsQuery = checkinsQuery.eq('students.university_id', user.university_id);
        }

        const { data: checkins, error } = await checkinsQuery;

        if (error) {
            console.error('Checkin fetch error:', error);
            return NextResponse.json({ error: '점검 기록 조회에 실패했습니다' }, { status: 500 });
        }

        // Get total enrolled students
        let studentsQuery = supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'enrolled')
            .is('deleted_at', null);

        if (user.role === 'university' && user.university_id) {
            studentsQuery = studentsQuery.eq('university_id', user.university_id);
        }

        const { count: totalStudents } = await studentsQuery;

        return NextResponse.json({
            year,
            quarter,
            total_students: totalStudents || 0,
            checked_students: checkins?.length || 0,
            unchecked_students: (totalStudents || 0) - (checkins?.length || 0),
            completion_rate: totalStudents ? Math.round((checkins?.length || 0) / totalStudents * 100) : 0,
        });
    } catch (error) {
        console.error('Checkin GET error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다' },
            { status: 500 }
        );
    }
}
