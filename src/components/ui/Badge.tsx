import type { ReactNode } from "react";

export type BadgeVariant = "brand" | "success" | "info" | "warning" | "neutral";

export function Badge({
  children,
  variant = "brand"
}: {
  children: ReactNode;
  variant?: BadgeVariant;
}) {
  return <span className={`badge badge--${variant}`}>{children}</span>;
}
