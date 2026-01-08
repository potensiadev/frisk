import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { MonthlyReport, type ReportData } from '@/lib/pdf/templates/MonthlyReport';
import React from 'react';

// GET /api/reports/monthly - Generate monthly report PDF
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user info and role
        const { data: userData } = await supabase
            .from('users')
            .select('role, university_id')
            .eq('id', user.id)
            .single<{ role: string; university_id: string | null }>();

        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Parse query params
        const searchParams = request.nextUrl.searchParams;
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
        const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
        let universityId = searchParams.get('university_id');

        // For university users, force their own university
        if (userData.role === 'university') {
            if (!userData.university_id) {
                return NextResponse.json({ error: 'University not assigned' }, { status: 400 });
            }
            universityId = userData.university_id;
        }

        // Admin and agency need to specify university
        if (!universityId) {
            return NextResponse.json({ error: 'University ID required' }, { status: 400 });
        }

        // Get university info
        const { data: universityData, error: uniError } = await supabase
            .from('universities')
            .select('id, name')
            .eq('id', universityId)
            .single();

        if (uniError || !universityData) {
            return NextResponse.json({ error: 'University not found' }, { status: 404 });
        }

        const university = universityData as { id: string; name: string };

        // Calculate date range for the month
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        // Get total students for this university
        const { count: totalStudents } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('university_id', universityId)
            .eq('status', 'enrolled')
            .is('deleted_at', null);

        // Get absences for this month
        const { data: absences } = await supabase
            .from('absences')
            .select(`
        id,
        absence_date,
        reason,
        student_id,
        students (
          id,
          name,
          student_no,
          department,
          university_id
        )
      `)
            .gte('absence_date', startDate)
            .lte('absence_date', endDate);

        // Filter absences for this university
        const universityAbsences = (absences || []).filter((a: any) =>
            a.students?.university_id === universityId
        );

        // Calculate reason breakdown
        const reasonBreakdown = {
            illness: 0,
            personal: 0,
            other: 0,
        };

        universityAbsences.forEach((a: any) => {
            if (a.reason === 'illness') reasonBreakdown.illness++;
            else if (a.reason === 'personal') reasonBreakdown.personal++;
            else reasonBreakdown.other++;
        });

        // Calculate absence count per student
        const studentAbsenceCounts: Record<string, {
            count: number;
            name: string;
            studentNo: string;
            department: string;
        }> = {};

        universityAbsences.forEach((a: any) => {
            const studentId = a.student_id;
            if (!studentAbsenceCounts[studentId]) {
                studentAbsenceCounts[studentId] = {
                    count: 0,
                    name: a.students?.name || 'Unknown',
                    studentNo: a.students?.student_no || '',
                    department: a.students?.department || '',
                };
            }
            studentAbsenceCounts[studentId].count++;
        });

        // Get risk students (3+ absences)
        const riskStudents = Object.values(studentAbsenceCounts)
            .filter(s => s.count >= 3)
            .sort((a, b) => b.count - a.count)
            .map(s => ({
                name: s.name,
                studentNo: s.studentNo,
                department: s.department,
                absenceCount: s.count,
            }));

        // Calculate absence rate
        const workingDays = 22; // Approximate working days per month
        const absenceRate = totalStudents && totalStudents > 0
            ? (universityAbsences.length / (totalStudents * workingDays)) * 100
            : 0;

        // Prepare monthly absences list
        const monthlyAbsences = universityAbsences.map((a: any) => ({
            name: a.students?.name || 'Unknown',
            studentNo: a.students?.student_no || '',
            department: a.students?.department || '',
            absenceDate: new Date(a.absence_date).toLocaleDateString('ko-KR'),
            reason: a.reason,
        }));

        // Build report data
        const reportData: ReportData = {
            universityName: university.name,
            reportMonth: String(month),
            reportYear: year,
            generatedAt: new Date().toLocaleString('ko-KR'),
            summary: {
                totalStudents: totalStudents || 0,
                absenceCount: universityAbsences.length,
                absenceRate,
            },
            reasonBreakdown,
            riskStudents,
            monthlyAbsences,
        };

        // Generate PDF
        const pdfBuffer = await renderToBuffer(
            React.createElement(MonthlyReport, { data: reportData }) as any
        );

        // Return PDF as response
        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="report_${encodeURIComponent(university.name)}_${year}_${month}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Report generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        );
    }
}
