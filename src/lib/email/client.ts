import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { env, serverEnv } from '@/lib/env';

// Initialize Resend client lazily to avoid build-time errors
let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

// Supabase admin client for logging (서버 사이드에서만 사용)
function getSupabaseAdmin() {
  return createClient(env.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  // 로깅을 위한 추가 정보
  emailType?: string;
  recipientName?: string;
  universityId?: string;
  universityName?: string;
  metadata?: Record<string, unknown>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export type EmailLogStatus = 'success' | 'failed' | 'pending';

interface EmailLog {
  recipient_email: string;
  recipient_name?: string;
  university_id?: string;
  university_name?: string;
  subject: string;
  email_type: string;
  status: EmailLogStatus;
  message_id?: string;
  error_message?: string;
  sent_at?: string;
  failed_at?: string;
  metadata?: Record<string, unknown>;
}

const DEFAULT_FROM = 'FRISK 시스템 <noreply@frisk.app>';

async function logEmailSend(log: EmailLog): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('email_logs').insert(log);
    if (error) {
      console.error('Failed to log email send:', error);
    }
  } catch (err) {
    console.error('Error logging email:', err);
  }
}

export async function sendEmail({
  to,
  subject,
  html,
  from = DEFAULT_FROM,
  emailType = 'general',
  recipientName,
  universityId,
  universityName,
  metadata,
}: SendEmailParams): Promise<EmailResult> {
  const resend = getResend();
  const recipients = Array.isArray(to) ? to : [to];

  // Skip if no API key (development mode)
  if (!resend) {
    console.log('Resend API key not configured, skipping email');
    console.log('Would send email to:', to);
    console.log('Subject:', subject);

    // 개발 모드에서도 로그 기록 (status: pending)
    for (const recipient of recipients) {
      await logEmailSend({
        recipient_email: recipient,
        recipient_name: recipientName,
        university_id: universityId,
        university_name: universityName,
        subject,
        email_type: emailType,
        status: 'pending',
        metadata: { ...metadata, dev_mode: true },
      });
    }

    return { success: true, messageId: 'dev-mode-skipped' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: recipients,
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);

      // 실패 로그 기록
      for (const recipient of recipients) {
        await logEmailSend({
          recipient_email: recipient,
          recipient_name: recipientName,
          university_id: universityId,
          university_name: universityName,
          subject,
          email_type: emailType,
          status: 'failed',
          error_message: error.message,
          failed_at: new Date().toISOString(),
          metadata,
        });
      }

      return { success: false, error: error.message };
    }

    // 성공 로그 기록
    for (const recipient of recipients) {
      await logEmailSend({
        recipient_email: recipient,
        recipient_name: recipientName,
        university_id: universityId,
        university_name: universityName,
        subject,
        email_type: emailType,
        status: 'success',
        message_id: data?.id,
        sent_at: new Date().toISOString(),
        metadata,
      });
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // 예외 발생 시 실패 로그 기록
    for (const recipient of recipients) {
      await logEmailSend({
        recipient_email: recipient,
        recipient_name: recipientName,
        university_id: universityId,
        university_name: universityName,
        subject,
        email_type: emailType,
        status: 'failed',
        error_message: errorMessage,
        failed_at: new Date().toISOString(),
        metadata,
      });
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// 결석 알림 이메일 전송 헬퍼 함수
export async function sendAbsenceNotificationEmail({
  to,
  studentName,
  universityId,
  universityName,
  absenceDate,
  absenceReason,
}: {
  to: string | string[];
  studentName: string;
  universityId: string;
  universityName: string;
  absenceDate: string;
  absenceReason?: string;
}): Promise<EmailResult> {
  const subject = `[결석 알림] ${studentName} 학생 결석 안내`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">결석 알림</h2>
      <p>안녕하세요,</p>
      <p>다음 학생의 결석이 등록되었습니다:</p>
      <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; background: #f5f5f5; width: 30%;">학생명</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${studentName}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; background: #f5f5f5;">대학교</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${universityName}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; background: #f5f5f5;">결석일</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${absenceDate}</td>
        </tr>
        ${absenceReason ? `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; background: #f5f5f5;">사유</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${absenceReason}</td>
        </tr>
        ` : ''}
      </table>
      <p>자세한 내용은 FRISK 시스템에서 확인해주세요.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        이 메일은 FRISK 시스템에서 자동 발송되었습니다.
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    emailType: 'absence_notification',
    recipientName: universityName,
    universityId,
    universityName,
    metadata: {
      studentName,
      absenceDate,
      absenceReason,
    },
  });
}

// 분기 리포트 이메일 전송 헬퍼 함수
export async function sendQuarterlyReportEmail({
  to,
  universityId,
  universityName,
  quarter,
  year,
  reportSummary,
}: {
  to: string | string[];
  universityId: string;
  universityName: string;
  quarter: number;
  year: number;
  reportSummary: string;
}): Promise<EmailResult> {
  const subject = `[분기 리포트] ${year}년 ${quarter}분기 유학생 현황 보고서`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">${year}년 ${quarter}분기 유학생 현황 보고서</h2>
      <p>안녕하세요, ${universityName} 담당자님</p>
      <p>${year}년 ${quarter}분기 유학생 현황 보고서를 안내드립니다.</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        ${reportSummary}
      </div>
      <p>자세한 내용은 FRISK 시스템에서 확인해주세요.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        이 메일은 FRISK 시스템에서 자동 발송되었습니다.
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    emailType: 'quarterly_report',
    recipientName: universityName,
    universityId,
    universityName,
    metadata: {
      quarter,
      year,
    },
  });
}
