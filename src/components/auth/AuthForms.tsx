"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

type ApiMessage = { message?: string };

async function submitJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as ApiMessage;

  if (!response.ok) {
    throw new Error(data.message ?? "요청을 처리하지 못했습니다.");
  }

  return data;
}

function FormMessage({
  message,
  success = false,
}: {
  message: string;
  success?: boolean;
}) {
  return (
    <p
      className={`form-message ${success ? "form-message--success" : "form-message--error"}`}
      role={success ? "status" : "alert"}
    >
      {message}
    </p>
  );
}

export function SignupForm() {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const passwordConfirm = String(form.get("passwordConfirm") ?? "");

    if (password !== passwordConfirm) {
      setMessage("비밀번호 확인이 일치하지 않습니다.");
      setPending(false);
      return;
    }

    try {
      const data = await submitJson("/api/auth/signup", {
        email: form.get("email"),
        password,
        nickname: form.get("nickname"),
        terms: form.get("terms") === "on",
        privacy: form.get("privacy") === "on",
      });
      setSuccess(true);
      setMessage(data.message ?? "인증 메일을 보냈습니다.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "회원가입에 실패했습니다.",
      );
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="auth-result">
        <h2>메일함을 확인해주세요</h2>
        <FormMessage message={message} success />
        <p>인증 링크를 누른 후 로그인할 수 있습니다.</p>
        <Button href="/login" fullWidth>
          로그인 화면으로
        </Button>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        이메일
        <input autoComplete="email" name="email" required type="email" />
      </label>
      <label>
        닉네임
        <input
          autoComplete="nickname"
          maxLength={30}
          minLength={2}
          name="nickname"
          required
        />
      </label>
      <label>
        비밀번호
        <input
          autoComplete="new-password"
          maxLength={128}
          minLength={10}
          name="password"
          required
          type="password"
        />
        <small>10자 이상, 영문자와 숫자를 포함해주세요.</small>
      </label>
      <label>
        비밀번호 확인
        <input
          autoComplete="new-password"
          maxLength={128}
          minLength={10}
          name="passwordConfirm"
          required
          type="password"
        />
      </label>
      <label className="auth-check">
        <input name="terms" required type="checkbox" />
        <span>
          <Link href="/terms" target="_blank">
            이용약관
          </Link>
          에 동의합니다.
        </span>
      </label>
      <label className="auth-check">
        <input name="privacy" required type="checkbox" />
        <span>
          <Link href="/privacy" target="_blank">
            개인정보 처리방침
          </Link>
          에 동의합니다.
        </span>
      </label>
      {message ? <FormMessage message={message} /> : null}
      <Button disabled={pending} fullWidth size="lg" type="submit">
        {pending ? "처리 중..." : "회원가입"}
      </Button>
      <p className="auth-form__footer">
        이미 계정이 있나요? <Link href="/login">로그인</Link>
      </p>
    </form>
  );
}

export function LoginForm({ nextPath = "/account" }: { nextPath?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setPending(true);
    const form = new FormData(event.currentTarget);

    try {
      await submitJson("/api/auth/login", {
        email: form.get("email"),
        password: form.get("password"),
      });
      const destination =
        nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/account";
      router.push(destination);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "로그인에 실패했습니다.",
      );
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        이메일
        <input autoComplete="email" name="email" required type="email" />
      </label>
      <label>
        비밀번호
        <input
          autoComplete="current-password"
          name="password"
          required
          type="password"
        />
      </label>
      <div className="auth-form__utility">
        <Link href="/forgot-password">비밀번호를 잊으셨나요?</Link>
      </div>
      {message ? <FormMessage message={message} /> : null}
      <Button disabled={pending} fullWidth size="lg" type="submit">
        {pending ? "로그인 중..." : "로그인"}
      </Button>
      <p className="auth-form__footer">
        계정이 없나요? <Link href="/signup">회원가입</Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const data = await submitJson("/api/auth/forgot-password", {
        email: form.get("email"),
      });
      setSuccess(true);
      setMessage(data.message ?? "메일함을 확인해주세요.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "요청을 처리하지 못했습니다.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        가입한 이메일
        <input autoComplete="email" name="email" required type="email" />
      </label>
      {message ? <FormMessage message={message} success={success} /> : null}
      <Button disabled={pending} fullWidth size="lg" type="submit">
        {pending ? "전송 중..." : "재설정 메일 받기"}
      </Button>
      <p className="auth-form__footer">
        <Link href="/login">로그인으로 돌아가기</Link>
      </p>
    </form>
  );
}

export function VerifyEmailForm({ token }: { token: string }) {
  const [message, setMessage] = useState(
    token
      ? "이메일 인증을 확인하고 있습니다."
      : "인증 토큰이 없습니다. 이메일의 링크를 다시 확인해주세요.",
  );
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    submitJson("/api/auth/verify-email", { token })
      .then((data) => {
        setSuccess(true);
        setMessage(data.message ?? "이메일 인증이 완료되었습니다.");
      })
      .catch((error: unknown) => {
        setMessage(
          error instanceof Error ? error.message : "이메일 인증에 실패했습니다.",
        );
      });
  }, [token]);

  return (
    <div className="auth-result">
      <h2>{success ? "인증 완료" : "이메일 인증"}</h2>
      <FormMessage message={message} success={success} />
      {success ? (
        <Button href="/login" fullWidth>
          로그인하기
        </Button>
      ) : null}
    </div>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const passwordConfirm = String(form.get("passwordConfirm") ?? "");

    if (password !== passwordConfirm) {
      setMessage("비밀번호 확인이 일치하지 않습니다.");
      setPending(false);
      return;
    }

    try {
      const data = await submitJson("/api/auth/reset-password", {
        token,
        password,
      });
      setSuccess(true);
      setMessage(data.message ?? "비밀번호가 변경되었습니다.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "비밀번호를 변경하지 못했습니다.",
      );
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-result">
        <FormMessage message="재설정 토큰이 없습니다. 이메일 링크를 다시 확인해주세요." />
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-result">
        <h2>변경 완료</h2>
        <FormMessage message={message} success />
        <Button href="/login" fullWidth>
          새 비밀번호로 로그인
        </Button>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        새 비밀번호
        <input
          autoComplete="new-password"
          maxLength={128}
          minLength={10}
          name="password"
          required
          type="password"
        />
      </label>
      <label>
        새 비밀번호 확인
        <input
          autoComplete="new-password"
          maxLength={128}
          minLength={10}
          name="passwordConfirm"
          required
          type="password"
        />
      </label>
      {message ? <FormMessage message={message} /> : null}
      <Button disabled={pending} fullWidth size="lg" type="submit">
        {pending ? "변경 중..." : "비밀번호 변경"}
      </Button>
    </form>
  );
}
