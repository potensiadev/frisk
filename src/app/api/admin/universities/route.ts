import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface CreateUniversityRequest {
  name: string;
}

// POST /api/admin/universities - Create a new university
export async function POST(request: NextRequest) {
  try {
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

    // 3. Parse request body
    const body: CreateUniversityRequest = await request.json();
    const { name } = body;

    // 4. Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: '대학교 이름을 입력해주세요' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: '대학교 이름은 100자 이내로 입력해주세요' },
        { status: 400 }
      );
    }

    // 5. Check if university already exists
    const { data: existingUniversity } = await supabase
      .from('universities')
      .select('id')
      .eq('name', trimmedName)
      .single();

    if (existingUniversity) {
      return NextResponse.json(
        { error: '이미 등록된 대학교입니다' },
        { status: 400 }
      );
    }

    // 6. Create university
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newUniversity, error: createError } = await (supabase as any)
      .from('universities')
      .insert({ name: trimmedName })
      .select('id, name')
      .single();

    if (createError) {
      console.error('Failed to create university:', createError);
      return NextResponse.json(
        { error: '대학교 등록에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      university: newUniversity,
    });
  } catch (error) {
    console.error('Failed to create university:', error);
    return NextResponse.json(
      { error: '대학교 등록에 실패했습니다' },
      { status: 500 }
    );
  }
}

// GET /api/admin/universities - Get all universities
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: universities, error } = await supabase
      .from('universities')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to fetch universities:', error);
      return NextResponse.json(
        { error: '대학교 목록 조회에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ universities });
  } catch (error) {
    console.error('Failed to fetch universities:', error);
    return NextResponse.json(
      { error: '대학교 목록 조회에 실패했습니다' },
      { status: 500 }
    );
  }
}
