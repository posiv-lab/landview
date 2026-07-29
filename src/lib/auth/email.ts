import "server-only";

import { Resend } from "resend";

import { createAuthEmail, type AuthEmailPurpose } from "@/emails/authEmail";

export async function sendAuthEmail(input: {
  purpose: AuthEmailPurpose;
  email: string;
  nickname: string;
  token: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.AUTH_EMAIL_FROM?.trim();
  const appUrl = process.env.APP_URL?.trim();

  if (!apiKey || !from || !appUrl) {
    throw new Error(
      "RESEND_API_KEY, AUTH_EMAIL_FROM, APP_URL 환경변수가 필요합니다.",
    );
  }

  const pathname =
    input.purpose === "verify" ? "/verify-email" : "/reset-password";
  const actionUrl = new URL(pathname, appUrl);
  actionUrl.searchParams.set("token", input.token);
  const email = createAuthEmail({
    purpose: input.purpose,
    nickname: input.nickname,
    actionUrl: actionUrl.toString(),
  });
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  if (error) {
    throw new Error(error.message);
  }
}
