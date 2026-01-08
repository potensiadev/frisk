import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters, getIP } from '@/lib/rate-limit';
import { getUserOrThrow, requireRole, requireUniversityScope, AuthError } from '@/lib/auth-checks';
import { logUpload, logDelete } from '@/lib/audit';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/absences/[id]/files - Upload evidence file
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: absenceId } = await context.params;

    // Rate limit check
    const ip = getIP(request);
    const limitResult = rateLimiters.sensitive(ip);
    if (!limitResult.success) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }

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

    // Check if absence exists
    const { data: absence, error: absenceError } = await supabase
      .from('absences')
      .select('id, student_id')
      .eq('id', absenceId)
      .single();

    if (absenceError || !absence) {
      return NextResponse.json({ error: '결석 기록을 찾을 수 없습니다' }, { status: 404 });
    }

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
        { error: '파일 크기는 10MB 이하여야 합니다' },
        { status: 400 }
      );
    }

    // Generate unique filename (UUID for privacy)
    const ext = file.name.split('.').pop() || 'pdf';
    const fileName = `${absenceId}/${crypto.randomUUID()}.${ext}`;

    // Convert File to ArrayBuffer then to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('absence-files')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: '파일 업로드에 실패했습니다' },
        { status: 500 }
      );
    }

    // Create absence_file record
    const { data: absenceFile, error: insertError } = await (supabase
      .from('absence_files') as any)
      .insert({
        absence_id: absenceId,
        file_path: fileName,
        original_name: file.name,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      // Try to delete uploaded file on failure
      await supabase.storage.from('absence-files').remove([fileName]);
      return NextResponse.json(
        { error: '파일 정보 저장에 실패했습니다' },
        { status: 500 }
      );
    }

    // Audit Log
    await logUpload(supabase, user.id, 'absence_file', fileName, absenceId, ip);

    return NextResponse.json({
      message: '파일이 업로드되었습니다',
      file: absenceFile,
    });
  } catch (error) {
    console.error('Absence file upload error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// GET /api/absences/[id]/files - List evidence files
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: absenceId } = await context.params;
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

    // Check ownership if university user
    if (user.role === 'university') {
      const { data: absence } = await supabase
        .from('absences')
        .select('student_id, students!inner(university_id)')
        .eq('id', absenceId)
        .single();

      const studentUnivId = (absence as any)?.students?.university_id;

      try {
        requireUniversityScope(user, studentUnivId);
      } catch (error) {
        if (error instanceof AuthError) {
          return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
      }
    }

    // Get files
    const { data: filesData, error } = await supabase
      .from('absence_files')
      .select('*')
      .eq('absence_id', absenceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch files:', error);
      return NextResponse.json({ error: '파일 목록 조회에 실패했습니다' }, { status: 500 });
    }

    const files = (filesData || []) as Array<{
      id: string;
      absence_id: string;
      file_path: string;
      original_name: string;
      created_at: string;
    }>;

    // Generate signed URLs for each file
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const { data: urlData } = await supabase.storage
          .from('absence-files')
          .createSignedUrl(file.file_path, 3600); // 1 hour expiry

        return {
          ...file,
          signed_url: urlData?.signedUrl || null,
        };
      })
    );

    return NextResponse.json({ files: filesWithUrls });
  } catch (error) {
    console.error('Failed to fetch absence files:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// DELETE /api/absences/[id]/files?file_id=xxx - Delete specific file
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: absenceId } = await context.params;
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

    // Get file_id from query params
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('file_id');

    if (!fileId) {
      return NextResponse.json({ error: '파일 ID가 필요합니다' }, { status: 400 });
    }

    // Get file info
    const { data: fileData, error: fileError } = await supabase
      .from('absence_files')
      .select('id, file_path')
      .eq('id', fileId)
      .eq('absence_id', absenceId)
      .single<{ id: string; file_path: string }>();

    if (fileError || !fileData) {
      return NextResponse.json({ error: '파일을 찾을 수 없습니다' }, { status: 404 });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('absence-files')
      .remove([fileData.file_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }

    // Delete record
    const { error: deleteError } = await supabase
      .from('absence_files')
      .delete()
      .eq('id', fileId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: '파일 삭제에 실패했습니다' }, { status: 500 });
    }

    // Audit Log
    await logDelete(supabase, user.id, 'file', fileId, getIP(request));

    return NextResponse.json({ message: '파일이 삭제되었습니다' });
  } catch (error) {
    console.error('Failed to delete absence file:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
