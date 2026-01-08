import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/admin/users/[id] - Delete a user
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

    // 3. Prevent self-deletion
    if (user.id === id) {
      return NextResponse.json(
        { error: '자신의 계정은 삭제할 수 없습니다' },
        { status: 400 }
      );
    }

    // 4. Check if target user exists
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', id)
      .single<{ id: string; role: string }>();

    if (!targetUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 5. Prevent deleting the last admin
    if (targetUser.role === 'admin') {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      if (count !== null && count <= 1) {
        return NextResponse.json(
          { error: '마지막 관리자 계정은 삭제할 수 없습니다' },
          { status: 400 }
        );
      }
    }

    // 6. Delete user using Admin API (handles both auth.users and cascades)
    const adminClient = createAdminClient();

    // Delete from auth.users (this will cascade to public.users via trigger/FK)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(id);

    if (deleteError) {
      console.error('Failed to delete user:', deleteError);
      return NextResponse.json(
        { error: '사용자 삭제에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json(
      { error: '사용자 삭제에 실패했습니다' },
      { status: 500 }
    );
  }
}
