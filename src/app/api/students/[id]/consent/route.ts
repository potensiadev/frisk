import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST - Upload consent file
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: studentId } = await context.params;
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // Check user role (only agency and admin can upload)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    if (!userData || !['admin', 'nepal_agency'].includes(userData.role)) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    // Check if student exists
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id, consent_file_url')
      .eq('id', studentId)
      .is('deleted_at', null)
      .single<{ id: string; consent_file_url: string | null }>();

    if (studentError || !studentData) {
      return NextResponse.json({ error: '학생을 찾을 수 없습니다' }, { status: 404 });
    }

    const student = studentData;

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'PDF, JPEG, PNG, WEBP 파일만 업로드 가능합니다' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 5MB 이하여야 합니다' },
        { status: 400 }
      );
    }

    // Delete old file if exists
    if (student.consent_file_url) {
      const oldPath = student.consent_file_url.split('/consent-files/')[1];
      if (oldPath) {
        await supabase.storage.from('consent-files').remove([oldPath]);
      }
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'pdf';
    const fileName = `${studentId}/${Date.now()}.${ext}`;

    // Convert File to ArrayBuffer then to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from('consent-files')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: '파일 업로드에 실패했습니다' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('consent-files')
      .getPublicUrl(fileName);

    // Update student record
    const { error: updateError } = await (supabase
      .from('students') as any)
      .update({ consent_file_url: urlData.publicUrl })
      .eq('id', studentId);

    if (updateError) {
      console.error('Update error:', updateError);
      // Try to delete uploaded file on failure
      await supabase.storage.from('consent-files').remove([fileName]);
      return NextResponse.json(
        { error: '학생 정보 업데이트에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '파일이 업로드되었습니다',
      url: urlData.publicUrl,
    });
  } catch (error) {
    console.error('Consent upload error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// DELETE - Remove consent file
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: studentId } = await context.params;
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // Check user role (only agency and admin can delete)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    if (!userData || !['admin', 'nepal_agency'].includes(userData.role)) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    // Get student with consent file
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id, consent_file_url')
      .eq('id', studentId)
      .is('deleted_at', null)
      .single<{ id: string; consent_file_url: string | null }>();

    if (studentError || !studentData) {
      return NextResponse.json({ error: '학생을 찾을 수 없습니다' }, { status: 404 });
    }

    const student = studentData;

    if (!student.consent_file_url) {
      return NextResponse.json({ error: '삭제할 파일이 없습니다' }, { status: 400 });
    }

    // Delete file from storage
    const filePath = student.consent_file_url.split('/consent-files/')[1];
    if (filePath) {
      const { error: deleteError } = await supabase.storage
        .from('consent-files')
        .remove([filePath]);

      if (deleteError) {
        console.error('Delete error:', deleteError);
      }
    }

    // Update student record
    const { error: updateError } = await (supabase
      .from('students') as any)
      .update({ consent_file_url: null })
      .eq('id', studentId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: '학생 정보 업데이트에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: '파일이 삭제되었습니다' });
  } catch (error) {
    console.error('Consent delete error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
