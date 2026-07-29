"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
      setPending(false);
    }
  }

  return (
    <Button disabled={pending} onClick={logout} size="sm" variant="ghost">
      {pending ? "처리 중" : "로그아웃"}
    </Button>
  );
}
