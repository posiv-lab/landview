export type AuthEmailPurpose = "verify" | "reset";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function createAuthEmail(input: {
  purpose: AuthEmailPurpose;
  nickname: string;
  actionUrl: string;
}) {
  const isVerification = input.purpose === "verify";
  const title = isVerification
    ? "땅뷰 이메일 인증을 완료해주세요"
    : "땅뷰 비밀번호를 재설정해주세요";
  const description = isVerification
    ? "아래 버튼을 눌러 회원가입을 완료할 수 있습니다."
    : "본인이 요청한 경우에만 아래 버튼을 눌러 새 비밀번호를 설정해주세요.";
  const buttonLabel = isVerification ? "이메일 인증하기" : "비밀번호 재설정";
  const expiry = isVerification ? "24시간" : "1시간";
  const nickname = escapeHtml(input.nickname);
  const actionUrl = escapeHtml(input.actionUrl);

  return {
    subject: title,
    html: `<!doctype html>
<html lang="ko">
  <body style="margin:0;background:#f7f9fa;font-family:Arial,'Apple SD Gothic Neo',sans-serif;color:#21272d;">
    <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
      <div style="border:1px solid #d8dfe6;border-radius:16px;background:#fff;padding:32px;">
        <p style="margin:0 0 8px;color:#ab350c;font-size:14px;font-weight:700;">LANDVIEW</p>
        <h1 style="margin:0 0 16px;font-size:24px;">${title}</h1>
        <p style="margin:0 0 24px;color:#515e6a;line-height:1.7;">${nickname}님, ${description}</p>
        <a href="${actionUrl}" style="display:inline-block;border-radius:10px;background:#d54300;padding:14px 20px;color:#fff;text-decoration:none;font-weight:700;">${buttonLabel}</a>
        <p style="margin:24px 0 0;color:#697683;font-size:13px;line-height:1.6;">이 링크는 ${expiry} 동안 한 번만 사용할 수 있습니다. 요청하지 않았다면 이 메일을 무시해주세요.</p>
      </div>
    </div>
  </body>
</html>`,
    text: [
      title,
      "",
      `${input.nickname}님, ${description}`,
      input.actionUrl,
      "",
      `이 링크는 ${expiry} 동안 한 번만 사용할 수 있습니다.`,
    ].join("\n"),
  };
}
