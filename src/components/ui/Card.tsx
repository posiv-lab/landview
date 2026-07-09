import type { ReactNode } from "react";

type CardTone = "default" | "tint" | "subtle";

export function Card({
  children,
  tone = "default",
  className = ""
}: {
  children: ReactNode;
  tone?: CardTone;
  className?: string;
}) {
  const classes = ["card", tone !== "default" ? `card--${tone}` : "", className]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
