import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  createContactEmail,
  inquiryTypeLabels,
  type ContactSource,
  type InquiryType
} from "@/emails/contactEmail";

export const runtime = "nodejs";

const MAX_LENGTHS = {
  name: 80,
  contact: 120,
  region: 120,
  inquiry: 2000
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRequiredString(
  body: Record<string, unknown>,
  field: keyof typeof MAX_LENGTHS
) {
  const value = body[field];

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue && trimmedValue.length <= MAX_LENGTHS[field] ? trimmedValue : null;
}

function getInquiryType(value: unknown): InquiryType | null {
  return typeof value === "string" && value in inquiryTypeLabels
    ? (value as InquiryType)
    : null;
}

function getSource(value: unknown): ContactSource {
  return value === "modal" ? "modal" : "inline";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  const name = getRequiredString(body, "name");
  const contact = getRequiredString(body, "contact");
  const region = getRequiredString(body, "region");
  const inquiry = getRequiredString(body, "inquiry");
  const inquiryType = getInquiryType(body.inquiryType);

  if (!name || !contact || !region || !inquiry || !inquiryType) {
    return NextResponse.json(
      { message: "필수 항목을 올바르게 입력해주세요." },
      { status: 400 }
    );
  }

  if (body.privacy !== true) {
    return NextResponse.json(
      { message: "개인정보 수집 및 이용 동의가 필요합니다." },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const recipients = process.env.EMAIL_TO?.split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (!apiKey || !recipients?.length) {
    console.error("RESEND_API_KEY 또는 EMAIL_TO 환경변수가 설정되지 않았습니다.");
    return NextResponse.json(
      { message: "이메일 전송 설정을 확인해주세요." },
      { status: 500 }
    );
  }

  const email = createContactEmail({
    name,
    contact,
    inquiryType,
    region,
    inquiry,
    marketing: body.marketing === true,
    source: getSource(body.source)
  });

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Landview 문의 <onboarding@resend.dev>",
      to: recipients,
      replyTo: isEmail(contact) ? contact : undefined,
      subject: email.subject,
      html: email.html,
      text: email.text
    });

    if (error) {
      console.error("Resend 이메일 전송 실패:", error);
      return NextResponse.json(
        { message: "이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 502 }
      );
    }

    return NextResponse.json({ message: "문의가 정상적으로 접수되었습니다." });
  } catch (error) {
    console.error("문의 이메일 처리 중 오류가 발생했습니다:", error);
    return NextResponse.json(
      { message: "이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
