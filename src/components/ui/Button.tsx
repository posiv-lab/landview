import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "subtle" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  ...buttonProps
}: ButtonProps) {
  const classes = [
    "button",
    `button--${variant}`,
    size !== "md" ? `button--${size}` : "",
    fullWidth ? "button--full" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} type={type} {...buttonProps}>
      {children}
    </button>
  );
}
