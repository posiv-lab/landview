import { z } from "zod";

const email = z
  .string()
  .trim()
  .email("올바른 이메일 주소를 입력해주세요.")
  .max(320)
  .transform((value) => value.toLowerCase());

const password = z
  .string()
  .min(10, "비밀번호는 10자 이상이어야 합니다.")
  .max(128, "비밀번호는 128자 이하여야 합니다.")
  .regex(/[A-Za-z]/, "영문자를 포함해주세요.")
  .regex(/[0-9]/, "숫자를 포함해주세요.");

export const signupSchema = z.object({
  email,
  password,
  nickname: z
    .string()
    .trim()
    .min(2, "닉네임은 2자 이상이어야 합니다.")
    .max(30, "닉네임은 30자 이하여야 합니다."),
  terms: z.literal(true, {
    error: "이용약관 동의가 필요합니다.",
  }),
  privacy: z.literal(true, {
    error: "개인정보 처리방침 동의가 필요합니다.",
  }),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(20).max(200),
});
