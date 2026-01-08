import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/absences/[id] - Get absence detail
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get absence with student info
    const { data: absenceData, error } = await supabase
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
        ),
        absence_files (
          id,
          file_path,
          original_name,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error || !absenceData) {
      return NextResponse.json({ error: '결석 기록을 찾을 수 없습니다' }, { status: 404 });
    }

    const absence = absenceData as {
      students: { university_id: string };
      [key: string]: unknown;
    };

    // Check permission for university users
    const { data: userData } = await supabase
      .from('users')
      .select('role, university_id')
      .eq('id', user.id)
      .single<{ role: string; university_id: string | null }>();

    if (userData?.role === 'university') {
      if (userData.university_id !== absence.students?.university_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({ absence: absenceData });
  } catch (error) {
    console.error('Failed to fetch absence:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// DELETE /api/absences/[id] - Delete absence
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission (only admin and agency can delete)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    if (!userData || !['admin', 'nepal_agency'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if absence exists
    const { data: absence, error: absenceError } = await supabase
      .from('absences')
      .select('id')
      .eq('id', id)
      .single();

    if (absenceError || !absence) {
      return NextResponse.json({ error: '결석 기록을 찾을 수 없습니다' }, { status: 404 });
    }

    // Get associated files to delete from storage
    const { data: filesData } = await supabase
      .from('absence_files')
      .select('file_path')
      .eq('absence_id', id);

    const files = (filesData || []) as Array<{ file_path: string }>;

    // Delete files from storage
    if (files.length > 0) {
      const filePaths = files.map(f => f.file_path);
      await supabase.storage.from('absence-files').remove(filePaths);
    }

    // Delete absence (cascade will delete absence_files records)
    const { error: deleteError } = await supabase
      .from('absences')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete absence:', deleteError);
      return NextResponse.json({ error: '결석 삭제에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete absence:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
