import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validatePassword, validateEmail } from '@/lib/validation';
import type { UserRole } from '@/types/database';

interface CreateUserRequest {
  email: string;
  password: string;
  role: UserRole;
  university_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify current user is admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (currentUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Parse request body
    const body: CreateUserRequest = await request.json();
    const { email, password, role, university_id } = body;

    // 3. Validate input
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: '이메일, 비밀번호, 역할은 필수입니다' },
        { status: 400 }
      );
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // Validate password complexity
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles: UserRole[] = ['admin', 'nepal_agency', 'university'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: '유효하지 않은 역할입니다' },
        { status: 400 }
      );
    }

    if (role === 'university' && !university_id) {
      return NextResponse.json(
        { error: '대학교 역할은 소속 대학교를 선택해야 합니다' },
        { status: 400 }
      );
    }

    // 4. Create user with Admin API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminClient = createAdminClient() as any;

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: '이미 등록된 이메일입니다' },
          { status: 400 }
        );
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // 5. Create user profile in public.users
    const { error: profileError } = await adminClient
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        role,
        university_id: role === 'university' ? university_id : null,
      });

    if (profileError) {
      // Rollback: delete auth user
      await adminClient.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        role,
      },
    });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { error: '사용자 생성에 실패했습니다' },
      { status: 500 }
    );
  }
}
