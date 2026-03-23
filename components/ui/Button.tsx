import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}

export default function Button({
  children,
  fullWidth,
  size = "md",
  variant = "primary",
  loading,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const sizeClass = {
    sm: "py-2 px-4 text-[13px]",
    md: "py-2.5 px-5 text-[14px]",
    lg: "py-3.5 px-6 text-[15px]",
  }[size];

  const variantClass = {
    primary: "bg-ap-blue text-white hover:bg-ap-blue-h",
    secondary: "bg-ap-bg text-ap-primary border border-ap-border hover:border-ap-blue/40",
    ghost: "text-ap-blue hover:opacity-70",
  }[variant];

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        "rounded-full font-semibold transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2",
        sizeClass,
        variantClass,
        fullWidth ? "w-full" : "",
        className ?? "",
      ].join(" ")}
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          กรุณารอสักครู่…
        </>
      ) : children}
    </button>
  );
}
