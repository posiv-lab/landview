export const inquiryTypeLabels = {
  service: "서비스 이용 문의",
  data: "토지 데이터 문의",
  feature: "기능 및 출시 문의",
  partnership: "제휴 및 업무 문의",
  other: "기타 문의"
} as const;

export type InquiryType = keyof typeof inquiryTypeLabels;
export type ContactSource = "inline" | "modal";

export type ContactEmailData = {
  name: string;
  contact: string;
  inquiryType: InquiryType;
  region: string;
  inquiry: string;
  marketing: boolean;
  source: ContactSource;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function createContactEmail(data: ContactEmailData) {
  const name = escapeHtml(data.name);
  const contact = escapeHtml(data.contact);
  const region = escapeHtml(data.region);
  const inquiry = escapeHtml(data.inquiry);
  const inquiryType = inquiryTypeLabels[data.inquiryType];
  const marketing = data.marketing ? "동의" : "미동의";
  const source = data.source === "modal" ? "빠른 문의 창" : "페이지 하단 문의 폼";
  const submittedAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Seoul"
  }).format(new Date());

  return {
    subject: `[Landview 문의] ${inquiryType} - ${data.name.replace(/[\r\n]+/g, " ")}`,
    html: `
      <!doctype html>
      <html lang="ko">
        <body style="margin:0;background:#f6f8f7;font-family:Arial,'Apple SD Gothic Neo',sans-serif;color:#1f2937;">
          <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
            <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;">
              <p style="margin:0 0 8px;color:#15803d;font-size:14px;font-weight:700;">LANDVIEW</p>
              <h1 style="margin:0 0 24px;font-size:24px;line-height:1.4;">새로운 문의가 접수되었습니다.</h1>
              <table style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.6;">
                <tbody>
                  <tr><th style="width:120px;padding:12px;text-align:left;background:#f9fafb;border:1px solid #e5e7eb;">문의 유형</th><td style="padding:12px;border:1px solid #e5e7eb;">${inquiryType}</td></tr>
                  <tr><th style="padding:12px;text-align:left;background:#f9fafb;border:1px solid #e5e7eb;">이름</th><td style="padding:12px;border:1px solid #e5e7eb;">${name}</td></tr>
                  <tr><th style="padding:12px;text-align:left;background:#f9fafb;border:1px solid #e5e7eb;">연락처</th><td style="padding:12px;border:1px solid #e5e7eb;">${contact}</td></tr>
                  <tr><th style="padding:12px;text-align:left;background:#f9fafb;border:1px solid #e5e7eb;">관심 지역</th><td style="padding:12px;border:1px solid #e5e7eb;">${region}</td></tr>
                  <tr><th style="padding:12px;text-align:left;background:#f9fafb;border:1px solid #e5e7eb;">마케팅 수신</th><td style="padding:12px;border:1px solid #e5e7eb;">${marketing}</td></tr>
                  <tr><th style="padding:12px;text-align:left;background:#f9fafb;border:1px solid #e5e7eb;">접수 경로</th><td style="padding:12px;border:1px solid #e5e7eb;">${source}</td></tr>
                  <tr><th style="padding:12px;text-align:left;background:#f9fafb;border:1px solid #e5e7eb;">접수 시각</th><td style="padding:12px;border:1px solid #e5e7eb;">${submittedAt}</td></tr>
                </tbody>
              </table>
              <div style="margin-top:24px;">
                <h2 style="margin:0 0 8px;font-size:16px;">문의 내용</h2>
                <div style="padding:16px;border-radius:8px;background:#f9fafb;line-height:1.7;white-space:pre-wrap;">${inquiry}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: [
      "[Landview] 새로운 문의가 접수되었습니다.",
      `문의 유형: ${inquiryType}`,
      `이름: ${data.name}`,
      `연락처: ${data.contact}`,
      `관심 지역: ${data.region}`,
      `마케팅 수신: ${marketing}`,
      `접수 경로: ${source}`,
      `접수 시각: ${submittedAt}`,
      "",
      "문의 내용",
      data.inquiry
    ].join("\n")
  };
}
