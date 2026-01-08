import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/admin/universities/[id] - Delete a university
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 1. Verify current user is admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check if current user is admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    if (currentUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Check if university exists
    const { data: university } = await supabase
      .from('universities')
      .select('id, name')
      .eq('id', id)
      .single();

    if (!university) {
      return NextResponse.json(
        { error: '대학교를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 4. Check if any users are associated with this university
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('university_id', id);

    if (userCount && userCount > 0) {
      return NextResponse.json(
        { error: `이 대학교에 소속된 사용자가 ${userCount}명 있습니다. 먼저 사용자의 소속을 변경하거나 삭제해주세요.` },
        { status: 400 }
      );
    }

    // 5. Check if any students are associated with this university
    const { count: studentCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('university_id', id)
      .is('deleted_at', null);

    if (studentCount && studentCount > 0) {
      return NextResponse.json(
        { error: `이 대학교에 등록된 학생이 ${studentCount}명 있습니다. 먼저 학생 정보를 삭제해주세요.` },
        { status: 400 }
      );
    }

    // 6. Delete university contacts first (if not cascaded)
    await supabase
      .from('university_contacts')
      .delete()
      .eq('university_id', id);

    // 7. Delete university
    const { error: deleteError } = await supabase
      .from('universities')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete university:', deleteError);
      return NextResponse.json(
        { error: '대학교 삭제에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete university:', error);
    return NextResponse.json(
      { error: '대학교 삭제에 실패했습니다' },
      { status: 500 }
    );
  }
}
