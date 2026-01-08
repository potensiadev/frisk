import type { AbsenceReason } from '@/types/database';

const reasonLabels: Record<AbsenceReason, string> = {
  illness: '질병',
  personal: '개인 사정',
  other: '기타',
};

interface AbsenceEmailParams {
  studentName: string;
  studentNo: string;
  universityName: string;
  absenceDate: string;
  reason: AbsenceReason;
}

export function generateAbsenceEmailHtml({
  studentName,
  studentNo,
  universityName,
  absenceDate,
  reason,
}: AbsenceEmailParams): string {
  const formattedDate = new Date(absenceDate).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>학생 결석 알림</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #dc2626; padding: 24px 32px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">
                학생 결석 알림
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                안녕하세요,<br><br>
                아래 학생의 결석 사항을 알려드립니다.
              </p>

              <!-- Student Info Card -->
              <table role="presentation" style="width: 100%; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">학생명</span><br>
                          <strong style="color: #111827; font-size: 16px;">${studentName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">학번</span><br>
                          <strong style="color: #111827; font-size: 16px; font-family: monospace;">${studentNo}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">결석일</span><br>
                          <strong style="color: #111827; font-size: 16px;">${formattedDate}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">사유</span><br>
                          <strong style="color: #111827; font-size: 16px;">${reasonLabels[reason]}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                * 본 메일은 학생 출결 관리 목적으로 자동 발송됩니다.<br>
                * 추가 문의 사항이 있으시면 유학원으로 연락 부탁드립니다.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                FRISK - 외국인 유학생 리스크 관리 시스템<br>
                이 메일은 자동으로 발송되었습니다.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generateAbsenceEmailSubject(
  studentName: string,
  absenceDate: string
): string {
  const formattedDate = new Date(absenceDate).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  });
  return `[결석 알림] ${studentName} - ${formattedDate}`;
}
